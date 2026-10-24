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
  master.gain.value = 0.9;
  analyser = context.createAnalyser();
  analyser.fftSize = 256;
  master.connect(analyser);
  analyser.connect(context.destination);
  return context;
}

/** Call from a tap or click: resumes the context (iOS) and starts loading the samples. */
export function unlockAudio(): void {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  void loadSamples();
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
  return { state: context?.state ?? "none", buffers: buffers.size, decodeErrors, lastPath, lastError, peak };
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

export function playChord(midis: number[], seconds = 2, strumMs = 0): void {
  midis.forEach((m, i) => setTimeout(() => playNote(m, seconds), i * strumMs));
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
