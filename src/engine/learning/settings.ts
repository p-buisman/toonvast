import type { RangeLevel } from "../common/clef.ts";
import type { PianoRangeId } from "../instruments/piano.ts";

export type ClefChoice = "treble" | "bass" | "both";
export type AccidentalChoice = "none" | "sharp" | "flat" | "both";
export type QualityChoice = "major" | "minor" | "both";
export type ShapeInput = "choose" | "place";
export type SessionLength = 5 | 10 | 20;
export type WorkingSet = 2 | 4 | 6;
export const WORKING_SETS: readonly WorkingSet[] = [2, 4, 6];

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
  /** Chord modules: the major keys whose diatonic triads are practised (pitch-class keys such as "C", "Bb"). */
  keys: string[];
  qualities: QualityChoice;
  inversions: boolean;
  /** Guitar chords: pick the right diagram, or place the fingers yourself. */
  shapeInput: ShapeInput;
}

export const DEFAULT_SETTINGS: ModuleSettings = {
  clefs: "treble",
  range: 0,
  accidentals: "none",
  pianoRange: "auto",
  keyLabels: true,
  sessionLength: 10,
  workingSet: 4,
  keys: ["C", "G", "F"],
  qualities: "major",
  inversions: false,
  shapeInput: "choose",
};

export function withDefaults(partial: Partial<ModuleSettings> | undefined): ModuleSettings {
  const merged = { ...DEFAULT_SETTINGS, ...(partial ?? {}) } as ModuleSettings & { maxNew?: number };
  // Settings saved before the working-set rule carried `maxNew`; it has no meaning any more.
  delete merged.maxNew;
  if (!WORKING_SETS.includes(merged.workingSet)) merged.workingSet = DEFAULT_SETTINGS.workingSet;
  if (!Array.isArray(merged.keys) || merged.keys.length === 0) merged.keys = [...DEFAULT_SETTINGS.keys];
  return merged;
}
