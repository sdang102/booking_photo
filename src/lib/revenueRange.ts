export interface RevenueDateRange {
  fromDate?: string;
  toDate?: string;
}

export function normalizeRevenueDateRange(fromDate?: string, toDate?: string): RevenueDateRange {
  const from = normalizeDate(fromDate);
  const to = normalizeDate(toDate);
  if (from && to && from > to) return { fromDate: to, toDate: from };
  return { fromDate: from, toDate: to };
}

function normalizeDate(value?: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}
