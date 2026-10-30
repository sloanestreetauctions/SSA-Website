import Link from "next/link";
import { Suspense } from "react";
import { SearchIcon } from "@/components/ui/Icons";
import { LogoLockup } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NavGroup, NavGroupLinks } from "./PrimaryNav";
import { signInLabel, valuationButtonLabel } from "@/lib/site";
import { easyLive } from "@/content";

export type HeaderTone = "dark" | "light";

/**
 * Global header, laid out as in the approved mockup: navigation either side
 * of the centred logo, aligned with the top of the logo, and a navy
 * "Request a valuation" button at the far right.
 *
 *  - "dark":  transparent, over the homepage hero.
 *  - "light": solid deep navy, above the page on all other pages.
 *
 * The logo itself is identical in both — only the surroundings change.
 */
export function SiteHeader({ tone = "light" }: { tone?: HeaderTone }) {
  // Homepage: transparent, floating over the hero photograph.
  // Every other page: a solid deep-navy bar with a smaller logo and more breathing room.
  const overHero = tone === "dark";
  const soft = "text-ivory/80 hover:text-ivory";

  return (
    <header className={`theme-dark z-40 text-ivory ${overHero ? "absolute inset-x-0 top-0" : "relative bg-navy-deep"}`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-ivory focus:px-4 focus:py-2 focus:text-navy"
      >
        Skip to content
      </a>

      {/* Account link for bidders (Easy Live), on a slim line of its own above the menu on larger screens.
          Shown once the Easy Live sign-in page is set in the editor (Auction calendar). */}
      {easyLive.signIn && (
        <div className="mx-auto hidden max-w-[100rem] justify-end px-16 pt-3 xl:flex 2xl:px-20">
          <a
            href={easyLive.signIn}
            className={`inline-flex min-h-8 items-center gap-2 font-sans text-[0.8125rem] tracking-[0.06em] whitespace-nowrap 2xl:text-[0.875rem] ${soft}`}
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.1">
              <circle cx="7" cy="4.5" r="2.6" />
              <path d="M1.8 13c.6-2.9 2.7-4.4 5.2-4.4s4.6 1.5 5.2 4.4" />
            </svg>
            {signInLabel}
          </a>
        </div>
      )}

      <div
        className={`mx-auto grid max-w-[100rem] grid-cols-[1fr_auto_1fr] gap-6 px-5 md:px-10 xl:px-16 2xl:px-20 ${
          overHero
            ? `items-start pt-5 pb-4 ${easyLive.signIn ? "xl:pt-1" : "xl:pt-6"}`
            : `items-center py-5 md:py-6 ${easyLive.signIn ? "xl:pt-2 xl:pb-7" : "xl:py-7"}`
        }`}
      >
        {/* Left */}
        <div className="flex min-h-12 items-center xl:min-h-[4.5rem]">
          <MobileMenu tone="dark" />
          <Suspense fallback={<NavGroupLinks group="left" pathname={null} tone="dark" />}>
            <NavGroup group="left" tone="dark" />
          </Suspense>
        </div>

        {/* Centre: the logo, exactly as supplied */}
        <Link href="/" aria-label="Sloane Street Auctions — home" className="block">
          <LogoLockup
            preload
            className={overHero ? "w-[8.5rem] md:w-[11rem] xl:w-[16rem] 2xl:w-[18rem]" : "w-[7.25rem] md:w-[8.5rem] xl:w-[11rem] 2xl:w-[12.5rem]"}
          />
        </Link>

        {/* Right */}
        <div className="flex min-h-12 items-center justify-end gap-7 xl:min-h-[4.5rem] xl:gap-5 2xl:gap-10">
          <Suspense fallback={<NavGroupLinks group="right" pathname={null} tone="dark" />}>
            <NavGroup group="right" tone="dark" />
          </Suspense>
          {easyLive.site && (
            <a
              href={easyLive.site}
              aria-label="Search lots and catalogues on our auction site"
              className={`-mr-2 inline-flex min-h-11 items-center px-2 xl:mr-0 xl:px-0 ${soft}`}
            >
              <SearchIcon size={19} className="xl:size-[21px] 2xl:size-[23px]" />
            </a>
          )}
          <Link
            href="/valuation"
            className={`hidden min-h-[3.75rem] items-center whitespace-nowrap bg-navy-deep px-8 font-serif [font-variation-settings:'opsz'_18] text-[1.0625rem] xl:min-h-[4rem] xl:text-[1.1875rem] 2xl:min-h-[4.5rem] 2xl:px-10 2xl:text-[1.3125rem] text-ivory transition-colors hover:bg-navy-soft xl:inline-flex ${"border border-ivory/40 hover:border-ivory"}`}
          >
            {valuationButtonLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
