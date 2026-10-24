import Dexie, { type EntityTable } from "dexie";
import type { Wallet } from "../engine/game/rules.ts";
import type { ModuleId } from "../engine/learning/modules.ts";
import type { CardRecord } from "../engine/learning/scheduler.ts";
import type { ModuleSettings } from "../engine/learning/settings.ts";

export interface Avatar {
  color: string;
  hat: string | null;
}

export interface Profile {
  id: string;
  name: string;
  avatar: Avatar;
  kidMode: boolean;
  dayGoal: number;
  theme: string;
  createdAt: number;
  /** Last time this profile was chosen; the list is sorted on it. */
  lastUsedAt: number;
}

export interface SettingsRecord {
  /** `${profileId}:${moduleId}` */
  id: string;
  profileId: string;
  moduleId: ModuleId;
  settings: ModuleSettings;
}

export interface WalletRecord extends Wallet {
  profileId: string;
}

export interface StoredCard extends CardRecord {
  /** `${profileId}:${moduleId}:${itemKey}` */
  id: string;
}

export interface SessionAnswer {
  itemKey: string;
  correct: boolean;
  ms: number;
}

export interface SessionRecord {
  id: string;
  profileId: string;
  moduleId: ModuleId;
  startedAt: number;
  endedAt: number;
  answers: SessionAnswer[];
  xp: number;
  coins: number;
}

export interface ModuleStats {
  /** `${profileId}:${moduleId}` */
  id: string;
  profileId: string;
  moduleId: ModuleId;
  /** Exponential moving average of correct reaction times, in ms. */
  emaMs: number;
  count: number;
}

export class ToonvastDb extends Dexie {
  profiles!: EntityTable<Profile, "id">;
  settings!: EntityTable<SettingsRecord, "id">;
  wallets!: EntityTable<WalletRecord, "profileId">;
  cards!: EntityTable<StoredCard, "id">;
  sessions!: EntityTable<SessionRecord, "id">;
  moduleStats!: EntityTable<ModuleStats, "id">;

  constructor(name = "toonvast") {
    super(name);
    this.version(1).stores({
      profiles: "id, lastUsedAt",
      settings: "id, profileId",
      wallets: "profileId",
      cards: "id, profileId, [profileId+moduleId]",
      sessions: "id, profileId, [profileId+moduleId], startedAt",
      moduleStats: "id, profileId",
    });
  }
}

export const db = new ToonvastDb();
