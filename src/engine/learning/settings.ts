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
  /** New items introduced per session at most. */
  maxNew: number;
}

export const DEFAULT_SETTINGS: ModuleSettings = {
  clefs: "treble",
  range: 0,
  accidentals: "none",
  pianoRange: "auto",
  keyLabels: true,
  sessionLength: 10,
  maxNew: 3,
};

export function withDefaults(partial: Partial<ModuleSettings> | undefined): ModuleSettings {
  return { ...DEFAULT_SETTINGS, ...(partial ?? {}) };
}
