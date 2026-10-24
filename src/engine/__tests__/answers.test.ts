import { describe, expect, it } from "vitest";
import { pitch } from "../common/pitch.ts";
import { checkAnswer, soundingMidi } from "../learning/answers.ts";
import { itemKey } from "../learning/items.ts";
import { moduleById } from "../learning/modules.ts";

const e4 = { key: itemKey("treble", pitch("E", 0, 4)), clef: "treble" as const, pitch: pitch("E", 0, 4) };
const bb3 = { key: itemKey("bass", pitch("B", -1, 3)), clef: "bass" as const, pitch: pitch("B", -1, 3) };

describe("checkAnswer", () => {
  it("checks names by spelling", () => {
    const m = moduleById("note-name");
    expect(checkAnswer(m, e4, { kind: "name", letter: "E", acc: 0 }).correct).toBe(true);
    expect(checkAnswer(m, bb3, { kind: "name", letter: "B", acc: 0 })).toMatchObject({ correct: false, note: expect.stringContaining("voorteken") });
    expect(checkAnswer(m, bb3, { kind: "name", letter: "A", acc: 1 })).toMatchObject({ correct: false, note: expect.stringContaining("klinkt hetzelfde") });
    expect(checkAnswer(m, bb3, { kind: "name", letter: "F", acc: 0 })).toEqual({ correct: false });
  });

  it("checks piano keys by sound and explains octave slips", () => {
    const m = moduleById("note-piano");
    expect(checkAnswer(m, e4, { kind: "piano", midi: 64 }).correct).toBe(true);
    expect(checkAnswer(m, e4, { kind: "piano", midi: 52 })).toMatchObject({ correct: false, note: expect.stringContaining("octaaf te laag") });
    expect(checkAnswer(m, e4, { kind: "piano", midi: 65 })).toEqual({ correct: false });
  });

  it("checks guitar positions against the sounding pitch", () => {
    const m = moduleById("note-guitar");
    expect(soundingMidi(m, e4.pitch)).toBe(52);
    expect(checkAnswer(m, e4, { kind: "guitar", pos: { string: 2, fret: 2 } }).correct).toBe(true);
    expect(checkAnswer(m, e4, { kind: "guitar", pos: { string: 5, fret: 0 } })).toMatchObject({
      correct: false,
      note: expect.stringContaining("octaaf te hoog"),
    });
    expect(checkAnswer(m, e4, { kind: "guitar", pos: { string: 2, fret: 3 } })).toMatchObject({ correct: false, note: "Goede snaar, verkeerde fret." });
  });
});
