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

function intakeLog(
  level: "info" | "warn" | "error",
  message: string,
  meta?: Record<string, unknown>
) {
  if (!env.intakeDebugEnabled && level === "info") {
    return;
  }

  const prefix = `[intake:${level}] ${message}`;

  if (level === "error") {
    console.error(prefix, meta ?? {});
    return;
  }

  if (level === "warn") {
    console.warn(prefix, meta ?? {});
    return;
  }

  console.info(prefix, meta ?? {});
}

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
    provider: "manual-review-fallback",
    model: "none",
    classification: "uncertain",
    classificationConfidence: 0.2,
    reviewConfidence: 0.2,
    aiSummary:
      message ||
      "Automated analysis is unavailable, so this case was routed to human review with no extracted fields.",
    rejectionReason: null,
    extractedFields: {},
    extractionConfidences: {}
  };
}

function cleanExtractedFields(
  fields: Partial<Record<KnownFieldName, unknown>>
): ExtractedSubmissionFields {
  return Object.fromEntries(
    KNOWN_FIELD_NAMES.map((fieldName) => {
      const rawValue = fields[fieldName];
      return [fieldName, typeof rawValue === "string" ? rawValue.trim() : ""];
    }).filter(([, value]) => value)
  );
}

function cleanFieldConfidences(
  values: Partial<Record<KnownFieldName, unknown>>
): Record<string, number> {
  const entries: Array<[string, number]> = KNOWN_FIELD_NAMES.map((fieldName) => {
    const rawValue = values[fieldName];
    const numericValue =
      typeof rawValue === "number"
        ? rawValue
        : typeof rawValue === "string"
          ? Number(rawValue)
          : 0;

    return [fieldName, clampConfidence(numericValue, 0)];
  });

  return Object.fromEntries(entries.filter(([, value]) => value > 0));
}

function stripCodeFence(value: string) {
  const trimmed = value.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
}

async function analyzeWithGemini(args: {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}): Promise<VisionAnalysis> {
  if (!env.geminiApiKey) {
    intakeLog("warn", "Gemini analysis skipped because API key is missing.", {
      hasGeminiApiKey: false,
      model: env.geminiVisionModel
    });
    throw new Error("Gemini API key is not configured.");
  }

  intakeLog("info", "Starting Gemini image analysis.", {
    fileName: args.fileName,
    mimeType: args.mimeType,
    sizeBytes: args.buffer.byteLength,
    model: env.geminiVisionModel
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiVisionModel}:generateContent?key=${env.geminiApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  'Analyze this uploaded image for an alcohol label review workflow. Return JSON only with this exact structure: {"classification":"ttb_label|not_ttb_label|uncertain","classificationConfidence":0-1,"reviewConfidence":0-1,"aiSummary":"brief summary","rejectionReason":"brief reason or null","extractedFields":{"brandName":"","classType":"","netContents":"","alcoholByVolume":"","governmentWarning":"","producer":""},"extractionConfidences":{"brandName":0-1,"classType":0-1,"netContents":0-1,"alcoholByVolume":0-1,"governmentWarning":0-1,"producer":0-1}}. Be conservative and avoid guessing. File name: ' +
                  args.fileName
              },
              {
                inline_data: {
                  mime_type: args.mimeType,
                  data: args.buffer.toString("base64")
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    intakeLog("error", "Gemini API returned a non-OK response.", {
      status: response.status,
      statusText: response.statusText,
      bodySnippet: errorText.slice(0, 800)
    });
    throw new Error(`Gemini API failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
      finishReason?: string;
    }>;
  };

  const text =
    payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";

  intakeLog("info", "Gemini response received.", {
    candidateCount: payload.candidates?.length ?? 0,
    finishReason: payload.candidates?.[0]?.finishReason ?? null,
    responseTextSnippet: text.slice(0, 400)
  });

  const parsed = JSON.parse(stripCodeFence(text)) as {
    classification?: AutomatedLabelClassification;
    classificationConfidence?: number;
    reviewConfidence?: number;
    aiSummary?: string;
    rejectionReason?: string | null;
    extractedFields?: Partial<Record<KnownFieldName, unknown>>;
    extractionConfidences?: Partial<Record<KnownFieldName, unknown>>;
  };

  intakeLog("info", "Gemini response parsed into intake fields.", {
    classification: parsed.classification,
    extractedFieldKeys: Object.keys(parsed.extractedFields ?? {}),
    confidenceKeys: Object.keys(parsed.extractionConfidences ?? {})
  });

  return {
    provider: "gemini",
    model: env.geminiVisionModel,
    classification:
      parsed.classification === "ttb_label" ||
      parsed.classification === "not_ttb_label" ||
      parsed.classification === "uncertain"
        ? parsed.classification
        : "uncertain",
    classificationConfidence: clampConfidence(parsed.classificationConfidence ?? 0.2, 0.2),
    reviewConfidence: clampConfidence(parsed.reviewConfidence ?? 0.2, 0.2),
    aiSummary: parsed.aiSummary?.trim() || "No Gemini summary was returned.",
    rejectionReason: parsed.rejectionReason?.trim() || null,
    extractedFields: cleanExtractedFields(parsed.extractedFields ?? {}),
    extractionConfidences: cleanFieldConfidences(parsed.extractionConfidences ?? {})
  };
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
    analysis = await analyzeWithGemini(args);
    intakeLog("info", "Automated intake analysis completed.", {
      provider: analysis.provider,
      model: analysis.model,
      classification: analysis.classification,
      extractedFieldKeys: Object.keys(analysis.extractedFields)
    });
  } catch (error) {
    intakeLog("error", "Automated intake analysis failed; using fallback.", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    analysis = fallbackVisionAnalysis(
      error instanceof Error
        ? `Gemini could not process this image, so the case was routed to human review. ${error.message}`
        : "Gemini could not process this image, so the case was routed to human review."
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
