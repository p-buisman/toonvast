import { useState, type PointerEvent } from "react";
import { signatureAccidentalsOf } from "../../engine/common/chord.ts";
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
  /** "chord": the notes share one x and stack; "melody": they follow each other from left to right. */
  layout?: "chord" | "melody";
  /** Key signature after the clef: sharps (> 0) or flats (< 0). Notes in the signature then carry no accidental. */
  signature?: number;
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
const SIGNATURE_X = 58;
const SIGNATURE_GAP = 10;
const PREVIEW = "#2f6fed";
/** Octaves of the signature accidentals in the treble clef (the bass clef sits two lower); sharps F C G D A E B, flats B E A D G C F. */
const SHARP_OCTAVES = [5, 5, 5, 5, 4, 5, 4];
const FLAT_OCTAVES = [4, 5, 4, 5, 4, 5, 4];

/** A five-line staff with a clef, an optional key signature, and one or more notes. */
export function Staff({ clef, notes, layout = "chord", signature = 0, onTap, previewAcc = 0, width = 340, height = 176 }: Props) {
  const [preview, setPreview] = useState<number | null>(null);
  const top = (height - 4 * SP) / 2 + 2;
  const bottom = top + 4 * SP;
  const yOf = (pos: number) => bottom - (pos * SP) / 2;
  const glyph = (name: string, x: number, y: number, color = "currentColor", key?: string | number) => (
    <path key={key} d={GLYPHS[name].d} transform={`translate(${x} ${y}) scale(${S} ${-S})`} fill={color} />
  );
  const clefGlyph = clef === "treble" ? glyph("gClef", 22, yOf(2)) : glyph("fClef", 22, yOf(6));

  const signatureAccs = signatureAccidentalsOf(signature);
  const inSignature = (p: Pitch) => signatureAccs.some((a) => a.letter === p.letter && a.acc === p.acc);
  const signatureGlyphs = signatureAccs.map((a, i) => {
    const octave = (signature > 0 ? SHARP_OCTAVES : FLAT_OCTAVES)[i] - (clef === "bass" ? 2 : 0);
    return glyph(
      a.acc === 1 ? "sharp" : "flat",
      SIGNATURE_X + i * SIGNATURE_GAP,
      yOf(staffPosition({ letter: a.letter, acc: 0, octave }, clef)),
      "currentColor",
      i,
    );
  });
  const signatureEnd = signatureAccs.length === 0 ? SIGNATURE_X : SIGNATURE_X + signatureAccs.length * SIGNATURE_GAP + 6;

  // Where each note sits: all on one x for a chord, spread out for a melody.
  const melodyStart = signatureEnd + 16;
  const melodyGap = notes.length > 1 ? (width - 26 - melodyStart) / (notes.length - 1) : 0;
  const xOf = (i: number) => (layout === "melody" ? melodyStart + i * melodyGap : NOTE_X);

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
  const ledgerAt = (x: number, pos: number, key: number) =>
    ledgerLines(pos).map((l) => <line key={`${key}:${l}`} x1={x - 10} x2={x + 24} y1={yOf(l)} y2={yOf(l)} stroke="#333" strokeWidth="1.3" />);
  const drawNote = (pitch: Pitch, color: string, key: string | number, x: number, pos = staffPosition(pitch, clef)) => {
    const y = yOf(pos);
    const stemUp = pos < 6;
    return (
      <g key={key}>
        {pitch.acc !== 0 && !inSignature(pitch) && glyph(pitch.acc === 1 ? "sharp" : "flat", x - 16, y, color)}
        {glyph("noteheadBlack", x, y, color)}
        {stemUp ? (
          <line x1={x + headW - 0.7} x2={x + headW - 0.7} y1={y - 1} y2={y - 3.5 * SP} stroke={color} strokeWidth="1.4" />
        ) : (
          <line x1={x + 0.7} x2={x + 0.7} y1={y + 1} y2={y + 3.5 * SP} stroke={color} strokeWidth="1.4" />
        )}
      </g>
    );
  };
  const previewPitch = preview === null ? null : pitchAtPosition(preview, clef, previewAcc);

  // Ledger lines: once per position under a chord, per note in a melody.
  const chordLedger = new Set<number>();
  if (layout === "chord") for (const n of notes) for (const l of ledgerLines(staffPosition(n.pitch, clef))) chordLedger.add(l);
  if (preview !== null) for (const l of ledgerLines(preview)) chordLedger.add(l);

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
        {signatureGlyphs}
        {[...chordLedger].map((l) => (
          <line key={l} x1={NOTE_X - 10} x2={NOTE_X + 24} y1={yOf(l)} y2={yOf(l)} stroke="#333" strokeWidth="1.3" />
        ))}
        {layout === "melody" && notes.flatMap((n, i) => ledgerAt(xOf(i), staffPosition(n.pitch, clef), i))}
        {notes.map((n, i) => drawNote(n.pitch, n.color ?? "currentColor", i, xOf(i)))}
        {previewPitch && preview !== null && (
          <g opacity="0.85">
            {drawNote(previewPitch, PREVIEW, "preview", NOTE_X, preview)}
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
