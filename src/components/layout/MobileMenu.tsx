"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { primaryNav, signInLabel, valuationButtonLabel } from "@/lib/site";
import { easyLive } from "@/content";
import { CloseIcon, MenuIcon, SearchIcon } from "@/components/ui/Icons";
import { LogoLockup } from "./Logo";

/**
 * Small-screen menu, built on the native <dialog> element so focus is trapped,
 * Escape closes it and screen readers announce it correctly.
 */
export function MobileMenu({ tone = "light" }: { tone?: "dark" | "light" }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`-ml-2 inline-flex min-h-11 items-center gap-2 px-2 xl:hidden ${tone === "dark" ? "text-ivory" : "text-ink"}`}
      >
        <MenuIcon />
        <span className="type-label">Menu</span>
      </button>

      <dialog
        ref={dialogRef}
        onClose={close}
        aria-label="Site menu"
        className="theme-dark m-0 h-dvh max-h-none w-full max-w-none bg-navy p-0 text-ivory backdrop:bg-navy-deep/60 xl:hidden"
      >
        <div className="shell flex h-full flex-col">
          <div className="flex h-24 items-center justify-between border-b border-line-dark">
            <LogoLockup className="w-[7.5rem]" />
            <button
              type="button"
              onClick={close}
              autoFocus
              className="-mr-2 inline-flex min-h-11 items-center gap-2 px-2"
            >
              <CloseIcon />
              <span className="type-label">Close</span>
            </button>
          </div>

          <nav aria-label="Main" className="flex-1 overflow-y-auto py-8">
            <ul>
              {primaryNav.map((item) => (
                <li key={item.href} className="border-b border-line-dark">
                  <Link href={item.href} onClick={close} className="flex items-baseline justify-between gap-4 py-4">
                    <span className="font-serif text-[1.875rem] leading-tight [font-variation-settings:'opsz'_48]">
                      {item.label}
                    </span>
                    <span className="type-small text-right text-ivory/55">{item.description}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-10 grid gap-3">
              {easyLive.site && (
                <a href={easyLive.site} className="flex min-h-12 items-center gap-3 border border-gold-pale/50 px-5 text-[0.9375rem]">
                  <SearchIcon size={18} />
                  Search lots and catalogues
                </a>
              )}
              <Link
                href="/valuation"
                onClick={close}
                className="flex min-h-12 items-center bg-ivory px-5 text-[0.9375rem] font-[560] text-navy"
              >
                {valuationButtonLabel}
              </Link>
              {easyLive.signIn && (
                <a
                  href={easyLive.signIn}
                  className="flex min-h-12 items-center px-5 text-[0.9375rem] text-ivory/80 underline decoration-gold underline-offset-[6px]"
                >
                  {signInLabel}
                </a>
              )}
            </div>
          </nav>
        </div>
      </dialog>
    </>
  );
}
