/**
 * Removes code files that earlier versions of the website had but this one no
 * longer uses (an update zip can add and replace files, not delete them).
 * Only the exact paths listed here are removed (old code and the prototype's
 * demonstration images) — never your photographs (public/images/pages),
 * wording (src/content/pages) or anything else. Safe to run any number of
 * times; runs automatically before `npm run dev` and `npm run build`.
 */
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

const OLD_CODE = [
  // Replaced by the Easy Live auction site (catalogues, lots, search) — October 2026
  "src/app/(site)/auctions/[auctionSlug]",
  "src/app/(site)/search",
  "src/components/catalogue",
  "src/components/lot",
  "src/lib/catalogue",
  "src/content/images.ts",
  "src/components/ui/EasyLiveAction.tsx",
  // Demonstration images from the prototype, no longer shown anywhere — October 2026
  "public/demo",
  "public/images/lots",
  "public/images/site",
];

for (const rel of OLD_CODE) {
  const path = join(ROOT, rel);
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    console.log(`Removed old files no longer used: ${rel}`);
  }
}
