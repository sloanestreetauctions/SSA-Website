import "server-only";
import { createHash, createSign } from "node:crypto";
import type { Busy } from "./slots";

/**
 * GOOGLE CALENDAR — talks to Google on the server only, as a "service
 * account" (a robot Google user) that the jewellery calendars have been
 * shared with. Its key lives only in the host's settings:
 *
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
const SCOPES = [
  // Create the "Jewellery appointments" calendar and manage only calendars it created itself.
  "https://www.googleapis.com/auth/calendar.app.created",
  // Share that calendar with the house (info@).
  "https://www.googleapis.com/auth/calendar.acls",
  // Add appointments to a calendar shared with it (if one is set instead).
  "https://www.googleapis.com/auth/calendar.events",
  // See when Stephen is busy (only free/busy, never what the appointments are).
  "https://www.googleapis.com/auth/calendar.freebusy",
].join(" ");
const tokenUrl = () => process.env.GOOGLE_OAUTH_TOKEN_URL || TOKEN_AUDIENCE;
const apiUrl = () => (process.env.GOOGLE_CALENDAR_API_URL || "https://www.googleapis.com/calendar/v3").replace(/\/$/, "");

export class CalendarError extends Error {}

let cached: { token: string; expires: number } | null = null;

const base64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

/** A short-lived access token, signed with the service account's key (reused until shortly before it expires). */
async function accessToken(): Promise<string> {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Keys pasted into a settings box often arrive with "\n" instead of real line breaks.
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
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
  if (!res.ok) throw new CalendarError(`Google sign-in failed (${res.status}).`);
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
    extendedProperties: { private: { bookedOn: "sloanestreetauctions.com" } },
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
