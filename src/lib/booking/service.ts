import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { appointmentsPage, jewelleryPage, tokens } from "@/content";
import { busyTimes, CalendarError, createAppointment, createCalendar, findAppointment, removeAppointment, shareCalendar } from "./google";
import { cancelLink, verify, type LinkKind } from "./links";
import { sendBookingEmails, sendCancellationEmails } from "./mail";
import { bookingSettings } from "./status";
import { bookingWindow, freeSlots, type BookingRules, type Slot } from "./slots";
import { hold, load, save } from "./store";

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

const CALENDAR_KEY = "booking:appointments-calendar-id";

/**
 * The calendar appointments are booked into. Either the one named in the
 * settings, or the website's own "Jewellery appointments" calendar: created the
 * first time it's needed, shared with Stephen ("Make changes to events"; Google
 * emails him a link to add it), and remembered from then on.
 */
export async function appointmentsCalendarId(): Promise<string> {
  const s = bookingSettings();
  if (s.calendarId) return s.calendarId;
  const saved = await load(CALENDAR_KEY);
  if (saved) return ensureShared(saved);

  const release = await hold("booking:creating-calendar", 60);
  if (!release) {
    // Another request is creating it right now: wait for it.
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const id = await load(CALENDAR_KEY);
      if (id) return id;
    }
    throw new CalendarError("The appointments calendar is still being set up. Please try again in a moment.");
  }
  try {
    const again = await load(CALENDAR_KEY);
    if (again) return ensureShared(again);
    const id = await createCalendar(
      "Jewellery appointments",
      "Appointments booked on sloanestreetauctions.com. Delete an appointment here to free its time again.",
    );
    // Remembered straight away, so a hiccup while sharing never leads to a second calendar.
    await save(CALENDAR_KEY, id);
    // The calendar's ID isn't personal: logged so it can be set as JEWELLERY_CALENDAR_ID if ever needed.
    console.log(`Created the Jewellery appointments calendar: ${id}`);
    return ensureShared(id);
  } finally {
    await release();
  }
}

/**
 * Shares the website's calendar with everyone in JEWELLERY_CALENDAR_SHARE_WITH
 * not yet shared with (also picks up people added later): "Make changes to
 * events" if Google allows, otherwise "See all event details". A sharing problem
 * never stops bookings (every booking is also emailed to the house): it is
 * logged, and tried again next time.
 */
async function ensureShared(calendarId: string) {
  for (const email of bookingSettings().shareWith) {
    const flag = `booking:shared:${createHash("sha256").update(`${calendarId}|${email.toLowerCase()}`).digest("hex").slice(0, 32)}`;
    if (await load(flag)) continue;
    try {
      await shareCalendar(calendarId, email, "writer");
    } catch (writerError) {
      console.error(writerError instanceof Error ? writerError.message : writerError);
      try {
        await shareCalendar(calendarId, email, "reader");
        console.log(`Shared the appointments calendar with ${email} as "See all event details" instead.`);
      } catch (readerError) {
        console.error(readerError instanceof Error ? readerError.message : readerError);
        continue;
      }
    }
    await save(flag, "1");
  }
  return calendarId;
}

/** Every calendar whose busy times block a slot: the appointments calendar itself, and Stephen's own diary. */
async function calendarsToCheck() {
  const s = bookingSettings();
  return [...new Set([await appointmentsCalendarId(), ...s.busyCalendarIds])];
}

/** The free appointments right now, straight from Google (never cached, so nothing already taken is offered). */
export async function availableSlots(now = new Date()): Promise<Slot[]> {
  const rules = bookingRules();
  const { from, to } = bookingWindow(rules, now);
  const busy = await busyTimes(await calendarsToCheck(), from, to);
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
export async function book(input: BookingInput, now = new Date(), origin = "https://sloanestreetauctions.com"): Promise<BookingResult> {
  const { from } = bookingSettings();
  const calendarId = await appointmentsCalendarId();
  const release = await hold(`appointment:${calendarId}:${input.start}`);
  if (!release) return { ok: false, reason: "busy" };
  try {
    const slot = (await availableSlots(now)).find((s) => s.start === input.start);
    if (!slot) return { ok: false, reason: "taken" };

    const specialist = jewelleryPage.specialist?.name || "our jewellery specialist";
    const location = appointmentsPage.location || "";
    const reference = `JA-${slot.date.replace(/-/g, "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const created = await createAppointment(calendarId, {
      reference,
      clientName: input.name,
      clientEmail: input.email,
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
      calendarId,
      clientCancelLink: cancelLink(origin, "client", reference, slot.start),
      houseCancelLink: cancelLink(origin, "house", reference, slot.start),
    });
    // The booking stands even if an email fails; the house is told in the logs (no personal details) and the visitor on screen.
    if (!emailed.client || !emailed.house) console.error(`Appointment ${reference}: email not sent (client ${emailed.client}, house ${emailed.house}).`);
    return { ok: true, when, location, reference, emailed: emailed.client };
  } finally {
    await release();
  }
}

export type CancelLookup =
  | { ok: true; when: string; reference: string; clientName?: string }
  | { ok: false; reason: "invalid" | "gone" | "past" };

/**
 * Checks a cancel link: genuine (signed by us), for a booking that is still in
 * the calendar under that same reference (so an old link can never cancel a
 * new booking at the same time), and not already over.
 */
export async function lookUpForCancel(kind: LinkKind, reference: string, start: string, token: string, now = new Date()): Promise<CancelLookup> {
  if (!reference || !start || Number.isNaN(Date.parse(start)) || !verify(kind, reference, start, token)) return { ok: false, reason: "invalid" };
  const calendarId = await appointmentsCalendarId();
  const found = await findAppointment(calendarId, start);
  if (!found || found.status === "cancelled" || found.reference !== reference) return { ok: false, reason: "gone" };
  if (Date.parse(start) <= now.getTime()) return { ok: false, reason: "past" };
  return { ok: true, when: describeWhen(start), reference, clientName: kind === "house" ? found.clientName : undefined };
}

export type CancelResult = { ok: true; when: string; emailed: boolean } | { ok: false; reason: "invalid" | "gone" | "past" };

/**
 * Cancels from a link: removes the appointment from the calendar (its time is
 * offered again straight away) and emails both the client and the house.
 * A "house" cancel can carry a short note for the client.
 */
export async function cancel(kind: LinkKind, reference: string, start: string, token: string, note = "", now = new Date(), origin = "https://sloanestreetauctions.com"): Promise<CancelResult> {
  const check = await lookUpForCancel(kind, reference, start, token, now);
  if (!check.ok) return check;
  const calendarId = await appointmentsCalendarId();
  const found = await findAppointment(calendarId, start);
  if (!found || found.status === "cancelled" || found.reference !== reference) return { ok: false, reason: "gone" };
  await removeAppointment(calendarId, start);

  const sent = await sendCancellationEmails({
    by: kind,
    reference,
    when: check.when,
    name: found.clientName || "",
    email: found.clientEmail || "",
    note: kind === "house" ? note.trim().slice(0, 1000) : "",
    specialist: jewelleryPage.specialist?.name || "our jewellery specialist",
    notifyEmail: appointmentsPage.notifyEmail,
    from: bookingSettings().from,
    rebookLink: `${origin}/jewellery/appointments`,
  });
  if (!sent.client || !sent.house) console.error(`Cancellation ${reference}: email not sent (client ${sent.client}, house ${sent.house}).`);
  return { ok: true, when: check.when, emailed: sent.client };
}

export { CalendarError };
