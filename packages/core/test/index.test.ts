import { describe, expect, it } from "vitest";
import {
  buildExtractedFieldResult,
  matchesNormalizedText,
  summarizeVerification
} from "../src";

describe("matchesNormalizedText", () => {
  it("matches values with whitespace and case differences", () => {
    expect(matchesNormalizedText("STONE'S THROW", "  Stone's   Throw ")).toBe(
      true
    );
  });
});

describe("summarizeVerification", () => {
  it("counts field statuses and returns the result label", () => {
    const summary = summarizeVerification({
      jobId: "job-1",
      status: "review",
      createdAt: "2026-06-09T10:00:00.000Z",
      fields: [
        {
          fieldName: "brandName",
          status: "review",
          expectedValue: "STONE'S THROW",
          detectedValue: "Stone's Throw",
          confidence: 0.9,
          reason: "Normalized values match."
        },
        {
          fieldName: "warning",
          status: "pass",
          expectedValue: "warning",
          detectedValue: "warning",
          confidence: 1,
          reason: "Exact match."
        }
      ]
    });

    expect(summary.label).toBe("Needs reviewer attention");
    expect(summary.counts).toEqual({
      pass: 1,
      review: 1,
      fail: 0
    });
  });
});

describe("buildExtractedFieldResult", () => {
  it("keeps government warning checks strict", () => {
    const result = buildExtractedFieldResult({
      fieldName: "governmentWarning",
      expectedValue: "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects.",
      detectedValue: "Government warning: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects.",
      confidence: 0.94
    });

    expect(result.status).toBe("fail");
  });

  it("routes unmatched extracted fields to review", () => {
    const result = buildExtractedFieldResult({
      fieldName: "brandName",
      detectedValue: "Blue Harbor",
      confidence: 0.82,
      unmatchedReference: true
    });

    expect(result.status).toBe("review");
  });
});
