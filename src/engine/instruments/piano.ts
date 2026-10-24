export interface PianoRange {
  low: number;
  high: number;
}

export type PianoRangeId = "auto" | "two" | "four" | "full";
export const PIANO_RANGE_NAME: Record<PianoRangeId, string> = { auto: "Passend", two: "2 octaven", four: "4 octaven", full: "Volledig" };
export const PIANO_RANGES: Record<Exclude<PianoRangeId, "auto">, PianoRange> = {
  two: { low: 48, high: 72 }, // C3–C5
  four: { low: 36, high: 84 }, // C2–C6
  full: { low: 21, high: 108 }, // A0–C8
};

export function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
}

export function whiteKeys(range: PianoRange): number[] {
  const out: number[] = [];
  for (let m = range.low; m <= range.high; m++) if (!isBlackKey(m)) out.push(m);
  return out;
}

export function blackKeys(range: PianoRange): number[] {
  const out: number[] = [];
  for (let m = range.low; m <= range.high; m++) if (isBlackKey(m)) out.push(m);
  return out;
}

/** The smallest range of whole octaves (C to C) that holds every note, at least `minOctaves` wide. */
export function rangeCovering(midis: number[], minOctaves = 2): PianoRange {
  if (midis.length === 0) return PIANO_RANGES.two;
  let low = Math.floor(Math.min(...midis) / 12) * 12;
  let high = Math.ceil(Math.max(...midis) / 12) * 12;
  if (high <= low) high = low + 12;
  while (high - low < minOctaves * 12) {
    if (((high - low) / 12) % 2 === 0) high += 12;
    else low -= 12;
  }
  return { low: Math.max(low, PIANO_RANGES.full.low), high: Math.min(high, PIANO_RANGES.full.high) };
}

export function resolvePianoRange(id: PianoRangeId, midis: number[]): PianoRange {
  return id === "auto" ? rangeCovering(midis) : PIANO_RANGES[id];
}
