export type Instrument = "theory" | "piano" | "guitar";
export const INSTRUMENT_NAME: Record<Instrument, string> = { theory: "Theorie", piano: "Piano", guitar: "Gitaar" };
export const INSTRUMENTS: readonly Instrument[] = ["theory", "piano", "guitar"];

/** What is learned: single notes, triads or keys (a melody in a key). */
export type ItemKind = "note" | "chord" | "key";
/** How the question is shown: on the staff, as a name, played, or played and shown at once. */
export type QuestionKind = "staff" | "name" | "sound" | "sound+staff";
/** How the answer is given. */
export type AnswerKind = "name" | "piano" | "guitar" | "staff" | "key";
/** Which samples a module plays: the guitar modules sound like a guitar. */
export type Timbre = "piano" | "guitar";

export type ModuleId =
  | "note-name"
  | "note-piano"
  | "note-guitar"
  | "chord-name"
  | "chord-read-piano"
  | "chord-piano"
  | "chord-staff"
  | "chord-guitar"
  | "ear-note-staff"
  | "ear-note-piano"
  | "ear-note-guitar"
  | "ear-chord-piano-staff"
  | "ear-chord-piano-keys"
  | "ear-chord-guitar-staff"
  | "ear-chord-guitar-shape"
  | "key-read"
  | "key-hear-read"
  | "key-hear";

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
  timbre: Timbre;
}

const P = "piano" as const;
const G = "guitar" as const;

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
    timbre: P,
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
    timbre: P,
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
    timbre: G,
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
    timbre: P,
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
    timbre: P,
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
    timbre: P,
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
    timbre: P,
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
    timbre: G,
  },
  {
    id: "ear-note-staff",
    title: "Toon horen → notenbalk",
    description: "Afgespeelde toon → noot op de notenbalk",
    instrument: "theory",
    kind: "note",
    question: "sound",
    answer: "staff",
    clefs: "any",
    writtenOffset: 0,
    phase: 3,
    timbre: P,
  },
  {
    id: "ear-note-piano",
    title: "Toon horen → piano",
    description: "Afgespeelde toon → toets",
    instrument: "piano",
    kind: "note",
    question: "sound",
    answer: "piano",
    clefs: "any",
    writtenOffset: 0,
    phase: 3,
    timbre: P,
  },
  {
    id: "ear-note-guitar",
    title: "Toon horen → gitaar",
    description: "Afgespeelde toon → positie op de hals",
    instrument: "guitar",
    kind: "note",
    question: "sound",
    answer: "guitar",
    clefs: "treble",
    writtenOffset: 12,
    phase: 3,
    timbre: G,
  },
  {
    id: "ear-chord-piano-staff",
    title: "Piano-akkoord horen → notenbalk",
    description: "Afgespeeld piano-akkoord → drie noten op de notenbalk",
    instrument: "theory",
    kind: "chord",
    question: "sound",
    answer: "staff",
    clefs: "any",
    writtenOffset: 0,
    phase: 3,
    timbre: P,
  },
  {
    id: "ear-chord-piano-keys",
    title: "Piano-akkoord horen → toetsen",
    description: "Afgespeeld piano-akkoord → drie toetsen",
    instrument: "piano",
    kind: "chord",
    question: "sound",
    answer: "piano",
    clefs: "any",
    writtenOffset: 0,
    phase: 3,
    timbre: P,
  },
  {
    id: "ear-chord-guitar-staff",
    title: "Gitaarakkoord horen → notenbalk",
    description: "Afgespeeld gitaarakkoord → de drie noten van het akkoord",
    instrument: "theory",
    kind: "chord",
    question: "sound",
    answer: "staff",
    clefs: "any",
    writtenOffset: 0,
    phase: 3,
    timbre: G,
  },
  {
    id: "ear-chord-guitar-shape",
    title: "Gitaarakkoord horen → greep",
    description: "Afgespeeld gitaarakkoord → greep",
    instrument: "guitar",
    kind: "chord",
    question: "sound",
    answer: "guitar",
    clefs: "treble",
    writtenOffset: 12,
    phase: 3,
    timbre: G,
  },
  {
    id: "key-read",
    title: "Toonsoort lezen",
    description: "Melodie met voortekens vooraan → toonsoort",
    instrument: "theory",
    kind: "key",
    question: "staff",
    answer: "key",
    clefs: "any",
    writtenOffset: 0,
    phase: 4,
    timbre: P,
  },
  {
    id: "key-hear-read",
    title: "Toonsoort horen en lezen",
    description: "Melodie klinkt en staat er, losse voortekens → toonsoort",
    instrument: "theory",
    kind: "key",
    question: "sound+staff",
    answer: "key",
    clefs: "any",
    writtenOffset: 0,
    phase: 4,
    timbre: P,
  },
  {
    id: "key-hear",
    title: "Toonsoort horen",
    description: "Eerst een C, dan de melodie → toonsoort",
    instrument: "theory",
    kind: "key",
    question: "sound",
    answer: "key",
    clefs: "any",
    writtenOffset: 0,
    phase: 4,
    timbre: P,
  },
];

export const PLAYABLE_PHASE = 4;

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
  return m.question === "staff" || m.question === "sound+staff" || m.answer === "staff";
}

/** Is the question (also) played, so that the player listens first and may try twice? */
export function hears(m: ModuleDef): boolean {
  return m.question === "sound" || m.question === "sound+staff";
}

/** Is the question shown on the staff? */
export function showsStaff(m: ModuleDef): boolean {
  return m.question === "staff" || m.question === "sound+staff";
}

/** A chord played on the guitar is its shape (five or six strings), not the written three-note voicing. */
export function playsShape(m: ModuleDef): boolean {
  return m.kind === "chord" && m.timbre === "guitar";
}
