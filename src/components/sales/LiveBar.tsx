import { calendar } from "@/content";
import { getSales } from "@/lib/sales";

/**
 * LIVE NOW — a slim bar across the top of every page, shown only on the day
 * of a sale that has a live bidding link (Auction calendar). It leads straight
 * to the live sale on Easy Live, where bidding happens.
 */
export async function LiveBar() {
  const { liveNow } = await getSales();
  if (liveNow.length === 0) return null;
  const words = calendar.live ?? { barText: "Live now", buttonLabel: "Bid live" };
  return (
    <aside aria-label="Live sale" className="bg-tan text-navy-deep">
      {liveNow.map((sale, i) => (
        <a
          key={`${sale.title}-${i}`}
          href={sale.liveLink ?? undefined}
          className="group shell flex min-h-11 flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center font-sans text-[0.875rem] sm:text-[0.9375rem]"
        >
          <span className="inline-flex items-center gap-2 font-[600] tracking-[0.08em] uppercase">
            <span aria-hidden="true" className="size-2 rounded-full bg-[#b3261e] motion-safe:animate-pulse" />
            {words.barText || "Live now"}
          </span>
          <span className="font-serif text-[1rem] [font-variation-settings:'opsz'_18] sm:text-[1.0625rem]">{sale.title}</span>
          <span className="inline-flex items-center gap-1.5 font-[600] underline decoration-navy-deep/40 underline-offset-4 group-hover:decoration-navy-deep">
            {words.buttonLabel || "Bid live"} <span aria-hidden="true">→</span>
          </span>
        </a>
      ))}
    </aside>
  );
}
