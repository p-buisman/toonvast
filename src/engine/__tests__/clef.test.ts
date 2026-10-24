import { describe, expect, it } from "vitest";
import { ledgerLines, pitchAtPosition, rangeForLevel, staffPosition } from "../common/clef.ts";
import { pitch } from "../common/pitch.ts";

describe("clef", () => {
  it("places notes on the treble staff", () => {
    expect(staffPosition(pitch("E", 0, 4), "treble")).toBe(0);
    expect(staffPosition(pitch("F", 0, 5), "treble")).toBe(8);
    expect(staffPosition(pitch("C", 0, 4), "treble")).toBe(-2);
    expect(staffPosition(pitch("B", 0, 4), "treble")).toBe(4);
    expect(staffPosition(pitch("A", 0, 5), "treble")).toBe(10);
  });

  it("places notes on the bass staff", () => {
    expect(staffPosition(pitch("G", 0, 2), "bass")).toBe(0);
    expect(staffPosition(pitch("A", 0, 3), "bass")).toBe(8);
    expect(staffPosition(pitch("C", 0, 4), "bass")).toBe(10);
    expect(staffPosition(pitch("E", 0, 2), "bass")).toBe(-2);
  });

  it("is the inverse of pitchAtPosition", () => {
    expect(pitchAtPosition(-2, "treble")).toEqual(pitch("C", 0, 4));
    expect(pitchAtPosition(10, "bass", 1)).toEqual(pitch("C", 1, 4));
  });

  it("knows which ledger lines a note needs", () => {
    expect(ledgerLines(0)).toEqual([]);
    expect(ledgerLines(-1)).toEqual([]);
    expect(ledgerLines(-2)).toEqual([-2]);
    expect(ledgerLines(-3)).toEqual([-2]);
    expect(ledgerLines(-4)).toEqual([-2, -4]);
    expect(ledgerLines(10)).toEqual([10]);
    expect(ledgerLines(13)).toEqual([10, 12]);
  });

  it("widens the range per level", () => {
    expect(rangeForLevel(0)).toEqual({ min: -1, max: 9 });
    expect(rangeForLevel(2)).toEqual({ min: -5, max: 13 });
  });
});
