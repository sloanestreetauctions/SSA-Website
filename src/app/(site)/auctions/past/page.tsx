import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { getSales } from "@/lib/sales";
import { auctionsPage as c, isShown } from "@/content";
import { AuctionTabs } from "@/components/sales/AuctionTabs";
import { CoversReel } from "@/components/sales/CoversReel";
import { SaleCard } from "@/components/sales/SaleCard";
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
        /* The same cards as Upcoming auctions, without deadlines, viewing times or calendar buttons. */
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {past.map((sale, i) => (
            <li key={`${sale.title}-${sale.date}-${i}`}>
              <SaleCard sale={sale} size="large" priority={i < 2} headingLevel={2} past />
            </li>
          ))}
        </ul>
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
