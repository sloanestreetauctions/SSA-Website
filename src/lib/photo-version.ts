import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Adds a short fingerprint of the file's contents to a photograph's address
 * (e.g. /images/pages/team/…/image.jpg?v=3f9a2c1b). When a photo is replaced
 * in the editor under the same file name, the address changes, so visitors and
 * the site's image cache always get the new picture, never a stale copy.
 */
const cache = new Map<string, { mtime: number; version: string }>();

export function versioned(src: string): string {
  if (!src.startsWith("/images/pages/")) return src;
  try {
    const file = join(process.cwd(), "public", src);
    const mtime = statSync(file).mtimeMs;
    const hit = cache.get(src);
    if (hit && hit.mtime === mtime) return `${src}?v=${hit.version}`;
    const version = createHash("sha1").update(readFileSync(file)).digest("hex").slice(0, 10);
    cache.set(src, { mtime, version });
    return `${src}?v=${version}`;
  } catch {
    return src;
  }
}
