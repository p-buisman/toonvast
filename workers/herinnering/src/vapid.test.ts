import { describe, expect, it } from "vitest";
import { allowedOrigin, isId, isPushEndpoint, parseReminder } from "./validate.ts";
import { vapidToken } from "./vapid.ts";

const decode = (part: string) => Buffer.from(part, "base64url");

describe("the signed token for the push services", () => {
  it("is valid for the origin of the address, signed with ES256", async () => {
    const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
    const raw = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
    const now = new Date("2026-11-03T18:00:00Z");
    const token = await vapidToken(
      "https://web.push.apple.com/abc",
      { publicKey: Buffer.from(raw).toString("base64url"), privateKey: jwk.d!, subject: "https://github.com/p-buisman/toonvast" },
      now,
    );
    const [header, claims, signature] = token.split(".");
    expect(JSON.parse(decode(header).toString())).toEqual({ typ: "JWT", alg: "ES256" });
    expect(JSON.parse(decode(claims).toString())).toEqual({
      aud: "https://web.push.apple.com",
      exp: now.getTime() / 1000 + 12 * 3600,
      sub: "https://github.com/p-buisman/toonvast",
    });
    const ok = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      pair.publicKey,
      decode(signature),
      new TextEncoder().encode(`${header}.${claims}`),
    );
    expect(ok).toBe(true);
  });
});

describe("what the server accepts", () => {
  it("posts only to the push services of the browsers", () => {
    expect(isPushEndpoint("https://web.push.apple.com/abc")).toBe(true);
    expect(isPushEndpoint("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(isPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc")).toBe(true);
    expect(isPushEndpoint("https://evil.example/abc")).toBe(false);
    expect(isPushEndpoint("https://web.push.apple.com.evil.example/abc")).toBe(false);
    expect(isPushEndpoint("http://web.push.apple.com/abc")).toBe(false);
    expect(isPushEndpoint(12)).toBe(false);
  });

  it("checks the reminder", () => {
    const good = { endpoint: "https://web.push.apple.com/a", time: "19:00", tz: "Europe/Amsterdam" };
    expect(parseReminder(good)).toEqual({ ...good, lastGoalDate: null });
    expect(parseReminder({ ...good, lastGoalDate: "2026-11-03" })?.lastGoalDate).toBe("2026-11-03");
    expect(parseReminder({ ...good, time: "19:07" })).toBeNull();
    expect(parseReminder({ ...good, tz: "Nergens/Niet" })).toBeNull();
    expect(parseReminder({ ...good, lastGoalDate: "gisteren" })).toBeNull();
    expect(parseReminder(null)).toBeNull();
  });

  it("knows the app and a local development server", () => {
    expect(allowedOrigin("https://p-buisman.github.io")).toBe("https://p-buisman.github.io");
    expect(allowedOrigin("http://localhost:5180")).toBe("http://localhost:5180");
    expect(allowedOrigin("https://evil.example")).toBeNull();
    expect(allowedOrigin(null)).toBeNull();
    expect(isId("6b1f4c1e-0f7a-4a64-9e3e-2f9d7f4e1a11")).toBe(true);
    expect(isId("../etc")).toBe(false);
  });
});
