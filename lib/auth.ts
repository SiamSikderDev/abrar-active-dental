import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";

/** Server secret for the session HMAC. Falls back to a per-process random
 *  secret (sessions die on restart) if ADMIN_SECRET is not configured. */
function getSecret(): string {
  const s = process.env.ADMIN_SECRET;
  if (s && s.length >= 16) return s;
  const g = (globalThis as unknown as { __aadSecret?: string }).__aadSecret;
  if (g) return g;
  const fresh = randomBytes(32).toString("hex");
  (globalThis as unknown as { __aadSecret?: string }).__aadSecret = fresh;
  return fresh;
}

export function hashPassword(pw: string): Buffer {
  return createHmac("sha256", getSecret()).update(pw).digest();
}

/** The session cookie value: HMAC(secret, ADMIN_PASSWORD). */
export function expectedSessionValue(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return hashPassword(pw).toString("hex");
}

export function checkPassword(pw: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = createHmac("sha256", getSecret()).update(pw).digest();
  const b = createHmac("sha256", getSecret()).update(expected).digest();
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function isAdmin(): Promise<boolean> {
  const expected = expectedSessionValue();
  if (!expected) return false;
  const store = await cookies();
  const v = store.get(ADMIN_COOKIE)?.value;
  if (!v) return false;
  const a = Buffer.from(v, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const COOKIE_OPTS = {
  httpOnly: true,
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
  sameSite: "lax" as const,
};
