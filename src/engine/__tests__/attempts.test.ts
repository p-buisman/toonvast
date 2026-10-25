import { Rating } from "ts-fsrs";
import { describe, expect, it } from "vitest";
import { answerDistance } from "../learning/answers.ts";
import { suggestLesson } from "../learning/lesson.ts";
import { moduleById } from "../learning/modules.ts";
import { rateAnswer, recognitionScore } from "../learning/scheduler.ts";
import { sessionScore } from "../learning/session.ts";
import type { NoteItem } from "../learning/items.ts";

const earPiano = moduleById("ear-note-piano");
const c4: NoteItem = { kind: "note", key: "treble:C4", clef: "treble", pitch: { letter: "C", acc: 0, octave: 4 } };

describe("distance of a heard answer", () => {
  it("counts semitones for a note", () => {
    expect(answerDistance(earPiano, c4, { kind: "piano", midi: 60 })).toBe(0);
    expect(answerDistance(earPiano, c4, { kind: "piano", midi: 62 })).toBe(2);
    expect(answerDistance(earPiano, c4, { kind: "piano", midi: 55 })).toBe(5);
  });

  it("counts two semitones per missing chord note", () => {
    const chords = moduleById("ear-chord-piano-keys");
    const item = {
      kind: "chord" as const,
      key: "x",
      clef: "treble" as const,
      chord: { root: { letter: "C" as const, acc: 0 as const }, quality: "major" as const, inversion: 0 as const },
      voicing: [],
    };
    expect(answerDistance(chords, item, { kind: "pianoSet", midis: [60, 64, 67] })).toBe(0);
    expect(answerDistance(chords, item, { kind: "pianoSet", midis: [60, 64, 69] })).toBe(2);
    expect(answerDistance(chords, item, { kind: "pianoSet", midis: [61, 65, 69] })).toBe(6);
  });
});

describe("rating with attempts and distance", () => {
  it("is Hard on a second try and on a miss by a semitone, Again further off", () => {
    expect(rateAnswer(true, 1000, null)).toBe(Rating.Good);
    expect(rateAnswer(true, 1000, null, 2, 3)).toBe(Rating.Hard);
    expect(rateAnswer(false, 1000, null, 2, 1)).toBe(Rating.Hard);
    expect(rateAnswer(false, 1000, null, 2, 2)).toBe(Rating.Again);
    expect(rateAnswer(false, 1000, null)).toBe(Rating.Again);
  });

  it("scores recognition between 0 and 1", () => {
    expect(recognitionScore(true, 1, 0)).toBe(1);
    expect(recognitionScore(true, 2, 1)).toBeCloseTo(0.55);
    expect(recognitionScore(true, 2, 12)).toBeCloseTo(0.4);
    expect(recognitionScore(false, 2, 1)).toBeCloseTo(0.28);
    expect(recognitionScore(false, 2, 7)).toBe(0);
    expect(sessionScore([{ correct: true }, { correct: false, score: 0.28 }])).toBeCloseTo(0.64);
    expect(sessionScore([])).toBeNull();
  });
});

describe("the next lesson", () => {
  const goals = [moduleById("note-name"), moduleById("note-piano"), moduleById("ear-note-piano")];
  const now = new Date("2026-10-25T10:00:00Z");
  it("prefers the module with the most due cards", () => {
    const cards = [
      { moduleId: "note-piano" as const, due: now.getTime() - 1, reps: 2 },
      { moduleId: "note-piano" as const, due: now.getTime() - 1, reps: 2 },
      { moduleId: "note-name" as const, due: now.getTime() - 1, reps: 2 },
      { moduleId: "note-name" as const, due: now.getTime() + 9e6, reps: 2 },
    ];
    expect(suggestLesson(goals, cards, [], now)?.module.id).toBe("note-piano");
    expect(suggestLesson(goals, cards, [], now)?.reason).toBe("2 items te herhalen");
  });

  it("falls back to a module never practised, then the oldest", () => {
    const sessions = [
      { moduleId: "note-name" as const, endedAt: 1 },
      { moduleId: "note-piano" as const, endedAt: 5 },
    ];
    expect(suggestLesson(goals, [], sessions, now)?.module.id).toBe("ear-note-piano");
    const all = [...sessions, { moduleId: "ear-note-piano" as const, endedAt: 9 }];
    expect(suggestLesson(goals, [], all, now)?.module.id).toBe("note-name");
    expect(suggestLesson([], [], [], now)).toBeNull();
  });
});
