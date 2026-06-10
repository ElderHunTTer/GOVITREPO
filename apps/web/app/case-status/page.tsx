import Link from "next/link";
import { ImagePreview } from "@/app/components/image-preview";
import { getPublicCaseDetail } from "@/lib/product";

export const dynamic = "force-dynamic";

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

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
              Enter the case reference number to see whether the report is being
              processed, auto-rejected, queued for review, or already resolved.
            </p>
          </div>
          <div className="page-actions">
            <Link className="secondary-button" href="/">
              Home
            </Link>
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
                <span>Classification</span>
                <strong>
                  {caseDetail.caseRecord.classification
                    ? formatLabel(caseDetail.caseRecord.classification)
                    : "Pending"}
                </strong>
              </article>
              <article>
                <span>Classifier confidence</span>
                <strong>
                  {caseDetail.caseRecord.classificationConfidence != null
                    ? `${Math.round(caseDetail.caseRecord.classificationConfidence * 100)}%`
                    : "Pending"}
                </strong>
              </article>
              <article>
                <span>Created</span>
                <strong>{new Date(caseDetail.caseRecord.createdAt).toLocaleString()}</strong>
              </article>
              <article>
                <span>Reviewer confidence</span>
                <strong>
                  {caseDetail.caseRecord.reviewConfidence != null
                    ? `${Math.round(caseDetail.caseRecord.reviewConfidence * 100)}%`
                    : "Pending"}
                </strong>
              </article>
            </div>

            {caseDetail.imageUrl ? (
              <section className="page-stack">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Uploaded evidence</p>
                    <h2>Label preview</h2>
                  </div>
                </div>
                <ImagePreview
                  alt={`Uploaded label for ${caseDetail.caseRecord.caseReference}`}
                  src={caseDetail.imageUrl}
                />
              </section>
            ) : null}

            {caseDetail.caseRecord.aiSummary ? (
              <div className="note-block">
                <span className="field-label">Automated assessment</span>
                <p>{caseDetail.caseRecord.aiSummary}</p>
              </div>
            ) : null}

            {caseDetail.caseRecord.autoRejectionReason ? (
              <div className="note-block">
                <span className="field-label">Auto-rejection reason</span>
                <p>{caseDetail.caseRecord.autoRejectionReason}</p>
              </div>
            ) : null}

            {Object.keys(caseDetail.caseRecord.extractedFields).length > 0 ? (
              <div className="summary-grid">
                {Object.entries(caseDetail.caseRecord.extractedFields).map(
                  ([key, value]) => (
                    <article key={key}>
                      <span>{formatLabel(key)}</span>
                      <strong>{value || "Not detected"}</strong>
                    </article>
                  )
                )}
              </div>
            ) : null}

            {caseDetail.matchedLabel ? (
              <div className="note-block">
                <span className="field-label">Matched seeded label</span>
                <p>
                  {caseDetail.matchedLabel.title} · {caseDetail.matchedLabel.category}
                </p>
              </div>
            ) : (
              <div className="note-block">
                <span className="field-label">Current handling</span>
                <p>
                  If no seeded label could be matched automatically, the reviewer
                  will use the uploaded image and extracted fields to finish the
                  case manually.
                </p>
              </div>
            )}

            <div className="note-block">
              <span className="field-label">Sent to review</span>
              <p>
                {caseDetail.caseRecord.submittedAt
                  ? new Date(caseDetail.caseRecord.submittedAt).toLocaleString()
                  : "Not sent to the reviewer queue."}
              </p>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
