import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: pages are prerendered where possible; data functions
  // opt in to caching with "use cache" (see src/lib/catalogue/index.ts).
  cacheComponents: true,
  partialPrefetching: true,

  // Removed pages: send any old links to the auctions page.
  async redirects() {
    return [
      { source: "/departments", destination: "/auctions", permanent: false },
      { source: "/departments/:slug", destination: "/auctions", permanent: false },
      // Catalogues, lots and search now live on the Easy Live auction site.
      { source: "/auctions/:slug+", destination: "/auctions", permanent: false },
      { source: "/search", destination: "/auctions", permanent: false },

      // Addresses from the previous website, so Google results and bookmarks keep working.
      // Permanent (308), so search engines move their ranking to the new page.
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/history", destination: "/about", permanent: true },
      { source: "/meet-the-team", destination: "/about/team", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/selling", destination: "/sell", permanent: true },
      { source: "/buying", destination: "/how-to-buy", permanent: true },
      { source: "/faqs", destination: "/how-to-buy", permanent: true },
      { source: "/collection---shipping", destination: "/how-to-buy", permanent: true },
      { source: "/auction-results", destination: "/auctions#past", permanent: true },
      { source: "/news", destination: "/stories", permanent: true },
      { source: "/news/:path*", destination: "/stories", permanent: true },
      // /register, /login, /catalogue/… and /auction-registration/… forward to the Easy Live
      // auction site: see src/app/(easy-live)/.
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],
    // Fine art deserves near-lossless photographs: 90 rather than the default 75.
    qualities: [90],
    // Only images inside /public are optimised for now. When Easy Live
    // provides an official image host, add it to `remotePatterns` here.
    localPatterns: [
      // Editor photographs carry a ?v= fingerprint so a replaced photo is never served stale
      // (see src/lib/photo-version.ts).
      { pathname: "/images/pages/**" },
      { pathname: "/brand/**", search: "" },
    ],
  },

  turbopack: {
    // This folder is the project: stops Next.js looking for (and warning about)
    // stray package files in folders above it, e.g. the home folder.
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
