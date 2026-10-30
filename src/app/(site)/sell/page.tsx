import { notFound } from "next/navigation";
import { isPageOn } from "@/content";
import type { Metadata } from "next";
import Link from "next/link";
import { calendar, hasPhoto, isShown, sellPage, settings } from "@/content";
import { formatShortDate } from "@/lib/format";
import { getSales } from "@/lib/sales";
import { routes } from "@/lib/routes";
import { Arrow } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { GiltFrame } from "@/components/ui/GiltFrame";
import { ObjectPhoto, PhotoToCome } from "@/components/ui/PhotoToCome";
import { RichText } from "@/components/ui/RichText";
import { SplitHeader, splitMedia } from "@/components/ui/SplitHeader";

const c = sellPage;

export const metadata: Metadata = { title: c.seo.title, description: c.seo.description };

const serif = "font-serif [font-variation-settings:'opsz'_18]";
const appointmentMail = `mailto:${settings.generalEmail}${c.showroom.appointmentSubject ? `?subject=${encodeURIComponent(c.showroom.appointmentSubject)}` : ""}`;

/**
 * SELL WITH US — built to the approved Direction C mockup.
 * At 1440px: hero 166–814 · how selling works · navy showroom split · fees strip · footer.
 */
export default async function SellPage() {
  if (!isPageOn("/sell")) notFound();
  const { hero, process, showroom, fees } = c;
  const next = calendar.deadlines?.showOnSell === false ? null : (await getSales()).nextConsignment;
  return (
    <>
      {/* ============================================================== HERO */}
      <SplitHeader
        breadcrumbs={<Breadcrumbs items={[{ label: hero.eyebrow || "Sell with us" }]} />}
        media={
          hasPhoto(hero.photo) &&
          (hero.framed ? (
            <GiltFrame className={splitMedia}>
              <PhotoToCome photo={hero.photo} priority className="h-full" />
            </GiltFrame>
          ) : (
            <PhotoToCome photo={hero.photo} priority className={splitMedia} />
          ))
        }
      >
        {hero.eyebrow && <p className="type-eyebrow mb-5 text-ink-soft">{hero.eyebrow}</p>}
        <h1 className="font-serif text-[3rem] leading-[1.02] font-[350] tracking-[-0.02em] text-navy [font-variation-settings:'opsz'_72] md:text-[4.25rem] xl:text-[5rem]">
          {hero.title}
        </h1>
        {hero.text && <p className={`mt-7 max-w-[33rem] ${serif} text-[1.4375rem] leading-[1.5] text-ink-soft`}>{hero.text}</p>}
        {next?.consignmentDeadline && (
          <p className={`mt-7 max-w-[33rem] border-l-2 border-gold pl-4 ${serif} text-[1.1875rem] leading-[1.5] text-ink`}>
            {calendar.deadlines?.sellText || "Now consigning for"} <span className="italic">{next.title}</span>
            {next.date && <> ({formatShortDate(next.date)})</>}.{" "}
            <strong className="font-[560]">
              {calendar.deadlines?.label || "Consign by"} {formatShortDate(next.consignmentDeadline)}
            </strong>
            .
          </p>
        )}
        {(hero.primaryButton || (hero.secondaryButton && isShown(showroom))) && (
          <div className="mt-9 flex flex-wrap items-center gap-4">
            {hero.primaryButton && (
              <Link
                href={routes.valuation}
                className={`group inline-flex min-h-16 items-center gap-4 bg-navy-deep px-7 ${serif} text-[1.1875rem] text-ivory transition-colors hover:bg-navy-soft`}
              >
                {hero.primaryButton} <Arrow />
              </Link>
            )}
            {hero.secondaryButton && isShown(showroom) && (
              <a
                href="#visit"
                className={`inline-flex min-h-16 items-center border border-ink/30 px-7 ${serif} text-[1.1875rem] text-ink transition-colors hover:border-navy hover:text-navy`}
              >
                {hero.secondaryButton}
              </a>
            )}
          </div>
        )}
      </SplitHeader>

      {/* ================================================= HOW SELLING WORKS */}
      {isShown(process) && (
        <section aria-label={process.title || "How selling works"} className="shell pt-16 pb-20 md:pt-[4.4rem] md:pb-[4.5rem]">
          {process.title && (
            <h2 className="mb-10 font-serif text-[2.5rem] leading-tight font-[380] [font-variation-settings:'opsz'_60] md:mb-14 md:text-[3.5rem]">
              {process.title}
            </h2>
          )}
          <ol className="grid md:grid-cols-2">
            {process.steps.map((step, i) => {
              const lastRow = i >= process.steps.length - (process.steps.length % 2 === 0 ? 2 : 1);
              return (
                <li
                  key={`${step.title}-${i}`}
                  className={`grid grid-cols-[4rem_1fr] gap-x-4 py-7 md:grid-cols-[6.5rem_1fr] md:py-10 ${
                    i % 2 === 1 ? "md:border-l md:border-line md:pl-16" : "md:pr-16"
                  } ${i < 2 ? "md:pt-0" : "md:border-t md:border-line"} ${lastRow ? "md:pb-0" : ""} ${i > 0 ? "border-t border-line" : ""} ${i === 1 ? "md:border-t-0" : ""}`}
                >
                  <span className="self-start border-b border-gold-ink/60 pb-3 font-serif text-[3.5rem] leading-[0.9] font-[300] text-gold-ink [font-variation-settings:'opsz'_72] md:text-[4rem]">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-serif text-[1.875rem] leading-snug [font-variation-settings:'opsz'_36]">{step.title}</h3>
                    {step.body && <p className={`mt-2 max-w-[26rem] ${serif} text-[1.3125rem] leading-[1.45] text-ink-soft`}>{step.body}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* ========================================================== SHOWROOM */}
      {isShown(showroom) && (
        <section id="visit" aria-label={showroom.title || "Visit us"} className="theme-dark scroll-mt-8 bg-navy text-ivory">
          <div className={`shell grid gap-10 py-12 md:py-16 lg:gap-16 lg:py-20 xl:gap-24 ${hasPhoto(showroom.photo) ? "lg:grid-cols-2" : ""}`}>
            {hasPhoto(showroom.photo) && (
              <div className="relative lg:min-h-[30rem]">
                <PhotoToCome photo={showroom.photo} className={splitMedia} />
              </div>
            )}
            <div className="flex max-w-[44rem] flex-col justify-center">
              {showroom.eyebrow && <p className="type-eyebrow mb-5 text-[0.875rem] text-ivory/80">{showroom.eyebrow}</p>}
              {showroom.title && (
                <h2 className="font-serif text-[2.75rem] leading-[1.05] font-[350] [font-variation-settings:'opsz'_72] md:text-[3.75rem]">
                  {showroom.title}
                </h2>
              )}
              {showroom.text && (
                <p className={`mt-6 max-w-[28rem] ${serif} text-[1.4375rem] leading-[1.5] text-ivory/85`}>
                  <RichText text={showroom.text} linkClassName="text-ivory underline decoration-ivory/40 underline-offset-4 hover:decoration-ivory" />
                </p>
              )}
              {showroom.buttonLabel && (
                <a
                  href={appointmentMail}
                  className={`group mt-9 inline-flex min-h-16 items-center gap-4 self-start bg-ivory px-9 ${serif} text-[1.25rem] text-navy transition-colors hover:bg-stone`}
                >
                  {showroom.buttonLabel} <Arrow />
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================= FEES */}
      {isShown(fees) && (
        <section id="fees-title" aria-label={fees.title || "Fees and terms"} className="scroll-mt-8 bg-[#f1ebe4]">
          <div
            className={`shell grid items-center gap-10 py-14 lg:gap-16 lg:py-16 ${
              hasPhoto(fees.photo) ? "lg:grid-cols-[1fr_24rem] xl:grid-cols-[1fr_28rem]" : ""
            }`}
          >
            <div className="flex flex-col justify-center">
              {fees.title && (
                <h2 className="font-serif text-[2rem] leading-tight font-[380] [font-variation-settings:'opsz'_48] md:text-[2.375rem]">
                  {fees.title}
                </h2>
              )}
              {fees.text && (
                <p className={`mt-4 max-w-[60rem] ${serif} text-[1.3125rem] leading-[1.5] text-ink-soft`}>
                  <RichText text={fees.text} linkClassName="text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink" />
                </p>
              )}
              {fees.linkLabel && (
                <a
                  href={settings.links.conditionsOfSale}
                  className={`group mt-6 inline-flex items-center gap-3 self-start border-b border-ink/40 pb-0.5 ${serif} text-[1.3125rem] hover:border-ink`}
                >
                  {fees.linkLabel} <Arrow />
                </a>
              )}
            </div>
            <ObjectPhoto photo={fees.photo} sizes="(min-width: 1024px) 28rem, 100vw" frameClassName="aspect-[1.6]" />
          </div>
        </section>
      )}
    </>
  );
}
