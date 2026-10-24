import { chordName, parsePc, type Chord, type PitchClass, type Quality } from "../common/chord.ts";
import { STANDARD_TUNING } from "./guitar.ts";

/** One fret per string, low E first; null = string not played. */
export type Shape = (number | null)[];

export interface ChordShape {
  root: PitchClass;
  quality: Quality;
  frets: Shape;
  /** Finger per string (1 = index), 0 for open or muted strings. */
  fingers: number[];
  /** A barré shape is movable; it counts as "known" from the first position onward. */
  barre: boolean;
}

function shape(root: string, quality: Quality, frets: string, fingers: string, barre = false): ChordShape {
  return {
    root: parsePc(root),
    quality,
    frets: [...frets].map((c) => (c === "x" ? null : Number(c))),
    fingers: [...fingers].map(Number),
    barre,
  };
}

/** One standard fingering per chord, as beginners' methods teach them. */
export const CHORD_SHAPES: readonly ChordShape[] = [
  shape("C", "major", "x32010", "032010"),
  shape("D", "major", "xx0232", "000132"),
  shape("E", "major", "022100", "023100"),
  shape("G", "major", "320003", "210003"),
  shape("A", "major", "x02220", "001230"),
  shape("A", "minor", "x02210", "002310"),
  shape("D", "minor", "xx0231", "000231"),
  shape("E", "minor", "022000", "023000"),
  shape("F", "major", "133211", "134211", true),
  shape("B", "major", "x24442", "013331", true),
  shape("B", "minor", "x24432", "013421", true),
  shape("F#", "minor", "244222", "134111", true),
  shape("C#", "minor", "x46654", "013421", true),
  shape("G#", "minor", "466444", "134111", true),
];

export function shapeFor(chord: Pick<Chord, "root" | "quality">): ChordShape | undefined {
  return CHORD_SHAPES.find((s) => s.root.letter === chord.root.letter && s.root.acc === chord.root.acc && s.quality === chord.quality);
}

export function shapeName(s: ChordShape): string {
  return chordName({ root: s.root, quality: s.quality });
}

/** Sounding MIDI notes of a shape, low to high. */
export function shapeMidis(frets: Shape): number[] {
  const out: number[] = [];
  frets.forEach((f, i) => {
    if (f !== null) out.push(STANDARD_TUNING[i] + f);
  });
  return out;
}

export function sameShape(a: Shape, b: Shape): boolean {
  return a.length === b.length && a.every((f, i) => f === b[i]);
}

/** Highest fret used by any shape in the list (at least 4), to size the fretboard. */
export function highestFret(shapes: readonly ChordShape[]): number {
  return Math.max(4, ...shapes.flatMap((s) => s.frets.filter((f): f is number => f !== null)));
}
