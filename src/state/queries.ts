import { useLiveQuery } from "dexie-react-hooks";
import { db, type ModuleStats, type PurchaseRecord, type SessionRecord, type SettingsRecord, type StoredCard } from "../storage/db.ts";

/** Live views on one profile's data; they re-render when the tables change. */
export function useProfileCards(profileId: string | undefined): StoredCard[] {
  return useLiveQuery(() => (profileId ? db.cards.where("profileId").equals(profileId).toArray() : Promise.resolve<StoredCard[]>([])), [profileId]) ?? [];
}

export function useProfileSettings(profileId: string | undefined): SettingsRecord[] {
  return (
    useLiveQuery(() => (profileId ? db.settings.where("profileId").equals(profileId).toArray() : Promise.resolve<SettingsRecord[]>([])), [profileId]) ?? []
  );
}

export function useProfileStats(profileId: string | undefined): ModuleStats[] {
  return (
    useLiveQuery(() => (profileId ? db.moduleStats.where("profileId").equals(profileId).toArray() : Promise.resolve<ModuleStats[]>([])), [profileId]) ?? []
  );
}

export function useProfileSessions(profileId: string | undefined): SessionRecord[] {
  return useLiveQuery(() => (profileId ? db.sessions.where("profileId").equals(profileId).toArray() : Promise.resolve<SessionRecord[]>([])), [profileId]) ?? [];
}

const NO_PURCHASES: ReadonlySet<string> = new Set();

/** The shop items a profile owns, as a set of item ids. */
export function useProfilePurchases(profileId: string | undefined): ReadonlySet<string> {
  const rows = useLiveQuery(
    () => (profileId ? db.purchases.where("profileId").equals(profileId).toArray() : Promise.resolve<PurchaseRecord[]>([])),
    [profileId],
  );
  return rows ? new Set(rows.map((r) => r.itemId)) : NO_PURCHASES;
}
