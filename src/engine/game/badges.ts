import type { CardRecord } from "../learning/scheduler.ts";
import { masteryOf } from "../learning/scheduler.ts";
import { chordItemsFor, noteItemsFor } from "../learning/items.ts";
import { moduleById, type Instrument, type ModuleId } from "../learning/modules.ts";
import { DEFAULT_SETTINGS } from "../learning/settings.ts";

export const COINS_BADGE = 15;

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  /** Badges about reading notes exist once per instrument. */
  instrument?: Instrument;
  /** The big icon: what the badge is about (an instrument, the streak). */
  icon: string;
  /** The small mark in the corner: an icon name, a number or ♯. */
  mark: string;
}

export interface BadgeContext {
  totalCorrect: number;
  streak: number;
  cardsByModule: ReadonlyMap<ModuleId, ReadonlyMap<string, CardRecord>>;
  statsByModule: ReadonlyMap<ModuleId, { emaMs: number; count: number }>;
}

const NOTE_MODULE: Record<Instrument, ModuleId> = { theory: "note-name", piano: "note-piano", guitar: "note-guitar" };
const EAR_MODULE: Record<Instrument, ModuleId> = { theory: "ear-note-staff", piano: "ear-note-piano", guitar: "ear-note-guitar" };
const INSTRUMENT_LABEL: Record<Instrument, string> = { theory: "theorie", piano: "piano", guitar: "gitaar" };
const INSTRUMENT_ICON: Record<Instrument, string> = { theory: "staff", piano: "piano", guitar: "guitar" };

function perInstrument(id: string, title: string, description: string, instruments: Instrument[], mark: string): BadgeDef[] {
  return instruments.map((i) => ({
    id: `${id}:${i}`,
    title,
    description: `${description} (${INSTRUMENT_LABEL[i]})`,
    instrument: i,
    icon: INSTRUMENT_ICON[i],
    mark,
  }));
}

export const BADGES: readonly BadgeDef[] = [
  { id: "first-ten", title: "Eerste tien", description: "Tien goede antwoorden", icon: "star", mark: "10" },
  ...perInstrument(
    "treble-done",
    "Vioolsleutel klaar",
    "Alle noten binnen de lijnen van de vioolsleutel beheerst",
    ["theory", "piano", "guitar"],
    "treble-clef",
  ),
  ...perInstrument("bass-done", "Bassleutel klaar", "Alle noten binnen de lijnen van de bassleutel beheerst", ["theory", "piano"], "bass-clef"),
  ...perInstrument("ledger", "Hulplijnen", "Alle noten tot één hulplijn beheerst", ["theory", "piano", "guitar"], "ledger"),
  ...perInstrument("fast", "Snelle lezer", "Gemiddeld onder de 2 seconden per noot", ["theory", "piano", "guitar"], "bolt"),
  ...perInstrument("black-white", "Zwart en wit", "Alle kruizen en mollen binnen de lijnen beheerst", ["theory", "piano"], "♯"),
  ...perInstrument("ear", "Goed gehoor", "Alle gehoorde noten binnen de lijnen beheerst", ["theory", "piano", "guitar"], "ear"),
  { id: "streak-5", title: "Vijf dagen", description: "Vijf dagen achter elkaar je dagdoel gehaald", icon: "flame", mark: "5" },
  { id: "streak-30", title: "Dertig dagen", description: "Dertig dagen achter elkaar je dagdoel gehaald", icon: "flame", mark: "30" },
  { id: "open-chords", title: "Open grepen", description: "Alle open akkoorden op de gitaar beheerst", instrument: "guitar", icon: "guitar", mark: "book" },
  {
    id: "chords-piano",
    title: "Drieklanken",
    description: "De drieklanken van C, G en F op de piano beheerst",
    instrument: "piano",
    icon: "piano",
    mark: "notes",
  },
];

export function badgeById(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

function allMastered(cards: ReadonlyMap<string, CardRecord> | undefined, keys: string[]): boolean {
  if (!cards || keys.length === 0) return false;
  return keys.every((k) => masteryOf(cards.get(k)) === "mastered");
}

/** Every badge whose condition holds right now (already earned ones included). */
export function earnedBadges(ctx: BadgeContext): string[] {
  const out: string[] = [];
  if (ctx.totalCorrect >= 10) out.push("first-ten");
  if (ctx.streak >= 5) out.push("streak-5");
  if (ctx.streak >= 30) out.push("streak-30");
  for (const instrument of ["theory", "piano", "guitar"] as Instrument[]) {
    const moduleId = NOTE_MODULE[instrument];
    const module = moduleById(moduleId);
    const cards = ctx.cardsByModule.get(moduleId);
    const keys = (settings: Partial<typeof DEFAULT_SETTINGS>) => noteItemsFor(module, { ...DEFAULT_SETTINGS, ...settings }).map((i) => i.key);
    if (allMastered(cards, keys({ clefs: "treble", range: 0 }))) out.push(`treble-done:${instrument}`);
    if (instrument !== "guitar" && allMastered(cards, keys({ clefs: "bass", range: 0 }))) out.push(`bass-done:${instrument}`);
    if (allMastered(cards, keys({ clefs: instrument === "guitar" ? "treble" : "both", range: 1 }))) out.push(`ledger:${instrument}`);
    if (instrument !== "guitar") {
      const accidentals = keys({ clefs: "both", range: 0, accidentals: "both" }).filter((k) => k.includes("#") || k.includes("b"));
      if (allMastered(cards, accidentals)) out.push(`black-white:${instrument}`);
    }
    const stats = ctx.statsByModule.get(moduleId);
    if (stats && stats.count >= 20 && stats.emaMs < 2000) out.push(`fast:${instrument}`);
    const ear = moduleById(EAR_MODULE[instrument]);
    const earKeys = noteItemsFor(ear, { ...DEFAULT_SETTINGS, clefs: "treble", range: 0 }).map((i) => i.key);
    if (allMastered(ctx.cardsByModule.get(ear.id), earKeys)) out.push(`ear:${instrument}`);
  }
  const guitarChords = chordItemsFor(moduleById("chord-guitar"), { ...DEFAULT_SETTINGS, keys: ["C", "G", "D", "A", "F"], qualities: "both" })
    .filter((i) => ["C", "D", "E", "G", "A"].includes(i.chord.root.letter) && i.chord.root.acc === 0)
    .map((i) => i.key);
  if (allMastered(ctx.cardsByModule.get("chord-guitar"), guitarChords)) out.push("open-chords");
  const pianoChords = chordItemsFor(moduleById("chord-piano"), { ...DEFAULT_SETTINGS, keys: ["C", "G", "F"], qualities: "major" }).map((i) => i.key);
  if (allMastered(ctx.cardsByModule.get("chord-piano"), pianoChords)) out.push("chords-piano");
  return out;
}
