import "server-only";
import { settings } from "@/content";

/**
 * The two emails sent after a booking, through Resend (as the valuation form):
 *  - to the client: confirmation, where and when, how to change or cancel,
 *    and a calendar file (opens in Apple Calendar, Outlook and Google);
 *  - to the house (the inbox set in the editor): the client's details, with
 *    "Reply" going straight to the client.
 * RESEND_API_URL can point at a test server.
 */

export type BookingEmail = {
  reference: string;
  name: string;
  email: string;
  phone: string;
  details: string;
  start: string;
  end: string;
  when: string;
  location: string;
  specialist: string;
  notifyEmail: string;
  from: string;
  /** The confirmation wording from the editor, with {phone} and {email} filled in. */
  closingNote: string;
  /** The appointments calendar, so the house email can link straight to it. */
  calendarId?: string;
  /** Lets the client cancel (in their confirmation). */
  clientCancelLink?: string;
  /** Lets the house cancel and tell the client (in the house email). */
  houseCancelLink?: string;
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
const icsStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** The calendar file attached to the client's email. */
function calendarFile(b: BookingEmail) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sloane Street Auctions//Jewellery valuations//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.reference}@sloanestreetauctions.com`,
    `DTSTAMP:${icsStamp(new Date().toISOString())}`,
    `DTSTART:${icsStamp(b.start)}`,
    `DTEND:${icsStamp(b.end)}`,
    `SUMMARY:${icsText(`Jewellery valuation with ${b.specialist} · Sloane Street Auctions`)}`,
    `LOCATION:${icsText(b.location.replace(/\n/g, ", "))}`,
    `DESCRIPTION:${icsText(`Your valuation with ${b.specialist}, Head of Jewellery. ${b.closingNote}`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Tomorrow: jewellery valuation at Sloane Street Auctions",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}

const page = (inner: string) =>
  `<div style="font-family:Georgia,'Times New Roman',serif;color:#1f1e22;font-size:17px;line-height:1.55;max-width:560px">${inner}<p style="margin-top:28px;color:#5c5a5f;font-size:14px">Sloane Street Auctions · ${esc(settings.addressLines.join(", "))} · ${esc(settings.mainPhone)}</p></div>`;

export async function send(message: Record<string, unknown>) {
  const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(message),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Email not sent (${res.status}).`);
}

/** Sends both emails. Returns which ones went, so a failure is never hidden. */
export async function sendBookingEmails(b: BookingEmail) {
  // Opens Google Calendar and offers to add the Jewellery appointments calendar (only works for whoever it's shared with).
  const calendarLink = b.calendarId ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(b.calendarId)}` : "";
  const where = b.location.split("\n").map(esc).join("<br>");
  const client = send({
    from: b.from,
    to: [b.email],
    reply_to: b.notifyEmail,
    subject: `Your jewellery valuation: ${b.when}`,
    text: `Dear ${b.name},\n\nThank you for booking a jewellery valuation with ${b.specialist}, our Head of Jewellery.\n\nWhen: ${b.when}\nWhere: ${b.location.replace(/\n/g, ", ")}\n\n${b.closingNote}${b.clientCancelLink ? `\n\nCan't make it? Cancel this valuation: ${b.clientCancelLink}` : ""}\n\nReference: ${b.reference}\n\nSloane Street Auctions`,
    html: page(
      `<p>Dear ${esc(b.name)},</p><p>Thank you for booking a jewellery valuation with ${esc(b.specialist)}, our Head of Jewellery.</p>` +
        `<p><strong>When:</strong> ${esc(b.when)}<br><strong>Where:</strong><br>${where}</p>` +
        `<p>${esc(b.closingNote)}</p>` +
        (b.clientCancelLink ? `<p>Can't make it? <a href="${esc(b.clientCancelLink)}">Cancel this valuation</a></p>` : "") +
        `<p style="color:#5c5a5f;font-size:14px">Reference: ${esc(b.reference)}</p>`,
    ),
    attachments: [{ filename: "jewellery-valuation.ics", content: Buffer.from(calendarFile(b)).toString("base64"), content_type: "text/calendar" }],
  });
  const house = send({
    from: b.from,
    to: [b.notifyEmail],
    reply_to: b.email,
    subject: `New jewellery valuation: ${b.when} · ${b.name}`,
    text: `A jewellery valuation has been booked on the website.\n\nWhen: ${b.when}\nName: ${b.name}\nEmail: ${b.email}\nTelephone: ${b.phone}\n\nAbout their jewellery:\n${b.details || "(nothing added)"}\n\nIt is in the Jewellery appointments calendar${calendarLink ? ` (add it to your Google Calendar: ${calendarLink})` : ""}.${b.houseCancelLink ? `\n\nCancel and tell the client: ${b.houseCancelLink}` : " To cancel, delete it there and reply to this email to let the client know."}\n\nReference: ${b.reference}`,
    html: page(
      `<p>A jewellery valuation has been booked on the website.</p>` +
        `<p><strong>When:</strong> ${esc(b.when)}<br><strong>Name:</strong> ${esc(b.name)}<br><strong>Email:</strong> ${esc(b.email)}<br><strong>Telephone:</strong> ${esc(b.phone)}</p>` +
        `<p><strong>About their jewellery:</strong><br>${b.details ? esc(b.details).replace(/\n/g, "<br>") : "(nothing added)"}</p>` +
        `<p style="color:#5c5a5f;font-size:14px">It is in the Jewellery appointments calendar` +
        (calendarLink ? ` (<a href="${esc(calendarLink)}">add it to your Google Calendar</a>)` : "") +
        `. Reference: ${esc(b.reference)}</p>` +
        (b.houseCancelLink
          ? `<p><a href="${esc(b.houseCancelLink)}">Cancel and tell the client</a></p>`
          : `<p>To cancel, delete it there and reply to this email to let the client know.</p>`),
    ),
  });
  const [toClient, toHouse] = await Promise.allSettled([client, house]);
  return { client: toClient.status === "fulfilled", house: toHouse.status === "fulfilled" };
}

export type CancellationEmail = {
  by: "client" | "house";
  reference: string;
  when: string;
  name: string;
  email: string;
  /** From the house, to the client (optional). */
  note: string;
  specialist: string;
  notifyEmail: string;
  from: string;
  rebookLink: string;
};

/** Tells the client and the house that a valuation has been cancelled. */
export async function sendCancellationEmails(c: CancellationEmail) {
  const dear = c.name ? `Dear ${c.name},` : "Hello,";
  const opening =
    c.by === "client"
      ? `Your jewellery valuation with ${c.specialist} on ${c.when} has been cancelled, as you asked.`
      : `We're sorry, but we have had to cancel your jewellery valuation with ${c.specialist} on ${c.when}.`;
  const client = c.email
    ? send({
        from: c.from,
        to: [c.email],
        reply_to: c.notifyEmail,
        subject: `Valuation cancelled: ${c.when}`,
        text: `${dear}\n\n${opening}${c.note ? `\n\n${c.note}` : ""}\n\nYou're welcome to book another time: ${c.rebookLink}\nOr simply reply to this email.\n\nReference: ${c.reference}\n\nSloane Street Auctions`,
        html: page(
          `<p>${esc(dear)}</p><p>${esc(opening)}</p>` +
            (c.note ? `<p>${esc(c.note).replace(/\n/g, "<br>")}</p>` : "") +
            `<p>You're welcome to <a href="${esc(c.rebookLink)}">book another time</a>, or simply reply to this email.</p>` +
            `<p style="color:#5c5a5f;font-size:14px">Reference: ${esc(c.reference)}</p>`,
        ),
      })
    : Promise.reject(new Error("No client email on the valuation."));
  const who = c.name || "The client";
  const houseLine =
    c.by === "client"
      ? `${who} has cancelled their jewellery valuation on ${c.when}. The time is free to book again.`
      : `The jewellery valuation with ${who} on ${c.when} has been cancelled from the website and ${c.email ? "the client has been emailed" : "the client couldn't be emailed (no address on the booking)"}. The time is free to book again.`;
  const house = send({
    from: c.from,
    to: [c.notifyEmail],
    ...(c.email ? { reply_to: c.email } : {}),
    subject: `Valuation cancelled: ${c.when} · ${c.name || c.reference}`,
    text: `${houseLine}${c.note ? `\n\nYour note to the client:\n${c.note}` : ""}\n\nReference: ${c.reference}`,
    html: page(
      `<p>${esc(houseLine)}</p>` +
        (c.note ? `<p><strong>Your note to the client:</strong><br>${esc(c.note).replace(/\n/g, "<br>")}</p>` : "") +
        `<p style="color:#5c5a5f;font-size:14px">Reference: ${esc(c.reference)}</p>`,
    ),
  });
  const [toClient, toHouse] = await Promise.allSettled([client, house]);
  return { client: toClient.status === "fulfilled", house: toHouse.status === "fulfilled" };
}
