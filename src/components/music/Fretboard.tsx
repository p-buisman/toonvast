import { STRING_NAMES, type FretPosition } from "../../engine/instruments/guitar.ts";

export interface FretDot extends FretPosition {
  color: string;
  label?: string;
}

interface Props {
  maxFret?: number;
  dots?: readonly FretDot[];
  onTap?: (pos: FretPosition) => void;
  disabled?: boolean;
}

const W = 250;
const LEFT = 40;
const RIGHT = W - 40;
const NUT_Y = 46;
const FH = 58;

/** The first frets of the guitar neck, upright, with the low E string on the left. */
export function Fretboard({ maxFret = 4, dots = [], onTap, disabled }: Props) {
  const height = NUT_Y + FH * maxFret + 36;
  const sx = (string: number) => LEFT + (string * (RIGHT - LEFT)) / 5;
  const cy = (fret: number) => (fret === 0 ? NUT_Y - 22 : NUT_Y + (fret - 0.5) * FH);
  const tap = (string: number, fret: number) => {
    if (!disabled && onTap) onTap({ string, fret });
  };
  const markers = [3, 5, 7, 9].filter((f) => f <= maxFret);

  return (
    <div className="fretboard">
      <svg viewBox={`0 0 ${W} ${height}`} role="group" aria-label="Gitaarhals">
        <rect x={LEFT - 14} y={NUT_Y} width={RIGHT - LEFT + 28} height={FH * maxFret} rx="6" fill="#f3e3c8" />
        <rect x={LEFT - 14} y={NUT_Y - 5} width={RIGHT - LEFT + 28} height="7" fill="#333" />
        {Array.from({ length: maxFret }, (_, i) => i + 1).map((f) => (
          <g key={f}>
            <line x1={LEFT - 14} x2={RIGHT + 14} y1={NUT_Y + f * FH} y2={NUT_Y + f * FH} stroke="#999" strokeWidth="2" />
            <text x={LEFT - 28} y={cy(f) + 5} fontSize="13" fill="#888" textAnchor="middle">
              {f}
            </text>
          </g>
        ))}
        {markers.map((f) => (
          <circle key={f} cx={(LEFT + RIGHT) / 2} cy={cy(f)} r="5" fill="#d9c7a3" />
        ))}
        {STRING_NAMES.map((name, i) => (
          <g key={name + i}>
            <line x1={sx(i)} x2={sx(i)} y1={NUT_Y} y2={NUT_Y + FH * maxFret} stroke="#555" strokeWidth={3.2 - i * 0.4} />
            <text x={sx(i)} y={height - 10} fontSize="13" textAnchor="middle" fill="#666">
              {name}
            </text>
          </g>
        ))}
        {/* Faint rings above the nut show that an open string can be tapped too. */}
        {STRING_NAMES.map((_, s) => (
          <circle key={`open-${s}`} cx={sx(s)} cy={cy(0)} r="9" fill="none" stroke="#c9c2b4" strokeWidth="2" />
        ))}
        {/* Tap targets: one per string and fret, plus the open string above the nut. */}
        {STRING_NAMES.map((_, s) =>
          Array.from({ length: maxFret + 1 }, (_, f) => (
            <rect
              key={`${s}-${f}`}
              x={sx(s) - 20}
              y={f === 0 ? NUT_Y - 44 : NUT_Y + (f - 1) * FH}
              width="40"
              height={f === 0 ? 40 : FH}
              fill="transparent"
              role="button"
              aria-label={`snaar ${STRING_NAMES[s]} fret ${f}`}
              onClick={() => tap(s, f)}
            />
          )),
        )}
        {dots.map((d, i) => (
          <g key={i} style={{ pointerEvents: "none" }}>
            {d.fret === 0 && !d.label ? (
              // An open string: a ring, like in chord books.
              <circle cx={sx(d.string)} cy={cy(0)} r="10" fill="none" stroke={d.color} strokeWidth="3.5" />
            ) : d.fret === 0 ? (
              <circle cx={sx(d.string)} cy={cy(0)} r="12" fill={d.color} />
            ) : (
              <circle cx={sx(d.string)} cy={cy(d.fret)} r="15" fill={d.color} />
            )}
            {d.label && (
              <text x={sx(d.string)} y={cy(d.fret) + 5} fontSize="13" textAnchor="middle" fill="#fff" fontWeight="700">
                {d.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
