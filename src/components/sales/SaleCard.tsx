import { ObjectPhoto } from "@/components/ui/PhotoToCome";
import { Arrow } from "@/components/ui/Button";
import { hasPhoto } from "@/content";
import { formatShortDate, saleDateParts } from "@/lib/format";
import { calendar } from "@/content";
import type { Sale } from "@/lib/sales";
import { googleCalendarUrl, saleEventId } from "@/lib/calendar-event";

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
  const timed = sale.kind === "timed";
  const closes = timed && sale.closingDate ? saleDateParts(sale.closingDate) : null;
  const words = calendar.timed;
  const viewingLines = (sale.viewing ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

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
        {timed && (words?.badge ?? "Timed online sale") && (
          <p className="mb-2 self-start border border-gold/70 px-2.5 py-1 font-sans text-[0.75rem] font-[600] tracking-[0.14em] text-gold-ink uppercase">
            {words?.badge ?? "Timed online sale"}
          </p>
        )}
        {d && (
          <p className="font-sans text-[0.875rem] tracking-[0.12em] text-ink-soft uppercase tabular-nums">
            {closes ? (
              <>
                {d.day} {d.month}
                {d.year !== closes.year && <> {d.year}</>} – {closes.day} {closes.month} {closes.year}
                {sale.time && (
                  <>
                    {" "}
                    · {words?.closesLabel || "Closes"} {sale.time}
                  </>
                )}
              </>
            ) : (
              <>
                {d.day} {d.month} {d.year}
                {sale.time && <> · {sale.time}</>}
              </>
            )}
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
        {sale.live && sale.liveLink && (
          <a
            href={sale.liveLink}
            className="relative z-10 mt-4 inline-flex min-h-12 items-center gap-3 self-start bg-navy-deep px-6 font-serif text-[1.125rem] text-ivory hover:bg-navy-soft"
          >
            <span aria-hidden="true" className="size-2 rounded-full bg-[#e5534b] motion-safe:animate-pulse" />
            {calendar.live?.buttonLabel || "Bid live"} <Arrow />
          </a>
        )}
        {sale.consigning && sale.consignmentDeadline && (
          <p className="mt-3 inline-flex items-center gap-2 self-start border-l-2 border-gold pl-3 font-sans text-[0.9375rem] text-ink">
            {calendar.deadlines?.label || "Consign by"} {formatShortDate(sale.consignmentDeadline, sale.consignmentDeadline.slice(0, 4) !== sale.date?.slice(0, 4))}
          </p>
        )}
        {large && sale.date && (
          /* Add to calendar: Google, or a file that Apple Calendar and Outlook open. Above the card's link so it can be clicked. */
          <details className="group/cal relative z-30 mt-4 self-start">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2.5 border border-ink/25 px-4 font-sans text-[0.9375rem] text-ink hover:border-navy [&::-webkit-details-marker]:hidden">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="1.5" y="2.5" width="13" height="12" rx="1" />
                <path d="M1.5 6h13M5 1v3M11 1v3" />
              </svg>
              Add to calendar
            </summary>
            <ul className="absolute left-0 z-20 mt-1 min-w-[15rem] border border-line bg-paper py-1 font-sans text-[0.9375rem] shadow-[0_12px_30px_-12px_rgba(10,15,30,0.35)]">
              <li>
                <a href={googleCalendarUrl(sale)} target="_blank" rel="noopener" className="flex min-h-11 items-center px-4 hover:bg-stone">
                  Google Calendar<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
              <li>
                <a href={`/calendar/${saleEventId(sale)}.ics`} className="flex min-h-11 items-center px-4 hover:bg-stone">
                  Apple Calendar or Outlook
                </a>
              </li>
            </ul>
          </details>
        )}
        {sale.catalogueFile && (calendar.downloadLabel ?? "Download the catalogue (PDF)") && (
          /* The printed catalogue as a PDF, uploaded in the editor. Above the card's link so it can be clicked. */
          <a
            href={sale.catalogueFile}
            className="relative z-10 mt-4 inline-flex min-h-11 items-center gap-2.5 self-start font-sans text-[0.9375rem] text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M8 1.5v9M4.5 7 8 10.5 11.5 7M2 13.5h12" />
            </svg>
            {calendar.downloadLabel ?? "Download the catalogue (PDF)"}
          </a>
        )}
        {large && viewingLines.length > 0 && (
          /* Closed by default so the card stays short; sits above the card's catalogue link so it can be opened. */
          <details className="group/viewing relative z-10 mt-4 border-t border-line pt-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-sans text-[0.875rem] tracking-[0.12em] text-ink uppercase hover:text-navy [&::-webkit-details-marker]:hidden">
              {calendar.viewingLabel || "Viewing times"}
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="transition-transform group-open/viewing:rotate-180 motion-reduce:transition-none">
                <path d="M3 6l5 5 5-5" />
              </svg>
            </summary>
            <ul className="mt-1 mb-1 space-y-0.5 text-[1.0625rem] leading-snug text-ink">
              {viewingLines.map((line, i) => (
                <li key={`${line}-${i}`}>{line}</li>
              ))}
            </ul>
          </details>
        )}
        <p
          className={`mt-auto inline-flex items-center gap-3 pt-4 text-[1.1875rem] ${link ? "text-ink-soft group-hover:text-navy" : "text-ink-soft italic"}`}
        >
          {link ? (
            <>
              {timed ? words?.buttonLabel || "View and bid on The Saleroom" : "View catalogue"} <Arrow />
            </>
          ) : (
            "Catalogue coming soon"
          )}
        </p>
      </div>
    </article>
  );
}
