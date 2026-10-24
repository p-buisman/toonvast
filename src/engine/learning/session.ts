import { shuffle } from "../common/random.ts";
import type { LearnItem } from "./items.ts";
import { isDue, type CardRecord } from "./scheduler.ts";

export interface SessionOptions {
  length: number;
  maxNew: number;
  now: Date;
  rnd?: () => number;
}

/**
 * Pick the questions of a session: first what is due, then a few new items, then the other known items
 * (soonest due first). A short pool is repeated until the session is full, never the same item twice in a row.
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

  const pool = [...shuffle(due.map((d) => d.item).slice(0, opts.length), rnd), ...fresh.slice(0, opts.maxNew)];
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
