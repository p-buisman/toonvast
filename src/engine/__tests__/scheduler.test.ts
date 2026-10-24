import { Rating, State } from "ts-fsrs";
import { describe, expect, it } from "vitest";
import { isDue, masteryOf, newCardRecord, rateAnswer, review } from "../learning/scheduler.ts";

describe("scheduler", () => {
  it("rates by correctness and speed", () => {
    expect(rateAnswer(false, 500, 2000)).toBe(Rating.Again);
    expect(rateAnswer(true, 500, null)).toBe(Rating.Good);
    expect(rateAnswer(true, 1000, 2000)).toBe(Rating.Easy);
    expect(rateAnswer(true, 4000, 2000)).toBe(Rating.Hard);
    expect(rateAnswer(true, 2000, 2000)).toBe(Rating.Good);
  });

  it("schedules reviews and tracks the reaction time", () => {
    const now = new Date("2026-10-24T10:00:00");
    const fresh = newCardRecord("p1", "note-piano", "treble:B4", now);
    expect(masteryOf(fresh)).toBe("none");
    expect(isDue(fresh, now)).toBe(true);
    const once = review(fresh, Rating.Good, now, 1500);
    expect(once.reps).toBe(1);
    expect(once.avgMs).toBe(1500);
    expect(once.due).toBeGreaterThan(now.getTime());
    expect(masteryOf(once)).toBe("learning");
    const twice = review(once, Rating.Again, new Date(once.due), 900);
    expect(twice.lapses + twice.reps).toBeGreaterThan(once.reps);
    expect(twice.avgMs).toBe(1500);
  });

  it("calls a card mastered once it is stable for a week", () => {
    const now = new Date("2026-10-24T10:00:00");
    let rec = newCardRecord("p1", "note-piano", "treble:B4", now);
    let t = now;
    for (let i = 0; i < 6; i++) {
      rec = review(rec, Rating.Easy, t, 800);
      t = new Date(rec.due + 1000);
    }
    expect(rec.state).toBe(State.Review);
    expect(masteryOf(rec)).toBe("mastered");
  });
});
