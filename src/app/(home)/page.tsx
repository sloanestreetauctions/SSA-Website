import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { getSales } from "@/lib/sales";
import { routes } from "@/lib/routes";
import { home, isPageOn, isShown } from "@/content";
import { versioned } from "@/lib/photo-version";
import { BreakLines } from "@/components/ui/RichText";
import { FeaturedLots } from "@/components/sales/FeaturedLots";
import { HighlightsReel } from "@/components/sales/HighlightsReel";
import { SaleCard } from "@/components/sales/SaleCard";
import { Arrow } from "@/components/ui/Button";

/**
 * HOMEPAGE — built to the approved Direction C mockup.
 * Sections and proportions (at 1440px wide) follow the reference:
 * hero 0–1136px · upcoming auctions · navy approach band · three value points · footer.
 */
/** Which part of the opening photograph stays in view when it's trimmed to fit (set in the editor). */
const HERO_POSITION: Record<string, string> = {
  top: "object-[55%_0%]",
  upper: "object-[55%_25%]",
  center: "object-[55%_50%]",
  lower: "object-[55%_75%]",
  bottom: "object-[55%_100%]",
};

export default async function HomePage() {
  const upcoming = (await getSales()).upcoming.slice(0, 3);
  const { hero, upcoming: upcomingText, approach, values } = home;
  const sellOn = isPageOn("/sell");

  return (
    <>
      {/* ================================================================ HERO */}
      <section
        aria-labelledby="hero-title"
        className={`theme-dark relative isolate flex min-h-[85svh] flex-col justify-end overflow-hidden bg-[#1e1b15] text-ivory lg:min-h-[max(32rem,min(46vw,calc(100svh-8.5rem)))] ${hero.showWords ? "lg:justify-center" : "lg:justify-end"}`}
      >
        {/* The room photograph, filling the opening edge to edge. Where its shape
            differs from the screen's it is trimmed; the editor's "Which part of
            the photograph to keep" chooses what stays in view. */}
        {hero.photo.image && (
          <div className="absolute inset-0 -z-20">
            <Image
              quality={90}
              src={versioned(hero.photo.image)}
              alt={hero.photo.alt ?? ""}
              fill
              preload
              sizes="100vw"
              className={`object-cover ${HERO_POSITION[hero.photoPosition ?? "center"] ?? HERO_POSITION.center}`}
            />
          </div>
        )}
        {hero.showWords ? (
          <>
            {/* Shade behind the words only, so the headline stays legible over the room */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/55 to-black/25 lg:bg-gradient-to-r lg:from-black/75 lg:via-black/35 lg:via-45% lg:to-transparent lg:to-70%"
            />
          </>
        ) : (
          <>
            {/* Photograph only: a gentle shade at the bottom for the buttons */}
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-[38%] bg-gradient-to-t from-black/60 to-transparent" />
          </>
        )}

        {hero.showWords ? (
          <div className="relative px-5 pt-24 pb-12 md:px-10 lg:ml-[7.7%] lg:w-[38%] lg:max-w-[34.5rem] lg:px-0 lg:py-14">
            <h1
              id="hero-title"
              className="font-serif text-[3rem] leading-[0.98] font-[350] tracking-[-0.02em] [font-variation-settings:'opsz'_72] md:text-[4.25rem] xl:text-[4.875rem] xl:leading-[0.935] 2xl:text-[5.5rem]"
            >
              {hero.title}
            </h1>
            {hero.text && (
              <p className="mt-6 max-w-[27rem] font-serif text-[1.375rem] leading-[1.4] text-ivory/90 [font-variation-settings:'opsz'_18] xl:mt-[2.4rem] xl:text-[1.6rem]">
                {hero.text}
              </p>
            )}
            <div className="mt-9 flex flex-col items-start gap-5 xl:mt-[2.6rem] 2xl:mt-[3.4rem]">
              {hero.buttonLabel && (
                <Link
                  href={routes.auctions}
                  className="group inline-flex min-h-16 items-center gap-4 border border-ivory/70 px-10 font-serif text-[1.1875rem] text-ivory transition-colors [font-variation-settings:'opsz'_18] hover:border-ivory hover:bg-ivory hover:text-navy"
                >
                  {hero.buttonLabel} <Arrow />
                </Link>
              )}
              {hero.linkLabel && sellOn && (
                <Link
                  href="/sell"
                  className="group inline-flex min-h-11 items-center gap-4 border-b border-ivory/50 font-serif text-[1.375rem] text-ivory [font-variation-settings:'opsz'_18] hover:border-ivory"
                >
                  {hero.linkLabel} <Arrow />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="shell relative pt-24 pb-12 md:pb-14 lg:mt-auto lg:pb-[3.5vw]">
            {/* The headline is still the page's main heading for Google and screen readers. */}
            <h1 id="hero-title" className="sr-only">
              {hero.title}
            </h1>
            <HeroButtons buttonLabel={hero.buttonLabel} linkLabel={sellOn ? hero.linkLabel : ""} className="sm:justify-center" />
          </div>
        )}
      </section>

      {/* =================================================== UPCOMING AUCTIONS */}
      {isShown(upcomingText) && (
        <section aria-labelledby="upcoming-title" className="shell pt-14 pb-9 md:pt-[3.6rem]">
          <div className="flex flex-wrap items-baseline justify-between gap-6">
            {upcomingText.title && (
              <h2 id="upcoming-title" className="font-serif text-[2.25rem] leading-tight font-[380] [font-variation-settings:'opsz'_60] md:text-[3.25rem]">
                {upcomingText.title}
              </h2>
            )}
            {upcomingText.viewAllLabel && (
              <Link href={routes.auctions} className="group inline-flex shrink-0 items-center gap-3 border-b border-ink/40 pb-0.5 font-serif [font-variation-settings:'opsz'_18] text-[1.25rem] hover:border-ink">
                {upcomingText.viewAllLabel} <Arrow />
              </Link>
            )}
          </div>

          {upcoming.length > 0 ? (
            <ul className="mt-9 grid gap-4 md:mt-[2.3rem] md:grid-cols-3">
              {upcoming.map((sale, i) => (
                <li key={`${sale.title}-${sale.date}-${i}`} className="h-full">
                  <SaleCard sale={sale} />
                </li>
              ))}
            </ul>
          ) : (
            upcomingText.noUpcoming && (
              <p className="mt-6 max-w-[40rem] font-serif text-[1.3125rem] leading-[1.5] text-ink-soft [font-variation-settings:'opsz'_18]">
                {upcomingText.noUpcoming}
              </p>
            )
          )}
        </section>
      )}

      {/* ======================================================= FEATURED LOTS */}
      <FeaturedLots sales={upcoming} page="home" />

      {/* ===================================================== SALE HIGHLIGHTS */}
      <HighlightsReel page="home" />

      {/* ======================================================= NAVY BAND */}
      {isShown(approach) && (
        <section aria-labelledby={approach.title ? "approach-title" : undefined} aria-label={approach.title ? undefined : "Our approach"} className="theme-dark bg-navy text-ivory">
          <div className="shell grid gap-10 py-16 md:grid-cols-12 md:items-center md:py-[3.9rem]">
            <div className="md:col-span-6">
              {approach.eyebrow && <p className="type-eyebrow text-[0.875rem] text-ivory/80">{approach.eyebrow}</p>}
              {approach.title && (
                <h2
                  id="approach-title"
                  className="mt-5 font-serif text-[2.5rem] leading-[1.12] font-[350] [font-variation-settings:'opsz'_72] md:text-[3.4rem]"
                >
                  <BreakLines text={approach.title} />
                </h2>
              )}
            </div>
            <div className="md:col-span-5 md:col-start-8">
              {approach.text && (
                <p className="font-serif text-[1.375rem] leading-[1.5] text-ivory/85 [font-variation-settings:'opsz'_18]">{approach.text}</p>
              )}
              {approach.linkLabel && sellOn && (
                <Link href="/sell" className="group mt-4 inline-flex min-h-11 items-center gap-3 border-b border-ivory/40 font-serif [font-variation-settings:'opsz'_18] text-[1.3125rem] hover:border-ivory">
                  {approach.linkLabel} <Arrow />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================== VALUE POINTS
          Each point restates terms published on the current website. */}
      {values.length > 0 && (
        <section aria-label="Why sell with us">
          <ul className={`shell grid gap-10 py-14 md:gap-8 md:py-[4.2rem] ${values.length === 1 ? "" : values.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            {values.map((v) => (
              <ValuePoint key={v.title} icon={icons[v.icon]} title={v.title} body={v.body} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- helpers */

/** The two centred buttons used when the opening shows the photograph only (headline switched off). */
function HeroButtons({ buttonLabel, linkLabel, className = "" }: { buttonLabel: string; linkLabel: string; className?: string }) {
  if (!buttonLabel && !linkLabel) return null;
  const base =
    "group inline-flex min-h-16 items-center justify-center gap-4 px-9 font-serif text-[1.1875rem] transition-colors [font-variation-settings:'opsz'_18] xl:min-h-[4.25rem] xl:px-11 xl:text-[1.3125rem]";
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4 ${className}`}>
      {buttonLabel && (
        <Link href={routes.auctions} className={`${base} bg-ivory text-navy hover:bg-stone`}>
          {buttonLabel} <Arrow />
        </Link>
      )}
      {linkLabel && (
        <Link href="/sell" className={`${base} border border-ivory/80 text-ivory hover:border-ivory hover:bg-ivory hover:text-navy`}>
          {linkLabel} <Arrow />
        </Link>
      )}
    </div>
  );
}

function ValuePoint({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <li className={icon ? "grid grid-cols-[3.5rem_1fr] gap-5" : ""}>
      {icon && <span className="text-gold-ink">{icon}</span>}
      <div>
        <h3 className="font-serif text-[1.625rem] leading-snug [font-variation-settings:'opsz'_36]">{title}</h3>
        {body && <p className="mt-2 font-serif text-[1.1875rem] leading-snug text-ink-soft [font-variation-settings:'opsz'_18]">{body}</p>}
      </div>
    </li>
  );
}

const icons: Record<string, ReactNode> = {
  valuation: <IconValuation />,
  terms: <IconTerms />,
  reach: <IconReach />,
  none: null,
};

/* Fine line icons, drawn to match the 1.2px weight of the typography. */
const iconProps = {
  width: 48,
  height: 48,
  viewBox: "0 0 40 40",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.2,
  "aria-hidden": true,
} as const;

function IconValuation() {
  return (
    <svg {...iconProps}>
      <circle cx="17" cy="17" r="9" />
      <path d="M23.5 23.5L33 33M13 17h8M17 13v8" />
    </svg>
  );
}
function IconTerms() {
  return (
    <svg {...iconProps}>
      <path d="M10 5h15l6 6v24H10z" />
      <path d="M25 5v6h6M14 18h12M14 23h12M14 28h7" />
    </svg>
  );
}
function IconReach() {
  return (
    <svg {...iconProps}>
      <circle cx="20" cy="20" r="14" />
      <path d="M6 20h28M20 6c4.5 4 6.5 9 6.5 14s-2 10-6.5 14c-4.5-4-6.5-9-6.5-14S15.5 10 20 6z" />
    </svg>
  );
}
