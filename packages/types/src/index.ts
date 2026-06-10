export type VerificationStatus = "pass" | "review" | "fail";
export type ReviewerRole = "admin" | "reviewer";
export type ReviewerStatus = "active" | "disabled";
export type ReviewSourceKind = "upload" | "demo";

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

export interface ReviewerProfile {
  id: string;
  email: string;
  fullName: string;
  role: ReviewerRole;
  status: ReviewerStatus;
}

export interface DemoLabel {
  id: string;
  slug: string;
  title: string;
  producer: string;
  category: string;
  summary: string;
  storagePath: string;
  submittedFields: Record<string, string>;
  sampleFieldResults: VerificationFieldResult[];
}
