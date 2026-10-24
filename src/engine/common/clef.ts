import { diatonicStep, pitchAtStep, type Accidental, type Pitch } from "./pitch.ts";

export type Clef = "treble" | "bass";
export const CLEFS: readonly Clef[] = ["treble", "bass"];
export const CLEF_NAME: Record<Clef, string> = { treble: "Vioolsleutel", bass: "Bassleutel" };

/** Diatonic step of the bottom staff line: E4 for the treble clef, G2 for the bass clef. */
const BOTTOM_LINE_STEP: Record<Clef, number> = {
  treble: diatonicStep({ letter: "E", acc: 0, octave: 4 }),
  bass: diatonicStep({ letter: "G", acc: 0, octave: 2 }),
};

/** Staff position: 0 = bottom line, 1 = first space, 8 = top line; negative below, > 8 above. */
export function staffPosition(p: Pitch, clef: Clef): number {
  return diatonicStep(p) - BOTTOM_LINE_STEP[clef];
}

export function pitchAtPosition(position: number, clef: Clef, acc: Accidental = 0): Pitch {
  return pitchAtStep(position + BOTTOM_LINE_STEP[clef], acc);
}

/** Positions of the ledger lines a note at this position needs (even positions outside 0..8). */
export function ledgerLines(position: number): number[] {
  const lines: number[] = [];
  for (let p = -2; p >= position; p -= 2) lines.push(p);
  for (let p = 10; p <= position; p += 2) lines.push(p);
  return lines;
}

/** 0 = within the lines (no ledger lines), 1 = up to one ledger line, 2 = up to two. */
export type RangeLevel = 0 | 1 | 2;
export const RANGE_LEVEL_NAME: Record<RangeLevel, string> = { 0: "Binnen de lijnen", 1: "1 hulplijn", 2: "2 hulplijnen" };

export function rangeForLevel(level: RangeLevel): { min: number; max: number } {
  return { min: -1 - 2 * level, max: 9 + 2 * level };
}
