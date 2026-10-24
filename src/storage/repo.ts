import { dayKey } from "../engine/common/dates.ts";
import { emptyWallet, type Wallet } from "../engine/game/rules.ts";
import type { ModuleId } from "../engine/learning/modules.ts";
import type { CardRecord } from "../engine/learning/scheduler.ts";
import { withDefaults, type ModuleSettings } from "../engine/learning/settings.ts";
import { db, type Avatar, type ModuleStats, type Profile, type SessionRecord, type StoredCard } from "./db.ts";

export function newId(): string {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const AVATAR_COLORS = ["#e07a5f", "#3d8bd9", "#6c9a4c", "#b8a1e3", "#f4a300", "#2a9d8f"];

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
  await db.transaction("rw", [db.profiles, db.wallets, db.settings, db.cards, db.sessions, db.moduleStats], async () => {
    await db.profiles.delete(id);
    await db.wallets.delete(id);
    await db.settings.where("profileId").equals(id).delete();
    await db.cards.where("profileId").equals(id).delete();
    await db.sessions.where("profileId").equals(id).delete();
    await db.moduleStats.where("profileId").equals(id).delete();
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

/** The typical reaction time once there is enough to go on. */
export function typicalMs(stats: ModuleStats | undefined): number | null {
  return stats && stats.count >= 5 ? stats.emaMs : null;
}
