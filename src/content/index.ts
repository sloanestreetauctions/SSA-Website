/**
 * ============================================================================
 *  SITE CONTENT
 * ============================================================================
 *  Every page's wording and editorial photographs, as saved by the editing
 *  screen (/keystatic) in src/content/pages/*.json. Pages read their words
 *  from here; nothing editable is written into the page code itself.
 *
 *  The shapes come straight from keystatic.config.ts, so the editor and the
 *  pages can never disagree about what a field is called.
 * ============================================================================
 */
import type { Entry } from "@keystatic/core/reader";
import type keystaticConfig from "../../keystatic.config";
import aboutJson from "./pages/about.json";
import calendarJson from "./pages/auction-calendar.json";
import highlightsJson from "./pages/sale-highlights.json";
import coversJson from "./pages/catalogue-covers.json";
import mailingListJson from "./pages/mailing-list.json";
import privateSalesJson from "./pages/private-sales.json";
import jewelleryJson from "./pages/jewellery.json";
import appointmentsJson from "./pages/jewellery-appointments.json";
import instagramJson from "./pages/instagram.json";
import faqJson from "./pages/faq.json";
import auctionsJson from "./pages/auctions.json";
import contactJson from "./pages/contact.json";
import homeJson from "./pages/home.json";
import howToBuyJson from "./pages/how-to-buy.json";
import navigationJson from "./pages/navigation.json";
import notFoundJson from "./pages/not-found.json";
import sellJson from "./pages/sell.json";
import settingsJson from "./pages/settings.json";
import storiesJson from "./pages/stories.json";
import teamJson from "./pages/team.json";
import valuationJson from "./pages/valuation.json";
import termsJson from "./pages/terms-and-conditions.json";
import privacyJson from "./pages/privacy-policy.json";

type Singletons = (typeof keystaticConfig)["singletons"];
type Content<K extends keyof Singletons> = Entry<Singletons[K]>;

/** Fill in fields the editor leaves out of the file when they are empty. */
const read = <K extends keyof Singletons>(json: unknown) => json as Content<K>;

export const calendar = read<"calendar">(calendarJson);
export const highlights = read<"highlights">(highlightsJson);
export const covers = read<"covers">(coversJson);
export const mailingList = read<"mailingList">(mailingListJson);
export const privateSalesPage = read<"privateSales">(privateSalesJson);
export const jewelleryPage = read<"jewellery">(jewelleryJson);
export const appointmentsPage = read<"appointments">(appointmentsJson);
export const instagram = read<"instagram">(instagramJson);
export const faqPage = read<"faq">(faqJson);
export const settings = read<"settings">(settingsJson);
export const navigation = read<"navigation">(navigationJson);
export const home = read<"home">(homeJson);
export const auctionsPage = read<"auctions">(auctionsJson);
export const sellPage = read<"sell">(sellJson);
export const howToBuyPage = read<"howToBuy">(howToBuyJson);
export const aboutPage = read<"about">(aboutJson);
export const teamPage = read<"team">(teamJson);
export const contactPage = read<"contact">(contactJson);
export const valuationPage = read<"valuation">(valuationJson);
export const storiesPage = read<"stories">(storiesJson);
export const notFoundPage = read<"notFound">(notFoundJson);
export const policyPages = {
  terms: read<"terms">(termsJson),
  privacy: read<"privacy">(privacyJson),
};

/** A photograph field from the editor: the picture (if added yet) and its description. */
export type EditorialPhoto = { image?: string | null; alt?: string | null; onWhite?: boolean };

/** True when a photograph has actually been added in the editor. */
export const hasPhoto = (p: EditorialPhoto | null | undefined): p is EditorialPhoto & { image: string } => Boolean(p?.image);

/* ------------------------------------------------------------ derived values */

/**
 * The policy page links from "Address, phone, email & hours". Links to this
 * website's own address are turned into links within the site, so they also
 * work on the preview and never send visitors to the old site.
 */
const ownAddress = /^https?:\/\/(www\.)?sloanestreetauctions\.com(\/[^?#]*)?/i;
const withinSite = (url: string) => {
  const m = url.match(ownAddress);
  return m ? (m[2] || "/").replace(/(.)\/$/, "$1") : url;
};
export const policyLinks = {
  conditionsOfSale: withinSite(settings.links.conditionsOfSale),
  privacy: withinSite(settings.links.privacy),
};

export const telHref = (n: string) => `tel:${n.replace(/[^\d+]/g, "")}`;

export const mapsQuery = settings.mapsQuery;
export const mapsEmbed = `https://maps.google.com/maps?q=${encodeURIComponent(mapsQuery)}&z=16&output=embed`;
export const mapsDirections = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery)}`;

/** Values that {tokens} in editable text are replaced with. */
export const tokens: Record<string, { text: string; href: string }> = {
  phone: { text: settings.mainPhone, href: telHref(settings.mainPhone) },
  ...(settings.otherPhone ? { phone2: { text: settings.otherPhone, href: telHref(settings.otherPhone) } } : {}),
  email: { text: settings.generalEmail, href: `mailto:${settings.generalEmail}` },
  accountsEmail: { text: settings.accountsEmail, href: `mailto:${settings.accountsEmail}` },
};

/** Split editor text into paragraphs at empty lines. */
export const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/** Whether a section is switched on in the editor ("Show this section"). */
export const isShown = (section: { show?: boolean } | null | undefined): boolean => Boolean(section) && section?.show !== false;

/** Easy Live addresses set in the Auction calendar (null until supplied). */
export const easyLive = {
  site: calendar.easyLive.site ?? null,
  signIn: calendar.easyLive.signIn ?? null,
};

/* ------------------------------------------------------------ page switches */

const PAGE_SWITCH: [prefix: string, key: "sell" | "privateSales" | "jewellery" | "howToBuy" | "faq" | "about" | "team" | "stories", exact?: boolean][] = [
  ["/faqs", "faq"],
  ["/sell", "sell"],
  ["/private-sales", "privateSales"],
  // Only the Jewellery page itself: the booking page under it (/jewellery/appointments) has its own switch.
  ["/jewellery", "jewellery", true],
  ["/how-to-buy", "howToBuy"],
  ["/about/team", "team"],
  ["/about", "about", true],
  ["/stories", "stories"],
];

/** The address of a person's card on Meet the Team, e.g. "Stephen Giles" → "stephen-giles" (/about/team#stephen-giles). */
export const personAnchor = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** False when the page a link leads to has been switched off in the editor (Menus & footer → Pages switched on). */
export function isPageOn(href: string): boolean {
  if (!href.startsWith("/")) return true;
  const path = href.split(/[?#]/)[0].replace(/\/$/, "") || "/";
  const pages = (navigation as { pages?: Partial<Record<string, boolean>> }).pages;
  for (const [prefix, key, exact] of PAGE_SWITCH) {
    const match = exact ? path === prefix : path === prefix || path.startsWith(`${prefix}/`);
    if (match) return pages?.[key] !== false && (key !== "faq" || (faqPage.questions ?? []).length > 0);
  }
  return true;
}
