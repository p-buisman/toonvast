import { daysBetween } from "../common/dates.ts";

export const XP_CORRECT = 10;
export const XP_FAST = 5;
export const COMBO_FROM = 3;
export const COMBO_STEP = 2;
export const COMBO_MAX = 10;
export const COINS_CORRECT = 1;
export const COINS_GOAL = 10;
export const COINS_LEVEL_UP = 20;
export const SHIELD_PRICE = 40;
export const MAX_SHIELDS = 2;
export const DAY_GOALS = [30, 60, 120] as const;
export type DayGoal = (typeof DAY_GOALS)[number];

/** XP for one answer; `combo` is the number of correct answers in a row before this one. */
export function xpForAnswer(correct: boolean, fast: boolean, combo: number): { xp: number; combo: number } {
  if (!correct) return { xp: 0, combo: 0 };
  const next = combo + 1;
  const bonus = next >= COMBO_FROM ? Math.min(COMBO_MAX, (next - COMBO_FROM + 1) * COMBO_STEP) : 0;
  return { xp: XP_CORRECT + (fast ? XP_FAST : 0) + bonus, combo: next };
}

/** Total XP needed to reach a level: 0, 100, 250, 450, 700, 1000, ... */
export function xpForLevel(level: number): number {
  return 25 * (level - 1) * (level + 2);
}

export function levelFor(xp: number): { level: number; into: number; span: number } {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const from = xpForLevel(level);
  return { level, into: xp - from, span: xpForLevel(level + 1) - from };
}

export interface Wallet {
  xp: number;
  coins: number;
  streak: number;
  shields: number;
  /** Day key of the last day the goal was reached. */
  lastGoalDate: string | null;
  todayDate: string;
  todayXp: number;
}

export function emptyWallet(today: string): Wallet {
  return { xp: 0, coins: 0, streak: 0, shields: 0, lastGoalDate: null, todayDate: today, todayXp: 0 };
}

/** Roll the day counter when a new day has started. */
export function rolledToDay(wallet: Wallet, today: string): Wallet {
  return wallet.todayDate === today ? wallet : { ...wallet, todayDate: today, todayXp: 0 };
}

/** The streak after reaching today's goal: one more, or back to one, with a shield covering one missed day. */
export function extendStreak(wallet: Wallet, today: string): Wallet {
  if (wallet.lastGoalDate === today) return wallet;
  if (wallet.lastGoalDate === null) return { ...wallet, streak: 1, lastGoalDate: today };
  const gap = daysBetween(wallet.lastGoalDate, today);
  if (gap === 1) return { ...wallet, streak: wallet.streak + 1, lastGoalDate: today };
  if (gap === 2 && wallet.shields > 0) return { ...wallet, streak: wallet.streak + 1, shields: wallet.shields - 1, lastGoalDate: today };
  return { ...wallet, streak: 1, lastGoalDate: today };
}

export type StreakStatus = "done" | "open" | "at-risk" | "none";

/** How the streak stands today: goal done, still open (yesterday done), at risk (older, a shield may save it) or none. */
export function streakStatus(wallet: Wallet, today: string): StreakStatus {
  if (wallet.lastGoalDate === today) return "done";
  if (wallet.lastGoalDate === null || wallet.streak === 0) return "none";
  const gap = daysBetween(wallet.lastGoalDate, today);
  if (gap === 1) return "open";
  if (gap === 2 && wallet.shields > 0) return "at-risk";
  return "none";
}

export interface SessionGain {
  xp: number;
  coins: number;
}

export interface SessionOutcome {
  wallet: Wallet;
  goalReached: boolean;
  leveledUp: boolean;
  coinsEarned: number;
}

/** Book a finished session: XP, coins, the day goal (with its coins and the streak) and a possible level-up. */
export function bookSession(wallet: Wallet, gain: SessionGain, goal: number, today: string): SessionOutcome {
  let w = rolledToDay(wallet, today);
  const levelBefore = levelFor(w.xp).level;
  let coins = gain.coins;
  w = { ...w, xp: w.xp + gain.xp, todayXp: w.todayXp + gain.xp };
  const leveledUp = levelFor(w.xp).level > levelBefore;
  if (leveledUp) coins += COINS_LEVEL_UP;
  const goalReached = w.todayXp >= goal && w.lastGoalDate !== today;
  if (goalReached) {
    coins += COINS_GOAL;
    w = extendStreak(w, today);
  }
  w = { ...w, coins: w.coins + coins };
  return { wallet: w, goalReached, leveledUp, coinsEarned: coins };
}
