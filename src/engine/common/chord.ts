import { pitchAtPosition, rangeForLevel, type Clef } from "./clef.ts";
import { ACCIDENTAL_SYMBOL, LETTERS, midiOf, type Accidental, type Letter, type Pitch } from "./pitch.ts";

/** A pitch class with its spelling, no octave: the root of a chord or the tonic of a key. */
export interface PitchClass {
  letter: Letter;
  acc: Accidental;
}

export type Quality = "major" | "minor";
export const QUALITY_NAME: Record<Quality, string> = { major: "majeur", minor: "mineur" };
/** 0 = root position, 1 = first inversion (third in the bass), 2 = second inversion (fifth in the bass). */
export type Inversion = 0 | 1 | 2;
export const INVERSION_NAME: Record<Inversion, string> = { 0: "grondligging", 1: "1e omkering", 2: "2e omkering" };

export interface Chord {
  root: PitchClass;
  quality: Quality;
  inversion: Inversion;
}

const SEMITONE: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function pcKey(pc: PitchClass): string {
  return `${pc.letter}${pc.acc === 1 ? "#" : pc.acc === -1 ? "b" : ""}`;
}

export function pcName(pc: PitchClass): string {
  return `${pc.letter}${ACCIDENTAL_SYMBOL[pc.acc]}`;
}

export function parsePc(key: string): PitchClass {
  const m = /^([A-G])([#b]?)$/.exec(key);
  if (!m) throw new Error(`Bad pitch class ${key}`);
  return { letter: m[1] as Letter, acc: m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0 };
}

export function pcSemitone(pc: PitchClass): number {
  return (((SEMITONE[pc.letter] + pc.acc) % 12) + 12) % 12;
}

/** The pitch class `steps` letters above `from` that lies `semitones` higher, spelled with the right accidental. */
export function pcAbove(from: PitchClass, steps: number, semitones: number): PitchClass {
  const letter = LETTERS[(LETTERS.indexOf(from.letter) + steps) % 7];
  const natural = SEMITONE[letter];
  const wanted = (pcSemitone(from) + semitones) % 12;
  let acc = wanted - natural;
  if (acc > 6) acc -= 12;
  if (acc < -6) acc += 12;
  if (acc < -1 || acc > 1) throw new Error(`No simple spelling for ${pcName(from)} + ${semitones}`);
  return { letter, acc: acc as Accidental };
}

/** Root, third and fifth of a triad, spelled from the root. */
export function triadPcs(root: PitchClass, quality: Quality): [PitchClass, PitchClass, PitchClass] {
  return [root, pcAbove(root, 2, quality === "major" ? 4 : 3), pcAbove(root, 4, 7)];
}

/** "C", "Dm", "B♭", "F♯m". */
export function chordName(chord: Pick<Chord, "root" | "quality">): string {
  return `${pcName(chord.root)}${chord.quality === "minor" ? "m" : ""}`;
}

export function chordKey(chord: Chord): string {
  return `${pcKey(chord.root)}:${chord.quality === "major" ? "M" : "m"}:${chord.inversion}`;
}

export function parseChordKey(key: string): Chord {
  const [root, q, inv] = key.split(":");
  return { root: parsePc(root), quality: q === "M" ? "major" : "minor", inversion: Number(inv) as Inversion };
}

export function sameChord(a: Chord, b: Chord): boolean {
  return chordKey(a) === chordKey(b);
}

/** The chord's notes from the bass up, as pitch classes in the given inversion. */
export function chordPcs(chord: Chord): PitchClass[] {
  const [r, t, f] = triadPcs(chord.root, chord.quality);
  return chord.inversion === 0 ? [r, t, f] : chord.inversion === 1 ? [t, f, r] : [f, r, t];
}

/** Where close-position voicings start: the bass note sits in this diatonic window of the clef. */
const BASS_WINDOW: Record<Clef, { from: Pitch; to: Pitch }> = {
  treble: { from: { letter: "C", acc: 0, octave: 4 }, to: { letter: "B", acc: 0, octave: 4 } },
  bass: { from: { letter: "E", acc: 0, octave: 2 }, to: { letter: "D", acc: 0, octave: 3 } },
};

/** Close-position voicing of a chord written in a clef: three pitches, bass first, fitting on the staff. */
export function voicing(chord: Chord, clef: Clef): Pitch[] {
  const pcs = chordPcs(chord);
  const { from, to } = BASS_WINDOW[clef];
  // Choose the octave of the bass note so that it lands in the window.
  let octave = from.octave;
  const stepOf = (p: Pitch) => p.octave * 7 + LETTERS.indexOf(p.letter);
  const fromStep = stepOf(from);
  const toStep = stepOf(to);
  let bass: Pitch = { ...pcs[0], octave };
  while (stepOf(bass) < fromStep) bass = { ...bass, octave: ++octave };
  while (stepOf(bass) > toStep) bass = { ...bass, octave: --octave };
  const out: Pitch[] = [bass];
  for (let i = 1; i < 3; i++) {
    let p: Pitch = { ...pcs[i], octave: out[i - 1].octave };
    if (midiOf(p) <= midiOf(out[i - 1])) p = { ...p, octave: p.octave + 1 };
    out.push(p);
  }
  return out;
}

/** Does the voicing stay within the staff plus the allowed ledger lines? */
export function voicingFits(notes: Pitch[], clef: Clef, level: 0 | 1 | 2): boolean {
  const { min, max } = rangeForLevel(level);
  const posOf = (p: Pitch) =>
    p.octave * 7 + LETTERS.indexOf(p.letter) - (pitchAtPosition(0, clef).octave * 7 + LETTERS.indexOf(pitchAtPosition(0, clef).letter));
  return notes.every((n) => posOf(n) >= min && posOf(n) <= max);
}

// Keys

export interface Key {
  tonic: PitchClass;
  /** Number of sharps (positive) or flats (negative) in the signature. */
  signature: number;
}

/** Major keys in circle-of-fifths order, C in the middle. */
export const MAJOR_KEYS: readonly Key[] = [
  { tonic: parsePc("Gb"), signature: -6 },
  { tonic: parsePc("Db"), signature: -5 },
  { tonic: parsePc("Ab"), signature: -4 },
  { tonic: parsePc("Eb"), signature: -3 },
  { tonic: parsePc("Bb"), signature: -2 },
  { tonic: parsePc("F"), signature: -1 },
  { tonic: parsePc("C"), signature: 0 },
  { tonic: parsePc("G"), signature: 1 },
  { tonic: parsePc("D"), signature: 2 },
  { tonic: parsePc("A"), signature: 3 },
  { tonic: parsePc("E"), signature: 4 },
  { tonic: parsePc("B"), signature: 5 },
  { tonic: parsePc("F#"), signature: 6 },
];

export function keyName(key: Key): string {
  return `${pcName(key.tonic)}-groot`;
}

export function keyByTonic(tonic: string): Key {
  const k = MAJOR_KEYS.find((x) => pcKey(x.tonic) === tonic);
  if (!k) throw new Error(`Unknown key ${tonic}`);
  return k;
}

/** The major triads (I, IV, V) and minor triads (ii, iii, vi) of a major key. */
export function diatonicTriads(key: Key): { root: PitchClass; quality: Quality; degree: number }[] {
  const t = key.tonic;
  return [
    { root: t, quality: "major", degree: 1 },
    { root: pcAbove(t, 1, 2), quality: "minor", degree: 2 },
    { root: pcAbove(t, 2, 4), quality: "minor", degree: 3 },
    { root: pcAbove(t, 3, 5), quality: "major", degree: 4 },
    { root: pcAbove(t, 4, 7), quality: "major", degree: 5 },
    { root: pcAbove(t, 5, 9), quality: "minor", degree: 6 },
  ];
}
