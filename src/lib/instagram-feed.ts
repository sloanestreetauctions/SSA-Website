import { cacheLife } from "next/cache";

/** One Instagram post, ready to show. */
export type FeedPost = { id: string; link: string; image: string; alt: string };

type BeholdSize = { mediaUrl?: string };
type BeholdPost = {
  id?: string;
  permalink?: string;
  mediaType?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  sizes?: { small?: BeholdSize; medium?: BeholdSize; large?: BeholdSize };
  altText?: string;
  prunedCaption?: string;
};

/**
 * The latest posts from a Behold feed (behold.so turns an Instagram account
 * into a JSON feed). Fetched by the website at most about once an hour, not by
 * each visitor, so the free plan's monthly view limit is never reached.
 * Returns [] if the feed can't be read, so the strip simply falls back.
 */
export async function getBeholdPosts(feedUrl: string): Promise<FeedPost[]> {
  "use cache";
  cacheLife("hours");
  if (!/^https:\/\/feeds\.behold\.so\/[\w-]+\/?$/.test(feedUrl.trim()) && !process.env.INSTAGRAM_FEED_TEST) return [];
  try {
    const res = await fetch(feedUrl.trim(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { posts?: BeholdPost[] } | BeholdPost[];
    const posts = Array.isArray(data) ? data : (data.posts ?? []);
    return posts
      .map((p, i) => {
        const image = p.sizes?.medium?.mediaUrl || p.sizes?.small?.mediaUrl || (p.mediaType === "VIDEO" ? p.thumbnailUrl : p.mediaUrl) || "";
        const caption = (p.altText || p.prunedCaption || "").replace(/\s+/g, " ").trim();
        return {
          id: p.id || String(i),
          link: p.permalink || "",
          image,
          alt: caption.length > 140 ? `${caption.slice(0, 137)}…` : caption,
        };
      })
      .filter((p) => p.image.startsWith("https://") || Boolean(process.env.INSTAGRAM_FEED_TEST))
      .slice(0, 6);
  } catch {
    return [];
  }
}
