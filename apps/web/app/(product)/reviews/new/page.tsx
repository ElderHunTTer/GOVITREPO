import Link from "next/link";
import { createUploadReviewAction } from "../../actions";
import { ReviewIntakeSubmit } from "./review-intake-submit";

export default async function NewReviewPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams.error;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">New review intake</p>
          <h1>Upload a label and open the same automated intake used in public reporting.</h1>
          <p className="page-subtitle">
            Start with the image first, let the system extract what it can, and
            only use manual fields when a reviewer wants to override or
            supplement the intake record.
          </p>
        </div>
        <div className="page-actions">
          <Link className="secondary-button" href="/demo-library">
            Use a seeded demo instead
          </Link>
        </div>
      </header>

      <section className="card-surface">
        {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

        <form action={createUploadReviewAction} className="form-shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Step 1</p>
              <h2>Submit the label image</h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="input-group input-group-full">
              <span>Label image</span>
              <input accept="image/*" name="labelImage" required type="file" />
            </label>
          </div>

          <section className="result-card">
            <p className="eyebrow">Optional manual fields</p>
            <h3>Only fill these in when you want to override or supplement the automated extraction.</h3>
            <p className="panel-copy">
              The uploaded image is still the primary source. Any manual values
              entered here are saved alongside the automated intake so reviewers
              can see both.
            </p>

            <div className="form-grid">
              <label className="input-group">
                <span>Brand name</span>
                <input name="brandName" placeholder="Liberty Lane" type="text" />
              </label>

              <label className="input-group">
                <span>Producer</span>
                <input name="producer" placeholder="Example Spirits Co." type="text" />
              </label>

              <label className="input-group">
                <span>Class or type</span>
                <input
                  name="classType"
                  placeholder="Straight Bourbon Whiskey"
                  type="text"
                />
              </label>

              <label className="input-group">
                <span>Net contents</span>
                <input name="netContents" placeholder="750 mL" type="text" />
              </label>

              <label className="input-group">
                <span>Alcohol by volume</span>
                <input
                  name="alcoholByVolume"
                  placeholder="45% Alc/Vol"
                  type="text"
                />
              </label>

              <label className="input-group input-group-full">
                <span>Government warning</span>
                <textarea
                  name="governmentWarning"
                  placeholder="Paste the required warning statement if available."
                  rows={5}
                />
              </label>
            </div>
          </section>

          <div className="form-grid">
            <label className="input-group input-group-full">
              <span>Reviewer intake notes</span>
              <textarea
                name="reviewerNotes"
                placeholder="Optional reviewer note for the intake record."
                rows={4}
              />
            </label>
          </div>

          <div className="actions-row">
            <ReviewIntakeSubmit />
            <p className="helper-text">
              This creates a pending internal review, stores the image in
              Supabase, runs the automated label analysis, and saves any manual
              overrides as part of the same intake record.
            </p>
          </div>
        </form>
      </section>
    </section>
  );
}
