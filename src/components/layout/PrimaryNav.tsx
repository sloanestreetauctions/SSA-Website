"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import type { MenuEntry, MenuLink } from "@/lib/site";

/** True when `pathname` is inside the section that `href` leads to. */
export function isCurrentSection(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The page itself (exactly), for links inside a drop-down: "Upcoming" and "Past" auctions share a prefix. */
const isCurrentPage = (pathname: string | null, href: string) => Boolean(pathname) && pathname === href;

/** Shared look of a top-level item: the gold underline that grows on hover and marks the current section. */
const topItem = (current: boolean) =>
  `relative inline-flex items-center gap-1.5 py-2 font-serif whitespace-nowrap [font-variation-settings:'opsz'_18] text-[clamp(0.8125rem,5.6cqw,1.25rem)] transition-colors xl:text-[1.25rem] ${
    current ? "text-ivory" : "text-ivory/75 hover:text-ivory"
  } after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-gold after:transition-transform after:duration-300 ${
    current ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"
  }`;

/**
 * Desktop navigation, one side of the logo. Plain links stay links; entries
 * with sub-pages become drop-downs (see `Dropdown`). The current section is
 * underlined in gold and announced to screen readers. `pathname` is null
 * while the page is being prerendered (no highlight yet).
 */
export function NavGroupLinks({
  entries,
  label,
  pathname,
  align,
}: {
  entries: MenuEntry[];
  label: string;
  pathname: string | null;
  /** Which way the drop-downs open, so they never run off the screen: left of the logo they open rightwards, and the other way round. */
  align: "start" | "end";
}) {
  return (
    <nav aria-label={label} className="hidden min-[860px]:block">
      <ul className="flex items-center gap-[clamp(0.75rem,12.5cqw,3rem)] xl:gap-14">
        {entries.map((entry) =>
          entry.children ? (
            <li key={entry.label} className="relative">
              <Dropdown entry={entry as MenuEntry & { children: MenuLink[] }} pathname={pathname} align={align} />
            </li>
          ) : (
            <li key={entry.href}>
              <Link
                href={entry.href!}
                aria-current={isCurrentSection(pathname, entry.href!) ? "page" : undefined}
                className={topItem(isCurrentSection(pathname, entry.href!))}
              >
                {entry.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

export function NavGroup({ entries, label, align }: { entries: MenuEntry[]; label: string; align: "start" | "end" }) {
  return <NavGroupLinks entries={entries} label={label} pathname={usePathname()} align={align} />;
}

/**
 * A drop-down (the "disclosure" navigation pattern): a button that shows and
 * hides a short list of links.
 *  - Mouse: opens on hover, or on click.
 *  - Keyboard: Enter or Space opens it; ↓ opens it and moves into the list;
 *    ↑ ↓ Home End move between its links; Escape closes it and returns to the
 *    button; tabbing away closes it.
 *  - Clicking anywhere else closes it.
 */
function Dropdown({
  entry,
  pathname,
  align,
}: {
  entry: MenuEntry & { children: MenuLink[] };
  pathname: string | null;
  align: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  /** Gap between the button and the bottom of the header, so the list hangs just below the header bar, clear of the logo. */
  const [drop, setDrop] = useState(16);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** When hovering opened it: a click straight after shouldn't close it again. */
  const hoverOpenedAt = useRef(0);
  const panelId = useId();
  const current = entry.children.some((c) => isCurrentSection(pathname, c.href));

  // Measure where the header ends each time the list opens (the header's height changes with screen size).
  useLayoutEffect(() => {
    if (!open || !root.current) return;
    const header = root.current.closest("header");
    if (!header) return;
    const gap = header.getBoundingClientRect().bottom - root.current.getBoundingClientRect().bottom;
    setDrop(Math.max(8, Math.round(gap)));
  }, [open]);

  // Close when clicking or tapping anywhere outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Tidy up the hover timer when the menu goes away.
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const links = () => Array.from(root.current?.querySelectorAll<HTMLAnchorElement>("[data-menu-link]") ?? []);
  const focusLink = (index: number) => {
    const all = links();
    if (all.length) all[(index + all.length) % all.length].focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const all = links();
    const at = all.indexOf(document.activeElement as HTMLAnchorElement);
    if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
      button.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (open) focusLink(at + 1);
      else {
        setOpen(true);
        // Wait for the list to appear before moving into it.
        requestAnimationFrame(() => focusLink(0));
      }
    } else if (e.key === "ArrowUp" && open) {
      e.preventDefault();
      focusLink(at <= 0 ? all.length - 1 : at - 1);
    } else if (e.key === "Home" && open && at >= 0) {
      e.preventDefault();
      focusLink(0);
    } else if (e.key === "End" && open && at >= 0) {
      e.preventDefault();
      focusLink(all.length - 1);
    }
  };

  const hoverOpen = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (!open) hoverOpenedAt.current = Date.now();
    setOpen(true);
  };
  const hoverClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  };

  return (
    <div
      ref={root}
      onKeyDown={onKeyDown}
      onPointerEnter={(e) => e.pointerType === "mouse" && hoverOpen()}
      onPointerLeave={(e) => e.pointerType === "mouse" && hoverClose()}
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => (o && Date.now() - hoverOpenedAt.current < 600 ? true : !o))}
        className={topItem(current || open)}
      >
        {entry.label}
        {current && <span className="sr-only"> (current section)</span>}
        <svg
          aria-hidden="true"
          width="9"
          height="6"
          viewBox="0 0 9 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          className={`mt-0.5 shrink-0 opacity-70 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        >
          <path d="M.5 1 4.5 5l4-4" />
        </svg>
      </button>

      {/* The list, hanging just below the header bar. The space above it is part of it (invisible), so it stays open while the pointer moves down. */}
      <div
        id={panelId}
        hidden={!open}
        style={{ paddingTop: drop }}
        className={`absolute top-full z-50 ${align === "start" ? "-left-6" : "-right-6"}`}
      >
        <ul className="menu-panel min-w-[15rem] border-t border-gold/70 bg-navy-deep py-3 text-left shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)]">
          {entry.children.map((child) => {
            const here = isCurrentPage(pathname, child.href);
            return (
              <li key={child.href}>
                <Link
                  data-menu-link
                  href={child.href}
                  aria-current={here ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-11 items-center gap-3 px-6 font-serif text-[1.0625rem] whitespace-nowrap [font-variation-settings:'opsz'_18] transition-colors focus-visible:bg-ivory/[0.06] ${
                    here ? "text-ivory" : "text-ivory/75 hover:bg-ivory/[0.06] hover:text-ivory"
                  }`}
                >
                  <span aria-hidden="true" className={`h-px w-3 shrink-0 bg-gold transition-opacity ${here ? "opacity-100" : "opacity-0"}`} />
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
