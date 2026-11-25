export interface LabelCount {
  label: string;
  count: number;
}

/**
 * Counts items by one or several keys each, sorted by count (desc) then
 * label. A key extractor returning an array counts the item once per label
 * (e.g. an album with several genres).
 */
export function countBy<T>(
  items: readonly T[],
  key: (item: T) => string | readonly string[] | null | undefined,
  limit?: number,
): LabelCount[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (k == null) continue;
    for (const label of typeof k === "string" ? [k] : k) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
  const sorted = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return limit === undefined ? sorted : sorted.slice(0, limit);
}

/** "3 Vinyl · 2 CD" */
export function formatCounts(
  counts: LabelCount[],
  formatLabel: (label: string) => string = (l) => l,
): string {
  return counts.map((c) => `${c.count} ${formatLabel(c.label)}`).join(" · ");
}
