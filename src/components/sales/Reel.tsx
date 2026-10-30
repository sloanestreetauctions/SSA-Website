"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A horizontal row that visitors can swipe (touch), scroll (trackpad) or step
 * through with the arrow buttons. Items snap into place. The buttons are real
 * buttons, disabled at either end, and the list stays a plain list for screen
 * readers.
 */
export function Reel({
  label,
  heading,
  children,
  itemName = "lots",
}: {
  label: string;
  heading?: ReactNode;
  children: ReactNode;
  /** For the arrow buttons, e.g. "Next lots". */
  itemName?: string;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const step = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const item = el.querySelector("li");
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const amount = item ? (item.getBoundingClientRect().width + gap) * Math.max(1, Math.round(el.clientWidth / (item.getBoundingClientRect().width + gap))) : el.clientWidth;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * amount, behavior: reduce ? "auto" : "smooth" });
  };

  const scrollable = !(atStart && atEnd);
  const button =
    "inline-flex size-12 items-center justify-center border border-ink/25 text-ink transition-colors hover:border-navy hover:text-navy disabled:cursor-default disabled:opacity-30 disabled:hover:border-ink/25 disabled:hover:text-ink";

  return (
    <div role="region" aria-label={label}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>{heading}</div>
        {scrollable && (
          <div className="flex gap-2">
            <button type="button" className={button} onClick={() => step(-1)} disabled={atStart} aria-label={`Previous ${itemName}`}>
              <Chevron direction="left" />
            </button>
            <button type="button" className={button} onClick={() => step(1)} disabled={atEnd} aria-label={`Next ${itemName}`}>
              <Chevron direction="right" />
            </button>
          </div>
        )}
      </div>
      <ul
        ref={track}
        tabIndex={0}
        aria-label={label}
        className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy md:mt-10 md:gap-6"
      >
        {children}
      </ul>
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d={direction === "left" ? "M11 3L5 9l6 6" : "M7 3l6 6-6 6"} />
    </svg>
  );
}
