import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { getSales } from "@/lib/sales";
import { auctionsPage as c, isShown } from "@/content";
import { AuctionTabs } from "@/components/sales/AuctionTabs";
import { CoversReel } from "@/components/sales/CoversReel";
import { SaleCard } from "@/components/sales/SaleCard";
import { PastAuctionsBrowser } from "@/components/sales/PastAuctionsBrowser";
import type { Sale } from "@/lib/sales";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { pageTitle, serifText } from "@/components/ui/type";

export const metadata: Metadata = pageMetadata(
  "/auctions/past",
  { title: c.past.title || "Past auctions", description: c.past.text },
  "Catalogues and results from previous sales at Sloane Street Auctions.",
);

/**
 * PAST AUCTIONS — every sale from the Auction calendar whose date has passed,
 * newest first, as the same cards as Upcoming auctions, each linking to its
 * catalogue (and results) on Easy Live.
 * Sales move here automatically the day after they take place.
 */
export default async function PastAuctionsPage() {
  const { past } = await getSales();

  return (
    <>
    <div className="shell pt-8">
      <Breadcrumbs items={[{ label: c.eyebrow || c.title, href: "/auctions" }, { label: c.past.title || "Past auctions" }]} />

      <div className="mt-8">
        {c.eyebrow && <p className="type-eyebrow mb-4 text-ink-soft">{c.eyebrow}</p>}
        <h1 className={pageTitle}>{c.past.title || "Past auctions"}</h1>
      </div>

      <AuctionTabs current="past" />

      {c.past.text && <p className={`mt-8 max-w-[44rem] ${serifText} text-[1.25rem] text-ink-soft`}>{c.past.text}</p>}

      {isShown(c.past) && past.length > 0 ? (
        /* The same cards as Upcoming auctions (no deadlines, viewing times or calendar buttons), 12 to a page, with search. */
        <PastAuctionsBrowser
          items={past.map((sale, i) => ({
            key: `${sale.title}-${sale.date}-${i}`,
            year: (sale.date ?? "").slice(0, 4),
            text: searchText(sale),
          }))}
          cards={past.map((sale, i) => (
            <SaleCard key={`${sale.title}-${sale.date}-${i}`} sale={sale} size="large" priority={i < 2} headingLevel={2} past />
          ))}
        />
      ) : (
        <p className={`mt-8 max-w-[44rem] ${serifText} text-[1.25rem] text-ink-soft`}>
          Past sales appear here automatically after they take place.
        </p>
      )}

    </div>
    {/* The catalogue covers, as on the homepage (switch them off in the editor under Catalogue covers) */}
    <div className="mt-6 pb-10">
      <CoversReel page="past" />
    </div>
    </>
  );
}

/** Everything a visitor might search a sale by: its name, descriptions, month and year. */
function searchText(sale: Sale) {
  const when = sale.date
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${sale.date}T12:00:00Z`))
    : "";
  return [sale.title, sale.description, (sale as { longDescription?: string | null }).longDescription, when]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}
