import type { ReactNode } from "react";

export interface SectionPage {
  /** Relative to the section: "" for its overview, "albums/:id" for a detail. */
  path: string;
  element: ReactNode;
  /** Pages with a label appear in the sidebar, in declaration order. */
  label?: string;
}

/** A top-level area of the app (top nav entry + its sidebar and routes). */
export interface AppSection {
  label: string;
  /** Absolute base path, e.g. "/music". */
  path: string;
  pages: SectionPage[];
}

export function pageUrl(section: AppSection, page: SectionPage): string {
  return page.path ? `${section.path}/${page.path}` : section.path;
}

/** Whether `pathname` is the section itself or one of its pages. */
export function isInSection(pathname: string, section: AppSection): boolean {
  return pathname === section.path || pathname.startsWith(`${section.path}/`);
}
