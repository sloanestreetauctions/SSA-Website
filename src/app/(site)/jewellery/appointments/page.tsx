import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppointmentBooking } from "@/components/booking/AppointmentBooking";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { PhotoToCome } from "@/components/ui/PhotoToCome";
import { RichText } from "@/components/ui/RichText";
import { pageTitle, serifText } from "@/components/ui/type";
import { appointmentsPage as c, hasPhoto, isPageOn, jewelleryPage, settings, telHref } from "@/content";
import { jewelleryBookingLive } from "@/lib/booking/status";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = pageMetadata("/jewellery/appointments", c.seo);

const inkLink = "text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink";

/**
 * BOOK A JEWELLERY VALUATION — Stephen's bookable valuations, a separate
 * service from the valuation form (which stays at /valuation for valuations
 * from photographs). Free times come live from Google Calendar. Hidden ("not
 * found") until booking is switched on and set up: see src/lib/booking/status.ts.
 */
export default function JewelleryAppointmentsPage() {
  if (!jewelleryBookingLive()) notFound();
  const { page, rules } = c;
  const specialist = jewelleryPage.specialist;
  const fallback = (
    <>
      please call us on{" "}
      <a href={telHref(settings.mainPhone)} className={`whitespace-nowrap ${inkLink}`}>
        {settings.mainPhone}
      </a>{" "}
      or email{" "}
      <a href={`mailto:${settings.generalEmail}`} className={inkLink}>
        {settings.generalEmail}
      </a>
      .
    </>
  );

  return (
    <div className="shell pt-8 pb-20 md:pb-24">
      <Breadcrumbs
        items={[...(isPageOn("/jewellery") ? [{ label: jewelleryPage.hero.title || "Jewellery", href: "/jewellery" }] : []), { label: page.title }]}
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end lg:gap-16">
        <div>
          {page.eyebrow && <p className="type-eyebrow mb-4 text-ink-soft">{page.eyebrow}</p>}
          <h1 className={pageTitle}>{page.title}</h1>
          {page.intro && (
            <p className={`mt-5 max-w-[42rem] ${serifText} text-[1.3125rem] leading-[1.5] text-ink-soft`}>
              <RichText text={page.intro} linkClassName={inkLink} />
            </p>
          )}
          {page.valuationNote && (
            <p className={`mt-4 max-w-[42rem] ${serifText} text-[1.125rem] leading-[1.5] text-ink-soft`}>
              <RichText text={page.valuationNote} linkClassName={inkLink} />
            </p>
          )}
        </div>

        {/* Who and where, at a glance */}
        <aside aria-label="About the valuation" className="flex items-start gap-5 border-t border-line pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          {hasPhoto(specialist.photo) && (
            <PhotoToCome photo={{ ...specialist.photo, alt: "" }} className="aspect-[4/5] w-24 shrink-0" sizes="96px" />
          )}
          <div className={`${serifText} text-[1.0625rem] leading-snug`}>
            {specialist.name && <p className="text-[1.25rem] text-ink [font-variation-settings:'opsz'_36]">{specialist.name}</p>}
            {specialist.role && <p className="text-ink-soft">{specialist.role}</p>}
            <ul className="mt-3 space-y-1 text-ink-soft">
              <li>{rules.durationMinutes ?? 30}-minute valuations</li>
              {c.location && <li>{c.location.split("\n").filter(Boolean).slice(-2).join(", ")}</li>}
            </ul>
          </div>
        </aside>
      </div>

      <div className="mt-12">
        <AppointmentBooking
          wording={{
            calendarTitle: page.calendarTitle,
            timesTitle: page.timesTitle,
            formTitle: page.formTitle,
            detailsLabel: page.detailsLabel,
            buttonLabel: page.buttonLabel,
            confirmationTitle: page.confirmationTitle,
          }}
          consent={<RichText text={page.consentText} linkClassName="text-navy underline decoration-gold underline-offset-4" />}
          confirmation={<RichText text={page.confirmationText} linkClassName={inkLink} />}
          noDates={<RichText text={page.noDates} linkClassName={inkLink} />}
          fallback={fallback}
        />
      </div>
    </div>
  );
}
