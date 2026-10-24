import { CLEFS, pitchAtPosition, rangeForLevel, type Clef } from "../common/clef.ts";
import { midiOf, pitchKey, type Accidental, type Pitch } from "../common/pitch.ts";
import { fretRange, preferredPosition } from "../instruments/guitar.ts";
import type { ModuleDef } from "./modules.ts";
import type { ModuleSettings } from "./settings.ts";

/** One thing to learn: a written note in a clef. The key is stable and used for the FSRS card. */
export interface LearnItem {
  key: string;
  clef: Clef;
  pitch: Pitch;
}

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
  if (module.clefs === "treble") return ["treble"];
  return choice === "both" ? [...CLEFS] : [choice];
}

/**
 * All items of a module within the settings, in the order they are introduced.
 * Piano and theory: naturals before accidentals, treble before bass, from the middle of the staff outward.
 * Guitar: string by string from the high e down to the low E (as the guitar methods do), naturals first,
 * then up the frets.
 */
export function itemsFor(module: ModuleDef, settings: ModuleSettings): LearnItem[] {
  const { min, max } = rangeForLevel(settings.range);
  const sounding = module.answer === "guitar" ? fretRange(4) : null;
  const items: { item: LearnItem; order: number[] }[] = [];
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
        items.push({ item: { key: itemKey(clef, pitch), clef, pitch }, order });
      }
    }
  }
  items.sort((a, b) => {
    for (let i = 0; i < a.order.length; i++) if (a.order[i] !== b.order[i]) return a.order[i] - b.order[i];
    return 0;
  });
  return items.map((x) => x.item);
}
