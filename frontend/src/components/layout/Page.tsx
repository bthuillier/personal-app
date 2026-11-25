import type { ReactNode } from "react";

/** Root of every page: a vertical stack with the app's standard spacing. */
export function Page({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-8">{children}</div>;
}
