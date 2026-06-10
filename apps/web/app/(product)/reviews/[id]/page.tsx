import Image from "next/image";
import { notFound } from "next/navigation";
import { getJobDetail } from "@/lib/product";

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
        <span className={`status-pill status-${job.summaryStatus ?? "review"}`}>
          {job.summaryStatus ?? job.status}
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
            <Image
              alt={job.labelTitle}
              className="detail-image"
              height={1200}
              src={imageUrl}
              unoptimized
              width={900}
            />
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
