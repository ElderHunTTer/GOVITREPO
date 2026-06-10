export type VerificationStatus = "pass" | "review" | "fail";
export type ReviewerRole = "admin" | "reviewer";
export type ReviewerStatus = "active" | "disabled";
export type ReviewSourceKind = "upload" | "demo" | "public_report";
export type ReviewDecision = "accepted" | "denied" | "second_opinion";
export type AutomatedLabelClassification =
  | "ttb_label"
  | "not_ttb_label"
  | "uncertain";
export type PublicCaseStatus =
  | "processing"
  | "auto_rejected"
  | "pending_review"
  | "in_review"
  | "resolved";

export interface ExtractedSubmissionFields {
  brandName?: string;
  classType?: string;
  netContents?: string;
  alcoholByVolume?: string;
  governmentWarning?: string;
  producer?: string;
}

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

export interface PublicReportCase {
  id: string;
  caseReference: string;
  status: PublicCaseStatus;
  uploadedImagePath: string;
  matchedDemoLabelId: string | null;
  candidateLabelIds: string[];
  internalJobId: string | null;
  classification: AutomatedLabelClassification | null;
  classificationConfidence: number | null;
  reviewConfidence: number | null;
  aiSummary: string | null;
  autoRejectionReason: string | null;
  extractedFields: ExtractedSubmissionFields;
  extractionConfidences: Record<string, number>;
  createdAt: string;
  submittedAt: string | null;
}
