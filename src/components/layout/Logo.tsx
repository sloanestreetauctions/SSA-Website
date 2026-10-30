import Image from "next/image";

/**
 * THE SLOANE STREET AUCTIONS LOGO — APPROVED BRAND ASSET. DO NOT ALTER.
 *
 * One file, one colour: PANTONE 871 C (metallic gold), shown on screen as its
 * official equivalent #84754E. Taken from the original vector print artwork,
 * not redrawn. Never recolour, tint, filter, invert or reshape it, and never
 * swap it for a different colour on light or dark backgrounds — change the
 * background or placement instead.
 *
 * Vector masters: /brand-source/vector/logo-*-pantone-871c.svg
 */
export function LogoLockup({ className = "", preload = false }: { className?: string; preload?: boolean }) {
  return (
    <Image quality={90}
      src="/brand/logo.png"
      alt="Sloane Street Auctions"
      width={288}
      height={131}
      preload={preload}
      sizes="(min-width: 1280px) 220px, (min-width: 768px) 180px, 140px"
      className={`h-auto ${className}`}
    />
  );
}
