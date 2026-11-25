import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: ReactNode;
  /** The headline figure. Omit it to render only `children`. */
  value?: ReactNode;
  /** Muted text under the value, e.g. "3 Vinyl · 2 CD". */
  detail?: ReactNode;
  /** Makes the whole card a link. */
  to?: string;
  children?: ReactNode;
}

const cardClass = "rounded-lg border border-border p-5";

export function StatCard({ label, value, detail, to, children }: StatCardProps) {
  const content = (
    <>
      <p className="text-sm text-muted-foreground">{label}</p>
      {value !== undefined && (
        <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      )}
      {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cn(cardClass, "transition-colors hover:bg-muted/50")}>
        {content}
      </Link>
    );
  }
  return <div className={cardClass}>{content}</div>;
}

const columnClasses = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
} as const;

export function StatGrid({
  columns = 4,
  children,
}: {
  columns?: keyof typeof columnClasses;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4", columnClasses[columns])}>
      {children}
    </div>
  );
}
