import type { Metadata, Viewport } from "next";
import { site } from "@/lib/site";
import { hanken, newsreader } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${site.name} — ${site.shortDescription}`, template: `%s — ${site.name}` },
  description: site.description,
  // Keep the prototype out of search engines until launch.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#051327",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${newsreader.variable} ${hanken.variable}`}>
      <body className="flex min-h-dvh flex-col">
        {children}
      </body>
    </html>
  );
}
