import { STANDARD_TUNING } from "./guitar.ts";

/** Within this many cents a string counts as in tune. */
export const TUNE_TOLERANCE_CENTS = 5;
/** The meter shows this far either way; anything beyond sits at the edge. */
export const METER_RANGE_CENTS = 50;

/** The frequency of a MIDI note in equal temperament, A4 = 440 Hz. */
export function frequencyOf(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** How far a frequency sits from a note, in cents (positive = sharp). */
export function centsOff(hz: number, midi: number): number {
  return 1200 * Math.log2(hz / frequencyOf(midi));
}

export interface StringReading {
  /** 0 = low E … 5 = high E. */
  string: number;
  midi: number;
  cents: number;
}

/** The open string nearest to a frequency, with the deviation in cents. */
export function nearestString(hz: number): StringReading {
  let best: StringReading | null = null;
  STANDARD_TUNING.forEach((midi, string) => {
    const cents = centsOff(hz, midi);
    if (!best || Math.abs(cents) < Math.abs(best.cents)) best = { string, midi, cents };
  });
  return best!;
}

export type TuneAdvice = "tighten" | "loosen" | "ok";

/** Too low: tighten the string; too high: loosen it. */
export function tuneAdvice(cents: number): TuneAdvice {
  if (cents < -TUNE_TOLERANCE_CENTS) return "tighten";
  if (cents > TUNE_TOLERANCE_CENTS) return "loosen";
  return "ok";
}

/** The middle of a few readings: one odd measurement does not move the needle. */
export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
