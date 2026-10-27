import { describe, expect, it } from "vitest";
import { keysInLearningOrder, pcKey } from "../common/chord.ts";
import { answerDistance, checkAnswer, describeTarget } from "../learning/answers.ts";
import { itemsFor, keyItemsFor } from "../learning/items.ts";
import { moduleById } from "../learning/modules.ts";
import { DEFAULT_SETTINGS } from "../learning/settings.ts";

describe("key items", () => {
  it("learns keys by the number of accidentals, sharps first", () => {
    expect(keysInLearningOrder(["Bb", "D", "F", "G", "C", "Eb"]).map((k) => pcKey(k.tonic))).toEqual(["C", "G", "F", "D", "Bb", "Eb"]);
  });

  it("writes read keys per clef and heard keys once", () => {
    const read = keyItemsFor(moduleById("key-read"), { ...DEFAULT_SETTINGS, clefs: "both" });
    expect(read.map((i) => i.key)).toEqual(["treble:key:C", "bass:key:C", "treble:key:G", "bass:key:G", "treble:key:F", "bass:key:F"]);
    const heard = itemsFor(moduleById("key-hear"), { ...DEFAULT_SETTINGS, clefs: "both" });
    expect(heard.map((i) => i.key)).toEqual(["key:C", "key:G", "key:F"]);
    expect(heard.every((i) => i.clef === "treble")).toBe(true);
  });

  it("checks the key and explains a neighbour on the circle", () => {
    const module = moduleById("key-read");
    const [, g] = keyItemsFor(module, DEFAULT_SETTINGS);
    expect(checkAnswer(module, g, { kind: "key", tonic: "G" })).toEqual({ correct: true });
    expect(checkAnswer(module, g, { kind: "key", tonic: "D" }).note).toBe("Dicht in de buurt: D-groot heeft twee kruizen: F♯ en C♯.");
    expect(checkAnswer(module, g, { kind: "key", tonic: "F" }).note).toBe("Kijk of het kruizen of mollen zijn.");
    expect(checkAnswer(module, g, { kind: "name", letter: "G", acc: 0 }).correct).toBe(false);
    expect(describeTarget(module, g)).toBe("G-groot (één kruis: F♯)");
    expect(answerDistance(module, g, { kind: "key", tonic: "D" })).toBe(3);
    expect(answerDistance(module, g, { kind: "key", tonic: "Bb" })).toBe(9);
  });
});
