import { MAX_SHIELDS, SHIELD_PRICE, SHIELD_STREAK, streakStatus, type Wallet } from "./rules.ts";

/** The daily reminder of a profile. Shared by the app, its service worker and the server (`workers/herinnering`). */
export const DEFAULT_REMINDER_TIME = "19:00";
/** A late reminder still goes out within this time; the server looks every quarter of an hour. */
export const REMINDER_WINDOW_MINUTES = 60;
/** The clock of a device can run a little behind that of the server. */
const CLOCK_TOLERANCE_MINUTES = 5;

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

/** Whether the reminder is still open today: its time has come, and today has neither a reached goal nor a reminder yet. */
function reminderOpen(state: ReminderState, at: LocalMoment, toleranceMinutes = 0): boolean {
  if (state.lastGoalDate === at.date || state.lastSentDate === at.date) return false;
  return at.minutes >= minutesOf(state.time) - toleranceMinutes;
}

/** Whether the server sends the reminder now. It looks every quarter of an hour, so a late one still goes out for a while. */
export function reminderDue(state: ReminderState, at: LocalMoment): boolean {
  return reminderOpen(state, at) && at.minutes < minutesOf(state.time) + REMINDER_WINDOW_MINUTES;
}

export interface ReminderOnDevice extends ReminderState {
  /** Until this moment (ms) a push shows the test notification. */
  testUntil: number | null;
}

export interface PushDecision {
  /** Indexes of the reminders to show, each with whether it counts as today's reminder (a test does not). */
  show: { index: number; counts: boolean }[];
  /** Nothing to show, while a push must always show something: did someone already reach the goal today? */
  fallback: "goal" | "neutral" | null;
}

/**
 * What a push becomes on the device. The push can arrive late or the clock can differ a little, so here only the start of the
 * reminder counts, with some tolerance: the server has already decided that it is time.
 */
export function decidePush(reminders: readonly ReminderOnDevice[], at: LocalMoment, nowMs: number): PushDecision {
  const show = reminders.flatMap((r, index) => {
    if ((r.testUntil ?? 0) > nowMs) return [{ index, counts: false }];
    return reminderOpen(r, at, CLOCK_TOLERANCE_MINUTES) ? [{ index, counts: true }] : [];
  });
  if (show.length > 0) return { show, fallback: null };
  return { show, fallback: reminders.some((r) => r.lastGoalDate === at.date) ? "goal" : "neutral" };
}

export interface ReminderMessage {
  title: string;
  body: string;
}

/** The notification, made on the device: the server knows no name and no streak. iOS adds "from Toonvast", so the title is not the app name. */
export function reminderMessage(name: string, wallet: Wallet, today: string): ReminderMessage {
  const title = `${name}, tijd om te oefenen`;
  const status = streakStatus(wallet, today);
  if (status === "at-risk") return { title, body: "Je hebt gisteren niet geoefend. Oefen vandaag, dan houdt je beschermer je reeks heel." };
  if (status !== "open") return { title, body: "Een kort rondje muziek?" };
  const days = `Je reeks staat op ${wallet.streak} ${wallet.streak === 1 ? "dag" : "dagen"}.`;
  if ((wallet.streak + 1) % SHIELD_STREAK !== 0) return { title, body: `${days} Even oefenen?` };
  const prize = wallet.shields < MAX_SHIELDS ? "een gratis beschermer" : `${SHIELD_PRICE} munten`;
  return { title, body: `${days} Oefen vandaag en je krijgt ${prize}.` };
}

/** When a push finds no reminder to show. Only says someone practised when that is so. */
export const FALLBACK_MESSAGE: Record<"goal" | "neutral", ReminderMessage> = {
  goal: { title: "Goed bezig", body: "Je hebt vandaag al geoefend." },
  neutral: { title: "Tijd om te oefenen", body: "Een kort rondje muziek?" },
};
