import Link from "next/link";
import { redirect } from "next/navigation";
import { getReviewerContext } from "@/lib/product";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const context = await getReviewerContext();

  if (context) {
    redirect("/dashboard");
  }

  return (
    <main className="page-shell">
      <section className="utility-banner">
        <div>
          <p className="eyebrow">Case lookup</p>
          <h2>Looking for information or the status of your case?</h2>
        </div>
        <Link className="secondary-button" href="/case-status">
          Check reference #
        </Link>
      </section>

      <section className="hero">
        <div className="hero-band">
          <p className="eyebrow">Digital label operations</p>
          <span className="hero-chip">Supabase auth, storage, and review queue</span>
        </div>
        <h1>TTB Label Reporting</h1>
        <p className="hero-copy">
          A reviewer and admin console for ingesting label images, running
          automated intake checks, and storing every artifact and decision in
          Supabase.
        </p>
        <div className="hero-metrics">
          <article>
            <span>Primary workflow</span>
            <strong>Automated triage, queue, and review</strong>
          </article>
          <article>
            <span>Authentication</span>
            <strong>Reviewer and admin accounts</strong>
          </article>
          <article>
            <span>Storage model</span>
            <strong>Images and demos in Supabase</strong>
          </article>
        </div>
        <div className="cta-row">
          <Link className="primary-button" href="/report">
            Report Label
          </Link>
        </div>
      </section>

      <section className="card-surface landing-grid">
        <article className="landing-card">
          <p className="eyebrow">What the product does</p>
          <h2>Product-shaped workflow</h2>
          <p className="panel-copy">
            Public users can submit only an image, receive a case reference, and
            let the system classify and extract fields before reviewers step in.
          </p>
        </article>
        <article className="landing-card">
          <p className="eyebrow">Demo strategy</p>
          <h2>Stable seeded showcase data</h2>
          <p className="panel-copy">
            Demo labels are seeded into Supabase and their images are stored in the
            same project, so product demos stay fast and deterministic without
            depending on live TTB retrieval.
          </p>
        </article>
      </section>

      <section className="card-surface">
        <div className="section-head">
          <div>
            <p className="eyebrow">Core capabilities</p>
            <h2>Built to feel like an internal operations platform.</h2>
          </div>
        </div>
        <div className="summary-grid">
          <article>
            <span>Public intake</span>
            <strong>Anonymous upload and automated triage</strong>
          </article>
          <article>
            <span>Accounts</span>
            <strong>Reviewer and admin sign-in</strong>
          </article>
          <article>
            <span>Uploads</span>
            <strong>Label images stored in Supabase</strong>
          </article>
          <article>
            <span>Demo data</span>
            <strong>Seeded labels with saved previews</strong>
          </article>
          <article>
            <span>Review model</span>
            <strong>Pass / Review / Fail outcomes</strong>
          </article>
        </div>
      </section>

      <section className="card-surface page-stack">
        <div className="section-head">
          <div>
            <p className="eyebrow">Official TTB resources</p>
            <h2>Use TTB.gov for approval guidance, search tools, and labeling help.</h2>
            <p className="panel-copy">
              TTB offers official online systems and public guidance that are
              useful before or alongside this reporting workflow.
            </p>
          </div>
          <Link className="secondary-button" href="https://www.ttb.gov/" target="_blank">
            Visit TTB.gov
          </Link>
        </div>

        <div className="resource-grid">
          <article className="landing-card resource-card">
            <p className="eyebrow">Label approval</p>
            <h2>COLAs Online</h2>
            <p className="panel-copy">
              Use TTB&apos;s COLAs Online system to apply for label approval and
              track label submissions.
            </p>
            <Link
              className="text-link"
              href="https://www.ttb.gov/regulated-commodities/labeling/colas"
              target="_blank"
            >
              Open COLAs Online
            </Link>
          </article>

          <article className="landing-card resource-card">
            <p className="eyebrow">Public search</p>
            <h2>COLA Public Registry</h2>
            <p className="panel-copy">
              Search approved, expired, surrendered, or revoked label approvals
              without needing an account.
            </p>
            <Link
              className="text-link"
              href="https://www.ttb.gov/regulated-commodities/labeling/cola-public-registry"
              target="_blank"
            >
              Search the registry
            </Link>
          </article>

          <article className="landing-card resource-card">
            <p className="eyebrow">Formula guidance</p>
            <h2>Formulas Online</h2>
            <p className="panel-copy">
              Submit and track formula approvals for domestic and imported
              alcohol beverages and related products.
            </p>
            <Link
              className="text-link"
              href="https://www.ttb.gov/online-services/formulas-online"
              target="_blank"
            >
              Open Formulas Online
            </Link>
          </article>

          <article className="landing-card resource-card">
            <p className="eyebrow">Labeling help</p>
            <h2>Labeling resources</h2>
            <p className="panel-copy">
              Review labeling guidance, manuals, and mandatory labeling
              information published by TTB.
            </p>
            <Link
              className="text-link"
              href="https://www.ttb.gov/regulated-commodities/labeling/labeling-resources"
              target="_blank"
            >
              View labeling resources
            </Link>
          </article>
        </div>
      </section>

      <section className="card-surface login-prompt">
        <div>
          <p className="eyebrow">Internal access</p>
          <h2>Dashboard Login</h2>
          <p className="panel-copy">
            Reviewers and administrators can sign in to manage reports, inspect
            evidence, and resolve queue items.
          </p>
        </div>
        <Link className="primary-button" href="/login">
          Dashboard Login
        </Link>
      </section>
    </main>
  );
}
