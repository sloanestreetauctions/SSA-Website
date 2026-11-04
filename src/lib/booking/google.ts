import "server-only";
import { createHash, createSign } from "node:crypto";
import type { Busy } from "./slots";

/**
 * GOOGLE CALENDAR — talks to Google on the server only, as a "service
 * account" (a robot Google user) that the jewellery calendars have been
 * shared with. Its key lives only in the host's settings:
 *
 *   GOOGLE_SERVICE_ACCOUNT_KEY     the whole JSON key file, pasted in (simplest), or instead:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL   e.g. ssa-bookings@your-project.iam.gserviceaccount.com
 *   GOOGLE_PRIVATE_KEY             the "private_key" from the account's JSON key file
 *
 * Permissions used: create its own "Jewellery appointments" calendar and share
 * it with Stephen, add appointments to it, and read free/busy times. Nothing
 * else, and no access to anyone's email.
 * GOOGLE_OAUTH_TOKEN_URL and GOOGLE_CALENDAR_API_URL can point at a test
 * server; they default to Google.
 */

const TOKEN_AUDIENCE = "https://oauth2.googleapis.com/token";
// Google's standard Calendar permission. A service account has no calendar of its
// own and no access to anyone else's: with this it can only manage the calendar it
// creates itself and see what has been shared with it (Stephen's free/busy).
const SCOPES = "https://www.googleapis.com/auth/calendar";
const tokenUrl = () => process.env.GOOGLE_OAUTH_TOKEN_URL || TOKEN_AUDIENCE;
const apiUrl = () => (process.env.GOOGLE_CALENDAR_API_URL || "https://www.googleapis.com/calendar/v3").replace(/\/$/, "");

export class CalendarError extends Error {}

let cached: { token: string; expires: number } | null = null;

/**
 * The service account's email and private key. Easiest: paste the whole JSON key
 * file into GOOGLE_SERVICE_ACCOUNT_KEY. Otherwise GOOGLE_SERVICE_ACCOUNT_EMAIL and
 * GOOGLE_PRIVATE_KEY separately.
 */
export function serviceAccount(): { email?: string; key?: string } {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
  if (json) {
    try {
      const file = JSON.parse(json) as { client_email?: string; private_key?: string };
      return { email: file.client_email?.replace(/[\s\u00a0\u200b-\u200d\ufeff]/g, ""), key: file.private_key };
    } catch {
      throw new CalendarError("GOOGLE_SERVICE_ACCOUNT_KEY isn't a complete key file (paste the whole file, from { to }).");
    }
  }
  // Keys pasted into a settings box often arrive with "\n" instead of real line breaks, or wrapped in quotes.
  const strip = (v?: string) => v?.trim().replace(/^"|"$/g, "");
  // Invisible characters (non-breaking or zero-width spaces) sometimes come along when copying an address.
  const cleanEmail = (v?: string) => strip(v)?.replace(/[\s\u00a0\u200b-\u200d\ufeff]/g, "");
  return { email: cleanEmail(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL), key: strip(process.env.GOOGLE_PRIVATE_KEY)?.replace(/\\n/g, "\n") };
}

const base64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

/** A short-lived access token, signed with the service account's key (reused until shortly before it expires). */
async function accessToken(): Promise<string> {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token;
  const { email, key } = serviceAccount();
  if (!email || !key) throw new CalendarError("Google Calendar is not connected (service account settings missing).");

  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64url(
    JSON.stringify({ iss: email, scope: SCOPES, aud: TOKEN_AUDIENCE, iat: now, exp: now + 3600 }),
  )}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key);
  const res = await fetch(tokenUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${base64url(signature)}` }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    // Google's own reason (e.g. invalid_grant: the key was pasted incompletely). Never includes the key itself.
    const reason = await res
      .json()
      .then((b: { error?: string; error_description?: string }) => [b.error, b.error_description].filter(Boolean).join(": "))
      .catch(() => "");
    throw new CalendarError(`Google sign-in failed (${res.status}${reason ? `: ${reason}` : ""}).`);
  }
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: body.access_token, expires: Date.now() + body.expires_in * 1000 };
  return cached.token;
}

async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(`${apiUrl()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json", ...init.headers },
    signal: AbortSignal.timeout(10_000),
  });
  return res;
}

/** Busy periods across the given calendars (Stephen's own diary and the appointments calendar). */
export async function busyTimes(calendarIds: string[], from: Date, to: Date): Promise<Busy[]> {
  const res = await call("/freeBusy", {
    method: "POST",
    body: JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), timeZone: "Europe/London", items: calendarIds.map((id) => ({ id })) }),
  });
  if (!res.ok) throw new CalendarError(`Google free/busy check failed (${res.status}).`);
  const body = (await res.json()) as { calendars: Record<string, { busy?: { start: string; end: string }[]; errors?: { reason: string }[] }> };
  const busy: Busy[] = [];
  for (const id of calendarIds) {
    const cal = body.calendars?.[id];
    // A calendar that hasn't been shared with the service account comes back with an error, not "free": never treat that as free.
    if (!cal || cal.errors?.length)
      throw new CalendarError(`The calendar "${id}" couldn't be read (${cal?.errors?.[0]?.reason ?? "missing"}). Check it is shared with the service account.`);
    for (const b of cal.busy ?? []) busy.push({ start: Date.parse(b.start), end: Date.parse(b.end) });
  }
  return busy;
}

/**
 * The calendar entry's own ID, made from the calendar and the start time. Google
 * refuses a second entry with the same ID, so even two requests that slip past
 * every other check can never both book the same time.
 */
export function eventIdFor(calendarId: string, start: string) {
  return `ssa${createHash("sha256").update(`${calendarId}|${start}`).digest("hex").slice(0, 40)}`;
}

export type NewEvent = {
  /** The booking reference, kept on the calendar entry so a cancel link only ever matches its own booking. */
  reference?: string;
  clientName?: string;
  clientEmail?: string;
  summary: string;
  description: string;
  location: string;
  start: string;
  end: string;
};

/** Creates the appointment. "taken" means that time was booked in the meantime. */
export async function createAppointment(calendarId: string, event: NewEvent): Promise<"created" | "taken"> {
  const id = eventIdFor(calendarId, event.start);
  const body = {
    id,
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: { dateTime: event.start, timeZone: "Europe/London" },
    end: { dateTime: event.end, timeZone: "Europe/London" },
    status: "confirmed",
    transparency: "opaque",
    extendedProperties: {
      private: {
        bookedOn: "sloanestreetauctions.com",
        ...(event.reference ? { reference: event.reference } : {}),
        ...(event.clientName ? { clientName: event.clientName } : {}),
        ...(event.clientEmail ? { clientEmail: event.clientEmail } : {}),
      },
    },
  };
  const cal = encodeURIComponent(calendarId);
  const res = await call(`/calendars/${cal}/events`, { method: "POST", body: JSON.stringify(body) });
  if (res.ok) return "created";
  if (res.status !== 409) throw new CalendarError(`Google wouldn't create the appointment (${res.status}).`);

  // The ID already exists. If that appointment was cancelled (deleted in the calendar), the time is free again: reuse it.
  const existing = await call(`/calendars/${cal}/events/${id}`);
  if (!existing.ok) return "taken";
  const current = (await existing.json()) as { status?: string };
  if (current.status !== "cancelled") return "taken";
  const revived = await call(`/calendars/${cal}/events/${id}`, { method: "PUT", body: JSON.stringify(body) });
  if (!revived.ok) throw new CalendarError(`Google wouldn't re-open a cancelled time (${revived.status}).`);
  return "created";
}

/** Creates a calendar owned by the service account (the "Jewellery appointments" calendar). Returns its ID. */
export async function createCalendar(summary: string, description: string): Promise<string> {
  const res = await call("/calendars", { method: "POST", body: JSON.stringify({ summary, description, timeZone: "Europe/London" }) });
  if (!res.ok) throw new CalendarError(`Google wouldn't create the appointments calendar (${res.status}).`);
  return ((await res.json()) as { id: string }).id;
}

/**
 * Shares a calendar with someone. Google emails them a link to add it to their
 * own calendar list. `writer` is "Make changes to events", `reader` is "See all
 * event details".
 */
export async function shareCalendar(calendarId: string, email: string, role: "writer" | "reader" = "writer") {
  const res = await call(`/calendars/${encodeURIComponent(calendarId)}/acl?sendNotifications=true`, {
    method: "POST",
    body: JSON.stringify({ role, scope: { type: "user", value: email } }),
  });
  if (res.ok || res.status === 409) return;
  // Google's own explanation (no secrets in it), so the log says exactly what to fix.
  const reason = await res
    .json()
    .then((b: { error?: { message?: string; errors?: { reason?: string }[] } }) => b.error?.errors?.[0]?.reason || b.error?.message || "")
    .catch(() => "");
  throw new CalendarError(`Google wouldn't share the appointments calendar with ${email} as ${role} (${res.status}${reason ? `: ${reason}` : ""}).`);
}

export type StoredAppointment = {
  status: string;
  start: string;
  end: string;
  reference?: string;
  clientName?: string;
  clientEmail?: string;
};

/** The appointment booked at `start`, if there is one (including cancelled ones, so they can be told apart). */
export async function findAppointment(calendarId: string, start: string): Promise<StoredAppointment | null> {
  const res = await call(`/calendars/${encodeURIComponent(calendarId)}/events/${eventIdFor(calendarId, start)}`);
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) throw new CalendarError(`Google couldn't look up the appointment (${res.status}).`);
  const e = (await res.json()) as {
    status?: string;
    start?: { dateTime?: string };
    end?: { dateTime?: string };
    extendedProperties?: { private?: Record<string, string> };
  };
  const p = e.extendedProperties?.private ?? {};
  return {
    status: e.status ?? "confirmed",
    start: e.start?.dateTime ? new Date(e.start.dateTime).toISOString() : start,
    end: e.end?.dateTime ? new Date(e.end.dateTime).toISOString() : start,
    reference: p.reference,
    clientName: p.clientName,
    clientEmail: p.clientEmail,
  };
}

/** Removes the appointment at `start` from the calendar (its time becomes free again). */
export async function removeAppointment(calendarId: string, start: string) {
  const res = await call(`/calendars/${encodeURIComponent(calendarId)}/events/${eventIdFor(calendarId, start)}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404 && res.status !== 410) throw new CalendarError(`Google wouldn't remove the appointment (${res.status}).`);
}

export type CalendarEntry = {
  summary: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  /** Booked on the website (as opposed to added by hand in Google Calendar). */
  fromWebsite: boolean;
  reference?: string;
};

/** Everything in a calendar between two times, in time order (cancelled entries left out). */
export async function listEntries(calendarId: string, from: Date, to: Date): Promise<CalendarEntry[]> {
  const q = new URLSearchParams({ timeMin: from.toISOString(), timeMax: to.toISOString(), singleEvents: "true", orderBy: "startTime", maxResults: "250" });
  const res = await call(`/calendars/${encodeURIComponent(calendarId)}/events?${q}`);
  if (!res.ok) throw new CalendarError(`Google couldn't list the appointments (${res.status}).`);
  const body = (await res.json()) as {
    items?: {
      status?: string;
      summary?: string;
      description?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      extendedProperties?: { private?: Record<string, string> };
    }[];
  };
  return (body.items ?? [])
    .filter((e) => e.status !== "cancelled")
    .map((e) => {
      const p = e.extendedProperties?.private ?? {};
      const allDay = !e.start?.dateTime;
      return {
        summary: e.summary ?? "",
        description: e.description ?? "",
        start: e.start?.dateTime ? new Date(e.start.dateTime).toISOString() : `${e.start?.date}T00:00:00.000Z`,
        end: e.end?.dateTime ? new Date(e.end.dateTime).toISOString() : `${e.end?.date}T00:00:00.000Z`,
        allDay,
        fromWebsite: p.bookedOn === "sloanestreetauctions.com",
        reference: p.reference,
      };
    });
}
