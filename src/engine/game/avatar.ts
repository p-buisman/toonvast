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

export const MOUTH_STYLES = ["lach", "grijns", "neutraal", "verrast"] as const;
export type Mouth = (typeof MOUTH_STYLES)[number];

export const CLOTHES_STYLES = ["shirt", "hoodie", "kraag"] as const;
export type Clothes = (typeof CLOTHES_STYLES)[number];

export interface AvatarLook {
  skin: Skin;
  head: Head;
  hair: Hair;
  hairColor: HairColor;
  eyes: Eyes;
  mouth: Mouth;
  clothes: Clothes;
}

export const DEFAULT_LOOK: AvatarLook = { skin: "licht", head: "rond", hair: "kort", hairColor: "bruin", eyes: "blij", mouth: "lach", clothes: "shirt" };

/** A profile made before the face existed gets the default face in its own colour. */
export function lookOf(avatar: { look?: Partial<AvatarLook> }): AvatarLook {
  return { ...DEFAULT_LOOK, ...avatar.look };
}

/** Clothing colours every profile may pick; the shop adds more. */
export const AVATAR_COLORS = ["#e07a5f", "#3d8bd9", "#6c9a4c", "#b8a1e3", "#f4a300", "#2a9d8f"] as const;

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
};

export function contrastBg(color: string): string {
  return CONTRAST_BG[color] ?? "#f1ede4";
}

/** The choices that need no purchase; the other values of a part come from the shop. */
export const FREE_LOOK: { [K in Exclude<keyof AvatarLook, "skin" | "head" | "hairColor">]: readonly AvatarLook[K][] } = {
  hair: ["kort", "lang", "geen"],
  eyes: ["blij", "stip"],
  mouth: ["lach", "neutraal"],
  clothes: ["shirt"],
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
