import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Buttons follow one rule: the label says exactly what happens.
 * Square corners, no shadows. Five variants cover every use on the site.
 */
export type ButtonVariant = "primary" | "secondary" | "quiet" | "inverse" | "inverse-outline" | "gold";

const base =
  "group inline-flex items-center justify-center gap-3 text-[0.9375rem] font-[560] tracking-[0.01em] transition-colors duration-200 ease-[var(--ease-gallery)] disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary: "min-h-12 px-7 bg-navy text-ivory hover:bg-navy-soft",
  secondary: "min-h-12 px-7 border border-navy text-navy hover:bg-navy hover:text-ivory",
  quiet: "min-h-11 text-navy underline decoration-gold decoration-1 underline-offset-[6px] hover:decoration-navy",
  inverse: "min-h-12 px-7 bg-ivory text-navy hover:bg-stone",
  "inverse-outline": "min-h-12 px-7 border border-gold-pale/60 text-ivory hover:border-ivory hover:bg-ivory/5",
  /** Reserved for the single main action on the dark homepage hero. */
  gold: "min-h-12 px-7 bg-gold text-night hover:bg-gold-pale",
};

export function buttonClasses(variant: ButtonVariant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`.trim();
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 10"
      width="20"
      height="10"
      className={`shrink-0 transition-transform duration-300 ease-[var(--ease-gallery)] group-hover:translate-x-1 ${className}`}
    >
      <path d="M0 5h18.5M14 1l4.5 4L14 9" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: ButtonVariant;
  arrow?: boolean;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ variant = "primary", arrow = false, className = "", children, ...props }: ButtonLinkProps) {
  return (
    <Link {...props} className={buttonClasses(variant, className)}>
      <span>{children}</span>
      {arrow && <Arrow />}
    </Link>
  );
}
