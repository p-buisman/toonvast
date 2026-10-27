import { METER_RANGE_CENTS, TUNE_TOLERANCE_CENTS } from "../../engine/instruments/tuner.ts";

const W = 340;
const L = 30;
const R = 310;
const Y = 46;

/** A scale from -50 to +50 cents with a green zone in the middle; the needle shows how far off the string is. */
export function TuneMeter({ cents, ok = false }: { cents: number | null; ok?: boolean }) {
  const xOf = (c: number) => L + ((c + METER_RANGE_CENTS) / (2 * METER_RANGE_CENTS)) * (R - L);
  const clamped = cents === null ? 0 : Math.max(-METER_RANGE_CENTS, Math.min(METER_RANGE_CENTS, cents));
  const x = xOf(clamped);
  const color = ok ? "var(--ok)" : "var(--accent)";
  const ticks = [];
  for (let c = -METER_RANGE_CENTS; c <= METER_RANGE_CENTS; c += 10) {
    const big = c % 50 === 0;
    ticks.push(<line key={c} x1={xOf(c)} x2={xOf(c)} y1={Y - (big ? 10 : 6)} y2={Y + (big ? 10 : 6)} stroke="var(--muted)" strokeWidth="1.5" />);
  }
  return (
    <svg className="tune-meter" viewBox={`0 0 ${W} 84`} role="img" aria-label={cents === null ? "Stemmeter" : `${Math.round(cents)} cent`}>
      <line x1={L} x2={R} y1={Y} y2={Y} stroke="var(--line)" strokeWidth="3" strokeLinecap="round" />
      <rect
        x={xOf(-TUNE_TOLERANCE_CENTS)}
        y={Y - 14}
        width={xOf(TUNE_TOLERANCE_CENTS) - xOf(-TUNE_TOLERANCE_CENTS)}
        height="28"
        rx="4"
        fill="var(--ok-soft)"
        stroke="var(--ok)"
        strokeWidth="1.5"
      />
      {ticks}
      {[-50, -25, 0, 25, 50].map((c) => (
        <text key={c} x={xOf(c)} y={Y + 28} textAnchor="middle" fontSize="12" fill="var(--muted)">
          {c > 0 ? `+${c}` : c}
        </text>
      ))}
      {cents !== null && (
        <g>
          <path d={`M${x} ${Y - 22} l-7 -12 h14 z`} fill={color} />
          <line x1={x} x2={x} y1={Y - 22} y2={Y + 14} stroke={color} strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
