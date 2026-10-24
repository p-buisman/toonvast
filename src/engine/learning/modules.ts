export type Instrument = "theory" | "piano" | "guitar";
export const INSTRUMENT_NAME: Record<Instrument, string> = { theory: "Theorie", piano: "Piano", guitar: "Gitaar" };
export const INSTRUMENTS: readonly Instrument[] = ["theory", "piano", "guitar"];

export type AnswerKind = "name" | "piano" | "guitar";
export type ModuleId = "note-name" | "note-piano" | "note-guitar" | "chord-name" | "chord-piano" | "chord-guitar" | "ear-note" | "key-melody";

export interface ModuleDef {
  id: ModuleId;
  title: string;
  description: string;
  /** Which instrument's progress this module counts for. */
  instrument: Instrument;
  answer: AnswerKind;
  /** Whether the clef setting applies (the guitar is only read in the treble clef). */
  clefs: "any" | "treble";
  /** Written pitch minus sounding pitch, in semitones (12 for the guitar). */
  writtenOffset: number;
  /** Phase from docs/verkenning.md; only phase 1 is playable now. */
  phase: number;
}

export const MODULES: readonly ModuleDef[] = [
  {
    id: "note-name",
    title: "Noten benoemen",
    description: "Noot op de notenbalk → naam",
    instrument: "theory",
    answer: "name",
    clefs: "any",
    writtenOffset: 0,
    phase: 1,
  },
  {
    id: "note-piano",
    title: "Noten lezen → piano",
    description: "Noot op de notenbalk → toets",
    instrument: "piano",
    answer: "piano",
    clefs: "any",
    writtenOffset: 0,
    phase: 1,
  },
  {
    id: "note-guitar",
    title: "Noten lezen → gitaar",
    description: "Noot op de notenbalk → positie op de hals",
    instrument: "guitar",
    answer: "guitar",
    clefs: "treble",
    writtenOffset: 12,
    phase: 1,
  },
  {
    id: "chord-name",
    title: "Akkoorden lezen",
    description: "Drieklank op de notenbalk → naam",
    instrument: "theory",
    answer: "name",
    clefs: "any",
    writtenOffset: 0,
    phase: 2,
  },
  {
    id: "chord-piano",
    title: "Akkoorden op piano",
    description: "Akkoord → drie toetsen",
    instrument: "piano",
    answer: "piano",
    clefs: "any",
    writtenOffset: 0,
    phase: 2,
  },
  {
    id: "chord-guitar",
    title: "Akkoorden op gitaar",
    description: "Akkoord → greep",
    instrument: "guitar",
    answer: "guitar",
    clefs: "treble",
    writtenOffset: 12,
    phase: 2,
  },
  {
    id: "ear-note",
    title: "Toon horen",
    description: "Afgespeelde toon → notenbalk, toets of hals",
    instrument: "theory",
    answer: "name",
    clefs: "any",
    writtenOffset: 0,
    phase: 3,
  },
  {
    id: "key-melody",
    title: "Toonsoort herkennen",
    description: "Melodie → toonsoort",
    instrument: "theory",
    answer: "name",
    clefs: "any",
    writtenOffset: 0,
    phase: 4,
  },
];

export const PLAYABLE_PHASE = 1;

export function moduleById(id: ModuleId): ModuleDef {
  const m = MODULES.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown module ${id}`);
  return m;
}

export function modulesFor(instrument: Instrument): ModuleDef[] {
  return MODULES.filter((m) => m.instrument === instrument);
}
