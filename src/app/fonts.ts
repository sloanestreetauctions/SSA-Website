import localFont from "next/font/local";

/**
 * Typefaces are self-hosted from /src/fonts (both SIL Open Font Licence;
 * licence files sit beside the font files). Self-hosting keeps the site fast
 * and avoids sending visitors' requests to third-party font servers.
 *
 * Newsreader — editorial serif with an optical-size axis, used for headings,
 * artwork titles and long-form reading.
 * Hanken Grotesk — quiet, highly legible sans-serif for navigation, labels,
 * prices and interface text.
 */
export const newsreader = localFont({
  src: [
    { path: "../fonts/newsreader-latin-opsz-normal.woff2", style: "normal", weight: "200 800" },
    { path: "../fonts/newsreader-latin-opsz-italic.woff2", style: "italic", weight: "200 800" },
  ],
  variable: "--font-newsreader",
  display: "swap",
});

export const hanken = localFont({
  src: [{ path: "../fonts/hanken-grotesk-latin-wght-normal.woff2", style: "normal", weight: "100 900" }],
  variable: "--font-hanken",
  display: "swap",
});
