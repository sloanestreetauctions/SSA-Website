import { PhotoToCome } from "@/components/ui/PhotoToCome";
import { Arrow } from "@/components/ui/Button";
import { hasPhoto, instagram, settings } from "@/content";
import { getBeholdPosts } from "@/lib/instagram-feed";

/**
 * INSTAGRAM STRIP — a row of square photos, each linking to its Instagram post.
 * Automatic when a Behold feed address is set in the editor (your latest six
 * posts, refreshed about hourly); otherwise the photos added there by hand.
 * Hidden when there is nothing to show.
 */
export async function InstagramStrip() {
  const ig = instagram;
  if (ig.show === false) return null;
  const feed = ig.feedUrl ? await getBeholdPosts(ig.feedUrl) : [];
  const posts = (ig.posts ?? []).filter((p) => hasPhoto(p.photo));
  if (feed.length === 0 && posts.length === 0) return null;
  const profile = settings.instagram;

  return (
    <section aria-label={ig.title || "Instagram"} className="shell pt-6 pb-14 md:pt-8 md:pb-[4.5rem]">
      <div className="flex flex-wrap items-end justify-between gap-6">
        {ig.title && (
          <h2 className="font-serif text-[2.25rem] leading-tight font-[380] [font-variation-settings:'opsz'_60] md:text-[3.25rem]">{ig.title}</h2>
        )}
        {profile && ig.linkLabel && (
          <a
            href={profile}
            className="group inline-flex shrink-0 items-center gap-3 border-b border-ink/40 pb-0.5 font-serif text-[1.25rem] [font-variation-settings:'opsz'_18] hover:border-ink"
          >
            {ig.linkLabel} <Arrow />
          </a>
        )}
      </div>
      <ul className="mt-8 grid grid-cols-3 gap-2 md:mt-10 md:grid-cols-6 md:gap-3">
        {feed.length > 0
          ? feed.map((post) => (
              <li key={post.id}>
                <a href={post.link || settings.instagram || "https://www.instagram.com/"} className="group block">
                  {/* Images come from Behold's own image service, already sized for this strip. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image}
                    alt={post.alt}
                    loading="lazy"
                    decoding="async"
                    className="aspect-square w-full object-cover transition-opacity duration-300 group-hover:opacity-85"
                  />
                  <span className="sr-only"> (on Instagram)</span>
                </a>
              </li>
            ))
          : posts.slice(0, 12).map((post, i) => {
              const img = (
                <PhotoToCome
                  photo={post.photo}
                  className="aspect-square transition-opacity duration-300 group-hover:opacity-85"
                  sizes="(min-width: 768px) 16vw, 33vw"
                />
              );
              return (
                <li key={`${post.photo.image}-${i}`}>
                  {post.link ? (
                    <a href={post.link} className="group block">
                      {img}
                      <span className="sr-only">{post.photo.alt ? `${post.photo.alt} (on Instagram)` : "View this post on Instagram"}</span>
                    </a>
                  ) : (
                    img
                  )}
                </li>
              );
            })}
      </ul>
    </section>
  );
}
