/** What coins can buy: avatar parts, colour themes and the streak shield. */
export type ShopCategory = "avatar" | "theme" | "extra";
export type AvatarSlot = "hat" | "eyes" | "ears" | "background";

export interface ShopItem {
  id: string;
  title: string;
  price: number;
  category: ShopCategory;
  /** Avatar parts replace whatever is in their slot. */
  slot?: AvatarSlot;
}

export const SHIELD_ITEM_ID = "shield";

export const SHOP_ITEMS: readonly ShopItem[] = [
  { id: "hat-top", title: "Hoedje", price: 30, category: "avatar", slot: "hat" },
  { id: "hat-cap", title: "Pet", price: 25, category: "avatar", slot: "hat" },
  { id: "hat-crown", title: "Kroon", price: 80, category: "avatar", slot: "hat" },
  { id: "glasses", title: "Bril", price: 25, category: "avatar", slot: "eyes" },
  { id: "headphones", title: "Koptelefoon", price: 40, category: "avatar", slot: "ears" },
  { id: "bg-stars", title: "Sterren", price: 35, category: "avatar", slot: "background" },
  { id: "bg-notes", title: "Noten", price: 35, category: "avatar", slot: "background" },
  { id: "theme-zee", title: "Zee", price: 50, category: "theme" },
  { id: "theme-bos", title: "Bos", price: 50, category: "theme" },
  { id: "theme-zon", title: "Zonsondergang", price: 50, category: "theme" },
  { id: "theme-nacht", title: "Nacht", price: 50, category: "theme" },
  { id: SHIELD_ITEM_ID, title: "Streakbeschermer", price: 40, category: "extra" },
];

export const DEFAULT_THEME = "klassiek";
export const THEMES: readonly { id: string; title: string }[] = [
  { id: DEFAULT_THEME, title: "Klassiek" },
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
