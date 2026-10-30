import { ObjectPhoto } from "@/components/ui/PhotoToCome";
import { Arrow } from "@/components/ui/Button";
import { hasPhoto } from "@/content";
import { formatShortDate, saleDateParts } from "@/lib/format";
import { calendar } from "@/content";
import type { Sale } from "@/lib/sales";

/**
 * One sale from the Auction calendar. The whole card links to the sale's
 * catalogue on the Easy Live auction site once that link has been added;
 * until then it says "Catalogue coming soon" and isn't a link.
 */
export function SaleCard({
  sale,
  size = "compact",
  priority = false,
  headingLevel = 3,
}: {
  sale: Sale;
  size?: "compact" | "large";
  priority?: boolean;
  /** 2 where the cards sit directly under the page heading. */
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const d = sale.date ? saleDateParts(sale.date) : null;
  const large = size === "large";
  const link = sale.catalogueLink;

  return (
    <article className="group relative flex h-full flex-col border border-line bg-paper">
      <div className="border-b border-line">
        {hasPhoto(sale.photo) ? (
          <ObjectPhoto
            photo={sale.photo}
            priority={priority}
            sizes={large ? "(min-width: 768px) 45vw, 100vw" : "(min-width: 768px) 29vw, 100vw"}
            frameClassName={large ? "aspect-[1.25]" : "aspect-[1.6]"}
          />
        ) : (
          /* No cover photograph yet: a typographic navy cover with the date, so the row still looks complete. */
          <div
            aria-hidden="true"
            className={`theme-dark flex flex-col items-center justify-center bg-navy-deep text-center text-ivory ${large ? "aspect-[1.25]" : "aspect-[1.6]"}`}
          >
            {d && (
              <>
                <span className={`font-serif leading-none font-[300] text-tan [font-variation-settings:'opsz'_72] ${large ? "text-[6rem]" : "text-[4.5rem]"}`}>
                  {d.day}
                </span>
                <span className="mt-3 font-sans text-[0.875rem] tracking-[0.24em] text-ivory/75 uppercase">
                  {d.month} {d.year}
                </span>
              </>
            )}
          </div>
        )}
      </div>
      <div className={`flex flex-1 flex-col font-serif [font-variation-settings:'opsz'_18] ${large ? "px-6 pt-5 pb-6" : "px-6 pt-4 pb-5"}`}>
        {d && (
          <p className="font-sans text-[0.875rem] tracking-[0.12em] text-ink-soft uppercase tabular-nums">
            {d.day} {d.month} {d.year}
            {sale.time && <> · {sale.time}</>}
          </p>
        )}
        <Heading
          className={`mt-1.5 font-serif leading-[1.2] [font-variation-settings:'opsz'_36] ${large ? "text-[1.875rem]" : "text-[1.5rem]"}`}
        >
          {link ? (
            <a href={link} className="after:absolute after:inset-0">
              {sale.title}
            </a>
          ) : (
            sale.title
          )}
        </Heading>
        {sale.description && <p className="mt-1.5 text-[1.1875rem] leading-snug text-ink-soft">{sale.description}</p>}
        {sale.consigning && sale.consignmentDeadline && (
          <p className="mt-3 inline-flex items-center gap-2 self-start border-l-2 border-gold pl-3 font-sans text-[0.9375rem] text-ink">
            {calendar.deadlines?.label || "Consign by"} {formatShortDate(sale.consignmentDeadline, sale.consignmentDeadline.slice(0, 4) !== sale.date?.slice(0, 4))}
          </p>
        )}
        <p
          className={`mt-auto inline-flex items-center gap-3 pt-4 text-[1.1875rem] ${link ? "text-ink-soft group-hover:text-navy" : "text-ink-soft italic"}`}
        >
          {link ? (
            <>
              View catalogue <Arrow />
            </>
          ) : (
            "Catalogue coming soon"
          )}
        </p>
      </div>
    </article>
  );
}
