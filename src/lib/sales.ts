import { cacheLife } from "next/cache";
import { calendar } from "@/content";

/**
 * The sales listed in the editor's Auction calendar, split into upcoming and
 * past by date. A sale counts as upcoming on its own day, and moves to Past
 * auctions the day after. The split is cached against the sales themselves, so
 * an edit in the calendar shows immediately, and re-checked every hour, so
 * nothing needs republishing when a sale or deadline date passes.
 */
export type Sale = (typeof calendar.sales)[number] & {
  /** "timed": a timed online sale held on The Saleroom. Anything else: a live auction on Easy Live. */
  kind?: string | null;
  closingDate?: string | null;
  /** True while the sale's consignment deadline is today or later. */
  consigning: boolean;
  /** True on the day of the sale itself (London time). */
  live: boolean;
};

/** Today's date in London as YYYY-MM-DD (the same form the editor saves dates in). */
function todayInLondon() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
}

type CalendarSale = (typeof calendar.sales)[number];

/** The sales as entered in the editor; passed in so any edit gives a fresh result straight away. */
export async function getSales() {
  return splitSales(calendar.sales);
}

async function splitSales(sales: readonly CalendarSale[]) {
  "use cache";
  cacheLife("hours");
  const today = todayInLondon();
  const sorted: Sale[] = [...sales]
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
    .map((s) => ({ ...s, consigning: Boolean(s.consignmentDeadline && s.consignmentDeadline >= today), live: s.date === today }));
  /** A timed online sale stays upcoming until bidding closes; a live auction until its day has passed. */
  const lastDay = (s: Sale) => (s.kind === "timed" && s.closingDate ? s.closingDate : (s.date ?? ""));
  return {
    upcoming: sorted.filter((s) => lastDay(s) >= today),
    /** Sales happening today that have a live bidding link. */
    liveNow: sorted.filter((s) => s.live && s.liveLink),
    past: sorted.filter((s) => lastDay(s) < today).reverse(),
    /** The upcoming sale whose consignment deadline comes soonest (still open), if any. */
    nextConsignment:
      sorted
        .filter((s) => s.consigning && (s.date ?? "") >= today)
        .sort((a, b) => (a.consignmentDeadline ?? "").localeCompare(b.consignmentDeadline ?? ""))[0] ?? null,
  };
}
