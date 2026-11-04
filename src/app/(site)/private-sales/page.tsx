import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { ObjectPhoto, PhotoToCome } from "@/components/ui/PhotoToCome";
import { RichText } from "@/components/ui/RichText";
import { SplitHeader, splitMedia } from "@/components/ui/SplitHeader";
import { hasPhoto, isPageOn, isShown, paragraphs, privateSalesPage, settings, telHref } from "@/content";

const c = privateSalesPage;

export const metadata: Metadata = pageMetadata("/private-sales", c.seo);

const serif = "font-serif [font-variation-settings:'opsz'_18]";
const inkLink = "text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink";

/**
 * PRIVATE SALES — the Private Sales department: an opening with photograph,
 * a contact box with its own telephone and email, and an optional "How it
 * works" list. Everything is edited in the editor (Pages → Private Sales).
 */
export default function PrivateSalesPage() {
  if (!isPageOn("/private-sales")) notFound();
  const { hero, contact, steps } = c;
  const email = contact.email || settings.generalEmail;
  const subject = encodeURIComponent("Private sales enquiry");

  return (
    <>
      <SplitHeader
        columns="wide"
        breadcrumbs={<Breadcrumbs items={[{ label: hero.eyebrow || hero.title }]} />}
        media={
          hasPhoto(hero.illustration) ? (
            /* The shop illustration, shown whole, its white blended into the page (as on the homepage). */
            <div className="flex h-full items-center lg:absolute lg:inset-0">
              <ObjectPhoto
                photo={{ ...hero.illustration, onWhite: true }}
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                frameClassName="w-full aspect-[16/9]"
              />
            </div>
          ) : (
            hasPhoto(hero.photo) && <PhotoToCome photo={hero.photo} priority className={splitMedia} />
          )
        }
      >
        {hero.eyebrow && hero.eyebrow !== hero.title && <p className="type-eyebrow mb-5 text-ink-soft">{hero.eyebrow}</p>}
        <h1 className="font-serif text-[3.25rem] leading-none font-[350] tracking-[-0.02em] text-navy [font-variation-settings:'opsz'_72] md:text-[4.5rem] xl:text-[5.25rem]">
          {hero.title}
        </h1>
        {hero.text && (
          <div className={`mt-7 max-w-[38rem] space-y-4 ${serif} text-[1.3125rem] leading-[1.5] text-ink-soft`}>
            {paragraphs(hero.text).map((p) => (
              <p key={p}>
                <RichText text={p} linkClassName={inkLink} />
              </p>
            ))}
          </div>
        )}

        {isShown(contact) && (
          <div className="mt-10 max-w-[38rem] border-t border-line pt-7">
            {contact.title && <h2 className="font-serif text-[1.75rem] leading-tight [font-variation-settings:'opsz'_36]">{contact.title}</h2>}
            {contact.text && <p className={`mt-2 ${serif} text-[1.1875rem] leading-snug text-ink-soft`}>{contact.text}</p>}
            {contact.address && (
              <address className={`mt-4 not-italic ${serif} text-[1.25rem] leading-snug text-ink`}>
                {contact.address.split("\n").map((l, i) => (
                  <span key={`${l}-${i}`} className="block">
                    {l}
                  </span>
                ))}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address.replace(/\n/g, ", "))}`}
                  className={`mt-1 inline-block text-[1.0625rem] text-ink-soft ${inkLink}`}
                >
                  Open in Google Maps <span aria-hidden="true">→</span>
                </a>
              </address>
            )}
            <ul className={`mt-4 space-y-1 ${serif} text-[1.25rem]`}>
              {contact.phone && (
                <li>
                  <a href={telHref(contact.phone)} className={`whitespace-nowrap ${inkLink}`}>
                    {contact.phone}
                  </a>
                </li>
              )}
              <li>
                <a href={`mailto:${email}?subject=${subject}`} className={`break-all ${inkLink}`}>
                  {email}
                </a>
              </li>
            </ul>
            {contact.buttonLabel && (
              <a
                href={`mailto:${email}?subject=${subject}`}
                className={`mt-7 inline-flex min-h-16 items-center bg-navy-deep px-8 ${serif} text-[1.1875rem] text-ivory transition-colors hover:bg-navy-soft`}
              >
                {contact.buttonLabel}
              </a>
            )}
          </div>
        )}
      </SplitHeader>

      {isShown(steps) && steps.steps.length > 0 && (
        <section aria-label={steps.title || "How it works"} className="shell py-16 md:py-20">
          {steps.title && (
            <h2 className="font-serif text-[2.5rem] leading-tight font-[380] [font-variation-settings:'opsz'_60] md:text-[3.25rem]">{steps.title}</h2>
          )}
          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-12">
            {steps.steps.map((step, i) => (
              <li key={`${step.title}-${i}`} className="border-t border-line pt-6">
                <p className="font-sans text-[0.875rem] tracking-[0.14em] text-ink-soft tabular-nums">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 font-serif text-[1.625rem] leading-snug [font-variation-settings:'opsz'_36]">{step.title}</h3>
                {step.body && <p className={`mt-2 ${serif} text-[1.1875rem] leading-[1.5] text-ink-soft`}>{step.body}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
