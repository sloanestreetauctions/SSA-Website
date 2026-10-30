import { ObjectPhoto } from "@/components/ui/PhotoToCome";
import { highlights } from "@/content";
import { Reel } from "./Reel";

/**
 * SALE HIGHLIGHTS — the house's best results, as entered in the editor
 * (Sale highlights). Nothing here is invented: with no lots added, nothing
 * is shown at all.
 */
export function HighlightsReel({ page }: { page: "home" | "auctions" }) {
  const h = highlights;
  if (!h.show || h.items.length === 0) return null;
  if (page === "auctions" && !h.showOnAuctionsPage) return null;
  if (page === "home" && h.showOnHome === false) return null;

  const heading = (
    <>
      {h.eyebrow && <p className="type-eyebrow mb-4 text-ink-soft">{h.eyebrow}</p>}
      {h.title && (
        <h2 className="font-serif text-[2.25rem] leading-tight font-[380] [font-variation-settings:'opsz'_60] md:text-[3.25rem]">
          {h.title}
        </h2>
      )}
      {h.intro && (
        <p className="mt-3 max-w-[40rem] font-serif text-[1.25rem] leading-[1.5] text-ink-soft [font-variation-settings:'opsz'_18]">
          {h.intro}
        </p>
      )}
    </>
  );

  return (
    <section className="shell py-14 md:py-[4.5rem]">
      <Reel label={h.title || h.eyebrow || "Sale highlights"} heading={heading}>
        {h.items.map((lot, i) => {
          const body = (
            <>
              <ObjectPhoto
                photo={lot.photo}
                sizes="(min-width: 1280px) 22rem, (min-width: 768px) 30vw, 75vw"
                frameClassName="aspect-[4/5]"
              />
              <div className="mt-5 font-serif [font-variation-settings:'opsz'_18]">
                {lot.maker && <p className="font-sans text-[0.8125rem] tracking-[0.14em] text-ink-soft uppercase">{lot.maker}</p>}
                <h3 className="mt-1.5 font-serif text-[1.375rem] leading-snug [font-variation-settings:'opsz'_36]">{lot.title}</h3>
                {lot.price && (
                  <p className="mt-3 text-[1.0625rem] text-ink-soft">
                    {h.priceLabel && <>{h.priceLabel} </>}
                    <span className="text-[1.5rem] text-gold-ink [font-variation-settings:'opsz'_36]">{lot.price}</span>
                  </p>
                )}
                {lot.sale && <p className="mt-1 text-[1rem] text-ink-soft">{lot.sale}</p>}
              </div>
            </>
          );
          return (
            <li key={`${lot.title}-${i}`} className="w-[75vw] shrink-0 snap-start sm:w-[45vw] md:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)]">
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
    </section>
  );
}
