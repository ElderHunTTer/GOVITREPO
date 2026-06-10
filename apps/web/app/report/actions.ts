"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mapDemoLabel, buildCaseReference, getPublicCase } from "@/lib/product";
import { runAutomatedPublicIntake } from "@/lib/public-intake";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

function safeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
}

export async function createPublicReportAction(formData: FormData) {
  const labelImage = formData.get("labelImage");
  const reporterEmail = String(formData.get("reporterEmail") ?? "").trim();
  const reporterNotes = String(formData.get("reporterNotes") ?? "").trim();
  const notABot = String(formData.get("notABot") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();

  if (!(labelImage instanceof File) || labelImage.size === 0) {
    redirect("/report?error=Attach%20a%20label%20image%20to%20continue.");
  }

  if (website) {
    redirect("/report?error=We%20could%20not%20verify%20this%20submission.");
  }

  if (notABot !== "on") {
    redirect("/report?error=Confirm%20the%20bot%20check%20to%20continue.");
  }

  const admin = createAdminClient();
  const caseReference = buildCaseReference();
  const filePath = `public-intake/${caseReference}/${Date.now()}-${safeFileName(labelImage.name)}`;
  const fileBuffer = Buffer.from(await labelImage.arrayBuffer());

  await admin.storage.from(env.supabaseStorageBucketLabels).upload(filePath, fileBuffer, {
    contentType: labelImage.type || "application/octet-stream",
    upsert: false
  });

  await admin.from("public_report_cases").insert({
    case_reference: caseReference,
    reporter_email: reporterEmail || null,
    reporter_notes: reporterNotes,
    uploaded_image_path: filePath,
    bot_check_verified: true,
    status: "processing"
  });

  const { data: labels } = await admin
    .from("demo_labels")
    .select("*")
    .order("title", { ascending: true });

  const automatedResult = await runAutomatedPublicIntake({
    buffer: fileBuffer,
    mimeType: labelImage.type || "image/png",
    fileName: labelImage.name,
    caseReference,
    labels: (labels ?? []).map(mapDemoLabel)
  });

  const shouldAutoReject =
    automatedResult.classification === "not_ttb_label" &&
    automatedResult.classificationConfidence >= 0.8;

  let internalJobId: string | null = null;

  if (!shouldAutoReject) {
    const { data: job } = await admin
      .from("label_review_jobs")
      .insert({
        status: "pending",
        summary_status: automatedResult.summaryStatus,
        source_kind: "public_report",
        label_title: automatedResult.labelTitle,
        source_image_path: filePath,
        submitted_fields: automatedResult.extractedFields,
        ocr_provider: automatedResult.provider,
        automated_classification: automatedResult.classification,
        automated_confidence: automatedResult.reviewConfidence,
        automated_summary: automatedResult.aiSummary,
        automated_model: automatedResult.model,
        reviewer_notes:
          reporterNotes ||
          "Submitted from the public intake flow and pre-processed automatically.",
        demo_label_id: automatedResult.matchedDemoLabelId,
        public_case_reference: caseReference
      })
      .select("id")
      .single();

    internalJobId = job?.id ?? null;

    if (internalJobId && automatedResult.fieldResults.length > 0) {
      await admin.from("label_review_field_results").insert(
        automatedResult.fieldResults.map((result) => ({
          job_id: internalJobId,
          field_name: result.fieldName,
          status: result.status,
          expected_value: result.expectedValue,
          detected_value: result.detectedValue,
          confidence: result.confidence,
          reason: result.reason
        }))
      );
    }
  }

  await admin
    .from("public_report_cases")
    .update({
      status: shouldAutoReject ? "auto_rejected" : "pending_review",
      matched_demo_label_id: automatedResult.matchedDemoLabelId,
      candidate_label_ids: automatedResult.candidateLabelIds,
      internal_job_id: internalJobId,
      submitted_at: shouldAutoReject ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      classification_status: automatedResult.classification,
      classification_confidence: automatedResult.classificationConfidence,
      review_confidence: automatedResult.reviewConfidence,
      ai_provider: automatedResult.provider,
      ai_model: automatedResult.model,
      ai_summary: automatedResult.aiSummary,
      auto_rejection_reason: shouldAutoReject
        ? automatedResult.rejectionReason || automatedResult.aiSummary
        : null,
      extracted_fields: automatedResult.extractedFields,
      extraction_confidences: automatedResult.extractionConfidences,
      ai_processed_at: new Date().toISOString()
    })
    .eq("case_reference", caseReference);

  revalidatePath("/dashboard");
  revalidatePath("/case-status");
  redirect(`/case-status?caseReference=${caseReference}`);
}

export async function confirmPublicReportLabelAction(formData: FormData) {
  const caseReference = String(formData.get("caseReference") ?? "");

  if (!caseReference) {
    redirect("/report");
  }

  const caseRecord = await getPublicCase(caseReference);

  if (!caseRecord) {
    redirect("/case-status");
  }

  redirect(`/case-status?caseReference=${caseReference}`);
}
