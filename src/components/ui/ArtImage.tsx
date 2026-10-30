import Image from "next/image";

export type ImageAsset = {
  src: string;
  width: number;
  height: number;
  alt: string;
  isPlaceholder: boolean;
  /** "white" for object photography or drawings on a white background, blended into the page. */
  background?: "white" | "scene";
};

type ArtImageProps = {
  image: ImageAsset;
  /** Tells the browser how wide the image will display, for responsive loading. */
  sizes: string;
  /** Load immediately (use for the first large image on a page). */
  priority?: boolean;
  /** Kept for compatibility; the component now decides automatically (see below). */
  fit?: "cover" | "contain";
  /** Tailwind aspect-ratio class for the frame, e.g. "aspect-[4/5]". */
  frameClassName?: string;
  imageClassName?: string;
  /** Show the "Placeholder image" tag when the image is a stand-in. */
  showPlaceholderTag?: boolean;
};

/** Reads the box shape from its aspect class (e.g. "aspect-[4/3]", "aspect-[1.6]", "aspect-square"). */
function boxRatio(frameClassName: string): number | null {
  const first = frameClassName.split(/\s+/).find((c) => c.startsWith("aspect-"));
  if (!first) return null;
  if (first === "aspect-square") return 1;
  if (first === "aspect-video") return 16 / 9;
  const m = first.match(/^aspect-\[(\d*\.?\d+)(?:\/(\d*\.?\d+))?\]$/);
  if (!m) return null;
  return m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1]);
}

/** A box may be filled edge to edge when that trims no more than 6% of the photograph. */
const FILL_TOLERANCE = 0.06;

/**
 * THE SITE-WIDE IMAGE RULE — every image either:
 *  1. fills its box completely (when the shapes match closely enough that
 *     filling trims almost nothing), or
 *  2. is shown whole with NO tinted box behind it, so any space around it is
 *     the page's own background colour.
 * Studio photographs on white have their white blended into the background
 * behind them, so they never sit in a white rectangle.
 * Abstract placeholders always fill their box and are labelled as such.
 */
export function ArtImage({
  image,
  sizes,
  priority = false,
  frameClassName = "",
  imageClassName = "",
  showPlaceholderTag = true,
}: ArtImageProps) {
  const onWhite = image.background === "white";
  const box = boxRatio(frameClassName);
  const ratio = image.width / image.height;
  const shapesMatch = box !== null && Math.abs(ratio / box - 1) <= FILL_TOLERANCE;
  const fill = image.isPlaceholder || (shapesMatch && !onWhite);

  return (
    <div className={`relative overflow-hidden ${frameClassName}`}>
      <Image quality={90}
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        preload={priority}
        className={`${fill ? "object-cover" : "object-contain"} ${onWhite ? "mix-blend-multiply" : ""} ${imageClassName}`}
      />
      {image.isPlaceholder && showPlaceholderTag && <PlaceholderTag />}
    </div>
  );
}

export function PlaceholderTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute bottom-3 left-3 bg-ivory/90 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-ink-soft ${className}`}
    >
      Placeholder image
    </span>
  );
}
