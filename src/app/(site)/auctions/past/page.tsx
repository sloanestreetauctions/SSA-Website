import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { formatSaleDate } from "@/lib/format";
import { getSales } from "@/lib/sales";
import { auctionsPage as c, calendar, isShown } from "@/content";
import { AuctionTabs } from "@/components/sales/AuctionTabs";
import { CoversReel } from "@/components/sales/CoversReel";
import { Arrow } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { pageTitle, serifText } from "@/components/ui/type";

export const metadata: Metadata = pageMetadata(
  "/auctions/past",
  { title: c.past.title || "Past auctions", description: c.past.text },
  "Catalogues and results from previous sales at Sloane Street Auctions.",
);

/**
 * PAST AUCTIONS — every sale from the Auction calendar whose date has passed,
 * newest first, each linking to its catalogue (and results) on Easy Live.
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
        <ul className="mt-6 border-t border-line">
          {past.map((sale, i) => {
            const row = (
              <>
                <span className="text-[1.0625rem] text-ink-soft">{sale.date && formatSaleDate(sale.date)}</span>
                <span className="text-[1.375rem]">{sale.title}</span>
                {sale.catalogueLink && (
                  <span className="inline-flex items-center gap-3 text-[1.0625rem] text-ink-soft group-hover:text-ink">
                    View catalogue <Arrow />
                  </span>
                )}
              </>
            );
            const cls = `group grid gap-1 py-5 ${serifText} sm:grid-cols-[16rem_1fr_auto] sm:items-baseline sm:gap-8`;
            return (
              <li key={`${sale.title}-${sale.date}-${i}`} className="border-b border-line">
                {sale.catalogueLink ? (
                  <a href={sale.catalogueLink} className={cls}>
                    {row}
                  </a>
                ) : (
                  <div className={cls}>{row}</div>
                )}
                {sale.catalogueFile && (calendar.downloadLabel ?? "Download the catalogue (PDF)") && (
                  /* The catalogue PDF uploaded in the editor */
                  <a
                    href={sale.catalogueFile}
                    className="-mt-2 mb-5 inline-flex min-h-11 items-center gap-2.5 font-sans text-[0.9375rem] text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink sm:ml-[18rem]"
                  >
                    {calendar.downloadLabel ?? "Download the catalogue (PDF)"}
                  </a>
                )}
              </li>
            );
          })}
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
