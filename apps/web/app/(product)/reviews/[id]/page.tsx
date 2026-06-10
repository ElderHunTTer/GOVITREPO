import { notFound } from "next/navigation";
import { ImagePreview } from "@/app/components/image-preview";
import { getJobDetail } from "@/lib/product";
import { submitReviewerDecisionAction } from "../../actions";

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getDisplayStatus(args: {
  reviewDecision: string | null;
  summaryStatus: string | null;
  status: string;
}) {
  return args.reviewDecision ?? args.summaryStatus ?? args.status;
}

export default async function ReviewDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getJobDetail(id);

  if (!detail) {
    notFound();
  }

  const { job, imageUrl, fieldResults } = detail;
  const displayStatus = getDisplayStatus({
    reviewDecision: job.reviewDecision,
    summaryStatus: job.summaryStatus,
    status: job.status
  });

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Review detail</p>
          <h1>{job.labelTitle}</h1>
          <p className="page-subtitle">
            Source: {job.sourceKind} · Created {new Date(job.createdAt).toLocaleString()}
          </p>
        </div>
        <span className={`status-pill status-${displayStatus}`}>
          {formatLabel(displayStatus)}
        </span>
      </header>

      <div className="detail-grid">
        <section className="card-surface">
          <div className="section-head">
            <div>
              <p className="eyebrow">Source image</p>
              <h2>Stored label asset</h2>
            </div>
          </div>
          {imageUrl ? (
            <ImagePreview alt={job.labelTitle} src={imageUrl} />
          ) : (
            <div className="empty-state">
              <h3>No stored preview</h3>
              <p>This job does not have an image preview yet.</p>
            </div>
          )}
        </section>

        <section className="card-surface">
          <div className="section-head">
            <div>
              <p className="eyebrow">Submission</p>
              <h2>Application fields</h2>
            </div>
          </div>
          <dl className="meta-list">
            {Object.entries(job.submittedFields ?? {}).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{String(value || "Not provided")}</dd>
              </div>
            ))}
          </dl>
          {job.automatedSummary ? (
            <div className="note-block">
              <span className="field-label">Automated intake summary</span>
              <p>{job.automatedSummary}</p>
            </div>
          ) : null}
          <div className="summary-grid">
            <article>
              <span>Classification</span>
              <strong>
                {job.automatedClassification
                  ? formatLabel(job.automatedClassification)
                  : "Not available"}
              </strong>
            </article>
            <article>
              <span>Review confidence</span>
              <strong>
                {job.automatedConfidence != null
                  ? `${Math.round(job.automatedConfidence * 100)}%`
                  : "Not available"}
              </strong>
            </article>
            <article>
              <span>Model</span>
              <strong>{job.automatedModel ?? "Not available"}</strong>
            </article>
            <article>
              <span>Decision</span>
              <strong>
                {job.reviewDecision
                  ? formatLabel(job.reviewDecision)
                  : "Pending reviewer action"}
              </strong>
            </article>
          </div>
          {job.reviewerNotes ? (
            <div className="note-block">
              <span className="field-label">Reviewer note</span>
              <p>{job.reviewerNotes}</p>
            </div>
          ) : null}
        </section>
      </div>

      <section className="card-surface">
        <div className="section-head">
          <div>
            <p className="eyebrow">Reviewer action</p>
            <h2>Resolve or escalate this case</h2>
          </div>
        </div>
        <form action={submitReviewerDecisionAction} className="form-shell">
          <input name="jobId" type="hidden" value={job.id} />
          <label className="input-group input-group-full">
            <span>Reviewer decision note</span>
            <textarea
              name="decisionNote"
              placeholder="Summarize why you are approving, denying, or requesting a second opinion."
              rows={4}
            />
          </label>
          <div className="actions-row">
            <button className="primary-button" name="decision" type="submit" value="accepted">
              Accept
            </button>
            <button className="secondary-button" name="decision" type="submit" value="denied">
              Deny
            </button>
            <button className="secondary-button" name="decision" type="submit" value="second_opinion">
              Second opinion
            </button>
          </div>
        </form>
      </section>

      <section className="card-surface">
        <div className="section-head">
          <div>
            <p className="eyebrow">Field decisions</p>
            <h2>Verification outcomes</h2>
          </div>
        </div>

        {fieldResults.length === 0 ? (
          <div className="empty-state">
            <h3>Awaiting automated verification</h3>
            <p>
              This intake record is stored and ready. The OCR and comparison
              pipeline can attach field-level decisions here next.
            </p>
          </div>
        ) : (
          <div className="result-list">
            {fieldResults.map((field) => (
              <article key={field.fieldName} className="result-card">
                <div className="result-head">
                  <div>
                    <span className="field-label">Field</span>
                    <h3>{field.fieldName}</h3>
                  </div>
                  <span className={`status-pill status-${field.status}`}>
                    {field.status}
                  </span>
                </div>
                <p>{field.reason}</p>
                <dl className="result-grid">
                  <div>
                    <dt>Expected</dt>
                    <dd>{field.expectedValue}</dd>
                  </div>
                  <div>
                    <dt>Detected</dt>
                    <dd>{field.detectedValue}</dd>
                  </div>
                  <div>
                    <dt>Confidence</dt>
                    <dd>{Math.round(field.confidence * 100)}%</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
