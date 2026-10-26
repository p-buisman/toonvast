import { useId } from "react";
import { contrastBg, EYE_SIZES, FUZZ_SHAPE, FUZZBALL_GEOM as G, IRIS_COLORS, lookOf, outline } from "../../engine/game/avatar.ts";
import type { Avatar as AvatarData } from "../../storage/db.ts";

const INK = "#2a211c";
const SHADE = "rgba(40,25,15,0.14)";
const CX = 60;
const f1 = (n: number) => Math.round(n * 10) / 10;

/** The outline of the ball: spikes (zacht, stekelig) or bumps (krullig) all the way round. */
function ballPath(cx: number, cy: number, r: number, fuzz: keyof typeof FUZZ_SHAPE): string {
  const n = Math.max(6, Math.round(FUZZ_SHAPE[fuzz].count * G.spikeCount));
  const len = FUZZ_SHAPE[fuzz].length * G.spikeScale;
  const P = (x: number, y: number) => `${f1(x)} ${f1(y)}`;
  if (fuzz === "krullig") {
    const parts: string[] = [];
    for (let i = 0; i < n; i++) {
      const a0 = (2 * Math.PI * i) / n;
      const a1 = (2 * Math.PI * (i + 1)) / n;
      const am = (a0 + a1) / 2;
      parts.push(`Q${P(cx + (r + 2 * len) * Math.cos(am), cy + (r + 2 * len) * Math.sin(am))} ${P(cx + r * Math.cos(a1), cy + r * Math.sin(a1))}`);
    }
    return `M${P(cx + r, cy)}${parts.join("")}Z`;
  }
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    const b = a + Math.PI / n;
    pts.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)), P(cx + (r + len) * Math.cos(b), cy + (r + len) * Math.sin(b)));
  }
  return `M${pts.join("L")}Z`;
}

/**
 * The fuzzball: a coloured ball of fuzz with arms, legs, big eyes with an iris and a mouth, on the same disc as the
 * figure and dressed with the same shop items. The sizes come from the avatar workbench (FUZZBALL_GEOM).
 */
export function Fuzzball({ avatar, name, size = 48, className }: { avatar: AvatarData; name: string; size?: number; className?: string }) {
  const clip = useId();
  const look = lookOf(avatar);
  const color = avatar.color;
  const bg = contrastBg(color);
  const lc = outline(color);
  const iris = IRIS_COLORS[look.iris];
  const cy = G.bodyY;
  const r = G.bodyR;
  const top = cy - r;
  const line = (c: string) => ({ stroke: outline(c), strokeWidth: 2, strokeLinejoin: "round" as const });
  const legTop = cy + r - 4;
  const legBot = legTop + G.legDrop;
  const fg = G.feetGap;
  const hx = G.handOut;
  const hy = G.armY + 12;
  const er = EYE_SIZES[look.eyeSize] * G.eyeScale;
  const ir = er * G.irisRatio;
  const eyeY = cy + G.eyeY;
  const eyeX = [CX - G.eyeGap, CX + G.eyeGap];
  const mouthY = cy + G.mouthY;
  const mw = G.mouthW;
  const k = r / 26; // the shade was drawn for a ball of 26
  const open = look.eyes !== "stip";
  const wink = look.eyes === "knipoog";

  const eye = (x: number, isOpen: boolean) => {
    if (!isOpen)
      return (
        <path
          d={`M${f1(x - er * 0.7)} ${eyeY + 1}q${f1(er * 0.7)}-${f1(er * 0.6)} ${f1(er * 1.4)} 0`}
          fill="none"
          stroke={INK}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      );
    return (
      <>
        <circle cx={x} cy={eyeY} r={f1(er)} fill="#fff" stroke={INK} strokeWidth="2" />
        <circle cx={f1(x + er * 0.1)} cy={f1(eyeY + er * 0.1)} r={f1(ir)} fill={iris} stroke={outline(iris)} strokeWidth="1.2" />
        <circle cx={f1(x + er * 0.1)} cy={f1(eyeY + er * 0.1)} r={f1(ir * 0.47)} fill={INK} />
        <circle cx={f1(x - er * 0.15)} cy={f1(eyeY - er * 0.25)} r={f1(er * 0.16)} fill="#fff" />
      </>
    );
  };
  const lids = (x: number) => (
    <path d={`M${f1(x - er - 1)} ${f1(eyeY + er * 0.2)}a${f1(er + 1)} ${f1(er + 1)} 0 0 0 ${f1(2 * er + 2)} 0z`} fill={color} stroke={lc} strokeWidth="2" />
  );
  const smile = <path d={`M${CX - mw} ${mouthY - 2}q${mw} 8 ${2 * mw} 0`} fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />;

  return (
    <svg
      className={["avatar-svg", className ?? ""].join(" ")}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Avatar van ${name}`}
      style={{ flex: "none", overflow: "visible" }}
    >
      <circle cx="60" cy="60" r="59" fill={bg} stroke={outline(bg, 0.25, 0.12)} strokeWidth="2" />
      {avatar.background === "bg-stars" && (
        <g fill="#f4a300" fontSize="16" textAnchor="middle">
          {(
            [
              [18, 40],
              [100, 30],
              [104, 84],
              [16, 92],
            ] as const
          ).map(([x, y]) => (
            <text key={`${x}-${y}`} x={x} y={y}>
              ★
            </text>
          ))}
        </g>
      )}
      {avatar.background === "bg-notes" && (
        <g fill="#2f6fed" fontSize="18" textAnchor="middle">
          {(
            [
              [18, 44],
              [102, 34],
              [104, 88],
              [16, 94],
            ] as const
          ).map(([x, y]) => (
            <text key={`${x}-${y}`} x={x} y={y}>
              ♪
            </text>
          ))}
        </g>
      )}
      <clipPath id={clip}>
        <circle cx="60" cy="60" r="58" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        {/* Legs and feet, behind the ball */}
        <path
          d={`M${CX - 8} ${legTop}L${CX - fg + 3} ${legBot}M${CX + 8} ${legTop}L${CX + fg - 3} ${legBot}`}
          fill="none"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <ellipse cx={CX - fg} cy={legBot + 4} rx={G.footRx} ry="4.5" fill={lc} stroke={INK} strokeWidth="1.5" />
        <ellipse cx={CX + fg} cy={legBot + 4} rx={G.footRx} ry="4.5" fill={lc} stroke={INK} strokeWidth="1.5" />
        {/* Arms, spread wide, with mitten hands */}
        <path
          d={`M${CX - r + 2} ${G.armY}Q${CX - r - 8} ${G.armY + 2} ${CX - hx + 1} ${hy - 2}M${CX + r - 2} ${G.armY}Q${CX + r + 8} ${G.armY + 2} ${CX + hx - 1} ${hy - 2}`}
          fill="none"
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={CX - hx} cy={hy} r={G.handR} fill={color} {...line(color)} />
        <circle cx={CX + hx} cy={hy} r={G.handR} fill={color} {...line(color)} />
        {/* The ball, with one shade along the bottom */}
        <path d={ballPath(CX, cy, r, look.fuzz)} fill={color} {...line(color)} />
        <path
          d={`M${f1(CX - 22 * k)} ${f1(cy + 12 * k)}q${f1(22 * k)} ${f1(16 * k)} ${f1(44 * k)} 0q${f1(-4 * k)} ${f1(12 * k)} ${f1(-22 * k)} ${f1(14 * k)}q${f1(-18 * k)} ${f1(-2 * k)} ${f1(-22 * k)} ${f1(-14 * k)}z`}
          fill={SHADE}
        />
        {/* Eyes */}
        {eye(eyeX[0], open)}
        {eye(eyeX[1], open && !wink)}
        {look.eyes === "blij" && (
          <>
            {lids(eyeX[0])}
            {lids(eyeX[1])}
          </>
        )}
        {/* Mouth */}
        {(look.mouth === "lach" || look.mouth === "tong") && smile}
        {look.mouth === "tong" && <path d={`M${CX - 1} ${mouthY + 2}q5-1 6 4q-3 4-7 0z`} fill="#e07a8a" stroke={INK} strokeWidth="1.2" />}
        {look.mouth === "grijns" && (
          <>
            <path d={`M${CX - mw - 1} ${mouthY - 3}h${2 * mw + 2}a${mw + 1} ${mw + 1} 0 0 1-${2 * mw + 2} 0z`} fill="#8c3b3b" stroke={INK} strokeWidth="1.5" />
            <rect x={CX - mw + 3} y={mouthY - 3} width={2 * mw - 6} height="3.5" rx="1" fill="#fff" />
          </>
        )}
        {look.mouth === "neutraal" && <path d={`M${CX - mw + 2} ${mouthY}h${2 * mw - 4}`} fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />}
        {look.mouth === "verrast" && <ellipse cx={CX} cy={mouthY} rx={f1(mw / 2)} ry={f1(mw / 2 + 1)} fill="#8c3b3b" stroke={INK} strokeWidth="1.5" />}
        {/* Shop items, fitted to the ball */}
        {avatar.neck === "bow" && (
          <>
            <path d={`M${CX - 9} ${cy + r - 5}l8 3l-8 3zM${CX + 9} ${cy + r - 5}l-8 3l8 3z`} fill="#d64545" {...line("#d64545")} />
            <circle cx={CX} cy={cy + r - 2} r="2" fill={outline("#d64545")} />
          </>
        )}
        {avatar.eyes === "glasses" && (
          <g fill="none" stroke={INK} strokeWidth="2">
            <circle cx={eyeX[0]} cy={eyeY} r={f1(er + 3)} />
            <circle cx={eyeX[1]} cy={eyeY} r={f1(er + 3)} />
            <path
              d={`M${f1(eyeX[0] + er + 3)} ${eyeY}h${f1(2 * G.eyeGap - 2 * (er + 3))}M${f1(eyeX[0] - er - 3)} ${eyeY}L${CX - r - 6} ${eyeY - 3}M${f1(eyeX[1] + er + 3)} ${eyeY}L${CX + r + 6} ${eyeY - 3}`}
            />
          </g>
        )}
        {avatar.ears === "headphones" && (
          <>
            <path d={`M${CX - r - 7} ${cy}A${r + 7} ${r + 7} 0 0 1 ${CX + r + 7} ${cy}`} fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
            <rect x={CX - r - 12} y={cy - 8} width="11" height="18" rx="4" fill={INK} />
            <rect x={CX + r + 1} y={cy - 8} width="11" height="18" rx="4" fill={INK} />
          </>
        )}
        {avatar.hat === "hat-top" && (
          <g fill={INK}>
            <rect x={CX - 16} y={top - 20} width="32" height="22" rx="3" />
            <rect x={CX - r - 2} y={top - 3} width={2 * r + 4} height="7" rx="3.5" />
            <rect x={CX - 16} y={top - 7} width="32" height="4" fill="#8c3b3b" />
          </g>
        )}
        {avatar.hat === "hat-cap" && (
          <>
            <path d={`M${CX - r + 2} ${top + 9}A${r - 2} ${r - 2} 0 0 1 ${CX + r - 2} ${top + 9}Z`} fill="#2f6fed" {...line("#2f6fed")} />
            <rect x={CX - 2} y={top + 4} width={r + 8} height="7" rx="3.5" fill="#2f6fed" {...line("#2f6fed")} />
          </>
        )}
        {avatar.hat === "hat-crown" && (
          <path
            d={`M${CX - 18} ${top + 6}L${CX - 18} ${top - 12}L${CX - 9} ${top - 2}L${CX} ${top - 16}L${CX + 9} ${top - 2}L${CX + 18} ${top - 12}L${CX + 18} ${top + 6}Z`}
            fill="#f4a300"
            stroke="#9a6400"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}
      </g>
    </svg>
  );
}
