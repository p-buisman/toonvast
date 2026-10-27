import { useId } from "react";
import {
  contrastBg,
  FUZZBALL_EYES,
  FUZZBALL_MOUTHS,
  furRoles,
  IRIS_COLORS,
  lookOf,
  outline,
  type FuzzballEyes,
  type FuzzballMouth,
} from "../../engine/game/avatar.ts";
import type { Avatar as AvatarData } from "../../storage/db.ts";
import {
  FUZZBALL_BACKGROUND_ART,
  FUZZBALL_BODY,
  FUZZBALL_CLOSE,
  FUZZBALL_DEFS,
  FUZZBALL_EYES_ART,
  FUZZBALL_ITEM_ART,
  FUZZBALL_MOUTH_ART,
  FUZZBALL_SIZE,
} from "./fuzzballLayers.ts";

/** The shop items the drawing has a layer for, by the slot they sit in. */
const ITEM_LAYER: Record<string, keyof typeof FUZZBALL_ITEM_ART> = { "hat-cap": "pet", "hat-top": "bolhoed", glasses: "bril", sunglasses: "zonnebril" };
const BACKGROUND_LAYER: Record<string, keyof typeof FUZZBALL_BACKGROUND_ART> = { "bg-stars": "sterren" };

/** The drawing with its placeholders filled in: the colour roles, the iris and a prefix for the ids. */
function fuzzballArt(
  values: Record<string, string>,
  eyes: FuzzballEyes,
  mouth: FuzzballMouth,
  items: (keyof typeof FUZZBALL_ITEM_ART)[],
  background: keyof typeof FUZZBALL_BACKGROUND_ART | null,
): string {
  const art =
    FUZZBALL_DEFS +
    (background ? FUZZBALL_BACKGROUND_ART[background] : "") +
    FUZZBALL_BODY +
    FUZZBALL_EYES_ART[eyes] +
    FUZZBALL_MOUTH_ART[mouth] +
    FUZZBALL_CLOSE +
    items.map((i) => FUZZBALL_ITEM_ART[i]).join("");
  return art.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? "");
}

/**
 * The fuzzball: the drawing of art/pluizenbolletje.svg on the same disc as the figure, in the fur colour of the profile,
 * with the eyes, mouth, items (cap, bowler hat, glasses, sunglasses) and background the profile chose. The drawing fills
 * the disc edge to edge.
 */
export function Fuzzball({ avatar, name, size = 48, className }: { avatar: AvatarData; name: string; size?: number; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const look = lookOf(avatar);
  const bg = contrastBg(avatar.color);
  const eyes = (FUZZBALL_EYES as readonly string[]).includes(look.eyes) ? (look.eyes as FuzzballEyes) : FUZZBALL_EYES[0];
  const mouth = (FUZZBALL_MOUTHS as readonly string[]).includes(look.mouth) ? (look.mouth as FuzzballMouth) : FUZZBALL_MOUTHS[0];
  const items = [avatar.hat, avatar.eyes].flatMap((worn) => (worn && ITEM_LAYER[worn] ? [ITEM_LAYER[worn]] : []));
  const background = (avatar.background && BACKGROUND_LAYER[avatar.background]) || null;
  const html = fuzzballArt({ ...furRoles(avatar.color), iris: IRIS_COLORS[look.iris], id }, eyes, mouth, items, background);
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
      <clipPath id={`${id}c`}>
        <circle cx="60" cy="60" r="58" />
      </clipPath>
      <g clipPath={`url(#${id}c)`}>
        <g transform={`scale(${120 / FUZZBALL_SIZE})`} dangerouslySetInnerHTML={{ __html: html }} />
      </g>
    </svg>
  );
}
