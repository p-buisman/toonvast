/** Standard tuning, low to high: E2 A2 D3 G3 B3 E4. String 0 is the low E. */
export const STANDARD_TUNING: readonly number[] = [40, 45, 50, 55, 59, 64];
export const STRING_NAMES: readonly string[] = ["E", "A", "D", "G", "B", "e"];

/** Guitar music is written an octave above how it sounds. */
export const GUITAR_WRITTEN_OFFSET = 12;

export interface FretPosition {
  string: number;
  fret: number;
}

export function midiAt(pos: FretPosition): number {
  return STANDARD_TUNING[pos.string] + pos.fret;
}

/** Every way to play a sounding MIDI note with frets 0..maxFret. */
export function positionsFor(midi: number, maxFret = 4): FretPosition[] {
  const out: FretPosition[] = [];
  STANDARD_TUNING.forEach((open, string) => {
    const fret = midi - open;
    if (fret >= 0 && fret <= maxFret) out.push({ string, fret });
  });
  return out;
}

/** Sounding range reachable with frets 0..maxFret. */
export function fretRange(maxFret = 4): { low: number; high: number } {
  return { low: STANDARD_TUNING[0], high: STANDARD_TUNING[5] + maxFret };
}

/** The fingering a beginner learns first: the highest string that has the note, so the lowest fret. */
export function preferredPosition(midi: number, maxFret = 4): FretPosition | null {
  const all = positionsFor(midi, maxFret);
  return all.length === 0 ? null : all[all.length - 1];
}

export function samePosition(a: FretPosition, b: FretPosition): boolean {
  return a.string === b.string && a.fret === b.fret;
}
