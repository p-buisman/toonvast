import { localMoment, reminderDue } from "../../../src/engine/game/reminder.ts";
import { allowedOrigin, isDayKey, isId, parseReminder } from "./validate.ts";
import { sendEmptyPush, type VapidKeys } from "./vapid.ts";

interface Statement {
  bind(...values: unknown[]): Statement;
  run(): Promise<unknown>;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
}

interface Database {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<unknown>;
}

export interface Env {
  DB: Database;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
}

interface Row {
  device_id: string;
  profile_id: string;
  endpoint: string;
  time: string;
  tz: string;
  last_goal_date: string | null;
  last_sent_date: string | null;
}

const MAX_PROFILES_PER_DEVICE = 20;
const MAX_ROWS = 10_000;
/** A worker may make only so many requests in one run; who is left over is still due in the next quarter of an hour. */
const MAX_PUSHES_PER_RUN = 40;
const TEST_INTERVAL_MS = 30_000;

const keysOf = (env: Env): VapidKeys => ({ publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY, subject: env.VAPID_SUBJECT });

const lastTest = new Map<string, number>();

/** Whether the devices whose address is gone can be forgotten. */
const gone = (status: number) => status === 404 || status === 410;

async function forgetDevice(env: Env, deviceId: string): Promise<void> {
  await env.DB.prepare("DELETE FROM reminders WHERE device_id = ?").bind(deviceId).run();
}

/** One push per device, however many profiles are due: the app looks up who they are. */
export async function sendDueReminders(env: Env, now: Date): Promise<number> {
  const { results } = await env.DB.prepare("SELECT * FROM reminders").all<Row>();
  const due = new Map<string, { endpoint: string; rows: Row[]; dates: string[] }>();
  for (const row of results) {
    const at = localMoment(now, row.tz);
    if (!reminderDue({ time: row.time, lastGoalDate: row.last_goal_date, lastSentDate: row.last_sent_date }, at)) continue;
    const device = due.get(row.device_id) ?? { endpoint: row.endpoint, rows: [], dates: [] };
    device.rows.push(row);
    device.dates.push(at.date);
    due.set(row.device_id, device);
  }
  let sent = 0;
  for (const [deviceId, device] of [...due].slice(0, MAX_PUSHES_PER_RUN)) {
    const status = await sendEmptyPush(device.endpoint, keysOf(env), now).catch(() => 0);
    if (gone(status)) {
      await forgetDevice(env, deviceId);
    } else if (status >= 200 && status < 300) {
      sent++;
      await env.DB.batch(
        device.rows.map((row, i) =>
          env.DB.prepare("UPDATE reminders SET last_sent_date = ? WHERE device_id = ? AND profile_id = ?").bind(device.dates[i], row.device_id, row.profile_id),
        ),
      );
    }
  }
  return sent;
}

function respond(status: number, origin: string | null, body?: object): Response {
  const headers: Record<string, string> = { Vary: "Origin" };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "PUT, POST, DELETE, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "86400";
  }
  if (body) headers["Content-Type"] = "application/json";
  return new Response(body ? JSON.stringify(body) : null, { status, headers });
}

async function jsonOf(request: Request): Promise<unknown> {
  if (Number(request.headers.get("Content-Length") ?? 0) > 4096) return null;
  return request.json().catch(() => null);
}

async function saveReminder(request: Request, env: Env, deviceId: string, profileId: string, origin: string | null): Promise<Response> {
  const reminder = parseReminder(await jsonOf(request));
  if (!reminder) return respond(400, origin, { error: "invalid" });
  const counts = await env.DB.prepare("SELECT COUNT(*) AS total, SUM(device_id = ?) AS device, SUM(device_id = ? AND profile_id = ?) AS own FROM reminders")
    .bind(deviceId, deviceId, profileId)
    .first<{ total: number; device: number | null; own: number | null }>();
  if (!counts?.own && (counts?.total ?? 0) >= MAX_ROWS) return respond(503, origin, { error: "full" });
  if (!counts?.own && (counts?.device ?? 0) >= MAX_PROFILES_PER_DEVICE) return respond(429, origin, { error: "too-many" });
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO reminders (device_id, profile_id, endpoint, time, tz, last_goal_date) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (device_id, profile_id) DO UPDATE SET endpoint = excluded.endpoint, time = excluded.time, tz = excluded.tz,
         last_goal_date = COALESCE(excluded.last_goal_date, last_goal_date)`,
    ).bind(deviceId, profileId, reminder.endpoint, reminder.time, reminder.tz, reminder.lastGoalDate),
    // A device has one push address: a new one holds for all its profiles.
    env.DB.prepare("UPDATE reminders SET endpoint = ? WHERE device_id = ?").bind(reminder.endpoint, deviceId),
  ]);
  return respond(204, origin);
}

async function sendTest(env: Env, deviceId: string, origin: string | null, now: Date): Promise<Response> {
  if (now.getTime() - (lastTest.get(deviceId) ?? 0) < TEST_INTERVAL_MS) return respond(429, origin, { error: "wait" });
  const row = await env.DB.prepare("SELECT endpoint FROM reminders WHERE device_id = ? LIMIT 1").bind(deviceId).first<{ endpoint: string }>();
  if (!row) return respond(404, origin, { error: "unknown" });
  lastTest.set(deviceId, now.getTime());
  const status = await sendEmptyPush(row.endpoint, keysOf(env), now).catch(() => 0);
  if (gone(status)) await forgetDevice(env, deviceId);
  return status >= 200 && status < 300 ? respond(204, origin) : respond(502, origin, { error: "push", status });
}

async function route(request: Request, env: Env, origin: string | null): Promise<Response> {
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  if (parts[0] !== "v1" || parts[1] !== "devices" || !isId(parts[2] ?? "")) return respond(404, origin);
  const deviceId = parts[2];
  if (parts.length === 4 && parts[3] === "test" && request.method === "POST") return sendTest(env, deviceId, origin, new Date());
  if (parts[3] !== "profiles" || !isId(parts[4] ?? "")) return respond(404, origin);
  const profileId = parts[4];
  if (parts.length === 5 && request.method === "PUT") return saveReminder(request, env, deviceId, profileId, origin);
  if (parts.length === 5 && request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM reminders WHERE device_id = ? AND profile_id = ?").bind(deviceId, profileId).run();
    return respond(204, origin);
  }
  if (parts.length === 6 && parts[5] === "goal" && request.method === "POST") {
    const body = (await jsonOf(request)) as { date?: unknown } | null;
    if (!isDayKey(body?.date)) return respond(400, origin, { error: "invalid" });
    await env.DB.prepare("UPDATE reminders SET last_goal_date = ? WHERE device_id = ? AND profile_id = ?").bind(body.date, deviceId, profileId).run();
    return respond(204, origin);
  }
  return respond(404, origin);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = allowedOrigin(request.headers.get("Origin"));
    if (!origin) return respond(403, null);
    if (request.method === "OPTIONS") return respond(204, origin);
    return route(request, env, origin);
  },
  async scheduled(_event: unknown, env: Env): Promise<void> {
    await sendDueReminders(env, new Date());
  },
};
