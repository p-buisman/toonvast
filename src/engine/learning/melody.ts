import { staffPosition, type Clef } from "../common/clef.ts";
import { pcSemitone, scaleOf, type Key } from "../common/chord.ts";
import { diatonicStep, midiOf, pitchAtStep, type Pitch } from "../common/pitch.ts";
import { seeded } from "../common/random.ts";

/** A short melody as scale degrees: 0 = the tonic, -1 = the leading tone below it, 4 = the fifth. */
const LOWEST = -3;
const HIGHEST = 5;
const MIN_NOTES = 6;
const MAX_NOTES = 8;

/** How long each note sounds when a melody is played, and the last one. */
export const NOTE_MS = 520;
export const LAST_NOTE_MS = 1100;

/** The tonic in the octave that keeps a melody of a fifth below to a sixth above within the staff and one ledger line. */
export function tonicPitch(key: Key, clef: Clef): Pitch {
  for (let octave = 2; octave <= 6; octave++) {
    const p: Pitch = { letter: key.tonic.letter, acc: key.tonic.acc, octave };
    const pos = staffPosition(p, clef);
    if (pos >= 0 && pos <= 6) return p;
  }
  throw new Error(`No tonic octave for ${key.tonic.letter}`);
}

/** The note `degree` scale steps from the tonic (negative = below), spelled in the key. */
export function degreePitch(key: Key, clef: Clef, degree: number): Pitch {
  const scale = scaleOf(key);
  const tonic = tonicPitch(key, clef);
  const step = diatonicStep(tonic) + degree;
  const natural = pitchAtStep(step);
  const pc = scale.find((x) => x.letter === natural.letter)!;
  return { letter: pc.letter, acc: pc.acc, octave: natural.octave };
}

/** The scale from the tonic up to the next tonic, eight notes, to show and play a new key. */
export function scaleFor(key: Key, clef: Clef): Pitch[] {
  return Array.from({ length: 8 }, (_, i) => degreePitch(key, clef, i));
}

/** The C nearest the melody's range, played first as a reference when only the ear decides. */
export function referencePitch(key: Key, clef: Clef): Pitch {
  const low = midiOf(degreePitch(key, clef, LOWEST));
  const high = midiOf(degreePitch(key, clef, HIGHEST));
  for (let midi = low; midi <= high; midi++) if (midi % 12 === 0) return { letter: "C", acc: 0, octave: midi / 12 - 1 };
  return { letter: "C", acc: 0, octave: 4 };
}

/**
 * A fresh diatonic melody of six to eight notes: starts on the tonic, third or fifth, moves mostly by step with
 * the odd leap, holds the fifth and the leading tone, and ends on the tonic. The seed makes it repeatable.
 */
export function melodyFor(key: Key, clef: Clef, seed: number): Pitch[] {
  const rnd = seeded(seed);
  const length = MIN_NOTES + Math.floor(rnd() * (MAX_NOTES - MIN_NOTES + 1));
  const degrees: number[] = [[0, 2, 4][Math.floor(rnd() * 3)]];
  // The leading tone leads home: last before the tonic, or one step earlier with the supertonic between.
  const tail = rnd() < 0.3 ? [-1, 1, 0] : [-1, 0];
  const clamp = (d: number) => Math.max(LOWEST, Math.min(HIGHEST, d));
  while (degrees.length < length - tail.length) {
    const current = degrees[degrees.length - 1];
    const r = rnd();
    const size = r < 0.6 ? 1 : r < 0.85 ? 2 : 3 + Math.floor(rnd() * 2);
    // Near the edges the melody turns back towards the middle.
    const up = current <= LOWEST + 1 ? true : current >= HIGHEST - 1 ? false : rnd() < 0.5;
    let next = clamp(current + (up ? size : -size));
    if (next === current) next = clamp(current + (up ? -1 : 1));
    degrees.push(next);
  }
  // The fifth (above or below) must be heard: swap it in halfway when the walk missed it.
  if (!degrees.includes(4) && !degrees.includes(-3)) {
    const at = Math.max(1, Math.floor(degrees.length / 2));
    degrees[at] = degrees[at] >= 1 ? 4 : -3;
  }
  return [...degrees, ...tail].map((d) => degreePitch(key, clef, d));
}

/** The pitch classes of a melody that lie outside the scale of a key; empty when it is diatonic. */
export function outsideScale(key: Key, melody: readonly Pitch[]): Pitch[] {
  const inKey = new Set(scaleOf(key).map(pcSemitone));
  return melody.filter((p) => !inKey.has(((midiOf(p) % 12) + 12) % 12));
}
