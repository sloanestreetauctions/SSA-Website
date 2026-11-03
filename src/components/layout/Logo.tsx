import Image from "next/image";

/**
 * THE SLOANE STREET AUCTIONS LOGO — APPROVED BRAND ASSET. DO NOT ALTER.
 *
 * The gilded crest over the wordmark, approved by the owner in November 2026.
 * This file is the version made for the navy header, footer and menu (slightly
 * brighter gold so it reads as gold on navy). For white or ivory backgrounds
 * use the "logo-gold" version. Never recolour, tint, filter or reshape it.
 *
 * Vector masters: /brand-source/vector/logo-gold*.svg and crest-gold*.svg
 */
export function LogoLockup({ className = "", preload = false }: { className?: string; preload?: boolean }) {
  return (
    <Image quality={90}
      src="/brand/logo.png"
      alt="Sloane Street Auctions"
      width={288}
      height={150}
      preload={preload}
      sizes="(min-width: 1280px) 220px, (min-width: 768px) 180px, 140px"
      className={`h-auto ${className}`}
    />
  );
}
