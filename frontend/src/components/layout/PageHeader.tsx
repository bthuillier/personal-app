import type { ReactNode } from "react";
import { Link } from "react-router";

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Renders a "← label" link above the title. */
  back?: { to: string; label: string };
  /** Right-aligned content, e.g. an "Add" button or a year picker. */
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, back, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        {back && <BackLink {...back} />}
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      &larr; {label}
    </Link>
  );
}
