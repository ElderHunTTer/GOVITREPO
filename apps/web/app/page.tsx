import { summarizeVerification } from "@govit/core";
import type { VerificationResult } from "@govit/types";

const mockResult: VerificationResult = {
  jobId: "demo-job-001",
  status: "review",
  createdAt: new Date("2026-06-09T10:00:00.000Z").toISOString(),
  fields: [
    {
      fieldName: "governmentWarning",
      status: "pass",
      expectedValue:
        "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.",
      detectedValue:
        "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.",
      confidence: 0.99,
      reason: "Detected warning text matches the required statement exactly."
    },
    {
      fieldName: "brandName",
      status: "review",
      expectedValue: "STONE'S THROW",
      detectedValue: "Stone's Throw",
      confidence: 0.91,
      reason:
        "Normalized values match, but the reviewer should confirm branding presentation on the label."
    },
    {
      fieldName: "netContents",
      status: "fail",
      expectedValue: "750 mL",
      detectedValue: "700 mL",
      confidence: 0.95,
      reason: "Structured quantity does not match the submitted application value."
    }
  ]
};

const summary = summarizeVerification(mockResult);

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-band">
          <p className="eyebrow">Modern review operations</p>
          <span className="hero-chip">Supabase and Vercel connected</span>
        </div>
        <h1>American-made label review built for speed, clarity, and trust.</h1>
        <p className="hero-copy">
          This showcase frames the reviewer workflow as a modern verification
          console: deterministic checks, visible evidence, and a path from demo
          polish to production-grade intake.
        </p>
        <div className="hero-metrics">
          <article>
            <span>Verification mode</span>
            <strong>Single-label review</strong>
          </article>
          <article>
            <span>Backed by</span>
            <strong>Supabase + Vercel</strong>
          </article>
          <article>
            <span>Decision model</span>
            <strong>Pass / Review / Fail</strong>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Mock verification result</p>
            <h2>Single-label review</h2>
            <p className="panel-copy">
              Reviewers can see the exact field outcome, the detected value, and
              why a record should pass, pause for review, or fail.
            </p>
          </div>
          <span className={`status-pill status-${mockResult.status}`}>
            {summary.label}
          </span>
        </div>

        <div className="summary-grid">
          <article>
            <span>Job ID</span>
            <strong>{mockResult.jobId}</strong>
          </article>
          <article>
            <span>Pass</span>
            <strong>{summary.counts.pass}</strong>
          </article>
          <article>
            <span>Review</span>
            <strong>{summary.counts.review}</strong>
          </article>
          <article>
            <span>Fail</span>
            <strong>{summary.counts.fail}</strong>
          </article>
        </div>

        <div className="result-list">
          {mockResult.fields.map((field) => (
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
      </section>
    </main>
  );
}
