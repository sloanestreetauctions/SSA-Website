import { notFound } from "next/navigation";
import { isPageOn } from "@/content";
import type { Metadata } from "next";
import Link from "next/link";
import { easyLive, hasPhoto, howToBuyPage, isShown, settings } from "@/content";
import { routes } from "@/lib/routes";
import { Arrow } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { PhotoToCome } from "@/components/ui/PhotoToCome";
import { RichText } from "@/components/ui/RichText";
import { SplitHeader, splitMedia } from "@/components/ui/SplitHeader";

const c = howToBuyPage;

export const metadata: Metadata = { title: c.seo.title, description: c.seo.description };

const serif = "font-serif [font-variation-settings:'opsz'_18]";
const inkLink = "text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink";

/**
 * HOW TO BUY — built to the approved Direction C mockup: opening, register to
 * bid, ways to bid, after the sale. Every section can be switched off in the editor.
 */
export default function HowToBuyPage() {
  if (!isPageOn("/how-to-buy")) notFound();
  const { hero, register, ways, payment, collection } = c;
  const showPayment = isShown(payment);
  const showCollection = isShown(collection);
  const h2 = "font-serif text-[2.5rem] leading-tight font-[380] [font-variation-settings:'opsz'_60] md:text-[3.25rem]";

  return (
    <>
      {/* ============================================================== HERO */}
      <SplitHeader
        columns="wide"
        breadcrumbs={<Breadcrumbs items={[{ label: hero.eyebrow || "How to buy" }]} />}
        media={hasPhoto(hero.photo) && <PhotoToCome photo={hero.photo} priority className={splitMedia} />}
      >
        {hero.eyebrow && <p className="type-eyebrow mb-5 text-ink-soft">{hero.eyebrow}</p>}
        <h1 className="font-serif text-[3.25rem] leading-none font-[350] tracking-[-0.02em] text-navy [font-variation-settings:'opsz'_72] md:text-[4.5rem] xl:text-[5.25rem]">
          {hero.title}
        </h1>
        {hero.text && <p className={`mt-7 max-w-[38rem] ${serif} text-[1.3125rem] leading-[1.5] text-ink-soft`}>{hero.text}</p>}
        {(hero.primaryButton || (hero.secondaryButton && isShown(register))) && (
          <div className="mt-9 flex flex-wrap items-center gap-4">
            {hero.primaryButton && (
              <Link
                href={routes.auctions}
                className={`group inline-flex min-h-16 items-center gap-4 bg-navy-deep px-7 ${serif} text-[1.1875rem] text-ivory transition-colors hover:bg-navy-soft`}
              >
                {hero.primaryButton} <Arrow />
              </Link>
            )}
            {hero.secondaryButton && isShown(register) && (
              <a
                href="#register"
                className={`inline-flex min-h-16 items-center border border-ink/30 px-7 ${serif} text-[1.1875rem] text-ink transition-colors hover:border-navy hover:text-navy`}
              >
                {hero.secondaryButton}
              </a>
            )}
          </div>
        )}
      </SplitHeader>

      {/* ===================================================== REGISTER TO BID */}
      {isShown(register) && (
        <section id="register" aria-label={register.title || "Register to bid"} className="shell scroll-mt-8 py-16 md:py-[5.6rem]">
          <div className={`grid gap-12 lg:gap-0 ${register.steps.length ? "lg:grid-cols-[25rem_1fr]" : ""}`}>
            <div className="flex flex-col lg:pr-16">
              {register.title && <h2 className={h2}>{register.title}</h2>}
              {register.text && (
                <p className={`mt-5 max-w-[19rem] ${serif} text-[1.4375rem] leading-[1.5] text-ink-soft`}>{register.text}</p>
              )}
              {easyLive.signIn && register.buttonLabel && (
                <a
                  href={easyLive.signIn}
                  className={`group mt-10 inline-flex min-h-16 items-center gap-4 self-start border border-ink/30 px-7 ${serif} text-[1.125rem] hover:border-navy lg:mt-auto`}
                >
                  {register.buttonLabel} <Arrow />
                </a>
              )}
            </div>
            {register.steps.length > 0 && (
              <ol className="lg:border-l lg:border-line lg:pl-16">
                {register.steps.map((step, i) => (
                  <li
                    key={`${step.title}-${i}`}
                    className={`grid grid-cols-[4rem_1fr] gap-x-4 md:grid-cols-[6.5rem_1fr] ${i > 0 ? "mt-12" : ""}`}
                  >
                    <span className="self-start border-b border-gold-ink/60 pb-3 font-serif text-[3.5rem] leading-[0.9] font-[300] text-gold-ink [font-variation-settings:'opsz'_72] md:text-[4rem]">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-serif text-[1.75rem] leading-snug [font-variation-settings:'opsz'_36]">{step.title}</h3>
                      {step.body && <p className={`mt-2 max-w-[38rem] ${serif} text-[1.25rem] leading-[1.45] text-ink-soft`}>{step.body}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      )}

      {/* ======================================================== WAYS TO BID */}
      {isShown(ways) && (
        <section aria-label={ways.title || "Ways to bid"} className={`shell pb-20 md:pb-[6rem] ${isShown(register) ? "" : "pt-16 md:pt-[5.6rem]"}`}>
          {ways.title && <h2 className={h2}>{ways.title}</h2>}
          {ways.items.length > 0 && (
            <ul className="mt-10 grid gap-x-[1.15rem] gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {ways.items.map((w, i) => (
                <li key={`${w.title}-${i}`}>
                  <PhotoToCome photo={w.photo} className="mb-5 aspect-[1.28]" sizes="(min-width: 1024px) 23vw, (min-width: 640px) 50vw, 100vw" />
                  <h3 className="font-serif text-[1.5rem] leading-snug [font-variation-settings:'opsz'_36]">{w.title}</h3>
                  {w.body && <p className={`mt-1.5 ${serif} text-[1.1875rem] leading-[1.45] text-ink-soft`}>{w.body}</p>}
                </li>
              ))}
            </ul>
          )}
          {ways.note && (
            <p className={`mt-12 max-w-[50rem] ${serif} text-[1.1875rem] leading-[1.5] text-ink-soft`}>
              <RichText text={ways.note} linkClassName={inkLink} />
            </p>
          )}
        </section>
      )}

      {/* ===================================================== AFTER THE SALE */}
      {(showPayment || showCollection) && (
        <section aria-label="After the sale" className="bg-[#f0eae2]">
          <div className={`shell grid gap-14 py-16 md:gap-0 md:py-[4.5rem] ${showPayment && showCollection ? "md:grid-cols-2" : ""}`}>
            {showPayment && (
              <InfoBlock
                title={payment.title}
                text={payment.text}
                linkLabel={payment.linkLabel}
                href={settings.links.conditionsOfSale}
                className={showCollection ? "md:pr-16" : ""}
              />
            )}
            {showCollection && (
              <InfoBlock
                title={collection.title}
                text={collection.text}
                linkLabel={collection.linkLabel}
                href={settings.links.shipping}
                className={showPayment ? "md:border-l md:border-line md:pl-16" : ""}
              />
            )}
          </div>
        </section>
      )}
    </>
  );
}

function InfoBlock({ title, text, linkLabel, href, className }: { title: string; text: string; linkLabel: string; href: string; className: string }) {
  return (
    <div className={className}>
      {title && (
        <h2 className="mb-4 font-serif text-[2.25rem] leading-tight font-[380] [font-variation-settings:'opsz'_60] md:text-[3.25rem]">{title}</h2>
      )}
      {text && (
        <p className={`max-w-[30rem] ${serif} text-[1.25rem] leading-[1.5] text-ink-soft`}>
          <RichText text={text} linkClassName={inkLink} />
        </p>
      )}
      {linkLabel && (
        <a href={href} className={`group mt-6 inline-flex items-center gap-3 border-b border-ink/40 pb-0.5 ${serif} text-[1.1875rem] hover:border-ink`}>
          {linkLabel} <Arrow />
        </a>
      )}
    </div>
  );
}
