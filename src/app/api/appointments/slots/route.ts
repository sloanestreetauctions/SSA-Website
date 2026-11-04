import { notFound } from "next/navigation";
import { connection } from "next/server";
import { jewelleryBookingLive } from "@/lib/booking/status";
import { availableSlots } from "@/lib/booking/service";

/**
 * GET /api/appointments/slots — the free jewellery valuations, grouped by
 * day, read live from Google Calendar. Only times are returned; nothing about
 * anyone's other appointments.
 */
export async function GET() {
  // Always worked out when asked, never in advance at build time.
  await connection();
  if (!jewelleryBookingLive()) notFound();
  try {
    const slots = await availableSlots();
    const days = new Map<string, { start: string; time: string }[]>();
    for (const s of slots) days.set(s.date, [...(days.get(s.date) ?? []), { start: s.start, time: s.time }]);
    return Response.json(
      { days: [...days].map(([date, times]) => ({ date, times })) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Appointment times couldn't be loaded:", error instanceof Error ? error.message : error);
    return Response.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
