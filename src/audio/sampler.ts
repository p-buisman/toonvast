/**
 * A small Web Audio sampler for the piano. The samples (Salamander Grand, every three semitones) are
 * fetched once; notes in between are pitched by playback rate. Audio starts only after a user gesture.
 */
const SAMPLE_NOTES: readonly [string, number][] = [
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
];

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;
const buffers = new Map<number, AudioBuffer>();
let loading: Promise<void> | null = null;
let master: GainNode | null = null;
let analyser: AnalyserNode | null = null;
let lastPath = "none";
let lastError = "";
let decodeErrors = 0;

function getContext(): AudioContext | null {
  if (context) return context;
  const Ctor = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext) as AudioContextCtor | undefined;
  if (!Ctor) return null;
  context = new Ctor();
  master = context.createGain();
  master.gain.value = 0.8;
  // Several notes at once would clip the output and sound muffled; the compressor catches the peaks.
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  analyser = context.createAnalyser();
  analyser.fftSize = 256;
  master.connect(compressor);
  compressor.connect(analyser);
  analyser.connect(context.destination);
  return context;
}

let mediaUnlocked = false;
let mediaUrl: string | null = null;

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

/** Call from a tap or click: resumes the context (iOS), unlocks media playback and starts loading the samples. */
export function unlockAudio(): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state !== "running") void ctx.resume();
  unlockMedia();
  void loadSamples();
}

if (typeof document !== "undefined") {
  // Back from the background: iOS may have suspended or interrupted the context.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && context && context.state !== "running") void context.resume();
  });
}

export function loadSamples(): Promise<void> {
  if (loading) return loading;
  const ctx = getContext();
  if (!ctx) return Promise.resolve();
  const base = `${import.meta.env.BASE_URL}samples/piano/`;
  loading = Promise.all(
    SAMPLE_NOTES.map(async ([name, midi]) => {
      try {
        const res = await fetch(`${base}${name}.mp3`);
        const data = await res.arrayBuffer();
        buffers.set(midi, await decode(ctx, data));
      } catch (e) {
        // A missing sample is not fatal: its neighbours cover the gap.
        decodeErrors++;
        lastError = e instanceof Error ? e.message : String(e);
      }
    }),
  ).then(() => undefined);
  return loading;
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
  /** Peak output level since the last call, 0..1. */
  peak: number;
}

const peakData = new Uint8Array(256);

/** For the `?debug=1` panel: what the sampler is doing and whether anything reaches the output. */
export function audioDiagnostics(): AudioDiagnostics {
  let peak = 0;
  if (analyser) {
    analyser.getByteTimeDomainData(peakData);
    for (const v of peakData) peak = Math.max(peak, Math.abs(v - 128) / 128);
  }
  return { state: context?.state ?? "none", buffers: buffers.size, decodeErrors, lastPath: `${lastPath}${mediaUnlocked ? " · media" : ""}`, lastError, peak };
}

export function samplesReady(): boolean {
  return buffers.size > 0;
}

function nearestSample(midi: number): number | null {
  let best: number | null = null;
  for (const m of buffers.keys()) if (best === null || Math.abs(m - midi) < Math.abs(best - midi)) best = m;
  return best;
}

/** Play one note; falls back to a soft sine when the samples are not there yet. */
export function playNote(midi: number, seconds = 1.6, velocity = 1): void {
  const ctx = getContext();
  if (!ctx || !master) return;
  ensureRunning(ctx);
  const now = ctx.currentTime;
  const from = nearestSample(midi);
  if (from === null) {
    lastPath = "tone";
    playTone(ctx, master, 440 * 2 ** ((midi - 69) / 12), seconds, 0.25 * velocity);
    return;
  }
  try {
    const source = ctx.createBufferSource();
    source.buffer = buffers.get(from)!;
    source.playbackRate.value = 2 ** ((midi - from) / 12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(velocity, now);
    gain.gain.linearRampToValueAtTime(velocity, now + seconds - 0.3);
    gain.gain.linearRampToValueAtTime(0, now + seconds);
    source.connect(gain);
    gain.connect(master);
    source.start(now);
    source.stop(now + seconds + 0.05);
    lastPath = `sample ${from}`;
  } catch (e) {
    lastPath = "tone (after error)";
    lastError = e instanceof Error ? e.message : String(e);
    playTone(ctx, master, 440 * 2 ** ((midi - 69) / 12), seconds, 0.25 * velocity);
  }
}

/** Several notes together, each softer so the sum stays clean; a small stagger keeps it natural. */
export function playChord(midis: number[], seconds = 2, strumMs = 0): void {
  const velocity = Math.min(1, 1.1 / Math.sqrt(midis.length));
  const gap = strumMs > 0 ? strumMs : 12;
  midis.forEach((m, i) => setTimeout(() => playNote(m, seconds, velocity), i * gap));
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
