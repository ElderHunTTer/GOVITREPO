import { buildColaDateRange, buildColaSearchUrl, getSuggestedColaProductName } from "@/lib/cola";

export function ColaSearchHelper(args: {
  brandName?: string | null;
  labelTitle?: string | null;
}) {
  const productName = getSuggestedColaProductName({
    brandName: args.brandName,
    labelTitle: args.labelTitle
  });

  if (!productName) {
    return null;
  }

  const dateRange = buildColaDateRange();
  const searchUrl = buildColaSearchUrl({
    productName,
    searchType: "E"
  });

  return (
    <section className="cola-helper">
      <div className="cola-helper-head">
        <div>
          <p className="eyebrow">COLA search helper</p>
          <h2>Search the TTB Public COLA Registry with the extracted product name.</h2>
          <p className="panel-copy">
            Use this as a reviewer-assist search. The app opens the public COLA
            registry in a new tab with a suggested product lookup and a safe
            date window.
          </p>
        </div>
        <a
          className="primary-button cola-helper-button"
          href={searchUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open TTB COLA Search
        </a>
      </div>

      <div className="cola-helper-grid">
        <article className="cola-helper-item">
          <span>Suggested product name</span>
          <strong>{productName}</strong>
        </article>
        <article className="cola-helper-item">
          <span>Search type</span>
          <strong>Either</strong>
        </article>
        <article className="cola-helper-item">
          <span>Date completed from</span>
          <strong>{dateRange.from}</strong>
        </article>
        <article className="cola-helper-item">
          <span>Date completed to</span>
          <strong>{dateRange.to}</strong>
        </article>
      </div>
    </section>
  );
}
