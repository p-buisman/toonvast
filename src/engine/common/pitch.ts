/** A pitch with its spelling: the letter, the accidental and the scientific octave (C4 = middle C = MIDI 60). */
export type Letter = "C" | "D" | "E" | "F" | "G" | "A" | "B";
/** -1 = flat, 0 = natural, 1 = sharp. */
export type Accidental = -1 | 0 | 1;

export interface Pitch {
  letter: Letter;
  acc: Accidental;
  octave: number;
}

export const LETTERS: readonly Letter[] = ["C", "D", "E", "F", "G", "A", "B"];
const SEMITONES: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function pitch(letter: Letter, acc: Accidental, octave: number): Pitch {
  return { letter, acc, octave };
}

/** MIDI note number; B♯3 and C4 both give 60. */
export function midiOf(p: Pitch): number {
  return 12 * (p.octave + 1) + SEMITONES[p.letter] + p.acc;
}

/** Position on the diatonic ladder (C0 = 0, D0 = 1, ... C4 = 28); the accidental plays no part. */
export function diatonicStep(p: Pitch): number {
  return p.octave * 7 + LETTERS.indexOf(p.letter);
}

export function pitchAtStep(step: number, acc: Accidental = 0): Pitch {
  const octave = Math.floor(step / 7);
  return { letter: LETTERS[step - octave * 7], acc, octave };
}

/** Stable ASCII key for storage: "C#4", "Bb3", "E4". */
export function pitchKey(p: Pitch): string {
  return `${p.letter}${p.acc === 1 ? "#" : p.acc === -1 ? "b" : ""}${p.octave}`;
}

export function parsePitchKey(key: string): Pitch {
  const m = /^([A-G])([#b]?)(-?\d+)$/.exec(key);
  if (!m) throw new Error(`Bad pitch key: ${key}`);
  return { letter: m[1] as Letter, acc: m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0, octave: Number(m[3]) };
}

export const ACCIDENTAL_SYMBOL: Record<Accidental, string> = { [-1]: "♭", 0: "", 1: "♯" };

/** Display name: "C♯", or "C♯4" with the octave. */
export function pitchName(p: Pitch, withOctave = false): string {
  return `${p.letter}${ACCIDENTAL_SYMBOL[p.acc]}${withOctave ? p.octave : ""}`;
}

export function sameSound(a: Pitch, b: Pitch): boolean {
  return midiOf(a) === midiOf(b);
}

export function sameSpelling(a: Pitch, b: Pitch): boolean {
  return a.letter === b.letter && a.acc === b.acc && a.octave === b.octave;
}

const NATURAL_OF_SEMITONE: (Letter | null)[] = ["C", null, "D", null, "E", "F", null, "G", null, "A", null, "B"];

/** Spell a MIDI number: natural where possible, otherwise with a sharp or a flat. */
export function spellMidi(midi: number, prefer: "sharp" | "flat" = "sharp"): Pitch {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = midi - 12 * (octave + 1);
  const natural = NATURAL_OF_SEMITONE[semitone];
  if (natural) return { letter: natural, acc: 0, octave };
  if (prefer === "sharp") return { letter: NATURAL_OF_SEMITONE[semitone - 1] as Letter, acc: 1, octave };
  return { letter: NATURAL_OF_SEMITONE[semitone + 1] as Letter, acc: -1, octave };
}

export function transpose(p: Pitch, semitones: number): Pitch {
  // Keep the spelling family: an octave shift keeps the letter, anything else is respelled.
  if (semitones % 12 === 0) return { ...p, octave: p.octave + semitones / 12 };
  return spellMidi(midiOf(p) + semitones, p.acc === -1 ? "flat" : "sharp");
}
