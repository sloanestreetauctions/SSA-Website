import { notFound } from "next/navigation";
import { connection } from "next/server";
import { settings } from "@/content";
import { jewelleryBookingLive } from "@/lib/booking/status";
import { cancel, lookUpForCancel } from "@/lib/booking/service";
import { withinLimit } from "@/lib/booking/store";

/**
 * /api/appointments/cancel — the cancel links in the booking emails.
 *  GET  ?ref&start&t[&by=house]  checks the link and says which appointment it is
 *  POST {ref, start, t, by, note} cancels it: removed from the calendar, both sides emailed
 * Only a link signed by the website works, and only for its own booking.
 */
const s = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const kindOf = (by: unknown) => (by === "house" ? "house" : "client");

const messages = {
  invalid: "This cancel link isn’t complete. Please use the link in your email exactly as it is.",
  gone: "This appointment has already been cancelled or changed.",
  past: "This appointment has already taken place, so it can’t be cancelled online.",
};

export async function GET(request: Request) {
  await connection();
  if (!jewelleryBookingLive()) notFound();
  const q = new URL(request.url).searchParams;
  try {
    const found = await lookUpForCancel(kindOf(q.get("by")), s(q.get("ref")), s(q.get("start")), s(q.get("t")));
    if (!found.ok) return Response.json({ ok: false, reason: found.reason, message: messages[found.reason] }, { status: 404 });
    return Response.json(found);
  } catch (error) {
    console.error("Cancel link couldn't be checked:", error instanceof Error ? error.message : error);
    return Response.json({ ok: false, message: `Sorry, we can’t look up the appointment just now. Please call us on ${settings.mainPhone}.` }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!jewelleryBookingLive()) notFound();
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, message: "We couldn’t read that. Please try again." }, { status: 400 });
  }
  try {
    const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    if (!(await withinLimit("cancel-ip", ip, 20, 3600)))
      return Response.json({ ok: false, message: `Please call us on ${settings.mainPhone} and we’ll help.` }, { status: 429 });
    const kind = kindOf(body.by);
    const result = await cancel(kind, s(body.ref), s(body.start), s(body.t), kind === "house" ? s(body.note, 1000) : "", new Date(), new URL(request.url).origin);
    if (!result.ok) return Response.json({ ok: false, reason: result.reason, message: messages[result.reason] }, { status: 404 });
    return Response.json(result);
  } catch (error) {
    console.error("Appointment couldn't be cancelled:", error instanceof Error ? error.message : error);
    return Response.json(
      { ok: false, message: `Sorry, we couldn’t cancel that just now. Please call us on ${settings.mainPhone} or email ${settings.generalEmail}.` },
      { status: 502 },
    );
  }
}
