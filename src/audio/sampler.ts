/**
 * A small Web Audio sampler for the piano and the guitar. The samples (every three semitones) are fetched
 * once per instrument; notes in between are pitched by playback rate. Audio starts only after a user gesture.
 */
export type Timbre = "piano" | "guitar";

const SAMPLE_SETS: Record<Timbre, { folder: string; notes: readonly [string, number][]; gain: number }> = {
  piano: {
    folder: "piano",
    gain: 1,
    notes: [
      ["A0", 21],
      ["C1", 24],
      ["Ds1", 27],
      ["Fs1", 30],
      ["A1", 33],
      ["C2", 36],
      ["Ds2", 39],
      ["Fs2", 42],
      ["A2", 45],
      ["C3", 48],
      ["Ds3", 51],
      ["Fs3", 54],
      ["A3", 57],
      ["C4", 60],
      ["Ds4", 63],
      ["Fs4", 66],
      ["A4", 69],
      ["C5", 72],
      ["Ds5", 75],
      ["Fs5", 78],
      ["A5", 81],
      ["C6", 84],
      ["Ds6", 87],
      ["Fs6", 90],
      ["A6", 93],
      ["C7", 96],
      ["Ds7", 99],
      ["Fs7", 102],
      ["A7", 105],
      ["C8", 108],
    ],
  },
  guitar: {
    folder: "guitar",
    gain: 1.3,
    notes: [
      ["E2", 40],
      ["G2", 43],
      ["Bb2", 46],
      ["Db3", 49],
      ["E3", 52],
      ["G3", 55],
      ["Bb3", 58],
      ["Db4", 61],
      ["E4", 64],
      ["G4", 67],
      ["Bb4", 70],
      ["Db5", 73],
      ["E5", 76],
    ],
  },
};

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;
const buffers: Record<Timbre, Map<number, AudioBuffer>> = { piano: new Map(), guitar: new Map() };
const loading: Partial<Record<Timbre, Promise<void>>> = {};
let master: GainNode | null = null;
let analyser: AnalyserNode | null = null;
let lastPath = "none";
let lastError = "";
let decodeErrors = 0;
let mediaUnlocked = false;
let mediaUrl: string | null = null;
let restarts = 0;

/**
 * Set when iOS may have taken the audio away from the page: an interruption (a call, a notification, Siri), a
 * trip to the background or the microphone of the tuner. A context can then report "running" and still stay
 * silent, or hang in "interrupted"; the next tap replaces it with a fresh one.
 */
let stale = false;

interface AudioSessionLike {
  type: string;
  state?: string;
  addEventListener?: (type: "statechange", listener: () => void) => void;
}

/** WebKit's audio session (Safari 17+), absent elsewhere. */
function audioSession(): AudioSessionLike | null {
  if (typeof navigator === "undefined") return null;
  return (navigator as unknown as { audioSession?: AudioSessionLike }).audioSession ?? null;
}

/**
 * "playback" plays through the ring/silent switch and is restored after an interruption; "auto" is what the
 * microphone needs, since a playback session cannot record.
 */
export function setAudioSessionType(type: "playback" | "auto"): void {
  const session = audioSession();
  if (!session) return;
  try {
    session.type = type;
  } catch {
    // An older WebKit may refuse a type; the media element unlock still covers it.
  }
}

/** Tells the sampler that something else had the audio, so the next tap starts it afresh. */
export function markAudioStale(): void {
  stale = true;
}

/** The one audio context of the sampler; null where Web Audio is missing. */
function getContext(): AudioContext | null {
  if (context) return context;
  const Ctor = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext) as AudioContextCtor | undefined;
  if (!Ctor) return null;
  setAudioSessionType("playback");
  const ctx = new Ctor();
  context = ctx;
  // A fresh context has nothing to recover from.
  stale = false;
  master = ctx.createGain();
  master.gain.value = 0.8;
  // Several notes at once would clip the output and sound muffled; the compressor catches the peaks.
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  master.connect(compressor);
  compressor.connect(analyser);
  analyser.connect(ctx.destination);
  ctx.onstatechange = () => {
    if (ctx === context && ctx.state === ("interrupted" as AudioContextState)) stale = true;
  };
  return ctx;
}

/**
 * Drops the context and its graph; the next call to `getContext` builds a new one. The decoded samples stay:
 * an AudioBuffer is not tied to the context that decoded it.
 */
function replaceContext(): void {
  const old = context;
  context = null;
  master = null;
  analyser = null;
  // The silent media element has to play again for the new session.
  mediaUnlocked = false;
  restarts++;
  if (old) {
    old.onstatechange = null;
    void old.close().catch(() => undefined);
  }
}

/** A tenth of a second of silence as a WAV file, built here so no asset is needed. */
function silentWavUrl(): string {
  if (mediaUrl) return mediaUrl;
  const rate = 8000;
  const samples = rate / 10;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + samples, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  str(36, "data");
  v.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) v.setUint8(44 + i, 128);
  mediaUrl = URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
  return mediaUrl;
}

/**
 * iOS keeps Web Audio silent in an installed web app (and with the ring/silent switch on) until a media
 * element has played: this plays a moment of silence through one, inside the user's gesture.
 */
function unlockMedia(): void {
  if (mediaUnlocked || typeof Audio === "undefined") return;
  try {
    const el = new Audio(silentWavUrl());
    el.setAttribute("playsinline", "");
    el.volume = 0.01;
    const p = el.play();
    if (p) {
      p.then(() => {
        mediaUnlocked = true;
      }).catch((e: unknown) => {
        lastError = `media: ${e instanceof Error ? e.message : String(e)}`;
      });
    }
  } catch (e) {
    lastError = `media: ${e instanceof Error ? e.message : String(e)}`;
  }
}

/**
 * Call from a tap or click: resumes the context (iOS), unlocks media playback and starts loading the samples.
 * After an interruption the context is replaced instead of resumed, since iOS does not always bring an old
 * one back; only a new context made inside a gesture is sure to sound.
 */
export function unlockAudio(): void {
  if (context && (stale || context.state === ("interrupted" as AudioContextState) || context.state === "closed")) replaceContext();
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state !== "running") void ctx.resume();
  unlockMedia();
  void loadSamples("piano");
}

if (typeof document !== "undefined") {
  // Back from the background: iOS may have suspended or interrupted the context, or handed the session to
  // another app. Resume what can be resumed now; the next tap builds a fresh context.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stale = true;
      return;
    }
    if (context && context.state !== "running") void context.resume();
  });
}

audioSession()?.addEventListener?.("statechange", () => {
  if (audioSession()?.state === "interrupted") stale = true;
});

export function loadSamples(timbre: Timbre = "piano"): Promise<void> {
  const pending = loading[timbre];
  if (pending) return pending;
  const ctx = getContext();
  if (!ctx) return Promise.resolve();
  const set = SAMPLE_SETS[timbre];
  const base = `${import.meta.env.BASE_URL}samples/${set.folder}/`;
  const job = Promise.all(
    set.notes.map(async ([name, midi]) => {
      if (buffers[timbre].has(midi)) return;
      try {
        const res = await fetch(`${base}${name}.mp3`);
        const data = await res.arrayBuffer();
        buffers[timbre].set(midi, await decode(ctx, data));
      } catch (e) {
        // A missing sample is not fatal: its neighbours cover the gap.
        decodeErrors++;
        lastError = e instanceof Error ? e.message : String(e);
      }
    }),
  ).then(() => {
    // Replaced while decoding: an old, closed context may have refused some samples, so the next note loads
    // what is still missing.
    if (ctx !== context) delete loading[timbre];
  });
  loading[timbre] = job;
  return job;
}

/** Promise form where available, callback form for older WebKit. */
function decode(ctx: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const result = ctx.decodeAudioData(data, resolve, (err) => reject(err ?? new Error("decode failed")));
    if (result && typeof (result as Promise<AudioBuffer>).then === "function") (result as Promise<AudioBuffer>).then(resolve, reject);
  });
}

function ensureRunning(ctx: AudioContext): void {
  // iOS reports "interrupted" after a phone call or another app; resume brings it back.
  if (ctx.state !== "running") void ctx.resume();
}

export interface AudioDiagnostics {
  state: string;
  buffers: number;
  decodeErrors: number;
  lastPath: string;
  lastError: string;
  /** How often the context was replaced after an interruption. */
  restarts: number;
  /** Peak output level since the last call, 0..1. */
  peak: number;
}

const peakData = new Uint8Array(256);

/** For the `?debug=1` panel and the sound test: what the sampler is doing and whether anything reaches the output. */
export function audioDiagnostics(): AudioDiagnostics {
  let peak = 0;
  if (analyser) {
    analyser.getByteTimeDomainData(peakData);
    for (const v of peakData) peak = Math.max(peak, Math.abs(v - 128) / 128);
  }
  return {
    state: context?.state ?? "none",
    buffers: buffers.piano.size + buffers.guitar.size,
    decodeErrors,
    lastPath: `${lastPath}${mediaUnlocked ? " · media" : ""}`,
    lastError,
    restarts,
    peak,
  };
}

export function samplesReady(timbre: Timbre = "piano"): boolean {
  return buffers[timbre].size > 0;
}

function nearestSample(timbre: Timbre, midi: number): number | null {
  let best: number | null = null;
  for (const m of buffers[timbre].keys()) if (best === null || Math.abs(m - midi) < Math.abs(best - midi)) best = m;
  return best;
}

/** Play one note; falls back to a soft sine when the samples are not there yet. */
export function playNote(midi: number, seconds = 1.6, velocity = 1, timbre: Timbre = "piano"): void {
  const ctx = getContext();
  if (!ctx || !master) return;
  ensureRunning(ctx);
  if (!loading[timbre]) void loadSamples(timbre);
  const now = ctx.currentTime;
  const from = nearestSample(timbre, midi);
  if (from === null) {
    lastPath = "tone";
    playTone(ctx, master, 440 * 2 ** ((midi - 69) / 12), seconds, 0.25 * velocity);
    return;
  }
  try {
    const source = ctx.createBufferSource();
    source.buffer = buffers[timbre].get(from)!;
    source.playbackRate.value = 2 ** ((midi - from) / 12);
    const gain = ctx.createGain();
    const level = velocity * SAMPLE_SETS[timbre].gain;
    gain.gain.setValueAtTime(level, now);
    gain.gain.linearRampToValueAtTime(level, now + seconds - 0.3);
    gain.gain.linearRampToValueAtTime(0, now + seconds);
    source.connect(gain);
    gain.connect(master);
    source.start(now);
    source.stop(now + seconds + 0.05);
    lastPath = `${timbre} ${from}`;
  } catch (e) {
    lastPath = "tone (after error)";
    lastError = e instanceof Error ? e.message : String(e);
    playTone(ctx, master, 440 * 2 ** ((midi - 69) / 12), seconds, 0.25 * velocity);
  }
}

/** Several notes together, each softer so the sum stays clean; a small stagger keeps it natural. */
export function playChord(midis: number[], seconds = 2, strumMs = 0, timbre: Timbre = "piano"): void {
  const velocity = Math.min(1, 1.1 / Math.sqrt(midis.length));
  const gap = strumMs > 0 ? strumMs : 12;
  midis.forEach((m, i) => setTimeout(() => playNote(m, seconds, velocity, timbre), i * gap));
}

function playTone(ctx: AudioContext, out: AudioNode, hz: number, seconds: number, level: number, type: OscillatorType = "sine"): void {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = hz;
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(level, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  osc.connect(gain);
  gain.connect(out);
  osc.start(now);
  osc.stop(now + seconds + 0.05);
}

/** Short cues for right and wrong answers. */
export function playCue(kind: "right" | "wrong"): void {
  const ctx = getContext();
  if (!ctx || !master) return;
  ensureRunning(ctx);
  if (kind === "right") {
    // Soft and short, so it sits behind the note instead of fighting it.
    playTone(ctx, master, 1320, 0.09, 0.05, "triangle");
    setTimeout(() => ctx && master && playTone(ctx, master, 1760, 0.14, 0.05, "triangle"), 80);
  } else {
    playTone(ctx, master, 180, 0.25, 0.15, "square");
  }
}
