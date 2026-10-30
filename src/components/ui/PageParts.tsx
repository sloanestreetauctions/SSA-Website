import type { ReactNode } from "react";

/** Small print kept readable: a ruled list in muted ink. */
export function Notes({ items }: { items: readonly ReactNode[] }) {
  return (
    <ul className="space-y-3 border-l-2 border-gold pl-5 text-ink-soft">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
