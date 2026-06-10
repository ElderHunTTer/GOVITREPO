import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import { buildExtractedFieldResult } from "@govit/core";
import type {
  AutomatedLabelClassification,
  DemoLabel,
  ExtractedSubmissionFields,
  VerificationFieldResult,
  VerificationStatus
} from "@govit/types";
import { env } from "./env";

const KNOWN_FIELD_NAMES = [
  "brandName",
  "classType",
  "netContents",
  "alcoholByVolume",
  "governmentWarning",
  "producer"
] as const;

type KnownFieldName = (typeof KNOWN_FIELD_NAMES)[number];

type VisionAnalysis = {
  provider: string;
  model: string;
  classification: AutomatedLabelClassification;
  classificationConfidence: number;
  reviewConfidence: number;
  aiSummary: string;
  rejectionReason: string | null;
  extractedFields: ExtractedSubmissionFields;
  extractionConfidences: Record<string, number>;
};

type DemoLabelRow = DemoLabel & {
  submittedFields: Record<string, string>;
};

type OcrLine = {
  text: string;
  confidence: number;
  box: number[] | null;
};

type OcrPayload = {
  pages: Array<{
    input_path: string;
    lines: OcrLine[];
  }>;
};

export type AutomatedPublicIntakeResult = VisionAnalysis & {
  candidateLabelIds: string[];
  matchedDemoLabelId: string | null;
  matchedDemoLabel: DemoLabelRow | null;
  labelTitle: string;
  fieldResults: VerificationFieldResult[];
  summaryStatus: VerificationStatus;
};

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function scoreDemoLabelMatch(
  demoLabel: Pick<DemoLabel, "title" | "producer" | "category" | "slug">,
  query: string
) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const title = normalizeSearchText(demoLabel.title);
  const producer = normalizeSearchText(demoLabel.producer);
  const category = normalizeSearchText(demoLabel.category);
  const slug = normalizeSearchText(demoLabel.slug.replace(/-/g, " "));

  if (title === normalizedQuery || slug === normalizedQuery) {
    return 100;
  }

  let score = 0;

  if (title.includes(normalizedQuery)) score += 60;
  if (producer.includes(normalizedQuery)) score += 30;
  if (category.includes(normalizedQuery)) score += 25;
  if (slug.includes(normalizedQuery)) score += 40;

  return score;
}

function clampConfidence(value: number, fallback = 0) {
  if (Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(value, 1));
}

function summarizeStatuses(results: Pick<VerificationFieldResult, "status">[]) {
  if (results.some((result) => result.status === "fail")) {
    return "fail" satisfies VerificationStatus;
  }

  if (results.some((result) => result.status === "review")) {
    return "review" satisfies VerificationStatus;
  }

  return "pass" satisfies VerificationStatus;
}

function fallbackVisionAnalysis(message?: string): VisionAnalysis {
  return {
    provider: "paddleocr-fallback",
    model: "heuristic",
    classification: "uncertain",
    classificationConfidence: 0.2,
    reviewConfidence: 0.2,
    aiSummary:
      message ||
      "Local OCR is not available, so this case was routed to human review with no extracted fields.",
    rejectionReason: null,
    extractedFields: {},
    extractionConfidences: {}
  };
}

function averageConfidence(lines: OcrLine[]) {
  if (lines.length === 0) {
    return 0;
  }

  return (
    lines.reduce((sum, line) => sum + clampConfidence(line.confidence, 0), 0) /
    lines.length
  );
}

function extractBestMatch(lines: OcrLine[], pattern: RegExp) {
  for (const line of lines) {
    const match = line.text.match(pattern);

    if (match?.[1]) {
      return {
        value: match[1].trim(),
        confidence: clampConfidence(line.confidence, 0.5)
      };
    }
  }

  return null;
}

function inferClassType(lines: OcrLine[]) {
  const categories = [
    "straight bourbon whiskey",
    "bourbon whiskey",
    "straight rye whiskey",
    "rye whiskey",
    "whiskey",
    "whisky",
    "vodka",
    "gin",
    "tequila",
    "rum",
    "brandy",
    "liqueur",
    "wine",
    "beer",
    "ipa"
  ];

  for (const line of lines) {
    const normalized = normalizeSearchText(line.text);
    const category = categories.find((item) => normalized.includes(item));

    if (category) {
      return {
        value: line.text.trim(),
        confidence: clampConfidence(line.confidence, 0.6)
      };
    }
  }

  return null;
}

function inferBrandName(lines: OcrLine[], classType?: string) {
  const ignoredPatterns = [
    /government warning/i,
    /alc\/vol/i,
    /\bml\b/i,
    /\bproof\b/i,
    /bottled by/i,
    /produced by/i,
    /imported by/i,
    /contents/i
  ];

  for (const line of lines) {
    const text = line.text.trim();

    if (text.length < 4 || text.length > 48) {
      continue;
    }

    if (classType && text.toLowerCase() === classType.toLowerCase()) {
      continue;
    }

    if (ignoredPatterns.some((pattern) => pattern.test(text))) {
      continue;
    }

    if (!/[a-z]/i.test(text)) {
      continue;
    }

    return {
      value: text,
      confidence: clampConfidence(line.confidence, 0.55)
    };
  }

  return null;
}

function inferGovernmentWarning(lines: OcrLine[]) {
  const warningIndex = lines.findIndex((line) => /government warning/i.test(line.text));

  if (warningIndex === -1) {
    return null;
  }

  const warningLines = lines
    .slice(warningIndex, Math.min(warningIndex + 4, lines.length))
    .map((line) => line.text.trim())
    .filter(Boolean);

  return {
    value: warningLines.join(" "),
    confidence: clampConfidence(averageConfidence(lines.slice(warningIndex, warningIndex + warningLines.length)), 0.6)
  };
}

function inferProducer(lines: OcrLine[]) {
  const producerMatch = extractBestMatch(
    lines,
    /(?:bottled by|produced by|distilled by|imported by)\s*(.+)$/i
  );

  if (producerMatch) {
    return producerMatch;
  }

  return null;
}

function classifyLabel(allText: string, averageScore: number): {
  classification: AutomatedLabelClassification;
  classificationConfidence: number;
  reviewConfidence: number;
  rejectionReason: string | null;
} {
  const normalized = normalizeSearchText(allText);
  const ttbSignals = [
    "government warning",
    "alc/vol",
    "alcohol by volume",
    "distilled",
    "bottled by",
    "750 ml",
    "whiskey",
    "bourbon",
    "vodka",
    "gin",
    "tequila",
    "rum",
    "wine",
    "beer"
  ];

  const signalCount = ttbSignals.filter((signal) => normalized.includes(signal)).length;

  if (!normalized || normalized.length < 8 || averageScore < 0.18) {
    return {
      classification: "not_ttb_label",
      classificationConfidence: 0.82,
      reviewConfidence: 0.18,
      rejectionReason: "The image did not produce enough recognizable label text to be treated as a likely TTB alcohol label."
    };
  }

  if (signalCount >= 2) {
    return {
      classification: "ttb_label",
      classificationConfidence: clampConfidence(0.72 + signalCount * 0.05, 0.72),
      reviewConfidence: clampConfidence(0.7 + averageScore * 0.2, 0.7),
      rejectionReason: null
    };
  }

  return {
    classification: "uncertain",
    classificationConfidence: clampConfidence(0.45 + averageScore * 0.15, 0.45),
    reviewConfidence: clampConfidence(0.45 + averageScore * 0.2, 0.45),
    rejectionReason: null
  };
}

async function runPaddleOcr(imagePath: string): Promise<OcrPayload> {
  const bridgePath = path.resolve(process.cwd(), env.paddleOcrBridgePath);

  return new Promise((resolve, reject) => {
    const child = spawn(env.paddleOcrPythonPath, [bridgePath, imagePath], {
      cwd: process.cwd()
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `PaddleOCR bridge failed with code ${code}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout) as OcrPayload);
      } catch (error) {
        reject(
          new Error(
            `Could not parse PaddleOCR bridge output: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          )
        );
      }
    });
  });
}

async function analyzeLabelImage(args: {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}): Promise<VisionAnalysis> {
  const tempDir = await fs.mkdtemp(path.join(tmpdir(), "govit-ocr-"));
  const tempPath = path.join(tempDir, `${randomUUID()}${path.extname(args.fileName) || ".png"}`);

  try {
    await fs.writeFile(tempPath, args.buffer);
    const payload = await runPaddleOcr(tempPath);
    const lines = payload.pages.flatMap((page) => page.lines).filter((line) => line.text.trim());

    if (lines.length === 0) {
      return fallbackVisionAnalysis(
        "PaddleOCR did not detect readable text, so the case was routed to human review."
      );
    }

    const averageScore = averageConfidence(lines);
    const allText = lines.map((line) => line.text.trim()).join("\n");
    const classType = inferClassType(lines);
    const producer = inferProducer(lines);
    const governmentWarning = inferGovernmentWarning(lines);
    const alcoholByVolume = extractBestMatch(
      lines,
      /((?:\d{1,2}(?:\.\d+)?\s*%?\s*(?:alc\/vol|alcohol by volume|abv)))\b/i
    );
    const netContents = extractBestMatch(
      lines,
      /((?:\d+(?:\.\d+)?\s*(?:ml|mL|l|L|fl\.?\s*oz|oz)))\b/i
    );
    const brandName = inferBrandName(lines, classType?.value);
    const classification = classifyLabel(allText, averageScore);

    const extractedFields: ExtractedSubmissionFields = {};
    const extractionConfidences: Record<string, number> = {};

    const fieldEntries: Array<[KnownFieldName, { value: string; confidence: number } | null]> = [
      ["brandName", brandName],
      ["classType", classType],
      ["netContents", netContents],
      ["alcoholByVolume", alcoholByVolume],
      ["governmentWarning", governmentWarning],
      ["producer", producer]
    ];

    for (const [fieldName, field] of fieldEntries) {
      if (!field?.value) {
        continue;
      }

      extractedFields[fieldName] = field.value;
      extractionConfidences[fieldName] = clampConfidence(field.confidence, 0.5);
    }

    return {
      provider: "paddleocr",
      model: "PaddleOCR 3.x general pipeline",
      classification: classification.classification,
      classificationConfidence: classification.classificationConfidence,
      reviewConfidence: classification.reviewConfidence,
      aiSummary:
        classification.classification === "ttb_label"
          ? "PaddleOCR detected multiple alcohol-label signals and extracted reviewable field candidates."
          : classification.classification === "not_ttb_label"
            ? classification.rejectionReason ||
              "PaddleOCR did not detect text consistent with a likely TTB alcohol label."
            : "PaddleOCR extracted some text, but the label type still needs human confirmation.",
      rejectionReason: classification.rejectionReason,
      extractedFields,
      extractionConfidences
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function buildLabelTitle(
  extractedFields: ExtractedSubmissionFields,
  matchedDemoLabel: DemoLabelRow | null,
  caseReference: string
) {
  return (
    extractedFields.brandName ||
    matchedDemoLabel?.title ||
    extractedFields.classType ||
    `Public report ${caseReference}`
  );
}

function findCandidateLabels(
  labels: DemoLabelRow[],
  extractedFields: ExtractedSubmissionFields
) {
  const searchText = [
    extractedFields.brandName,
    extractedFields.classType,
    extractedFields.producer
  ]
    .filter(Boolean)
    .join(" ");

  const scored = labels
    .map((label) => ({
      label,
      score: scoreDemoLabelMatch(label, searchText)
    }))
    .sort((left, right) => right.score - left.score);

  const candidateLabelIds = scored
    .filter((entry) => entry.score >= 20)
    .slice(0, 5)
    .map((entry) => entry.label.id);

  const matchedDemoLabel =
    scored.find((entry) => entry.score >= 70)?.label ?? null;

  return {
    candidateLabelIds,
    matchedDemoLabelId: matchedDemoLabel?.id ?? null,
    matchedDemoLabel
  };
}

function buildFieldResults(args: {
  analysis: VisionAnalysis;
  matchedDemoLabel: DemoLabelRow | null;
}): VerificationFieldResult[] {
  const results: VerificationFieldResult[] = [
    buildExtractedFieldResult({
      fieldName: "documentType",
      expectedValue: "TTB alcohol label",
      detectedValue:
        args.analysis.classification === "ttb_label"
          ? "TTB alcohol label"
          : args.analysis.classification === "not_ttb_label"
            ? "Not a TTB alcohol label"
            : "Uncertain label type",
      confidence: args.analysis.classificationConfidence
    })
  ];

  for (const fieldName of KNOWN_FIELD_NAMES) {
    const expectedValue = args.matchedDemoLabel?.submittedFields?.[fieldName] ?? "";
    const detectedValue = args.analysis.extractedFields[fieldName] ?? "";
    const confidence = args.analysis.extractionConfidences[fieldName] ?? 0;

    if (!expectedValue && !detectedValue) {
      continue;
    }

    results.push(
      buildExtractedFieldResult({
        fieldName,
        expectedValue,
        detectedValue,
        confidence,
        unmatchedReference: !args.matchedDemoLabel
      })
    );
  }

  return results;
}

export async function runAutomatedPublicIntake(args: {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  caseReference: string;
  labels: DemoLabelRow[];
}): Promise<AutomatedPublicIntakeResult> {
  let analysis: VisionAnalysis;

  try {
    analysis = await analyzeLabelImage(args);
  } catch (error) {
    analysis = fallbackVisionAnalysis(
      error instanceof Error
        ? `PaddleOCR could not process this image, so the case was routed to human review. ${error.message}`
        : "PaddleOCR could not process this image, so the case was routed to human review."
    );
  }

  const candidateMatch = findCandidateLabels(args.labels, analysis.extractedFields);
  const fieldResults = buildFieldResults({
    analysis,
    matchedDemoLabel: candidateMatch.matchedDemoLabel
  });

  return {
    ...analysis,
    ...candidateMatch,
    labelTitle: buildLabelTitle(
      analysis.extractedFields,
      candidateMatch.matchedDemoLabel,
      args.caseReference
    ),
    fieldResults,
    summaryStatus: summarizeStatuses(fieldResults)
  };
}
