import { useEffect, useRef, useState } from "react";
import { playNote, unlockAudio, type Timbre } from "../../audio/sampler.ts";
import { LAST_NOTE_MS, NOTE_MS } from "../../engine/learning/melody.ts";

interface PlayOptions {
  timbre?: Timbre;
  /** A note that sounds first, on its own, before the melody (the reference C). */
  lead?: number;
  onDone?: () => void;
}

/** Plays a melody note by note and tells which note sounds now, so the staff can light it up. Stops on unmount. */
export function useMelodyPlayer() {
  const [playing, setPlaying] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  const stop = () => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    setPlaying(null);
  };
  useEffect(() => stop, []);

  const play = (midis: readonly number[], { timbre = "piano", lead, onDone }: PlayOptions = {}) => {
    stop();
    unlockAudio();
    let at = 0;
    const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    if (lead !== undefined) {
      playNote(lead, 1.2, 0.9, timbre);
      at += LAST_NOTE_MS;
    }
    midis.forEach((midi, i) => {
      const last = i === midis.length - 1;
      later(at, () => {
        setPlaying(i);
        playNote(midi, last ? 1.6 : 0.8, 1, timbre);
      });
      at += last ? LAST_NOTE_MS : NOTE_MS;
    });
    later(at, () => {
      setPlaying(null);
      onDone?.();
    });
  };

  return { playing, play, stop };
}
