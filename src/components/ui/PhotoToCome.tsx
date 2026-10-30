import Image from "next/image";
import { hasPhoto, type EditorialPhoto } from "@/content";
import sizes from "@/content/photo-sizes.json";
import { versioned } from "@/lib/photo-version";
import { ArtImage } from "./ArtImage";

/**
 * Editorial photographs (showroom, team, atmosphere), chosen in the editing
 * screen. When no photograph is set (or it has been removed), nothing is shown
 * and the layout around it closes up.
 */
const measured = sizes as Record<string, { width: number; height: number }>;

/** Atmosphere photograph: always fills its space edge to edge. */
export function PhotoToCome({
  photo,
  className = "",
  priority = false,
  sizes: sizesAttr = "(min-width: 1024px) 50vw, 100vw",
}: {
  photo: EditorialPhoto | null | undefined;
  /** Kept for older call sites; no longer changes anything. */
  tone?: "light" | "dark";
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (!hasPhoto(photo)) return null;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image quality={90} src={versioned(photo.image)} alt={photo.alt ?? ""} fill preload={priority} sizes={sizesAttr} className="object-cover" />
    </div>
  );
}

/**
 * Object photograph (e.g. a lot or drawing on white): follows the site-wide
 * image rule, filling its box only when that crops almost nothing, otherwise
 * shown whole on the page's own background. Shows nothing if no photo is set.
 */
export function ObjectPhoto({
  photo,
  sizes: sizesAttr,
  frameClassName,
  priority,
}: {
  photo: EditorialPhoto | null | undefined;
  sizes: string;
  frameClassName: string;
  priority?: boolean;
}) {
  if (!hasPhoto(photo)) return null;
  // A photo added moments ago may not be measured until the next restart: show it whole meanwhile.
  const size = measured[photo.image] ?? { width: 1, height: 100 };
  return (
    <ArtImage
      image={{ src: versioned(photo.image), ...size, alt: photo.alt ?? "", isPlaceholder: false, background: photo.onWhite ? "white" : "scene" }}
      sizes={sizesAttr}
      priority={priority}
      frameClassName={frameClassName}
    />
  );
}
