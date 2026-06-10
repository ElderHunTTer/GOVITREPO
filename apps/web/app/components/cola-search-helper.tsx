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
    <section className="result-card">
      <div className="section-head">
        <div>
          <p className="eyebrow">COLA search helper</p>
          <h2>Open the TTB registry with a suggested product search.</h2>
        </div>
        <a
          className="secondary-button"
          href={searchUrl}
          rel="noreferrer"
          target="_blank"
        >
          Search on COLA
        </a>
      </div>

      <div className="summary-grid">
        <article>
          <span>Suggested product name</span>
          <strong>{productName}</strong>
        </article>
        <article>
          <span>Search type</span>
          <strong>Either</strong>
        </article>
        <article>
          <span>Date completed from</span>
          <strong>{dateRange.from}</strong>
        </article>
        <article>
          <span>Date completed to</span>
          <strong>{dateRange.to}</strong>
        </article>
      </div>
    </section>
  );
}
