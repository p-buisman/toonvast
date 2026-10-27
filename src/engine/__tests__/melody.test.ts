import { describe, expect, it } from "vitest";
import { keyByTonic, MAJOR_KEYS, pcKey, scaleOf, signatureText } from "../common/chord.ts";
import { CLEFS, staffPosition } from "../common/clef.ts";
import { midiOf, pitchName } from "../common/pitch.ts";
import { melodyFor, outsideScale, referencePitch, scaleFor, tonicPitch } from "../learning/melody.ts";

describe("scales and signatures", () => {
  it("spells the scale from the tonic", () => {
    expect(scaleOf(keyByTonic("D")).map((pc) => pcKey(pc))).toEqual(["D", "E", "F#", "G", "A", "B", "C#"]);
    expect(scaleOf(keyByTonic("Bb")).map((pc) => pcKey(pc))).toEqual(["Bb", "C", "D", "Eb", "F", "G", "A"]);
  });

  it("describes the signature in words", () => {
    expect(signatureText(keyByTonic("C"))).toBe("geen voortekens");
    expect(signatureText(keyByTonic("G"))).toBe("één kruis: F♯");
    expect(signatureText(keyByTonic("Eb"))).toBe("drie mollen: B♭, E♭ en A♭");
  });

  it("keeps the tonic in the lower half of the staff in both clefs", () => {
    for (const key of MAJOR_KEYS)
      for (const clef of CLEFS) {
        const pos = staffPosition(tonicPitch(key, clef), clef);
        expect(pos).toBeGreaterThanOrEqual(0);
        expect(pos).toBeLessThanOrEqual(6);
      }
    expect(pitchName(tonicPitch(keyByTonic("G"), "treble"), true)).toBe("G4");
    expect(pitchName(tonicPitch(keyByTonic("G"), "bass"), true)).toBe("G2");
  });

  it("builds the scale up to the octave, spelled in the key", () => {
    expect(scaleFor(keyByTonic("A"), "treble").map((p) => pitchName(p, true))).toEqual(["A4", "B4", "C♯5", "D5", "E5", "F♯5", "G♯5", "A5"]);
  });
});

describe("melodyFor", () => {
  const degreesOf = (tonic: string, clef: "treble" | "bass", seed: number) => {
    const key = keyByTonic(tonic);
    const scale = scaleOf(key).map((pc) => pcKey(pc));
    return melodyFor(key, clef, seed).map((p) => scale.indexOf(pcKey({ letter: p.letter, acc: p.acc })));
  };

  it("is diatonic, six to eight notes, ends on the tonic and holds the fifth and the leading tone", () => {
    for (const key of MAJOR_KEYS)
      for (let seed = 1; seed <= 40; seed++) {
        const melody = melodyFor(key, "treble", seed);
        expect(melody.length).toBeGreaterThanOrEqual(6);
        expect(melody.length).toBeLessThanOrEqual(8);
        expect(outsideScale(key, melody)).toEqual([]);
        const degrees = melody.map((p) => scaleOf(key).findIndex((pc) => pc.letter === p.letter));
        expect(degrees[degrees.length - 1]).toBe(0);
        expect(degrees).toContain(4);
        expect(degrees).toContain(6);
        for (const p of melody) {
          const pos = staffPosition(p, "treble");
          expect(pos).toBeGreaterThanOrEqual(-3);
          expect(pos).toBeLessThanOrEqual(11);
        }
      }
  });

  it("moves mostly by step and repeats for the same seed", () => {
    const a = melodyFor(keyByTonic("F"), "treble", 7);
    const b = melodyFor(keyByTonic("F"), "treble", 7);
    expect(a).toEqual(b);
    expect(degreesOf("C", "treble", 3)).not.toEqual(degreesOf("C", "treble", 4));
    let steps = 0;
    let total = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const m = melodyFor(keyByTonic("C"), "treble", seed).map(midiOf);
      for (let i = 1; i < m.length; i++) {
        total++;
        if (Math.abs(m[i] - m[i - 1]) <= 2) steps++;
      }
    }
    expect(steps / total).toBeGreaterThan(0.5);
  });

  it("gives a reference C inside the melody's range", () => {
    expect(pitchName(referencePitch(keyByTonic("G"), "treble"), true)).toBe("C5");
    expect(pitchName(referencePitch(keyByTonic("G"), "bass"), true)).toBe("C3");
  });
});
