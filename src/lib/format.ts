/** Dates from the editor arrive as YYYY-MM-DD; shown in London, whatever the visitor's device says. */
const TIME_ZONE = "Europe/London";
const at = (date: string) => new Date(`${date}T12:00:00Z`);

/** "Tuesday 24 November 2026" */
export function formatSaleDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(at(date));
}

/** "24 Nov 2026" pieces for compact date lines. */
export function saleDateParts(date: string) {
  const fmt = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { ...options, timeZone: TIME_ZONE }).format(at(date));
  return { day: fmt({ day: "numeric" }), month: fmt({ month: "short" }), year: fmt({ year: "numeric" }) };
}

/** "14 November" (adds the year only if it differs from the sale's own year). */
export function formatShortDate(date: string, withYear = false): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: TIME_ZONE,
  }).format(at(date));
}
