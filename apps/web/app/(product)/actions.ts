"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import {
  getReviewerContext,
  summarizeStatuses
} from "@/lib/product";
import { createClient } from "@/lib/supabase/server";
import type { VerificationFieldResult } from "@govit/types";

function safeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
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
  const brandName = String(formData.get("brandName") ?? "").trim();
  const classType = String(formData.get("classType") ?? "").trim();
  const netContents = String(formData.get("netContents") ?? "").trim();
  const alcoholByVolume = String(formData.get("alcoholByVolume") ?? "").trim();
  const governmentWarning = String(formData.get("governmentWarning") ?? "").trim();
  const reviewerNotes = String(formData.get("reviewerNotes") ?? "").trim();

  if (!(labelImage instanceof File) || labelImage.size === 0) {
    redirect("/reviews/new?error=Attach%20a%20label%20image%20to%20continue.");
  }

  const filePath = `uploads/${context.profile.id}/${Date.now()}-${safeFileName(labelImage.name)}`;
  const admin = createAdminClient();

  await admin.storage.from(env.supabaseStorageBucketLabels).upload(
    filePath,
    Buffer.from(await labelImage.arrayBuffer()),
    {
      contentType: labelImage.type || "application/octet-stream",
      upsert: false
    }
  );

  const submittedFields = {
    brandName,
    classType,
    netContents,
    alcoholByVolume,
    governmentWarning
  };

  const labelTitle = brandName || classType || labelImage.name;

  const { data: job } = await admin
    .from("label_review_jobs")
    .insert({
      status: "pending",
      source_kind: "upload",
      submitted_by: context.profile.id,
      source_image_path: filePath,
      label_title: labelTitle,
      submitted_fields: submittedFields,
      reviewer_notes:
        reviewerNotes || "Awaiting OCR extraction and automated verification."
    })
    .select("id")
    .single();

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
      review_decision: decision,
      reviewed_by: context.profile.id,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: combinedReviewerNotes || null
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
  redirect(`/reviews/${jobId}`);
}
