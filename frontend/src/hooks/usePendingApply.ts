import { useCallback, useMemo, useState } from "react";
import type { AppliedRecommendation } from "@/pages/gear/GuitarDetailPage";

/**
 * Tracks a recommendation the user has chosen to "apply" but not yet
 * submitted. `formKey` is derived from the recommendation's content so a form
 * keyed on it remounts when (and only when) the values to apply actually
 * change — applying an identical recommendation twice keeps the user's edits.
 */
export function usePendingApply() {
  const [pending, setPending] = useState<AppliedRecommendation | null>(null);

  const apply = useCallback((rec: AppliedRecommendation) => setPending(rec), []);
  const clear = useCallback(() => setPending(null), []);

  const initialFormValues = useMemo(() => {
    if (!pending) return undefined;
    return {
      date: new Date().toISOString().slice(0, 10),
      stringBrand: pending.brand,
      stringGauge: pending.gauges.join("-"),
    };
  }, [pending]);

  const formKey = pending
    ? [
        pending.brand,
        pending.gauges.join("-"),
        (pending.tuning.notes ?? []).map((n) => `${n.name}${n.octave}`).join(","),
      ].join("|")
    : "default";

  return { pending, apply, clear, initialFormValues, formKey };
}
