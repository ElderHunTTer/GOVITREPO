import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReportCasePage({
  params
}: {
  params: Promise<{ caseReference: string }>;
}) {
  const { caseReference } = await params;

  redirect(`/case-status?caseReference=${caseReference}`);
}
