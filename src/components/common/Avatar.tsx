import type { Avatar as AvatarData } from "../../storage/db.ts";

/** The profile's face: a coloured disc with the initial, dressed with what was bought in the shop. */
export function Avatar({ avatar, name, size = 48, className }: { avatar: AvatarData; name: string; size?: number; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const bg = avatar.background ?? null;
  return (
    <svg
      className={["avatar-svg", className ?? ""].join(" ")}
      width={size}
      height={size}
      viewBox="-10 -16 120 126"
      aria-hidden="true"
      style={{ flex: "none", overflow: "visible" }}
    >
      {bg === "bg-stars" && (
        <g fill="#f4a300">
          {[
            [-4, 8],
            [96, 2],
            [104, 60],
            [-6, 70],
            [50, 110],
          ].map(([x, y], i) => (
            <text key={i} x={x} y={y} fontSize="16" textAnchor="middle">
              ★
            </text>
          ))}
        </g>
      )}
      {bg === "bg-notes" && (
        <g fill="#2f6fed">
          {[
            [-4, 14],
            [100, 8],
            [104, 72],
            [-4, 84],
          ].map(([x, y], i) => (
            <text key={i} x={x} y={y} fontSize="18" textAnchor="middle">
              ♪
            </text>
          ))}
        </g>
      )}
      <circle cx="50" cy="50" r="50" fill={avatar.color} />
      <text x="50" y="68" fontSize="48" fontWeight="700" textAnchor="middle" fill="#fff">
        {initial}
      </text>
      {avatar.eyes === "glasses" && (
        <g fill="none" stroke="#1c1c1e" strokeWidth="4">
          <circle cx="32" cy="42" r="12" />
          <circle cx="68" cy="42" r="12" />
          <line x1="44" y1="42" x2="56" y2="42" />
          <line x1="20" y1="40" x2="6" y2="34" />
          <line x1="80" y1="40" x2="94" y2="34" />
        </g>
      )}
      {avatar.ears === "headphones" && (
        <g>
          <path d="M 4 50 A 46 46 0 0 1 96 50" fill="none" stroke="#1c1c1e" strokeWidth="6" />
          <rect x="-4" y="44" width="16" height="26" rx="6" fill="#1c1c1e" />
          <rect x="88" y="44" width="16" height="26" rx="6" fill="#1c1c1e" />
        </g>
      )}
      {avatar.hat === "hat-top" && (
        <g fill="#1c1c1e">
          <rect x="26" y="-14" width="48" height="26" rx="3" />
          <rect x="12" y="8" width="76" height="7" rx="3.5" />
        </g>
      )}
      {avatar.hat === "hat-cap" && (
        <g fill="#2f6fed">
          <path d="M 18 14 A 32 30 0 0 1 82 14 Z" />
          <rect x="50" y="8" width="52" height="7" rx="3.5" />
        </g>
      )}
      {avatar.hat === "hat-crown" && <path d="M 20 12 L 20 -10 L 35 2 L 50 -16 L 65 2 L 80 -10 L 80 12 Z" fill="#f4a300" stroke="#9a6400" strokeWidth="2" />}
    </svg>
  );
}
