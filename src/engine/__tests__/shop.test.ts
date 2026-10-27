import { describe, expect, it } from "vitest";
import { contrastBg, DEFAULT_LOOK, FUR_COLORS, FUR_ORANGE, furRoles, lookOf, outline, tint } from "../game/avatar.ts";
import { applyItem, itemActive, itemReady, itemShown, shopItem, unlockedValues, type ShopAvatar } from "../game/shop.ts";

const base: ShopAvatar = { color: "#3d8bd9", hat: null };

describe("avatar look", () => {
  it("fills in the default face for a profile without one", () => {
    expect(lookOf(base)).toEqual(DEFAULT_LOOK);
    expect(lookOf({ look: { hair: "lang" } }).hair).toBe("lang");
    expect(lookOf({ look: { hair: "lang" } }).mouth).toBe("lach");
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

describe("what the shop sells per kind of avatar", () => {
  it("marks what is not drawn yet and hides what is free", () => {
    expect(itemReady(shopItem("sunglasses")!, "pluizenbol")).toBe(true);
    expect(itemReady(shopItem("sunglasses")!, "poppetje")).toBe(false);
    expect(itemReady(shopItem("hat-crown")!, "pluizenbol")).toBe(false);
    expect(itemReady(shopItem("hat-cap")!, "pluizenbol")).toBe(true);
    expect(itemReady(shopItem("hat-top")!, "pluizenbol")).toBe(true);
    expect(itemReady(shopItem("bg-stars")!, "pluizenbol")).toBe(true);
    expect(itemReady(shopItem("bg-notes")!, "pluizenbol")).toBe(false);
    expect(itemShown(shopItem("face-open")!, "pluizenbol")).toBe(false);
    expect(itemShown(shopItem("face-open")!, "poppetje")).toBe(true);
    expect(itemShown(shopItem("hat-cap")!, "pluizenbol")).toBe(true);
    expect(itemShown(shopItem("hair-knot")!, "pluizenbol")).toBe(false);
    expect(itemShown(shopItem("color-paars")!, "pluizenbol")).toBe(false);
    expect(itemShown(shopItem("theme-zee")!, "pluizenbol")).toBe(true);
    expect(shopItem("face-dicht")!.value).toBe("dicht");
    expect(shopItem("mouth-zang")!.slot).toBe("mouth");
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
    const curls = shopItem("hair-krullen")!;
    const on = applyItem(base, curls);
    expect(on.look?.hair).toBe("krullen");
    expect(itemActive(on, curls)).toBe(true);
    expect(itemActive(base, curls)).toBe(false);
    expect(applyItem(on, curls, false).look?.hair).toBe(DEFAULT_LOOK.hair);
    const wink = shopItem("face-knipoog")!;
    expect(applyItem(base, wink).look?.eyes).toBe("knipoog");
  });

  it("sets a clothing colour", () => {
    const purple = shopItem("color-paars")!;
    expect(applyItem(base, purple).color).toBe("#8e44ad");
    expect(itemActive(applyItem(base, purple), purple)).toBe(true);
  });

  it("dresses the fuzzball with its own items", () => {
    const ball: ShopAvatar = { ...base, look: { kind: "pluizenbol" } };
    const spiky = shopItem("fuzz-stekelig")!;
    expect(applyItem(ball, spiky).look?.fuzz).toBe("stekelig");
    expect(itemActive(applyItem(ball, spiky), spiky)).toBe(true);
    expect(applyItem(applyItem(ball, spiky), spiky, false).look?.fuzz).toBe(DEFAULT_LOOK.fuzz);
    const bow = shopItem("bow")!;
    expect(applyItem(ball, bow).neck).toBe("bow");
    expect(applyItem(applyItem(ball, bow), bow, false).neck).toBeNull();
    expect(unlockedValues("fuzz", new Set(["fuzz-krullig"]))).toEqual(["krullig"]);
  });

  it("lists what a profile unlocked per part", () => {
    expect(unlockedValues("hair", new Set(["hair-knot", "mouth-grijns"]))).toEqual(["knot"]);
    expect(unlockedValues("color", new Set())).toEqual([]);
  });
});
