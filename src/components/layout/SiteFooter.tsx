import Link from "next/link";
import { isPageOn, navigation, settings, telHref } from "@/content";
import { SmartLink } from "@/components/ui/RichText";
import { site } from "@/lib/site";
import { LogoLockup } from "./Logo";

/** The navy footer, identical on every page. */
export function SiteFooter() {
  return (
    <footer className="theme-dark bg-navy-deep text-ivory">
      <div className="shell grid gap-12 pt-12 pb-10 md:pt-[2.4rem] lg:grid-cols-12 lg:gap-10">
        {/* House */}
        <div className="lg:col-span-3">
          <Link href="/" aria-label="Sloane Street Auctions — home" className="inline-block">
            <LogoLockup className="w-[12.25rem]" />
          </Link>
          <address className="mt-5 text-[0.875rem] not-italic leading-snug text-ivory/70">
            {settings.addressLines[0]}
            <br />
            {settings.addressLines.slice(1).join(", ")}
            <a href={telHref(settings.mainPhone)} className="mt-1 block hover:text-ivory">
              {settings.mainPhone}
            </a>
          </address>
        </div>

        {/* Navigation */}
        <div className="grid gap-10 sm:grid-cols-[1fr_1.3fr_1fr] lg:col-span-6 lg:col-start-4 lg:gap-12">
          {navigation.footerColumns.map((col) => ({ ...col, links: col.links.filter((l) => isPageOn(l.href)) })).filter((col) => col.links.length > 0).map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="border-b border-ivory/15 pb-2 font-serif text-[1rem] text-ivory [font-variation-settings:'opsz'_18]">
                {col.heading}
              </h2>
              <ul className="mt-3">
                {col.links.map((item) => (
                  <li key={item.href + item.label}>
                    <SmartLink
                      href={item.href}
                      className="text-[0.8125rem] leading-[1.6] text-ivory/70 transition-colors hover:text-ivory"
                    >
                      {item.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Main action */}
        <div className="lg:col-span-3 lg:col-start-10 lg:justify-self-end">
          {navigation.footerButton && (
          <Link
            href="/valuation"
            className="inline-flex min-h-[3.75rem] items-center border border-ivory/40 px-10 text-[0.9375rem] font-[500] whitespace-nowrap transition-colors hover:bg-ivory hover:text-navy"
          >
            {navigation.footerButton}
          </Link>
          )}
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="shell flex flex-col gap-3 py-4 text-[0.8125rem] text-ivory/55 md:flex-row md:items-center md:justify-between">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>© {site.name}</li>
            <li>
              <a href={settings.links.conditionsOfSale} className="hover:text-ivory">
                Conditions of Sale
              </a>
            </li>
            <li>
              <a href={settings.links.privacy} className="hover:text-ivory">
                Privacy
              </a>
            </li>
            <li>
              <a href={settings.links.shipping} className="hover:text-ivory">
                Shipping
              </a>
            </li>
          </ul>
          {navigation.footerNote && <p>{navigation.footerNote}</p>}
        </div>
      </div>
    </footer>
  );
}
