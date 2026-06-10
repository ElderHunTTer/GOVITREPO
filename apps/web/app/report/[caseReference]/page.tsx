import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublicCaseCandidates } from "@/lib/product";
import { confirmPublicReportLabelAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ReportConfirmPage({
  params,
  searchParams
}: {
  params: Promise<{ caseReference: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { caseReference } = await params;
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q;
  const searchQuery = Array.isArray(query) ? query[0] : query ?? null;

  const data = await getPublicCaseCandidates(caseReference, searchQuery);

  if (!data) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="page-stack">
        <header className="page-header">
          <div>
            <p className="eyebrow">Step 2</p>
            <h1>Confirm the matching label for case {data.caseRecord.caseReference}.</h1>
            <p className="page-subtitle">
              If the automatic suggestions are not right, search the seeded label
              library and choose the closest match before sending the case to
              review.
            </p>
          </div>
        </header>

        <div className="detail-grid">
          <section className="card-surface">
            <div className="section-head">
              <div>
                <p className="eyebrow">Uploaded image</p>
                <h2>Report evidence</h2>
              </div>
            </div>
            {data.imageUrl ? (
              <Image
                alt={`Uploaded label for case ${data.caseRecord.caseReference}`}
                className="detail-image"
                height={1200}
                src={data.imageUrl}
                unoptimized
                width={900}
              />
            ) : (
              <div className="empty-state">
                <h3>No preview available</h3>
                <p>The uploaded image could not be previewed.</p>
              </div>
            )}
          </section>

          <section className="card-surface">
            <div className="section-head">
              <div>
                <p className="eyebrow">Search labels</p>
                <h2>Find the closest match</h2>
              </div>
            </div>
            <form className="form-shell" method="get">
              <label className="input-group">
                <span>Search demo labels</span>
                <input
                  defaultValue={searchQuery ?? ""}
                  name="q"
                  placeholder="Search by brand, producer, or category"
                  type="text"
                />
              </label>
              <div className="actions-row">
                <button className="secondary-button" type="submit">
                  Search labels
                </button>
              </div>
            </form>
          </section>
        </div>

        <section className="card-surface">
          <div className="section-head">
            <div>
              <p className="eyebrow">Available labels</p>
              <h2>Select and confirm one label</h2>
            </div>
          </div>

          <form action={confirmPublicReportLabelAction} className="demo-grid">
            <input name="caseReference" type="hidden" value={data.caseRecord.caseReference} />
            {data.labels.map((label) => (
              <label key={label.id} className="demo-card selectable-card">
                {label.imageUrl ? (
                  <Image
                    alt={`${label.title} candidate label`}
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
                    <input
                      defaultChecked={label.id === data.caseRecord.matchedDemoLabelId}
                      name="selectedDemoLabelId"
                      type="radio"
                      value={label.id}
                    />
                  </div>
                  <p>{label.summary}</p>
                  <div className="detail-mini-grid">
                    <div>
                      <span className="field-label">Producer</span>
                      <strong>{label.producer}</strong>
                    </div>
                  </div>
                </div>
              </label>
            ))}

            <div className="actions-row">
              <button className="primary-button" type="submit">
                Confirm label and send to review
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

