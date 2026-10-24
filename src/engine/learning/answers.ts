import { midiOf, pitchName, type Accidental, type Letter, type Pitch } from "../common/pitch.ts";
import { midiAt, positionsFor, type FretPosition } from "../instruments/guitar.ts";
import type { LearnItem } from "./items.ts";
import type { ModuleDef } from "./modules.ts";

export type Answer = { kind: "name"; letter: Letter; acc: Accidental } | { kind: "piano"; midi: number } | { kind: "guitar"; pos: FretPosition };

export interface Verdict {
  correct: boolean;
  /** A short explanation for a near miss, in Dutch, shown with the right answer. */
  note?: string;
}

/** The MIDI number that sounds for an item (the guitar is written an octave up). */
export function soundingMidi(module: ModuleDef, pitch: Pitch): number {
  return midiOf(pitch) - module.writtenOffset;
}

function octaveNote(target: number, given: number): string | undefined {
  if (target % 12 !== given % 12) return undefined;
  const diff = (given - target) / 12;
  return `Dat is wel dezelfde noot, maar ${Math.abs(diff) === 1 ? "een octaaf" : `${Math.abs(diff)} octaven`} te ${diff > 0 ? "hoog" : "laag"}.`;
}

export function checkAnswer(module: ModuleDef, item: LearnItem, answer: Answer): Verdict {
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
  }
}
