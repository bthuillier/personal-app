import type { components } from "@/api/schema";

type StringSpec = components["schemas"]["StringSpec"];

/** Format a gauge list as a hyphenated string, e.g. [10, 13, 17] → "10-13-17". */
export function formatGaugeList(gauges?: number[]): string {
  if (!gauges || gauges.length === 0) return "-";
  return gauges.join("-");
}

/**
 * Format a single string spec as a guitarist-readable label, e.g.
 * `{ gauge: 10, construction: "Plain" }` → ".010p",
 * `{ gauge: 9.5, construction: "Plain" }` → ".0095p".
 */
export function formatStringSpec(spec: StringSpec): string {
  const isFractional = spec.gauge % 1 !== 0;
  const padded = isFractional
    ? spec.gauge.toFixed(1).replace(".", "").padStart(3, "0")
    : spec.gauge.toFixed(0).padStart(2, "0");
  const suffix = spec.construction === "Plain" ? "p" : "w";
  return `.${padded}${suffix}`;
}
