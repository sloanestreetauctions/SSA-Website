import "server-only";
import { randomBytes } from "node:crypto";
import { appointmentsPage, jewelleryPage, tokens } from "@/content";
import { busyTimes, CalendarError, createAppointment } from "./google";
import { sendBookingEmails } from "./mail";
import { bookingSettings } from "./status";
import { bookingWindow, freeSlots, type BookingRules, type Slot } from "./slots";
import { hold } from "./store";

const TZ = "Europe/London";

/** The rules from the editor (Pages → Jewellery appointments). */
export function bookingRules(): BookingRules {
  const r = appointmentsPage.rules;
  return {
    durationMinutes: r.durationMinutes ?? 30,
    gapMinutes: r.gapMinutes ?? 0,
    noticeHours: r.noticeHours ?? 24,
    weeksAhead: r.weeksAhead ?? 8,
    days: r.days ?? [],
    closed: r.closed ?? [],
  };
}

/** Every calendar whose busy times block a slot: the appointments calendar itself, and Stephen's own diary. */
function calendarsToCheck() {
  const s = bookingSettings();
  return [...new Set([s.calendarId, ...s.busyCalendarIds])];
}

/** The free appointments right now, straight from Google (never cached, so nothing already taken is offered). */
export async function availableSlots(now = new Date()): Promise<Slot[]> {
  const rules = bookingRules();
  const { from, to } = bookingWindow(rules, now);
  const busy = await busyTimes(calendarsToCheck(), from, to);
  return freeSlots(rules, now, busy);
}

/** "Wednesday 11 November 2026 at 10:05am" */
export function describeWhen(start: string) {
  const d = new Date(start);
  // Written the British way, without a comma: "Wednesday 11 November 2026".
  const part = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...options }).format(d);
  const day = `${part({ weekday: "long" })} ${part({ day: "numeric", month: "long", year: "numeric" })}`;
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).format(d).replace(" ", "");
  return `${day} at ${time}`;
}

/** Editor wording as plain text: {phone} and {email} filled in, [links](…) reduced to their words. */
export function plainText(text: string) {
  return text.replace(/\{(\w+)\}/g, (m, key: string) => tokens[key]?.text ?? m).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export type BookingInput = { start: string; name: string; email: string; phone: string; details: string };

export type BookingResult =
  | { ok: true; when: string; location: string; reference: string; emailed: boolean }
  | { ok: false; reason: "taken" | "busy" };

/**
 * Books an appointment, in this order:
 *  1. hold the time for two minutes, so a second person pressing "Confirm" at
 *     the same moment is turned away;
 *  2. ask Google again whether the time is still free (the calendar may have
 *     changed since the page was opened);
 *  3. create the calendar entry, with an ID that Google won't accept twice;
 *  4. send the two emails.
 */
export async function book(input: BookingInput, now = new Date()): Promise<BookingResult> {
  const { calendarId, from } = bookingSettings();
  const release = await hold(`appointment:${calendarId}:${input.start}`);
  if (!release) return { ok: false, reason: "busy" };
  try {
    const slot = (await availableSlots(now)).find((s) => s.start === input.start);
    if (!slot) return { ok: false, reason: "taken" };

    const specialist = jewelleryPage.specialist?.name || "our jewellery specialist";
    const location = appointmentsPage.location || "";
    const reference = `JA-${slot.date.replace(/-/g, "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const created = await createAppointment(calendarId, {
      summary: `Jewellery appointment: ${input.name}`,
      description: [
        `Booked on the website. Reference ${reference}.`,
        "",
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        `Telephone: ${input.phone}`,
        "",
        "About their jewellery:",
        input.details || "(nothing added)",
      ].join("\n"),
      location: location.replace(/\n/g, ", "),
      start: slot.start,
      end: slot.end,
    });
    if (created === "taken") return { ok: false, reason: "taken" };

    const when = describeWhen(slot.start);
    const emailed = await sendBookingEmails({
      reference,
      ...input,
      start: slot.start,
      end: slot.end,
      when,
      location,
      specialist,
      notifyEmail: appointmentsPage.notifyEmail,
      from,
      closingNote: plainText(appointmentsPage.page.confirmationText ?? ""),
    });
    // The booking stands even if an email fails; the house is told in the logs (no personal details) and the visitor on screen.
    if (!emailed.client || !emailed.house) console.error(`Appointment ${reference}: email not sent (client ${emailed.client}, house ${emailed.house}).`);
    return { ok: true, when, location, reference, emailed: emailed.client };
  } finally {
    await release();
  }
}

export { CalendarError };
