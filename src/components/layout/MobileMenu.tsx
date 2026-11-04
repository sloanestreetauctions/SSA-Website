"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { signInLabel, valuationButtonLabel, type MenuEntry, type MenuLink, type SiteMenu } from "@/lib/site";
import { easyLive } from "@/content";
import { CloseIcon, MenuIcon, SearchIcon } from "@/components/ui/Icons";
import { LogoLockup } from "./Logo";

/**
 * Small-screen menu, built on the native <dialog> element so focus is trapped,
 * Escape closes it and screen readers announce it correctly.
 */
export function MobileMenu({ tone = "light", menu }: { tone?: "dark" | "light"; menu: SiteMenu }) {
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
        className={`-ml-2 inline-flex min-h-11 items-center gap-2 px-2 min-[860px]:hidden ${tone === "dark" ? "text-ivory" : "text-ink"}`}
      >
        <MenuIcon />
        <span className="type-label">Menu</span>
      </button>

      <dialog
        ref={dialogRef}
        onClose={close}
        aria-label="Site menu"
        className="theme-dark m-0 h-dvh max-h-none w-full max-w-none bg-navy p-0 text-ivory backdrop:bg-navy-deep/60 min-[860px]:hidden"
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
              {[...menu.left, ...menu.right].map((entry) =>
                entry.children ? (
                  <MobileGroup key={entry.label} entry={entry as MenuEntry & { children: MenuLink[] }} onNavigate={close} />
                ) : (
                  <li key={entry.href} className="border-b border-line-dark">
                    <Link href={entry.href!} onClick={close} className="flex items-baseline justify-between gap-4 py-4">
                      <span className="font-serif text-[1.875rem] leading-tight [font-variation-settings:'opsz'_48]">{entry.label}</span>
                      <span className="type-small text-right text-ivory/55">{entry.description}</span>
                    </Link>
                  </li>
                ),
              )}
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

/**
 * A section of the phone menu with sub-pages (e.g. Auctions → Upcoming, Past):
 * the heading is a button that opens and closes its list, announced to screen
 * readers as expanded or collapsed.
 */
function MobileGroup({ entry, onNavigate }: { entry: MenuEntry & { children: MenuLink[] }; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  return (
    <li className="border-b border-line-dark">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="font-serif text-[1.875rem] leading-tight [font-variation-settings:'opsz'_48]">{entry.label}</span>
        <svg
          aria-hidden="true"
          width="16"
          height="10"
          viewBox="0 0 16 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          className={`shrink-0 text-gold-pale transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 1.5 8 8.5l7-7" />
        </svg>
      </button>
      <ul id={listId} hidden={!open} className="pb-4">
        {entry.children.map((child) => (
          <li key={child.href}>
            <Link
              href={child.href}
              onClick={onNavigate}
              className="flex min-h-12 items-center gap-3 pl-1 font-serif text-[1.3125rem] text-ivory/85 [font-variation-settings:'opsz'_18] hover:text-ivory"
            >
              <span aria-hidden="true" className="h-px w-4 shrink-0 bg-gold" />
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
