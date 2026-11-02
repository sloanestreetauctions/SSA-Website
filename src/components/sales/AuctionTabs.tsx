import Link from "next/link";

/** "Upcoming" and "Past" tabs at the top of the Auctions pages. */
export function AuctionTabs({ current }: { current: "upcoming" | "past" }) {
  const tab = (href: string, label: string, on: boolean) => (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={`relative inline-flex min-h-12 items-center font-serif text-[1.25rem] [font-variation-settings:'opsz'_18] transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 ${
        on ? "text-ink after:bg-gold" : "text-ink-soft after:bg-transparent hover:text-ink hover:after:bg-ink/25"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Upcoming or past auctions" className="mt-10 flex gap-10 border-b border-line">
      {tab("/auctions", "Upcoming auctions", current === "upcoming")}
      {tab("/auctions/past", "Past auctions", current === "past")}
    </nav>
  );
}
