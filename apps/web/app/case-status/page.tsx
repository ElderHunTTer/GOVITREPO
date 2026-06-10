import Link from "next/link";
import { getPublicCaseDetail } from "@/lib/product";

export const dynamic = "force-dynamic";

export default async function CaseStatusPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.caseReference;
  const caseReference = Array.isArray(query) ? query[0] : query;
  const caseDetail = caseReference ? await getPublicCaseDetail(caseReference) : null;

  return (
    <main className="page-shell">
      <section className="page-stack">
        <header className="page-header">
          <div>
            <p className="eyebrow">Case tracking</p>
            <h1>Look up the status of a public label report.</h1>
            <p className="page-subtitle">
              Enter the case reference number to see whether the report is waiting
              for label confirmation, submitted for review, or already resolved.
            </p>
          </div>
          <div className="page-actions">
            <Link className="secondary-button" href="/report">
              Start a new report
            </Link>
          </div>
        </header>

        <section className="card-surface">
          <form className="form-shell" method="get">
            <div className="form-grid">
              <label className="input-group">
                <span>Case reference</span>
                <input
                  defaultValue={caseReference ?? ""}
                  name="caseReference"
                  placeholder="TTB-20260609-ABC123"
                  type="text"
                />
              </label>
            </div>
            <div className="actions-row">
              <button className="primary-button" type="submit">
                Check status
              </button>
            </div>
          </form>
        </section>

        {caseReference && !caseDetail ? (
          <section className="card-surface">
            <div className="empty-state">
              <h3>No case found</h3>
              <p>We could not find a report with that case reference number.</p>
            </div>
          </section>
        ) : null}

        {caseDetail ? (
          <section className="card-surface page-stack">
            <div className="section-head">
              <div>
                <p className="eyebrow">Case detail</p>
                <h2>{caseDetail.caseRecord.caseReference}</h2>
              </div>
              <span className={`status-pill status-${caseDetail.caseRecord.status}`}>
                {caseDetail.caseRecord.status}
              </span>
            </div>

            <div className="summary-grid">
              <article>
                <span>Reported label name</span>
                <strong>{caseDetail.caseRecord.reportedLabelName || "Not provided"}</strong>
              </article>
              <article>
                <span>Reported category</span>
                <strong>{caseDetail.caseRecord.reportedCategory || "Not provided"}</strong>
              </article>
              <article>
                <span>Created</span>
                <strong>{new Date(caseDetail.caseRecord.createdAt).toLocaleString()}</strong>
              </article>
              <article>
                <span>Sent to review</span>
                <strong>
                  {caseDetail.caseRecord.submittedAt
                    ? new Date(caseDetail.caseRecord.submittedAt).toLocaleString()
                    : "Not yet"}
                </strong>
              </article>
            </div>

            {caseDetail.matchedLabel ? (
              <div className="note-block">
                <span className="field-label">Confirmed label</span>
                <p>
                  {caseDetail.matchedLabel.title} · {caseDetail.matchedLabel.category}
                </p>
              </div>
            ) : (
              <div className="note-block">
                <span className="field-label">Next step</span>
                <p>
                  This case still needs a label confirmation. Continue the process at{" "}
                  <Link className="text-link" href={`/report/${caseDetail.caseRecord.caseReference}`}>
                    confirm label
                  </Link>
                  .
                </p>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </main>
  );
}

