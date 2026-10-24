import { describe, expect, it } from "vitest";
import { chordName, parsePc } from "../common/chord.ts";
import { pitch } from "../common/pitch.ts";
import { checkAnswer } from "../learning/answers.ts";
import { chordItemsFor, keysInOrder, type ChordItem } from "../learning/items.ts";
import { moduleById } from "../learning/modules.ts";
import { DEFAULT_SETTINGS } from "../learning/settings.ts";
import { CHORD_SHAPES } from "../instruments/guitarChords.ts";

describe("chord items", () => {
  it("orders keys from C outward", () => {
    expect(keysInOrder(["F", "D", "C", "G", "Bb"])).toEqual(["C", "G", "F", "D", "Bb"]);
  });

  it("lists the major triads of the default keys once, root position first", () => {
    const items = chordItemsFor(moduleById("chord-name"), DEFAULT_SETTINGS);
    expect(items.map((i) => chordName(i.chord))).toEqual(["C", "G", "F", "D", "B♭"]);
    expect(items.every((i) => i.chord.inversion === 0 && i.clef === "treble")).toBe(true);
    expect(items[0].key).toBe("treble:C:M:0");
  });

  it("adds minors, inversions and the bass clef when asked", () => {
    const items = chordItemsFor(moduleById("chord-name"), { ...DEFAULT_SETTINGS, keys: ["C"], qualities: "both", inversions: true, clefs: "both" });
    expect(items).toHaveLength(6 * 3 * 2);
    expect(items.slice(0, 6).map((i) => chordName(i.chord))).toEqual(["C", "C", "G", "G", "F", "F"]);
    expect(items[1].clef).toBe("bass");
    expect(items.findIndex((i) => i.chord.inversion === 1)).toBe(12);
  });

  it("gives name-question piano chords no clef in the key and guitar only known shapes", () => {
    const piano = chordItemsFor(moduleById("chord-piano"), { ...DEFAULT_SETTINGS, inversions: true });
    expect(piano[0].key).toBe("C:M:0");
    const guitar = chordItemsFor(moduleById("chord-guitar"), { ...DEFAULT_SETTINGS, keys: ["C", "G", "F", "Bb"], qualities: "both", inversions: true });
    expect(guitar.every((i) => i.chord.inversion === 0)).toBe(true);
    expect(guitar.map((i) => chordName(i.chord))).not.toContain("B♭");
    expect(guitar.map((i) => chordName(i.chord))).toContain("F");
  });
});

describe("chord answers", () => {
  const nameModule = moduleById("chord-name");
  const item = chordItemsFor(nameModule, { ...DEFAULT_SETTINGS, keys: ["C"], inversions: true }).find((i) => i.chord.inversion === 1)!; // C/E
  const c = parsePc("C");

  it("checks chord names with inversion", () => {
    expect(checkAnswer(nameModule, item, { kind: "chordName", root: c, quality: "major", inversion: 1 }).correct).toBe(true);
    expect(checkAnswer(nameModule, item, { kind: "chordName", root: c, quality: "major", inversion: null }).correct).toBe(true);
    expect(checkAnswer(nameModule, item, { kind: "chordName", root: c, quality: "major", inversion: 0 })).toMatchObject({
      correct: false,
      note: expect.stringContaining("ligging"),
    });
    expect(checkAnswer(nameModule, item, { kind: "chordName", root: c, quality: "minor", inversion: 1 })).toMatchObject({
      correct: false,
      note: expect.stringContaining("majeur"),
    });
    expect(checkAnswer(nameModule, item, { kind: "chordName", root: parsePc("G"), quality: "major", inversion: 1 })).toEqual({ correct: false });
  });

  it("checks piano sets by pitch class and bass for name questions, exactly for staff questions", () => {
    const byName = moduleById("chord-piano");
    const nameItem: ChordItem = { ...item, key: "C:M:1" };
    expect(checkAnswer(byName, nameItem, { kind: "pianoSet", midis: [52, 55, 60] }).correct).toBe(true); // E3 G3 C4
    expect(checkAnswer(byName, nameItem, { kind: "pianoSet", midis: [64, 67, 72] }).correct).toBe(true); // any octave
    expect(checkAnswer(byName, nameItem, { kind: "pianoSet", midis: [60, 64, 67] })).toMatchObject({
      correct: false,
      note: expect.stringContaining("laagste toets"),
    });
    expect(checkAnswer(byName, nameItem, { kind: "pianoSet", midis: [60, 64, 64] })).toMatchObject({ correct: false, note: expect.stringContaining("drie") });
    const byStaff = moduleById("chord-read-piano");
    expect(checkAnswer(byStaff, item, { kind: "pianoSet", midis: [64, 67, 72] }).correct).toBe(true); // E4 G4 C5 as written
    expect(checkAnswer(byStaff, item, { kind: "pianoSet", midis: [52, 55, 60] })).toMatchObject({ correct: false, note: expect.stringContaining("octaaf") });
  });

  it("checks notes on the staff with spelling and ordering", () => {
    const staff = moduleById("chord-staff");
    expect(checkAnswer(staff, item, { kind: "staffSet", pitches: [pitch("E", 0, 4), pitch("G", 0, 4), pitch("C", 0, 5)] }).correct).toBe(true);
    expect(checkAnswer(staff, item, { kind: "staffSet", pitches: [pitch("E", 0, 5), pitch("G", 0, 5), pitch("C", 0, 6)] }).correct).toBe(true);
    expect(checkAnswer(staff, item, { kind: "staffSet", pitches: [pitch("C", 0, 4), pitch("E", 0, 4), pitch("G", 0, 4)] })).toMatchObject({
      correct: false,
      note: expect.stringContaining("onderaan"),
    });
    expect(checkAnswer(staff, item, { kind: "staffSet", pitches: [pitch("E", 0, 4), pitch("G", 0, 4)] })).toMatchObject({
      correct: false,
      note: expect.stringContaining("drie"),
    });
  });

  it("checks guitar shapes and diagram choices", () => {
    const guitar = moduleById("chord-guitar");
    const gItem = chordItemsFor(guitar, DEFAULT_SETTINGS)[0]; // C
    expect(checkAnswer(guitar, gItem, { kind: "shape", frets: [null, 3, 2, 0, 1, 0] }).correct).toBe(true);
    expect(checkAnswer(guitar, gItem, { kind: "shape", frets: [null, 3, 2, 0, 1, 3] })).toMatchObject({ correct: false });
    const am = CHORD_SHAPES.find((s) => s.quality === "minor" && s.root.letter === "A")!;
    const cShape = CHORD_SHAPES[0];
    expect(checkAnswer(guitar, gItem, { kind: "shapeChoice", shape: cShape }).correct).toBe(true);
    expect(checkAnswer(guitar, gItem, { kind: "shapeChoice", shape: am }).correct).toBe(false);
  });
});
