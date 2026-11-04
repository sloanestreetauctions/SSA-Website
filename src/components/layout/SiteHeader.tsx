import Link from "next/link";
import { Suspense } from "react";
import { SearchIcon } from "@/components/ui/Icons";
import { LogoLockup } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NavGroup, NavGroupLinks } from "./PrimaryNav";
import { signInLabel, siteMenu } from "@/lib/site";
import { jewelleryBookingLive } from "@/lib/booking/status";
import { easyLive } from "@/content";

export type HeaderTone = "dark" | "light";

/**
 * Global header: navigation spread evenly either side of the logo, which is
 * always exactly central. On phones: "Menu" on the left, logo still central.
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
  const menu = siteMenu({ bookingLive: jewelleryBookingLive() });

  return (
    <header className={`theme-dark z-40 text-ivory ${overHero ? "absolute inset-x-0 top-0" : "relative bg-navy-deep"}`}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-ivory focus:px-4 focus:py-2 focus:text-navy"
      >
        Skip to content
      </a>

      {/* Bidders' sign-in link (Easy Live), on a slim line above the menu once its address is set in the editor. */}
      {easyLive.signIn && (
        <div className="mx-auto hidden max-w-[88rem] justify-end px-16 pt-3 xl:flex">
          <a
            href={easyLive.signIn}
            className={`inline-flex min-h-8 items-center gap-2 font-sans text-[0.8125rem] tracking-[0.06em] whitespace-nowrap ${soft}`}
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.1">
              <circle cx="7" cy="4.5" r="2.6" />
              <path d="M1.8 13c.6-2.9 2.7-4.4 5.2-4.4s4.6 1.5 5.2 4.4" />
            </svg>
            {signInLabel}
          </a>
        </div>
      )}

      {/* Equal columns either side, so the logo is always exactly central; the links spread evenly across each side. */}
      <div
        className={`mx-auto grid max-w-[88rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-5 py-5 md:px-10 md:py-6 min-[860px]:gap-[clamp(1.5rem,5vw,4rem)] min-[860px]:px-6 lg:px-10 xl:px-16 2xl:gap-20 ${
          easyLive.signIn ? "xl:pt-1 xl:pb-7" : "xl:py-7"
        }`}
      >
        <div className="@container flex min-h-12 min-w-0 items-center min-[860px]:justify-end xl:min-h-[4.5rem]">
          <MobileMenu tone="dark" menu={menu} />
          <Suspense fallback={<NavGroupLinks entries={menu.left} label="Main" pathname={null} align="start" />}>
            <NavGroup entries={menu.left} label="Main" align="start" />
          </Suspense>
        </div>

        {/* Centre: the logo, exactly as supplied */}
        <Link href="/" aria-label="Sloane Street Auctions — home" className="block">
          <LogoLockup preload className="w-[7.25rem] md:w-[8.5rem] xl:w-[11rem] 2xl:w-[12rem]" />
        </Link>

        <div className="@container flex min-h-12 min-w-0 items-center justify-end gap-6 xl:min-h-[4.5rem] min-[860px]:justify-start">
          <Suspense fallback={<NavGroupLinks entries={menu.right} label="More" pathname={null} align="end" />}>
            <NavGroup entries={menu.right} label="More" align="end" />
          </Suspense>
          {easyLive.site && (
            <a
              href={easyLive.site}
              aria-label="Search lots and catalogues on our auction site"
              className={`inline-flex min-h-11 items-center px-1 xl:px-0 ${soft}`}
            >
              <SearchIcon size={19} className="xl:size-[21px]" />
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
