import { Rating } from "ts-fsrs";
import { describe, expect, it } from "vitest";
import { seeded } from "../common/random.ts";
import { itemsFor } from "../learning/items.ts";
import { moduleById } from "../learning/modules.ts";
import { newCardRecord, review, type CardRecord } from "../learning/scheduler.ts";
import { buildSession, newItemBudget, spreadOut } from "../learning/session.ts";
import { DEFAULT_SETTINGS } from "../learning/settings.ts";

const items = itemsFor(moduleById("note-piano"), DEFAULT_SETTINGS);
const now = new Date("2026-10-24T10:00:00");

describe("buildSession", () => {
  it("repeats the first new items until the session is full", () => {
    const qs = buildSession(items, new Map(), { length: 10, workingSet: 3, lastScore: null, now, rnd: seeded(1) });
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
    const qs = buildSession(items, cards, { length: 5, workingSet: 5, lastScore: 1, now, rnd: seeded(2) });
    const keys = new Set(qs.map((q) => q.key));
    expect(keys.has("treble:B4")).toBe(true);
    expect(keys.has("treble:D5")).toBe(true); // the one new item
    expect(keys.size).toBe(5);
  });

  it("returns nothing when there are no items", () => {
    expect(buildSession([], new Map(), { length: 5, workingSet: 4, lastScore: null, now })).toEqual([]);
  });
});

describe("newItemBudget", () => {
  const learn = (key: string, grade: Rating.Again | Rating.Good | Rating.Easy, times: number): CardRecord => {
    let rec = newCardRecord("p", "note-piano", key, now);
    let t = now;
    for (let i = 0; i < times; i++) {
      rec = review(rec, grade, t, 1000);
      t = new Date(rec.due + 1000);
    }
    return rec;
  };

  it("fills the working set at the start and holds back after a weak session", () => {
    expect(newItemBudget(new Map(), items, { workingSet: 4, lastScore: null })).toBe(4);
    expect(newItemBudget(new Map(), items, { workingSet: 4, lastScore: 0.7 })).toBe(0);
    expect(newItemBudget(new Map(), items, { workingSet: 4, lastScore: 0.8 })).toBe(4);
  });

  it("only frees a slot once an item has settled", () => {
    const cards = new Map<string, CardRecord>();
    cards.set("treble:B4", learn("treble:B4", Rating.Good, 1)); // still in a learning step
    cards.set("treble:A4", learn("treble:A4", Rating.Again, 2)); // relearning
    cards.set("treble:C5", learn("treble:C5", Rating.Easy, 4)); // settled: review state, stable for days
    expect(newItemBudget(cards, items, { workingSet: 4, lastScore: 0.9 })).toBe(2);
    expect(newItemBudget(cards, items, { workingSet: 2, lastScore: 0.9 })).toBe(0);
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
