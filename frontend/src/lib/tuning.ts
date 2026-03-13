import type { components } from "@/api/schema";

type Note = components["schemas"]["Note"];
type NoteName = components["schemas"]["NoteName"];

/** Map of known tuning fingerprints (note names only, low→high) to display names */
const KNOWN_TUNINGS: Record<string, string> = {
  // 6-string
  "E,A,D,G,B,E": "E Standard",
  "D,A,D,G,B,E": "Drop D",
  "D,G,C,F,A,D": "D Standard",
  "C,F,As,Ds,G,C": "C Standard",
  "C,G,C,F,A,D": "Drop C",
  // 7-string
  "B,E,A,D,G,B,E": "B Standard",
  "A,E,A,D,G,B,E": "Drop A",
  "G,D,G,C,F,A,D": "Drop G",
};

function formatNoteName(name: NoteName): string {
  return name.replace("s", "#");
}

export function formatNotes(notes: Note[]): string {
  if (!notes || notes.length === 0) return "-";
  return notes.map((n) => formatNoteName(n.name)).join(" ");
}

/** Returns a friendly tuning name if known, or null */
export function getTuningName(notes: Note[]): string | null {
  if (!notes || notes.length === 0) return null;
  const key = notes.map((n) => n.name).join(",");
  return KNOWN_TUNINGS[key] ?? null;
}

/** Returns the display label: tuning name if known, otherwise note names */
export function formatTuningLabel(notes: Note[]): string {
  if (!notes || notes.length === 0) return "-";
  return getTuningName(notes) ?? formatNotes(notes);
}
