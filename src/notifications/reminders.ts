import { dayKey } from "../engine/common/dates.ts";
import { newId, getWallet, updateProfile } from "../storage/repo.ts";
import { db, type Profile } from "../storage/db.ts";

/**
 * The daily reminder: a push subscription per device, and per profile a time on the server (`workers/herinnering`). That server
 * sends an empty push when a reminder is due; the service worker (`src/sw.ts`) looks up here on the device who it is for.
 */
const SERVER = "https://toonvast-herinnering.herinnering.workers.dev";
const PUBLIC_KEY = "BMqtbW5-U0eoleieSN3Vn-J0q0LbgiE8hD1swfwv2yG55K04nEKR7B1uEcubkMHLOqCWGM3FD4E46SkQohtl-K4";
const DEVICE_KEY = "toonvast.deviceId";
const WORKER_TIMEOUT_MS = 5000;

export type ReminderSupport = "ok" | "ask" | "install" | "denied" | "unsupported";

function isAppleMobile(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isInstalled(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** Whether this device can get reminders: "ok" with permission, "ask" still to ask, or why not. */
export function reminderSupport(): ReminderSupport {
  if (isAppleMobile() && !isInstalled()) return "install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return Notification.permission === "granted" ? "ok" : "ask";
}

let memoryDeviceId: string | null = null;

/** A random id for this device: it says nothing about who uses it. */
function deviceId(): string {
  try {
    const stored = localStorage.getItem(DEVICE_KEY);
    if (stored) return stored;
    const id = newId();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    memoryDeviceId ??= newId();
    return memoryDeviceId;
  }
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const raw = atob(base64url.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function serviceWorker(): Promise<ServiceWorkerRegistration> {
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Geen service worker.")), WORKER_TIMEOUT_MS));
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

async function pushEndpoint(): Promise<string> {
  const registration = await serviceWorker();
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) }));
  return subscription.endpoint;
}

async function call(path: string, method: string, body?: object): Promise<void> {
  const response = await fetch(`${SERVER}/v1/devices/${deviceId()}${path}`, { method, body: body ? JSON.stringify(body) : undefined });
  if (!response.ok) throw new Error(`Server: ${response.status}`);
}

async function saveOnServer(profileId: string, time: string, endpoint: string): Promise<void> {
  const wallet = await getWallet(profileId);
  await call(`/profiles/${profileId}`, "PUT", { endpoint, time, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, lastGoalDate: wallet.lastGoalDate });
}

/** Turn the reminder on or change its time; asks for permission the first time. Resolves false when that is refused. */
export async function setReminder(profile: Profile, time: string): Promise<boolean> {
  if ((await Notification.requestPermission()) !== "granted") return false;
  await saveOnServer(profile.id, time, await pushEndpoint());
  await updateProfile(profile.id, { reminder: { ...profile.reminder, time } });
  return true;
}

/** Turn the reminder of a profile off; the device stops listening when no profile has one any more. */
export async function removeReminder(profile: Profile): Promise<void> {
  await call(`/profiles/${profile.id}`, "DELETE");
  await updateProfile(profile.id, { reminder: undefined });
  const others = await db.profiles.filter((p) => p.reminder !== undefined).count();
  if (others === 0) {
    const subscription = await (await serviceWorker()).pushManager.getSubscription();
    await subscription?.unsubscribe();
  }
}

/** A real push through the server, shown as a test by the service worker. */
export async function sendTestReminder(profile: Profile): Promise<void> {
  if (!profile.reminder) return;
  await updateProfile(profile.id, { reminder: { ...profile.reminder, testUntil: Date.now() + 60_000 } });
  await saveOnServer(profile.id, profile.reminder.time, await pushEndpoint());
  await call("/test", "POST");
}

/** Tell the server the goal is reached, so no reminder goes out today. Offline this catches up when the app opens again. */
export function reportGoalReached(profile: Profile): void {
  if (!profile.reminder || reminderSupport() !== "ok") return;
  call(`/profiles/${profile.id}/goal`, "POST", { date: dayKey() }).catch(() => undefined);
}

/** When the app opens: the push address may have changed, and a reached goal may not have come through. */
export async function syncReminders(): Promise<void> {
  if (reminderSupport() !== "ok") return;
  const profiles = await db.profiles.filter((p) => p.reminder !== undefined).toArray();
  if (profiles.length === 0) return;
  try {
    const endpoint = await pushEndpoint();
    await Promise.all(profiles.map((p) => saveOnServer(p.id, p.reminder!.time, endpoint)));
  } catch {
    // Offline or no service worker (development): the next opening tries again.
  }
}
