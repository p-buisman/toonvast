import type { RangeLevel } from "../common/clef.ts";
import type { PianoRangeId } from "../instruments/piano.ts";

export type ClefChoice = "treble" | "bass" | "both";
export type AccidentalChoice = "none" | "sharp" | "flat" | "both";
export type SessionLength = 5 | 10 | 20;

export interface ModuleSettings {
  clefs: ClefChoice;
  range: RangeLevel;
  accidentals: AccidentalChoice;
  pianoRange: PianoRangeId;
  /** Octave letters on the C keys of the screen piano. */
  keyLabels: boolean;
  sessionLength: SessionLength;
  /** How many items may be in the learning phase at once; new items only come in when there is room. */
  workingSet: WorkingSet;
}

export type WorkingSet = 2 | 4 | 6;
export const WORKING_SETS: readonly WorkingSet[] = [2, 4, 6];

export const DEFAULT_SETTINGS: ModuleSettings = {
  clefs: "treble",
  range: 0,
  accidentals: "none",
  pianoRange: "auto",
  keyLabels: true,
  sessionLength: 10,
  workingSet: 4,
};

export function withDefaults(partial: Partial<ModuleSettings> | undefined): ModuleSettings {
  const merged = { ...DEFAULT_SETTINGS, ...(partial ?? {}) } as ModuleSettings & { maxNew?: number };
  // Settings saved before the working-set rule carried `maxNew`; it has no meaning any more.
  delete merged.maxNew;
  if (!WORKING_SETS.includes(merged.workingSet)) merged.workingSet = DEFAULT_SETTINGS.workingSet;
  return merged;
}
