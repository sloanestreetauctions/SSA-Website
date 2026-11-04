import "server-only";

/**
 * JEWELLERY APPOINTMENT BOOKING — on/off and settings.
 *
 * Booking appears on the site (menu item, "Book an appointment" buttons and
 * the page itself) only when JEWELLERY_BOOKING=on AND everything it needs is
 * set on the host. Until then the page answers "not found" and nothing links
 * to it. All of these live in the host's settings (Vercel → Settings →
 * Environment Variables), never in the code:
 *
 *   JEWELLERY_BOOKING              on
 *   JEWELLERY_CALENDAR_ID          the "Jewellery appointments" Google calendar (bookings are created here)
 *   JEWELLERY_BUSY_CALENDAR_IDS    Stephen's own Google calendar(s), comma-separated: his busy times are kept free
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL   } the robot Google user the calendars are shared with
 *   GOOGLE_PRIVATE_KEY             }
 *   UPSTASH_REDIS_REST_URL/TOKEN   the hold-and-spam store (added by Vercel's Upstash integration)
 *   RESEND_API_KEY                 } confirmation emails (as for the valuation form)
 *   APPOINTMENTS_FROM              e.g. Sloane Street Auctions <appointments@sloanestreetauctions.com> (falls back to VALUATION_FROM)
 *
 * Wording, hours, appointment length, gaps, notice, holidays and the inbox for
 * booking emails are in the editor: Pages → Jewellery appointments (booking).
 */

export const JEWELLERY_APPOINTMENTS_PATH = "/jewellery/appointments";

const env = (name: string) => process.env[name]?.trim() || "";

export function bookingSettings() {
  return {
    calendarId: env("JEWELLERY_CALENDAR_ID"),
    busyCalendarIds: env("JEWELLERY_BUSY_CALENDAR_IDS")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    from: env("APPOINTMENTS_FROM") || env("VALUATION_FROM"),
  };
}

/** The settings still missing (names only, never values). Empty when booking can work. */
export function missingBookingSettings(): string[] {
  const missing: string[] = [];
  const s = bookingSettings();
  if (!s.calendarId) missing.push("JEWELLERY_CALENDAR_ID");
  if (!env("GOOGLE_SERVICE_ACCOUNT_EMAIL")) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!env("GOOGLE_PRIVATE_KEY")) missing.push("GOOGLE_PRIVATE_KEY");
  if (!(env("UPSTASH_REDIS_REST_URL") || env("KV_REST_API_URL")) || !(env("UPSTASH_REDIS_REST_TOKEN") || env("KV_REST_API_TOKEN")))
    missing.push("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN");
  if (!env("RESEND_API_KEY")) missing.push("RESEND_API_KEY");
  if (!s.from) missing.push("APPOINTMENTS_FROM");
  return missing;
}

/** Whether booking is switched on and fully set up. Read on the server only. */
export function jewelleryBookingLive() {
  return env("JEWELLERY_BOOKING") === "on" && missingBookingSettings().length === 0;
}
