import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from "ts-fsrs";
import type { ModuleId } from "./modules.ts";

/** The FSRS card as stored; dates are epoch milliseconds so they survive IndexedDB and JSON. */
export interface CardRecord {
  profileId: string;
  moduleId: ModuleId;
  itemKey: string;
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: State;
  last_review?: number;
  /** Running average reaction time of correct answers, in ms. */
  avgMs: number;
}

const scheduler = fsrs({ enable_fuzz: false });

export function toCard(rec: CardRecord): Card {
  return {
    due: new Date(rec.due),
    stability: rec.stability,
    difficulty: rec.difficulty,
    elapsed_days: rec.elapsed_days,
    scheduled_days: rec.scheduled_days,
    learning_steps: rec.learning_steps,
    reps: rec.reps,
    lapses: rec.lapses,
    state: rec.state,
    last_review: rec.last_review === undefined ? undefined : new Date(rec.last_review),
  };
}

function fromCard(card: Card, base: Pick<CardRecord, "profileId" | "moduleId" | "itemKey" | "avgMs">): CardRecord {
  return {
    ...base,
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review?.getTime(),
  };
}

export const FAST_FACTOR = 0.7;
export const SLOW_FACTOR = 1.5;

/** Wrong → Again. Right → Good, or Easy when clearly faster than usual, Hard when clearly slower. */
export function rateAnswer(correct: boolean, ms: number, typicalMs: number | null): Grade {
  if (!correct) return Rating.Again;
  if (typicalMs === null) return Rating.Good;
  if (ms < typicalMs * FAST_FACTOR) return Rating.Easy;
  if (ms > typicalMs * SLOW_FACTOR) return Rating.Hard;
  return Rating.Good;
}

export function newCardRecord(profileId: string, moduleId: ModuleId, itemKey: string, now: Date): CardRecord {
  return fromCard(createEmptyCard(now), { profileId, moduleId, itemKey, avgMs: 0 });
}

/** Apply one review; a missing record starts a fresh card. */
export function review(rec: CardRecord, grade: Grade, now: Date, ms: number): CardRecord {
  const { card } = scheduler.next(toCard(rec), now, grade);
  const correct = grade !== Rating.Again;
  const avgMs = !correct ? rec.avgMs : rec.avgMs === 0 ? ms : Math.round(rec.avgMs * 0.7 + ms * 0.3);
  return fromCard(card, { profileId: rec.profileId, moduleId: rec.moduleId, itemKey: rec.itemKey, avgMs });
}

export const MASTERED_STABILITY_DAYS = 7;

export type Mastery = "none" | "learning" | "mastered";

export function masteryOf(rec: CardRecord | undefined): Mastery {
  if (!rec || rec.reps === 0) return "none";
  if (rec.state === State.Review && rec.stability >= MASTERED_STABILITY_DAYS) return "mastered";
  return "learning";
}

export function isDue(rec: CardRecord, now: Date): boolean {
  return rec.due <= now.getTime();
}
