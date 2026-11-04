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
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
const icsStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** The calendar file attached to the client's email. */
function calendarFile(b: BookingEmail) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sloane Street Auctions//Jewellery appointments//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.reference}@sloanestreetauctions.com`,
    `DTSTAMP:${icsStamp(new Date().toISOString())}`,
    `DTSTART:${icsStamp(b.start)}`,
    `DTEND:${icsStamp(b.end)}`,
    `SUMMARY:${icsText(`Jewellery appointment with ${b.specialist} · Sloane Street Auctions`)}`,
    `LOCATION:${icsText(b.location.replace(/\n/g, ", "))}`,
    `DESCRIPTION:${icsText(`Your appointment with ${b.specialist}, Head of Jewellery. ${b.closingNote}`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Tomorrow: jewellery appointment at Sloane Street Auctions",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}

const page = (inner: string) =>
  `<div style="font-family:Georgia,'Times New Roman',serif;color:#1f1e22;font-size:17px;line-height:1.55;max-width:560px">${inner}<p style="margin-top:28px;color:#5c5a5f;font-size:14px">Sloane Street Auctions · ${esc(settings.addressLines.join(", "))} · ${esc(settings.mainPhone)}</p></div>`;

async function send(message: Record<string, unknown>) {
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
    subject: `Your jewellery appointment: ${b.when}`,
    text: `Dear ${b.name},\n\nThank you for booking an appointment with ${b.specialist}, our Head of Jewellery.\n\nWhen: ${b.when}\nWhere: ${b.location.replace(/\n/g, ", ")}\n\n${b.closingNote}\n\nReference: ${b.reference}\n\nSloane Street Auctions`,
    html: page(
      `<p>Dear ${esc(b.name)},</p><p>Thank you for booking an appointment with ${esc(b.specialist)}, our Head of Jewellery.</p>` +
        `<p><strong>When:</strong> ${esc(b.when)}<br><strong>Where:</strong><br>${where}</p>` +
        `<p>${esc(b.closingNote)}</p><p style="color:#5c5a5f;font-size:14px">Reference: ${esc(b.reference)}</p>`,
    ),
    attachments: [{ filename: "jewellery-appointment.ics", content: Buffer.from(calendarFile(b)).toString("base64"), content_type: "text/calendar" }],
  });
  const house = send({
    from: b.from,
    to: [b.notifyEmail],
    reply_to: b.email,
    subject: `New jewellery appointment: ${b.when} · ${b.name}`,
    text: `A jewellery appointment has been booked on the website.\n\nWhen: ${b.when}\nName: ${b.name}\nEmail: ${b.email}\nTelephone: ${b.phone}\n\nAbout their jewellery:\n${b.details || "(nothing added)"}\n\nIt is in the Jewellery appointments calendar${calendarLink ? ` (add it to your Google Calendar: ${calendarLink})` : ""}. To cancel, delete it there and reply to this email to let the client know. Reference: ${b.reference}`,
    html: page(
      `<p>A jewellery appointment has been booked on the website.</p>` +
        `<p><strong>When:</strong> ${esc(b.when)}<br><strong>Name:</strong> ${esc(b.name)}<br><strong>Email:</strong> ${esc(b.email)}<br><strong>Telephone:</strong> ${esc(b.phone)}</p>` +
        `<p><strong>About their jewellery:</strong><br>${b.details ? esc(b.details).replace(/\n/g, "<br>") : "(nothing added)"}</p>` +
        `<p style="color:#5c5a5f;font-size:14px">It is in the Jewellery appointments calendar` +
        (calendarLink ? ` (<a href="${esc(calendarLink)}">add it to your Google Calendar</a>)` : "") +
        `. To cancel, delete it there and reply to this email to let the client know. Reference: ${esc(b.reference)}</p>`,
    ),
  });
  const [toClient, toHouse] = await Promise.allSettled([client, house]);
  return { client: toClient.status === "fulfilled", house: toHouse.status === "fulfilled" };
}
