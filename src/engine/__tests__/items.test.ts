import { describe, expect, it } from "vitest";
import { itemsFor } from "../learning/items.ts";
import { moduleById } from "../learning/modules.ts";
import { DEFAULT_SETTINGS } from "../learning/settings.ts";

describe("itemsFor", () => {
  it("starts in the middle of the treble staff with naturals only", () => {
    const items = itemsFor(moduleById("note-piano"), DEFAULT_SETTINGS);
    expect(items).toHaveLength(11); // D4 .. G5
    expect(items[0].key).toBe("treble:B4");
    expect(items.map((i) => i.key)).toContain("treble:D4");
    expect(items.map((i) => i.key)).not.toContain("treble:C4");
  });

  it("adds the bass clef after the treble clef, and accidentals last", () => {
    const items = itemsFor(moduleById("note-name"), { ...DEFAULT_SETTINGS, clefs: "both", accidentals: "sharp" });
    const keys = items.map((i) => i.key);
    const firstBass = keys.findIndex((k) => k.startsWith("bass:"));
    const firstSharp = keys.findIndex((k) => k.includes("#"));
    expect(firstBass).toBeGreaterThan(0);
    expect(firstSharp).toBeGreaterThan(firstBass);
    expect(keys).not.toContain("treble:E#4");
    expect(keys).not.toContain("treble:B#4");
  });

  it("keeps guitar items within the first position, written an octave up", () => {
    const items = itemsFor(moduleById("note-guitar"), { ...DEFAULT_SETTINGS, clefs: "both", range: 2 });
    const keys = items.map((i) => i.key);
    expect(keys.every((k) => k.startsWith("treble:"))).toBe(true);
    expect(keys).toContain("treble:G3"); // low E string fret 3, written G3
    expect(keys).toContain("treble:G5"); // high e string fret 3
    expect(keys).not.toContain("treble:A5"); // fret 5
    expect(keys).not.toContain("treble:D3");
  });
});
