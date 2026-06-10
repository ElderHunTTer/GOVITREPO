import type {
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

