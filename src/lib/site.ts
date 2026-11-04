/**
 * Site-wide settings. Wording, contact details and menus are edited in the
 * editing screen (/keystatic) and read from src/content; this file only
 * connects them to the pages they lead to.
 */
import { isPageOn, navigation, policyLinks, settings } from "@/content";

export const site = {
  name: "Sloane Street Auctions",
  shortDescription: "Fine art auctioneers in London",
  description: settings.siteDescription,
} as const;

export type NavItem = { label: string; href: string; description?: string };

const h = navigation.header;

/** One link inside a drop-down. */
export type MenuLink = { label: string; href: string };
/** A top-level menu entry: either a plain link, or a drop-down with its own links. */
export type MenuEntry = { label: string; description?: string; href?: string; children?: MenuLink[] };
export type SiteMenu = { left: MenuEntry[]; right: MenuEntry[] };

/**
 * The header menu, split either side of the logo:
 *   Auctions ▾ · Buying ▾ · Selling ▾  |  Private Sales · About ▾ · Contact
 * Built on the server. Pages switched off in the editor are left out, and a
 * drop-down with nothing left in it disappears. "Book a Jewellery Valuation" only
 * appears once the booking page is switched on (`bookingLive`).
 */
export function siteMenu({ bookingLive }: { bookingLive: boolean }): SiteMenu {
  const on = (links: (MenuLink | false)[]) => links.filter((l): l is MenuLink => Boolean(l) && isPageOn((l as MenuLink).href));
  const group = (label: string, description: string | undefined, links: (MenuLink | false)[]): MenuEntry | null => {
    const children = on(links);
    return children.length ? { label, description, children } : null;
  };
  const link = (label: string, href: string, description?: string): MenuEntry | null =>
    isPageOn(href) ? { label, href, description } : null;
  const keep = (entries: (MenuEntry | null)[]) => entries.filter((e): e is MenuEntry => e !== null);

  return {
    left: keep([
      group(h.auctions.label, h.auctions.description, [
        { label: "Upcoming Auctions", href: "/auctions" },
        { label: "Past Auctions", href: "/auctions/past" },
      ]),
      group(h.buyingLabel || "Buying", h.howToBuy.description, [
        { label: h.howToBuy.label || "How to Buy", href: "/how-to-buy" },
        { label: "Conditions of Sale", href: policyLinks.conditionsOfSale },
      ]),
      group(h.sellingLabel || "Selling", h.sell.description, [
        { label: h.sell.label || "Sell With Us", href: "/sell" },
        { label: "Request a Valuation", href: "/valuation" },
        bookingLive && { label: "Book a Jewellery Valuation", href: "/jewellery/appointments" },
      ]),
    ]),
    right: keep([
      link(h.privateSales?.label || "Private Sales", "/private-sales", h.privateSales?.description),
      group(h.about.label, h.about.description, [
        { label: "About Us", href: "/about" },
        { label: "Meet the Team", href: "/about/team" },
      ]),
      link(h.contact.label, "/contact", h.contact.description),
    ]),
  };
}

export const valuationButtonLabel = h.valuationButton;
export const signInLabel = h.signInLabel || "Sign in / Register";
