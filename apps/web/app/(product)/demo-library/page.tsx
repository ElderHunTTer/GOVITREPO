import Image from "next/image";
import { getDemoLibrary, summarizeStatuses } from "@/lib/product";
import { runDemoReviewAction } from "../actions";

export default async function DemoLibraryPage() {
  const demoLabels = await getDemoLibrary();

  return (
    <section className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Demo library</p>
          <h1>Seeded labels for stable product walkthroughs.</h1>
          <p className="page-subtitle">
            These labels and images are stored in Supabase so demos remain fast,
            deterministic, and independent from live TTB retrieval.
          </p>
        </div>
      </header>

      <div className="demo-grid">
        {demoLabels.map((label) => {
          const summary = summarizeStatuses(label.sampleFieldResults);

          return (
            <article key={label.id} className="demo-card">
              {label.imageUrl ? (
                <Image
                  alt={`${label.title} demo label`}
                  className="demo-image"
                  height={960}
                  src={label.imageUrl}
                  unoptimized
                  width={720}
                />
              ) : (
                <div className="demo-image demo-image-placeholder">No preview</div>
              )}

              <div className="demo-body">
                <div className="result-head">
                  <div>
                    <span className="field-label">{label.category}</span>
                    <h2>{label.title}</h2>
                  </div>
                  <span className={`status-pill status-${summary}`}>{summary}</span>
                </div>
                <p>{label.summary}</p>
                <div className="detail-mini-grid">
                  <div>
                    <span className="field-label">Producer</span>
                    <strong>{label.producer}</strong>
                  </div>
                  <div>
                    <span className="field-label">Sample fields</span>
                    <strong>{label.sampleFieldResults.length}</strong>
                  </div>
                </div>
                <form action={runDemoReviewAction} className="inline-form">
                  <input name="demoLabelId" type="hidden" value={label.id} />
                  <button className="primary-button" type="submit">
                    Run demo review
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
