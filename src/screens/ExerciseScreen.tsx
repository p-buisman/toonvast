import { useEffect, useRef, useState } from "react";
import { loadSamples, playChord, playCue, playNote, unlockAudio } from "../audio/sampler.ts";
import { Button } from "../components/common/Button.tsx";
import { Card } from "../components/common/Card.tsx";
import { Chip } from "../components/common/Chip.tsx";
import { ProgressDots, type DotState } from "../components/common/ProgressDots.tsx";
import { IconButton, Screen } from "../components/layout/Screen.tsx";
import { AccidentalToggle } from "../components/music/AccidentalToggle.tsx";
import { ChordDiagram } from "../components/music/ChordDiagram.tsx";
import { ChordNameButtons } from "../components/music/ChordNameButtons.tsx";
import { Fretboard, type FretDot } from "../components/music/Fretboard.tsx";
import { NoteNameButtons } from "../components/music/NoteNameButtons.tsx";
import { Piano } from "../components/music/Piano.tsx";
import { Staff, type StaffNote } from "../components/music/Staff.tsx";
import { chordName, INVERSION_NAME, type Quality } from "../engine/common/chord.ts";
import { CLEF_NAME, pitchAtPosition } from "../engine/common/clef.ts";
import { midiOf, sameSpelling, type Accidental, type Pitch } from "../engine/common/pitch.ts";
import { seeded, shuffle } from "../engine/common/random.ts";
import { type FretPosition, midiAt, positionsFor } from "../engine/instruments/guitar.ts";
import { CHORD_SHAPES, highestFret, shapeFor, shapeMidis, type ChordShape, type Shape } from "../engine/instruments/guitarChords.ts";
import { resolvePianoRange, type PianoRange } from "../engine/instruments/piano.ts";
import { answerDistance, checkAnswer, describeTarget, soundingMidi, type Answer, type Verdict } from "../engine/learning/answers.ts";
import { itemsFor, type ChordItem, type LearnItem } from "../engine/learning/items.ts";
import { moduleById, playsShape, type ModuleId } from "../engine/learning/modules.ts";
import { MAX_ATTEMPTS, recognitionScore, type CardRecord } from "../engine/learning/scheduler.ts";
import { buildSession } from "../engine/learning/session.ts";
import type { ModuleSettings } from "../engine/learning/settings.ts";
import type { SessionAnswer } from "../storage/db.ts";
import { getCards, getSettings, lastSessionScore } from "../storage/repo.ts";
import { finishSession } from "../state/finishSession.ts";
import { useApp } from "../state/useApp.ts";
import { ShapeGallery } from "./ShapesScreen.tsx";
import { ItemGallery } from "../components/music/ItemGallery.tsx";
import { Icon } from "../components/common/Icon.tsx";

const OK = "#22a06b";
const BAD = "#d64545";
const PICK = "#2f6fed";
// The tapped note sounds first; the "right" cue follows once it has been heard.
const CUE_DELAY_MS = 500;
const AUTO_NEXT_MS = 1200;
const STRUM_MS = 45;

interface Loaded {
  settings: ModuleSettings;
  items: LearnItem[];
  cards: Map<string, CardRecord>;
  questions: LearnItem[];
  pianoRange: PianoRange;
  maxFret: number;
}

const PROMPT: Record<string, string> = {
  "note:name": "Welke noot is dit?",
  "note:piano": "Tik de juiste toets",
  "note:guitar": "Tik de juiste plek op de hals",
  "note:staff": "Zet de noot die je hoorde op de notenbalk",
  "chord:name": "Welk akkoord is dit?",
  "chord:piano": "Tik de drie toetsen",
  "chord:staff": "Zet de drie noten op de notenbalk",
  "chord:guitar": "Welke greep hoort erbij?",
};
const HEARD_PROMPT: Record<string, string> = {
  "note:piano": "Tik de toets die je hoorde",
  "note:guitar": "Tik de plek op de hals die je hoorde",
  "note:staff": "Zet de noot die je hoorde op de notenbalk",
  "chord:piano": "Tik de drie toetsen die je hoorde",
  "chord:staff": "Zet de drie noten die je hoorde op de notenbalk",
  "chord:guitar": "Welke greep hoorde je?",
};

const ALL_OPEN: Shape = [0, 0, 0, 0, 0, 0];

function soundingOf(module: ReturnType<typeof moduleById>, item: LearnItem): number[] {
  if (item.kind === "note") return [soundingMidi(module, item.pitch)];
  if (playsShape(module)) {
    const shape = shapeFor(item.chord);
    return shape ? shapeMidis(shape.frets) : item.voicing.map((p) => soundingMidi(module, p));
  }
  return item.voicing.map((p) => soundingMidi(module, p));
}

/**
 * How far a try at a heard question was off, in three steps and without giving the answer away: close (up to four
 * semitones, or one chord note), wrong (five to eight), far off (nine and more).
 */
function retryText(distance: number | null): string {
  if (distance === null) return "Dat was het niet";
  if (distance <= 4) return "Net niet";
  if (distance <= 8) return "Dit klopte niet";
  return "Flink ernaast";
}

export function ExerciseScreen({ moduleId }: { moduleId: ModuleId }) {
  const { profile, nav } = useApp();
  const module = moduleById(moduleId);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<{ answer: Answer; verdict: Verdict } | null>(null);
  const [busy, setBusy] = useState(false);
  /** Shapes in this session the player has never been asked: shown first, so there is something to remember. */
  const [intro, setIntro] = useState<LearnItem[] | null>(null);
  // Multi-step answers: chosen piano keys, notes placed on the staff, a fingering being built.
  const [selected, setSelected] = useState<number[]>([]);
  const [placed, setPlaced] = useState<Pitch[]>([]);
  const [acc, setAcc] = useState<Accidental>(0);
  const [shape, setShape] = useState<Shape>(ALL_OPEN);
  /** Earlier tries at the current heard question: how far off each was. */
  const [tries, setTries] = useState<number[]>([]);
  const [retryHint, setRetryHint] = useState<string | null>(null);
  const shownAt = useRef(0);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!profile) return;
    let alive = true;
    void (async () => {
      const settings = await getSettings(profile.id, moduleId);
      const items = itemsFor(module, settings);
      const cards = await getCards(profile.id, moduleId);
      const lastScore = await lastSessionScore(profile.id, moduleId);
      const questions = buildSession(items, cards, { length: settings.sessionLength, workingSet: settings.workingSet, lastScore, now: new Date() });
      const pianoRange = resolvePianoRange(
        settings.pianoRange,
        items.flatMap((i) => soundingOf(module, i)),
      );
      const shapes = items.flatMap((i) => (i.kind === "chord" ? (shapeFor(i.chord) ?? []) : []));
      if (!alive) return;
      const fresh = new Map<string, LearnItem>();
      for (const q of questions) {
        const card = cards.get(q.key);
        if (!card || card.reps === 0) fresh.set(q.key, q);
      }
      if (fresh.size > 0) setIntro([...fresh.values()]);
      setLoaded({ settings, items, cards, questions, pianoRange, maxFret: highestFret(shapes) });
      void loadSamples(module.timbre);
    })();
    return () => {
      alive = false;
    };
  }, [profile, moduleId, module]);

  useEffect(() => {
    if (loaded && !feedback && !intro) shownAt.current = performance.now();
  }, [loaded, index, feedback, intro]);

  const playQuestion = () => {
    if (!question) return;
    unlockAudio();
    const target = soundingOf(module, question);
    if (target.length === 1) playNote(target[0], 1.6, 1, module.timbre);
    else playChord(target, 2, module.timbre === "guitar" ? STRUM_MS : 0, module.timbre);
  };

  // A heard question plays itself when it appears; the listen button repeats it.
  useEffect(() => {
    if (module.question !== "sound" || !loaded || intro || feedback) return;
    const t = setTimeout(playQuestion, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module.question, loaded, intro, index]);

  const question = loaded?.questions[index];

  const finish = async (all: SessionAnswer[]) => {
    if (!profile || !loaded || busy) return;
    setBusy(true);
    const summary = await finishSession(profile, module, loaded.cards, all, startedAt);
    nav.replace({ name: "result", moduleId, summary });
  };

  const next = (all: SessionAnswer[]) => {
    if (!loaded) return;
    if (index + 1 >= loaded.questions.length) void finish(all);
    else {
      setFeedback(null);
      setSelected([]);
      setPlaced([]);
      setAcc(0);
      setShape(ALL_OPEN);
      setTries([]);
      setRetryHint(null);
      setIndex(index + 1);
    }
  };

  const answer = (a: Answer) => {
    if (!question || feedback) return;
    unlockAudio();
    const verdict = checkAnswer(module, question, a);
    const ms = Math.max(1, Math.round(performance.now() - shownAt.current));
    const heard = module.question === "sound";
    const distance = heard ? answerDistance(module, question, a) : null;
    if (heard && !verdict.correct && tries.length + 1 < MAX_ATTEMPTS) {
      // Not yet: one more go at the same sound, with a hint on how far off it was.
      setTries([...tries, distance ?? 99]);
      setRetryHint(retryText(distance));
      setSelected([]);
      setPlaced([]);
      setShape(ALL_OPEN);
      playCue("wrong");
      setTimeout(playQuestion, 600);
      return;
    }
    const attempts = tries.length + 1;
    const best = heard ? Math.min(distance ?? 99, ...tries) : null;
    const extra = heard ? { attempts, distance: best === 99 ? null : best, score: recognitionScore(verdict.correct, attempts, best === 99 ? null : best) } : {};
    const all = [...answers, { itemKey: question.key, correct: verdict.correct, ms, ...extra }];
    setRetryHint(null);
    setAnswers(all);
    setCombo(verdict.correct ? combo + 1 : 0);
    setFeedback({ answer: a, verdict });
    const target = soundingOf(module, question);
    const strum = module.timbre === "guitar" ? STRUM_MS : 0;
    const playTarget = () => (target.length === 1 ? playNote(target[0], 1.6, 1, module.timbre) : playChord(target, 2, strum, module.timbre));
    const alreadyHeard = a.kind === "piano" || a.kind === "pianoSet" || a.kind === "guitar";
    if (verdict.correct) {
      if (!alreadyHeard) playTarget();
      setTimeout(() => playCue("right"), CUE_DELAY_MS);
      setTimeout(() => next(all), AUTO_NEXT_MS);
    } else {
      playCue("wrong");
      setTimeout(playTarget, 400);
    }
  };

  /** A fret sounds as it is tapped, like a piano key, and is the answer. */
  const tapFret = (pos: FretPosition) => {
    if (feedback) return;
    unlockAudio();
    playNote(midiAt(pos), 1.6, 1, "guitar");
    answer({ kind: "guitar", pos });
  };

  const stop = () => {
    if (answers.length > 0) void finish(answers);
    else nav.back();
  };

  // Piano keys for a chord: tap to add, tap again to remove; three keys send the answer.
  const tapPianoKey = (midi: number) => {
    if (feedback) return;
    unlockAudio();
    playNote(midi, 1.6, 1, module.timbre);
    if (module.kind === "note") return answer({ kind: "piano", midi });
    const nextSel = selected.includes(midi) ? selected.filter((m) => m !== midi) : [...selected, midi];
    setSelected(nextSel);
    if (nextSel.length === 3) answer({ kind: "pianoSet", midis: nextSel });
  };

  // Notes on the staff: tap a line or space to place one (with the chosen accidental), tap it again to take it away.
  const tapStaff = (position: number) => {
    if (!question || feedback) return;
    const p = pitchAtPosition(position, question.clef, acc);
    const existing = placed.find((q) => q.letter === p.letter && q.octave === p.octave);
    const nextPlaced = existing ? placed.filter((q) => q !== existing) : [...placed, p];
    setPlaced(nextPlaced);
    if (!existing) playNote(soundingMidi(module, p), 1.6, 1, module.timbre);
    if (nextPlaced.length === (question.kind === "note" ? 1 : 3)) answer({ kind: "staffSet", pitches: nextPlaced });
  };

  // Building a fingering: a fret sets the string; the open position toggles open and muted.
  const tapShape = (pos: FretPosition) => {
    if (feedback) return;
    const nextShape = [...shape];
    if (pos.fret === 0) nextShape[pos.string] = shape[pos.string] === null ? 0 : shape[pos.string] === 0 ? null : 0;
    else nextShape[pos.string] = shape[pos.string] === pos.fret ? 0 : pos.fret;
    setShape(nextShape);
  };

  if (!profile) return null;
  if (!loaded)
    return (
      <Screen
        left={
          <IconButton label="Stoppen" onClick={nav.back}>
            <Icon name="xmark" />
          </IconButton>
        }
      >
        {null}
      </Screen>
    );
  if (intro) {
    const one = intro.length === 1;
    const what =
      module.kind === "note"
        ? one
          ? "Nieuwe noot"
          : "Nieuwe noten"
        : module.answer === "guitar"
          ? one
            ? "Nieuwe greep"
            : "Nieuwe grepen"
          : one
            ? "Nieuw akkoord"
            : "Nieuwe akkoorden";
    const introShapes: ChordShape[] =
      module.answer === "guitar" && module.kind === "chord" ? intro.flatMap((i) => (i.kind === "chord" ? (shapeFor(i.chord) ?? []) : [])) : [];
    return (
      <Screen
        left={
          <IconButton label="Stoppen" onClick={nav.back}>
            <Icon name="xmark" />
          </IconButton>
        }
        title={what}
      >
        <p className="muted">
          {one ? "Dit komt" : "Deze komen"} voor het eerst voorbij in deze ronde. Bekijk {one ? "het" : "ze"} even en tik erop om {one ? "het" : "ze"} te horen.
        </p>
        {introShapes.length > 0 ? <ShapeGallery shapes={introShapes} /> : <ItemGallery module={module} items={intro} />}
        <div className="grow" />
        <Button block onClick={() => setIntro(null)}>
          {one ? "Gezien, start" : "Ik heb ze gezien, start"}
        </Button>
      </Screen>
    );
  }
  if (!question) {
    return (
      <Screen
        left={
          <IconButton label="Terug" onClick={nav.back}>
            <Icon name="xmark" />
          </IconButton>
        }
        title={module.title}
      >
        <Card>
          <b>Niets te oefenen binnen deze instellingen</b>
          <p className="muted" style={{ marginTop: 6 }}>
            Zet een groter bereik, meer sleutels of meer toonsoorten aan.
          </p>
        </Card>
        <Button block onClick={() => nav.replace({ name: "settings", moduleId })}>
          Naar instellingen
        </Button>
      </Screen>
    );
  }

  const dots: DotState[] = loaded.questions.map((_, i) =>
    i < answers.length ? (answers[i].correct ? "ok" : "bad") : i === index && !feedback ? "now" : i === index ? (answers[i]?.correct ? "ok" : "bad") : "todo",
  );
  const correct = feedback?.verdict.correct ?? false;
  const settings = loaded.settings;
  const allowedAcc: Accidental[] =
    settings.accidentals === "none" ? [0] : settings.accidentals === "sharp" ? [0, 1] : settings.accidentals === "flat" ? [-1, 0] : [-1, 0, 1];
  const rootAcc: Accidental[] = [...new Set(loaded.items.flatMap((i) => (i.kind === "chord" ? [i.chord.root.acc] : [])))];
  if (!rootAcc.includes(0)) rootAcc.push(0);
  const qualities: Quality[] = settings.qualities === "both" ? ["major", "minor"] : [settings.qualities];
  const chordItem = question.kind === "chord" ? (question as ChordItem) : null;
  const targetMidis = soundingOf(module, question);
  const targetShape = chordItem ? shapeFor(chordItem.chord) : undefined;

  // What the staff shows: the question, or the notes placed as an answer (coloured after the verdict).
  let staffNotes: StaffNote[] = [];
  if (module.question === "staff") {
    const notes = question.kind === "note" ? [question.pitch] : question.voicing;
    staffNotes = notes.map((pitch) => ({ pitch, color: feedback && correct ? OK : undefined }));
  } else if (module.answer === "staff") {
    const wanted: Pitch[] = question.kind === "note" ? [question.pitch] : question.voicing;
    const matches = (v: Pitch, p: Pitch) =>
      sameSpelling(v, p) ||
      (module.question === "sound" ? midiOf(v) === midiOf(p) || (playsShape(module) && midiOf(v) % 12 === midiOf(p) % 12) : midiOf(v) % 12 === midiOf(p) % 12);
    staffNotes = placed.map((pitch) => ({
      pitch,
      color: feedback ? (correct || wanted.some((v) => matches(v, pitch)) ? OK : BAD) : PICK,
    }));
    if (feedback && !correct) for (const v of wanted) if (!placed.some((p) => matches(v, p))) staffNotes.push({ pitch: v, color: OK });
  }

  const pianoHighlights: Record<number, string> = {};
  if (module.answer === "piano") {
    for (const m of selected) pianoHighlights[m] = PICK;
    if (feedback) {
      const given = feedback.answer.kind === "piano" ? [feedback.answer.midi] : feedback.answer.kind === "pianoSet" ? feedback.answer.midis : [];
      for (const m of given) pianoHighlights[m] = correct ? OK : BAD;
      if (!correct) for (const m of targetMidis) pianoHighlights[m] = OK;
    }
  }

  const fretDots: FretDot[] = [];
  if (module.answer === "guitar" && question.kind === "note" && feedback) {
    if (!correct && feedback.answer.kind === "guitar") fretDots.push({ ...feedback.answer.pos, color: BAD, label: "✕" });
    for (const pos of positionsFor(targetMidis[0], 4)) fretDots.push({ ...pos, color: OK });
  }
  if (module.answer === "guitar" && chordItem && settings.shapeInput === "place") {
    shape.forEach((f, string) => {
      if (f === null) fretDots.push({ string, fret: 0, color: feedback ? (correct ? OK : BAD) : "#999", label: "✕" });
      else fretDots.push({ string, fret: f, color: feedback ? (correct ? OK : BAD) : PICK });
    });
  }

  // Four diagrams to choose from: the right one and three others, in a fixed order per question.
  const choices: ChordShape[] =
    chordItem && module.answer === "guitar" && settings.shapeInput === "choose" && targetShape
      ? shuffle(
          [
            targetShape,
            ...shuffle(
              CHORD_SHAPES.filter((s) => s !== targetShape),
              seeded(index * 7919 + 17),
            ).slice(0, 3),
          ],
          seeded(index * 31 + 5),
        )
      : [];

  const prompt = (module.question === "sound" ? HEARD_PROMPT : PROMPT)[`${module.kind}:${module.answer}`];
  const inversionLabel = chordItem && (settings.inversions || chordItem.chord.inversion !== 0) ? INVERSION_NAME[chordItem.chord.inversion] : null;

  return (
    <Screen
      left={
        <IconButton label="Stoppen" onClick={stop}>
          <Icon name="xmark" />
        </IconButton>
      }
      right={<Chip tone={combo >= 3 ? "gold" : "grey"}>×{combo}</Chip>}
      title=""
    >
      <div className="row" style={{ marginTop: -8 }}>
        <ProgressDots states={dots} />
      </div>
      <div className="row spread muted">
        <span>{module.title}</span>
        <span>
          vraag {index + 1} van {loaded.questions.length}
        </span>
      </div>

      {module.question === "sound" && (
        <button type="button" className="listen" onClick={playQuestion} aria-label="Nog eens luisteren">
          <span className="listen-icon">
            <Icon name="play" />
          </span>
          <span>
            <b>Luister</b>
            <small>tik om nog eens te horen</small>
          </span>
        </button>
      )}
      {module.question === "name" && chordItem && (
        <div className="chord-prompt">
          {chordName(chordItem.chord)}
          <small>
            {inversionLabel ?? (module.answer === "guitar" ? "" : "grondligging")}
            {module.answer === "staff" ? ` · ${CLEF_NAME[chordItem.clef].toLowerCase()}` : ""}
          </small>
        </div>
      )}
      {(module.question === "staff" || module.answer === "staff") && (
        <Card tight>
          <Staff clef={question.clef} notes={staffNotes} onTap={module.answer === "staff" && !feedback ? tapStaff : undefined} previewAcc={acc} />
        </Card>
      )}

      {retryHint && !feedback && (
        <Card className="feedback">
          <span className="feedback-mark" aria-hidden="true">
            <Icon name="ear" />
          </span>
          <div>
            <b>{retryHint}</b>
            <div className="muted">Luister nog eens en probeer het nog één keer.</div>
          </div>
        </Card>
      )}
      {feedback ? (
        <Card className={correct ? "feedback ok" : "feedback"}>
          <span className="feedback-mark" aria-hidden="true">
            <Icon name={correct ? "check" : "xmark"} />
          </span>
          <div>
            <b>{correct ? "Goed!" : "Net niet"}</b>
            <div className="muted">
              {feedback.verdict.note ? `${feedback.verdict.note} ` : ""}
              {correct ? `Dit is ${describeTarget(module, question)}.` : `Het is ${describeTarget(module, question)}.`}
            </div>
          </div>
        </Card>
      ) : (
        <div className="prompt">
          {prompt}
          {module.answer === "piano" && module.kind === "chord" && <div className="muted">{selected.length} van 3 toetsen</div>}
          {module.answer === "staff" && module.kind === "chord" && <div className="muted">{placed.length} van 3 noten</div>}
        </div>
      )}

      {module.answer === "name" && question.kind === "note" && (
        <NoteNameButtons accidentals={allowedAcc} onAnswer={(letter, a) => answer({ kind: "name", letter, acc: a })} disabled={!!feedback} />
      )}
      {module.answer === "name" && chordItem && (
        <ChordNameButtons
          accidentals={rootAcc}
          qualities={qualities}
          withInversion={settings.inversions}
          onAnswer={(root, quality, inversion) => answer({ kind: "chordName", root, quality, inversion })}
          disabled={!!feedback}
        />
      )}
      {module.answer === "staff" && <AccidentalToggle value={acc} onChange={setAcc} disabled={!!feedback} />}
      {module.answer === "piano" && (
        <Card tight>
          <Piano
            range={loaded.pianoRange}
            highlights={pianoHighlights}
            labels={settings.keyLabels}
            keyWidth={profile.kidMode ? 34 : 30}
            onTap={tapPianoKey}
            disabled={!!feedback}
          />
        </Card>
      )}
      {module.answer === "guitar" && question.kind === "note" && (
        <Card tight style={{ maxWidth: 300, alignSelf: "center", width: "100%" }}>
          <Fretboard dots={fretDots} onTap={tapFret} disabled={!!feedback} />
        </Card>
      )}
      {module.answer === "guitar" && chordItem && settings.shapeInput === "choose" && !feedback && (
        <div className="chord-grid">
          {choices.map((s, i) => (
            <ChordDiagram key={i} frets={s.frets} onClick={() => answer({ kind: "shapeChoice", shape: s })} />
          ))}
        </div>
      )}
      {module.answer === "guitar" && chordItem && settings.shapeInput === "place" && (
        <Card tight style={{ maxWidth: 300, alignSelf: "center", width: "100%" }}>
          <Fretboard maxFret={loaded.maxFret} dots={fretDots} onTap={tapShape} disabled={!!feedback} />
        </Card>
      )}
      {module.answer === "guitar" && chordItem && settings.shapeInput === "place" && !feedback && (
        <Button block variant="ghost" onClick={() => answer({ kind: "shape", frets: shape })}>
          Controleer
        </Button>
      )}
      {module.answer === "guitar" && chordItem && feedback && targetShape && (
        <div className="row" style={{ justifyContent: "center" }}>
          <div style={{ width: 150 }}>
            <ChordDiagram frets={targetShape.frets} fingers={targetShape.fingers} title={chordName(chordItem.chord)} color={OK} />
          </div>
        </div>
      )}
      <div className="grow" />
      {feedback && !correct && (
        <div className="sticky-action">
          <Button block onClick={() => next(answers)}>
            Verder
          </Button>
        </div>
      )}
    </Screen>
  );
}
