import { useState } from "react";
import { INSTRUMENTS, type Instrument } from "../engine/learning/modules.ts";

const KEY = "toonvast.instrument";

function read(): Instrument {
  try {
    const v = localStorage.getItem(KEY);
    return INSTRUMENTS.includes(v as Instrument) ? (v as Instrument) : "piano";
  } catch {
    return "piano";
  }
}

/** The instrument tab the player looked at last, shared by the lesson list and the progress page and kept on the device. */
export function useInstrument(): [Instrument, (i: Instrument) => void] {
  const [instrument, setInstrument] = useState<Instrument>(read);
  const pick = (i: Instrument) => {
    setInstrument(i);
    try {
      localStorage.setItem(KEY, i);
    } catch {
      // Not remembered, that is all.
    }
  };
  return [instrument, pick];
}
