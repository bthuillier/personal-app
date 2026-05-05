import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import type { components } from "@/api/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  findTuningByName,
  formatTuningText,
  getTuningName,
  parseTuningText,
  tuningsForStringCount,
} from "@/lib/tuning";

type GuitarTuning = components["schemas"]["GuitarTuning"];

const CUSTOM = "__custom__";

export interface ChangeStringsFormValues {
  date: string;
  stringBrand: string;
  stringGauge: string;
  tuning: GuitarTuning;
}

/** Prefilled values used when applying a recommendation. */
export interface ChangeStringsInitialValues {
  date: string;
  stringBrand: string;
  stringGauge: string;
  tuning?: GuitarTuning;
}

interface ChangeStringsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ChangeStringsFormValues) => void | Promise<void>;
  /** Number of strings on the guitar — drives which tuning presets are shown. */
  stringCount: number;
  /** Tuning currently on the guitar; used as the default. */
  currentTuning: GuitarTuning;
  /** Prefilled values (e.g. when applying a recommendation). */
  initialValues?: ChangeStringsInitialValues;
}

interface FormState {
  date: string;
  stringBrand: string;
  stringGauge: string;
  tuningName: string; // preset name or CUSTOM
  tuningText: string; // only meaningful when tuningName === CUSTOM
}

function emptyState(currentTuning: GuitarTuning): FormState {
  const notes = currentTuning.notes ?? [];
  const presetName = getTuningName(notes);
  return {
    date: "",
    stringBrand: "",
    stringGauge: "",
    tuningName: presetName ?? CUSTOM,
    tuningText: presetName ? "" : formatTuningText(notes),
  };
}

function stateFromInitial(
  initial: ChangeStringsInitialValues,
  currentTuning: GuitarTuning,
): FormState {
  const tuning = initial.tuning ?? currentTuning;
  const notes = tuning.notes ?? [];
  const presetName = getTuningName(notes);
  return {
    date: initial.date,
    stringBrand: initial.stringBrand,
    stringGauge: initial.stringGauge,
    tuningName: presetName ?? CUSTOM,
    tuningText: presetName ? "" : formatTuningText(notes),
  };
}

export function ChangeStringsDrawer({
  open,
  onOpenChange,
  onSubmit,
  stringCount,
  currentTuning,
  initialValues,
}: ChangeStringsDrawerProps) {
  const presets = useMemo(
    () => tuningsForStringCount(stringCount),
    [stringCount],
  );

  const [state, setState] = useState<FormState>(() =>
    initialValues
      ? stateFromInitial(initialValues, currentTuning)
      : emptyState(currentTuning),
  );
  const [tuningError, setTuningError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setState(
        initialValues
          ? stateFromInitial(initialValues, currentTuning)
          : emptyState(currentTuning),
      );
      setTuningError(null);
    }
  }, [open, initialValues, currentTuning]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function resolveTuning(): GuitarTuning | { error: string } {
    if (state.tuningName !== CUSTOM) {
      const preset = findTuningByName(state.tuningName, stringCount);
      if (!preset) return { error: "Unknown tuning preset." };
      return { notes: preset.notes };
    }
    const notes = parseTuningText(state.tuningText);
    if (!notes) {
      return {
        error: "Couldn't parse tuning. Use notes with octaves, e.g. E2 A2 D3 G3 B3 E4.",
      };
    }
    if (notes.length !== stringCount) {
      return {
        error: `This guitar has ${stringCount} strings; got ${notes.length} notes.`,
      };
    }
    return { notes };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const tuning = resolveTuning();
    if ("error" in tuning) {
      setTuningError(tuning.error);
      return;
    }
    setTuningError(null);
    await onSubmit({
      date: state.date,
      stringBrand: state.stringBrand,
      stringGauge: state.stringGauge,
      tuning,
    });
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Change Strings</SheetTitle>
          <SheetDescription>
            Record a new set of strings for this guitar.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 px-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              required
              value={state.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stringBrand">String Brand</Label>
            <Input
              id="stringBrand"
              required
              value={state.stringBrand}
              onChange={(e) => update("stringBrand", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stringGauge">Gauge (e.g. 10-46)</Label>
            <Input
              id="stringGauge"
              required
              value={state.stringGauge}
              onChange={(e) => update("stringGauge", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tuning">Tuning</Label>
            <Select
              value={state.tuningName}
              onValueChange={(val) => {
                if (val != null) update("tuningName", val);
              }}
            >
              <SelectTrigger id="tuning" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presets.map((t) => (
                  <SelectItem key={t.name} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM}>Custom…</SelectItem>
              </SelectContent>
            </Select>
            {state.tuningName === CUSTOM && (
              <Input
                id="tuningText"
                placeholder="E2 A2 D3 G3 B3 E4"
                value={state.tuningText}
                onChange={(e) => update("tuningText", e.target.value)}
              />
            )}
            {tuningError && (
              <p className="text-xs text-destructive">{tuningError}</p>
            )}
          </div>

          <SheetFooter className="px-0">
            <Button type="submit">Save</Button>
            <SheetClose
              render={<Button type="button" variant="outline" />}
            >
              Cancel
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
