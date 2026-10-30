import { notFound } from "next/navigation";
import { isPageOn } from "@/content";
import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { PhotoToCome } from "@/components/ui/PhotoToCome";
import { serifText } from "@/components/ui/type";
import { isShown, paragraphs, teamPage } from "@/content";

const c = teamPage;

export const metadata: Metadata = { title: c.seo.title, description: c.seo.description };

/**
 * MEET THE TEAM — built to the approved Direction C mockup.
 * Names, job titles and portraits are added in the editing screen (Meet the Team).
 * Nothing here is invented.
 */
export default function TeamPage() {
  if (!isPageOn("/about/team")) notFound();
  return (
    <>
      <div className="shell pt-8">
        <Breadcrumbs items={[{ label: "About", href: "/about" }, { label: c.title }]} />
        <h1 className="mt-10 font-serif text-[3rem] leading-[1.02] font-[350] tracking-[-0.02em] text-navy [font-variation-settings:'opsz'_72] md:text-[4.25rem] xl:text-[5rem]">
          {c.title}
        </h1>
        {c.intro && (
          <div className={`mt-5 max-w-[46rem] space-y-4 ${serifText} text-[1.3125rem] leading-[1.5] text-ink-soft`}>
            {paragraphs(c.intro).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        )}
      </div>

      <section aria-label="Our team" className="shell pt-10 pb-14 md:pt-12 md:pb-16">
        {/* The featured person: a wide photograph across the page, name and title beneath */}
        {isShown(c.featured) && (
          <figure className="mb-12 md:mb-14">
            <PhotoToCome photo={c.featured.photo} priority className="mb-4 aspect-[16/9]" sizes="(min-width: 1600px) 1400px, 100vw" />
            <figcaption>
              <Person name={c.featured.name} role={c.featured.role} email={c.featured.email} />
            </figcaption>
          </figure>
        )}

        {/* Everyone else, four to a row */}
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {c.members.map((member, i) => (
            <li key={i}>
              <PhotoToCome photo={member.photo} className="mb-4 aspect-[4/5]" sizes="(min-width: 768px) 24vw, 50vw" />
              <Person name={member.name} role={member.role} email={member.email} />
            </li>
          ))}
        </ul>

        {(c.primaryButton || c.secondaryButton) && (
        <div className="mt-14 flex flex-wrap items-center gap-6 border-t border-line pt-10">
          {c.primaryButton && (
          <Link
            href="/contact"
            className={`group inline-flex min-h-16 items-center gap-4 bg-navy-deep px-8 ${serifText} text-[1.1875rem] text-ivory hover:bg-navy-soft`}
          >
            {c.primaryButton} <Arrow />
          </Link>
          )}
          {c.secondaryButton && (
          <Link
            href="/valuation"
            className={`${serifText} border-b border-ink/40 pb-0.5 text-[1.1875rem] hover:border-ink`}
          >
            {c.secondaryButton}
          </Link>
          )}
        </div>
        )}
      </section>
    </>
  );
}

/** Name, job title and (if given) email, as on the current website's team page. */
function Person({ name, role, email }: { name: string; role: string; email?: string }) {
  return (
    <>
      {name && <p className="font-serif text-[1.375rem] leading-snug [font-variation-settings:'opsz'_36]">{name}</p>}
      {role && <p className={`${serifText} text-[1.0625rem] leading-snug text-ink-soft`}>{role}</p>}
      {email && (
        <a
          href={`mailto:${email}`}
          className={`mt-3 inline-flex max-w-full items-center gap-2.5 break-all ${serifText} text-[1.0625rem] text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink`}
        >
          <svg aria-hidden="true" width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.2" className="shrink-0">
            <rect x="0.6" y="0.6" width="16.8" height="12.8" />
            <path d="M1 1.2l8 6.3 8-6.3" />
          </svg>
          {email}
        </a>
      )}
    </>
  );
}
