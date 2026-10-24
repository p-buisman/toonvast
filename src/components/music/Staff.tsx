import type { PointerEvent } from "react";
import { ledgerLines, staffPosition, type Clef } from "../../engine/common/clef.ts";
import type { Pitch } from "../../engine/common/pitch.ts";
import { GLYPHS, STAFF_SPACE_UNITS } from "./glyphs.ts";

export interface StaffNote {
  pitch: Pitch;
  color?: string;
}

interface Props {
  clef: Clef;
  notes: readonly StaffNote[];
  /** Tapping the staff reports the position (0 = bottom line) under the finger. */
  onTap?: (position: number) => void;
  width?: number;
  height?: number;
}

const SP = 12; // staff space in viewBox units
const S = SP / STAFF_SPACE_UNITS; // glyph scale: font units → viewBox units
const NOTE_X = 205;

/** A five-line staff with a clef and one or more notes (same x, so chords stack). */
export function Staff({ clef, notes, onTap, width = 340, height = 176 }: Props) {
  const top = (height - 4 * SP) / 2 + 2;
  const bottom = top + 4 * SP;
  const yOf = (pos: number) => bottom - (pos * SP) / 2;
  const glyph = (name: string, x: number, y: number, color = "currentColor") => (
    <path d={GLYPHS[name].d} transform={`translate(${x} ${y}) scale(${S} ${-S})`} fill={color} />
  );
  const clefGlyph = clef === "treble" ? glyph("gClef", 22, yOf(2)) : glyph("fClef", 22, yOf(6));
  const ledger = new Set<number>();
  for (const n of notes) for (const l of ledgerLines(staffPosition(n.pitch, clef))) ledger.add(l);

  const handle = (e: PointerEvent<SVGSVGElement>) => {
    if (!onTap) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * height;
    const pos = Math.round((bottom - y) / (SP / 2));
    onTap(Math.max(-7, Math.min(15, pos)));
  };

  return (
    <div className="staff">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Notenbalk" onPointerDown={onTap ? handle : undefined} style={{ color: "#1e1b16" }}>
        <rect width={width} height={height} rx="14" fill="#fff" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="16" x2={width - 16} y1={top + i * SP} y2={top + i * SP} stroke="#333" strokeWidth="1.3" />
        ))}
        {clefGlyph}
        {[...ledger].map((l) => (
          <line key={l} x1={NOTE_X - 10} x2={NOTE_X + 24} y1={yOf(l)} y2={yOf(l)} stroke="#333" strokeWidth="1.3" />
        ))}
        {notes.map((n, i) => {
          const pos = staffPosition(n.pitch, clef);
          const y = yOf(pos);
          const color = n.color ?? "currentColor";
          const headW = GLYPHS.noteheadBlack.advance * S;
          const stemUp = pos < 6;
          return (
            <g key={i}>
              {n.pitch.acc !== 0 && glyph(n.pitch.acc === 1 ? "sharp" : "flat", NOTE_X - 16, y, color)}
              {glyph("noteheadBlack", NOTE_X, y, color)}
              {stemUp ? (
                <line x1={NOTE_X + headW - 0.7} x2={NOTE_X + headW - 0.7} y1={y - 1} y2={y - 3.5 * SP} stroke={color} strokeWidth="1.4" />
              ) : (
                <line x1={NOTE_X + 0.7} x2={NOTE_X + 0.7} y1={y + 1} y2={y + 3.5 * SP} stroke={color} strokeWidth="1.4" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
