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
      <section className="hero">
        <div className="hero-band">
          <p className="eyebrow">Digital label operations</p>
          <span className="hero-chip">Supabase auth, storage, and review queue</span>
        </div>
        <h1>Label review software designed like a real internal product.</h1>
        <p className="hero-copy">
          A reviewer and admin console for ingesting label images, running seeded
          demo evaluations, and storing every artifact and decision in Supabase.
        </p>
        <div className="hero-metrics">
          <article>
            <span>Primary workflow</span>
            <strong>Intake, queue, and review</strong>
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
          <Link className="primary-button" href="/login">
            Sign in to the console
          </Link>
          <Link className="secondary-button" href="/demo-library">
            View demo library after sign-in
          </Link>
        </div>
      </section>

      <section className="card-surface landing-grid">
        <article className="landing-card">
          <p className="eyebrow">What the product does</p>
          <h2>Product-shaped workflow</h2>
          <p className="panel-copy">
            Instead of a single pretty result card, the product now has a reviewer
            login, dashboard, upload intake, demo library, and individual review
            pages for stored records.
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
    </main>
  );
}
