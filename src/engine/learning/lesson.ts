import type { ModuleDef, ModuleId } from "./modules.ts";
import { isDue, type CardRecord } from "./scheduler.ts";

export interface LessonPick {
  module: ModuleDef;
  /** Why this one, in Dutch, for the card on the home screen. */
  reason: string;
}

/**
 * The next lesson among the modules a profile wants to learn: the module with the most cards due for repetition;
 * when nothing is due, one never practised (in the order of the goals); otherwise the one practised longest ago.
 */
export function suggestLesson(
  goals: readonly ModuleDef[],
  cards: readonly Pick<CardRecord, "moduleId" | "due" | "reps">[],
  sessions: readonly { moduleId: ModuleId; endedAt: number }[],
  now: Date,
): LessonPick | null {
  if (goals.length === 0) return null;
  let best: { module: ModuleDef; due: number } | null = null;
  for (const module of goals) {
    const due = cards.filter((c) => c.moduleId === module.id && c.reps > 0 && isDue(c, now)).length;
    if (due > 0 && (!best || due > best.due)) best = { module, due };
  }
  if (best) return { module: best.module, reason: `${best.due} ${best.due === 1 ? "item" : "items"} te herhalen` };

  const lastAt = new Map<ModuleId, number>();
  for (const s of sessions) lastAt.set(s.moduleId, Math.max(lastAt.get(s.moduleId) ?? 0, s.endedAt));
  const fresh = goals.find((m) => !lastAt.has(m.id));
  if (fresh) return { module: fresh, reason: "nog niet geoefend" };

  const oldest = goals.reduce((a, b) => (lastAt.get(b.id)! < lastAt.get(a.id)! ? b : a));
  return { module: oldest, reason: "het langst geleden geoefend" };
}
