import { MODULES, PLAYABLE_PHASE, type ModuleDef, type ModuleId } from "./modules.ts";

/** The modules a profile can choose as learning goals: everything playable now. */
export function goalCandidates(): ModuleDef[] {
  return MODULES.filter((m) => m.phase <= PLAYABLE_PHASE);
}

/** The goal modules of a profile, in module order; no choice yet means every playable module. */
export function goalModules(goals: readonly ModuleId[] | undefined): ModuleDef[] {
  const candidates = goalCandidates();
  if (!goals) return candidates;
  const wanted = new Set(goals);
  return candidates.filter((m) => wanted.has(m.id));
}

/** A goal set with one module switched on or off; never empty, so a lesson can always be suggested. */
export function toggleGoal(goals: readonly ModuleId[] | undefined, id: ModuleId): ModuleId[] {
  const current = goalModules(goals).map((m) => m.id);
  if (current.includes(id)) return current.length > 1 ? current.filter((g) => g !== id) : current;
  return goalCandidates()
    .map((m) => m.id)
    .filter((g) => g === id || current.includes(g));
}
