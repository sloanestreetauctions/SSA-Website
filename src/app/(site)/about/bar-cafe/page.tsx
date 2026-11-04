import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { ObjectPhoto } from "@/components/ui/PhotoToCome";
import { RichText } from "@/components/ui/RichText";
import { SplitHeader } from "@/components/ui/SplitHeader";
import { InstagramIcon } from "@/components/ui/Icons";
import { sectionTitle, serifText } from "@/components/ui/type";
import { barCafePage as c, hasPhoto, isPageOn, paragraphs, telHref } from "@/content";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = pageMetadata("/about/bar-cafe", c.seo, "The Sloane Street Auctions Bar & Cafe, next door to our Chelsea saleroom: opening hours and menu.");

const inkLink = "text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink";

/**
 * BAR & CAFE — the house's bar & cafe next door: the illustration, opening
 * hours, the menu (typed in and/or a PDF) and how to find it. Everything is
 * edited in the editor (Pages → Bar & Cafe). The page appears under About once
 * opening hours or a menu have been added.
 */
export default function BarCafePage() {
  if (!isPageOn("/about/bar-cafe")) notFound();
  const { hero, hours, menu, visit } = c;
  const days = hours.days ?? [];
  const sections = (menu.sections ?? []).filter((s) => (s.items ?? []).length > 0);
  const addressLines = (visit.address ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const hasVisit = addressLines.length > 0 || visit.phone || visit.email || visit.instagram || visit.note;

  return (
    <>
      <SplitHeader
        columns="wide"
        breadcrumbs={<Breadcrumbs items={[{ label: "About", href: "/about" }, { label: hero.title }]} />}
        media={
          hasPhoto(hero.illustration) && (
            <div className="flex h-full items-center lg:absolute lg:inset-0">
              <ObjectPhoto photo={hero.illustration} priority sizes="(min-width: 1024px) 50vw, 100vw" frameClassName="w-full aspect-square" />
            </div>
          )
        }
      >
        {hero.eyebrow && <p className="type-eyebrow mb-5 text-ink-soft">{hero.eyebrow}</p>}
        <h1 className="font-serif text-[3rem] leading-[1.02] font-[350] tracking-[-0.02em] text-navy [font-variation-settings:'opsz'_72] md:text-[4.25rem] xl:text-[4.75rem]">
          {hero.title}
        </h1>
        {hero.intro && (
          <div className={`mt-7 max-w-[38rem] space-y-4 ${serifText} text-[1.3125rem] leading-[1.5] text-ink-soft`}>
            {paragraphs(hero.intro).map((p) => (
              <p key={p}>
                <RichText text={p} linkClassName={inkLink} />
              </p>
            ))}
          </div>
        )}

        {days.length > 0 && (
          <div className="mt-10 max-w-[36rem] border-t border-line pt-6">
            {hours.title && <h2 className="mb-2 font-serif text-[1.75rem] [font-variation-settings:'opsz'_36]">{hours.title}</h2>}
            <dl className={`${serifText} text-[1.375rem]`}>
              {days.map(({ days: day, times }, i) => (
                <div key={`${day}-${i}`} className="grid grid-cols-[1fr_auto] gap-6 py-0.5">
                  <dt className="text-ink-soft">{day}</dt>
                  <dd className="text-ink-soft tabular-nums">{times}</dd>
                </div>
              ))}
            </dl>
            {hours.note && <p className={`mt-3 ${serifText} text-[1.0625rem] text-ink-soft`}>{hours.note}</p>}
          </div>
        )}
      </SplitHeader>

      {/* ============================================================== MENU */}
      {(sections.length > 0 || menu.file) && (
        <section aria-labelledby="menu-title" className="shell py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
            <div>
              <h2 id="menu-title" className={sectionTitle}>
                {menu.title || "Menu"}
              </h2>
              {menu.intro && <p className={`mt-3 max-w-[40rem] ${serifText} text-[1.25rem] text-ink-soft`}>{menu.intro}</p>}
            </div>
            {menu.file && (
              <a
                href={menu.file}
                className="inline-flex min-h-11 items-center gap-2.5 font-sans text-[0.9375rem] text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink"
              >
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M8 1.5v9M4.5 7 8 10.5 11.5 7M2 13.5h12" />
                </svg>
                {menu.fileLabel || "Download the menu (PDF)"}
              </a>
            )}
          </div>

          {sections.length > 0 && (
            <div className="mt-10 grid gap-x-16 gap-y-12 md:grid-cols-2">
              {sections.map((section, si) => (
                <div key={`${section.title}-${si}`}>
                  <h3 className="type-label text-gold-ink">{section.title}</h3>
                  {section.description && <p className={`mt-3 ${serifText} text-[1.0625rem] leading-[1.55] text-ink-soft`}>{section.description}</p>}
                  <ul className={`mt-4 divide-y divide-line ${serifText}`}>
                    {(section.items ?? []).map((item, ii) => (
                      <li key={`${item.name}-${ii}`} className="grid grid-cols-[1fr_auto] gap-x-6 py-3">
                        <span className="text-[1.25rem] text-ink">{item.name}</span>
                        {item.price && <span className="text-[1.25rem] text-ink tabular-nums">{item.price}</span>}
                        {item.description && <span className="col-span-2 mt-0.5 text-[1.0625rem] leading-snug text-ink-soft">{item.description}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {menu.note && (
            <div className={`mt-12 max-w-[46rem] space-y-2 border-t border-line pt-6 ${serifText} text-[1rem] leading-[1.55] text-ink-soft`}>
              {paragraphs(menu.note).map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= FIND US */}
      {hasVisit && (
        <section aria-labelledby="visit-title" className="shell pb-20 md:pb-24">
          <div className="border-t border-line pt-10">
            <h2 id="visit-title" className="font-serif text-[1.75rem] [font-variation-settings:'opsz'_36]">
              {visit.title || "Find us"}
            </h2>
            <div className={`mt-4 grid gap-8 md:grid-cols-2 ${serifText} text-[1.25rem] leading-snug`}>
              {addressLines.length > 0 && (
                <address className="not-italic text-ink">
                  {addressLines.map((l, i) => (
                    <span key={`${l}-${i}`} className="block">
                      {l}
                    </span>
                  ))}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLines.join(", "))}`}
                    target="_blank"
                    rel="noopener"
                    className={`mt-1 inline-block text-[1.0625rem] text-ink-soft ${inkLink}`}
                  >
                    Open in Google Maps <span aria-hidden="true">→</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </address>
              )}
              {(visit.phone || visit.email || visit.instagram) && (
                <ul className="space-y-1.5">
                  {visit.phone && (
                    <li>
                      <a href={telHref(visit.phone)} className={`whitespace-nowrap ${inkLink}`}>
                        {visit.phone}
                      </a>
                    </li>
                  )}
                  {visit.email && (
                    <li>
                      <a href={`mailto:${visit.email}`} className={`break-all ${inkLink}`}>
                        {visit.email}
                      </a>
                    </li>
                  )}
                  {visit.instagram && (
                    <li>
                      <a href={visit.instagram} className={`inline-flex items-center gap-2 ${inkLink}`}>
                        <InstagramIcon size={20} /> Instagram
                      </a>
                    </li>
                  )}
                </ul>
              )}
            </div>
            {visit.note && (
              <p className={`mt-6 max-w-[40rem] ${serifText} text-[1.1875rem] text-ink-soft`}>
                <RichText text={visit.note} linkClassName={inkLink} />
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
