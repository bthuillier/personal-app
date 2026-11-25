import type { ReactNode } from "react";

export interface SectionProps {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/** A titled block of a page, without a frame. See `Panel` for a framed card. */
export function Section({ title, actions, children }: SectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
