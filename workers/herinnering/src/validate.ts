import { isReminderTime } from "../../../src/engine/game/reminder.ts";

const PUSH_HOSTS = [/\.push\.apple\.com$/, /^fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/];

/** Only the push services of the browsers: the server never posts to an address someone made up. */
export function isPushEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 1024) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && PUSH_HOSTS.some((host) => host.test(url.hostname));
  } catch {
    return false;
  }
}

export function isId(value: string): boolean {
  return /^[A-Za-z0-9_-]{16,64}$/.test(value);
}

export function isDayKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export interface ReminderBody {
  endpoint: string;
  time: string;
  tz: string;
  lastGoalDate: string | null;
}

export function parseReminder(body: unknown): ReminderBody | null {
  if (typeof body !== "object" || body === null) return null;
  const { endpoint, time, tz, lastGoalDate } = body as Record<string, unknown>;
  if (!isPushEndpoint(endpoint) || typeof time !== "string" || !isReminderTime(time) || !isTimeZone(tz)) return null;
  if (lastGoalDate !== null && lastGoalDate !== undefined && !isDayKey(lastGoalDate)) return null;
  return { endpoint, time, tz, lastGoalDate: lastGoalDate ?? null };
}

const ORIGINS = ["https://p-buisman.github.io"];

/** The app itself, and a development server on this machine. */
export function allowedOrigin(origin: string | null): string | null {
  if (!origin) return null;
  return ORIGINS.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ? origin : null;
}
