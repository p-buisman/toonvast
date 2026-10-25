import { shuffle } from "../common/random.ts";
import type { LearnItem } from "./items.ts";
import { isDue, isLearning, type CardRecord } from "./scheduler.ts";

export interface SessionOptions {
  length: number;
  /** How many items may be in the learning phase at once. */
  workingSet: number;
  /** Share of correct answers in the previous session of this module (0..1), or null when there was none. */
  lastScore: number | null;
  now: Date;
  rnd?: () => number;
}

/** The recognition score of a stored answer; older answers have only right or wrong. */
export function answerScore(a: { correct: boolean; score?: number }): number {
  return a.score ?? (a.correct ? 1 : 0);
}

/** The share of a session that went well: the average recognition score of its answers. */
export function sessionScore(answers: readonly { correct: boolean; score?: number }[]): number | null {
  if (answers.length === 0) return null;
  return answers.reduce((sum, a) => sum + answerScore(a), 0) / answers.length;
}

/** New items only come in after a decent session; below this the learner first settles what is there. */
export const NEW_ITEMS_MIN_SCORE = 0.8;

/** How many new items a session may introduce: the free slots of the working set, none after a weak session. */
export function newItemBudget(
  cards: ReadonlyMap<string, CardRecord>,
  items: readonly LearnItem[],
  opts: Pick<SessionOptions, "workingSet" | "lastScore">,
): number {
  if (opts.lastScore !== null && opts.lastScore < NEW_ITEMS_MIN_SCORE) return 0;
  const learning = items.filter((i) => isLearning(cards.get(i.key))).length;
  return Math.max(0, opts.workingSet - learning);
}

/**
 * Pick the questions of a session: first what is due, then new items as far as the working set has room,
 * then the other known items (soonest due first). A short pool is repeated until the session is full,
 * never the same item twice in a row.
 */
export function buildSession(items: readonly LearnItem[], cards: ReadonlyMap<string, CardRecord>, opts: SessionOptions): LearnItem[] {
  const rnd = opts.rnd ?? Math.random;
  const due: { item: LearnItem; at: number }[] = [];
  const fresh: LearnItem[] = [];
  const known: { item: LearnItem; at: number }[] = [];
  for (const item of items) {
    const card = cards.get(item.key);
    if (!card || card.reps === 0) fresh.push(item);
    else if (isDue(card, opts.now)) due.push({ item, at: card.due });
    else known.push({ item, at: card.due });
  }
  due.sort((a, b) => a.at - b.at);
  known.sort((a, b) => a.at - b.at);

  const budget = newItemBudget(cards, items, opts);
  const pool = [...shuffle(due.map((d) => d.item).slice(0, opts.length), rnd), ...fresh.slice(0, budget)];
  const questions: LearnItem[] = [];
  for (const item of pool) if (questions.length < opts.length) questions.push(item);
  for (const k of known) if (questions.length < opts.length) questions.push(k.item);
  if (questions.length === 0) return [];
  const cycle = pool.length > 0 ? pool : questions.slice();
  for (let i = 0; questions.length < opts.length; i++) questions.push(cycle[i % cycle.length]);

  return spreadOut(shuffle(questions, rnd));
}

/** Reorder so that no two neighbours are the same item (when the mix allows it). */
export function spreadOut(questions: LearnItem[]): LearnItem[] {
  const out = [...questions];
  for (let i = 1; i < out.length; i++) {
    if (out[i].key !== out[i - 1].key) continue;
    const j = out.findIndex((q, idx) => idx > i && q.key !== out[i - 1].key);
    if (j === -1) {
      // Nothing different further on: look backwards for a slot where it fits.
      const k = out.findIndex(
        (q, idx) => idx < i - 1 && q.key !== out[i].key && (idx === 0 || out[idx - 1].key !== out[i].key) && out[idx + 1].key !== out[i].key,
      );
      if (k !== -1) [out[i], out[k]] = [out[k], out[i]];
      continue;
    }
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
