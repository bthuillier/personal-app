import { useEffect, useMemo, useState } from "react";
import type { components } from "@/api/schema";
import { useStringRecommendation } from "@/api/mutations";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  findTuningByName,
  formatNote,
  getTuningName,
  tuningsForStringCount,
} from "@/lib/tuning";
import { formatStringSpec } from "@/lib/strings";
import { cn } from "@/lib/utils";
import type { AppliedRecommendation } from "./GuitarDetailPage";

type Guitar = components["schemas"]["Guitar"];
type StringRecommendation = components["schemas"]["StringRecommendation"];

const NYXL_BRAND = "D'Addario NYXL";

const WARNING_DELTA_LBS = 1.0;
const ALERT_DELTA_LBS = 2.0;

function deltaClassName(deltaLbs: number): string {
  const abs = Math.abs(deltaLbs);
  if (abs > ALERT_DELTA_LBS) return "text-destructive font-medium";
  if (abs > WARNING_DELTA_LBS) return "text-amber-600 dark:text-amber-500";
  return "text-muted-foreground";
}

function formatDelta(deltaLbs: number): string {
  const sign = deltaLbs >= 0 ? "+" : "";
  return `${sign}${deltaLbs.toFixed(2)}`;
}

interface StringRecommendationPanelProps {
  guitar: Guitar;
  onApply?: (recommendation: AppliedRecommendation) => void;
}

export function StringRecommendationPanel({
  guitar,
  onApply,
}: StringRecommendationPanelProps) {
  const stringCount = guitar.specifications.numberOfStrings;
  const availableTunings = useMemo(
    () => tuningsForStringCount(stringCount),
    [stringCount],
  );
  const [selectedName, setSelectedName] = useState<string>(
    () =>
      getTuningName(guitar.setup.tuning.notes ?? []) ??
      availableTunings[0]?.name ??
      "",
  );

  const mutation = useStringRecommendation(guitar.id);
  const { mutateAsync } = mutation;

  // Hold the most recent successful response locally — TanStack `useMutation`
  // clears `data` while a new request is pending, but we want the previous
  // values to stay visible (and the layout stable) until the new ones arrive.
  const [recommendations, setRecommendations] = useState<StringRecommendation[]>(
    [],
  );

  // Auto-fetch whenever the user picks a different tuning (and once on mount
  // for the guitar's current tuning). `mutateAsync` is referentially stable
  // across renders so this only re-runs when `selectedName` changes.
  useEffect(() => {
    const tuning = findTuningByName(selectedName, stringCount);
    if (!tuning) return;
    let cancelled = false;
    mutateAsync({ targetTuning: { notes: tuning.notes } }).then((result) => {
      if (!cancelled) setRecommendations(result.recommendations ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedName, stringCount, mutateAsync]);

  // Display thickest (low pitch) first, matching how guitarists read a string set.
  const orderedRecs = [...recommendations].reverse();
  // Only show loading placeholders when there's nothing to display yet — on
  // subsequent fetches, the previous result stays visible until the new one
  // arrives, so values just update in place.
  const showLoadingRows = mutation.isPending && recommendations.length === 0;

  function handleApply() {
    const tuning = findTuningByName(selectedName, stringCount);
    if (!tuning || recommendations.length === 0) return;
    // Recommendations come back low-pitch first; the user-stored gauge list
    // is thin → thick (high pitch first), so reverse to align.
    const gauges = [...recommendations]
      .reverse()
      .map((r) => r.spec.gauge);
    onApply?.({
      brand: NYXL_BRAND,
      gauges,
      tuning: { notes: tuning.notes },
    });
  }

  return (
    <section className="rounded-lg border border-border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Try Another Tuning
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Find NYXL gauges that match the current setup&apos;s tension on a different tuning.
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground" htmlFor="target-tuning">
            Target tuning
          </label>
          <Select value={selectedName} onValueChange={(v) => v && setSelectedName(v)}>
            <SelectTrigger id="target-tuning" className="min-w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTunings.map((t) => (
                <SelectItem key={t.name} value={t.name}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {mutation.isPending && (
          <span className="text-xs text-muted-foreground pb-2">Computing…</span>
        )}
      </div>

      {availableTunings.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No preset tunings available for {stringCount}-string guitars.
        </p>
      )}

      {mutation.isError && (
        <p className="text-sm text-destructive">
          Failed to compute a recommendation. Check the guitar&apos;s current setup.
        </p>
      )}

      {(showLoadingRows || orderedRecs.length > 0) && (
        <>
          <Table className="table-fixed">
            <colgroup>
              <col className="w-20" />
              <col className="w-24" />
              <col />
              <col />
              <col className="w-20" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Note</TableHead>
                <TableHead>Gauge</TableHead>
                <TableHead className="text-right">Tension (lbs)</TableHead>
                <TableHead className="text-right">Reference (lbs)</TableHead>
                <TableHead className="text-right">Δ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(showLoadingRows
                ? Array.from({ length: stringCount }, () => null)
                : orderedRecs
              ).map((r, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono">
                    {r ? formatNote(r.note) : " "}
                  </TableCell>
                  <TableCell className="font-mono">
                    {r ? formatStringSpec(r.spec) : " "}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r ? r.tensionLbs.toFixed(2) : " "}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {r ? r.referenceTensionLbs.toFixed(2) : " "}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      r ? deltaClassName(r.deltaLbs) : undefined,
                    )}
                  >
                    {r ? formatDelta(r.deltaLbs) : " "}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {onApply && (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleApply} disabled={showLoadingRows}>
                Apply as new setup
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
