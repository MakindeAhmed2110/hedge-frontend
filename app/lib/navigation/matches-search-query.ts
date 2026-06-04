export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

/** Returns true when query is empty or any haystack contains the query (case-insensitive). */
export function matchesSearchQuery(
  query: string,
  ...haystacks: (string | number | bigint | null | undefined)[]
): boolean {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) {
    return true;
  }
  return haystacks.some((value) => {
    if (value == null) {
      return false;
    }
    return String(value).toLowerCase().includes(normalized);
  });
}
