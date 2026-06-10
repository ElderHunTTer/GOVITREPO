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

function clampConfidence(value: unknown, fallback = 0) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(value, 1));
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
  const entries: Array<[string, number]> = KNOWN_FIELD_NAMES.map((fieldName) => [
    fieldName,
    clampConfidence(values[fieldName], 0)
  ]);

  return Object.fromEntries(entries.filter(([, value]) => value > 0));
}

function stripCodeFence(value: string) {
  const trimmed = value.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
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

function fallbackVisionAnalysis(): VisionAnalysis {
  return {
    provider: "demo-fallback",
    model: "heuristic",
    classification: "uncertain",
    classificationConfidence: 0.2,
    reviewConfidence: 0.2,
    aiSummary:
      "Automated vision is not configured, so this case was routed to human review with no extracted fields.",
    rejectionReason: null,
    extractedFields: {},
    extractionConfidences: {}
  };
}

async function analyzeLabelImage(args: {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}): Promise<VisionAnalysis> {
  if (!env.openAiApiKey) {
    return fallbackVisionAnalysis();
  }

  const dataUrl = `data:${args.mimeType};base64,${args.buffer.toString("base64")}`;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openAiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.openAiVisionModel,
      temperature: 0.1,
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "system",
          content:
            "You are a compliance intake assistant for alcohol beverage labels. Return only JSON. Determine whether the image is a likely TTB alcohol label. If it is not, explain why briefly. If it is, extract any visible values for brandName, classType, netContents, alcoholByVolume, governmentWarning, and producer. Provide confidence values from 0 to 1."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                'Return JSON with this exact shape: {"classification":"ttb_label|not_ttb_label|uncertain","classificationConfidence":0-1,"reviewConfidence":0-1,"aiSummary":"brief summary","rejectionReason":"brief reason or null","extractedFields":{"brandName":"","classType":"","netContents":"","alcoholByVolume":"","governmentWarning":"","producer":""},"extractionConfidences":{"brandName":0-1,"classType":0-1,"netContents":0-1,"alcoholByVolume":0-1,"governmentWarning":0-1,"producer":0-1}}. Be conservative. If uncertain, use classification uncertain instead of guessing. File name: ' +
                args.fileName
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI intake failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
  };

  const rawContent = payload.choices?.[0]?.message?.content;
  const content =
    typeof rawContent === "string"
      ? rawContent
      : Array.isArray(rawContent)
        ? rawContent
            .map((part) => (typeof part.text === "string" ? part.text : ""))
            .join("")
        : "";

  const parsed = JSON.parse(stripCodeFence(content)) as {
    classification?: AutomatedLabelClassification;
    classificationConfidence?: number;
    reviewConfidence?: number;
    aiSummary?: string;
    rejectionReason?: string | null;
    extractedFields?: Partial<Record<KnownFieldName, unknown>>;
    extractionConfidences?: Partial<Record<KnownFieldName, unknown>>;
  };

  return {
    provider: "openai",
    model: env.openAiVisionModel,
    classification:
      parsed.classification === "ttb_label" ||
      parsed.classification === "not_ttb_label" ||
      parsed.classification === "uncertain"
        ? parsed.classification
        : "uncertain",
    classificationConfidence: clampConfidence(parsed.classificationConfidence, 0.2),
    reviewConfidence: clampConfidence(
      parsed.reviewConfidence,
      parsed.classification === "ttb_label" ? 0.7 : 0.2
    ),
    aiSummary: parsed.aiSummary?.trim() || "No automated summary was returned.",
    rejectionReason: parsed.rejectionReason?.trim() || null,
    extractedFields: cleanExtractedFields(parsed.extractedFields ?? {}),
    extractionConfidences: cleanFieldConfidences(
      parsed.extractionConfidences ?? {}
    )
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
    analysis = await analyzeLabelImage(args);
  } catch {
    analysis = {
      ...fallbackVisionAnalysis(),
      aiSummary:
        "The automated vision provider could not process this image, so the case was routed to human review."
    };
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
