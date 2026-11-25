import { Link } from "react-router";
import type { LabelCount } from "@/lib/stats";

export interface BarListProps {
  items: LabelCount[];
  /** When given, each row links to `href(label)` (with the raw label). */
  href?: (label: string) => string;
  /** Display transform, e.g. `formatEnum`; links still use the raw label. */
  formatLabel?: (label: string) => string;
}

/** Ranked labels with a proportional bar, e.g. top genres. */
export function BarList({ items, href, formatLabel = (l) => l }: BarListProps) {
  const max = Math.max(0, ...items.map((i) => i.count));

  return (
    <ul className="flex flex-col gap-2">
      {items.map(({ label, count }) => {
        const row = (
          <>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate text-foreground transition-colors group-hover:text-primary">
                {formatLabel(label)}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {count}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/70 transition-colors group-hover:bg-primary"
                style={{ width: max > 0 ? `${(count / max) * 100}%` : 0 }}
              />
            </div>
          </>
        );
        return (
          <li key={label}>
            {href ? (
              <Link to={href(label)} className="group flex flex-col gap-1">
                {row}
              </Link>
            ) : (
              <div className="flex flex-col gap-1">{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
