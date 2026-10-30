import type { ReactNode } from "react";

/**
 * The opening of a content page: words on the left, a photograph on the right.
 * The photograph stays inside the page margins, with breathing room above,
 * below and beside it, so it never runs off the edge of a wide screen.
 *
 * `columns` sets the photo's share of the width on large screens.
 */
const COLUMNS = {
  half: "lg:grid-cols-2",
  wide: "lg:grid-cols-[1fr_1.1fr]",
  narrow: "lg:grid-cols-[1.4fr_1fr]",
} as const;

export function SplitHeader({
  breadcrumbs,
  children,
  media,
  columns = "half",
  tone = "stone",
}: {
  breadcrumbs: ReactNode;
  children: ReactNode;
  /** The photograph; when there is none, the words take the full width. */
  media?: ReactNode;
  columns?: keyof typeof COLUMNS;
  tone?: "stone" | "plain";
}) {
  return (
    <header className={tone === "stone" ? "bg-[#f2ede7]" : ""}>
      <div className={`shell grid gap-10 pt-8 pb-12 md:pb-16 lg:gap-16 lg:pb-16 xl:gap-20 ${media ? COLUMNS[columns] : ""}`}>
        <div className="flex flex-col">
          {breadcrumbs}
          <div className={`flex flex-1 flex-col justify-center pt-10 lg:py-8 ${media ? "" : "max-w-[52rem]"}`}>{children}</div>
        </div>
        {media && <div className="relative lg:mt-14 lg:min-h-[30rem]">{media}</div>}
      </div>
    </header>
  );
}

/** Classes for a photograph that fills the media side of a SplitHeader. */
export const splitMedia = "aspect-[4/3] lg:absolute lg:inset-0 lg:aspect-auto";
