import {
  db,
  type BadgeRecord,
  type ModuleStats,
  type Profile,
  type PurchaseRecord,
  type SessionRecord,
  type SettingsRecord,
  type StoredCard,
  type WalletRecord,
} from "./db.ts";

export const BACKUP_VERSION = 2;

export interface Backup {
  app: "toonvast";
  version: number;
  exportedAt: number;
  profiles: Profile[];
  settings: SettingsRecord[];
  wallets: WalletRecord[];
  cards: StoredCard[];
  sessions: SessionRecord[];
  moduleStats: ModuleStats[];
  purchases: PurchaseRecord[];
  badges: BadgeRecord[];
}

export async function exportBackup(): Promise<Backup> {
  return {
    app: "toonvast",
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    profiles: await db.profiles.toArray(),
    settings: await db.settings.toArray(),
    wallets: await db.wallets.toArray(),
    cards: await db.cards.toArray(),
    sessions: await db.sessions.toArray(),
    moduleStats: await db.moduleStats.toArray(),
    purchases: await db.purchases.toArray(),
    badges: await db.badges.toArray(),
  };
}

export function parseBackup(text: string): Backup {
  const data = JSON.parse(text) as Partial<Backup>;
  if (data.app !== "toonvast" || typeof data.version !== "number") throw new Error("Dit is geen Toonvast-back-up.");
  if (data.version > BACKUP_VERSION) throw new Error("Deze back-up komt uit een nieuwere versie van Toonvast.");
  return {
    app: "toonvast",
    version: data.version,
    exportedAt: data.exportedAt ?? 0,
    profiles: data.profiles ?? [],
    settings: data.settings ?? [],
    wallets: data.wallets ?? [],
    cards: data.cards ?? [],
    sessions: data.sessions ?? [],
    moduleStats: data.moduleStats ?? [],
    purchases: data.purchases ?? [],
    badges: data.badges ?? [],
  };
}

/** Pick the record to keep when both sides have one: the most recently reviewed card, the richest wallet, the newest otherwise. */
export function mergeCards(mine: StoredCard | undefined, theirs: StoredCard): StoredCard {
  if (!mine) return theirs;
  return (theirs.last_review ?? 0) > (mine.last_review ?? 0) ? theirs : mine;
}

export function mergeWallets(mine: WalletRecord | undefined, theirs: WalletRecord): WalletRecord {
  if (!mine) return theirs;
  return theirs.xp > mine.xp ? theirs : mine;
}

/** Merge a backup into the database: profiles are matched on id, nothing is deleted. */
export async function importBackup(backup: Backup): Promise<{ profiles: number }> {
  await db.transaction("rw", [db.profiles, db.settings, db.wallets, db.cards, db.sessions, db.moduleStats, db.purchases, db.badges], async () => {
    for (const p of backup.profiles) {
      const mine = await db.profiles.get(p.id);
      if (!mine || p.lastUsedAt > mine.lastUsedAt) await db.profiles.put(p);
    }
    for (const s of backup.settings) await db.settings.put(s);
    for (const w of backup.wallets) await db.wallets.put(mergeWallets(await db.wallets.get(w.profileId), w));
    for (const c of backup.cards) await db.cards.put(mergeCards(await db.cards.get(c.id), c));
    for (const s of backup.sessions) if (!(await db.sessions.get(s.id))) await db.sessions.put(s);
    for (const m of backup.moduleStats) {
      const mine = await db.moduleStats.get(m.id);
      if (!mine || m.count > mine.count) await db.moduleStats.put(m);
    }
    for (const p of backup.purchases) if (!(await db.purchases.get(p.id))) await db.purchases.put(p);
    for (const b of backup.badges) if (!(await db.badges.get(b.id))) await db.badges.put(b);
  });
  return { profiles: backup.profiles.length };
}

export function backupFileName(date = new Date()): string {
  return `toonvast-backup-${date.toISOString().slice(0, 10)}.json`;
}
