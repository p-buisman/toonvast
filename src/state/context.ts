import { createContext } from "react";
import type { Wallet } from "../engine/game/rules.ts";
import type { Profile } from "../storage/db.ts";
import type { Nav } from "./navigation.ts";

export interface AppState {
  profile: Profile | null;
  wallet: Wallet;
  chooseProfile: (id: string | null) => void;
  nav: Nav;
}

export const AppCtx = createContext<AppState | null>(null);
