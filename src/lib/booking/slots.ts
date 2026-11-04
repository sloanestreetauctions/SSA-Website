/**
 * APPOINTMENT TIMES — pure functions, no network, so they can be tested on
 * their own (scripts/test-booking-slots.mts).
 *
 * All rules are London wall-clock times ("09:30 on Wednesdays"). Each day's
 * times are turned into exact moments with the correct GMT/BST offset for that
 * date, so the clocks changing never shifts an appointment.
 */

export type DayRule = { day: string; start: string; end: string; breakStart?: string | null; breakEnd?: string | null };
export type BookingRules = {
  durationMinutes: number;
  gapMinutes: number;
  noticeHours: number;
  weeksAhead: number;
  days: readonly DayRule[];
  closed: readonly { from: string | null; to?: string | null }[];
};
/** A busy period from the calendar, in milliseconds since 1970 (UTC). */
export type Busy = { start: number; end: number };
export type Slot = {
  /** Exact start and end, ISO 8601 in UTC, e.g. 2026-11-11T09:30:00.000Z */
  start: string;
  end: string;
  /** London date and time, e.g. 2026-11-11 and 09:30 */
  date: string;
  time: string;
};

const TZ = "Europe/London";
const HHMM = /^([01]?\d|2[0-3])[:.]([0-5]\d)$/;

/** "09:30" → 570 (minutes after midnight); null if it isn't a time. */
export function minutesOf(value: string | null | undefined): number | null {
  const m = HHMM.exec((value ?? "").trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** Today's date in London, YYYY-MM-DD. */
export function londonDate(at: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(at);
}

/** A London wall-clock time on a London date → the exact moment (UTC), with the right GMT/BST offset for that day. */
export function londonToUtc(date: string, minutes: number): Date {
  const [y, m, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  const offsetAt = (t: number) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(t));
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute")) - t;
  };
  // Two passes settle the offset even right next to a clock change.
  let t = guess - offsetAt(guess);
  t = guess - offsetAt(t);
  return new Date(t);
}

function addDays(date: string, days: number): string {
  const t = new Date(`${date}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
}

const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

function isClosed(rules: BookingRules, date: string) {
  return rules.closed.some((c) => c.from && date >= c.from && date <= (c.to || c.from));
}

/** Every appointment the rules allow from now until the end of the booking window, ignoring the calendar. */
export function candidateSlots(rules: BookingRules, now: Date): Slot[] {
  const duration = Math.max(5, Math.round(rules.durationMinutes));
  const gap = Math.max(0, Math.round(rules.gapMinutes));
  const earliest = now.getTime() + Math.max(0, rules.noticeHours) * 3_600_000;
  const today = londonDate(now);
  const lastDay = addDays(today, Math.max(1, rules.weeksAhead) * 7);
  const slots: Slot[] = [];

  for (let date = today; date <= lastDay; date = addDays(date, 1)) {
    if (isClosed(rules, date)) continue;
    for (const rule of rules.days.filter((r) => Number(r.day) === weekday(date))) {
      const start = minutesOf(rule.start);
      const end = minutesOf(rule.end);
      if (start === null || end === null || end <= start) continue;
      const breakStart = minutesOf(rule.breakStart);
      const breakEnd = minutesOf(rule.breakEnd);
      const hasBreak = breakStart !== null && breakEnd !== null && breakEnd > breakStart;

      for (let t = start; t + duration <= end; ) {
        if (hasBreak && t < breakEnd! && t + duration > breakStart!) {
          // Would run into lunch: start again once lunch is over.
          t = breakEnd!;
          continue;
        }
        const from = londonToUtc(date, t);
        const to = londonToUtc(date, t + duration);
        if (from.getTime() >= earliest) slots.push({ start: from.toISOString(), end: to.toISOString(), date, time: hhmm(t) });
        t += duration + gap;
      }
    }
  }
  return slots;
}

/** The slots still free once the calendar's busy periods (plus the gap either side) are taken out. */
export function freeSlots(rules: BookingRules, now: Date, busy: readonly Busy[]): Slot[] {
  const gapMs = Math.max(0, rules.gapMinutes) * 60_000;
  return candidateSlots(rules, now).filter((slot) => {
    const s = Date.parse(slot.start);
    const e = Date.parse(slot.end);
    return !busy.some((b) => s < b.end + gapMs && e + gapMs > b.start);
  });
}

/** The time span the calendar needs checking for: now until the end of the booking window. */
export function bookingWindow(rules: BookingRules, now: Date) {
  const lastDay = addDays(londonDate(now), Math.max(1, rules.weeksAhead) * 7 + 1);
  return { from: now, to: londonToUtc(lastDay, 0) };
}
