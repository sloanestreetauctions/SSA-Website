"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

/**
 * PAST AUCTIONS — search and pages. The cards are made on the server (so they
 * look exactly like Upcoming auctions); this shows 12 at a time, with a keyword
 * search (name, description, month or year) and a year filter. The search and
 * page are kept in the address (?q=…&year=…&page=…), so a search can be shared
 * or come back to.
 */

export type PastItem = { key: string; year: string; text: string };

const PER_PAGE = 12;
const serif = "font-serif [font-variation-settings:'opsz'_18]";
const field = "min-h-12 w-full appearance-none border border-stone-deep bg-paper px-4 text-[1rem] text-ink focus:border-navy";

/** Lower case, no accents or apostrophes, so "valentines" finds "Valentine’s". */
const simplify = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’‘]/g, "");

function readAddress() {
  const q = new URLSearchParams(window.location.search);
  return { q: q.get("q") ?? "", year: q.get("year") ?? "", page: Math.max(1, Number(q.get("page")) || 1) };
}

export function PastAuctionsBrowser({ items, cards }: { items: PastItem[]; cards: ReactNode[] }) {
  const uid = useId();
  const top = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ q: "", year: "", page: 1 });
  const [ready, setReady] = useState(false);

  // Start from the address (a shared or bookmarked search), once the page has loaded.
  useEffect(() => {
    const fromAddress = readAddress();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the address can only be read in the browser
    setState(fromAddress);
    setReady(true);
    const back = () => setState(readAddress());
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, []);

  const years = useMemo(() => [...new Set(items.map((i) => i.year))].sort((a, b) => b.localeCompare(a)), [items]);

  const matches = useMemo(() => {
    const words = simplify(state.q).split(/\s+/).filter(Boolean);
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => (!state.year || item.year === state.year) && words.every((w) => simplify(item.text).includes(w)));
  }, [items, state.q, state.year]);

  const pages = Math.max(1, Math.ceil(matches.length / PER_PAGE));
  const page = Math.min(state.page, pages);
  const shown = matches.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function update(next: Partial<typeof state>, scroll = false) {
    const merged = { ...state, ...next };
    setState(merged);
    const q = new URLSearchParams();
    if (merged.q) q.set("q", merged.q);
    if (merged.year) q.set("year", merged.year);
    if (merged.page > 1) q.set("page", String(merged.page));
    window.history.replaceState(null, "", `${window.location.pathname}${q.size ? `?${q}` : ""}`);
    if (scroll) top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const filtering = Boolean(state.q || state.year);
  const from = matches.length ? (page - 1) * PER_PAGE + 1 : 0;
  const to = Math.min(page * PER_PAGE, matches.length);

  return (
    <div ref={top} className="scroll-mt-6">
      {/* Search */}
      <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-8 grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-end">
        <div>
          <label htmlFor={`${uid}-q`} className="block font-[560]">
            Search past auctions
          </label>
          <input
            id={`${uid}-q`}
            type="search"
            value={state.q}
            onChange={(e) => update({ q: e.target.value, page: 1 })}
            className={`mt-2 ${field}`}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-year`} className="block font-[560]">
            Year
          </label>
          <div className="relative mt-2">
            <select id={`${uid}-year`} value={state.year} onChange={(e) => update({ year: e.target.value, page: 1 })} className={`${field} pr-10`}>
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2">
              <path d="M3 6l5 5 5-5" />
            </svg>
          </div>
        </div>
      </form>

      <p aria-live="polite" className={`mt-5 ${serif} text-[1.0625rem] text-ink-soft`}>
        {ready &&
          (matches.length === 0
            ? "No past auctions match your search."
            : `Showing ${from}–${to} of ${matches.length} ${matches.length === 1 ? "auction" : "auctions"}`)}
        {filtering && (
          <>
            {" "}
            <button type="button" onClick={() => update({ q: "", year: "", page: 1 })} className="text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink">
              Clear search
            </button>
          </>
        )}
      </p>

      {/* The cards */}
      <ul className="mt-6 grid gap-6 md:grid-cols-2">
        {shown.map(({ item, index }) => (
          <li key={item.key}>{cards[index]}</li>
        ))}
      </ul>

      {/* Pages */}
      {pages > 1 && (
        <nav aria-label="Pages of past auctions" className={`mt-10 flex flex-wrap items-center justify-center gap-2 ${serif} text-[1.125rem]`}>
          <PageButton disabled={page === 1} onClick={() => update({ page: page - 1 }, true)} label="Previous page">
            ←<span className="ml-2 hidden sm:inline">Previous</span>
          </PageButton>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => update({ page: n }, true)}
              aria-current={n === page ? "page" : undefined}
              aria-label={`Page ${n}`}
              className={`inline-flex size-12 items-center justify-center border ${n === page ? "border-navy bg-navy-deep text-ivory" : "border-line text-ink hover:border-navy"}`}
            >
              {n}
            </button>
          ))}
          <PageButton disabled={page === pages} onClick={() => update({ page: page + 1 }, true)} label="Next page">
            <span className="mr-2 hidden sm:inline">Next</span>→
          </PageButton>
        </nav>
      )}
    </div>
  );
}

function PageButton({ disabled, onClick, label, children }: { disabled: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="inline-flex min-h-12 min-w-12 items-center justify-center border border-line px-4 text-ink hover:border-navy disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  );
}
