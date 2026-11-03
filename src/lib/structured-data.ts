import { mapsQuery, settings } from "@/content";
import type { Sale } from "@/lib/sales";

/**
 * Information for Google, written in the standard schema.org format and read
 * from the editor's content, so it is never out of step with the page.
 */

/** The address of the website once it is live (used for links in previews and Google). */
export const siteUrl =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://www.sloanestreetauctions.com");

const DAYS: Record<string, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday",
};
const ORDER = Object.values(DAYS);

/** "Monday – Friday" → ["Monday", …, "Friday"]; "Saturday" → ["Saturday"]. Unrecognised wording is skipped. */
function dayRange(text: string): string[] {
  const found = text.toLowerCase().match(/mon|tue|wed|thu|fri|sat|sun/g)?.map((d) => DAYS[d]) ?? [];
  if (found.length === 2 && /[–-]|to/.test(text)) {
    const [a, b] = found.map((d) => ORDER.indexOf(d));
    return a <= b ? ORDER.slice(a, b + 1) : [];
  }
  return found;
}
/** "9:30 – 17:30" → ["09:30", "17:30"]. */
function timeRange(text: string): [string, string] | null {
  const t = text.match(/(\d{1,2})[:.](\d{2})\D+(\d{1,2})[:.](\d{2})/);
  return t ? [`${t[1].padStart(2, "0")}:${t[2]}`, `${t[3].padStart(2, "0")}:${t[4]}`] : null;
}

function postalAddress() {
  const lines = settings.addressLines;
  const postcode = lines.find((l) => /[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i.test(l));
  const street = lines[0];
  const locality = lines.find((l) => l !== street && l !== postcode) ?? "London";
  return { "@type": "PostalAddress", streetAddress: street, addressLocality: locality, postalCode: postcode, addressCountry: "GB" };
}

/** The house itself: name, address, phone, email, opening hours, Instagram. */
export function organisationData() {
  const hours = settings.openingHours
    .map((h) => {
      const days = dayRange(h.days);
      const times = timeRange(h.times);
      return days.length && times ? { "@type": "OpeningHoursSpecification", dayOfWeek: days, opens: times[0], closes: times[1] } : null;
    })
    .filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#house`,
    name: "Sloane Street Auctions",
    description: settings.siteDescription || undefined,
    url: siteUrl,
    logo: `${siteUrl}/brand/logo.png`,
    image: `${siteUrl}/opengraph-image.png`,
    telephone: settings.mainPhone,
    email: settings.generalEmail,
    address: postalAddress(),
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`,
    openingHoursSpecification: hours.length ? hours : undefined,
    sameAs: settings.instagram ? [settings.instagram] : undefined,
  };
}

/** Upcoming sales as events, so Google can show their dates. */
export function salesData(sales: readonly Sale[]) {
  return sales
    .filter((s) => s.date)
    .map((s) => ({
      "@context": "https://schema.org",
      "@type": "SaleEvent",
      name: s.title,
      description: s.description || undefined,
      startDate: s.time && /^\d{1,2}[:.]\d{2}$/.test(s.time.trim()) ? `${s.date}T${s.time.trim().replace(".", ":").padStart(5, "0")}` : s.date,
      eventStatus: "https://schema.org/EventScheduled",
      ...(s.kind === "timed" && s.closingDate ? { endDate: s.closingDate } : {}),
      eventAttendanceMode:
        s.kind === "timed"
          ? "https://schema.org/OnlineEventAttendanceMode"
          : s.liveLink
            ? "https://schema.org/MixedEventAttendanceMode"
            : "https://schema.org/OfflineEventAttendanceMode",
      location:
        s.kind === "timed" && s.catalogueLink
          ? { "@type": "VirtualLocation", url: s.catalogueLink }
          : { "@type": "Place", name: "Sloane Street Auctions", address: postalAddress() },
      organizer: { "@id": `${siteUrl}/#house` },
      url: s.catalogueLink || `${siteUrl}/auctions`,
      image: s.photo?.image ? `${siteUrl}${s.photo.image}` : `${siteUrl}/opengraph-image.png`,
    }));
}

/** Writes the data into the page for search engines (invisible to visitors). */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

