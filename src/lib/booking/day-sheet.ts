import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { appointmentsPage, jewelleryPage } from "@/content";
import { listEntries, type CalendarEntry } from "./google";
import { LOGO_PNG_BASE64 } from "./logo-png";
import { send } from "./mail";
import { appointmentsCalendarId, describeWhen } from "./service";
import { londonDate, londonToUtc } from "./slots";
import { bookingSettings } from "./status";
import { hold } from "./store";

/**
 * STEPHEN'S DAY SHEET — at 6pm on Tuesday, a PDF of Wednesday's appointments
 * (everything in the Jewellery appointments calendar that day: website bookings
 * with the client's details, and anything added by hand in Google Calendar) is
 * emailed to the address set in the editor (Pages → Jewellery valuations →
 * "Tomorrow's appointments are emailed to"). Run by the schedule in vercel.json.
 */

const TZ = "Europe/London";

export type SheetItem = {
  time: string;
  until: string;
  title: string;
  lines: { label?: string; text: string }[];
  note?: string;
  noteLabel?: string;
};

const clock = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso)).replace(" ", "");

/** "Wednesday 11 November 2026" */
export const longDate = (date: string) => describeWhen(londonToUtc(date, 12 * 60).toISOString()).replace(/ at .*$/, "");

/** A calendar entry as it appears on the sheet. Website bookings are read back from the entry's own description. */
export function toItem(e: CalendarEntry): SheetItem {
  const time = e.allDay ? "All day" : clock(e.start);
  const until = e.allDay ? "" : `until ${clock(e.end)}`;
  if (e.fromWebsite) {
    const d = e.description;
    const field = (label: string) => d.match(new RegExp(`^${label}: (.*)$`, "m"))?.[1]?.trim() ?? "";
    const about = d.split(/^About their jewellery:\n/m)[1]?.trim() ?? "";
    const reference = e.reference || d.match(/Reference (JA-[\w-]+)/)?.[1] || "";
    return {
      time,
      until,
      title: field("Name") || e.summary.replace(/^Jewellery (?:appointment|valuation): /, ""),
      lines: [
        { label: "Telephone", text: field("Telephone") },
        { label: "Email", text: field("Email") },
        ...(reference ? [{ label: "Reference", text: reference }] : []),
      ].filter((l) => l.text),
      note: about && about !== "(nothing added)" ? about : "",
      noteLabel: "About their jewellery",
    };
  }
  return { time, until, title: e.summary || "(No title)", lines: [{ text: "Added in Google Calendar" }], note: e.description.trim(), noteLabel: "Notes" };
}

/** The appointments on one London day. */
export async function itemsFor(date: string): Promise<SheetItem[]> {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  const entries = await listEntries(await appointmentsCalendarId(), londonToUtc(date, 0), londonToUtc(next, 0));
  return entries.filter((e) => !e.allDay || e.start.slice(0, 10) === date).map(toItem);
}

/* ------------------------------------------------------------------ the PDF */

const NAVY = rgb(0.04, 0.08, 0.16);
const SOFT = rgb(0.36, 0.35, 0.37);
const GOLD = rgb(0.54, 0.43, 0.2);
const LINE = rgb(0.85, 0.83, 0.8);

export async function renderSheet(date: string, items: SheetItem[], printedAt: Date): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Jewellery valuations · ${longDate(date)}`);
  pdf.setAuthor("Sloane Street Auctions");
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(Buffer.from(LOGO_PNG_BASE64, "base64"));

  // The built-in PDF fonts can't draw every character (e.g. emoji): those are left out rather than failing.
  const safe = (font: PDFFont, s: string) => {
    const ok = new Set(font.getCharacterSet());
    return [...s.replace(/\r/g, "")]
      .map((c) => (c === "\n" || ok.has(c.codePointAt(0)!) ? c : ""))
      .join("")
      .replace(/ {2,}/g, " ");
  };
  const wrap = (font: PDFFont, size: number, text: string, width: number) => {
    const out: string[] = [];
    for (const para of safe(font, text).split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const tryLine = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(tryLine, size) <= width) line = tryLine;
        else {
          if (line) out.push(line);
          line = word;
          while (font.widthOfTextAtSize(line, size) > width) {
            let cut = line.length - 1;
            while (cut > 1 && font.widthOfTextAtSize(line.slice(0, cut), size) > width) cut--;
            out.push(line.slice(0, cut));
            line = line.slice(cut);
          }
        }
      }
      out.push(line);
    }
    return out;
  };

  const W = 595.28, H = 841.89, M = 56, TIMEW = 100, BODYX = M + TIMEW, BODYW = W - M - BODYX;
  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;
  const text = (s: string, x: number, size: number, font: PDFFont, color = NAVY) => page.drawText(safe(font, s), { x, y, size, font, color });

  // Header
  const lw = 150, lh = (lw * logo.height) / logo.width;
  page.drawImage(logo, { x: (W - lw) / 2, y: y - lh, width: lw, height: lh });
  y -= lh + 34;
  const title = "Jewellery valuations";
  page.drawText(title, { x: (W - serif.widthOfTextAtSize(title, 26)) / 2, y, size: 26, font: serif, color: NAVY });
  y -= 26;
  const day = longDate(date);
  page.drawText(safe(serif, day), { x: (W - serif.widthOfTextAtSize(safe(serif, day), 16)) / 2, y, size: 16, font: serif, color: NAVY });
  y -= 20;
  const who = [jewelleryPage.specialist?.name, (appointmentsPage.location || "").split("\n").slice(1).join(", ")].filter(Boolean).join(" · ");
  const count = items.length === 1 ? "1 valuation" : `${items.length} valuations`;
  const sub = safe(sans, [who, count].filter(Boolean).join(" · "));
  page.drawText(sub, { x: (W - sans.widthOfTextAtSize(sub, 9.5)) / 2, y, size: 9.5, font: sans, color: SOFT });
  y -= 26;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1.2, color: NAVY });
  y -= 30;

  const footer = () =>
    page.drawText(
      safe(sans, `Printed ${describeWhen(printedAt.toISOString())} from the Jewellery appointments calendar. Bookings made after this aren't listed.`),
      { x: M, y: 32, size: 7.5, font: sans, color: SOFT },
    );

  if (items.length === 0) {
    text("No valuations are booked for this day.", M, 14, serif, SOFT);
  }

  for (const item of items) {
    const titleLines = wrap(serifBold, 14, item.title, BODYW);
    const noteLines = item.note ? wrap(serif, 11, item.note, BODYW) : [];
    const need = titleLines.length * 18 + item.lines.length * 14 + (noteLines.length ? 22 + noteLines.length * 14 : 0) + 30;
    if (y - need < 60 && y < H - M - 10) {
      footer();
      page = pdf.addPage([W, H]);
      y = H - M;
    }
    const top = y;
    text(item.time, M, 13, sansBold, NAVY);
    if (item.until) {
      y -= 15;
      text(item.until, M, 9, sans, SOFT);
      y += 15;
    }
    for (const l of titleLines) {
      text(l, BODYX, 14, serifBold);
      y -= 18;
    }
    y -= 2;
    for (const l of item.lines) {
      if (l.label) {
        text(`${l.label.toUpperCase()}`, BODYX, 7.5, sansBold, GOLD);
        text(l.text, BODYX + 70, 10.5, sans, NAVY);
      } else text(l.text, BODYX, 10, sans, SOFT);
      y -= 14;
    }
    if (noteLines.length) {
      y -= 6;
      text((item.noteLabel || "Notes").toUpperCase(), BODYX, 7.5, sansBold, GOLD);
      y -= 15;
      for (const l of noteLines) {
        if (y < 60) {
          footer();
          page = pdf.addPage([W, H]);
          y = H - M;
        }
        text(l, BODYX, 11, serif);
        y -= 14;
      }
    }
    y = Math.min(y, top - 30) - 8;
    page.drawLine({ start: { x: M, y: y + 14 }, end: { x: W - M, y: y + 14 }, thickness: 0.5, color: LINE });
    y -= 14;
  }
  footer();
  const pages = pdf.getPages();
  if (pages.length > 1)
    pages.forEach((p, i) => {
      const label = `Page ${i + 1} of ${pages.length}`;
      p.drawText(label, { x: W - M - sans.widthOfTextAtSize(label, 7.5), y: 32, size: 7.5, font: sans, color: SOFT });
    });
  return pdf.save();
}

/* ---------------------------------------------------------- sending it */

/** The London date after `at`. */
const tomorrowOf = (at: Date) => {
  const [y, m, d] = londonDate(at).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
};

export type SheetResult = { sent: boolean; date: string; count?: number; skipped?: string };

/**
 * Emails the sheet for `date` (default: tomorrow). Only once per day: a second
 * run for the same day does nothing, unless `again` is set.
 */
export async function sendDaySheet(now = new Date(), date = tomorrowOf(now), again = false): Promise<SheetResult> {
  const to = (appointmentsPage.daySheetEmail || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.includes("@"));
  if (!to.length) return { sent: false, date, skipped: "No address set in the editor for the day sheet." };

  const release = await hold(`booking:day-sheet:${date}`, 3 * 86_400);
  if (!release && !again) return { sent: false, date, skipped: "Already sent for this day." };
  try {
    const items = await itemsFor(date);
    const day = longDate(date);
    const summary = items.length
      ? items.map((i) => `${i.time}  ${i.title}`).join("\n")
      : "No valuations are booked.";
    const pdf = await renderSheet(date, items, now);
    await send({
      from: bookingSettings().from,
      to,
      reply_to: appointmentsPage.notifyEmail,
      subject: `Tomorrow's jewellery valuations: ${day} (${items.length})`,
      text: `${day}\n\n${summary}\n\nThe details are in the attached PDF, ready to print. Anything booked after 6pm won't be on it: check the Jewellery appointments calendar in the morning.\n\nSloane Street Auctions`,
      html: `<div style="font-family:Georgia,'Times New Roman',serif;color:#1f1e22;font-size:17px;line-height:1.55;max-width:560px"><p><strong>${day}</strong></p><p>${summary
        .split("\n")
        .map((l) => l.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!))
        .join("<br>")}</p><p style="color:#5c5a5f;font-size:15px">The details are in the attached PDF, ready to print. Anything booked after 6pm won't be on it: check the Jewellery appointments calendar in the morning.</p></div>`,
      attachments: [{ filename: `jewellery-valuations-${date}.pdf`, content: Buffer.from(pdf).toString("base64"), content_type: "application/pdf" }],
    });
    return { sent: true, date, count: items.length };
  } catch (error) {
    // Not sent: let a later run try again.
    await release?.();
    throw error;
  }
}
