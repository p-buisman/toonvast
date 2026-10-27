import { describe, expect, it } from "vitest";
import { contrastBg, DEFAULT_LOOK, FUR_COLORS, FUR_ORANGE, furRoles, lookOf, outline, tint, type AvatarLook } from "../game/avatar.ts";
import { applyItem, itemActive, itemReady, itemShown, shopItem, unlockedValues, type ShopAvatar } from "../game/shop.ts";

const base: ShopAvatar = { color: "#3d8bd9", hat: null };

describe("avatar look", () => {
  it("fills in the default look for a profile without one, or with the figure of the first version", () => {
    expect(lookOf(base)).toEqual(DEFAULT_LOOK);
    expect(lookOf({ look: { eyes: "knipoog" } }).eyes).toBe("knipoog");
    expect(lookOf({ look: { eyes: "knipoog" } }).mouth).toBe("lach");
    const figure = { look: { kind: "poppetje", eyes: "stip", mouth: "neutraal", hair: "lang" } as unknown as Partial<AvatarLook> };
    expect(lookOf(figure)).toEqual(DEFAULT_LOOK);
  });

  it("gives every clothing colour a background and darkens an outline", () => {
    expect(contrastBg("#3d8bd9")).toBe("#ffe9b8");
    expect(contrastBg("#123456")).toBe("#f1ede4");
    expect(outline("#3d8bd9")).toMatch(/^#[0-9a-f]{6}$/);
    expect(outline("#3d8bd9")).not.toBe("#3d8bd9");
  });
});

describe("fur colours of the drawn fuzzball", () => {
  it("keeps the drawing's own oranges and derives the roles for another fur", () => {
    expect(furRoles(FUR_ORANGE).mid).toBe(FUR_ORANGE);
    expect(furRoles(FUR_ORANGE).limb).toBe("#df3c00");
    for (const fur of FUR_COLORS) {
      const r = furRoles(fur);
      expect(r.mid).toBe(fur);
      expect(new Set([r.light, r.mid, r.deep, r.brow, r.limb, r.dark]).size).toBe(6);
      expect(contrastBg(fur)).not.toBe("#f1ede4");
    }
    expect(tint("#2f6fed", 0, 0.5)).toBe(tint("#2f6fed", 0, 0.9)); // clamped at the dark end
  });
});

describe("what the shop sells", () => {
  it("marks what is not drawn yet and hides what is free", () => {
    expect(itemReady(shopItem("headphones")!)).toBe(false);
    for (const id of ["sunglasses", "hat-crown", "hat-cap", "hat-top", "hat-tall", "bow", "mouth-grijns", "bg-stars", "bg-notes"]) {
      expect(itemReady(shopItem(id)!)).toBe(true);
    }
    expect(itemShown(shopItem("face-open")!)).toBe(false);
    expect(itemShown(shopItem("face-knipoog")!)).toBe(true);
    expect(itemShown(shopItem("hat-cap")!)).toBe(true);
    expect(itemShown(shopItem("theme-zee")!)).toBe(true);
    expect(shopItem("face-dicht")!.value).toBe("dicht");
    expect(shopItem("mouth-zang")!.slot).toBe("mouth");
    expect(shopItem("fuzz-stekelig")).toBeUndefined();
    expect(shopItem("hair-krullen")).toBeUndefined();
  });
});

describe("shop items on the avatar", () => {
  it("puts a hat on and takes it off", () => {
    const hat = shopItem("hat-cap")!;
    const on = applyItem(base, hat);
    expect(on.hat).toBe("hat-cap");
    expect(itemActive(on, hat)).toBe(true);
    expect(applyItem(on, hat, false).hat).toBeNull();
  });

  it("sets a look part and falls back to the default when taken off", () => {
    const wink = shopItem("face-knipoog")!;
    const on = applyItem(base, wink);
    expect(on.look?.eyes).toBe("knipoog");
    expect(itemActive(on, wink)).toBe(true);
    expect(itemActive(base, wink)).toBe(false);
    expect(applyItem(on, wink, false).look?.eyes).toBe(DEFAULT_LOOK.eyes);
    const song = shopItem("mouth-zang")!;
    expect(applyItem(base, song).look?.mouth).toBe("zang");
  });

  it("puts the bow on and takes it off", () => {
    const bow = shopItem("bow")!;
    expect(applyItem(base, bow).neck).toBe("bow");
    expect(applyItem(applyItem(base, bow), bow, false).neck).toBeNull();
  });

  it("lists what a profile unlocked per part", () => {
    expect(unlockedValues("mouth", new Set(["mouth-grijns", "face-knipoog"]))).toEqual(["grijns"]);
    expect(unlockedValues("face", new Set())).toEqual([]);
  });
});
