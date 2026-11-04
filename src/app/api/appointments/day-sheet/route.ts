import { connection } from "next/server";
import { jewelleryBookingLive } from "@/lib/booking/status";
import { sendDaySheet } from "@/lib/booking/day-sheet";

/**
 * GET /api/appointments/day-sheet — run by Vercel's schedule (vercel.json) on
 * Tuesdays, to email Stephen Wednesday's appointments as a PDF at 6pm London
 * time. Two schedules (17:00 and 18:00 UTC) cover summer and winter time; only
 * the one that lands in London's 6pm hour sends, and only once.
 *
 * Only Vercel's scheduler can run it: it sends the CRON_SECRET setting with each
 * run. ?date=YYYY-MM-DD (with the secret) sends that day's sheet again, for testing.
 */
export async function GET(request: Request) {
  await connection();
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error("Day sheet not sent: add a CRON_SECRET setting in Vercel (any long random text) and redeploy.");
    return Response.json({ ok: false }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ ok: false }, { status: 401 });
  if (!jewelleryBookingLive()) return Response.json({ ok: true, skipped: "Booking is switched off." });

  const now = new Date();
  const date = new URL(request.url).searchParams.get("date");
  try {
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) return Response.json({ ok: true, ...(await sendDaySheet(now, date, true)) });
    const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "numeric", hourCycle: "h23" }).format(now));
    if (hour !== 18) return Response.json({ ok: true, skipped: `Not 6pm in London (it's ${hour}:00 there); the other schedule sends it.` });
    const result = await sendDaySheet(now);
    console.log(result.sent ? `Day sheet for ${result.date} sent (${result.count} appointments).` : `Day sheet for ${result.date}: ${result.skipped}`);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Day sheet not sent:", error instanceof Error ? error.message : error);
    return Response.json({ ok: false }, { status: 502 });
  }
}
