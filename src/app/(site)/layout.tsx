import { SiteEnd } from "@/components/layout/SiteEnd";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ViewTransition } from "react";
import { LiveBar } from "@/components/sales/LiveBar";

/** Content pages: warm ivory header with the navy logo. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LiveBar />
      <SiteHeader tone="light" />
      {/* Moving between pages: the page content fades softly across (see "Page transitions" in globals.css). */}
      <ViewTransition name="page" default="page">
        <main id="main" className="flex-1">
          {children}
        </main>
      </ViewTransition>
      <SiteEnd />
    </>
  );
}
