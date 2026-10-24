import { dayKey } from "../engine/common/dates.ts";
import { bookSession, COINS_CORRECT, levelFor, xpForAnswer } from "../engine/game/rules.ts";
import type { ModuleDef } from "../engine/learning/modules.ts";
import { newCardRecord, rateAnswer, review, type CardRecord } from "../engine/learning/scheduler.ts";
import type { Profile, SessionAnswer } from "../storage/db.ts";
import { getModuleStats, getWallet, newId, saveCards, saveSession, saveWallet, typicalMs, updateModuleStats } from "../storage/repo.ts";

export interface SessionSummary {
  total: number;
  correct: number;
  xp: number;
  coins: number;
  goalReached: boolean;
  leveledUp: boolean;
  streak: number;
  level: number;
}

/** Book a finished (or abandoned) session: cards, statistics, the session log and the wallet. */
export async function finishSession(
  profile: Profile,
  module: ModuleDef,
  cards: Map<string, CardRecord>,
  answers: SessionAnswer[],
  startedAt: number,
): Promise<SessionSummary> {
  const now = new Date();
  const typical = typicalMs(await getModuleStats(profile.id, module.id));
  let xp = 0;
  let coins = 0;
  let combo = 0;
  const changed = new Map<string, CardRecord>();
  answers.forEach((a, i) => {
    const at = new Date(startedAt + i * 1000);
    const rec = changed.get(a.itemKey) ?? cards.get(a.itemKey) ?? newCardRecord(profile.id, module.id, a.itemKey, at);
    changed.set(a.itemKey, review(rec, rateAnswer(a.correct, a.ms, typical), at, a.ms));
    const fast = a.correct && typical !== null && a.ms < typical;
    const gain = xpForAnswer(a.correct, fast, combo);
    xp += gain.xp;
    combo = gain.combo;
    if (a.correct) coins += COINS_CORRECT;
  });
  await saveCards([...changed.values()]);
  for (const [k, v] of changed) cards.set(k, v);
  await updateModuleStats(
    profile.id,
    module.id,
    answers.filter((a) => a.correct).map((a) => a.ms),
  );
  await saveSession({ id: newId(), profileId: profile.id, moduleId: module.id, startedAt, endedAt: now.getTime(), answers, xp, coins });
  const outcome = bookSession(await getWallet(profile.id), { xp, coins }, profile.dayGoal, dayKey(now));
  await saveWallet(profile.id, outcome.wallet);
  return {
    total: answers.length,
    correct: answers.filter((a) => a.correct).length,
    xp,
    coins: outcome.coinsEarned,
    goalReached: outcome.goalReached,
    leveledUp: outcome.leveledUp,
    streak: outcome.wallet.streak,
    level: levelFor(outcome.wallet.xp).level,
  };
}
