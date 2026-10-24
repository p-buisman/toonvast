import { useContext } from "react";
import { AppCtx, type AppState } from "./context.ts";

export function useApp(): AppState {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp outside AppProvider");
  return ctx;
}
