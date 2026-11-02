import { settings } from "@/content";

/** What a calendar entry needs from a sale in the Auction calendar. */
type SaleLike = { title: string; date?: string | null; time?: string | null; description?: string | null; catalogueLink?: string | null };

/** A stable address for each sale's calendar file, e.g. 2026-12-03-the-christmas-auction. */
export function saleEventId(sale: SaleLike) {
  const slug = sale.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return `${sale.date}-${slug}`;
}

/** London wall-clock time → UTC, using the correct GMT/BST offset for that day. */
function londonToUtc(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(guess));
  const lh = Number(parts.find((p) => p.type === "hour")?.value);
  const lm = Number(parts.find((p) => p.type === "minute")?.value);
  const offsetMin = lh * 60 + lm - (hh * 60 + mm);
  return new Date(guess - offsetMin * 60_000);
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const day = (date: string) => date.replace(/-/g, "");
const nextDay = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
};

/**
 * Start and end of the calendar entry. The editor gives a start time only, so a
 * timed sale is entered as a one-hour reminder from its start; without a time
 * it is an all-day entry.
 */
function when(sale: SaleLike) {
  const date = sale.date ?? "";
  const time = /^\d{1,2}[:.]\d{2}$/.test((sale.time ?? "").trim()) ? (sale.time ?? "").trim().replace(".", ":") : null;
  if (!time) return { allDay: true as const, start: day(date), end: nextDay(date) };
  const start = londonToUtc(date, time);
  return { allDay: false as const, start: stamp(start), end: stamp(new Date(start.getTime() + 60 * 60_000)) };
}

const location = () => [settings.addressLines.join(", ")].join("");
const details = (sale: SaleLike) =>
  [sale.description, sale.time ? `Starts at ${sale.time}.` : "", sale.catalogueLink ? `Catalogue: ${sale.catalogueLink}` : ""]
    .filter(Boolean)
    .join("\n");

/** "Add to Google Calendar" link. */
export function googleCalendarUrl(sale: SaleLike) {
  const w = when(sale);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `${sale.title} · Sloane Street Auctions`,
    dates: `${w.start}/${w.end}`,
    details: details(sale),
    location: location(),
    ctz: "Europe/London",
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");

/** The .ics file that Apple Calendar, Outlook and most phones open directly. */
export function icsFile(sale: SaleLike) {
  const w = when(sale);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sloane Street Auctions//Auction calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${saleEventId(sale)}@sloanestreetauctions.com`,
    `DTSTAMP:${stamp(new Date())}`,
    w.allDay ? `DTSTART;VALUE=DATE:${w.start}` : `DTSTART:${w.start}`,
    w.allDay ? `DTEND;VALUE=DATE:${w.end}` : `DTEND:${w.end}`,
    `SUMMARY:${esc(`${sale.title} · Sloane Street Auctions`)}`,
    `LOCATION:${esc(location())}`,
    `DESCRIPTION:${esc(details(sale))}`,
    ...(sale.catalogueLink ? [`URL:${sale.catalogueLink}`] : []),
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(`Tomorrow: ${sale.title}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
