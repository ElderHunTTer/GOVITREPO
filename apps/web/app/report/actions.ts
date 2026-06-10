"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import {
  buildCaseReference,
  getPublicCase,
  normalizeSearchText,
  scoreDemoLabelMatch
} from "@/lib/product";

function safeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
}

export async function createPublicReportAction(formData: FormData) {
  const labelImage = formData.get("labelImage");
  const reportedLabelName = String(formData.get("reportedLabelName") ?? "").trim();
  const reportedCategory = String(formData.get("reportedCategory") ?? "").trim();
  const reporterEmail = String(formData.get("reporterEmail") ?? "").trim();
  const reporterNotes = String(formData.get("reporterNotes") ?? "").trim();

  if (!(labelImage instanceof File) || labelImage.size === 0) {
    redirect("/report?error=Attach%20a%20label%20image%20to%20continue.");
  }

  const admin = createAdminClient();
  const caseReference = buildCaseReference();
  const filePath = `public-intake/${caseReference}/${Date.now()}-${safeFileName(labelImage.name)}`;

  await admin.storage.from(env.supabaseStorageBucketLabels).upload(
    filePath,
    Buffer.from(await labelImage.arrayBuffer()),
    {
      contentType: labelImage.type || "application/octet-stream",
      upsert: false
    }
  );

  const searchText = [reportedLabelName, reportedCategory]
    .map(normalizeSearchText)
    .filter(Boolean)
    .join(" ");

  const { data: labels } = await admin.from("demo_labels").select("id, slug, title, producer, category");

  const candidateLabelIds = (labels ?? [])
    .map((label) => ({
      id: label.id,
      score: scoreDemoLabelMatch(
        {
          slug: label.slug,
          title: label.title,
          producer: label.producer,
          category: label.category
        },
        searchText
      )
    }))
    .filter((label) => label.score >= 30)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map((label) => label.id);

  await admin.from("public_report_cases").insert({
    case_reference: caseReference,
    reported_label_name: reportedLabelName,
    reported_category: reportedCategory,
    reporter_email: reporterEmail || null,
    reporter_notes: reporterNotes,
    uploaded_image_path: filePath,
    candidate_label_ids: candidateLabelIds
  });

  revalidatePath("/case-status");
  redirect(`/report/${caseReference}`);
}

export async function confirmPublicReportLabelAction(formData: FormData) {
  const caseReference = String(formData.get("caseReference") ?? "");
  const selectedDemoLabelId = String(formData.get("selectedDemoLabelId") ?? "");

  if (!caseReference || !selectedDemoLabelId) {
    redirect("/report");
  }

  const admin = createAdminClient();
  const caseRecord = await getPublicCase(caseReference);

  if (!caseRecord) {
    redirect("/case-status");
  }

  if (caseRecord.internalJobId) {
    redirect(`/case-status?caseReference=${caseReference}`);
  }

  const { data: demoLabel } = await admin
    .from("demo_labels")
    .select("*")
    .eq("id", selectedDemoLabelId)
    .single();

  if (!demoLabel) {
    redirect(`/report/${caseReference}`);
  }

  const { data: job } = await admin
    .from("label_review_jobs")
    .insert({
      status: "pending",
      source_kind: "public_report",
      label_title: demoLabel.title,
      source_image_path: caseRecord.uploadedImagePath,
      submitted_fields: {
        caseReference,
        reportedLabelName: caseRecord.reportedLabelName,
        reportedCategory: caseRecord.reportedCategory,
        matchedDemoLabelTitle: demoLabel.title,
        matchedDemoLabelSlug: demoLabel.slug
      },
      reviewer_notes:
        "Submitted from the public intake flow after manual label confirmation.",
      demo_label_id: selectedDemoLabelId,
      public_case_reference: caseReference
    })
    .select("id")
    .single();

  await admin
    .from("public_report_cases")
    .update({
      status: "submitted_for_review",
      matched_demo_label_id: selectedDemoLabelId,
      internal_job_id: job?.id ?? null,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("case_reference", caseReference);

  revalidatePath("/dashboard");
  revalidatePath("/case-status");
  redirect(`/case-status?caseReference=${caseReference}`);
}
