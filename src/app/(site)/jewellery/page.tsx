import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Arrow } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { ObjectPhoto, PhotoToCome } from "@/components/ui/PhotoToCome";
import { RichText } from "@/components/ui/RichText";
import { SplitHeader } from "@/components/ui/SplitHeader";
import { Reel } from "@/components/sales/Reel";
import { FaqPrompt } from "@/components/ui/FaqPrompt";
import { hasPhoto, isPageOn, isShown, jewelleryPage as c, paragraphs, personAnchor, teamPage, telHref } from "@/content";
import { JEWELLERY_APPOINTMENTS_PATH, jewelleryBookingLive } from "@/lib/booking/status";
import { routes } from "@/lib/routes";

export const metadata: Metadata = pageMetadata("/jewellery", c.seo);

const serif = "font-serif [font-variation-settings:'opsz'_18]";
const inkLink = "text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink";

/**
 * JEWELLERY — the specialist department: an opening with a photograph, the
 * specialist (once a name is added), a row of photographs from past sales,
 * and a panel leading to the valuation form. All edited in the editor
 * (Pages → Jewellery).
 */
export default function JewelleryPage() {
  if (!isPageOn("/jewellery")) {
    // Switched off: anyone arriving here (an old link, a shortened address) goes to the booking page instead.
    if (jewelleryBookingLive()) redirect(JEWELLERY_APPOINTMENTS_PATH);
    notFound();
  }
  const { hero, specialist, gallery, valuation } = c;
  const photos = (gallery.items ?? []).filter((item) => hasPhoto(item.photo));
  // The specialist's card on Meet the Team (same name), if that page is on and they're on it.
  const onTeamPage =
    specialist.name && isPageOn("/about/team") && teamPage.members.some((m) => m.name?.trim() === specialist.name?.trim());
  const teamHref = specialist.name ? `/about/team#${personAnchor(specialist.name)}` : "";
  const booking = jewelleryBookingLive() && specialist.bookingLabel;

  return (
    <>
      <SplitHeader
        breadcrumbs={<Breadcrumbs items={[{ label: hero.title }]} />}
        media={
          hasPhoto(hero.photo) && (
            <div className="flex h-full items-center justify-center lg:absolute lg:inset-0">
              <ObjectPhoto photo={hero.photo} priority sizes="(min-width: 1024px) 45vw, 100vw" frameClassName="w-full aspect-[4/3]" />
            </div>
          )
        }
      >
        {hero.eyebrow && <p className="type-eyebrow mb-5 text-ink-soft">{hero.eyebrow}</p>}
        <h1 className="font-serif text-[3.25rem] leading-none font-[350] tracking-[-0.02em] text-navy [font-variation-settings:'opsz'_72] md:text-[4.5rem] xl:text-[5.25rem]">
          {hero.title}
        </h1>
        {hero.text && (
          <div className={`mt-7 max-w-[36rem] space-y-4 ${serif} text-[1.3125rem] leading-[1.5] text-ink-soft`}>
            {paragraphs(hero.text).map((p) => (
              <p key={p}>
                <RichText text={p} linkClassName={inkLink} />
              </p>
            ))}
          </div>
        )}
        {hero.buttonLabel && (
          <Link
            href={routes.valuation}
            className={`group mt-9 inline-flex min-h-16 items-center gap-4 self-start bg-navy-deep px-8 ${serif} text-[1.1875rem] text-ivory transition-colors hover:bg-navy-soft`}
          >
            {hero.buttonLabel} <Arrow />
          </Link>
        )}
      </SplitHeader>

      {/* ============================================================ SPECIALIST */}
      {isShown(specialist) && specialist.name && (
        <section aria-labelledby="specialist-title" className="shell py-16 md:py-24">
          <div className={`grid items-center gap-10 lg:gap-16 ${hasPhoto(specialist.photo) ? "md:grid-cols-[minmax(0,22rem)_1fr]" : ""}`}>
            {hasPhoto(specialist.photo) && (
              <PhotoToCome photo={specialist.photo} sizes="(min-width: 768px) 22rem, 100vw" className="aspect-[4/5]" />
            )}
            <div className="max-w-[40rem]">
              {specialist.eyebrow && <p className="type-eyebrow mb-4 text-ink-soft">{specialist.eyebrow}</p>}
              <h2 id="specialist-title" className="font-serif text-[2.5rem] leading-tight font-[380] [font-variation-settings:'opsz'_60] md:text-[3rem]">
                {specialist.name}
              </h2>
              {specialist.role && <p className="mt-1 font-sans text-[1rem] tracking-[0.06em] text-ink-soft">{specialist.role}</p>}
              {onTeamPage && specialist.teamLinkLabel && (
                <Link
                  href={teamHref}
                  className={`group mt-4 inline-flex items-center gap-3 border-b border-ink/40 pb-0.5 ${serif} text-[1.125rem] hover:border-ink`}
                >
                  {specialist.teamLinkLabel} <Arrow />
                </Link>
              )}
              {specialist.text && (
                <div className={`mt-6 space-y-4 ${serif} text-[1.25rem] leading-[1.55] text-ink`}>
                  {paragraphs(specialist.text).map((p) => (
                    <p key={p}>
                      <RichText text={p} linkClassName={inkLink} />
                    </p>
                  ))}
                </div>
              )}
              {booking && (
                /* Stephen's bookable appointments: separate from the general valuation form further down. */
                <Link
                  href={JEWELLERY_APPOINTMENTS_PATH}
                  className={`group mt-8 inline-flex min-h-16 items-center gap-4 bg-navy-deep px-8 ${serif} text-[1.1875rem] text-ivory transition-colors hover:bg-navy-soft`}
                >
                  {specialist.bookingLabel} <Arrow />
                </Link>
              )}
              {(specialist.phone || specialist.email) && (
                <ul className={`mt-6 space-y-1 ${serif} text-[1.1875rem]`}>
                  {specialist.phone && (
                    <li>
                      <a href={telHref(specialist.phone)} className={`whitespace-nowrap ${inkLink}`}>
                        {specialist.phone}
                      </a>
                    </li>
                  )}
                  {specialist.email && (
                    <li>
                      <a href={`mailto:${specialist.email}?subject=${encodeURIComponent("Jewellery enquiry")}`} className={`break-all ${inkLink}`}>
                        {specialist.email}
                      </a>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ PHOTOGRAPHS */}
      {isShown(gallery) && photos.length > 0 && (
        <section className="shell py-14 md:py-[4.5rem]">
          <Reel
            label={gallery.title || "Jewellery"}
            itemName="photographs"
            heading={
              gallery.title && (
                <h2 className="font-serif text-[2.25rem] leading-tight font-[380] [font-variation-settings:'opsz'_60] md:text-[3.25rem]">{gallery.title}</h2>
              )
            }
          >
            {photos.map((item, i) => (
              <li key={`${item.photo?.image}-${i}`} className="w-[75vw] shrink-0 snap-start sm:w-[45vw] md:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)]">
                <ObjectPhoto photo={item.photo} sizes="(min-width: 1280px) 22rem, (min-width: 768px) 30vw, 75vw" frameClassName="aspect-[4/5]" />
                {item.caption && <p className={`mt-4 ${serif} text-[1.125rem] leading-snug text-ink-soft`}>{item.caption}</p>}
              </li>
            ))}
          </Reel>
        </section>
      )}

      {/* ============================================================ VALUATION PANEL */}
      {isShown(valuation) && (valuation.title || valuation.buttonLabel) && (
        <section aria-label={valuation.title || "Request a valuation"} className="theme-dark bg-navy text-ivory">
          <div className="shell flex flex-col items-center py-16 text-center md:py-20">
            {valuation.title && (
              <h2 className="font-serif text-[2.25rem] leading-tight font-[380] [font-variation-settings:'opsz'_60] md:text-[3rem]">{valuation.title}</h2>
            )}
            {valuation.text && <p className={`mt-4 max-w-[38rem] ${serif} text-[1.25rem] leading-[1.5] text-ivory/80`}>{valuation.text}</p>}
            {valuation.buttonLabel && (
              <Link
                href={routes.valuation}
                className={`group mt-8 inline-flex min-h-16 items-center gap-4 bg-tan px-9 ${serif} text-[1.1875rem] text-navy-deep transition-colors hover:bg-ivory`}
              >
                {valuation.buttonLabel} <Arrow />
              </Link>
            )}
          </div>
        </section>
      )}

      <FaqPrompt />
    </>
  );
}
