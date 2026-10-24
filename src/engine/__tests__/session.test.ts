import { Rating } from "ts-fsrs";
import { describe, expect, it } from "vitest";
import { seeded } from "../common/random.ts";
import { itemsFor } from "../learning/items.ts";
import { moduleById } from "../learning/modules.ts";
import { newCardRecord, review, type CardRecord } from "../learning/scheduler.ts";
import { buildSession, spreadOut } from "../learning/session.ts";
import { DEFAULT_SETTINGS } from "../learning/settings.ts";

const items = itemsFor(moduleById("note-piano"), DEFAULT_SETTINGS);
const now = new Date("2026-10-24T10:00:00");

describe("buildSession", () => {
  it("repeats the first new items until the session is full", () => {
    const qs = buildSession(items, new Map(), { length: 10, maxNew: 3, now, rnd: seeded(1) });
    expect(qs).toHaveLength(10);
    const keys = new Set(qs.map((q) => q.key));
    expect(keys).toEqual(new Set(["treble:B4", "treble:A4", "treble:C5"]));
    for (let i = 1; i < qs.length; i++) expect(qs[i].key).not.toBe(qs[i - 1].key);
  });

  it("asks what is due before adding new items", () => {
    const cards = new Map<string, CardRecord>();
    const long = new Date("2026-10-01T10:00:00");
    for (const key of ["treble:B4", "treble:A4", "treble:C5", "treble:G4"]) {
      cards.set(key, review(newCardRecord("p", "note-piano", key, long), Rating.Good, long, 1000));
    }
    const qs = buildSession(items, cards, { length: 5, maxNew: 1, now, rnd: seeded(2) });
    const keys = new Set(qs.map((q) => q.key));
    expect(keys.has("treble:B4")).toBe(true);
    expect(keys.has("treble:D5")).toBe(true); // the one new item
    expect(keys.size).toBe(5);
  });

  it("returns nothing when there are no items", () => {
    expect(buildSession([], new Map(), { length: 5, maxNew: 1, now })).toEqual([]);
  });
});

describe("spreadOut", () => {
  it("separates equal neighbours", () => {
    const a = items[0];
    const b = items[1];
    const out = spreadOut([a, a, b, b, a]);
    for (let i = 1; i < out.length; i++) expect(out[i].key).not.toBe(out[i - 1].key);
  });
});
