import { useId } from "react";
import { contrastBg, FIGURE_GEOM as G, HAIR_COLORS, HEAD_SHAPES, lookOf, outline, SKIN_TONES } from "../../engine/game/avatar.ts";
import { Fuzzball } from "./Fuzzball.tsx";
import type { Avatar as AvatarData } from "../../storage/db.ts";

const INK = "#2a211c";
const SHADE = "rgba(40,25,15,0.14)";
const CX = 60;
const CY = G.headY;

/**
 * The profile's avatar: the figure (face with neck and shoulders) or the fuzzball, on a disc, composed from its look
 * and dressed with what was bought in the shop. Every shape has an outline in its own colour; one translucent shadow
 * gives depth. Sizes and positions come from the avatar workbench (FIGURE_GEOM).
 */
export function Avatar(props: { avatar: AvatarData; name: string; size?: number; className?: string }) {
  if (lookOf(props.avatar).kind === "pluizenbol") return <Fuzzball {...props} />;
  return <Figure {...props} />;
}

function Figure({ avatar, name, size = 48, className }: { avatar: AvatarData; name: string; size?: number; className?: string }) {
  const clip = useId();
  const look = lookOf(avatar);
  const skin = SKIN_TONES[look.skin];
  const hair = HAIR_COLORS[look.hairColor];
  const color = avatar.color;
  const bg = contrastBg(color);
  const rx = HEAD_SHAPES[look.head].rx * G.headScale;
  const ry = HEAD_SHAPES[look.head].ry * G.headScale;
  const corner = HEAD_SHAPES[look.head].corner * G.headScale;
  const top = CY - ry;
  const es = G.eyeScale;
  const mw = G.mouthW;
  const fr = G.fringe;
  const nw = G.neckW;
  const sw = 2;
  const line = (c: string) => ({ stroke: outline(c), strokeWidth: sw, strokeLinejoin: "round" as const });
  const eyeY = CY + G.eyeY;
  const eyeX = [CX - G.eyeGap, CX + G.eyeGap];
  const mouthY = CY + G.mouthY;
  const cap = `M${CX - rx - 1} ${CY - 2}Q${CX - rx - 1} ${top - 8} ${CX} ${top - 8}Q${CX + rx + 1} ${top - 8} ${CX + rx + 1} ${CY - 2}Q${CX + rx - 4} ${top + fr + 1} ${CX} ${top + fr}Q${CX - rx + 4} ${top + fr + 1} ${CX - rx - 1} ${CY - 2}Z`;
  const fringe = `M${CX - rx - 1} ${CY - 2}Q${CX - rx + 4} ${top + fr + 1} ${CX} ${top + fr}Q${CX + rx - 4} ${top + fr + 1} ${CX + rx + 1} ${CY - 2}`;
  // A point on the head's outline at `deg`, scaled by `f` and pushed `out` further.
  const on = (deg: number, f = 1, out = 0) => {
    const a = (deg * Math.PI) / 180;
    return `${(CX + (rx * f + out) * Math.cos(a)).toFixed(1)} ${(CY - (ry * f + out) * Math.sin(a)).toFixed(1)}`;
  };
  const spikes = (() => {
    const pts = [on(38, 0.97)];
    for (let a = 48; a < 140; a += 18) pts.push(on(a, 1, G.spike), on(a + 9, 0.97));
    pts.push(on(100, 0.8), on(80, 0.8));
    return `M${pts.join("L")}Z`;
  })();
  const curls: [number, number][] = [
    [-rx + 1, 10],
    [-rx + 6, 1],
    [-11, -5],
    [0, -7],
    [11, -5],
    [rx - 6, 1],
    [rx - 1, 10],
  ];

  const eye = (x: number, kind: "blij" | "open" | "stip") => {
    if (kind === "stip") return <circle cx={x} cy={eyeY} r={2.6 * es} fill={INK} />;
    if (kind === "open")
      return (
        <>
          <circle cx={x} cy={eyeY} r={4 * es} fill="#fff" stroke={INK} strokeWidth="1.5" />
          <circle cx={x + 0.8} cy={eyeY} r={2 * es} fill={INK} />
        </>
      );
    return <path d={`M${x - 4 * es} ${eyeY + 1}q${4 * es}-${5 * es} ${8 * es} 0`} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />;
  };

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
      <circle cx="60" cy="60" r="59" fill={bg} {...line(bg)} stroke={outline(bg, 0.25, 0.12)} />
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
      {/* Hair that hangs behind the head */}
      {look.hair === "lang" && <rect x={CX - rx - 6} y={top - 6} width={2 * rx + 12} height={ry * 2 + 22} rx="20" fill={hair} {...line(hair)} />}
      {look.hair === "knot" && <circle cx={CX} cy={top - 6} r="9" fill={hair} {...line(hair)} />}
      {look.hair === "staart" && (
        <>
          <ellipse cx={CX + rx + 4} cy={CY + 10} rx="7" ry="17" transform={`rotate(-12 ${CX + rx + 4} ${CY + 10})`} fill={hair} {...line(hair)} />
          <rect x={CX + rx - 2} y={CY - 10} width="10" height="6" rx="3" fill={outline(hair)} />
        </>
      )}
      {/* Neck and shoulders, cut off by the disc */}
      <clipPath id={clip}>
        <circle cx="60" cy="60" r="58" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect x={CX - nw / 2} y={CY + ry - 10} width={nw} height="30" fill={skin} {...line(skin)} />
        <rect x={CX - nw / 2 + 1} y={CY + ry - 9} width={nw - 2} height="10" fill={SHADE} />
        {/* The clothes were drawn with the collar at y 92; they move with the chin and stretch with the shoulders */}
        <g transform={`translate(${CX} ${CY + ry + G.shoulderY}) scale(${G.shoulder} 1) translate(-${CX} -92)`}>
          <path d="M8 126V113q0-16 22-21l14-4h32l14 4q22 5 22 21v13z" fill={color} {...line(color)} />
          <path d="M44 92q16 12 32 0l-4 7q-12 8-24 0z" fill={SHADE} />
          {look.clothes === "hoodie" && (
            <>
              <path d="M40 96q20 14 40 0" fill="none" stroke={bg} strokeWidth="3" strokeLinecap="round" />
              <path d="M54 108v10M66 108v10" stroke={bg} strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
          {look.clothes === "kraag" && <path d="M47 92L60 110l13-18" fill="#ffffff" stroke={bg} strokeWidth="1.5" strokeLinejoin="round" />}
        </g>
      </g>
      {/* Ears and head */}
      <circle cx={CX - rx} cy={CY + 3} r={G.earR} fill={skin} {...line(skin)} />
      <circle cx={CX + rx} cy={CY + 3} r={G.earR} fill={skin} {...line(skin)} />
      {look.head === "hoekig" ? (
        <rect x={CX - rx} y={CY - ry} width={2 * rx} height={2 * ry} rx={corner} fill={skin} {...line(skin)} />
      ) : (
        <ellipse cx={CX} cy={CY} rx={rx} ry={ry} fill={skin} {...line(skin)} />
      )}
      {/* Hair on top */}
      {look.hair === "stekeltjes" && (
        <>
          <path d={spikes} fill={hair} {...line(hair)} />
          <path d={cap} fill={hair} />
          <path d={fringe} fill="none" {...line(hair)} />
        </>
      )}
      {look.hair === "krullen" && (
        <>
          {curls.map(([dx, dy]) => (
            <circle key={`${dx}-${dy}`} cx={CX + dx} cy={top + dy} r="7" fill={hair} {...line(hair)} />
          ))}
          <path d={cap} fill={hair} />
          <path d={fringe} fill="none" {...line(hair)} />
        </>
      )}
      {(look.hair === "kort" || look.hair === "lang" || look.hair === "knot" || look.hair === "staart") && <path d={cap} fill={hair} {...line(hair)} />}
      {/* Face */}
      {look.eyes === "knipoog" ? (
        <>
          {eye(eyeX[0], "blij")}
          {eye(eyeX[1], "stip")}
        </>
      ) : (
        <>
          {eye(eyeX[0], look.eyes)}
          {eye(eyeX[1], look.eyes)}
        </>
      )}
      {(look.mouth === "lach" || look.mouth === "tong") && (
        <path d={`M${CX - mw} ${mouthY - 1}q${mw} 6 ${2 * mw} 0`} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      )}
      {look.mouth === "grijns" && (
        <>
          <path d={`M${CX - mw - 1} ${mouthY - 2}h${2 * mw + 2}a${mw + 1} ${mw + 1} 0 0 1-${2 * mw + 2} 0z`} fill="#8c3b3b" />
          <rect x={CX - mw + 2} y={mouthY - 2} width={2 * mw - 4} height="3" rx="1" fill="#fff" />
        </>
      )}
      {look.mouth === "neutraal" && <path d={`M${CX - mw + 1} ${mouthY}h${2 * mw - 2}`} fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />}
      {look.mouth === "verrast" && <ellipse cx={CX} cy={mouthY} rx={mw / 2} ry="4" fill="#8c3b3b" />}
      {/* Shop items, fitted to the head */}
      {avatar.eyes === "glasses" && (
        <g fill="none" stroke={INK} strokeWidth="2">
          <circle cx={eyeX[0]} cy={eyeY} r="7" />
          <circle cx={eyeX[1]} cy={eyeY} r="7" />
          <path
            d={`M${eyeX[0] + 7} ${eyeY}h${2 * G.eyeGap - 14}M${eyeX[0] - 7} ${eyeY}L${CX - rx - 2} ${eyeY - 2}M${eyeX[1] + 7} ${eyeY}L${CX + rx + 2} ${eyeY - 2}`}
          />
        </g>
      )}
      {avatar.ears === "headphones" && (
        <>
          <path
            d={`M${CX - rx - 5} ${CY + 2}A${rx + 5} ${ry + 6} 0 0 1 ${CX + rx + 5} ${CY + 2}`}
            fill="none"
            stroke={INK}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <rect x={CX - rx - 10} y={CY - 6} width="11" height="18" rx="4" fill={INK} />
          <rect x={CX + rx - 1} y={CY - 6} width="11" height="18" rx="4" fill={INK} />
        </>
      )}
      {avatar.hat === "hat-top" && (
        <g fill={INK}>
          <rect x={CX - 16} y={top - 22} width="32" height="22" rx="3" />
          <rect x={CX - rx - 4} y={top - 5} width={2 * rx + 8} height="7" rx="3.5" />
          <rect x={CX - 16} y={top - 9} width="32" height="4" fill="#8c3b3b" />
        </g>
      )}
      {avatar.hat === "hat-cap" && (
        <>
          <path d={`M${CX - rx - 1} ${top + 8}A${rx + 1} ${rx + 1} 0 0 1 ${CX + rx + 1} ${top + 8}Z`} fill="#2f6fed" {...line("#2f6fed")} />
          <rect x={CX - 2} y={top + 3} width={rx + 10} height="7" rx="3.5" fill="#2f6fed" {...line("#2f6fed")} />
        </>
      )}
      {avatar.hat === "hat-crown" && (
        <path
          d={`M${CX - 20} ${top + 4}L${CX - 20} ${top - 16}L${CX - 10} ${top - 5}L${CX} ${top - 20}L${CX + 10} ${top - 5}L${CX + 20} ${top - 16}L${CX + 20} ${top + 4}Z`}
          fill="#f4a300"
          stroke="#9a6400"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
