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

export const EYE_STYLES = ["blij", "open", "stip", "knipoog"] as const;
export type Eyes = (typeof EYE_STYLES)[number];

/** `tong` is only drawn on the fuzzball; the figure shows it as a smile. */
export const MOUTH_STYLES = ["lach", "grijns", "neutraal", "verrast", "tong"] as const;
export type Mouth = (typeof MOUTH_STYLES)[number];

/** Two kinds of avatar: the figure (face, neck, shoulders) and the fuzzball (a ball of fuzz with arms, legs and big eyes). */
export const AVATAR_KINDS = ["poppetje", "pluizenbol"] as const;
export type AvatarKind = (typeof AVATAR_KINDS)[number];

export const FUZZ_STYLES = ["zacht", "stekelig", "krullig"] as const;
export type Fuzz = (typeof FUZZ_STYLES)[number];

export const EYE_SIZES = { klein: 6, middel: 8, groot: 10.5 } as const;
export type EyeSize = keyof typeof EYE_SIZES;

export const IRIS_COLORS = { bruin: "#6b4423", blauw: "#3d8bd9", groen: "#4f9a3c", grijs: "#8a8f9a", amber: "#d99a1c", paars: "#8e44ad" } as const;
export type Iris = keyof typeof IRIS_COLORS;

/** The eye styles the fuzzball can show (its eyes are always open discs; `stip` falls back to open). */
export const FUZZBALL_EYES: readonly Eyes[] = ["open", "blij", "knipoog"];

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
  /** Fuzzball only: the fuzz, the size of the eyes and the colour of the iris. */
  fuzz: Fuzz;
  eyeSize: EyeSize;
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
  eyeSize: "middel",
  iris: "bruin",
};

/** A profile made before the face existed gets the default face in its own colour. */
export function lookOf(avatar: { look?: Partial<AvatarLook> }): AvatarLook {
  return { ...DEFAULT_LOOK, ...avatar.look };
}

/** Clothing colours every profile may pick; the shop adds more. */
export const AVATAR_COLORS = ["#e07a5f", "#3d8bd9", "#6c9a4c", "#b8a1e3", "#f4a300", "#2a9d8f"] as const;

/** Fur colours of the fuzzball, all free. */
export const FUR_COLORS = ["#2f6fed", "#2e9e5b", "#d64545", "#f4a300", "#8e44ad", "#0e7c86", "#ff6a3d", "#e879b6"] as const;

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
  "#e879b6": "#e4f0d8",
};

export function contrastBg(color: string): string {
  return CONTRAST_BG[color] ?? "#f1ede4";
}

type FreeLook = Partial<{ [K in keyof AvatarLook]: readonly AvatarLook[K][] }>;
/** The choices that need no purchase, per kind; the other values of a part come from the shop. */
export const FREE_LOOK: Record<AvatarKind, FreeLook> = {
  poppetje: { hair: ["kort", "lang", "geen"], eyes: ["blij", "stip"], mouth: ["lach", "neutraal"], clothes: ["shirt"] },
  pluizenbol: { eyes: ["open", "blij", "knipoog"], mouth: ["lach", "neutraal"], fuzz: ["zacht"] },
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
/** The fuzzball: the ball, its fuzz, eyes, mouth, arms with hands, legs with feet. */
export const FUZZBALL_GEOM = {
  bodyR: 29.5,
  bodyY: 54,
  spikeScale: 1.1,
  spikeCount: 1.15,
  eyeGap: 12,
  eyeY: -5,
  eyeScale: 1,
  irisRatio: 0.55,
  mouthY: 15,
  mouthW: 10.5,
  armY: 58,
  handOut: 47,
  handR: 5,
  legDrop: 19,
  footRx: 10,
  feetGap: 14,
} as const;
/** Fuzz per style: how many spikes (or bumps) around the ball and how far they stick out. */
export const FUZZ_SHAPE: Record<Fuzz, { count: number; length: number }> = {
  zacht: { count: 36, length: 5 },
  stekelig: { count: 34, length: 10 },
  krullig: { count: 14, length: 7 },
};

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
  poppetje: "Poppetje",
  pluizenbol: "Pluizenbol",
  zacht: "Zacht",
  stekelig: "Stekelig",
  krullig: "Krullig",
  klein: "Klein",
  middel: "Middel",
  groot: "Groot",
  blauw: "Blauw",
  groen: "Groen",
  amber: "Amber",
  paars: "Paars",
};

/** Same hue, more saturated and darker: the outline of every filled shape. */
export function outline(hex: string, dSat = 0.18, dLight = 0.16): string {
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
  const l2 = Math.max(0, l - dLight);
  const s2 = Math.min(1, s + dSat);
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
