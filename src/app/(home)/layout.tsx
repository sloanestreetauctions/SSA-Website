import { SiteEnd } from "@/components/layout/SiteEnd";
import { SiteHeader } from "@/components/layout/SiteHeader";

/** Homepage: the same solid navy header as every other page, with the photograph below it. */
export default function HomeLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex flex-1 flex-col">
      <SiteHeader tone="light" />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteEnd />
    </div>
  );
}
