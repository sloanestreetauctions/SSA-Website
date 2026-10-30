import { notFound } from "next/navigation";
import { isPageOn } from "@/content";
import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { ObjectPhoto, PhotoToCome } from "@/components/ui/PhotoToCome";
import { RichText } from "@/components/ui/RichText";
import { SplitHeader, splitMedia } from "@/components/ui/SplitHeader";
import { aboutPage, hasPhoto, isShown, paragraphs } from "@/content";
import { serifText } from "@/components/ui/type";

const c = aboutPage;

export const metadata: Metadata = { title: c.seo.title, description: c.seo.description };

/**
 * ABOUT — split opening, a wide showroom photograph, a navy band of short
 * statements, and "Visit us" with the showroom illustration. Any of these can
 * be removed or hidden in the editor; the page closes up around them.
 */
export default function AboutPage() {
  if (!isPageOn("/about")) notFound();
  const { hero, statements, visit } = c;
  const teamOn = isPageOn("/about/team");
  return (
    <>
      <SplitHeader
        columns="narrow"
        breadcrumbs={<Breadcrumbs items={[{ label: "About" }]} />}
        media={hasPhoto(hero.photo) && <PhotoToCome photo={hero.photo} priority className={splitMedia} />}
      >
        <h1 className="font-serif text-[2.75rem] leading-[1.05] font-[350] tracking-[-0.02em] text-navy [font-variation-settings:'opsz'_72] md:text-[3.75rem] xl:text-[4.25rem]">
          {hero.title}
        </h1>
        {hero.text && (
          <div className={`mt-6 max-w-[44rem] space-y-4 ${serifText} text-[1.3125rem] leading-[1.55] text-ink-soft`}>
            {paragraphs(hero.text).map((p) => (
              <p key={p}>
                <RichText text={p} linkClassName="text-ink underline decoration-ink/40 underline-offset-4" />
              </p>
            ))}
          </div>
        )}
        {hero.linkLabel && teamOn && (
          <Link
            href="/about/team"
            className={`group mt-8 inline-flex items-center gap-3 self-start border-b border-ink/40 pb-0.5 ${serifText} text-[1.1875rem] hover:border-ink`}
          >
            {hero.linkLabel} <Arrow />
          </Link>
        )}
      </SplitHeader>

      {hasPhoto(c.interiorPhoto) && (
        <div className="shell pt-12 md:pt-16">
          <PhotoToCome photo={c.interiorPhoto} className="aspect-[2.6]" sizes="(min-width: 1600px) 1408px, 100vw" />
        </div>
      )}

      {statements.length > 0 && (
        <section aria-label="Our approach, expertise and clients" className="theme-dark mt-12 bg-navy text-ivory md:mt-16">
          <ul
            className={`shell grid gap-10 py-14 md:gap-0 md:py-16 ${
              statements.length === 1 ? "" : statements.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
            }`}
          >
            {statements.map((s, i) => (
              <li key={`${s.title}-${i}`} className="md:px-10 md:first:pl-0 md:[&+li]:border-l md:[&+li]:border-ivory/20">
                <h2 className="font-serif text-[1.75rem] [font-variation-settings:'opsz'_36]">{s.title}</h2>
                {s.body && <p className={`mt-3 ${serifText} text-[1.1875rem] leading-[1.55] text-ivory/80`}>{s.body}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {isShown(visit) && (
        <section
          aria-label={visit.title || "Visit us"}
          className={`shell grid items-center gap-10 py-16 md:py-20 lg:gap-16 xl:gap-24 ${hasPhoto(visit.illustration) ? "lg:grid-cols-[1.35fr_1fr]" : ""}`}
        >
          <ObjectPhoto
            photo={visit.illustration}
            sizes="(min-width: 1600px) 820px, (min-width: 1024px) 55vw, 100vw"
            frameClassName="aspect-[960/545]"
          />
          <div className="flex flex-col items-start gap-8">
            {(visit.title || visit.text) && (
              <div>
                {visit.title && (
                  <h2 className="font-serif text-[2rem] leading-tight [font-variation-settings:'opsz'_48] md:text-[2.5rem]">{visit.title}</h2>
                )}
                {visit.text && (
                  <p className={`mt-2 ${serifText} text-[1.25rem] text-ink-soft`}>
                    <RichText text={visit.text} linkClassName="text-ink underline decoration-ink/40 underline-offset-4" />
                  </p>
                )}
              </div>
            )}
            {((visit.primaryButton && teamOn) || visit.secondaryButton) && (
              <div className="flex flex-wrap gap-4">
                {visit.primaryButton && teamOn && (
                  <Link
                    href="/about/team"
                    className={`group inline-flex min-h-16 items-center gap-4 bg-navy-deep px-8 ${serifText} text-[1.1875rem] text-ivory hover:bg-navy-soft`}
                  >
                    {visit.primaryButton} <Arrow />
                  </Link>
                )}
                {visit.secondaryButton && (
                  <Link
                    href="/contact"
                    className={`inline-flex min-h-16 items-center border border-ink/30 px-8 ${serifText} text-[1.1875rem] hover:border-navy`}
                  >
                    {visit.secondaryButton}
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
