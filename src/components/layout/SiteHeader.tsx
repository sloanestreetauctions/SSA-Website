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
 * Global header: navigation either side of the logo, which is always exactly
 * central, with "Request a valuation" (and the bidders' sign-in) on a slim
 * line above. On phones: "Menu" on the left, with the logo still exactly central.
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

      {/* Slim line above the menu on larger screens: the valuation button, and the
          bidders' sign-in link once the Easy Live sign-in page is set in the editor. */}
      <div className="mx-auto hidden max-w-[100rem] items-center justify-end gap-6 px-16 pt-3 xl:flex 2xl:px-20">
        {easyLive.signIn && (
          <a
            href={easyLive.signIn}
            className={`inline-flex min-h-9 items-center gap-2 font-sans text-[0.8125rem] tracking-[0.06em] whitespace-nowrap 2xl:text-[0.875rem] ${soft}`}
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.1">
              <circle cx="7" cy="4.5" r="2.6" />
              <path d="M1.8 13c.6-2.9 2.7-4.4 5.2-4.4s4.6 1.5 5.2 4.4" />
            </svg>
            {signInLabel}
          </a>
        )}
        <Link
          href="/valuation"
          className="inline-flex min-h-9 items-center border border-ivory/40 px-4 font-sans text-[0.8125rem] tracking-[0.06em] whitespace-nowrap text-ivory transition-colors hover:border-ivory hover:bg-ivory hover:text-navy 2xl:text-[0.875rem]"
        >
          {valuationButtonLabel}
        </Link>
      </div>

      {/* Main row: equal columns either side, so the logo is always exactly central. */}
      <div className="mx-auto grid max-w-[100rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-5 py-5 md:px-10 md:py-6 xl:gap-14 xl:px-16 xl:pt-1 xl:pb-7 2xl:gap-20 2xl:px-20">
        {/* Left: on larger screens the links sit close to the logo rather than out at the edge */}
        <div className="flex min-h-12 items-center xl:min-h-[4.5rem] xl:justify-end">
          <MobileMenu tone="dark" />
          <Suspense fallback={<NavGroupLinks group="left" pathname={null} tone="dark" />}>
            <NavGroup group="left" tone="dark" />
          </Suspense>
        </div>

        {/* Centre: the logo, exactly as supplied */}
        <Link href="/" aria-label="Sloane Street Auctions — home" className="block">
          <LogoLockup preload className="w-[7.25rem] md:w-[8.5rem] xl:w-[11rem] 2xl:w-[12.5rem]" />
        </Link>

        {/* Right: mirrors the left */}
        <div className="flex min-h-12 items-center justify-end gap-5 xl:min-h-[4.5rem] xl:justify-start">
          <Suspense fallback={<NavGroupLinks group="right" pathname={null} tone="dark" />}>
            <NavGroup group="right" tone="dark" />
          </Suspense>
          {easyLive.site && (
            <a
              href={easyLive.site}
              aria-label="Search lots and catalogues on our auction site"
              className={`inline-flex min-h-11 items-center px-1 xl:px-0 ${soft}`}
            >
              <SearchIcon size={19} className="xl:size-[21px] 2xl:size-[23px]" />
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
