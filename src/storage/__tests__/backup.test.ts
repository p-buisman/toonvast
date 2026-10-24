import { describe, expect, it } from "vitest";
import { State } from "ts-fsrs";
import { mergeCards, mergeWallets, parseBackup } from "../backup.ts";
import type { StoredCard, WalletRecord } from "../db.ts";

const card = (last_review: number): StoredCard => ({
  id: "p:note-piano:treble:B4",
  profileId: "p",
  moduleId: "note-piano",
  itemKey: "treble:B4",
  due: 0,
  stability: 1,
  difficulty: 5,
  elapsed_days: 0,
  scheduled_days: 0,
  learning_steps: 0,
  reps: 1,
  lapses: 0,
  state: State.Learning,
  last_review,
  avgMs: 1000,
});

describe("backup", () => {
  it("keeps the most recently reviewed card and the richest wallet", () => {
    expect(mergeCards(card(10), card(20)).last_review).toBe(20);
    expect(mergeCards(card(30), card(20)).last_review).toBe(30);
    expect(mergeCards(undefined, card(20)).last_review).toBe(20);
    const w = (xp: number): WalletRecord => ({ profileId: "p", xp, coins: 0, streak: 0, shields: 0, lastGoalDate: null, todayDate: "2026-10-24", todayXp: 0 });
    expect(mergeWallets(w(5), w(9)).xp).toBe(9);
    expect(mergeWallets(w(50), w(9)).xp).toBe(50);
  });

  it("rejects files that are not a backup", () => {
    expect(() => parseBackup("{}")).toThrow(/geen Toonvast/);
    expect(() => parseBackup(JSON.stringify({ app: "toonvast", version: 99 }))).toThrow(/nieuwere/);
    expect(parseBackup(JSON.stringify({ app: "toonvast", version: 1 })).profiles).toEqual([]);
    expect(parseBackup(JSON.stringify({ app: "toonvast", version: 1 })).badges).toEqual([]);
  });
});
