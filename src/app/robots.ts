import type { MetadataRoute } from "next";
import { searchEnginesWelcome } from "@/lib/indexing";
import { siteUrl } from "@/lib/structured-data";

/** /robots.txt — before launch (and on Preview copies) asks search engines to stay away; afterwards, lists the sitemap. */
export default function robots(): MetadataRoute.Robots {
  if (!searchEnginesWelcome()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/keystatic", "/api/", "/jewellery/appointments/cancel"] },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
