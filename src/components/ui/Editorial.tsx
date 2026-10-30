import Link from "next/link";
import { isPageOn } from "@/content";
import type { ReactNode } from "react";

/** Small uppercase label above a heading. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`type-eyebrow text-gold-ink ${className}`}>{children}</p>;
}

/**
 * Section opening: eyebrow, heading and an optional link to "see all".
 * Headings are real <h2>s so the page outline makes sense to screen readers.
 */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  action,
  id,
  tone = "light",
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  action?: ReactNode;
  id?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <Eyebrow className={tone === "dark" ? "!text-gold-pale" : ""}>{eyebrow}</Eyebrow>}
        <h2 id={id} className="type-headline mt-4">
          {title}
        </h2>
        {intro && <p className={`type-lede mt-5 ${tone === "dark" ? "text-ivory/75" : "text-ink-soft"}`}>{intro}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Labels demonstration content where it appears, not just in the banner. */
export type Crumb = { label: string; href?: string };

/** "Auctions / Fine Paintings / Lot 12" — always shows where you are. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="type-label flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-soft">
        <li>
          <Link href="/" className="hover:text-navy">
            Home
          </Link>
        </li>
        {items.filter((item) => !item.href || isPageOn(item.href)).map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span aria-hidden="true" className="text-gold">
              /
            </span>
            {item.href ? (
              <Link href={item.href} className="hover:text-navy">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
