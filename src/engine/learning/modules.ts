export type Instrument = "theory" | "piano" | "guitar";
export const INSTRUMENT_NAME: Record<Instrument, string> = { theory: "Theorie", piano: "Piano", guitar: "Gitaar" };
export const INSTRUMENTS: readonly Instrument[] = ["theory", "piano", "guitar"];

/** What is learned: single notes or triads. */
export type ItemKind = "note" | "chord";
/** How the question is shown: on the staff, as a name, or played (phase 3). */
export type QuestionKind = "staff" | "name" | "sound";
/** How the answer is given. */
export type AnswerKind = "name" | "piano" | "guitar" | "staff";

export type ModuleId =
  "note-name" | "note-piano" | "note-guitar" | "chord-name" | "chord-read-piano" | "chord-piano" | "chord-staff" | "chord-guitar" | "ear-note" | "key-melody";

export interface ModuleDef {
  id: ModuleId;
  title: string;
  description: string;
  /** Which instrument's progress this module counts for. */
  instrument: Instrument;
  kind: ItemKind;
  question: QuestionKind;
  answer: AnswerKind;
  /** Whether the clef setting applies (the guitar is only read in the treble clef). */
  clefs: "any" | "treble";
  /** Written pitch minus sounding pitch, in semitones (12 for the guitar). */
  writtenOffset: number;
  /** Phase from docs/verkenning.md; modules up to PLAYABLE_PHASE can be played. */
  phase: number;
}

export const MODULES: readonly ModuleDef[] = [
  {
    id: "note-name",
    title: "Noten benoemen",
    description: "Noot op de notenbalk → naam",
    instrument: "theory",
    kind: "note",
    question: "staff",
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
    kind: "note",
    question: "staff",
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
    kind: "note",
    question: "staff",
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
    kind: "chord",
    question: "staff",
    answer: "name",
    clefs: "any",
    writtenOffset: 0,
    phase: 2,
  },
  {
    id: "chord-staff",
    title: "Akkoorden noteren",
    description: "Akkoordnaam → drie noten op de notenbalk",
    instrument: "theory",
    kind: "chord",
    question: "name",
    answer: "staff",
    clefs: "any",
    writtenOffset: 0,
    phase: 2,
  },
  {
    id: "chord-piano",
    title: "Akkoorden op piano",
    description: "Akkoordnaam → drie toetsen",
    instrument: "piano",
    kind: "chord",
    question: "name",
    answer: "piano",
    clefs: "any",
    writtenOffset: 0,
    phase: 2,
  },
  {
    id: "chord-read-piano",
    title: "Akkoorden lezen → piano",
    description: "Drieklank op de notenbalk → drie toetsen",
    instrument: "piano",
    kind: "chord",
    question: "staff",
    answer: "piano",
    clefs: "any",
    writtenOffset: 0,
    phase: 2,
  },
  {
    id: "chord-guitar",
    title: "Akkoorden op gitaar",
    description: "Akkoordnaam → greep",
    instrument: "guitar",
    kind: "chord",
    question: "name",
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
    kind: "note",
    question: "sound",
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
    kind: "note",
    question: "sound",
    answer: "name",
    clefs: "any",
    writtenOffset: 0,
    phase: 4,
  },
];

export const PLAYABLE_PHASE = 2;

export function moduleById(id: ModuleId): ModuleDef {
  const m = MODULES.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown module ${id}`);
  return m;
}

export function modulesFor(instrument: Instrument): ModuleDef[] {
  return MODULES.filter((m) => m.instrument === instrument);
}

/** Does the staff (and so the clef) play a part in this module's question or answer? */
export function usesStaff(m: ModuleDef): boolean {
  return m.question === "staff" || m.answer === "staff";
}
