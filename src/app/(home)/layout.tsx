import { SiteEnd } from "@/components/layout/SiteEnd";
import { SiteHeader } from "@/components/layout/SiteHeader";

/**
 * Homepage: the header floats over the dark photographic hero.
 * The wrapper is the positioning context, so the header sits at the top of
 * the hero (below the prototype notice), not the top of the browser window.
 */
export default function HomeLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex flex-1 flex-col">
      <SiteHeader tone="dark" />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteEnd />
    </div>
  );
}
