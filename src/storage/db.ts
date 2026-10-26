import Dexie, { type EntityTable } from "dexie";
import type { AvatarLook } from "../engine/game/avatar.ts";
import type { Wallet } from "../engine/game/rules.ts";
import type { ModuleId } from "../engine/learning/modules.ts";
import type { CardRecord } from "../engine/learning/scheduler.ts";
import type { ModuleSettings } from "../engine/learning/settings.ts";

export interface Avatar {
  color: string;
  /** Shop item ids per slot; null = nothing. `hat` kept its old name. */
  hat: string | null;
  eyes?: string | null;
  ears?: string | null;
  neck?: string | null;
  background?: string | null;
  /** The look: the kind of avatar and its parts. Missing parts take the default look. */
  look?: Partial<AvatarLook>;
}

export interface PurchaseRecord {
  /** `${profileId}:${itemId}` */
  id: string;
  profileId: string;
  itemId: string;
  boughtAt: number;
}

export interface BadgeRecord {
  /** `${profileId}:${badgeId}` */
  id: string;
  profileId: string;
  badgeId: string;
  earnedAt: number;
}

export interface Profile {
  id: string;
  name: string;
  avatar: Avatar;
  kidMode: boolean;
  dayGoal: number;
  theme: string;
  /** The modules this profile wants to learn; missing means every playable module. */
  goals?: ModuleId[];
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
  /** Heard questions get two tries; missing means one. */
  attempts?: number;
  /** How far the best try was off, in semitones; null or missing when unknown. */
  distance?: number | null;
  /** How well it was recognised, 0..1; missing means 1 for right and 0 for wrong. */
  score?: number;
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
  purchases!: EntityTable<PurchaseRecord, "id">;
  badges!: EntityTable<BadgeRecord, "id">;

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
    // Phase 2: the shop and the badges.
    this.version(2).stores({
      purchases: "id, profileId",
      badges: "id, profileId",
    });
  }
}

export const db = new ToonvastDb();
