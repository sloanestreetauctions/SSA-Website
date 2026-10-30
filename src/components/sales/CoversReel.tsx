import { ObjectPhoto } from "@/components/ui/PhotoToCome";
import { covers } from "@/content";
import { Reel } from "./Reel";

/**
 * PAST CATALOGUE COVERS — the house's catalogue covers, newest first, as
 * added in the editor (Past catalogue covers). Each cover is shown whole and
 * links to its catalogue when a link has been added. Nothing is shown until
 * at least one cover has been added.
 */
export function CoversReel({ page }: { page: "home" | "auctions" }) {
  const c = covers;
  const items = (c.items ?? []).filter((item) => item.cover?.image);
  if (c.show === false || items.length === 0) return null;
  if (page === "home" && c.showOnHome === false) return null;
  if (page === "auctions" && !c.showOnAuctionsPage) return null;

  const heading = (
    <>
      {c.eyebrow && <p className="type-eyebrow mb-4 text-ink-soft">{c.eyebrow}</p>}
      {c.title && (
        <h2 className="font-serif text-[2.25rem] leading-tight font-[380] [font-variation-settings:'opsz'_60] md:text-[3.25rem]">{c.title}</h2>
      )}
      {c.intro && (
        <p className="mt-3 max-w-[40rem] font-serif text-[1.25rem] leading-[1.5] text-ink-soft [font-variation-settings:'opsz'_18]">{c.intro}</p>
      )}
    </>
  );

  return (
    <section className="shell py-14 md:py-[4.5rem]">
      <Reel label={c.title || c.eyebrow || "Past catalogues"} heading={heading} itemName="catalogues">
        {items.map((item, i) => {
          const body = (
            <>
              <div className="shadow-[0_10px_28px_-12px_rgba(20,15,5,0.45)] transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
                <ObjectPhoto photo={item.cover} sizes="(min-width: 1280px) 22rem, (min-width: 768px) 30vw, 75vw" frameClassName="aspect-[595/742]" />
              </div>
              <div className="mt-5 font-serif [font-variation-settings:'opsz'_18]">
                <h3 className="font-serif text-[1.375rem] leading-snug [font-variation-settings:'opsz'_36]">{item.title}</h3>
                {item.date && <p className="mt-1 text-[1.0625rem] text-ink-soft">{item.date}</p>}
              </div>
            </>
          );
          return (
            <li key={`${item.title}-${i}`} className="w-[75vw] shrink-0 snap-start sm:w-[45vw] md:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)]">
              {item.link ? (
                <a href={item.link} className="group block hover:[&_h3]:text-navy">
                  {body}
                </a>
              ) : (
                <div>{body}</div>
              )}
            </li>
          );
        })}
      </Reel>
    </section>
  );
}
