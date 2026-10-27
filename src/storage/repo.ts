import { dayKey } from "../engine/common/dates.ts";
import { emptyWallet, type Wallet } from "../engine/game/rules.ts";
import type { ModuleId } from "../engine/learning/modules.ts";
import type { CardRecord } from "../engine/learning/scheduler.ts";
import { withDefaults, type ModuleSettings } from "../engine/learning/settings.ts";
import { db, type Avatar, type ModuleStats, type Profile, type SessionRecord, type StoredCard } from "./db.ts";
import { COINS_BADGE } from "../engine/game/badges.ts";
import { SHIELD_ITEM_ID, type ShopItem } from "../engine/game/shop.ts";
import { sessionScore } from "../engine/learning/session.ts";

export function newId(): string {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Profiles

export async function createProfile(name: string, avatar: Avatar, kidMode: boolean, dayGoal: number): Promise<Profile> {
  const now = Date.now();
  const profile: Profile = { id: newId(), name, avatar, kidMode, dayGoal, theme: "klassiek", createdAt: now, lastUsedAt: now };
  await db.transaction("rw", db.profiles, db.wallets, async () => {
    await db.profiles.add(profile);
    await db.wallets.add({ profileId: profile.id, ...emptyWallet(dayKey()) });
  });
  return profile;
}

export async function updateProfile(id: string, changes: Partial<Omit<Profile, "id">>): Promise<void> {
  await db.profiles.update(id, changes);
}

export async function touchProfile(id: string): Promise<void> {
  await db.profiles.update(id, { lastUsedAt: Date.now() });
}

export async function deleteProfile(id: string): Promise<void> {
  await db.transaction("rw", [db.profiles, db.wallets, db.settings, db.cards, db.sessions, db.moduleStats, db.purchases, db.badges], async () => {
    await db.profiles.delete(id);
    await db.wallets.delete(id);
    await db.settings.where("profileId").equals(id).delete();
    await db.cards.where("profileId").equals(id).delete();
    await db.sessions.where("profileId").equals(id).delete();
    await db.moduleStats.where("profileId").equals(id).delete();
    await db.purchases.where("profileId").equals(id).delete();
    await db.badges.where("profileId").equals(id).delete();
  });
}

// Settings

export async function getSettings(profileId: string, moduleId: ModuleId): Promise<ModuleSettings> {
  const rec = await db.settings.get(`${profileId}:${moduleId}`);
  return withDefaults(rec?.settings);
}

export async function saveSettings(profileId: string, moduleId: ModuleId, settings: ModuleSettings): Promise<void> {
  await db.settings.put({ id: `${profileId}:${moduleId}`, profileId, moduleId, settings });
}

// Wallet

export async function getWallet(profileId: string): Promise<Wallet> {
  const rec = await db.wallets.get(profileId);
  if (rec) {
    const { profileId: _ignored, ...wallet } = rec;
    return wallet;
  }
  const wallet = emptyWallet(dayKey());
  await db.wallets.put({ profileId, ...wallet });
  return wallet;
}

export async function saveWallet(profileId: string, wallet: Wallet): Promise<void> {
  await db.wallets.put({ profileId, ...wallet });
}

// Cards

export function cardId(profileId: string, moduleId: ModuleId, itemKey: string): string {
  return `${profileId}:${moduleId}:${itemKey}`;
}

export async function getCards(profileId: string, moduleId: ModuleId): Promise<Map<string, CardRecord>> {
  const rows = await db.cards.where("[profileId+moduleId]").equals([profileId, moduleId]).toArray();
  return new Map(rows.map((r) => [r.itemKey, r]));
}

export async function saveCards(cards: CardRecord[]): Promise<void> {
  const rows: StoredCard[] = cards.map((c) => ({ ...c, id: cardId(c.profileId, c.moduleId, c.itemKey) }));
  await db.cards.bulkPut(rows);
}

// Sessions and reaction-time statistics

export async function saveSession(session: SessionRecord): Promise<void> {
  await db.sessions.put(session);
}

/** Share of correct answers in the most recent session of a module, or null when there is none. */
export async function lastSessionScore(profileId: string, moduleId: ModuleId): Promise<number | null> {
  const rows = await db.sessions.where("[profileId+moduleId]").equals([profileId, moduleId]).toArray();
  if (rows.length === 0) return null;
  const last = rows.reduce((a, b) => (b.endedAt > a.endedAt ? b : a));
  return sessionScore(last.answers);
}

export async function countSessions(profileId: string, moduleId: ModuleId): Promise<number> {
  return db.sessions.where("[profileId+moduleId]").equals([profileId, moduleId]).count();
}

export async function getModuleStats(profileId: string, moduleId: ModuleId): Promise<ModuleStats | undefined> {
  return db.moduleStats.get(`${profileId}:${moduleId}`);
}

/** Fold the correct reaction times of a session into the running average. */
export async function updateModuleStats(profileId: string, moduleId: ModuleId, correctMs: number[]): Promise<void> {
  if (correctMs.length === 0) return;
  const id = `${profileId}:${moduleId}`;
  const current = (await db.moduleStats.get(id)) ?? { id, profileId, moduleId, emaMs: 0, count: 0 };
  let { emaMs, count } = current;
  for (const ms of correctMs) {
    emaMs = count === 0 ? ms : Math.round(emaMs * 0.8 + ms * 0.2);
    count++;
  }
  await db.moduleStats.put({ id, profileId, moduleId, emaMs, count });
}

// Shop and badges

export async function getPurchases(profileId: string): Promise<Set<string>> {
  const rows = await db.purchases.where("profileId").equals(profileId).toArray();
  return new Set(rows.map((r) => r.itemId));
}

/** Pay for an item: coins off, the item owned (or a shield added). The caller has checked `buyRefusal`. */
export async function buyItem(profileId: string, item: ShopItem): Promise<void> {
  await db.transaction("rw", [db.wallets, db.purchases], async () => {
    const wallet = await db.wallets.get(profileId);
    if (!wallet || wallet.coins < item.price) throw new Error("Niet genoeg munten.");
    const changes: Partial<typeof wallet> = { coins: wallet.coins - item.price };
    if (item.id === SHIELD_ITEM_ID) changes.shields = wallet.shields + 1;
    else await db.purchases.put({ id: `${profileId}:${item.id}`, profileId, itemId: item.id, boughtAt: Date.now() });
    await db.wallets.update(profileId, changes);
  });
}

export async function getBadges(profileId: string): Promise<Set<string>> {
  const rows = await db.badges.where("profileId").equals(profileId).toArray();
  return new Set(rows.map((r) => r.badgeId));
}

/** Store badges that are new for this profile and pay their coins; returns the new ones. */
export async function awardBadges(profileId: string, earned: string[]): Promise<string[]> {
  const owned = await getBadges(profileId);
  const fresh = earned.filter((b) => !owned.has(b));
  if (fresh.length === 0) return [];
  await db.transaction("rw", [db.badges, db.wallets], async () => {
    const now = Date.now();
    await db.badges.bulkPut(fresh.map((badgeId) => ({ id: `${profileId}:${badgeId}`, profileId, badgeId, earnedAt: now })));
    const wallet = await db.wallets.get(profileId);
    if (wallet) await db.wallets.update(profileId, { coins: wallet.coins + fresh.length * COINS_BADGE });
  });
  return fresh;
}

/** Total correct answers of a profile, for the counting badges. */
export async function totalCorrect(profileId: string): Promise<number> {
  const rows = await db.sessions.where("profileId").equals(profileId).toArray();
  return rows.reduce((n, s) => n + s.answers.filter((a) => a.correct).length, 0);
}

/** The typical reaction time once there is enough to go on. */
export function typicalMs(stats: ModuleStats | undefined): number | null {
  return stats && stats.count >= 5 ? stats.emaMs : null;
}
