import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Editorial";
import { notFoundPage as c } from "@/content";

/** The "page not found" message (wording from the editor). */
export function NotFoundContent() {
  return (
    <div className="shell flex-1 py-28 md:py-40">
      {c.eyebrow && <Eyebrow className="mb-6">{c.eyebrow}</Eyebrow>}
      <h1 className="type-display max-w-3xl text-navy">{c.title}</h1>
      {c.text && <p className="type-lede mt-6 max-w-xl text-ink-soft">{c.text}</p>}
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <ButtonLink href="/auctions">Browse auctions</ButtonLink>
        <ButtonLink href="/" variant="quiet" arrow>
          Home
        </ButtonLink>
      </div>
    </div>
  );
}
