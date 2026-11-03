import type { MetadataRoute } from "next";
import { isPageOn } from "@/content";
import { siteUrl } from "@/lib/structured-data";

/**
 * /sitemap.xml — the list of pages Google is invited to visit. Pages switched
 * off in the editor are left out automatically.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    "/",
    "/auctions",
    "/auctions/past",
    "/how-to-buy",
    "/faqs",
    "/sell",
    "/private-sales",
    "/jewellery",
    "/valuation",
    "/about",
    "/about/team",
    "/contact",
    "/terms-and-conditions",
    "/privacy-policy",
  ];
  return pages.filter((p) => isPageOn(p)).map((p) => ({ url: `${siteUrl}${p === "/" ? "" : p}` }));
}
