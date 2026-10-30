import type { Metadata } from "next";
import { valuationPage } from "@/content";
import { RichText } from "@/components/ui/RichText";
import { Breadcrumbs, Eyebrow } from "@/components/ui/Editorial";
import { Notes } from "@/components/ui/PageParts";
import { ValuationForm } from "@/components/valuation/ValuationForm";

const c = valuationPage;

export const metadata: Metadata = { title: c.seo.title, description: c.seo.description };

const link = "text-navy underline decoration-gold underline-offset-4";

export default function ValuationPage() {
  return (
    <div className="shell pt-10 pb-28 md:pt-14 md:pb-36">
      <Breadcrumbs items={[{ label: "Sell With Us", href: "/sell" }, { label: c.title }]} />

      <div className="mt-12 max-w-4xl">
        {c.eyebrow && <Eyebrow className="mb-6">{c.eyebrow}</Eyebrow>}
        <h1 className="type-display text-navy">{c.title}</h1>
        {c.intro && <p className="type-lede mt-6 max-w-2xl text-ink-soft">{c.intro}</p>}
      </div>

      <div className="mt-8 grid gap-16 lg:mt-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ValuationForm deliveryReady={process.env.VALUATION_DELIVERY === "resend"} />
        </div>

        {(c.nextSteps.length > 0 || c.talkTitle || c.talkText || c.notes.length > 0) && (
          <aside className="lg:col-span-4 lg:pt-12" aria-label="About valuations">
            <div className="space-y-12 lg:sticky lg:top-10 [&>*:first-child]:border-t-2 [&>*:first-child]:border-navy">
              {c.nextSteps.length > 0 && (
                <div className="border-t border-line pt-6">
                  {c.nextStepsTitle && <h2 className="type-subtitle mb-5">{c.nextStepsTitle}</h2>}
                  <ol className="space-y-4">
                    {c.nextSteps.map((step, i) => (
                      <li key={`${step}-${i}`} className="grid grid-cols-[2rem_1fr]">
                        <span className="font-serif text-[1.25rem] leading-snug text-gold-ink">{i + 1}</span>
                        <span className="text-ink-soft">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {(c.talkTitle || c.talkText) && (
                <div className="border-t border-line pt-6">
                  {c.talkTitle && <h2 className="type-subtitle mb-3">{c.talkTitle}</h2>}
                  {c.talkText && (
                    <p className="text-ink-soft">
                      <RichText text={c.talkText} linkClassName={link} />
                    </p>
                  )}
                </div>
              )}

              {c.notes.length > 0 && (
                <div className="border-t border-line pt-6">
                  {c.notesTitle && <h2 className="type-subtitle mb-4">{c.notesTitle}</h2>}
                  <div className="type-small">
                    <Notes items={c.notes} />
                  </div>
                  {c.notesFooter && (
                    <p className="type-small mt-5 text-ink-soft">
                      <RichText text={c.notesFooter} linkClassName={link} />
                    </p>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
