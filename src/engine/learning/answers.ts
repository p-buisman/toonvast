import {
  chordName,
  chordPcs,
  INVERSION_NAME,
  pcKey,
  pcName,
  pcSemitone,
  QUALITY_NAME,
  type Inversion,
  type PitchClass,
  type Quality,
} from "../common/chord.ts";
import { midiOf, pitchName, sameSpelling, spellMidi, type Accidental, type Letter, type Pitch } from "../common/pitch.ts";
import { midiAt, positionsFor, type FretPosition } from "../instruments/guitar.ts";
import { sameShape, shapeFor, shapeMidis, type ChordShape, type Shape } from "../instruments/guitarChords.ts";
import type { ChordItem, LearnItem, NoteItem } from "./items.ts";
import { playsShape, type ModuleDef } from "./modules.ts";

export type Answer =
  | { kind: "name"; letter: Letter; acc: Accidental }
  | { kind: "piano"; midi: number }
  | { kind: "guitar"; pos: FretPosition }
  | { kind: "chordName"; root: PitchClass; quality: Quality; inversion: Inversion | null }
  | { kind: "pianoSet"; midis: number[] }
  | { kind: "staffSet"; pitches: Pitch[] }
  | { kind: "shape"; frets: Shape }
  | { kind: "shapeChoice"; shape: ChordShape };

export interface Verdict {
  correct: boolean;
  /** A short explanation for a near miss, in Dutch, shown with the right answer. */
  note?: string;
}

/** The MIDI number that sounds for a written pitch (the guitar is written an octave up). */
export function soundingMidi(module: ModuleDef, pitch: Pitch): number {
  return midiOf(pitch) - module.writtenOffset;
}

/** Both spellings of a black key: "C♯ (D♭)". */
export function heardName(p: Pitch): string {
  if (p.acc === 0) return pitchName(p);
  const other = spellMidi(midiOf(p), p.acc === 1 ? "flat" : "sharp");
  return `${pitchName(p)} (${pitchName(other)})`;
}

/** What the player had to give, in words, for the feedback card. */
export function describeTarget(module: ModuleDef, item: LearnItem): string {
  if (item.kind === "note") return module.question === "sound" ? heardName(item.pitch) : pitchName(item.pitch);
  const name = chordName(item.chord);
  const inversion = item.chord.inversion !== 0 || module.answer === "staff" || module.question === "staff" ? ` (${INVERSION_NAME[item.chord.inversion]})` : "";
  // When the notes had to be given, name them too, from the bass up.
  const notes = module.answer === "piano" || module.answer === "staff" ? `: ${chordPcs(item.chord).map(pcName).join(" – ")}` : "";
  return `${name}${inversion}${notes}`;
}

function octaveNote(target: number, given: number): string | undefined {
  if (target % 12 !== given % 12) return undefined;
  const diff = (given - target) / 12;
  return `Dat is wel dezelfde noot, maar ${Math.abs(diff) === 1 ? "een octaaf" : `${Math.abs(diff)} octaven`} te ${diff > 0 ? "hoog" : "laag"}.`;
}

function checkNote(module: ModuleDef, item: NoteItem, answer: Answer): Verdict {
  const target = soundingMidi(module, item.pitch);
  switch (answer.kind) {
    case "name": {
      const p = item.pitch;
      if (answer.letter === p.letter && answer.acc === p.acc) return { correct: true };
      if (answer.letter === p.letter) return { correct: false, note: `Let op het voorteken: er staat ${pitchName(p)}.` };
      const given = midiOf({ letter: answer.letter, acc: answer.acc, octave: p.octave });
      if (given % 12 === midiOf(p) % 12)
        return {
          correct: false,
          note: `${pitchName({ letter: answer.letter, acc: answer.acc, octave: 0 })} klinkt hetzelfde, maar hier staat ${pitchName(p)} geschreven.`,
        };
      return { correct: false };
    }
    case "piano": {
      if (answer.midi === target) return { correct: true };
      return { correct: false, note: octaveNote(target, answer.midi) };
    }
    case "guitar": {
      const given = midiAt(answer.pos);
      if (given === target) return { correct: true };
      const note = octaveNote(target, given);
      if (note) return { correct: false, note };
      if (answer.pos.string === positionsFor(target, 4)[0]?.string) return { correct: false, note: "Goede snaar, verkeerde fret." };
      return { correct: false };
    }
    case "staffSet": {
      // A heard note put on the staff: the pitch must match, the spelling is free.
      if (answer.pitches.length !== 1) return { correct: false, note: "Zet één noot neer." };
      const given = midiOf(answer.pitches[0]);
      if (given === midiOf(item.pitch)) return { correct: true };
      return { correct: false, note: octaveNote(midiOf(item.pitch), given) };
    }
    default:
      return { correct: false };
  }
}

const pcSet = (midis: number[]) => new Set(midis.map((m) => ((m % 12) + 12) % 12));
const sameSet = (a: Set<number>, b: Set<number>) => a.size === b.size && [...a].every((x) => b.has(x));

function checkChord(module: ModuleDef, item: ChordItem, answer: Answer): Verdict {
  const chord = item.chord;
  const pcs = chordPcs(chord);
  const targetPcs = new Set(pcs.map(pcSemitone));
  const bassPc = pcSemitone(pcs[0]);
  switch (answer.kind) {
    case "chordName": {
      const rootOk = pcKey(answer.root) === pcKey(chord.root);
      const qualityOk = answer.quality === chord.quality;
      const inversionOk = answer.inversion === null || answer.inversion === chord.inversion;
      if (rootOk && qualityOk && inversionOk) return { correct: true };
      if (rootOk && qualityOk)
        return { correct: false, note: `Goed akkoord, maar de ligging is ${INVERSION_NAME[chord.inversion]}: de laagste noot is ${pcName(pcs[0])}.` };
      if (rootOk) return { correct: false, note: `De grondtoon klopt, maar het is ${QUALITY_NAME[chord.quality]}: kijk naar de terts.` };
      if (pcSemitone(answer.root) === pcSemitone(chord.root))
        return { correct: false, note: `${pcName(answer.root)} klinkt hetzelfde, maar hier staat ${pcName(chord.root)} geschreven.` };
      return { correct: false };
    }
    case "pianoSet": {
      const given = [...answer.midis].sort((a, b) => a - b);
      if (new Set(given).size !== 3) return { correct: false, note: "Een drieklank heeft drie verschillende toetsen." };
      if (module.question === "staff" || module.question === "sound") {
        const target = item.voicing.map((p) => soundingMidi(module, p)).sort((a, b) => a - b);
        if (given.every((m, i) => m === target[i])) return { correct: true };
        if (sameSet(pcSet(given), targetPcs))
          return {
            correct: false,
            note:
              module.question === "sound"
                ? "De juiste noten, maar niet in het octaaf waarin ze klonken."
                : "De juiste noten, maar niet in het octaaf en de ligging waarin ze geschreven staan.",
          };
        return { correct: false };
      }
      if (!sameSet(pcSet(given), targetPcs)) return { correct: false };
      if (((given[0] % 12) + 12) % 12 !== bassPc)
        return { correct: false, note: `De noten kloppen, maar in de ${INVERSION_NAME[chord.inversion]} is ${pcName(pcs[0])} de laagste toets.` };
      return { correct: true };
    }
    case "staffSet": {
      const given = [...answer.pitches].sort((a, b) => midiOf(a) - midiOf(b));
      if (given.length !== 3) return { correct: false, note: "Een drieklank heeft drie noten." };
      if (module.question === "sound") {
        // Heard: the pitches count, not the spelling. A guitar chord has no single octave, so its pitch classes count.
        if (playsShape(module)) {
          if (sameSet(pcSet(given.map(midiOf)), targetPcs)) return { correct: true };
          return { correct: false };
        }
        const target = item.voicing.map(midiOf).sort((a, b) => a - b);
        if (given.every((p, i) => midiOf(p) === target[i])) return { correct: true };
        if (sameSet(pcSet(given.map(midiOf)), targetPcs))
          return { correct: false, note: "De juiste noten, maar niet in het octaaf en de ligging waarin ze klonken." };
        return { correct: false };
      }
      const shift = midiOf(given[0]) - midiOf(item.voicing[0]);
      const exact = shift % 12 === 0 && given.every((p, i) => sameSpelling({ ...p, octave: p.octave - shift / 12 }, item.voicing[i]));
      if (exact) return { correct: true };
      if (sameSet(pcSet(given.map(midiOf)), targetPcs)) {
        if (((midiOf(given[0]) % 12) + 12) % 12 !== bassPc)
          return { correct: false, note: `De noten kloppen, maar in de ${INVERSION_NAME[chord.inversion]} staat ${pcName(pcs[0])} onderaan.` };
        return { correct: false, note: "De toetsen kloppen, maar kijk naar de spelling of de ligging van de noten." };
      }
      return { correct: false };
    }
    case "shape": {
      const target = shapeFor(chord);
      if (!target) return { correct: false };
      if (sameShape(answer.frets, target.frets)) return { correct: true };
      if (sameSet(pcSet(shapeMidis(answer.frets)), targetPcs)) return { correct: false, note: "De noten kloppen, maar dit is niet de standaardgreep." };
      return { correct: false };
    }
    case "shapeChoice": {
      const ok = pcKey(answer.shape.root) === pcKey(chord.root) && answer.shape.quality === chord.quality;
      if (ok) return { correct: true };
      if (pcKey(answer.shape.root) === pcKey(chord.root))
        return { correct: false, note: `Goede grondtoon, maar dat is ${QUALITY_NAME[answer.shape.quality]}.` };
      return { correct: false };
    }
    default:
      return { correct: false };
  }
}

export function checkAnswer(module: ModuleDef, item: LearnItem, answer: Answer): Verdict {
  return item.kind === "note" ? checkNote(module, item, answer) : checkChord(module, item, answer);
}

/** The MIDI numbers an answer sounds, for the distance to what was heard; null when the answer has no pitch. */
export function answerMidis(module: ModuleDef, answer: Answer): number[] | null {
  switch (answer.kind) {
    case "piano":
      return [answer.midi];
    case "guitar":
      return [midiAt(answer.pos)];
    case "pianoSet":
      return answer.midis;
    case "staffSet":
      return answer.pitches.map((p) => soundingMidi(module, p));
    case "shapeChoice":
      return shapeMidis(answer.shape.frets);
    case "shape":
      return shapeMidis(answer.frets);
    default:
      return null;
  }
}

/**
 * How far a heard-question answer is from the target, in semitones: for a note the distance between the two
 * pitches, for a chord two semitones per note of the chord that was not given. 0 when right, null when unknown.
 */
export function answerDistance(module: ModuleDef, item: LearnItem, answer: Answer): number | null {
  const given = answerMidis(module, answer);
  if (!given || given.length === 0) return null;
  if (item.kind === "note") return Math.abs(given[0] - soundingMidi(module, item.pitch));
  const targetPcs = new Set(chordPcs(item.chord).map(pcSemitone));
  const givenPcs = pcSet(given);
  let missing = 0;
  for (const pc of targetPcs) if (!givenPcs.has(pc)) missing++;
  return 2 * missing;
}
