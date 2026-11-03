/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { dayKey } from "./engine/common/dates.ts";
import { decidePush, FALLBACK_MESSAGE, reminderMessage, type ReminderMessage } from "./engine/game/reminder.ts";
import { emptyWallet, rolledToDay } from "./engine/game/rules.ts";
import { db, type Profile } from "./storage/db.ts";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Parameters<typeof precacheAndRoute>[0] };

// The app works offline: everything is precached, and a new version takes over at once.
void self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")));

async function notify({ title, body }: ReminderMessage, profile?: Profile): Promise<void> {
  await self.registration.showNotification(title, {
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
  const profiles = (await db.profiles.toArray()).filter((p) => p.reminder);
  const wallets = await Promise.all(profiles.map(async (p) => rolledToDay((await db.wallets.get(p.id)) ?? emptyWallet(today), today)));
  const decision = decidePush(
    profiles.map((p, i) => ({
      time: p.reminder!.time,
      lastGoalDate: wallets[i].lastGoalDate,
      lastSentDate: p.reminder!.lastShown ?? null,
      testUntil: p.reminder!.testUntil ?? null,
    })),
    at,
    now.getTime(),
  );
  for (const { index, counts } of decision.show) {
    const profile = profiles[index];
    await notify(reminderMessage(profile.name, wallets[index], today), profile);
    await db.profiles.update(profile.id, { reminder: { ...profile.reminder!, testUntil: undefined, lastShown: counts ? today : profile.reminder!.lastShown } });
  }
  // A push must always show something, or the browser takes the permission away.
  if (decision.fallback) await notify(FALLBACK_MESSAGE[decision.fallback]);
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
