import { describe, expect, it } from "vitest";
import { daysBetween } from "../common/dates.ts";
import { bookSession, coinsForAnswers, emptyWallet, extendStreak, levelFor, streakStatus, xpForAnswer, xpForLevel } from "../game/rules.ts";

describe("rules", () => {
  it("awards XP with speed and combo bonuses", () => {
    expect(xpForAnswer(false, true, 5)).toEqual({ xp: 0, combo: 0 });
    expect(xpForAnswer(true, false, 0)).toEqual({ xp: 10, combo: 1 });
    expect(xpForAnswer(true, true, 1)).toEqual({ xp: 15, combo: 2 });
    expect(xpForAnswer(true, false, 2)).toEqual({ xp: 12, combo: 3 });
    expect(xpForAnswer(true, false, 9)).toEqual({ xp: 20, combo: 10 });
  });

  it("maps XP to levels", () => {
    expect([1, 2, 3, 4, 5, 6].map(xpForLevel)).toEqual([0, 100, 250, 450, 700, 1000]);
    expect(levelFor(0)).toEqual({ level: 1, into: 0, span: 100 });
    expect(levelFor(612)).toEqual({ level: 4, into: 162, span: 250 });
  });

  it("counts days", () => {
    expect(daysBetween("2026-10-23", "2026-10-24")).toBe(1);
    expect(daysBetween("2026-10-31", "2026-11-02")).toBe(2);
  });

  it("extends the streak day by day, with a shield for one missed day", () => {
    let w = emptyWallet("2026-10-20");
    w = extendStreak(w, "2026-10-20");
    expect(w.streak).toBe(1);
    w = extendStreak(w, "2026-10-21");
    expect(w.streak).toBe(2);
    w = extendStreak(w, "2026-10-21");
    expect(w.streak).toBe(2);
    w = extendStreak({ ...w, shields: 1 }, "2026-10-23");
    expect(w.streak).toBe(3);
    expect(w.shields).toBe(0);
    w = extendStreak(w, "2026-10-25");
    expect(w.streak).toBe(1);
    expect(streakStatus(w, "2026-10-25")).toBe("done");
    expect(streakStatus(w, "2026-10-26")).toBe("open");
    expect(streakStatus(w, "2026-10-27")).toBe("none");
    expect(streakStatus({ ...w, shields: 1 }, "2026-10-27")).toBe("at-risk");
  });

  it("gives a coin for every two answers recognised", () => {
    expect(coinsForAnswers(10)).toBe(5);
    expect(coinsForAnswers(7.3)).toBe(3);
    expect(coinsForAnswers(0.6)).toBe(0);
  });

  it("books a session with goal and level-up coins", () => {
    const w = { ...emptyWallet("2026-10-24"), xp: 90 };
    const out = bookSession(w, { xp: 70, coins: 6 }, 60, "2026-10-24");
    expect(out.leveledUp).toBe(true);
    expect(out.goalReached).toBe(true);
    expect(out.coinsEarned).toBe(6 + 10 + 5);
    expect(out.wallet.streak).toBe(1);
    expect(out.wallet.todayXp).toBe(70);
    const again = bookSession(out.wallet, { xp: 10, coins: 1 }, 60, "2026-10-24");
    expect(again.goalReached).toBe(false);
    expect(again.wallet.streak).toBe(1);
    const nextDay = bookSession(again.wallet, { xp: 10, coins: 1 }, 60, "2026-10-25");
    expect(nextDay.wallet.todayXp).toBe(10);
  });
});
