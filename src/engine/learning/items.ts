import { CLEFS, pitchAtPosition, rangeForLevel, type Clef } from "../common/clef.ts";
import { chordKey, diatonicTriads, keyByTonic, MAJOR_KEYS, pcKey, voicing, type Chord, type Inversion, type Quality } from "../common/chord.ts";
import { midiOf, pitchKey, type Accidental, type Pitch } from "../common/pitch.ts";
import { fretRange, preferredPosition } from "../instruments/guitar.ts";
import { shapeFor } from "../instruments/guitarChords.ts";
import { usesStaff, type ModuleDef } from "./modules.ts";
import type { ModuleSettings } from "./settings.ts";

/** A written note in a clef. The key is stable and used for the FSRS card. */
export interface NoteItem {
  kind: "note";
  key: string;
  clef: Clef;
  pitch: Pitch;
}

/** A triad, with its close-position voicing in the clef it is written in. */
export interface ChordItem {
  kind: "chord";
  key: string;
  clef: Clef;
  chord: Chord;
  voicing: Pitch[];
}

export type LearnItem = NoteItem | ChordItem;

export function itemKey(clef: Clef, pitch: Pitch): string {
  return `${clef}:${pitchKey(pitch)}`;
}

/** Spellings that beginners never meet: E♯, B♯, C♭, F♭. */
function isOddSpelling(p: Pitch): boolean {
  return (p.acc === 1 && (p.letter === "E" || p.letter === "B")) || (p.acc === -1 && (p.letter === "C" || p.letter === "F"));
}

function accidentalsFor(choice: ModuleSettings["accidentals"]): Accidental[] {
  switch (choice) {
    case "none":
      return [0];
    case "sharp":
      return [0, 1];
    case "flat":
      return [0, -1];
    case "both":
      return [0, 1, -1];
  }
}

function clefsFor(module: ModuleDef, choice: ModuleSettings["clefs"]): Clef[] {
  if (module.clefs === "treble" || !usesStaff(module)) return ["treble"];
  return choice === "both" ? [...CLEFS] : [choice];
}

function sorted<T>(rows: { item: T; order: number[] }[]): T[] {
  rows.sort((a, b) => {
    for (let i = 0; i < a.order.length; i++) if (a.order[i] !== b.order[i]) return a.order[i] - b.order[i];
    return 0;
  });
  return rows.map((x) => x.item);
}

/**
 * All items of a module within the settings, in the order they are introduced.
 * Piano and theory: naturals before accidentals, treble before bass, from the middle of the staff outward.
 * Guitar: string by string from the high e down to the low E (as the guitar methods do), naturals first,
 * then up the frets.
 */
export function noteItemsFor(module: ModuleDef, settings: ModuleSettings): NoteItem[] {
  const { min, max } = rangeForLevel(settings.range);
  const sounding = module.answer === "guitar" ? fretRange(4) : null;
  const rows: { item: NoteItem; order: number[] }[] = [];
  for (const clef of clefsFor(module, settings.clefs)) {
    for (const acc of accidentalsFor(settings.accidentals)) {
      for (let pos = min; pos <= max; pos++) {
        const pitch = pitchAtPosition(pos, clef, acc);
        if (isOddSpelling(pitch)) continue;
        let order = [acc === 0 ? 0 : 1, clef === "treble" ? 0 : 1, Math.abs(pos - 4), pos];
        if (sounding) {
          const midi = midiOf(pitch) - module.writtenOffset;
          if (midi < sounding.low || midi > sounding.high) continue;
          const position = preferredPosition(midi)!;
          order = [5 - position.string, acc === 0 ? 0 : 1, position.fret];
        }
        rows.push({ item: { kind: "note", key: itemKey(clef, pitch), clef, pitch }, order });
      }
    }
  }
  return sorted(rows);
}

/** Keys in the order they are introduced: C first, then alternating sharps and flats outward. */
export function keysInOrder(selected: readonly string[]): string[] {
  return MAJOR_KEYS.map((k) => pcKey(k.tonic))
    .filter((k) => selected.includes(k))
    .sort((a, b) => {
      const sa = keyByTonic(a).signature;
      const sb = keyByTonic(b).signature;
      return Math.abs(sa) - Math.abs(sb) || sb - sa;
    });
}

/** Degrees in teaching order: I, V, IV, then vi, ii, iii. */
const DEGREE_ORDER = [1, 5, 4, 6, 2, 3];

/**
 * The triads of a module within the settings: the diatonic major and/or minor triads of the chosen keys,
 * each once, in the order of the keys and degrees; root position before inversions; treble before bass.
 * The guitar module only knows chords with a shape in the table and ignores inversions.
 */
export function chordItemsFor(module: ModuleDef, settings: ModuleSettings): ChordItem[] {
  const qualities: Quality[] = settings.qualities === "both" ? ["major", "minor"] : [settings.qualities];
  const inversions: Inversion[] = settings.inversions && module.answer !== "guitar" ? [0, 1, 2] : [0];
  const clefs = clefsFor(module, settings.clefs);
  const seen = new Set<string>();
  const rows: { item: ChordItem; order: number[] }[] = [];
  keysInOrder(settings.keys).forEach((tonic, keyIndex) => {
    for (const triad of diatonicTriads(keyByTonic(tonic))) {
      if (!qualities.includes(triad.quality)) continue;
      const id = `${pcKey(triad.root)}:${triad.quality}`;
      if (seen.has(id)) continue;
      if (module.answer === "guitar" && !shapeFor(triad)) continue;
      seen.add(id);
      for (const inversion of inversions) {
        const chord: Chord = { root: triad.root, quality: triad.quality, inversion };
        for (const clef of clefs) {
          const key = usesStaff(module) ? `${clef}:${chordKey(chord)}` : chordKey(chord);
          rows.push({
            item: { kind: "chord", key, clef, chord, voicing: voicing(chord, clef) },
            order: [inversion, keyIndex, triad.quality === "major" ? 0 : 1, DEGREE_ORDER.indexOf(triad.degree), clef === "treble" ? 0 : 1],
          });
        }
      }
    }
  });
  return sorted(rows);
}

export function itemsFor(module: ModuleDef, settings: ModuleSettings): LearnItem[] {
  return module.kind === "chord" ? chordItemsFor(module, settings) : noteItemsFor(module, settings);
}
