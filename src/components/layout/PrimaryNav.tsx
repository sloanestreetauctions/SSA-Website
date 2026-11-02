"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "@/lib/site";

/** True when `pathname` is inside the section that `href` leads to. */
export function isCurrentSection(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The header splits the main navigation either side of the centred logo. */
const groups = {
  left: primaryNav.filter((i) => ["/auctions", "/how-to-buy", "/sell"].includes(i.href)),
  right: primaryNav.filter((i) => ["/private-sales", "/about", "/contact"].includes(i.href)),
};

/**
 * Desktop navigation links. The current section is underlined in gold and
 * announced to screen readers, so visitors always know where they are.
 * `pathname` is null while the page is being prerendered (no highlight yet).
 */
export function NavGroupLinks({
  group,
  pathname,
  tone = "light",
}: {
  group: keyof typeof groups;
  pathname: string | null;
  tone?: "dark" | "light";
}) {
  const on = tone === "dark" ? "text-ivory" : "text-ink";
  const off = tone === "dark" ? "text-ivory/75 hover:text-ivory" : "text-ink/70 hover:text-ink";
  return (
    <nav aria-label={group === "left" ? "Main" : "About the house"} className="hidden min-[860px]:block">
      <ul className="flex items-center gap-[clamp(1.25rem,3.75vw,3rem)] min-[1440px]:gap-14 2xl:gap-16">
        {groups[group].map((item) => {
          const current = isCurrentSection(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`relative py-2 font-serif whitespace-nowrap [font-variation-settings:'opsz'_18] text-[clamp(0.9375rem,1.5625vw,1.25rem)] transition-colors 2xl:text-[1.375rem] ${
                  current ? on : off
                } after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-gold after:transition-transform after:duration-300 ${
                  current ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function NavGroup({ group, tone = "light" }: { group: keyof typeof groups; tone?: "dark" | "light" }) {
  return <NavGroupLinks group={group} pathname={usePathname()} tone={tone} />;
}
