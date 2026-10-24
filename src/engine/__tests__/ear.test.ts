import { describe, expect, it } from "vitest";
import { chordName } from "../common/chord.ts";
import { pitch, pitchKey } from "../common/pitch.ts";
import { checkAnswer, describeTarget } from "../learning/answers.ts";
import { chordItemsFor, noteItemsFor, type ChordItem } from "../learning/items.ts";
import { moduleById } from "../learning/modules.ts";
import { DEFAULT_SETTINGS } from "../learning/settings.ts";

describe("ear training items", () => {
  it("keeps one item per heard pitch, whatever the spelling", () => {
    const items = noteItemsFor(moduleById("ear-note-piano"), { ...DEFAULT_SETTINGS, accidentals: "both" });
    const keys = items.map((i) => i.key);
    expect(keys).toContain("treble:F#4");
    expect(keys).not.toContain("treble:Gb4");
    expect(
      describeTarget(
        moduleById("ear-note-piano"),
        items.find((i) => i.key === "treble:F#4")!,
      ),
    ).toBe("F♯ (G♭)");
  });

  it("limits heard guitar chords to the shape table and root position", () => {
    const items = chordItemsFor(moduleById("ear-chord-guitar-staff"), { ...DEFAULT_SETTINGS, keys: ["C", "F", "Bb"], qualities: "both", inversions: true });
    expect(items.every((i) => i.chord.inversion === 0)).toBe(true);
    expect(items.map((i) => chordName(i.chord))).not.toContain("B♭");
    expect(items.map((i) => chordName(i.chord))).toContain("Dm");
  });
});

describe("ear training answers", () => {
  it("accepts a heard note on the staff in either spelling, same octave", () => {
    const m = moduleById("ear-note-staff");
    const item = noteItemsFor(m, { ...DEFAULT_SETTINGS, accidentals: "sharp" }).find((i) => i.key === "treble:F#4")!;
    expect(checkAnswer(m, item, { kind: "staffSet", pitches: [pitch("G", -1, 4)] }).correct).toBe(true);
    expect(checkAnswer(m, item, { kind: "staffSet", pitches: [pitch("F", 1, 5)] })).toMatchObject({ correct: false, note: expect.stringContaining("octaaf") });
    expect(checkAnswer(m, item, { kind: "staffSet", pitches: [pitch("F", 1, 4), pitch("A", 0, 4)] })).toMatchObject({
      correct: false,
      note: expect.stringContaining("één"),
    });
  });

  it("judges a heard piano chord by its exact pitches and a guitar chord by pitch class", () => {
    const piano = moduleById("ear-chord-piano-staff");
    const c = chordItemsFor(piano, DEFAULT_SETTINGS)[0]; // C4 E4 G4
    expect(c.voicing.map((p) => pitchKey(p))).toEqual(["C4", "E4", "G4"]);
    expect(checkAnswer(piano, c, { kind: "staffSet", pitches: [pitch("C", 0, 4), pitch("E", 0, 4), pitch("G", 0, 4)] }).correct).toBe(true);
    expect(checkAnswer(piano, c, { kind: "staffSet", pitches: [pitch("C", 0, 5), pitch("E", 0, 5), pitch("G", 0, 5)] })).toMatchObject({
      correct: false,
      note: expect.stringContaining("octaaf"),
    });
    const keys = moduleById("ear-chord-piano-keys");
    const ck: ChordItem = { ...c, key: "C:M:0" };
    expect(checkAnswer(keys, ck, { kind: "pianoSet", midis: [60, 64, 67] }).correct).toBe(true);
    expect(checkAnswer(keys, ck, { kind: "pianoSet", midis: [48, 52, 55] })).toMatchObject({ correct: false, note: expect.stringContaining("octaaf") });
    const guitar = moduleById("ear-chord-guitar-staff");
    const g = chordItemsFor(guitar, DEFAULT_SETTINGS)[0];
    expect(checkAnswer(guitar, g, { kind: "staffSet", pitches: [pitch("E", 0, 5), pitch("G", 0, 5), pitch("C", 0, 6)] }).correct).toBe(true);
    expect(checkAnswer(guitar, g, { kind: "staffSet", pitches: [pitch("E", 0, 5), pitch("G", 0, 5), pitch("B", 0, 5)] }).correct).toBe(false);
  });
});
