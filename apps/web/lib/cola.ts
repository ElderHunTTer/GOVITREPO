type ColaSearchType = "B" | "F" | "E";

function padDate(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(value: Date) {
  return `${padDate(value.getMonth() + 1)}/${padDate(value.getDate())}/${value.getFullYear()}`;
}

function cleanSearchTerm(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 40);
}

export function buildColaDateRange() {
  const to = new Date();
  const from = new Date(to);

  // Stay comfortably inside TTB's 15-year limit to avoid edge-case validation failures.
  from.setFullYear(from.getFullYear() - 14);

  return {
    from: formatDate(from),
    to: formatDate(to)
  };
}

export function buildColaSearchUrl(args: {
  productName: string;
  searchType?: ColaSearchType;
}) {
  const productName = cleanSearchTerm(args.productName);
  const searchType = args.searchType ?? "E";
  const dateRange = buildColaDateRange();
  const params = new URLSearchParams({
    "searchCriteria.productOrFancifulName": productName,
    "searchCriteria.productNameSearchType": searchType,
    "searchCriteria.dateCompletedFrom": dateRange.from,
    "searchCriteria.dateCompletedTo": dateRange.to
  });

  return `https://ttbonline.gov/colasonline/publicSearchColasBasicProcess.do?action=search&${params.toString()}`;
}

export function getSuggestedColaProductName(args: {
  brandName?: string | null;
  labelTitle?: string | null;
}) {
  return cleanSearchTerm(args.brandName || args.labelTitle || "");
}
