import { useEffect, useRef, useState } from "react";
import { playCue, playNote, unlockAudio } from "../audio/sampler.ts";
import { Button } from "../components/common/Button.tsx";
import { Card } from "../components/common/Card.tsx";
import { Chip } from "../components/common/Chip.tsx";
import { ProgressDots, type DotState } from "../components/common/ProgressDots.tsx";
import { IconButton, Screen } from "../components/layout/Screen.tsx";
import { Fretboard, type FretDot } from "../components/music/Fretboard.tsx";
import { NoteNameButtons } from "../components/music/NoteNameButtons.tsx";
import { Piano } from "../components/music/Piano.tsx";
import { Staff } from "../components/music/Staff.tsx";
import { pitchName, type Accidental } from "../engine/common/pitch.ts";
import { positionsFor, type FretPosition } from "../engine/instruments/guitar.ts";
import { resolvePianoRange, type PianoRange } from "../engine/instruments/piano.ts";
import { checkAnswer, soundingMidi, type Answer, type Verdict } from "../engine/learning/answers.ts";
import { itemsFor, type LearnItem } from "../engine/learning/items.ts";
import { moduleById, type ModuleId } from "../engine/learning/modules.ts";
import type { CardRecord } from "../engine/learning/scheduler.ts";
import { buildSession } from "../engine/learning/session.ts";
import type { ModuleSettings } from "../engine/learning/settings.ts";
import type { SessionAnswer } from "../storage/db.ts";
import { getCards, getSettings } from "../storage/repo.ts";
import { finishSession } from "../state/finishSession.ts";
import { useApp } from "../state/useApp.ts";

const OK = "#2e9e5b";
const BAD = "#d64545";
// The tapped note sounds first; the "right" cue follows once it has been heard.
const CUE_DELAY_MS = 500;
const AUTO_NEXT_MS = 1200;

interface Loaded {
  settings: ModuleSettings;
  items: LearnItem[];
  cards: Map<string, CardRecord>;
  questions: LearnItem[];
  pianoRange: PianoRange;
}

const PROMPT = { name: "Welke noot is dit?", piano: "Tik de juiste toets", guitar: "Tik de juiste plek op de hals" };

export function ExerciseScreen({ moduleId }: { moduleId: ModuleId }) {
  const { profile, nav } = useApp();
  const module = moduleById(moduleId);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState<{ answer: Answer; verdict: Verdict } | null>(null);
  const [busy, setBusy] = useState(false);
  const shownAt = useRef(0);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!profile) return;
    let alive = true;
    void (async () => {
      const settings = await getSettings(profile.id, moduleId);
      const items = itemsFor(module, settings);
      const cards = await getCards(profile.id, moduleId);
      const questions = buildSession(items, cards, { length: settings.sessionLength, maxNew: settings.maxNew, now: new Date() });
      const pianoRange = resolvePianoRange(
        settings.pianoRange,
        items.map((i) => soundingMidi(module, i.pitch)),
      );
      if (alive) setLoaded({ settings, items, cards, questions, pianoRange });
    })();
    return () => {
      alive = false;
    };
  }, [profile, moduleId, module]);

  useEffect(() => {
    if (loaded && !feedback) shownAt.current = performance.now();
  }, [loaded, index, feedback]);

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
      setIndex(index + 1);
    }
  };

  const answer = (a: Answer) => {
    if (!question || feedback) return;
    unlockAudio();
    const verdict = checkAnswer(module, question, a);
    const ms = Math.max(1, Math.round(performance.now() - shownAt.current));
    const all = [...answers, { itemKey: question.key, correct: verdict.correct, ms }];
    setAnswers(all);
    setCombo(verdict.correct ? combo + 1 : 0);
    setFeedback({ answer: a, verdict });
    const target = soundingMidi(module, question.pitch);
    if (a.kind === "piano") playNote(a.midi);
    if (verdict.correct) {
      if (a.kind !== "piano") playNote(target);
      setTimeout(() => playCue("right"), CUE_DELAY_MS);
      setTimeout(() => next(all), AUTO_NEXT_MS);
    } else {
      playCue("wrong");
      setTimeout(() => playNote(target), 400);
    }
  };

  const stop = () => {
    if (answers.length > 0) void finish(answers);
    else nav.back();
  };

  if (!profile) return null;
  if (!loaded)
    return (
      <Screen
        left={
          <IconButton label="Stoppen" onClick={nav.back}>
            ✕
          </IconButton>
        }
      >
        {null}
      </Screen>
    );
  if (!question) {
    return (
      <Screen
        left={
          <IconButton label="Terug" onClick={nav.back}>
            ✕
          </IconButton>
        }
        title={module.title}
      >
        <Card>
          <b>Geen noten binnen deze instellingen</b>
          <p className="muted" style={{ marginTop: 6 }}>
            Zet een groter bereik of meer sleutels aan.
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
  const target = soundingMidi(module, question.pitch);
  const allowedAcc: Accidental[] =
    loaded.settings.accidentals === "none"
      ? [0]
      : loaded.settings.accidentals === "sharp"
        ? [0, 1]
        : loaded.settings.accidentals === "flat"
          ? [-1, 0]
          : [-1, 0, 1];

  const pianoHighlights: Record<number, string> = {};
  const fretDots: FretDot[] = [];
  if (feedback) {
    if (feedback.answer.kind === "piano") {
      pianoHighlights[feedback.answer.midi] = correct ? OK : BAD;
      if (!correct) pianoHighlights[target] = OK;
    }
    if (feedback.answer.kind === "guitar") {
      if (!correct) fretDots.push({ ...feedback.answer.pos, color: BAD, label: "✕" });
      for (const pos of positionsFor(target, 4)) fretDots.push({ ...pos, color: OK });
    }
  }

  return (
    <Screen
      left={
        <IconButton label="Stoppen" onClick={stop}>
          ✕
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
      <Card tight>
        <Staff clef={question.clef} notes={[{ pitch: question.pitch, color: feedback ? (correct ? OK : undefined) : undefined }]} />
      </Card>
      {feedback ? (
        <Card className={correct ? "feedback ok" : "feedback"}>
          <b style={{ color: correct ? OK : BAD }}>{correct ? "Goed!" : "Net niet"}</b>
          <div className="muted" style={{ marginTop: 4 }}>
            {feedback.verdict.note ? `${feedback.verdict.note} ` : ""}
            {correct ? `Dit is ${pitchName(question.pitch)}.` : `Het is ${pitchName(question.pitch)}.`}
          </div>
        </Card>
      ) : (
        <div className="prompt">{PROMPT[module.answer]}</div>
      )}
      {module.answer === "name" && (
        <NoteNameButtons accidentals={allowedAcc} onAnswer={(letter, acc) => answer({ kind: "name", letter, acc })} disabled={!!feedback} />
      )}
      {module.answer === "piano" && (
        <Card tight>
          <Piano
            range={loaded.pianoRange}
            highlights={pianoHighlights}
            labels={loaded.settings.keyLabels}
            keyWidth={profile.kidMode ? 34 : 30}
            onTap={(midi) => answer({ kind: "piano", midi })}
            disabled={!!feedback}
          />
        </Card>
      )}
      {module.answer === "guitar" && (
        <Card tight style={{ maxWidth: 300, alignSelf: "center", width: "100%" }}>
          <Fretboard dots={fretDots} onTap={(pos: FretPosition) => answer({ kind: "guitar", pos })} disabled={!!feedback} />
        </Card>
      )}
      <div className="grow" />
      {feedback && !correct && (
        <Button block onClick={() => next(answers)}>
          Verder
        </Button>
      )}
    </Screen>
  );
}
