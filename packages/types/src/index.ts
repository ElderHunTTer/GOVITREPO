export type VerificationStatus = "pass" | "review" | "fail";

export interface VerificationFieldResult {
  fieldName: string;
  status: VerificationStatus;
  expectedValue: string;
  detectedValue: string;
  confidence: number;
  reason: string;
}

export interface VerificationResult {
  jobId: string;
  status: VerificationStatus;
  createdAt: string;
  fields: VerificationFieldResult[];
}

export interface VerificationSummary {
  label: string;
  counts: Record<VerificationStatus, number>;
}

