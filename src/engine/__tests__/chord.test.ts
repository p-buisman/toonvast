import { describe, expect, it } from "vitest";
import {
  chordKey,
  chordName,
  chordPcs,
  diatonicTriads,
  keyByTonic,
  parseChordKey,
  parsePc,
  pcAbove,
  pcName,
  triadPcs,
  voicing,
  voicingFits,
} from "../common/chord.ts";
import { midiOf, pitchKey } from "../common/pitch.ts";

describe("chord", () => {
  it("spells intervals from the root", () => {
    expect(pcName(pcAbove(parsePc("C"), 2, 4))).toBe("E");
    expect(pcName(pcAbove(parsePc("D"), 2, 4))).toBe("F♯");
    expect(pcName(pcAbove(parsePc("Bb"), 2, 3))).toBe("D♭");
    expect(pcName(pcAbove(parsePc("F#"), 4, 7))).toBe("C♯");
  });

  it("builds triads with names and keys", () => {
    expect(triadPcs(parsePc("A"), "minor").map(pcName)).toEqual(["A", "C", "E"]);
    expect(triadPcs(parsePc("Eb"), "major").map(pcName)).toEqual(["E♭", "G", "B♭"]);
    const dm1 = { root: parsePc("D"), quality: "minor" as const, inversion: 1 as const };
    expect(chordName(dm1)).toBe("Dm");
    expect(chordKey(dm1)).toBe("D:m:1");
    expect(parseChordKey("Bb:M:2")).toEqual({ root: parsePc("Bb"), quality: "major", inversion: 2 });
    expect(chordPcs(dm1).map(pcName)).toEqual(["F", "A", "D"]);
  });

  it("voices chords in close position on the staff", () => {
    const c = { root: parsePc("C"), quality: "major" as const, inversion: 0 as const };
    expect(voicing(c, "treble").map((p) => pitchKey(p))).toEqual(["C4", "E4", "G4"]);
    expect(voicing(c, "bass").map((p) => pitchKey(p))).toEqual(["C3", "E3", "G3"]);
    const g2 = { root: parsePc("G"), quality: "major" as const, inversion: 2 as const };
    expect(voicing(g2, "treble").map((p) => pitchKey(p))).toEqual(["D4", "G4", "B4"]);
    const b = { root: parsePc("B"), quality: "major" as const, inversion: 0 as const };
    const v = voicing(b, "treble");
    expect(v.map((p) => pitchKey(p))).toEqual(["B4", "D#5", "F#5"]);
    expect(midiOf(v[0])).toBeLessThan(midiOf(v[1]));
    expect(voicingFits(v, "treble", 0)).toBe(true);
    expect(voicingFits(voicing(c, "treble"), "treble", 0)).toBe(false); // C4 needs a ledger line
    expect(voicingFits(voicing(c, "treble"), "treble", 1)).toBe(true);
  });

  it("lists the diatonic triads of a key", () => {
    const names = diatonicTriads(keyByTonic("G")).map((t) => chordName(t));
    expect(names).toEqual(["G", "Am", "Bm", "C", "D", "Em"]);
    expect(diatonicTriads(keyByTonic("Bb")).map((t) => chordName(t))).toEqual(["B♭", "Cm", "Dm", "E♭", "F", "Gm"]);
  });
});
