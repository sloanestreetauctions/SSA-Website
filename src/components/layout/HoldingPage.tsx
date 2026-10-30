import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Breadcrumbs, Eyebrow } from "@/components/ui/Editorial";
import { routes } from "@/lib/routes";

/**
 * Temporary page for sections planned in a later phase. It says plainly what
 * will be here and always offers a way onward, so no link is a dead end.
 */
export function HoldingPage({
  title,
  eyebrow,
  lede,
  plannedFor = "Phase 2",
  children,
}: {
  title: string;
  eyebrow?: string;
  lede: string;
  plannedFor?: string;
  children?: ReactNode;
}) {
  return (
    <div className="shell pt-10 pb-28 md:pt-14 md:pb-36">
      <Breadcrumbs items={[{ label: title }]} />
      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {eyebrow && <Eyebrow className="mb-6">{eyebrow}</Eyebrow>}
          <h1 className="type-display text-navy">{title}</h1>
          {lede && <p className="type-lede mt-6 max-w-xl text-ink-soft">{lede}</p>}
          {children && <div className="mt-14">{children}</div>}
        </div>
        <aside className="self-start border-t-2 border-gold pt-6 lg:col-span-4 lg:col-start-9">
          <p className="type-label text-gold-ink">In development · {plannedFor}</p>
          <p className="mt-3 text-ink-soft">
            This page is part of the new website and will be completed in a later phase. Meanwhile, you can:
          </p>
          <div className="mt-6 flex flex-col items-start gap-3">
            <ButtonLink href={routes.auctions} variant="secondary">
              Browse auctions
            </ButtonLink>
            <ButtonLink href={routes.valuation} variant="quiet" arrow>
              Request a valuation
            </ButtonLink>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Numbered steps used on the guide pages. */
export function Steps({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol>
      {steps.map((s, i) => (
        <li key={s.title} className="grid grid-cols-[3.5rem_1fr] border-t border-line py-7 last:border-b">
          <span className="font-serif text-[2rem] leading-none text-gold-ink [font-variation-settings:'opsz'_60]">{i + 1}</span>
          <div>
            <h2 className="font-sans text-[1.0625rem] font-[560]">{s.title}</h2>
            <p className="mt-1.5 text-ink-soft">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
