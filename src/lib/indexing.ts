import { siteUrl } from "@/lib/structured-data";

/**
 * Whether search engines are invited to list the site. Automatically "yes" only
 * on the live site once its real address (sloanestreetauctions.com) is attached
 * in Vercel and the site isn't password-protected; "no" on Preview copies, the
 * vercel.app address and your own computer. SEARCH_ENGINES=off keeps it hidden
 * even then. Takes effect on the next deployment.
 */
export function searchEnginesWelcome(): boolean {
  if (process.env.SEARCH_ENGINES?.trim().toLowerCase() === "off") return false;
  if (process.env.VERCEL_ENV !== "production" || process.env.SITE_PASSWORD?.trim()) return false;
  try {
    return /(^|\.)sloanestreetauctions\.com$/i.test(new URL(siteUrl).hostname);
  } catch {
    return false;
  }
}
