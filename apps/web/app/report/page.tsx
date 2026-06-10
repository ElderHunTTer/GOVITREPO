import Link from "next/link";
import { createPublicReportAction } from "./actions";
import { ProcessingSubmit } from "./processing-submit";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams.error;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-band">
          <p className="eyebrow">Public reporting</p>
          <span className="hero-chip">No account required</span>
        </div>
        <h1>Upload a label image and start a public review report.</h1>
        <p className="hero-copy">
          We will save your image, run a local OCR label check, and issue a case
          reference number so you can follow the report through review.
        </p>
        <div className="cta-row">
          <Link className="secondary-button" href="/">
            Home
          </Link>
          <Link className="secondary-button" href="/case-status">
            Check case status
          </Link>
        </div>
      </section>

      <section className="card-surface page-stack">
        {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}
        <div className="section-head">
          <div>
            <p className="eyebrow">Step 1</p>
            <h2>Submit the label image</h2>
          </div>
        </div>

        <form action={createPublicReportAction} className="form-shell">
          <div className="form-grid">
            <label className="input-group input-group-full">
              <span>Label image</span>
              <input accept="image/*" name="labelImage" required type="file" />
            </label>

            <label className="input-group">
              <span>Email for optional follow-up</span>
              <input
                name="reporterEmail"
                placeholder="name@example.com"
                type="email"
              />
            </label>

            <label className="checkbox-group input-group-full">
              <input name="notABot" required type="checkbox" />
              <span>I confirm this submission is being made by a real person.</span>
            </label>

            <label className="input-group input-group-full">
              <span>Why are you reporting this label?</span>
              <textarea
                name="reporterNotes"
                placeholder="Tell the reviewer what looks suspicious or what you want checked."
                rows={5}
              />
            </label>
          </div>

          <div className="actions-row">
            <ProcessingSubmit />
            <p className="helper-text">
              After upload, the system runs local OCR, extracts visible fields,
              and either auto-rejects non-labels or creates a pending reviewer
              case with a case reference.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
