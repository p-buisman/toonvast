import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AppCtx } from "./context.ts";
import { dayKey } from "../engine/common/dates.ts";
import { emptyWallet, rolledToDay } from "../engine/game/rules.ts";
import { db, type Profile, type WalletRecord } from "../storage/db.ts";
import { useNavigation } from "./navigation.ts";

const STORAGE_KEY = "toonvast.profileId";

function readStoredProfileId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [profileId, setProfileId] = useState<string | null>(readStoredProfileId);
  const nav = useNavigation(profileId ? { name: "home" } : { name: "profiles" });
  const profile = useLiveQuery(() => (profileId ? db.profiles.get(profileId) : Promise.resolve<Profile | undefined>(undefined)), [profileId]);
  const walletRec = useLiveQuery(() => (profileId ? db.wallets.get(profileId) : Promise.resolve<WalletRecord | undefined>(undefined)), [profileId]);

  useEffect(() => {
    // A stored id that no longer exists (deleted profile, restored backup): back to the list.
    if (profileId && profile === undefined && walletRec === undefined) {
      void db.profiles.get(profileId).then((p) => {
        if (!p) {
          setProfileId(null);
          nav.reset({ name: "profiles" });
        }
      });
    }
  }, [profileId, profile, walletRec, nav]);

  const chooseProfile = useCallback((id: string | null) => {
    setProfileId(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable in private mode; the choice then lasts for this visit.
    }
  }, []);

  // A tapped notification opens the app on the profile it is for.
  useEffect(() => {
    const open = (id: string) => {
      void db.profiles.get(id).then((p) => {
        if (!p) return;
        chooseProfile(id);
        nav.reset({ name: "home" });
      });
    };
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("profiel");
    if (fromUrl) {
      url.searchParams.delete("profiel");
      window.history.replaceState(null, "", url);
      open(fromUrl);
    }
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "open-profile" && event.data.profileId) open(event.data.profileId);
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => navigator.serviceWorker?.removeEventListener("message", onMessage);
  }, [chooseProfile, nav]);

  const wallet = rolledToDay(walletRec ? { ...walletRec } : emptyWallet(dayKey()), dayKey());
  return <AppCtx.Provider value={{ profile: profile ?? null, wallet, chooseProfile, nav }}>{children}</AppCtx.Provider>;
}
