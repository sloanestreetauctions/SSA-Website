import type { Metadata } from "next";
import { site } from "@/lib/site";

/**
 * Title, description and canonical address for a page, from its editor
 * settings ("Google and the browser tab"). When the description is left empty
 * a sensible one is used instead of none. The canonical address tells Google
 * which address is the real one (e.g. not the vercel.app preview), and the
 * sharing card (WhatsApp, email…) shows the page's own title.
 */
export function pageMetadata(path: string, seo: { title: string; description?: string | null }, fallbackDescription?: string): Metadata {
  const description = seo.description?.trim() || fallbackDescription || site.description;
  return {
    title: seo.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en_GB",
      url: path,
      title: `${seo.title} — ${site.name}`,
      description,
    },
  };
}
