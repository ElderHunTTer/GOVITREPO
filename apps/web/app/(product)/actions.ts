"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import {
  mapDemoLabel,
  getReviewerContext,
  summarizeStatuses
} from "@/lib/product";
import { runAutomatedPublicIntake } from "@/lib/public-intake";
import { createClient } from "@/lib/supabase/server";
import type {
  ExtractedSubmissionFields,
  VerificationFieldResult
} from "@govit/types";

function safeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
}

function readOptionalField(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function mergeSubmittedFields(args: {
  extractedFields: ExtractedSubmissionFields;
  manualFields: ExtractedSubmissionFields;
}) {
  return Object.fromEntries(
    Object.entries({
      ...args.extractedFields,
      ...Object.fromEntries(
        Object.entries(args.manualFields).filter(([, value]) => value?.trim())
      )
    }).filter(([, value]) => value?.trim())
  ) as ExtractedSubmissionFields;
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function runDemoReviewAction(formData: FormData) {
  const context = await getReviewerContext();

  if (!context) {
    redirect("/login");
  }

  const demoLabelId = String(formData.get("demoLabelId") ?? "");
  const admin = createAdminClient();
  const { data: demoLabel } = await admin
    .from("demo_labels")
    .select("*")
    .eq("id", demoLabelId)
    .single();

  if (!demoLabel) {
    redirect("/demo-library");
  }

  const sampleFieldResults = (demoLabel.sample_field_results ??
    []) as VerificationFieldResult[];

  if (sampleFieldResults.length === 0) {
    redirect("/demo-library");
  }

  const summaryStatus = summarizeStatuses(sampleFieldResults);

  const { data: job } = await admin
    .from("label_review_jobs")
    .insert({
      status: "completed",
      summary_status: summaryStatus,
      label_title: demoLabel.title,
      source_kind: "demo",
      demo_label_id: demoLabel.id,
      submitted_by: context.profile.id,
      source_image_path: demoLabel.storage_path,
      submitted_fields: demoLabel.submitted_fields,
      reviewer_notes: "Generated from the seeded demo library.",
      completed_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (job) {
    await admin.from("label_review_field_results").insert(
      sampleFieldResults.map((result) => ({
        job_id: job.id,
        field_name: result.fieldName,
        status: result.status,
        expected_value: result.expectedValue,
        detected_value: result.detectedValue,
        confidence: result.confidence,
        reason: result.reason
      }))
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/demo-library");
  redirect(`/reviews/${job?.id ?? ""}`);
}

export async function createUploadReviewAction(formData: FormData) {
  const context = await getReviewerContext();

  if (!context) {
    redirect("/login");
  }

  const labelImage = formData.get("labelImage");
  const manualFields: ExtractedSubmissionFields = {
    brandName: readOptionalField(formData, "brandName"),
    classType: readOptionalField(formData, "classType"),
    netContents: readOptionalField(formData, "netContents"),
    alcoholByVolume: readOptionalField(formData, "alcoholByVolume"),
    governmentWarning: readOptionalField(formData, "governmentWarning"),
    producer: readOptionalField(formData, "producer")
  };
  const reviewerNotes = readOptionalField(formData, "reviewerNotes");

  if (!(labelImage instanceof File) || labelImage.size === 0) {
    redirect("/reviews/new?error=Attach%20a%20label%20image%20to%20continue.");
  }

  const filePath = `uploads/${context.profile.id}/${Date.now()}-${safeFileName(labelImage.name)}`;
  const admin = createAdminClient();
  const fileBuffer = Buffer.from(await labelImage.arrayBuffer());

  await admin.storage.from(env.supabaseStorageBucketLabels).upload(
    filePath,
    fileBuffer,
    {
      contentType: labelImage.type || "application/octet-stream",
      upsert: false
    }
  );

  const { data: labels } = await admin
    .from("demo_labels")
    .select("*")
    .order("title", { ascending: true });

  const automatedResult = await runAutomatedPublicIntake({
    buffer: fileBuffer,
    mimeType: labelImage.type || "image/png",
    fileName: labelImage.name,
    caseReference: `INTERNAL-${context.profile.id.slice(0, 8)}`,
    labels: (labels ?? []).map(mapDemoLabel)
  });

  const submittedFields = mergeSubmittedFields({
    extractedFields: automatedResult.extractedFields,
    manualFields
  });

  const hasManualOverrides = Object.values(manualFields).some((value) => value?.trim());
  const labelTitle =
    submittedFields.brandName ||
    automatedResult.labelTitle ||
    submittedFields.classType ||
    labelImage.name;
  const combinedReviewerNotes = [
    reviewerNotes || null,
    hasManualOverrides
      ? "Manual intake overrides were provided for this uploaded review."
      : null
  ]
    .filter(Boolean)
    .join("\n\n");

  const { data: job } = await admin
    .from("label_review_jobs")
    .insert({
      status: "pending",
      summary_status: automatedResult.summaryStatus,
      source_kind: "upload",
      submitted_by: context.profile.id,
      source_image_path: filePath,
      label_title: labelTitle,
      submitted_fields: submittedFields,
      reviewer_notes:
        combinedReviewerNotes ||
        "Submitted from the internal intake flow and pre-processed automatically.",
      ocr_provider: automatedResult.provider,
      automated_classification: automatedResult.classification,
      automated_confidence: automatedResult.reviewConfidence,
      automated_summary: automatedResult.aiSummary,
      automated_model: automatedResult.model,
      demo_label_id: automatedResult.matchedDemoLabelId
    })
    .select("id")
    .single();

  if (job?.id && automatedResult.fieldResults.length > 0) {
    await admin.from("label_review_field_results").insert(
      automatedResult.fieldResults.map((result) => ({
        job_id: job.id,
        field_name: result.fieldName,
        status: result.status,
        expected_value: result.expectedValue,
        detected_value: result.detectedValue,
        confidence: result.confidence,
        reason: result.reason
      }))
    );
  }

  revalidatePath("/dashboard");
  redirect(`/reviews/${job?.id ?? ""}`);
}

export async function submitReviewerDecisionAction(formData: FormData) {
  const context = await getReviewerContext();

  if (!context) {
    redirect("/login");
  }

  const jobId = String(formData.get("jobId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const decisionNote = String(formData.get("decisionNote") ?? "").trim();

  if (!jobId) {
    redirect("/dashboard");
  }

  if (!["accepted", "denied", "second_opinion"].includes(decision)) {
    redirect(`/reviews/${jobId}`);
  }

  const admin = createAdminClient();
  const { data: job } = await admin
    .from("label_review_jobs")
    .select("public_case_reference, reviewer_notes")
    .eq("id", jobId)
    .maybeSingle<{ public_case_reference: string | null; reviewer_notes: string | null }>();

  const nextStatus = decision === "second_opinion" ? "processing" : "completed";
  const nextCaseStatus = decision === "second_opinion" ? "in_review" : "resolved";
  const nextSummaryStatus =
    decision === "accepted"
      ? "pass"
      : decision === "denied"
        ? "fail"
        : "review";

  const combinedReviewerNotes = [
    job?.reviewer_notes?.trim(),
    decisionNote ? `Reviewer decision note: ${decisionNote}` : null
  ]
    .filter(Boolean)
    .join("\n\n");

  await admin
    .from("label_review_jobs")
    .update({
      status: nextStatus,
      summary_status: nextSummaryStatus,
      review_decision: decision,
      reviewed_by: context.profile.id,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: combinedReviewerNotes || null,
      completed_at: decision === "second_opinion" ? null : new Date().toISOString()
    })
    .eq("id", jobId);

  if (job?.public_case_reference) {
    await admin
      .from("public_report_cases")
      .update({
        status: nextCaseStatus,
        resolved_at: decision === "second_opinion" ? null : new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("case_reference", job.public_case_reference);
  }

  revalidatePath("/dashboard");
  revalidatePath("/case-status");
  revalidatePath(`/reviews/${jobId}`);
  redirect(`/reviews/${jobId}`);
}

export async function deleteReviewJobAction(formData: FormData) {
  const context = await getReviewerContext();

  if (!context) {
    redirect("/login");
  }

  const jobId = String(formData.get("jobId") ?? "");

  if (!jobId) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  const { data: job } = await admin
    .from("label_review_jobs")
    .select("public_case_reference, source_image_path")
    .eq("id", jobId)
    .maybeSingle<{ public_case_reference: string | null; source_image_path: string | null }>();

  await admin.from("label_review_field_results").delete().eq("job_id", jobId);
  await admin.from("label_review_jobs").delete().eq("id", jobId);

  if (job?.public_case_reference) {
    await admin
      .from("public_report_cases")
      .delete()
      .eq("case_reference", job.public_case_reference);
  }

  if (job?.source_image_path) {
    await admin.storage
      .from(env.supabaseStorageBucketLabels)
      .remove([job.source_image_path]);
  }

  revalidatePath("/dashboard");
  revalidatePath("/case-status");
  redirect("/dashboard");
}
