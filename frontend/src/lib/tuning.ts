import type { components } from "@/api/schema";

type Note = components["schemas"]["Note"];
type NoteName = components["schemas"]["NoteName"];

export interface NamedTuning {
  name: string;
  notes: Note[];
}

// Registry of known tunings, low-pitch → high-pitch (matches the backend's
// SortedSet[Note] ascending iteration).
const TUNINGS: NamedTuning[] = [
  // 6-string
  {
    name: "E Standard",
    notes: [
      { name: "E", octave: 2 },
      { name: "A", octave: 2 },
      { name: "D", octave: 3 },
      { name: "G", octave: 3 },
      { name: "B", octave: 3 },
      { name: "E", octave: 4 },
    ],
  },
  {
    name: "Eb Standard",
    notes: [
      { name: "Ds", octave: 2 },
      { name: "Gs", octave: 2 },
      { name: "Cs", octave: 3 },
      { name: "Fs", octave: 3 },
      { name: "As", octave: 3 },
      { name: "Ds", octave: 4 },
    ],
  },
  {
    name: "Drop D",
    notes: [
      { name: "D", octave: 2 },
      { name: "A", octave: 2 },
      { name: "D", octave: 3 },
      { name: "G", octave: 3 },
      { name: "B", octave: 3 },
      { name: "E", octave: 4 },
    ],
  },
  {
    name: "Drop C#",
    notes: [
      { name: "Cs", octave: 2 },
      { name: "Gs", octave: 2 },
      { name: "Cs", octave: 3 },
      { name: "Fs", octave: 3 },
      { name: "As", octave: 3 },
      { name: "Ds", octave: 4 },
    ],
  },
  {
    name: "D Standard",
    notes: [
      { name: "D", octave: 2 },
      { name: "G", octave: 2 },
      { name: "C", octave: 3 },
      { name: "F", octave: 3 },
      { name: "A", octave: 3 },
      { name: "D", octave: 4 },
    ],
  },
  {
    name: "C# Standard",
    notes: [
      { name: "Cs", octave: 2 },
      { name: "Fs", octave: 2 },
      { name: "B", octave: 2 },
      { name: "E", octave: 3 },
      { name: "Gs", octave: 3 },
      { name: "Cs", octave: 4 },
    ],
  },
  {
    name: "C Standard",
    notes: [
      { name: "C", octave: 2 },
      { name: "F", octave: 2 },
      { name: "As", octave: 2 },
      { name: "Ds", octave: 3 },
      { name: "G", octave: 3 },
      { name: "C", octave: 4 },
    ],
  },
  {
    name: "B Standard",
    notes: [
      { name: "B", octave: 1 },
      { name: "E", octave: 2 },
      { name: "A", octave: 2 },
      { name: "D", octave: 3 },
      { name: "Fs", octave: 3 },
      { name: "B", octave: 3 },
    ],
  },
  {
    name: "Drop C",
    notes: [
      { name: "C", octave: 2 },
      { name: "G", octave: 2 },
      { name: "C", octave: 3 },
      { name: "F", octave: 3 },
      { name: "A", octave: 3 },
      { name: "D", octave: 4 },
    ],
  },
  {
    name: "Drop B",
    notes: [
      { name: "B", octave: 1 },
      { name: "Fs", octave: 2 },
      { name: "B", octave: 2 },
      { name: "E", octave: 3 },
      { name: "Gs", octave: 3 },
      { name: "Cs", octave: 4 },
    ],
  },
  {
    name: "Drop A#",
    notes: [
      { name: "As", octave: 1 },
      { name: "F", octave: 2 },
      { name: "As", octave: 2 },
      { name: "Ds", octave: 3 },
      { name: "G", octave: 3 },
      { name: "C", octave: 4 },
    ],
  },
  // 7-string
  {
    name: "B Standard",
    notes: [
      { name: "B", octave: 1 },
      { name: "E", octave: 2 },
      { name: "A", octave: 2 },
      { name: "D", octave: 3 },
      { name: "G", octave: 3 },
      { name: "B", octave: 3 },
      { name: "E", octave: 4 },
    ],
  },
  {
    name: "Drop A",
    notes: [
      { name: "A", octave: 1 },
      { name: "E", octave: 2 },
      { name: "A", octave: 2 },
      { name: "D", octave: 3 },
      { name: "G", octave: 3 },
      { name: "B", octave: 3 },
      { name: "E", octave: 4 },
    ],
  },
  {
    name: "Drop G",
    notes: [
      { name: "G", octave: 1 },
      { name: "D", octave: 2 },
      { name: "G", octave: 2 },
      { name: "C", octave: 3 },
      { name: "F", octave: 3 },
      { name: "A", octave: 3 },
      { name: "D", octave: 4 },
    ],
  },
];

function fingerprint(notes: Note[]): string {
  return notes.map((n) => `${n.name}${n.octave}`).join(",");
}

const TUNING_BY_FINGERPRINT: Record<string, string> = Object.fromEntries(
  TUNINGS.map((t) => [fingerprint(t.notes), t.name]),
);

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
  return TUNING_BY_FINGERPRINT[fingerprint(notes)] ?? null;
}

/** Returns the display label: tuning name if known, otherwise note names */
export function formatTuningLabel(notes: Note[]): string {
  if (!notes || notes.length === 0) return "-";
  return getTuningName(notes) ?? formatNotes(notes);
}

/** Tunings available for a given string count */
export function tuningsForStringCount(count: number): NamedTuning[] {
  return TUNINGS.filter((t) => t.notes.length === count);
}

export function findTuningByName(
  name: string,
  stringCount: number,
): NamedTuning | undefined {
  return TUNINGS.find(
    (t) => t.name === name && t.notes.length === stringCount,
  );
}

/** Format a single note for display, e.g. {E, 2} → "E2" */
export function formatNote(note: Note): string {
  return `${formatNoteName(note.name)}${note.octave}`;
}
