import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

export interface ListRowProps {
  /** Makes the row a link with a hover state. */
  to?: string;
  className?: string;
  children: ReactNode;
}

const rowClass = "rounded-md border border-border px-4 py-3 text-sm";

export function ListRow({ to, className, children }: ListRowProps) {
  if (to) {
    return (
      <Link
        to={to}
        className={cn(rowClass, "block transition-colors hover:bg-muted/50", className)}
      >
        {children}
      </Link>
    );
  }
  return <div className={cn(rowClass, className)}>{children}</div>;
}

/** Vertical stack of `ListRow`s. */
export function ListRows({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}
