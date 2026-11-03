import { describe, expect, it } from "vitest";
import { isReminderTime, localMoment, reminderDue, reminderText, REMINDER_TIMES } from "../game/reminder.ts";
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

  it("says what is at stake", () => {
    const today = "2026-11-03";
    const wallet = { ...emptyWallet(today), lastGoalDate: "2026-11-02" };
    expect(reminderText("Noor", emptyWallet(today), today)).toBe("Noor, tijd voor een rondje muziek?");
    expect(reminderText("Noor", { ...wallet, streak: 1 }, today)).toBe("Noor, je reeks staat op 1 dag. Even oefenen?");
    expect(reminderText("Noor", { ...wallet, streak: 3 }, today)).toBe("Noor, je reeks staat op 3 dagen. Even oefenen?");
    expect(reminderText("Noor", { ...wallet, streak: 6 }, today)).toBe("Noor, je reeks staat op 6 dagen. Oefen vandaag en je krijgt een gratis beschermer.");
    expect(reminderText("Noor", { ...wallet, streak: 6, shields: MAX_SHIELDS }, today)).toContain(`${SHIELD_PRICE} munten`);
    expect(reminderText("Noor", { ...wallet, streak: 4, shields: 1, lastGoalDate: "2026-11-01" }, today)).toContain("beschermer je reeks heel");
  });
});
