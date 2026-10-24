import { useCallback, useState } from "react";
import type { ModuleId } from "../engine/learning/modules.ts";
import type { SessionSummary } from "./finishSession.ts";

export type Route =
  | { name: "profiles" }
  | { name: "newProfile" }
  | { name: "welcome" }
  | { name: "home" }
  | { name: "settings"; moduleId: ModuleId }
  | { name: "exercise"; moduleId: ModuleId; nonce: number }
  | { name: "result"; moduleId: ModuleId; summary: SessionSummary }
  | { name: "progress" }
  | { name: "shop" }
  | { name: "shapes"; moduleId: ModuleId }
  | { name: "profile" };

export interface Nav {
  route: Route;
  go: (route: Route) => void;
  replace: (route: Route) => void;
  back: () => void;
  reset: (route: Route) => void;
}

/** A simple screen stack; the app has no deep links, so no router is needed. */
export function useNavigation(start: Route): Nav {
  const [stack, setStack] = useState<Route[]>([start]);
  const go = useCallback((route: Route) => setStack((s) => [...s, route]), []);
  const replace = useCallback((route: Route) => setStack((s) => [...s.slice(0, -1), route]), []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const reset = useCallback((route: Route) => setStack([route]), []);
  return { route: stack[stack.length - 1], go, replace, back, reset };
}
