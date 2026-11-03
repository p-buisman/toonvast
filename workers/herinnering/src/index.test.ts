import { afterEach, describe, expect, it, vi } from "vitest";
import { sendDueReminders, type Env } from "./index.ts";

interface Row {
  device_id: string;
  profile_id: string;
  endpoint: string;
  time: string;
  tz: string;
  last_goal_date: string | null;
  last_sent_date: string | null;
}

const row = (device: string, profile: string, changes: Partial<Row> = {}): Row => ({
  device_id: device,
  profile_id: profile,
  endpoint: `https://fcm.googleapis.com/fcm/send/${device}`,
  time: "19:00",
  tz: "Europe/Amsterdam",
  last_goal_date: null,
  last_sent_date: null,
  ...changes,
});

/** Just enough of the database for what the schedule does. */
function fakeEnv(rows: Row[]): { env: Env; rows: () => Row[] } {
  let current = rows;
  const statement = (query: string) => {
    let values: unknown[] = [];
    const self = {
      bind(...v: unknown[]) {
        values = v;
        return self;
      },
      async all<T>() {
        return { results: current as T[] };
      },
      async first<T>() {
        return null as T | null;
      },
      async run() {
        if (query.startsWith("DELETE")) current = current.filter((r) => r.device_id !== values[0]);
        if (query.startsWith("UPDATE"))
          current = current.map((r) => (r.device_id === values[1] && r.profile_id === values[2] ? { ...r, last_sent_date: values[0] as string } : r));
      },
    };
    return self;
  };
  const env: Env = {
    DB: {
      prepare: statement,
      async batch(list) {
        await Promise.all(list.map((s) => s.run()));
      },
    },
    VAPID_PUBLIC_KEY: "",
    VAPID_PRIVATE_KEY: "",
    VAPID_SUBJECT: "https://github.com/p-buisman/toonvast",
  };
  return { env, rows: () => current };
}

const SEVEN_PM = new Date("2026-11-03T18:00:00Z");

async function withKeys(env: Env): Promise<void> {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
  env.VAPID_PRIVATE_KEY = (await crypto.subtle.exportKey("jwk", pair.privateKey)).d!;
  env.VAPID_PUBLIC_KEY = Buffer.from(await crypto.subtle.exportKey("raw", pair.publicKey)).toString("base64url");
}

describe("the schedule", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends one push per device, for the profiles that have not practised", async () => {
    const posted: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      posted.push(url);
      return new Response(null, { status: 201 });
    });
    const { env, rows } = fakeEnv([
      row("gezin", "persoon-1", { last_goal_date: "2026-11-03" }),
      row("gezin", "persoon-2"),
      row("gezin", "persoon-3"),
      row("later", "persoon-4", { time: "20:00" }),
      row("klaar", "persoon-5", { last_goal_date: "2026-11-03" }),
    ]);
    await withKeys(env);
    expect(await sendDueReminders(env, SEVEN_PM)).toBe(1);
    expect(posted).toEqual(["https://fcm.googleapis.com/fcm/send/gezin"]);
    const sent = (id: string) => rows().find((r) => r.profile_id === id)?.last_sent_date;
    expect(sent("persoon-1")).toBeNull();
    expect(sent("persoon-2")).toBe("2026-11-03");
    expect(sent("persoon-3")).toBe("2026-11-03");
    // A next round on the same day sends nothing more.
    expect(await sendDueReminders(env, new Date("2026-11-03T18:15:00Z"))).toBe(0);
  });

  it("forgets a device whose push address is gone, and tries again after another failure", async () => {
    vi.stubGlobal("fetch", async (url: string) => new Response(null, { status: url.endsWith("weg") ? 410 : 500 }));
    const { env, rows } = fakeEnv([row("weg", "persoon-1"), row("storing", "persoon-2")]);
    await withKeys(env);
    expect(await sendDueReminders(env, SEVEN_PM)).toBe(0);
    expect(rows().map((r) => r.device_id)).toEqual(["storing"]);
    expect(rows()[0].last_sent_date).toBeNull();
  });
});
