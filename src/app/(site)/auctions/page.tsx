import type { Metadata } from "next";
import Link from "next/link";
import { formatSaleDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { getSales } from "@/lib/sales";
import { auctionsPage as c, easyLive, hasPhoto, isShown } from "@/content";
import { HighlightsReel } from "@/components/sales/HighlightsReel";
import { SaleCard } from "@/components/sales/SaleCard";
import { ObjectPhoto } from "@/components/ui/PhotoToCome";
import { Arrow } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { pageTitle, serifText } from "@/components/ui/type";

export const metadata: Metadata = { title: c.seo.title, description: c.seo.description };

/**
 * AUCTIONS — the sales listed in the editor's Auction calendar. Each links to
 * its catalogue on the Easy Live auction site, where browsing, registration
 * and bidding happen. Sales move from upcoming to past by date, automatically.
 */
export default async function AuctionsPage() {
  const { upcoming, past } = await getSales();

  return (
    <>
      <div className="shell pt-8">
        <Breadcrumbs items={[{ label: c.eyebrow || c.title }]} />

        {/* ======================================================= HEADING */}
        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            {c.eyebrow && <p className="type-eyebrow mb-4 text-ink-soft">{c.eyebrow}</p>}
            <h1 className={pageTitle}>{c.title}</h1>
            {c.intro && <p className={`mt-4 ${serifText} text-[1.3125rem] text-ink-soft`}>{c.intro}</p>}
          </div>
          {easyLive.site && c.catalogueLinkLabel && (
            <a
              href={easyLive.site}
              className={`group inline-flex items-center gap-3 ${serifText} border-b border-ink/40 pb-0.5 text-[1.1875rem] hover:border-ink`}
            >
              {c.catalogueLinkLabel} <Arrow />
            </a>
          )}
        </div>

        {/* ============================================= FORTHCOMING SALES */}
        {upcoming.length ? (
          <ul className="mt-10 grid gap-6 md:grid-cols-2">
            {upcoming.map((sale, i) => (
              <li key={`${sale.title}-${sale.date}-${i}`}>
                <SaleCard sale={sale} size="large" priority={i < 2} />
              </li>
            ))}
          </ul>
        ) : (
          c.noUpcoming && <p className={`mt-10 max-w-[44rem] ${serifText} text-[1.25rem] text-ink-soft`}>{c.noUpcoming}</p>
        )}
      </div>

      {/* ===================================================== SALE HIGHLIGHTS */}
      <div className="mt-6">
        <HighlightsReel page="auctions" />
      </div>

      {/* ===================================================== PAST SALES */}
      {isShown(c.past) && past.length > 0 && (
        <section id="past" aria-label={c.past.title || "Past auctions"} className="shell mt-20 scroll-mt-8">
          {c.past.title && (
            <h2 className="font-serif text-[2.25rem] leading-tight font-[380] [font-variation-settings:'opsz'_60] md:text-[2.75rem]">
              {c.past.title}
            </h2>
          )}
          {c.past.text && <p className={`mt-2 ${serifText} text-[1.125rem] text-ink-soft`}>{c.past.text}</p>}
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
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ===================================================== SELLING PANEL */}
      {isShown(c.selling) && (
        <section aria-label={c.selling.title || "Selling"} className="shell py-20 md:py-24">
          <div
            className={`grid items-center gap-8 border border-line bg-paper p-6 md:gap-12 md:p-8 ${
              hasPhoto(c.selling.photo) ? "md:grid-cols-[minmax(0,22rem)_1fr]" : ""
            }`}
          >
            <ObjectPhoto photo={c.selling.photo} sizes="(min-width: 768px) 22rem, 100vw" frameClassName="aspect-[1.28]" />
            <div>
              {c.selling.title && (
                <h2 className="font-serif text-[2rem] leading-tight font-[380] [font-variation-settings:'opsz'_48] md:text-[2.5rem]">
                  {c.selling.title}
                </h2>
              )}
              {c.selling.text && <p className={`mt-3 ${serifText} text-[1.25rem] text-ink-soft`}>{c.selling.text}</p>}
              {c.selling.buttonLabel && (
                <Link
                  href={routes.valuation}
                  className={`group mt-7 inline-flex min-h-16 items-center gap-4 bg-navy-deep px-8 ${serifText} text-[1.1875rem] text-ivory hover:bg-navy-soft`}
                >
                  {c.selling.buttonLabel} <Arrow />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
