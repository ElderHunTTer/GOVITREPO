import Link from "next/link";
import { deleteReviewJobAction } from "../actions";
import { getDashboardData } from "@/lib/product";

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const status = resolvedSearchParams.status;
  const source = resolvedSearchParams.source;
  const q = resolvedSearchParams.q;
  const filters = {
    status: (Array.isArray(status) ? status[0] : status ?? "all") as
      | "all"
      | "pending"
      | "processing"
      | "completed"
      | "pass"
      | "review"
      | "fail",
    sourceKind: (Array.isArray(source) ? source[0] : source ?? "all") as
      | "all"
      | "upload"
      | "demo"
      | "public_report",
    query: Array.isArray(q) ? q[0] : q ?? ""
  };
  const { stats, recentJobs } = await getDashboardData(filters);

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Operations dashboard</p>
          <h1>Review queue and demo activity at a glance.</h1>
          <p className="page-subtitle">
            Use the demo library for stable showcase runs, or monitor public
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

      <section className="card-surface page-stack">
        <div className="section-head">
          <div>
            <p className="eyebrow">Review list</p>
            <h2>Filter and manage submitted reports</h2>
          </div>
          <Link className="text-link" href="/reviews/new">
            Intake another label
          </Link>
        </div>

        <form className="filter-grid" method="get">
          <label className="input-group">
            <span>Search</span>
            <input defaultValue={filters.query} name="q" placeholder="Label, case reference, status" type="text" />
          </label>
          <label className="input-group">
            <span>Status</span>
            <select defaultValue={filters.status} name="status">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="pass">Pass</option>
              <option value="review">Review</option>
              <option value="fail">Fail</option>
            </select>
          </label>
          <label className="input-group">
            <span>Source</span>
            <select defaultValue={filters.sourceKind} name="source">
              <option value="all">All sources</option>
              <option value="public_report">Public report</option>
              <option value="upload">Internal upload</option>
              <option value="demo">Demo</option>
            </select>
          </label>
          <div className="actions-row filter-actions">
            <button className="primary-button" type="submit">
              Apply filters
            </button>
            <Link className="secondary-button" href="/dashboard">
              Clear
            </Link>
          </div>
        </form>

        {recentJobs.length === 0 ? (
          <div className="empty-state">
            <h3>No matching reports</h3>
            <p>
              Adjust the filters, run a seeded demo, or upload a label to create
              a new review job.
            </p>
          </div>
        ) : (
          <div className="queue-list">
            {recentJobs.map((job) => (
              <article key={job.id} className="queue-item queue-item-shell">
                <Link className="queue-item-main" href={`/reviews/${job.id}`}>
                  <div>
                    <span className="field-label">Label</span>
                    <strong>{job.labelTitle}</strong>
                  </div>
                  <div>
                    <span className="field-label">Source</span>
                    <strong>{formatLabel(job.sourceKind)}</strong>
                  </div>
                  <div>
                    <span className="field-label">Created</span>
                    <strong>{new Date(job.createdAt).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="field-label">Case reference</span>
                    <strong>{job.publicCaseReference ?? "Internal only"}</strong>
                  </div>
                </Link>
                <div className="queue-item-side">
                  <span
                    className={`status-pill status-${
                      job.reviewDecision ?? job.summaryStatus ?? job.status
                    }`}
                  >
                    {formatLabel(job.reviewDecision ?? job.summaryStatus ?? job.status)}
                  </span>
                  <form action={deleteReviewJobAction}>
                    <input name="jobId" type="hidden" value={job.id} />
                    <button className="secondary-button compact-button danger-button" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
