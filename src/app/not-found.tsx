import { SiteEnd } from "@/components/layout/SiteEnd";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Editorial";
import { notFoundPage as c } from "@/content";

export default function NotFound() {
  return (
    <>
      <SiteHeader tone="light" />
      <main id="main" className="shell flex-1 py-28 md:py-40">
        {c.eyebrow && <Eyebrow className="mb-6">{c.eyebrow}</Eyebrow>}
        <h1 className="type-display max-w-3xl text-navy">{c.title}</h1>
        {c.text && <p className="type-lede mt-6 max-w-xl text-ink-soft">{c.text}</p>}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <ButtonLink href="/auctions">Browse auctions</ButtonLink>
          <ButtonLink href="/" variant="quiet" arrow>
            Home
          </ButtonLink>
        </div>
      </main>
      <SiteEnd />
    </>
  );
}
