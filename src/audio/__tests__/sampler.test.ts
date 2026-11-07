import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Just enough of an AudioContext to build the sampler's graph and see what happens to it. */
class FakeContext {
  static made: FakeContext[] = [];
  state: string = "running";
  currentTime = 0;
  destination = {};
  onstatechange: (() => void) | null = null;
  closed = false;
  resumes = 0;
  constructor() {
    FakeContext.made.push(this);
  }
  private param() {
    return { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} };
  }
  private node() {
    return { connect() {}, disconnect() {} };
  }
  createGain() {
    return { ...this.node(), gain: this.param() };
  }
  createDynamicsCompressor() {
    const p = () => this.param();
    return { ...this.node(), threshold: p(), knee: p(), ratio: p(), attack: p(), release: p() };
  }
  createAnalyser() {
    return { ...this.node(), fftSize: 0, getByteTimeDomainData() {} };
  }
  createOscillator() {
    return { ...this.node(), type: "sine", frequency: this.param(), start() {}, stop() {} };
  }
  createBufferSource() {
    return { ...this.node(), buffer: null, playbackRate: this.param(), start() {}, stop() {} };
  }
  decodeAudioData(_data: ArrayBuffer, ok: (b: unknown) => void) {
    ok({});
    return undefined;
  }
  resume() {
    this.resumes++;
    this.state = "running";
    return Promise.resolve();
  }
  close() {
    this.closed = true;
    this.state = "closed";
    return Promise.resolve();
  }
  /** What iOS does after a call or a notification. */
  interrupt() {
    this.state = "interrupted";
    this.onstatechange?.();
  }
}

const listeners: Record<string, () => void> = {};
const doc = {
  visibilityState: "visible",
  addEventListener: (type: string, fn: () => void) => {
    listeners[type] = fn;
  },
};
const session = { type: "auto" };

async function freshSampler() {
  vi.resetModules();
  return import("../sampler.ts");
}

beforeEach(() => {
  FakeContext.made = [];
  session.type = "auto";
  doc.visibilityState = "visible";
  vi.stubGlobal("window", { AudioContext: FakeContext });
  vi.stubGlobal("document", doc);
  vi.stubGlobal("navigator", { audioSession: session });
  vi.stubGlobal(
    "Audio",
    class {
      volume = 1;
      setAttribute() {}
      play() {
        return Promise.resolve();
      }
    },
  );
  vi.stubGlobal("fetch", () => Promise.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the sampler after iOS takes the audio away", () => {
  it("starts one context on the first tap and asks for a playback session", async () => {
    const s = await freshSampler();
    s.unlockAudio();
    s.unlockAudio();
    expect(FakeContext.made).toHaveLength(1);
    expect(session.type).toBe("playback");
  });

  it("does not replace a context that was made after the page went to the background", async () => {
    const s = await freshSampler();
    doc.visibilityState = "hidden";
    listeners.visibilitychange();
    doc.visibilityState = "visible";
    s.unlockAudio();
    s.unlockAudio();
    expect(FakeContext.made).toHaveLength(1);
    expect(s.audioDiagnostics().restarts).toBe(0);
  });

  it("resumes a merely suspended context instead of replacing it", async () => {
    const s = await freshSampler();
    s.unlockAudio();
    FakeContext.made[0].state = "suspended";
    s.unlockAudio();
    expect(FakeContext.made).toHaveLength(1);
    expect(FakeContext.made[0].resumes).toBe(1);
  });

  it("replaces an interrupted context on the next tap", async () => {
    const s = await freshSampler();
    s.unlockAudio();
    FakeContext.made[0].interrupt();
    s.unlockAudio();
    expect(FakeContext.made).toHaveLength(2);
    expect(FakeContext.made[0].closed).toBe(true);
    expect(s.audioDiagnostics().restarts).toBe(1);
  });

  it("replaces the context after a trip to the background, even when it says it is running", async () => {
    const s = await freshSampler();
    s.unlockAudio();
    doc.visibilityState = "hidden";
    listeners.visibilitychange();
    doc.visibilityState = "visible";
    listeners.visibilitychange();
    expect(FakeContext.made).toHaveLength(1);
    s.unlockAudio();
    expect(FakeContext.made).toHaveLength(2);
    expect(FakeContext.made[1].state).toBe("running");
  });

  it("replaces the context once after the microphone had the session", async () => {
    const s = await freshSampler();
    s.unlockAudio();
    s.setAudioSessionType("auto");
    s.markAudioStale();
    s.unlockAudio();
    s.unlockAudio();
    expect(FakeContext.made).toHaveLength(2);
  });

  it("plays notes on the new context", async () => {
    const s = await freshSampler();
    s.unlockAudio();
    await s.loadSamples("piano");
    FakeContext.made[0].interrupt();
    s.unlockAudio();
    s.playNote(60);
    expect(s.audioDiagnostics().state).toBe("running");
    expect(s.audioDiagnostics().lastPath).toMatch(/^piano/);
    expect(s.samplesReady("piano")).toBe(true);
  });
});
