import type {
  ExtractedSubmissionFields,
  VerificationFieldResult,
  VerificationResult,
  VerificationStatus,
  VerificationSummary
} from "@govit/types";

const LABELS: Record<VerificationStatus, string> = {
  pass: "Ready to approve",
  review: "Needs reviewer attention",
  fail: "Action required"
};

export function summarizeVerification(
  result: VerificationResult
): VerificationSummary {
  const counts: VerificationSummary["counts"] = {
    pass: 0,
    review: 0,
    fail: 0
  };

  for (const field of result.fields) {
    counts[field.status] += 1;
  }

  return {
    label: LABELS[result.status],
    counts
  };
}

export function normalizeLooseText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function matchesNormalizedText(
  expectedValue: string,
  detectedValue: string
): boolean {
  return normalizeLooseText(expectedValue) === normalizeLooseText(detectedValue);
}

export function normalizeStrictText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function matchesStrictText(
  expectedValue: string,
  detectedValue: string
): boolean {
  return normalizeStrictText(expectedValue) === normalizeStrictText(detectedValue);
}

type ComparisonMode = "strict" | "normalized";

const FIELD_COMPARISON_MODE: Record<string, ComparisonMode> = {
  governmentWarning: "strict"
};

export function buildExtractedFieldResult(args: {
  fieldName: keyof ExtractedSubmissionFields | "documentType";
  expectedValue?: string;
  detectedValue?: string;
  confidence?: number;
  unmatchedReference?: boolean;
}): VerificationFieldResult {
  const expectedValue = args.expectedValue?.trim() ?? "";
  const detectedValue = args.detectedValue?.trim() ?? "";
  const confidence = Math.max(0, Math.min(args.confidence ?? 0, 1));

  if (args.fieldName === "documentType") {
    return {
      fieldName: args.fieldName,
      status: confidence >= 0.8 ? "pass" : "review",
      expectedValue: expectedValue || "TTB alcohol label",
      detectedValue: detectedValue || "Uncertain",
      confidence,
      reason:
        confidence >= 0.8
          ? "Automated intake classified the image as a likely TTB alcohol label."
          : "Automated intake could not classify the document confidently."
    };
  }

  if (args.unmatchedReference) {
    return {
      fieldName: args.fieldName,
      status: "review",
      expectedValue,
      detectedValue,
      confidence,
      reason:
        "No seeded reference label was matched automatically, so this extracted field needs reviewer confirmation."
    };
  }

  if (!detectedValue) {
    return {
      fieldName: args.fieldName,
      status: "review",
      expectedValue,
      detectedValue,
      confidence,
      reason: "The automated intake could not extract a reliable value for this field."
    };
  }

  if (!expectedValue) {
    return {
      fieldName: args.fieldName,
      status: "review",
      expectedValue,
      detectedValue,
      confidence,
      reason: "There is no reference value available for automated comparison."
    };
  }

  const mode = FIELD_COMPARISON_MODE[args.fieldName] ?? "normalized";
  const isMatch =
    mode === "strict"
      ? matchesStrictText(expectedValue, detectedValue)
      : matchesNormalizedText(expectedValue, detectedValue);

  if (isMatch) {
    return {
      fieldName: args.fieldName,
      status: "pass",
      expectedValue,
      detectedValue,
      confidence,
      reason:
        mode === "strict"
          ? "The extracted value matches the required regulatory text."
          : "The extracted value matches the reference label after normalization."
    };
  }

  if (confidence < 0.75) {
    return {
      fieldName: args.fieldName,
      status: "review",
      expectedValue,
      detectedValue,
      confidence,
      reason: "The extracted value differs from the reference label, but confidence is too low to auto-fail."
    };
  }

  return {
    fieldName: args.fieldName,
    status: "fail",
    expectedValue,
    detectedValue,
    confidence,
    reason:
      mode === "strict"
        ? "The extracted value does not match the required regulatory text."
        : "The extracted value does not match the reference label."
  };
}
