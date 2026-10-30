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
  /** True while the sale's consignment deadline is today or later. */
  consigning: boolean;
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
    .map((s) => ({ ...s, consigning: Boolean(s.consignmentDeadline && s.consignmentDeadline >= today) }));
  return {
    upcoming: sorted.filter((s) => (s.date ?? "") >= today),
    past: sorted.filter((s) => (s.date ?? "") < today).reverse(),
    /** The upcoming sale whose consignment deadline comes soonest (still open), if any. */
    nextConsignment:
      sorted
        .filter((s) => s.consigning && (s.date ?? "") >= today)
        .sort((a, b) => (a.consignmentDeadline ?? "").localeCompare(b.consignmentDeadline ?? ""))[0] ?? null,
  };
}
