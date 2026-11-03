import { MAX_SHIELDS, SHIELD_PRICE, SHIELD_STREAK, streakStatus, type Wallet } from "./rules.ts";

/** The daily reminder of a profile. Shared by the app, its service worker and the server (`workers/herinnering`). */
export const DEFAULT_REMINDER_TIME = "19:00";
/** A late reminder still goes out within this time; the server looks every quarter of an hour. */
export const REMINDER_WINDOW_MINUTES = 60;

/** Every quarter of an hour of the day: "00:00" to "23:45". */
export const REMINDER_TIMES: readonly string[] = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4);
  return `${String(h).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`;
});

export function isReminderTime(time: string): boolean {
  return REMINDER_TIMES.includes(time);
}

/** A moment on the clock of the person: the day key and the minutes since midnight. */
export interface LocalMoment {
  date: string;
  minutes: number;
}

function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** The local moment in a time zone. */
export function localMoment(now: Date, timeZone: string): LocalMoment {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${part("year")}-${part("month")}-${part("day")}`, minutes: Number(part("hour")) * 60 + Number(part("minute")) };
}

export interface ReminderState {
  time: string;
  /** Day key of the last day the goal was reached. */
  lastGoalDate: string | null;
  /** Day key of the last day the reminder went out. */
  lastSentDate: string | null;
}

/** Whether the reminder goes out now: its time has come today, and today has neither a reached goal nor a reminder yet. */
export function reminderDue(state: ReminderState, at: LocalMoment): boolean {
  if (state.lastGoalDate === at.date || state.lastSentDate === at.date) return false;
  const from = minutesOf(state.time);
  return at.minutes >= from && at.minutes < from + REMINDER_WINDOW_MINUTES;
}

/** The text of the notification, made on the device: the server knows no name and no streak. */
export function reminderText(name: string, wallet: Wallet, today: string): string {
  const status = streakStatus(wallet, today);
  if (status === "at-risk") return `${name}, je hebt gisteren niet geoefend. Oefen vandaag, dan houdt je beschermer je reeks heel.`;
  if (status !== "open") return `${name}, tijd voor een rondje muziek?`;
  const days = `je reeks staat op ${wallet.streak} ${wallet.streak === 1 ? "dag" : "dagen"}`;
  if ((wallet.streak + 1) % SHIELD_STREAK !== 0) return `${name}, ${days}. Even oefenen?`;
  const prize = wallet.shields < MAX_SHIELDS ? "een gratis beschermer" : `${SHIELD_PRICE} munten`;
  return `${name}, ${days}. Oefen vandaag en je krijgt ${prize}.`;
}
