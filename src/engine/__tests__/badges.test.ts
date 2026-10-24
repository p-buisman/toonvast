import { Rating } from "ts-fsrs";
import { describe, expect, it } from "vitest";
import { BADGES, badgeById, earnedBadges } from "../game/badges.ts";
import { buyRefusal, SHOP_ITEMS, shopItem } from "../game/shop.ts";
import { noteItemsFor } from "../learning/items.ts";
import { moduleById } from "../learning/modules.ts";
import { newCardRecord, review, type CardRecord } from "../learning/scheduler.ts";
import { DEFAULT_SETTINGS } from "../learning/settings.ts";

const now = new Date("2026-10-24T10:00:00");
function mastered(key: string): CardRecord {
  let rec = newCardRecord("p", "note-piano", key, now);
  let t = now;
  for (let i = 0; i < 6; i++) {
    rec = review(rec, Rating.Easy, t, 800);
    t = new Date(rec.due + 1000);
  }
  return rec;
}

describe("badges", () => {
  it("has unique ids", () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
    expect(badgeById("streak-5")?.title).toBe("Vijf dagen");
  });

  it("awards simple counters", () => {
    const ctx = { totalCorrect: 10, streak: 5, cardsByModule: new Map(), statsByModule: new Map() };
    expect(earnedBadges(ctx)).toEqual(["first-ten", "streak-5"]);
    expect(earnedBadges({ ...ctx, totalCorrect: 9, streak: 0 })).toEqual([]);
  });

  it("awards the treble clef badge once every note within the lines is mastered", () => {
    const keys = noteItemsFor(moduleById("note-piano"), DEFAULT_SETTINGS).map((i) => i.key);
    const cards = new Map(keys.map((k) => [k, mastered(k)]));
    const ctx = {
      totalCorrect: 0,
      streak: 0,
      cardsByModule: new Map([["note-piano" as const, cards]]),
      statsByModule: new Map([["note-piano" as const, { emaMs: 1500, count: 25 }]]),
    };
    const earned = earnedBadges(ctx);
    expect(earned).toContain("treble-done:piano");
    expect(earned).toContain("fast:piano");
    expect(earned).not.toContain("treble-done:theory");
    expect(earned).not.toContain("bass-done:piano");
    cards.delete(keys[0]);
    expect(earnedBadges(ctx)).not.toContain("treble-done:piano");
  });
});

describe("shop", () => {
  it("refuses what cannot be bought", () => {
    const hat = shopItem("hat-top")!;
    expect(buyRefusal(hat, 10, new Set(), 0, 2)).toBe("coins");
    expect(buyRefusal(hat, 50, new Set(["hat-top"]), 0, 2)).toBe("owned");
    expect(buyRefusal(hat, 50, new Set(), 0, 2)).toBeNull();
    const shield = shopItem("shield")!;
    expect(buyRefusal(shield, 100, new Set(["shield"]), 1, 2)).toBeNull();
    expect(buyRefusal(shield, 100, new Set(), 2, 2)).toBe("shields");
    expect(SHOP_ITEMS.every((i) => i.price > 0)).toBe(true);
  });
});
