import { Arrow } from "@/components/ui/Button";
import { ObjectPhoto } from "@/components/ui/PhotoToCome";
import { calendar } from "@/content";
import { formatSaleDate } from "@/lib/format";
import type { Sale } from "@/lib/sales";
import { Reel } from "./Reel";

/**
 * FEATURED LOTS — a few of the best pieces from each upcoming sale, as entered
 * in the editor (Auction calendar → each sale → Featured lots). Each lot links
 * to its page on the Easy Live auction site, where bidding happens. Shown only
 * for upcoming sales that have lots added, and only while switched on.
 */
export function FeaturedLots({ sales, page }: { sales: readonly Sale[]; page: "home" | "auctions" }) {
  const f = calendar.featured;
  if (f?.show === false) return null;
  if (page === "auctions" && f?.showOnAuctionsPage === false) return null;
  const withLots = sales.filter((s) => (s.featuredLots ?? []).length > 0);
  if (withLots.length === 0) return null;

  return (
    <>
      {withLots.map((sale, si) => (
        <section key={`${sale.title}-${sale.date}-${si}`} className="shell py-12 md:py-16">
          <Reel
            label={`Featured lots: ${sale.title}`}
            heading={
              <>
                {f?.eyebrow && <p className="type-eyebrow mb-4 text-ink-soft">{f.eyebrow}</p>}
                <h2 className="max-w-[48rem] font-serif text-[2rem] leading-tight font-[380] [font-variation-settings:'opsz'_60] md:text-[2.75rem]">
                  {sale.catalogueLink ? (
                    <a href={sale.catalogueLink} className="hover:text-navy">
                      {sale.title}
                    </a>
                  ) : (
                    sale.title
                  )}
                </h2>
                {sale.date && (
                  <p className="mt-2 font-sans text-[0.875rem] tracking-[0.12em] text-ink-soft uppercase tabular-nums">
                    {formatSaleDate(sale.date)}
                    {sale.time && <> · {sale.time}</>}
                  </p>
                )}
              </>
            }
          >
            {(sale.featuredLots ?? []).map((lot, i) => {
              const body = (
                <>
                  <ObjectPhoto
                    photo={lot.photo}
                    sizes="(min-width: 1280px) 22rem, (min-width: 768px) 30vw, 75vw"
                    frameClassName="aspect-[4/5]"
                  />
                  <div className="mt-5 font-serif [font-variation-settings:'opsz'_18]">
                    {(lot.lotNumber || lot.maker) && (
                      <p className="font-sans text-[0.8125rem] tracking-[0.14em] text-ink-soft uppercase">
                        {lot.lotNumber && <>Lot {lot.lotNumber}</>}
                        {lot.lotNumber && lot.maker && <> · </>}
                        {lot.maker}
                      </p>
                    )}
                    <h3 className="mt-1.5 font-serif text-[1.375rem] leading-snug [font-variation-settings:'opsz'_36]">{lot.title}</h3>
                    {lot.estimate && (
                      <p className="mt-3 text-[1.0625rem] text-ink-soft">
                        {f?.estimateLabel && <>{f.estimateLabel} </>}
                        <span className="text-[1.25rem] text-ink [font-variation-settings:'opsz'_36]">{lot.estimate}</span>
                      </p>
                    )}
                    {lot.link && f?.linkLabel && (
                      <p className="mt-3 inline-flex items-center gap-3 text-[1.125rem] text-ink-soft group-hover:text-navy">
                        {f.linkLabel} <Arrow />
                      </p>
                    )}
                  </div>
                </>
              );
              return (
                <li
                  key={`${lot.title}-${i}`}
                  className="w-[75vw] shrink-0 snap-start sm:w-[45vw] md:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)]"
                >
                  {lot.link ? (
                    <a href={lot.link} className="group block hover:[&_h3]:text-navy">
                      {body}
                    </a>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </Reel>
          {sale.catalogueLink && f?.catalogueLabel && (
            <a
              href={sale.catalogueLink}
              className="group mt-6 inline-flex items-center gap-3 border-b border-ink/40 pb-0.5 font-serif text-[1.1875rem] [font-variation-settings:'opsz'_18] hover:border-ink"
            >
              {f.catalogueLabel} <Arrow />
            </a>
          )}
        </section>
      ))}
    </>
  );
}
