import { describe, expect, it } from "vitest";
import { contrastBg, DEFAULT_LOOK, lookOf, outline } from "../game/avatar.ts";
import { applyItem, itemActive, shopItem, unlockedValues, type ShopAvatar } from "../game/shop.ts";

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

  it("lists what a profile unlocked per part", () => {
    expect(unlockedValues("hair", new Set(["hair-knot", "mouth-grijns"]))).toEqual(["knot"]);
    expect(unlockedValues("color", new Set())).toEqual([]);
  });
});
