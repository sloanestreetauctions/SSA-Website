import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { serviceAccount } from "./google";

/**
 * CANCEL LINKS — each booking's emails carry a link that can cancel that one
 * booking and nothing else:
 *  - "client": in the client's confirmation ("Cancel this appointment");
 *  - "house":  in the email to info@ ("Cancel and tell the client").
 * A link is signed with a secret only the server knows, over the booking's
 * reference and time, so it can't be guessed, altered, or used for anyone
 * else's appointment (even one later booked at the same time). The secret is
 * BOOKING_LINK_SECRET if set, otherwise derived from the Google key (replacing
 * that key makes old links stop working, which is harmless).
 */

export type LinkKind = "client" | "house";

function secret(): Buffer {
  const own = process.env.BOOKING_LINK_SECRET?.trim();
  const base = own || serviceAccount().key || "";
  if (!base) throw new Error("No secret available to sign cancel links.");
  return createHash("sha256").update(`ssa-booking-links|${base}`).digest();
}

const sign = (kind: LinkKind, reference: string, start: string) =>
  createHmac("sha256", secret()).update(`${kind}|${reference}|${start}`).digest("base64url").slice(0, 32);

export function verify(kind: LinkKind, reference: string, start: string, token: string) {
  const expected = Buffer.from(sign(kind, reference, start));
  const given = Buffer.from(token || "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** The full address of a cancel link, on the site the booking was made on. */
export function cancelLink(origin: string, kind: LinkKind, reference: string, start: string) {
  const q = new URLSearchParams({ ref: reference, start, t: sign(kind, reference, start), ...(kind === "house" ? { by: "house" } : {}) });
  return `${origin}/jewellery/appointments/cancel?${q.toString()}`;
}

/**
 * Which site the links in emails point to. On the live site, always its proper
 * address (never a one-off deployment address); on a Preview, that Preview, so
 * testing never touches the live site.
 */
export function linkOrigin(request: Request) {
  if (process.env.VERCEL_ENV === "production") {
    const site = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
    if (site) return site.replace(/\/$/, "");
  }
  return new URL(request.url).origin;
}
