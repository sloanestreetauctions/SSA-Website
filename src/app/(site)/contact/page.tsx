import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { contactPage, hasPhoto, isShown, mapsDirections, settings, telHref } from "@/content";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { PhotoToCome } from "@/components/ui/PhotoToCome";
import { SplitHeader, splitMedia } from "@/components/ui/SplitHeader";
import { sectionTitle, serifText } from "@/components/ui/type";
import { EnquiryChooser } from "@/components/contact/EnquiryChooser";
import { ShowroomMap } from "@/components/contact/ShowroomMap";

const c = contactPage;

export const metadata: Metadata = { title: c.seo.title, description: c.seo.description };

const underline = "underline decoration-ink/30 underline-offset-4 hover:decoration-ink";

/** CONTACT — built to the approved Direction C mockup. */
export default function ContactPage() {
  return (
    <>
      <SplitHeader
        breadcrumbs={<Breadcrumbs items={[{ label: c.hero.eyebrow || "Contact" }]} />}
        media={hasPhoto(c.hero.photo) && <PhotoToCome photo={c.hero.photo} priority className={splitMedia} />}
      >
          {c.hero.eyebrow && <p className="type-eyebrow mb-5 text-ink-soft">{c.hero.eyebrow}</p>}
          <h1 className="max-w-[17ch] font-serif text-[3rem] leading-[1.05] font-[350] tracking-[-0.02em] text-navy [font-variation-settings:'opsz'_72] md:text-[4.25rem] xl:text-[5rem]">
            {c.hero.title}
          </h1>
          {c.hero.text && (
            <p className={`mt-6 max-w-[36rem] ${serifText} text-[1.3125rem] leading-[1.5] text-ink-soft`}>{c.hero.text}</p>
          )}

          <ul className={`mt-9 space-y-6 ${serifText} text-[1.5rem] leading-snug`}>
            <Detail icon={<IconPin />}>
              {settings.addressLines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
              {c.hero.mapsLinkLabel && (
              <a
                href={mapsDirections}
                target="_blank"
                rel="noopener"
                className={`mt-1 inline-block text-[1.0625rem] text-ink-soft ${underline}`}
              >
                {c.hero.mapsLinkLabel} <span aria-hidden="true">→</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              )}
            </Detail>
            <Detail icon={<IconPhone />}>
              <a href={telHref(settings.mainPhone)} className={underline}>
                {settings.mainPhone}
              </a>
              {settings.otherPhone && (
                <>
                  <br />
                  <a href={telHref(settings.otherPhone)} className={underline}>
                    {settings.otherPhone}
                  </a>
                </>
              )}
            </Detail>
            <Detail icon={<IconMail />}>
              <a href={`mailto:${settings.generalEmail}`} className={`break-all ${underline}`}>
                {settings.generalEmail}
              </a>
            </Detail>
          </ul>

          <div className="mt-9 max-w-[36rem] border-t border-line pt-6">
            {c.hero.hoursTitle && <h2 className="mb-2 font-serif text-[1.75rem] [font-variation-settings:'opsz'_36]">{c.hero.hoursTitle}</h2>}
            <dl className={`${serifText} text-[1.5rem]`}>
              {settings.openingHours.map(({ days: day, times: time }) => (
                <div key={day} className="grid grid-cols-[1fr_auto] py-0.5">
                  <dt className="text-ink-soft">{day}</dt>
                  <dd className="text-ink-soft tabular-nums">{time}</dd>
                </div>
              ))}
            </dl>
          </div>
      </SplitHeader>

      {isShown(c.map) && <ShowroomMap />}

      {isShown(c.enquiries) && (
        <section id="enquiries" aria-label={c.enquiries.title || "Enquiries"} className="shell scroll-mt-8 py-20 md:py-24">
          <div className={`grid gap-10 lg:gap-16 ${c.enquiries.title || c.enquiries.text ? "lg:grid-cols-[22rem_1fr]" : ""}`}>
            {(c.enquiries.title || c.enquiries.text) && (
              <div>
                {c.enquiries.title && <h2 className={sectionTitle}>{c.enquiries.title}</h2>}
                {c.enquiries.text && <p className={`mt-4 ${serifText} text-[1.25rem] text-ink-soft`}>{c.enquiries.text}</p>}
              </div>
            )}
            <Suspense fallback={null}>
              <EnquiryChooser />
            </Suspense>
          </div>
        </section>
      )}
    </>
  );
}

function Detail({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[3rem_1fr] items-start">
      <span className="pt-0.5 text-ink-soft">{icon}</span>
      <div>{children}</div>
    </li>
  );
}

const iconProps = {
  width: 34,
  height: 34,
  viewBox: "0 0 28 28",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.2,
  "aria-hidden": true,
} as const;
function IconPin() {
  return (
    <svg {...iconProps}>
      <path d="M14 26s8-7.6 8-13.4A8 8 0 006 12.6C6 18.4 14 26 14 26z" />
      <circle cx="14" cy="12.5" r="3" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg {...iconProps}>
      <path d="M8 3.5l3.5 5-2.2 2.2c1.3 2.8 3.4 4.9 6.2 6.2l2.2-2.2 5 3.5-1.6 3.4c-.5 1-1.6 1.6-2.7 1.3C11 21 6.9 16.9 5.1 10.6c-.3-1.1.3-2.2 1.3-2.7z" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="6.5" width="22" height="15" />
      <path d="M3.5 7l10.5 8.5L24.5 7" />
    </svg>
  );
}
