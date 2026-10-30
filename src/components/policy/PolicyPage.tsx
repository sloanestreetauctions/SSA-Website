import { Fragment } from "react";
import { settings } from "@/content";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { RichText } from "@/components/ui/RichText";
import { serifText } from "@/components/ui/type";

const link = "text-navy underline decoration-gold underline-offset-4";

/**
 * A legal page (Terms and Conditions, Privacy, Shipping), showing the wording
 * pasted into the editor exactly as written. Simple formatting:
 * an empty line starts a new paragraph, "## " a heading, "- " a bullet point.
 */
export function PolicyPage({ page }: { page: { title: string; updated: string; body: string } }) {
  const blocks = page.body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="shell pt-8 pb-24 md:pb-32">
      <Breadcrumbs items={[{ label: page.title }]} />
      <h1 className="mt-10 font-serif text-[2.75rem] leading-[1.05] font-[350] tracking-[-0.02em] text-navy [font-variation-settings:'opsz'_72] md:text-[3.75rem]">
        {page.title}
      </h1>
      {page.updated && <p className="type-small mt-4 text-ink-soft">Last updated {page.updated}</p>}

      <div className={`mt-10 max-w-[46rem] space-y-5 ${serifText} text-[1.1875rem] leading-[1.65] text-ink`}>
        {blocks.length === 0 ? (
          <p className="text-ink-soft">
            We are updating this page. For a copy, please email{" "}
            <a href={`mailto:${settings.generalEmail}`} className={link}>
              {settings.generalEmail}
            </a>
            .
          </p>
        ) : (
          blocks.map((block, i) => <Block key={i} text={block} />)
        )}
      </div>
    </div>
  );
}

function Block({ text }: { text: string }) {
  if (text.startsWith("## ")) {
    return (
      <h2 className="pt-6 font-serif text-[1.625rem] leading-snug text-navy [font-variation-settings:'opsz'_36]">
        {text.slice(3).trim()}
      </h2>
    );
  }
  const lines = text.split("\n");
  if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
    return (
      <ul className="list-disc space-y-2 pl-6 marker:text-gold-ink">
        {lines.map((l, i) => (
          <li key={i}>
            <RichText text={l.replace(/^\s*[-•]\s+/, "")} linkClassName={link} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <RichText text={l} linkClassName={link} />
        </Fragment>
      ))}
    </p>
  );
}
