import Link from "next/link";
import { getDashboardData } from "@/lib/product";

export default async function DashboardPage() {
  const { stats, recentJobs } = await getDashboardData();

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Operations dashboard</p>
          <h1>Review queue and demo activity at a glance.</h1>
          <p className="page-subtitle">
            Use the demo library for stable showcase runs, or monitor public OCR
            intake jobs as they move into reviewer processing and image storage
            in Supabase.
          </p>
        </div>
        <div className="page-actions">
          <Link className="primary-button" href="/reviews/new">
            Start a new review
          </Link>
          <Link className="secondary-button" href="/demo-library">
            Open demo library
          </Link>
        </div>
      </header>

      <section className="stat-grid">
        <article className="stat-card">
          <span>Total jobs</span>
          <strong>{stats.totalJobs}</strong>
        </article>
        <article className="stat-card">
          <span>Needs review</span>
          <strong>{stats.reviewJobs}</strong>
        </article>
        <article className="stat-card">
          <span>Failed checks</span>
          <strong>{stats.failedJobs}</strong>
        </article>
        <article className="stat-card">
          <span>Seeded demo labels</span>
          <strong>{stats.demoLabels}</strong>
        </article>
        <article className="stat-card">
          <span>Public cases</span>
          <strong>{stats.publicCases}</strong>
        </article>
      </section>

      <section className="card-surface">
        <div className="section-head">
          <div>
            <p className="eyebrow">Recent activity</p>
            <h2>Latest review jobs</h2>
          </div>
          <Link className="text-link" href="/reviews/new">
            Intake another label
          </Link>
        </div>

        {recentJobs.length === 0 ? (
          <div className="empty-state">
            <h3>No reviews yet</h3>
            <p>
              Run a seeded demo or upload a label to create the first review job.
            </p>
          </div>
        ) : (
          <div className="queue-list">
            {recentJobs.map((job) => (
              <Link key={job.id} className="queue-item" href={`/reviews/${job.id}`}>
                <div>
                  <span className="field-label">Label</span>
                  <strong>{job.labelTitle}</strong>
                </div>
                <div>
                  <span className="field-label">Source</span>
                  <strong>{job.sourceKind}</strong>
                </div>
                <div>
                  <span className="field-label">Created</span>
                  <strong>{new Date(job.createdAt).toLocaleString()}</strong>
                </div>
                <div>
                  <span className={`status-pill status-${job.summaryStatus ?? "review"}`}>
                    {job.summaryStatus ?? job.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
