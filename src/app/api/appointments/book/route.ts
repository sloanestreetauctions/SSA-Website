import { notFound } from "next/navigation";
import { settings } from "@/content";
import { jewelleryBookingLive } from "@/lib/booking/status";
import { book } from "@/lib/booking/service";
import { linkOrigin } from "@/lib/booking/links";
import { withinLimit } from "@/lib/booking/store";

/**
 * POST /api/appointments/book — books a jewellery appointment. Everything is
 * checked here on the server; the page's own checks are only a convenience.
 * Spam protection: a hidden field people never see, a minimum time to fill in
 * the form, and a limit on attempts per visitor and per email address.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  if (!jewelleryBookingLive()) notFound();
  const sorry = `Sorry, we couldn’t book that just now. Please call us on ${settings.mainPhone} or email ${settings.generalEmail}.`;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, message: "We couldn’t read that. Please try again." }, { status: 400 });
  }

  // Spam traps: bots fill in the hidden field, or "fill in" the form in an instant. They're told it worked and nothing happens.
  if (text(body.website, 200) !== "" || Number(body.elapsed) < 3000) return Response.json({ ok: true, when: "", location: "", reference: "" });

  const input = {
    start: text(body.start, 40),
    name: text(body.name, 120),
    email: text(body.email, 254),
    phone: text(body.phone, 40),
    details: text(body.details, 2000),
  };
  const errors: Record<string, string> = {};
  if (input.name.length < 2) errors.name = "Please tell us your name";
  if (!EMAIL.test(input.email)) errors.email = "Please enter a valid email address, like name@example.com";
  if ((input.phone.match(/\d/g) ?? []).length < 7) errors.phone = "Please enter a telephone number we can reach you on";
  if (body.consent !== true) errors.consent = "Please tick to agree, so we can arrange your appointment";
  if (Number.isNaN(Date.parse(input.start))) errors.start = "Please choose a time";
  if (Object.keys(errors).length) return Response.json({ ok: false, errors }, { status: 422 });

  try {
    const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    const allowed = (await withinLimit("book-ip", ip, 6, 3600)) && (await withinLimit("book-email", input.email.toLowerCase(), 3, 86_400));
    if (!allowed) {
      return Response.json(
        { ok: false, message: `You’ve tried to book several times. Please call us on ${settings.mainPhone} and we’ll help.` },
        { status: 429 },
      );
    }
    const result = await book(input, new Date(), linkOrigin(request));
    if (!result.ok) {
      return Response.json(
        { ok: false, taken: true, message: "Sorry, that time has just been booked by someone else. Please choose another." },
        { status: 409 },
      );
    }
    return Response.json(result);
  } catch (error) {
    console.error("Appointment couldn't be booked:", error instanceof Error ? error.message : error);
    return Response.json({ ok: false, message: sorry }, { status: 502 });
  }
}
