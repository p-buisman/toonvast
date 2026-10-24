import { STRING_NAMES } from "../../engine/instruments/guitar.ts";
import type { Shape } from "../../engine/instruments/guitarChords.ts";

interface Props {
  frets: Shape;
  fingers?: readonly number[];
  title?: string;
  /** Colour of the dots. */
  color?: string;
  onClick?: () => void;
  selected?: boolean;
}

const W = 120;
const LEFT = 18;
const RIGHT = W - 18;
const TOP = 30;
const FH = 20;
const ROWS = 5;

/** A small chord box: strings left to right (low E first), frets top to bottom, like in a songbook. */
export function ChordDiagram({ frets, fingers, title, color = "#1e1b16", onClick, selected }: Props) {
  const used = frets.filter((f): f is number => f !== null && f > 0);
  const lowest = used.length ? Math.min(...used) : 1;
  const start = Math.max(...used, 0) > ROWS ? lowest : 1;
  const sx = (i: number) => LEFT + (i * (RIGHT - LEFT)) / 5;
  const height = TOP + FH * ROWS + 18;
  const svg = (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      role={onClick ? undefined : "img"}
      aria-label={title ?? "Akkoordgreep"}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {title && (
        <text x={W / 2} y="12" fontSize="13" fontWeight="700" textAnchor="middle" fill="#1e1b16">
          {title}
        </text>
      )}
      {start === 1 ? (
        <rect x={LEFT - 1} y={TOP - 3} width={RIGHT - LEFT + 2} height="4" fill="#333" />
      ) : (
        <text x={LEFT - 10} y={TOP + FH / 2 + 4} fontSize="10" fill="#777" textAnchor="middle">
          {start}
        </text>
      )}
      {Array.from({ length: ROWS + 1 }, (_, r) => (
        <line key={r} x1={LEFT} x2={RIGHT} y1={TOP + r * FH} y2={TOP + r * FH} stroke="#999" strokeWidth="1" />
      ))}
      {STRING_NAMES.map((_, i) => (
        <line key={i} x1={sx(i)} x2={sx(i)} y1={TOP} y2={TOP + ROWS * FH} stroke="#555" strokeWidth="1.2" />
      ))}
      {frets.map((f, i) => {
        if (f === null)
          return (
            <text key={i} x={sx(i)} y={TOP - 7} fontSize="11" textAnchor="middle" fill="#999">
              ✕
            </text>
          );
        if (f === 0) return <circle key={i} cx={sx(i)} cy={TOP - 10} r="4" fill="none" stroke="#777" strokeWidth="1.3" />;
        const y = TOP + (f - start + 0.5) * FH;
        return (
          <g key={i}>
            <circle cx={sx(i)} cy={y} r="7.5" fill={color} />
            {fingers && fingers[i] > 0 && (
              <text x={sx(i)} y={y + 3.5} fontSize="9" textAnchor="middle" fill="#fff" fontWeight="700">
                {fingers[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
  if (!onClick) return <div className="chord-diagram">{svg}</div>;
  return (
    <button type="button" className={selected ? "chord-diagram pick on" : "chord-diagram pick"} onClick={onClick} aria-label={title}>
      {svg}
    </button>
  );
}
