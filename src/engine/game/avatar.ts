/**
 * The avatar: the fuzzball drawn in art/pluizenbolletje.svg, on a disc in the fur colour of the profile with the
 * contrasting background tint. Mirrors the Avatar card of the design system.
 */
export const IRIS_COLORS = { bruin: "#6b4423", blauw: "#3d8bd9", groen: "#4f9a3c", grijs: "#8a8f9a", amber: "#d99a1c", paars: "#8e44ad" } as const;
export type Iris = keyof typeof IRIS_COLORS;

/** The eye and mouth layers of the drawing. */
export const FUZZBALL_EYES = ["open", "blij", "knipoog", "dicht"] as const;
export const FUZZBALL_MOUTHS = ["lach", "open-lach", "grijns", "tong", "verrast", "zang"] as const;
export type Eyes = (typeof FUZZBALL_EYES)[number];
export type Mouth = (typeof FUZZBALL_MOUTHS)[number];

export interface AvatarLook {
  eyes: Eyes;
  mouth: Mouth;
  iris: Iris;
}

export const DEFAULT_LOOK: AvatarLook = { eyes: "blij", mouth: "lach", iris: "bruin" };

const has = <T extends string>(all: readonly T[], v: unknown): v is T => typeof v === "string" && (all as readonly string[]).includes(v);

/**
 * The look of a profile, every part a value the drawing has. A profile made before the fuzzball (the figure of the
 * first version, or a profile without a look) gets the default look; its colour becomes the fur.
 */
export function lookOf(avatar: { look?: Partial<AvatarLook> }): AvatarLook {
  const l = avatar.look ?? {};
  return {
    eyes: has(FUZZBALL_EYES, l.eyes) ? l.eyes : DEFAULT_LOOK.eyes,
    mouth: has(FUZZBALL_MOUTHS, l.mouth) ? l.mouth : DEFAULT_LOOK.mouth,
    iris: has(Object.keys(IRIS_COLORS) as Iris[], l.iris) ? l.iris : DEFAULT_LOOK.iris,
  };
}

/** The orange of the drawing: this fur keeps the drawing's own colours. */
export const FUR_ORANGE = "#ff8110";
/** Fur colours, all free; the first is the default of a new profile. */
export const FUR_COLORS = [FUR_ORANGE, "#2f6fed", "#2e9e5b", "#d64545", "#f4a300", "#8e44ad", "#0e7c86", "#e879b6"] as const;

/**
 * The background tint per fur colour: opposite hue, light, so it never clashes. The first six are the clothing colours
 * of the figure of the first version; a profile from then keeps that colour as its fur.
 */
const CONTRAST_BG: Record<string, string> = {
  "#e07a5f": "#dcf2e6",
  "#3d8bd9": "#ffe9b8",
  "#6c9a4c": "#fbe0e4",
  "#b8a1e3": "#f1f3cf",
  "#2a9d8f": "#fde5d2",
  "#ff6a3d": "#dcf2e6",
  "#ff8110": "#d6ebf8",
  "#2f6fed": "#ffe9b8",
  "#2e9e5b": "#fbe0e4",
  "#d64545": "#d9ecf7",
  "#f4a300": "#dbe6fb",
  "#8e44ad": "#fff0c8",
  "#0e7c86": "#fde5d2",
  "#e879b6": "#e4f0d8",
};

export function contrastBg(color: string): string {
  return CONTRAST_BG[color] ?? "#f1ede4";
}

/** The choices that need no purchase; the other values of a part come from the shop. */
export const FREE_LOOK: { eyes: readonly Eyes[]; mouth: readonly Mouth[] } = { eyes: ["open", "blij"], mouth: ["lach", "open-lach"] };

export const LOOK_LABEL: Record<string, string> = {
  open: "Open",
  blij: "Blij",
  knipoog: "Knipoog",
  dicht: "Dicht",
  lach: "Lach",
  "open-lach": "Open lach",
  grijns: "Grijns",
  tong: "Tong",
  verrast: "Verrast",
  zang: "Zang",
  bruin: "Bruin",
  blauw: "Blauw",
  groen: "Groen",
  grijs: "Grijs",
  amber: "Amber",
  paars: "Paars",
};

/** Same hue, lightness and saturation moved (both clamped); negative `dLight` makes it lighter. */
export function tint(hex: string, dSat: number, dLight: number): string {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  const l2 = Math.min(0.93, Math.max(0.1, l - dLight));
  const s2 = Math.min(1, Math.max(0, s + dSat));
  const q = l2 < 0.5 ? l2 * (1 + s2) : l2 + s2 - l2 * s2;
  const p = 2 * l2 - q;
  const hue = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const c = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${c(hue(h + 1 / 3))}${c(hue(h))}${c(hue(h - 1 / 3))}`;
}

/** Same hue, more saturated and darker: the outline of every filled shape. */
export function outline(hex: string, dSat = 0.18, dLight = 0.16): string {
  return tint(hex, dSat, dLight);
}

/** The colour roles of the drawn fuzzball: the oranges of the drawing, or the same roles derived from another fur. */
export interface FurRoles {
  light: string;
  mid: string;
  deep: string;
  brow: string;
  limb: string;
  limb2: string;
  dark: string;
}

const ORANGE_ROLES: FurRoles = { light: "#ff9a1b", mid: FUR_ORANGE, deep: "#f65a00", brow: "#f16600", limb: "#df3c00", limb2: "#e84c00", dark: "#632100" };

/**
 * The drawing tells its oranges apart by hue (yellow to red) as much as by lightness; another hue has only the
 * lightness, so the steps are bigger there. Orange keeps the drawing's own colours.
 */
export function furRoles(color: string): FurRoles {
  if (color === FUR_ORANGE) return ORANGE_ROLES;
  return {
    light: tint(color, 0.05, -0.09),
    mid: color,
    deep: tint(color, 0, 0.1),
    brow: tint(color, 0, 0.15),
    limb: tint(color, 0.1, 0.17),
    limb2: tint(color, 0.1, 0.13),
    dark: tint(color, 0, 0.36),
  };
}
