import Link from "next/link";
import { createUploadReviewAction } from "../../actions";

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
          <h1>Upload a label and capture the submitted application fields.</h1>
          <p className="page-subtitle">
            Uploaded images are stored in Supabase immediately. OCR and automated
            verification can be layered onto this same intake record next.
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
          <div className="form-grid">
            <label className="input-group">
              <span>Label image</span>
              <input accept="image/*" name="labelImage" required type="file" />
            </label>

            <label className="input-group">
              <span>Brand name</span>
              <input name="brandName" placeholder="Liberty Lane" type="text" />
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
            <button className="primary-button" type="submit">
              Save intake record
            </button>
            <p className="helper-text">
              The initial upload creates a pending job. Demo labels generate
              completed reviews with seeded outcomes.
            </p>
          </div>
        </form>
      </section>
    </section>
  );
}
