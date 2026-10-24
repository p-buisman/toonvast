import { useEffect, useRef } from "react";
import { spellMidi } from "../../engine/common/pitch.ts";
import { blackKeys, whiteKeys, type PianoRange } from "../../engine/instruments/piano.ts";

interface Props {
  range: PianoRange;
  /** MIDI number → fill colour for keys to light up. */
  highlights?: Readonly<Record<number, string>>;
  /** Octave letters ("C4") on the C keys. */
  labels?: boolean;
  onTap?: (midi: number) => void;
  /** Width of a white key in px; keys are never narrower than this, the piano scrolls instead. */
  keyWidth?: number;
  /** The key to scroll to the middle at first; the centre of the range otherwise. */
  focusMidi?: number;
  disabled?: boolean;
}

const HEIGHT = 150;
const BLACK_H = 92;

/** The screen piano: white and black keys in an SVG that scrolls sideways when the range is wide. */
export function Piano({ range, highlights = {}, labels = true, onTap, keyWidth = 30, focusMidi, disabled }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const whites = whiteKeys(range);
  const blacks = blackKeys(range);
  const kw = keyWidth;
  const width = whites.length * kw;
  const xOfWhite = (midi: number) => whites.indexOf(midi) * kw;
  const xOfBlack = (midi: number) => {
    // A black key sits on the border between the white keys around it.
    const below = whites.filter((w) => w < midi).length;
    return below * kw - kw * 0.31;
  };

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const target = focusMidi ?? Math.round((range.low + range.high) / 2);
    const below = whites.filter((w) => w < target).length;
    el.scrollLeft = Math.max(0, below * kw - el.clientWidth / 2);
    // Only on mount and when the range changes: the player scrolls after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.low, range.high, kw]);

  const tap = (midi: number) => {
    if (!disabled && onTap) onTap(midi);
  };

  return (
    <div className="piano-scroll" ref={scroller}>
      <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} role="group" aria-label="Piano">
        {whites.map((m) => {
          const fill = highlights[m] ?? "#fff";
          const lit = fill !== "#fff";
          return (
            <g key={m} onPointerDown={() => tap(m)} role="button" aria-label={spellMidi(m).letter + spellMidi(m).octave}>
              <rect x={xOfWhite(m)} y="0" width={kw} height={HEIGHT} rx="4" fill={fill} stroke="#9a9a9a" strokeWidth="1" />
              {labels && m % 12 === 0 && (
                <text
                  x={xOfWhite(m) + kw / 2}
                  y={HEIGHT - 8}
                  fontSize="10"
                  textAnchor="middle"
                  fill={lit ? "#fff" : "#8a8a8a"}
                  style={{ pointerEvents: "none" }}
                >
                  C{Math.floor(m / 12) - 1}
                </text>
              )}
            </g>
          );
        })}
        {blacks.map((m) => (
          <rect
            key={m}
            onPointerDown={() => tap(m)}
            role="button"
            aria-label={spellMidi(m).letter + "♯" + spellMidi(m).octave}
            x={xOfBlack(m)}
            y="0"
            width={kw * 0.62}
            height={BLACK_H}
            rx="3"
            fill={highlights[m] ?? "#222"}
          />
        ))}
      </svg>
    </div>
  );
}
