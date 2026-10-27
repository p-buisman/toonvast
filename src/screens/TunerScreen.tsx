import { useEffect, useRef, useState } from "react";
import { micFailure, openFakeMic, openMic, type MicFailure, type MicHandle } from "../audio/mic.ts";
import { detectPitch } from "../audio/pitch.ts";
import { loadSamples, playNote, unlockAudio } from "../audio/sampler.ts";
import { Button } from "../components/common/Button.tsx";
import { Card } from "../components/common/Card.tsx";
import { Icon } from "../components/common/Icon.tsx";
import { IconButton, Screen } from "../components/layout/Screen.tsx";
import { StringKeys } from "../components/music/StringKeys.tsx";
import { TuneMeter } from "../components/music/TuneMeter.tsx";
import { STANDARD_TUNING, STRING_NAMES } from "../engine/instruments/guitar.ts";
import { median, nearestString, tuneAdvice, type StringReading } from "../engine/instruments/tuner.ts";
import { useApp } from "../state/useApp.ts";

/** Readings younger than this are averaged; after it without sound the screen goes back to listening. */
const WINDOW_MS = 600;
const SILENCE_MS = 1200;
/** In tune this long, and the string counts as done. */
const HOLD_MS = 500;

const STRING_LABEL = ["lage E-snaar", "A-snaar", "D-snaar", "G-snaar", "B-snaar", "hoge E-snaar"];
const FAILURE_TEXT: Record<MicFailure, { title: string; text: string }> = {
  denied: {
    title: "Geen toegang tot de microfoon",
    text: "Zet de microfoon voor deze app aan bij de instellingen van je telefoon (Safari of de app) en probeer het opnieuw.",
  },
  unsupported: { title: "Geen microfoon gevonden", text: "Op dit apparaat kan de app niet luisteren. Stemmen op het gehoor kan wel: tik op een snaar." },
  busy: { title: "De microfoon is bezet", text: "Een andere app gebruikt de microfoon. Sluit die en probeer het opnieuw." },
};

interface Heard {
  reading: StringReading;
  hz: number;
}

export function TunerScreen() {
  const { nav } = useApp();
  const [status, setStatus] = useState<"idle" | "starting" | "listening" | MicFailure>("idle");
  const [heard, setHeard] = useState<Heard | null>(null);
  const [tuned, setTuned] = useState<Set<number>>(() => new Set());
  const mic = useRef<MicHandle | null>(null);
  const recent = useRef<{ hz: number; at: number }[]>([]);
  const okSince = useRef<number | null>(null);

  useEffect(() => {
    void loadSamples("guitar");
    return () => mic.current?.stop();
  }, []);

  const onFrame = (samples: Float32Array, sampleRate: number) => {
    const now = performance.now();
    const hz = detectPitch(samples, sampleRate);
    recent.current = recent.current.filter((r) => now - r.at < WINDOW_MS);
    if (hz !== null) recent.current.push({ hz, at: now });
    const last = recent.current[recent.current.length - 1];
    if (!last || now - last.at > SILENCE_MS) {
      okSince.current = null;
      setHeard(null);
      return;
    }
    const smooth = median(recent.current.map((r) => r.hz));
    const reading = nearestString(smooth);
    if (tuneAdvice(reading.cents) === "ok") {
      okSince.current ??= now;
      if (now - okSince.current >= HOLD_MS) setTuned((t) => (t.has(reading.string) ? t : new Set(t).add(reading.string)));
    } else okSince.current = null;
    setHeard({ reading, hz: smooth });
  };

  const start = async () => {
    unlockAudio();
    setStatus("starting");
    try {
      // On a computer without a guitar, `?fakemic=1` plays a pretend string through the detector.
      mic.current = location.search.includes("fakemic") ? openFakeMic(onFrame) : await openMic(onFrame);
      setStatus("listening");
    } catch (e) {
      setStatus(micFailure(e));
    }
  };
  const stop = () => {
    mic.current?.stop();
    mic.current = null;
    recent.current = [];
    setHeard(null);
    setStatus("idle");
  };
  const playString = (string: number) => {
    unlockAudio();
    playNote(STANDARD_TUNING[string], 2.5, 1, "guitar");
  };

  const reading = heard?.reading ?? null;
  const advice = reading ? tuneAdvice(reading.cents) : null;
  const allTuned = tuned.size === STRING_NAMES.length;

  return (
    <Screen
      title="Stemmen"
      left={
        <IconButton label="Terug" onClick={nav.back}>
          <Icon name="chevron-left" />
        </IconButton>
      }
    >
      {status === "listening" ? (
        <>
          <Card>
            <StringKeys active={reading?.string ?? null} tuned={tuned} onTap={playString} />
          </Card>
          <Card className="stack" style={{ padding: "18px 14px" }}>
            <div className="tune-note">
              <b>{reading ? STRING_NAMES[reading.string].toUpperCase() : "–"}</b>
              <small>
                {reading && heard
                  ? `${STRING_LABEL[reading.string]} · ${6 - reading.string}e · ${heard.hz.toFixed(1).replace(".", ",")} Hz`
                  : "Sla een snaar aan"}
              </small>
            </div>
            <TuneMeter cents={reading?.cents ?? null} ok={advice === "ok"} />
            {reading && advice && (
              <>
                <div className={advice === "ok" ? "tune-advice ok" : "tune-advice"}>
                  <Icon name={advice === "ok" ? "check" : advice === "tighten" ? "arrow-up" : "arrow-down"} />
                  {advice === "ok" ? "In stemming" : advice === "tighten" ? "Draai strakker" : "Draai losser"}
                </div>
                <p className="muted center" style={{ margin: 0 }}>
                  {advice === "ok"
                    ? "Houd hem zo. Volgende snaar?"
                    : `${Math.round(Math.abs(reading.cents))} cent te ${advice === "tighten" ? "laag" : "hoog"}`}
                </p>
              </>
            )}
          </Card>
          {allTuned ? (
            <Card className="feedback ok">
              <span className="feedback-mark" aria-hidden="true">
                <Icon name="check" />
              </span>
              <div>
                <b>Zes van zes</b>
                <div className="muted">Alle snaren zijn in stemming geweest.</div>
              </div>
            </Card>
          ) : (
            <Card className="feedback" style={{ background: "var(--card)" }}>
              <span className="feedback-mark listen-mark" aria-hidden="true">
                <Icon name="ear" />
              </span>
              <div>
                <b>Luistert…</b>
                <div className="muted">Sla een snaar aan en laat hem klinken.</div>
              </div>
            </Card>
          )}
          <div className="grow" />
          <Button block variant="ghost" onClick={stop}>
            Stop
          </Button>
        </>
      ) : (
        <>
          {status === "idle" || status === "starting" ? (
            <Card>
              <h2>Gitaar stemmen</h2>
              <p className="muted" style={{ margin: 0 }}>
                De app luistert via de microfoon, hoort vanzelf welke snaar je aanslaat en laat zien of je strakker of losser moet draaien. Sla één snaar
                tegelijk aan en laat hem klinken.
              </p>
            </Card>
          ) : (
            <Card className="feedback">
              <span className="feedback-mark" aria-hidden="true">
                <Icon name="xmark" />
              </span>
              <div>
                <b>{FAILURE_TEXT[status].title}</b>
                <div className="muted">{FAILURE_TEXT[status].text}</div>
              </div>
            </Card>
          )}
          <Card>
            <h2>Snaren</h2>
            <StringKeys tuned={tuned} onTap={playString} />
            <p className="muted" style={{ marginTop: 8, marginBottom: 0 }}>
              Tik op een snaar om de juiste toon te horen.
            </p>
          </Card>
          <div className="grow" />
          <Button block disabled={status === "starting"} onClick={() => void start()}>
            <Icon name="mic" /> {status === "starting" ? "Microfoon aanzetten…" : "Start stemmen"}
          </Button>
          <p className="muted center" style={{ margin: 0 }}>
            De eerste keer vraagt de telefoon of de app de microfoon mag gebruiken.
          </p>
        </>
      )}
    </Screen>
  );
}
