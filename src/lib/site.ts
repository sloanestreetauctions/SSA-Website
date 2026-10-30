/**
 * Site-wide settings. Wording, contact details and menus are edited in the
 * editing screen (/keystatic) and read from src/content; this file only
 * connects them to the pages they lead to.
 */
import { isPageOn, navigation, settings } from "@/content";

export const site = {
  name: "Sloane Street Auctions",
  shortDescription: "Fine art auctioneers in London",
  description: settings.siteDescription,
} as const;

export type NavItem = { label: string; href: string; description?: string };

const h = navigation.header;

/** The main menu. Addresses are fixed; the wording comes from the editor (Menus & footer). */
export const primaryNav: NavItem[] = [
  { href: "/auctions", ...h.auctions },
  { href: "/how-to-buy", ...h.howToBuy },
  { href: "/sell", ...h.sell },
  { href: "/stories", ...h.stories },
  { href: "/about", ...h.about },
  { href: "/contact", ...h.contact },
].filter((item) => isPageOn(item.href));

export const valuationButtonLabel = h.valuationButton;
export const signInLabel = h.signInLabel || "Sign in / Register";
