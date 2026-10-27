/**
 * The avatar: a face with neck and shoulders, composed from a few shapes. The chosen colour is the clothing;
 * the background is the contrasting tint that belongs to it. Mirrors the Avatar card of the design system.
 */
export const SKIN_TONES = { licht: "#f7d9c4", "medium-licht": "#e3b48f", "medium-donker": "#b57a4e", donker: "#6f4a33" } as const;
export type Skin = keyof typeof SKIN_TONES;

export const HEAD_SHAPES = {
  rond: { rx: 27, ry: 27, corner: 27 },
  ovaal: { rx: 25, ry: 30, corner: 25 },
  hoekig: { rx: 26, ry: 27, corner: 15 },
} as const;
export type Head = keyof typeof HEAD_SHAPES;

export const HAIR_STYLES = ["kort", "lang", "krullen", "knot", "stekeltjes", "staart", "geen"] as const;
export type Hair = (typeof HAIR_STYLES)[number];

export const HAIR_COLORS = { zwart: "#1c1c1e", bruin: "#4a3222", blond: "#e8c46a", rood: "#b5532c", grijs: "#9a9a9a" } as const;
export type HairColor = keyof typeof HAIR_COLORS;

/** The eye styles of the figure; `dicht` exists on the fuzzball only. */
export const EYE_STYLES = ["blij", "open", "stip", "knipoog"] as const;
export type Eyes = (typeof EYE_STYLES)[number] | "dicht";

/** The mouths of the figure; the fuzzball has its own set (`FUZZBALL_MOUTHS`), the figure shows an unknown one as a smile. */
export const MOUTH_STYLES = ["lach", "grijns", "neutraal", "verrast"] as const;
export type Mouth = (typeof MOUTH_STYLES)[number] | "tong" | "open-lach" | "zang";

/** Two kinds of avatar: the figure (face, neck, shoulders) and the fuzzball (the drawing in art/pluizenbolletje.svg). */
export const AVATAR_KINDS = ["poppetje", "pluizenbol"] as const;
export type AvatarKind = (typeof AVATAR_KINDS)[number];

/** Fuzz styles are in the shop as "coming", the drawing has one fuzz so far. */
export const FUZZ_STYLES = ["zacht", "stekelig", "krullig"] as const;
export type Fuzz = (typeof FUZZ_STYLES)[number];

export const IRIS_COLORS = { bruin: "#6b4423", blauw: "#3d8bd9", groen: "#4f9a3c", grijs: "#8a8f9a", amber: "#d99a1c", paars: "#8e44ad" } as const;
export type Iris = keyof typeof IRIS_COLORS;

/** The eye and mouth layers of the drawing; another value falls back to the first. */
export const FUZZBALL_EYES = ["open", "blij", "knipoog", "dicht"] as const satisfies readonly Eyes[];
export const FUZZBALL_MOUTHS = ["lach", "open-lach", "tong", "verrast", "zang"] as const satisfies readonly Mouth[];
export type FuzzballEyes = (typeof FUZZBALL_EYES)[number];
export type FuzzballMouth = (typeof FUZZBALL_MOUTHS)[number];

export const CLOTHES_STYLES = ["shirt", "hoodie", "kraag"] as const;
export type Clothes = (typeof CLOTHES_STYLES)[number];

export interface AvatarLook {
  kind: AvatarKind;
  skin: Skin;
  head: Head;
  hair: Hair;
  hairColor: HairColor;
  eyes: Eyes;
  mouth: Mouth;
  clothes: Clothes;
  /** Fuzzball only: the fuzz and the colour of the iris. */
  fuzz: Fuzz;
  iris: Iris;
}

export const DEFAULT_LOOK: AvatarLook = {
  kind: "poppetje",
  skin: "licht",
  head: "rond",
  hair: "kort",
  hairColor: "bruin",
  eyes: "blij",
  mouth: "lach",
  clothes: "shirt",
  fuzz: "zacht",
  iris: "bruin",
};

/** A profile made before the face existed gets the default face in its own colour. */
export function lookOf(avatar: { look?: Partial<AvatarLook> }): AvatarLook {
  return { ...DEFAULT_LOOK, ...avatar.look };
}

/** Clothing colours every profile may pick; the shop adds more. */
export const AVATAR_COLORS = ["#e07a5f", "#3d8bd9", "#6c9a4c", "#b8a1e3", "#f4a300", "#2a9d8f"] as const;

/** The orange of the drawing: this fur keeps the drawing's own colours. */
export const FUR_ORANGE = "#ff8110";
/** Fur colours of the fuzzball, all free. */
export const FUR_COLORS = [FUR_ORANGE, "#2f6fed", "#2e9e5b", "#d64545", "#f4a300", "#8e44ad", "#0e7c86", "#e879b6"] as const;

/** The background tint per clothing colour: opposite hue, light, so it never clashes. */
const CONTRAST_BG: Record<string, string> = {
  "#e07a5f": "#dcf2e6",
  "#3d8bd9": "#ffe9b8",
  "#6c9a4c": "#fbe0e4",
  "#b8a1e3": "#f1f3cf",
  "#f4a300": "#dbe6fb",
  "#2a9d8f": "#fde5d2",
  "#8e44ad": "#fff0c8",
  "#d64545": "#d9ecf7",
  "#2f6fed": "#ffe9b8",
  "#2e9e5b": "#fbe0e4",
  "#0e7c86": "#fde5d2",
  "#ff6a3d": "#dcf2e6",
  "#ff8110": "#d6ebf8",
  "#e879b6": "#e4f0d8",
};

export function contrastBg(color: string): string {
  return CONTRAST_BG[color] ?? "#f1ede4";
}

type FreeLook = Partial<{ [K in keyof AvatarLook]: readonly AvatarLook[K][] }>;
/** The choices that need no purchase, per kind; the other values of a part come from the shop. */
export const FREE_LOOK: Record<AvatarKind, FreeLook> = {
  poppetje: { hair: ["kort", "lang", "geen"], eyes: ["blij", "stip"], mouth: ["lach", "neutraal"], clothes: ["shirt"] },
  pluizenbol: { eyes: ["open", "blij"], mouth: ["lach", "open-lach"], fuzz: ["zacht"] },
};

/**
 * Sizes and positions, in units of the 120×120 grid, as set on the avatar workbench (26 October 2026).
 * The figure: head centre and scale, eyes, mouth, ears, neck, where the collar starts under the chin, hair spikes and fringe.
 */
export const FIGURE_GEOM = {
  headScale: 1.1,
  headY: 56,
  eyeGap: 10,
  eyeY: -3,
  eyeScale: 1.15,
  mouthY: 12.5,
  mouthW: 8,
  earR: 6.5,
  neckW: 20,
  shoulder: 1,
  shoulderY: 13,
  spike: 12,
  fringe: 7.5,
} as const;

export const LOOK_LABEL: Record<string, string> = {
  licht: "Licht",
  "medium-licht": "Medium licht",
  "medium-donker": "Medium donker",
  donker: "Donker",
  rond: "Rond",
  ovaal: "Ovaal",
  hoekig: "Hoekig",
  kort: "Kort",
  lang: "Lang",
  krullen: "Krullen",
  knot: "Knot",
  stekeltjes: "Stekeltjes",
  staart: "Staart",
  geen: "Geen",
  zwart: "Zwart",
  bruin: "Bruin",
  blond: "Blond",
  rood: "Rood",
  grijs: "Grijs",
  blij: "Blij",
  open: "Open",
  stip: "Stip",
  knipoog: "Knipoog",
  lach: "Lach",
  grijns: "Grijns",
  neutraal: "Neutraal",
  verrast: "Verrast",
  shirt: "Shirt",
  hoodie: "Hoodie",
  kraag: "Kraag",
  tong: "Tong",
  dicht: "Dicht",
  "open-lach": "Open lach",
  zang: "Zang",
  poppetje: "Poppetje",
  pluizenbol: "Pluizenbol",
  zacht: "Zacht",
  stekelig: "Stekelig",
  krullig: "Krullig",
  blauw: "Blauw",
  groen: "Groen",
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
