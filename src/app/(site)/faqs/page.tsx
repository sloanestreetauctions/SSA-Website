import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { RichText } from "@/components/ui/RichText";
import { faqPage as c, isPageOn, paragraphs } from "@/content";
import { pageTitle, serifText } from "@/components/ui/type";
import { jsonLd } from "@/lib/structured-data";

export const metadata: Metadata = { title: c.seo.title, description: c.seo.description };

const inkLink = "text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink";

/**
 * FAQs — questions and answers written in the editor (Pages → FAQs). Each
 * question opens to show its answer. The page and its links appear once at
 * least one question has been added.
 */
export default function FaqPage() {
  if (!isPageOn("/faqs")) notFound();
  const questions = c.questions ?? [];

  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") },
    })),
  };

  return (
    <div className="shell pt-8 pb-20 md:pb-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(data)} />
      <Breadcrumbs items={[{ label: c.eyebrow && c.eyebrow !== c.title ? c.eyebrow : "FAQs" }]} />
      <div className="mt-8 max-w-[52rem]">
        {c.eyebrow && <p className="type-eyebrow mb-4 text-ink-soft">{c.eyebrow}</p>}
        <h1 className={pageTitle}>{c.title}</h1>
        {c.intro && <p className={`mt-4 ${serifText} text-[1.3125rem] text-ink-soft`}>{c.intro}</p>}
      </div>

      <ul className="mt-12 max-w-[52rem] border-t border-line">
        {questions.map((q, i) => (
          <li key={`${q.question}-${i}`} className="border-b border-line">
            <details className="group/faq">
              <summary className={`flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 ${serifText} text-[1.375rem] leading-snug text-ink hover:text-navy [&::-webkit-details-marker]:hidden`}>
                {q.question}
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" className="shrink-0 transition-transform group-open/faq:rotate-45 motion-reduce:transition-none">
                  <path d="M10 3v14M3 10h14" />
                </svg>
              </summary>
              {q.answer && (
                <div className={`max-w-[44rem] space-y-3 pb-7 ${serifText} text-[1.1875rem] leading-[1.55] text-ink-soft`}>
                  {paragraphs(q.answer).map((p) => (
                    <p key={p}>
                      <RichText text={p} linkClassName={inkLink} />
                    </p>
                  ))}
                </div>
              )}
            </details>
          </li>
        ))}
      </ul>

      {c.closing && (
        <p className={`mt-10 max-w-[52rem] ${serifText} text-[1.25rem] text-ink-soft`}>
          <RichText text={c.closing} linkClassName={inkLink} />
        </p>
      )}
    </div>
  );
}
