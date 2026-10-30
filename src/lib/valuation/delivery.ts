import "server-only";
import { settings } from "@/content";
import { VALUATION_CATEGORIES, type ValuationFields } from "./schema";

/**
 * WHERE VALUATION REQUESTS GO
 *
 * Each request is emailed to the valuations inbox set in the editor
 * (Contact details → "Valuation requests are sent to"), with the photographs
 * attached and "Reply" going straight to the person who asked.
 *
 * Set VALUATION_DELIVERY on the host to choose how:
 *  - "none" (default): checked but not sent anywhere; the visitor is told so.
 *    Used on your own computer, so testing never sends real email.
 *  - "resend": sent through Resend (resend.com), an email-sending service.
 *    Needs RESEND_API_KEY and VALUATION_FROM, e.g.
 *    "Sloane Street Auctions <valuations@sloanestreetauctions.com>". The sending
 *    domain must be verified in Resend (a few DNS records, added by whoever
 *    manages the domain; existing email is not affected).
 *
 * Secrets live only in the host's settings, never in this code.
 * RESEND_API_URL can point at a test server; it defaults to Resend itself.
 */

export type ValuationRequest = {
  fields: ValuationFields;
  photos: { name: string; type: string; bytes: ArrayBuffer }[];
  reference: string;
};

export type DeliveryResult = { delivered: true } | { delivered: false; reason: "not-configured" };

export class DeliveryError extends Error {}

export function deliveryMode(): "none" | "resend" {
  const mode = process.env.VALUATION_DELIVERY ?? "none";
  if (mode === "none" || mode === "resend") return mode;
  throw new DeliveryError(`VALUATION_DELIVERY="${mode}" is not recognised (use "none" or "resend").`);
}

export async function deliverValuationRequest(request: ValuationRequest): Promise<DeliveryResult> {
  const mode = deliveryMode();
  if (mode === "none") {
    // Deliberately does nothing: no personal data leaves this function.
    void request;
    return { delivered: false, reason: "not-configured" };
  }
  await sendWithResend(request);
  return { delivered: true };
}

async function sendWithResend({ fields, photos, reference }: ValuationRequest) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.VALUATION_FROM;
  const to = process.env.VALUATION_TO || settings.valuationInbox || settings.generalEmail;
  if (!key || !from) throw new DeliveryError("RESEND_API_KEY and VALUATION_FROM must both be set.");

  const response = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": reference },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: fields.email,
      subject: `Valuation request ${reference}: ${categoryLabel(fields.category)} from ${fields.name}`,
      text: plainText(fields, photos.length, reference),
      html: html(fields, photos.length, reference),
      attachments: photos.map((p, i) => ({
        filename: safeFilename(p.name, i, p.type),
        content: Buffer.from(p.bytes).toString("base64"),
      })),
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new DeliveryError(`Email service refused the request (${response.status}): ${detail.slice(0, 300)}`);
  }
}

/* ------------------------------------------------------------- the email */

const categoryLabel = (value: string) => VALUATION_CATEGORIES.find((c) => c.value === value)?.label ?? value;

function rows(f: ValuationFields): [string, string][] {
  return [
    ["Name", f.name],
    ["Email", f.email],
    ["Telephone", f.phone || "Not given"],
    ["Type of item", categoryLabel(f.category)],
    ["Description", f.description],
    ["Dimensions", f.dimensions || "Not given"],
    ["History / provenance", f.history || "Not given"],
  ];
}

function plainText(f: ValuationFields, photoCount: number, reference: string) {
  return [
    `New valuation request ${reference} from the website.`,
    "",
    ...rows(f).map(([k, v]) => `${k}: ${v}`),
    "",
    `Photographs: ${photoCount} attached.`,
    "Reply to this email to answer the sender directly.",
  ].join("\n");
}

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function html(f: ValuationFields, photoCount: number, reference: string) {
  const tr = rows(f)
    .map(
      ([k, v]) =>
        `<tr><th align="left" valign="top" style="padding:6px 16px 6px 0;color:#555;font-weight:normal;white-space:nowrap">${escape(k)}</th><td style="padding:6px 0;white-space:pre-wrap">${escape(v)}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:Georgia,serif;font-size:15px;color:#1f1e22">
<p>New valuation request <strong>${escape(reference)}</strong> from the website.</p>
<table cellspacing="0" cellpadding="0">${tr}</table>
<p>Photographs: ${photoCount} attached.<br>Reply to this email to answer the sender directly.</p>
</div>`;
}

function safeFilename(name: string, i: number, type: string) {
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const base = name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "-").slice(0, 60) || "photo";
  return `${String(i + 1).padStart(2, "0")}-${base}.${ext}`;
}

/** A short reference the visitor can quote, e.g. "V-7K3Q9P". */
export function newReference(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `V-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
}
