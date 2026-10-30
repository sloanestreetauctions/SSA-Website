import { createHash } from "node:crypto";

/**
 * Mailing-list sign-ups, added to the house's Mailchimp audience through
 * Mailchimp's own Marketing API. New addresses are added as "pending", so
 * Mailchimp emails them to confirm (double opt-in) before they are subscribed.
 *
 * Settings (on the host, never in the code):
 *   MAILCHIMP_API_KEY      e.g. 0123abcd…-us21 (Mailchimp → Profile → Extras → API keys)
 *   MAILCHIMP_AUDIENCE_ID  e.g. a1b2c3d4e5 (Audience → Settings → Audience name and defaults)
 *   MAILCHIMP_API_URL      optional; only for testing against a stand-in server
 * Until both are set, sign-ups are switched off on the live site.
 */
export function mailingListReady(): boolean {
  return Boolean(process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_AUDIENCE_ID);
}

export class MailingListError extends Error {}

export async function subscribe(email: string): Promise<void> {
  const key = process.env.MAILCHIMP_API_KEY ?? "";
  const audience = process.env.MAILCHIMP_AUDIENCE_ID ?? "";
  const dc = key.split("-")[1];
  if (!key || !audience || !dc) throw new MailingListError("Mailchimp is not set up");

  const hash = createHash("md5").update(email.toLowerCase()).digest("hex");
  // PUT adds a new address as "pending" and leaves anyone already on the list exactly as they are.
  const base = process.env.MAILCHIMP_API_URL || `https://${dc}.api.mailchimp.com/3.0`;
  const res = await fetch(`${base}/lists/${encodeURIComponent(audience)}/members/${hash}`, {
    method: "PUT",
    headers: {
      Authorization: `Basic ${Buffer.from(`ssa:${key}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email_address: email, status_if_new: "pending" }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new MailingListError(`Mailchimp answered ${res.status}: ${detail.slice(0, 300)}`);
  }
}
