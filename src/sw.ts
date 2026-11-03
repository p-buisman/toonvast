/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { dayKey } from "./engine/common/dates.ts";
import { reminderDue, reminderText } from "./engine/game/reminder.ts";
import { emptyWallet, rolledToDay } from "./engine/game/rules.ts";
import { db, type Profile } from "./storage/db.ts";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Parameters<typeof precacheAndRoute>[0] };

// The app works offline: everything is precached, and a new version takes over at once.
void self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")));

async function notify(body: string, profile?: Profile): Promise<void> {
  await self.registration.showNotification("Toonvast", {
    body,
    icon: "icons/icon-192.png",
    tag: profile ? `herinnering-${profile.id}` : "herinnering",
    data: { profileId: profile?.id ?? null },
  });
}

/** The push itself is empty: here on the device it becomes a notification for each profile whose time has come. */
async function showDueReminders(now: Date): Promise<void> {
  const today = dayKey(now);
  const at = { date: today, minutes: now.getHours() * 60 + now.getMinutes() };
  let shown = 0;
  for (const profile of await db.profiles.toArray()) {
    const reminder = profile.reminder;
    if (!reminder) continue;
    const wallet = rolledToDay((await db.wallets.get(profile.id)) ?? emptyWallet(today), today);
    const test = (reminder.testUntil ?? 0) > now.getTime();
    const due = reminderDue({ time: reminder.time, lastGoalDate: wallet.lastGoalDate, lastSentDate: reminder.lastShown ?? null }, at);
    if (!test && !due) continue;
    await notify(reminderText(profile.name, wallet, today), profile);
    await db.profiles.update(profile.id, { reminder: { ...reminder, testUntil: undefined, lastShown: due ? today : reminder.lastShown } });
    shown++;
  }
  // A push must always show something, or the browser takes the permission away. This happens when a reached goal did not get through.
  if (shown === 0) await notify("Goed bezig: je hebt vandaag al geoefend.");
}

self.addEventListener("push", (event) => event.waitUntil(showDueReminders(new Date())));

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const profileId: string | null = event.notification.data?.profileId ?? null;
  event.waitUntil(
    (async () => {
      const [client] = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (client) {
        client.postMessage({ type: "open-profile", profileId });
        await client.focus();
      } else {
        await self.clients.openWindow(profileId ? `./?profiel=${encodeURIComponent(profileId)}` : "./");
      }
    })(),
  );
});
