import { describe, expect, it } from "vitest";
import { decidePush, isReminderTime, localMoment, reminderDue, reminderMessage, REMINDER_TIMES } from "../game/reminder.ts";
import { emptyWallet, MAX_SHIELDS, SHIELD_PRICE } from "../game/rules.ts";

describe("the daily reminder", () => {
  it("offers every quarter of an hour", () => {
    expect(REMINDER_TIMES).toHaveLength(96);
    expect(REMINDER_TIMES[0]).toBe("00:00");
    expect(REMINDER_TIMES[REMINDER_TIMES.length - 1]).toBe("23:45");
    expect(isReminderTime("19:00")).toBe(true);
    expect(isReminderTime("19:07")).toBe(false);
  });

  it("is due from its time until an hour later, once a day, unless the goal is reached", () => {
    const state = { time: "19:00", lastGoalDate: null, lastSentDate: null };
    const at = (minutes: number) => ({ date: "2026-11-03", minutes });
    expect(reminderDue(state, at(18 * 60 + 59))).toBe(false);
    expect(reminderDue(state, at(19 * 60))).toBe(true);
    expect(reminderDue(state, at(19 * 60 + 59))).toBe(true);
    expect(reminderDue(state, at(20 * 60))).toBe(false);
    expect(reminderDue({ ...state, lastGoalDate: "2026-11-03" }, at(19 * 60))).toBe(false);
    expect(reminderDue({ ...state, lastSentDate: "2026-11-03" }, at(19 * 60))).toBe(false);
    expect(reminderDue({ ...state, lastGoalDate: "2026-11-02", lastSentDate: "2026-11-02" }, at(19 * 60))).toBe(true);
  });

  it("keeps one profile's practice away from another's reminder", () => {
    const at = { date: "2026-11-03", minutes: 19 * 60 };
    const first = { time: "19:00", lastGoalDate: "2026-11-03", lastSentDate: null };
    const second = { time: "19:00", lastGoalDate: "2026-11-02", lastSentDate: null };
    expect(reminderDue(first, at)).toBe(false);
    expect(reminderDue(second, at)).toBe(true);
  });

  it("reads the clock in the time zone of the person", () => {
    const winter = new Date("2026-11-03T18:00:00Z");
    expect(localMoment(winter, "Europe/Amsterdam")).toEqual({ date: "2026-11-03", minutes: 19 * 60 });
    expect(localMoment(new Date("2026-07-03T17:00:00Z"), "Europe/Amsterdam")).toEqual({ date: "2026-07-03", minutes: 19 * 60 });
    expect(localMoment(new Date("2026-11-03T23:30:00Z"), "Europe/Amsterdam")).toEqual({ date: "2026-11-04", minutes: 30 });
  });

  it("says what is at stake, with a title that is not the app name", () => {
    const today = "2026-11-03";
    const wallet = { ...emptyWallet(today), lastGoalDate: "2026-11-02" };
    const body = (w: typeof wallet) => reminderMessage("Noor", w, today).body;
    expect(reminderMessage("Noor", emptyWallet(today), today)).toEqual({ title: "Noor, tijd om te oefenen", body: "Een kort rondje muziek?" });
    expect(body({ ...wallet, streak: 1 })).toBe("Je reeks staat op 1 dag. Even oefenen?");
    expect(body({ ...wallet, streak: 3 })).toBe("Je reeks staat op 3 dagen. Even oefenen?");
    expect(body({ ...wallet, streak: 6 })).toBe("Je reeks staat op 6 dagen. Oefen vandaag en je krijgt een gratis beschermer.");
    expect(body({ ...wallet, streak: 6, shields: MAX_SHIELDS })).toContain(`${SHIELD_PRICE} munten`);
    expect(body({ ...wallet, streak: 4, shields: 1, lastGoalDate: "2026-11-01" })).toContain("beschermer je reeks heel");
  });
});

describe("what a push becomes on the device", () => {
  const today = "2026-11-03";
  const at = (minutes: number) => ({ date: today, minutes });
  const NOW = 1_000_000;
  const reminder = (changes = {}) => ({ time: "18:00", lastGoalDate: "2026-10-31", lastSentDate: null, testUntil: null, ...changes });

  it("shows the reminder that has not practised, also when the push is late or the clock a little behind", () => {
    expect(decidePush([reminder()], at(18 * 60), NOW)).toEqual({ show: [{ index: 0, counts: true }], fallback: null });
    expect(decidePush([reminder()], at(19 * 60 + 30), NOW).show).toHaveLength(1);
    expect(decidePush([reminder()], at(18 * 60 - 3), NOW).show).toHaveLength(1);
  });

  it("does not let a test count as today's reminder", () => {
    const test = decidePush([reminder({ testUntil: NOW + 1 })], at(18 * 60), NOW);
    expect(test).toEqual({ show: [{ index: 0, counts: false }], fallback: null });
    expect(decidePush([reminder({ testUntil: NOW - 1 })], at(10 * 60), NOW).show).toEqual([]);
  });

  it("shows each profile that is due, and leaves out who practised", () => {
    const decision = decidePush([reminder({ lastGoalDate: today }), reminder(), reminder({ lastSentDate: today }), reminder()], at(18 * 60), NOW);
    expect(decision.show.map((s) => s.index)).toEqual([1, 3]);
  });

  it("only says someone practised when that is so", () => {
    expect(decidePush([reminder({ lastGoalDate: today })], at(18 * 60), NOW)).toEqual({ show: [], fallback: "goal" });
    expect(decidePush([reminder()], at(10 * 60), NOW)).toEqual({ show: [], fallback: "neutral" });
    expect(decidePush([reminder({ lastSentDate: today })], at(18 * 60), NOW)).toEqual({ show: [], fallback: "neutral" });
    expect(decidePush([], at(18 * 60), NOW)).toEqual({ show: [], fallback: "neutral" });
  });
});
