import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PanelProps {
  title?: ReactNode;
  /** Muted helper text under the title. */
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** A framed card with a small uppercase title, used for detail-page blocks. */
export function Panel({
  title,
  description,
  actions,
  className,
  children,
}: PanelProps) {
  return (
    <section className={cn("rounded-lg border border-border p-5", className)}>
      {(title || description || actions) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
