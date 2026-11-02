import { SiteEnd } from "@/components/layout/SiteEnd";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LiveBar } from "@/components/sales/LiveBar";
import { NotFoundContent } from "@/components/ui/NotFoundContent";

/** Addresses that don't exist anywhere on the site: the full page, with header and footer. */
export default function NotFound() {
  return (
    <>
      <LiveBar />
      <SiteHeader tone="light" />
      <main id="main" className="flex flex-1 flex-col">
        <NotFoundContent />
      </main>
      <SiteEnd />
    </>
  );
}
