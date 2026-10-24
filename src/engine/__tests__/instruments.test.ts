import { describe, expect, it } from "vitest";
import { fretRange, midiAt, positionsFor } from "../instruments/guitar.ts";
import { blackKeys, isBlackKey, rangeCovering, whiteKeys } from "../instruments/piano.ts";

describe("guitar", () => {
  it("finds first-position fingerings", () => {
    expect(positionsFor(64)).toEqual([{ string: 5, fret: 0 }]);
    expect(positionsFor(52)).toEqual([{ string: 2, fret: 2 }]);
    expect(positionsFor(59)).toEqual([
      { string: 3, fret: 4 },
      { string: 4, fret: 0 },
    ]);
    expect(positionsFor(70)).toEqual([]);
    expect(midiAt({ string: 0, fret: 3 })).toBe(43);
    expect(fretRange(4)).toEqual({ low: 40, high: 68 });
  });
});

describe("piano", () => {
  it("tells black from white keys", () => {
    expect(isBlackKey(60)).toBe(false);
    expect(isBlackKey(61)).toBe(true);
    expect(whiteKeys({ low: 60, high: 72 })).toHaveLength(8);
    expect(blackKeys({ low: 60, high: 72 })).toHaveLength(5);
  });

  it("covers the notes with whole octaves, at least two", () => {
    expect(rangeCovering([62, 67])).toEqual({ low: 48, high: 72 });
    expect(rangeCovering([43, 69])).toEqual({ low: 36, high: 72 });
    expect(rangeCovering([60])).toEqual({ low: 48, high: 72 });
  });
});
