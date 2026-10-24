import { useLiveQuery } from "dexie-react-hooks";
import { db, type ModuleStats, type SessionRecord, type SettingsRecord, type StoredCard } from "../storage/db.ts";

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
