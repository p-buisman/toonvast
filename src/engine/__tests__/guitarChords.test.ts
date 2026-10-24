import { describe, expect, it } from "vitest";
import { parsePc } from "../common/chord.ts";
import { CHORD_SHAPES, highestFret, sameShape, shapeFor, shapeMidis } from "../instruments/guitarChords.ts";

describe("guitar chord shapes", () => {
  it("finds the standard shape and its notes", () => {
    const c = shapeFor({ root: parsePc("C"), quality: "major" })!;
    expect(c.frets).toEqual([null, 3, 2, 0, 1, 0]);
    expect(shapeMidis(c.frets)).toEqual([48, 52, 55, 60, 64]); // C3 E3 G3 C4 E4
    expect(shapeFor({ root: parsePc("Eb"), quality: "major" })).toBeUndefined();
  });

  it("has consistent fingering data", () => {
    for (const s of CHORD_SHAPES) {
      expect(s.frets).toHaveLength(6);
      expect(s.fingers).toHaveLength(6);
      s.frets.forEach((f, i) => {
        if (f === null || f === 0) expect(s.fingers[i]).toBe(0);
        else expect(s.fingers[i]).toBeGreaterThan(0);
      });
    }
    expect(highestFret(CHORD_SHAPES)).toBe(6);
    expect(sameShape([null, 3, 2, 0, 1, 0], [null, 3, 2, 0, 1, 0])).toBe(true);
    expect(sameShape([null, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0])).toBe(false);
  });
});
