import { SiteEnd } from "@/components/layout/SiteEnd";
import { SiteHeader } from "@/components/layout/SiteHeader";

/** Content pages: warm ivory header with the navy logo. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader tone="light" />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteEnd />
    </>
  );
}
