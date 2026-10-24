import { describe, expect, it } from "vitest";
import { midiOf, parsePitchKey, pitch, pitchKey, pitchName, sameSound, spellMidi, transpose } from "../common/pitch.ts";

describe("pitch", () => {
  it("maps spellings to MIDI numbers", () => {
    expect(midiOf(pitch("C", 0, 4))).toBe(60);
    expect(midiOf(pitch("B", 1, 3))).toBe(60);
    expect(midiOf(pitch("C", -1, 4))).toBe(59);
    expect(midiOf(pitch("A", 0, 4))).toBe(69);
    expect(midiOf(pitch("A", 0, 0))).toBe(21);
  });

  it("round-trips keys and formats names", () => {
    const p = pitch("B", -1, 3);
    expect(pitchKey(p)).toBe("Bb3");
    expect(parsePitchKey("Bb3")).toEqual(p);
    expect(parsePitchKey("F#5")).toEqual(pitch("F", 1, 5));
    expect(pitchName(p)).toBe("B♭");
    expect(pitchName(p, true)).toBe("B♭3");
  });

  it("spells MIDI numbers with the preferred accidental", () => {
    expect(spellMidi(61, "sharp")).toEqual(pitch("C", 1, 4));
    expect(spellMidi(61, "flat")).toEqual(pitch("D", -1, 4));
    expect(spellMidi(60)).toEqual(pitch("C", 0, 4));
    expect(sameSound(pitch("A", 1, 4), pitch("B", -1, 4))).toBe(true);
  });

  it("transposes by octaves without respelling", () => {
    expect(transpose(pitch("E", -1, 4), 12)).toEqual(pitch("E", -1, 5));
    expect(transpose(pitch("E", -1, 4), -12)).toEqual(pitch("E", -1, 3));
  });
});
