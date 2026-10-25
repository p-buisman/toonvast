import { dayKey } from "../engine/common/dates.ts";
import { bookSession, COINS_CORRECT, levelFor, xpForAnswer } from "../engine/game/rules.ts";
import type { ModuleDef } from "../engine/learning/modules.ts";
import { answerScore } from "../engine/learning/session.ts";
import { newCardRecord, rateAnswer, review, type CardRecord } from "../engine/learning/scheduler.ts";
import type { Profile, SessionAnswer } from "../storage/db.ts";
import {
  awardBadges,
  getModuleStats,
  getWallet,
  newId,
  saveCards,
  saveSession,
  saveWallet,
  totalCorrect,
  typicalMs,
  updateModuleStats,
} from "../storage/repo.ts";
import { COINS_BADGE, earnedBadges } from "../engine/game/badges.ts";
import { MODULES, type ModuleId } from "../engine/learning/modules.ts";
import { db } from "../storage/db.ts";

export interface SessionSummary {
  total: number;
  correct: number;
  xp: number;
  coins: number;
  goalReached: boolean;
  leveledUp: boolean;
  streak: number;
  level: number;
  /** Badges earned with this session. */
  newBadges: string[];
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
    const attempts = a.attempts ?? 1;
    changed.set(a.itemKey, review(rec, rateAnswer(a.correct, a.ms, typical, attempts, a.distance ?? null), at, a.ms));
    const fast = a.correct && attempts === 1 && typical !== null && a.ms < typical;
    const gain = xpForAnswer(a.correct, fast, combo);
    // A second try earns a share of the XP, as well as it was recognised.
    xp += attempts > 1 ? Math.round(gain.xp * answerScore(a)) : gain.xp;
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
  const newBadges = await checkBadges(profile.id, outcome.wallet.streak);
  return {
    total: answers.length,
    correct: answers.filter((a) => a.correct).length,
    xp,
    coins: outcome.coinsEarned + newBadges.length * COINS_BADGE,
    newBadges,
    goalReached: outcome.goalReached,
    leveledUp: outcome.leveledUp,
    streak: outcome.wallet.streak,
    level: levelFor(outcome.wallet.xp).level,
  };
}

/** Look at everything the profile has done and hand out the badges that are new. */
async function checkBadges(profileId: string, streak: number): Promise<string[]> {
  const allCards = await db.cards.where("profileId").equals(profileId).toArray();
  const cardsByModule = new Map<ModuleId, Map<string, CardRecord>>();
  for (const m of MODULES) cardsByModule.set(m.id, new Map());
  for (const c of allCards) cardsByModule.get(c.moduleId)?.set(c.itemKey, c);
  const stats = await db.moduleStats.where("profileId").equals(profileId).toArray();
  const statsByModule = new Map(stats.map((s) => [s.moduleId, { emaMs: s.emaMs, count: s.count }]));
  const earned = earnedBadges({ totalCorrect: await totalCorrect(profileId), streak, cardsByModule, statsByModule });
  return awardBadges(profileId, earned);
}
