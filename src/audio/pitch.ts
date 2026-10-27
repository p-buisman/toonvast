/**
 * Pitch of a short stretch of sound, for the tuner: the normalised autocorrelation (McLeod's NSDF) over the
 * lags of the guitar's range, the first clear peak counts, and a parabola through it refines the lag.
 */
export interface PitchOptions {
  minHz?: number;
  maxHz?: number;
  /** Below this RMS level the stretch counts as silence. */
  minLevel?: number;
}

export function detectPitch(samples: Float32Array, sampleRate: number, { minHz = 70, maxHz = 400, minLevel = 0.01 }: PitchOptions = {}): number | null {
  const n = samples.length;
  let energy = 0;
  for (let i = 0; i < n; i++) energy += samples[i] * samples[i];
  if (Math.sqrt(energy / n) < minLevel) return null;

  const minLag = Math.floor(sampleRate / maxHz);
  const maxLag = Math.min(Math.ceil(sampleRate / minHz), n - 2);
  // From lag 0 (where the function is 1), so that the scan below starts in the first positive lobe.
  const nsdf = new Float32Array(maxLag + 1);
  for (let lag = 0; lag <= maxLag; lag++) {
    let ac = 0;
    let m = 0;
    for (let i = 0; i + lag < n; i++) {
      ac += samples[i] * samples[i + lag];
      m += samples[i] * samples[i] + samples[i + lag] * samples[i + lag];
    }
    nsdf[lag] = m > 0 ? (2 * ac) / m : 0;
  }

  // Peaks between the positive zero crossings; the first one close to the highest is the period.
  const peaks: number[] = [];
  let lag = 0;
  while (lag <= maxLag && nsdf[lag] > 0) lag++;
  while (lag <= maxLag) {
    while (lag <= maxLag && nsdf[lag] <= 0) lag++;
    let best = -1;
    while (lag <= maxLag && nsdf[lag] > 0) {
      if (best < 0 || nsdf[lag] > nsdf[best]) best = lag;
      lag++;
    }
    if (best >= minLag) peaks.push(best);
  }
  if (peaks.length === 0) return null;
  const highest = Math.max(...peaks.map((p) => nsdf[p]));
  if (highest < 0.6) return null;
  const chosen = peaks.find((p) => nsdf[p] >= 0.9 * highest)!;

  // Parabolic interpolation around the peak for a lag finer than one sample.
  let period = chosen;
  if (chosen > minLag && chosen < maxLag) {
    const a = nsdf[chosen - 1];
    const b = nsdf[chosen];
    const c = nsdf[chosen + 1];
    const denom = a - 2 * b + c;
    if (denom !== 0) period = chosen + (0.5 * (a - c)) / denom;
  }
  return sampleRate / period;
}
