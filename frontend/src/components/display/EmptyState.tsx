import type { ReactNode } from "react";

/** Muted one-line message for empty, missing or not-yet-available content. */
export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return <EmptyState>{label}</EmptyState>;
}
