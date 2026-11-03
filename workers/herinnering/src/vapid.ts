/** Web push with VAPID: an empty push needs no encryption, only a signed token that says who sends it. */

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(text: string): Uint8Array {
  const raw = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export interface VapidKeys {
  /** The public key as the app knows it: an uncompressed P-256 point, base64url. */
  publicKey: string;
  /** The private value d, base64url. */
  privateKey: string;
  /** How the push service can reach the sender: a mailto: or https: address. */
  subject: string;
}

async function signingKey(keys: VapidKeys): Promise<CryptoKey> {
  const point = fromBase64url(keys.publicKey);
  const jwk: JsonWebKey = { kty: "EC", crv: "P-256", d: keys.privateKey, x: base64url(point.slice(1, 33)), y: base64url(point.slice(33, 65)) };
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

/** The signed token for a push service, valid for twelve hours. */
export async function vapidToken(endpoint: string, keys: VapidKeys, now: Date): Promise<string> {
  const encode = (value: object) => base64url(new TextEncoder().encode(JSON.stringify(value)));
  const claims = { aud: new URL(endpoint).origin, exp: Math.floor(now.getTime() / 1000) + 12 * 3600, sub: keys.subject };
  const body = `${encode({ typ: "JWT", alg: "ES256" })}.${encode(claims)}`;
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, await signingKey(keys), new TextEncoder().encode(body));
  return `${body}.${base64url(new Uint8Array(signature))}`;
}

/** Send an empty push. The status tells what became of it: 404 and 410 mean the address is gone for good. */
export async function sendEmptyPush(endpoint: string, keys: VapidKeys, now: Date): Promise<number> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${await vapidToken(endpoint, keys, now)}, k=${keys.publicKey}`,
      TTL: "3600",
      "Content-Length": "0",
    },
  });
  return response.status;
}
