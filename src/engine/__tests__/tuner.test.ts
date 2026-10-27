import { describe, expect, it } from "vitest";
import { detectPitch } from "../../audio/pitch.ts";
import { centsOff, frequencyOf, median, nearestString, tuneAdvice } from "../instruments/tuner.ts";

function tone(hz: number, sampleRate = 48000, length = 4096, harmonics = [1, 0.5, 0.25]): Float32Array {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let v = 0;
    harmonics.forEach((a, k) => {
      v += a * Math.sin(2 * Math.PI * hz * (k + 1) * t + k);
    });
    out[i] = 0.3 * v;
  }
  return out;
}

describe("tuner maths", () => {
  it("knows the open strings and measures cents", () => {
    expect(frequencyOf(69)).toBeCloseTo(440);
    expect(frequencyOf(40)).toBeCloseTo(82.41, 1);
    expect(centsOff(110, 45)).toBeCloseTo(0, 5);
    expect(centsOff(110 * Math.pow(2, 1 / 12), 45)).toBeCloseTo(100, 5);
  });

  it("picks the nearest string with the deviation", () => {
    const low = nearestString(80);
    expect(low.string).toBe(0);
    expect(low.cents).toBeLessThan(0);
    const g = nearestString(198);
    expect(g.string).toBe(3);
    expect(g.cents).toBeGreaterThan(0);
    expect(nearestString(329.63).string).toBe(5);
  });

  it("advises tightening when low and loosening when high", () => {
    expect(tuneAdvice(-12)).toBe("tighten");
    expect(tuneAdvice(9)).toBe("loosen");
    expect(tuneAdvice(3)).toBe("ok");
    expect(median([110, 300, 111])).toBe(111);
    expect(median([110, 112])).toBe(111);
  });
});

describe("detectPitch", () => {
  it("finds every open string in a tone with overtones", () => {
    for (const midi of [40, 45, 50, 55, 59, 64]) {
      const hz = frequencyOf(midi);
      const found = detectPitch(tone(hz), 48000);
      expect(found).not.toBeNull();
      expect(Math.abs(centsOff(found!, midi))).toBeLessThan(3);
    }
  });

  it("measures a string that is a bit off", () => {
    const hz = 110 * Math.pow(2, -12 / 1200);
    const found = detectPitch(tone(hz, 44100), 44100);
    expect(centsOff(found!, 45)).toBeCloseTo(-12, 0);
  });

  it("hears nothing in silence or noise", () => {
    expect(detectPitch(new Float32Array(4096), 48000)).toBeNull();
    const noise = new Float32Array(4096);
    let seed = 7;
    for (let i = 0; i < noise.length; i++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      noise[i] = (seed / 2147483648 - 0.5) * 0.6;
    }
    expect(detectPitch(noise, 48000)).toBeNull();
  });
});
