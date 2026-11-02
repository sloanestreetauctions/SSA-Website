import { calendar } from "@/content";
import { icsFile, saleEventId } from "@/lib/calendar-event";

/** /calendar/<sale>.ics — the sale as a calendar file (Apple Calendar, Outlook, phones). */
export async function GET(_request: Request, ctx: RouteContext<"/calendar/[id]">) {
  const { id } = await ctx.params;
  const sale = calendar.sales.find((s) => `${saleEventId(s)}.ics` === id);
  if (!sale) return new Response("Not found", { status: 404 });
  return new Response(icsFile(sale), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${saleEventId(sale)}.ics"`,
    },
  });
}
