import { useId } from "react";
import { contrastBg, furRoles, IRIS_COLORS, lookOf, outline, type Eyes, type Mouth } from "../../engine/game/avatar.ts";
import type { Avatar as AvatarData } from "../../storage/db.ts";
import {
  FUZZBALL_BACKGROUND_ART,
  FUZZBALL_BALL,
  FUZZBALL_BALL_OPEN,
  FUZZBALL_CLOSE,
  FUZZBALL_DEFS,
  FUZZBALL_EYES_ART,
  FUZZBALL_ITEM_ART,
  FUZZBALL_ITEM_MASK,
  FUZZBALL_LIMBS,
  FUZZBALL_MOUTH_ART,
  FUZZBALL_SIZE,
} from "./fuzzballLayers.ts";

type Item = keyof typeof FUZZBALL_ITEM_ART;

/** The shop items the drawing has a layer for, by the slot they sit in. */
const ITEM_LAYER: Record<string, Item> = {
  "hat-cap": "pet",
  "hat-top": "bolhoed",
  "hat-tall": "hoge-hoed",
  "hat-crown": "kroon",
  glasses: "bril",
  sunglasses: "zonnebril",
  bow: "strik",
};
const BACKGROUND_LAYER: Record<string, keyof typeof FUZZBALL_BACKGROUND_ART> = { "bg-stars": "sterren", "bg-notes": "noten" };

/**
 * The drawing with its placeholders filled in: the colour roles, the iris and a prefix for the ids. An item with a mask
 * (the top hat) clips the ball, eyes and mouth so the fuzz does not poke through it.
 */
function fuzzballArt(values: Record<string, string>, eyes: Eyes, mouth: Mouth, items: Item[], background: keyof typeof FUZZBALL_BACKGROUND_ART | null): string {
  const masks = items.flatMap((i) => FUZZBALL_ITEM_MASK[i] ?? []);
  const art =
    FUZZBALL_DEFS +
    (background ? FUZZBALL_BACKGROUND_ART[background] : "") +
    FUZZBALL_LIMBS +
    FUZZBALL_BALL_OPEN +
    masks.join("") +
    FUZZBALL_BALL +
    FUZZBALL_EYES_ART[eyes] +
    FUZZBALL_MOUTH_ART[mouth] +
    "</g>".repeat(masks.length) +
    FUZZBALL_CLOSE +
    items.map((i) => FUZZBALL_ITEM_ART[i]).join("");
  return art.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? "");
}

/**
 * The profile's avatar: the fuzzball of art/pluizenbolletje.svg on a disc, in the fur colour of the profile, with the
 * eyes, mouth, items (glasses, sunglasses, cap, bowler hat, top hat, crown, bow) and background the profile chose. The
 * drawing fills the disc edge to edge; items are drawn in the order of the drawing: glasses, hat, bow.
 */
export function Avatar({ avatar, name, size = 48, className }: { avatar: AvatarData; name: string; size?: number; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const look = lookOf(avatar);
  const bg = contrastBg(avatar.color);
  const items = [avatar.eyes, avatar.hat, avatar.neck].flatMap((worn) => (worn && ITEM_LAYER[worn] ? [ITEM_LAYER[worn]] : []));
  const background = (avatar.background && BACKGROUND_LAYER[avatar.background]) || null;
  const html = fuzzballArt({ ...furRoles(avatar.color), iris: IRIS_COLORS[look.iris], id }, look.eyes, look.mouth, items, background);
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
