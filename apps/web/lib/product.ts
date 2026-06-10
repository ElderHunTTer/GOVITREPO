import { cache } from "react";
import { redirect } from "next/navigation";
import type {
  AutomatedLabelClassification,
  DemoLabel,
  PublicCaseStatus,
  ReviewDecision,
  ReviewSourceKind,
  ReviewerProfile,
  VerificationFieldResult,
  VerificationStatus
} from "@govit/types";
import { env } from "./env";
import { createAdminClient } from "./supabase/admin";
import { createClient as createServerClient } from "./supabase/server";

type JobRow = {
  id: string;
  status: string;
  summary_status: VerificationStatus | null;
  label_title: string | null;
  source_kind: ReviewSourceKind;
  source_image_path: string | null;
  submitted_fields: Record<string, string>;
  reviewer_notes: string | null;
  automated_classification: AutomatedLabelClassification | null;
  automated_confidence: number | null;
  automated_summary: string | null;
  automated_model: string | null;
  review_decision: ReviewDecision | null;
  reviewed_at: string | null;
  created_at: string;
};

type DashboardFilters = {
  query?: string;
  sourceKind?: "all" | ReviewSourceKind;
  status?: "all" | "pending" | "processing" | "completed" | VerificationStatus;
};

type FieldResultRow = {
  field_name: string;
  status: VerificationStatus;
  expected_value: string;
  detected_value: string;
  confidence: number;
  reason: string;
};

type PublicReportCaseRow = {
  id: string;
  case_reference: string;
  status: PublicCaseStatus;
  uploaded_image_path: string;
  matched_demo_label_id: string | null;
  candidate_label_ids: string[] | null;
  internal_job_id: string | null;
  classification_status: AutomatedLabelClassification | null;
  classification_confidence: number | null;
  review_confidence: number | null;
  ai_summary: string | null;
  auto_rejection_reason: string | null;
  extracted_fields: Record<string, string>;
  extraction_confidences: Record<string, number>;
  created_at: string;
  submitted_at: string | null;
};

export const getReviewerContext = cache(async () => {
  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("reviewer_profiles")
    .select("id, email, full_name, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.status !== "active") {
    return null;
  }

  return {
    user,
    profile: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      status: profile.status
    } satisfies ReviewerProfile
  };
});

export async function requireReviewer() {
  const context = await getReviewerContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}

export function summarizeStatuses(
  results: Pick<VerificationFieldResult, "status">[]
): VerificationStatus {
  if (results.some((result) => result.status === "fail")) {
    return "fail";
  }

  if (results.some((result) => result.status === "review")) {
    return "review";
  }

  return "pass";
}

export function mapFieldResult(row: FieldResultRow): VerificationFieldResult {
  return {
    fieldName: row.field_name,
    status: row.status,
    expectedValue: row.expected_value,
    detectedValue: row.detected_value,
    confidence: row.confidence,
    reason: row.reason
  };
}

export function mapDemoLabel(row: {
  id: string;
  slug: string;
  title: string;
  producer: string;
  category: string;
  summary: string;
  storage_path: string;
  submitted_fields: Record<string, string>;
  sample_field_results: FieldResultRow[];
}): DemoLabel {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    producer: row.producer,
    category: row.category,
    summary: row.summary,
    storagePath: row.storage_path,
    submittedFields: row.submitted_fields,
    sampleFieldResults: row.sample_field_results.map(mapFieldResult)
  };
}

export async function createSignedImageUrl(path: string | null) {
  if (!path) {
    return null;
  }

  const admin = createAdminClient();
  const { data } = await admin.storage
    .from(env.supabaseStorageBucketLabels)
    .createSignedUrl(path, 60 * 60);

  return data?.signedUrl ?? null;
}

export async function getDashboardData(filters?: DashboardFilters) {
  await requireReviewer();
  const admin = createAdminClient();

  const [
    totalJobs,
    reviewJobs,
    failedJobs,
    demoLabels,
    publicCases,
    recentJobsResponse
  ] = await Promise.all([
    admin.from("label_review_jobs").select("id", { count: "exact", head: true }),
    admin
      .from("label_review_jobs")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "processing"]),
    admin
      .from("label_review_jobs")
      .select("id", { count: "exact", head: true })
      .eq("summary_status", "fail"),
    admin.from("demo_labels").select("id", { count: "exact", head: true }),
    admin.from("public_report_cases").select("id", { count: "exact", head: true }),
    admin
      .from("label_review_jobs")
      .select(
        "id, status, summary_status, label_title, source_kind, created_at, review_decision, public_case_reference"
      )
      .order("created_at", { ascending: false })
      .limit(50)
  ]);

  const normalizedQuery = filters?.query?.trim().toLowerCase() ?? "";
  const filteredJobs =
    recentJobsResponse.data?.filter((job: {
      id: string;
      status: string;
      summary_status: VerificationStatus | null;
      label_title: string | null;
      source_kind: ReviewSourceKind;
      created_at: string;
      review_decision: ReviewDecision | null;
      public_case_reference: string | null;
    }) => {
      if (filters?.sourceKind && filters.sourceKind !== "all" && job.source_kind !== filters.sourceKind) {
        return false;
      }

      if (filters?.status && filters.status !== "all") {
        const displayStatus = job.review_decision ?? job.summary_status ?? job.status;
        if (displayStatus !== filters.status) {
          return false;
        }
      }

      if (normalizedQuery) {
        const haystack = [
          job.label_title ?? "",
          job.source_kind,
          job.status,
          job.summary_status ?? "",
          job.review_decision ?? "",
          job.public_case_reference ?? ""
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }

      return true;
    }) ?? [];

  return {
    stats: {
      totalJobs: totalJobs.count ?? 0,
      reviewJobs: reviewJobs.count ?? 0,
      failedJobs: failedJobs.count ?? 0,
      demoLabels: demoLabels.count ?? 0,
      publicCases: publicCases.count ?? 0
    },
    recentJobs:
      filteredJobs.map((job: {
        id: string;
        status: string;
        summary_status: VerificationStatus | null;
        label_title: string | null;
        source_kind: ReviewSourceKind;
        created_at: string;
        review_decision: ReviewDecision | null;
        public_case_reference: string | null;
      }) => ({
        id: job.id,
        status: job.status,
        summaryStatus: job.summary_status,
        reviewDecision: job.review_decision,
        labelTitle: job.label_title ?? "Untitled label",
        sourceKind: job.source_kind,
        publicCaseReference: job.public_case_reference,
        createdAt: job.created_at
      }))
  };
}

export async function getDemoLibrary() {
  await requireReviewer();
  const admin = createAdminClient();
  const { data } = await admin
    .from("demo_labels")
    .select("*")
    .order("title", { ascending: true });

  const demoLabels = (data ?? []).map(mapDemoLabel);
  const signedUrls = await Promise.all(
    demoLabels.map((label) => createSignedImageUrl(label.storagePath))
  );

  return demoLabels.map((label, index) => ({
    ...label,
    imageUrl: signedUrls[index]
  }));
}

export async function getJobDetail(jobId: string) {
  await requireReviewer();
  const admin = createAdminClient();

  const { data: job } = await admin
    .from("label_review_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle<JobRow>();

  if (!job) {
    return null;
  }

  const { data: fieldRows } = await admin
    .from("label_review_field_results")
    .select(
      "field_name, status, expected_value, detected_value, confidence, reason"
    )
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });

  return {
    job: {
      id: job.id,
      status: job.status,
      summaryStatus: job.summary_status,
      labelTitle: job.label_title ?? "Untitled label",
      sourceKind: job.source_kind,
      sourceImagePath: job.source_image_path,
      submittedFields: job.submitted_fields,
      reviewerNotes: job.reviewer_notes,
      automatedClassification: job.automated_classification,
      automatedConfidence: job.automated_confidence,
      automatedSummary: job.automated_summary,
      automatedModel: job.automated_model,
      reviewDecision: job.review_decision,
      reviewedAt: job.reviewed_at,
      createdAt: job.created_at
    },
    imageUrl: await createSignedImageUrl(job.source_image_path),
    fieldResults: (fieldRows ?? []).map(mapFieldResult)
  };
}

export function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function scoreDemoLabelMatch(
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

export function buildCaseReference() {
  const date = new Date();
  const stamp = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("");
  const token = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `TTB-${stamp}-${token}`;
}

export async function getPublicCase(caseReference: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("public_report_cases")
    .select("*")
    .eq("case_reference", caseReference)
    .maybeSingle<PublicReportCaseRow>();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    caseReference: data.case_reference,
    status: data.status,
    uploadedImagePath: data.uploaded_image_path,
    matchedDemoLabelId: data.matched_demo_label_id,
    candidateLabelIds: data.candidate_label_ids ?? [],
    internalJobId: data.internal_job_id,
    classification: data.classification_status,
    classificationConfidence: data.classification_confidence,
    reviewConfidence: data.review_confidence,
    aiSummary: data.ai_summary,
    autoRejectionReason: data.auto_rejection_reason,
    extractedFields: data.extracted_fields ?? {},
    extractionConfidences: data.extraction_confidences ?? {},
    createdAt: data.created_at,
    submittedAt: data.submitted_at
  };
}

export async function getPublicCaseDetail(caseReference: string) {
  const admin = createAdminClient();
  const caseRow = await getPublicCase(caseReference);

  if (!caseRow) {
    return null;
  }

  const matchedLabel = caseRow.matchedDemoLabelId
    ? await admin
        .from("demo_labels")
        .select("*")
        .eq("id", caseRow.matchedDemoLabelId)
        .maybeSingle()
    : { data: null };

  return {
    caseRecord: caseRow,
    imageUrl: await createSignedImageUrl(caseRow.uploadedImagePath),
    matchedLabel: matchedLabel.data ? mapDemoLabel(matchedLabel.data) : null
  };
}

export async function getPublicCaseCandidates(
  caseReference: string,
  query: string | null
) {
  const admin = createAdminClient();
  const caseRow = await getPublicCase(caseReference);

  if (!caseRow) {
    return null;
  }

  const { data } = await admin
    .from("demo_labels")
    .select("*")
    .order("title", { ascending: true });

  const labels = (data ?? []).map(mapDemoLabel);
  const effectiveQuery =
    query && query.trim()
      ? query
      : [
          caseRow.extractedFields.brandName,
          caseRow.extractedFields.classType,
          caseRow.extractedFields.producer
        ]
          .filter(Boolean)
          .join(" ");

  const prioritized = labels
    .map((label) => ({
      ...label,
      score: scoreDemoLabelMatch(label, effectiveQuery)
    }))
    .sort((left, right) => {
      const leftPreferred = caseRow.candidateLabelIds.includes(left.id) ? 1 : 0;
      const rightPreferred = caseRow.candidateLabelIds.includes(right.id) ? 1 : 0;

      if (leftPreferred !== rightPreferred) {
        return rightPreferred - leftPreferred;
      }

      if (left.score !== right.score) {
        return right.score - left.score;
      }

      return left.title.localeCompare(right.title);
    });

  const filtered = query?.trim()
    ? prioritized.filter((label) => label.score > 0)
    : prioritized;

  const signedUrls = await Promise.all(
    filtered.map((label) => createSignedImageUrl(label.storagePath))
  );

  return {
    caseRecord: caseRow,
    imageUrl: await createSignedImageUrl(caseRow.uploadedImagePath),
    labels: filtered.map((label, index) => ({
      ...label,
      imageUrl: signedUrls[index]
    }))
  };
}
