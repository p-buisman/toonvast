import { useState, type PointerEvent } from "react";
import { ledgerLines, pitchAtPosition, staffPosition, type Clef } from "../../engine/common/clef.ts";
import { pitchName, type Accidental, type Pitch } from "../../engine/common/pitch.ts";
import { GLYPHS, STAFF_SPACE_UNITS } from "./glyphs.ts";

export interface StaffNote {
  pitch: Pitch;
  color?: string;
}

interface Props {
  clef: Clef;
  notes: readonly StaffNote[];
  /**
   * Placing a note: the finger goes down, a preview note follows it up and down the staff with its name,
   * and lifting the finger reports the position (0 = bottom line). Sliding makes small targets hittable.
   */
  onTap?: (position: number) => void;
  /** The accidental the preview note is drawn and named with. */
  previewAcc?: Accidental;
  width?: number;
  height?: number;
}

const SP = 12; // staff space in viewBox units
const S = SP / STAFF_SPACE_UNITS; // glyph scale: font units → viewBox units
const NOTE_X = 205;
const PREVIEW = "#2f6fed";

/** A five-line staff with a clef and one or more notes (same x, so chords stack). */
export function Staff({ clef, notes, onTap, previewAcc = 0, width = 340, height = 176 }: Props) {
  const [preview, setPreview] = useState<number | null>(null);
  const top = (height - 4 * SP) / 2 + 2;
  const bottom = top + 4 * SP;
  const yOf = (pos: number) => bottom - (pos * SP) / 2;
  const glyph = (name: string, x: number, y: number, color = "currentColor") => (
    <path d={GLYPHS[name].d} transform={`translate(${x} ${y}) scale(${S} ${-S})`} fill={color} />
  );
  const clefGlyph = clef === "treble" ? glyph("gClef", 22, yOf(2)) : glyph("fClef", 22, yOf(6));
  const ledger = new Set<number>();
  for (const n of notes) for (const l of ledgerLines(staffPosition(n.pitch, clef))) ledger.add(l);
  if (preview !== null) for (const l of ledgerLines(preview)) ledger.add(l);

  const positionAt = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * height;
    return Math.max(-9, Math.min(17, Math.round((bottom - y) / (SP / 2))));
  };
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (!onTap) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPreview(positionAt(e));
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!onTap || preview === null) return;
    setPreview(positionAt(e));
  };
  const up = (e: PointerEvent<SVGSVGElement>) => {
    if (!onTap || preview === null) return;
    const pos = positionAt(e);
    setPreview(null);
    onTap(pos);
  };
  const cancel = () => setPreview(null);

  const headW = GLYPHS.noteheadBlack.advance * S;
  const drawNote = (pitch: Pitch, color: string, key: string | number, pos = staffPosition(pitch, clef)) => {
    const y = yOf(pos);
    const stemUp = pos < 6;
    return (
      <g key={key}>
        {pitch.acc !== 0 && glyph(pitch.acc === 1 ? "sharp" : "flat", NOTE_X - 16, y, color)}
        {glyph("noteheadBlack", NOTE_X, y, color)}
        {stemUp ? (
          <line x1={NOTE_X + headW - 0.7} x2={NOTE_X + headW - 0.7} y1={y - 1} y2={y - 3.5 * SP} stroke={color} strokeWidth="1.4" />
        ) : (
          <line x1={NOTE_X + 0.7} x2={NOTE_X + 0.7} y1={y + 1} y2={y + 3.5 * SP} stroke={color} strokeWidth="1.4" />
        )}
      </g>
    );
  };
  const previewPitch = preview === null ? null : pitchAtPosition(preview, clef, previewAcc);

  return (
    <div className="staff">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Notenbalk"
        onPointerDown={onTap ? down : undefined}
        onPointerMove={onTap ? move : undefined}
        onPointerUp={onTap ? up : undefined}
        onPointerCancel={onTap ? cancel : undefined}
        style={{ color: "#1e1b16", touchAction: onTap ? "none" : undefined }}
      >
        <rect width={width} height={height} rx="14" fill="#fff" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="16" x2={width - 16} y1={top + i * SP} y2={top + i * SP} stroke="#333" strokeWidth="1.3" />
        ))}
        {clefGlyph}
        {[...ledger].map((l) => (
          <line key={l} x1={NOTE_X - 10} x2={NOTE_X + 24} y1={yOf(l)} y2={yOf(l)} stroke="#333" strokeWidth="1.3" />
        ))}
        {notes.map((n, i) => drawNote(n.pitch, n.color ?? "currentColor", i))}
        {previewPitch && preview !== null && (
          <g opacity="0.85">
            {drawNote(previewPitch, PREVIEW, "preview", preview)}
            <rect x={NOTE_X + 30} y={yOf(preview) - 11} width="46" height="22" rx="11" fill={PREVIEW} />
            <text x={NOTE_X + 53} y={yOf(preview) + 5} fontSize="13" fontWeight="700" textAnchor="middle" fill="#fff">
              {pitchName(previewPitch, true)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
