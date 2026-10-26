import { AVATAR_COLORS, DEFAULT_LOOK, type AvatarLook } from "./avatar.ts";

/** What coins can buy: avatar parts, the look (hair, face, clothes, colours), colour themes and the streak shield. */
export type ShopCategory = "avatar" | "look" | "theme" | "extra";
/** `eyes` is the glasses slot (its old name); `face` is the eye style of the look. */
export type AvatarSlot = "hat" | "eyes" | "ears" | "neck" | "background" | "hair" | "face" | "mouth" | "clothes" | "color" | "fuzz";

export interface ShopItem {
  id: string;
  title: string;
  price: number;
  category: ShopCategory;
  /** Avatar parts replace whatever is in their slot. */
  slot?: AvatarSlot;
  /** For a look slot: the value it sets (a hair style, a colour); the item id otherwise. */
  value?: string;
}

export const SHIELD_ITEM_ID = "shield";

export const SHOP_ITEMS: readonly ShopItem[] = [
  { id: "hat-top", title: "Hoedje", price: 50, category: "avatar", slot: "hat" },
  { id: "hat-cap", title: "Pet", price: 40, category: "avatar", slot: "hat" },
  { id: "hat-crown", title: "Kroon", price: 150, category: "avatar", slot: "hat" },
  { id: "glasses", title: "Bril", price: 40, category: "avatar", slot: "eyes" },
  { id: "headphones", title: "Koptelefoon", price: 60, category: "avatar", slot: "ears" },
  { id: "bg-stars", title: "Sterren", price: 50, category: "avatar", slot: "background" },
  { id: "bg-notes", title: "Noten", price: 50, category: "avatar", slot: "background" },
  { id: "bow", title: "Strik", price: 30, category: "avatar", slot: "neck" },
  { id: "hair-krullen", title: "Krullen", price: 40, category: "look", slot: "hair", value: "krullen" },
  { id: "hair-knot", title: "Knot", price: 40, category: "look", slot: "hair", value: "knot" },
  { id: "hair-stekeltjes", title: "Stekeltjes", price: 40, category: "look", slot: "hair", value: "stekeltjes" },
  { id: "hair-staart", title: "Staart", price: 40, category: "look", slot: "hair", value: "staart" },
  { id: "face-open", title: "Open ogen", price: 30, category: "look", slot: "face", value: "open" },
  { id: "face-knipoog", title: "Knipoog", price: 30, category: "look", slot: "face", value: "knipoog" },
  { id: "mouth-grijns", title: "Grijns", price: 30, category: "look", slot: "mouth", value: "grijns" },
  { id: "mouth-verrast", title: "Verrast", price: 30, category: "look", slot: "mouth", value: "verrast" },
  { id: "mouth-tong", title: "Tong", price: 30, category: "look", slot: "mouth", value: "tong" },
  { id: "fuzz-stekelig", title: "Stekelig pluis", price: 40, category: "look", slot: "fuzz", value: "stekelig" },
  { id: "fuzz-krullig", title: "Krullig pluis", price: 40, category: "look", slot: "fuzz", value: "krullig" },
  { id: "clothes-hoodie", title: "Hoodie", price: 50, category: "look", slot: "clothes", value: "hoodie" },
  { id: "clothes-kraag", title: "Kraag", price: 50, category: "look", slot: "clothes", value: "kraag" },
  { id: "color-paars", title: "Paars", price: 25, category: "look", slot: "color", value: "#8e44ad" },
  { id: "color-rood", title: "Rood", price: 25, category: "look", slot: "color", value: "#d64545" },
  { id: "theme-zee", title: "Zee", price: 80, category: "theme" },
  { id: "theme-bos", title: "Bos", price: 80, category: "theme" },
  { id: "theme-zon", title: "Zonsondergang", price: 80, category: "theme" },
  { id: "theme-nacht", title: "Nacht", price: 80, category: "theme" },
  { id: SHIELD_ITEM_ID, title: "Streakbeschermer", price: 30, category: "extra" },
];

export const DEFAULT_THEME = "klassiek";
export const THEMES: readonly { id: string; title: string }[] = [
  { id: DEFAULT_THEME, title: "Standaard" },
  { id: "theme-zee", title: "Zee" },
  { id: "theme-bos", title: "Bos" },
  { id: "theme-zon", title: "Zonsondergang" },
  { id: "theme-nacht", title: "Nacht" },
];

export function shopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}

export type BuyRefusal = "owned" | "coins" | "shields";

/** Why a purchase cannot go ahead, or null when it can. */
export function buyRefusal(item: ShopItem, coins: number, owned: ReadonlySet<string>, shields: number, maxShields: number): BuyRefusal | null {
  if (item.id === SHIELD_ITEM_ID) {
    if (shields >= maxShields) return "shields";
  } else if (owned.has(item.id)) return "owned";
  if (coins < item.price) return "coins";
  return null;
}

/** The avatar as stored on a profile, as far as the shop touches it. */
export interface ShopAvatar {
  color: string;
  hat: string | null;
  eyes?: string | null;
  ears?: string | null;
  neck?: string | null;
  background?: string | null;
  look?: Partial<AvatarLook>;
}

const LOOK_KEY: Partial<Record<AvatarSlot, keyof AvatarLook>> = { hair: "hair", face: "eyes", mouth: "mouth", clothes: "clothes", fuzz: "fuzz" };

/** Whether the item is what the avatar wears in its slot right now. */
export function itemActive(avatar: ShopAvatar, item: ShopItem): boolean {
  if (!item.slot) return false;
  const key = LOOK_KEY[item.slot];
  if (key) return (avatar.look?.[key] ?? DEFAULT_LOOK[key]) === item.value;
  if (item.slot === "color") return avatar.color === item.value;
  return avatar[item.slot as "hat" | "eyes" | "ears" | "neck" | "background"] === item.id;
}

/** The avatar with the item put on, or taken off again (back to the default of that part). */
export function applyItem<A extends ShopAvatar>(avatar: A, item: ShopItem, on = true): A {
  if (!item.slot) return avatar;
  const key = LOOK_KEY[item.slot];
  if (key) return { ...avatar, look: { ...avatar.look, [key]: on ? item.value : DEFAULT_LOOK[key] } };
  if (item.slot === "color") return { ...avatar, color: on ? item.value! : AVATAR_COLORS[0] };
  return { ...avatar, [item.slot]: on ? item.id : null };
}

/** The look values a profile may use for a part: what the shop gave it, on top of the free ones. */
export function unlockedValues(slot: AvatarSlot, owned: ReadonlySet<string>): string[] {
  return SHOP_ITEMS.filter((i) => i.slot === slot && i.value !== undefined && owned.has(i.id)).map((i) => i.value!);
}
