import { getContext } from "./sampler.ts";

export interface MicHandle {
  sampleRate: number;
  stop: () => void;
}

export type MicFailure = "unsupported" | "denied" | "busy";

/** Why the microphone could not be opened, in the three cases the screen tells apart. */
export function micFailure(e: unknown): MicFailure {
  const name = e instanceof Error ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "NotSupportedError" || name === "TypeError") return "unsupported";
  return "busy";
}

/**
 * Opens the microphone and hands a stretch of the signal to `onFrame` every `intervalMs`, raw: no echo
 * cancellation, noise suppression or gain control, since those blur the pitch of a plucked string.
 */
export async function openMic(onFrame: (samples: Float32Array, sampleRate: number) => void, intervalMs = 80): Promise<MicHandle> {
  if (!navigator.mediaDevices?.getUserMedia) throw new TypeError("getUserMedia missing");
  const ctx = getContext();
  if (!ctx) throw new TypeError("Web Audio missing");
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  if (ctx.state !== "running") await ctx.resume().catch(() => undefined);
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 4096;
  analyser.smoothingTimeConstant = 0;
  source.connect(analyser);
  const samples = new Float32Array(analyser.fftSize);
  const timer = window.setInterval(() => {
    analyser.getFloatTimeDomainData(samples);
    onFrame(samples, ctx.sampleRate);
  }, intervalMs);
  return {
    sampleRate: ctx.sampleRate,
    stop: () => {
      clearInterval(timer);
      source.disconnect();
      for (const track of stream.getTracks()) track.stop();
    },
  };
}

/**
 * A stand-in for the microphone while developing on a computer (`?fakemic=1`): a plucked tone that walks along the
 * strings, each a little flat at first and then in tune, so the screen can be seen working without a guitar.
 */
export function openFakeMic(onFrame: (samples: Float32Array, sampleRate: number) => void, intervalMs = 80): MicHandle {
  const sampleRate = 48000;
  const samples = new Float32Array(4096);
  const strings = [82.41, 110, 146.83, 196, 246.94, 329.63];
  const startedAt = performance.now();
  let phase = 0;
  const timer = window.setInterval(() => {
    const t = (performance.now() - startedAt) / 1000;
    const step = Math.floor(t / 4) % strings.length;
    const within = t % 4;
    // Three seconds of sound per string (flat for two, then in tune), one second of silence.
    const cents = within < 2 ? -14 : 0;
    const hz = strings[step] * Math.pow(2, cents / 1200);
    const level = within < 3 ? 0.25 : 0;
    for (let i = 0; i < samples.length; i++) {
      phase += (2 * Math.PI * hz) / sampleRate;
      samples[i] = level * (Math.sin(phase) + 0.5 * Math.sin(2 * phase) + 0.25 * Math.sin(3 * phase));
    }
    onFrame(samples, sampleRate);
  }, intervalMs);
  return { sampleRate, stop: () => clearInterval(timer) };
}
