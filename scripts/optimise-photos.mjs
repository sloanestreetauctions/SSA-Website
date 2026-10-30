/**
 * Keeps the website's photographs at a sensible size, automatically.
 *
 * Photos added in the editor are often straight from a camera (6,000–8,000 px,
 * 20–35 MB). Visitors never download those (the site sends each screen a
 * small copy), but huge files slow every build and can exceed hosting limits.
 *
 * Any photo in public/images/pages whose longest side is over 4,000 px, or whose
 * file is over 10 MB, is resized to 4,000 px on its longest side at high quality
 * (JPEG quality 90). 4,000 px is still more than twice the detail any screen
 * shows. Very large PNG photographs are saved as JPEG (white behind any
 * transparency) and the editor's content is updated to match.
 *
 * Only the website's copies change; keep your originals. Runs before
 * `npm run dev` and `npm run build`. Does nothing if the image tool is missing.
 */
import { readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const PUBLIC = join(ROOT, "public");
const FOLDER = join(PUBLIC, "images", "pages");
const CONTENT = join(ROOT, "src", "content", "pages");
const MAX_EDGE = 4000;
const MAX_BYTES = 10 * 1024 * 1024;

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("Photo optimiser: image tool not available, skipping.");
  process.exit(0);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const renamed = [];
let count = 0;
for (const file of walk(FOLDER)) {
  if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
  const bytes = statSync(file).size;
  const meta = await sharp(file).metadata();
  const edge = Math.max(meta.width ?? 0, meta.height ?? 0);
  if (edge <= MAX_EDGE && bytes <= MAX_BYTES) continue;

  const isPng = /\.png$/i.test(file);
  const toJpeg = isPng && bytes > MAX_BYTES;
  const target = toJpeg ? file.replace(/\.png$/i, ".jpg") : file;
  let pipeline = sharp(file, { limitInputPixels: false })
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true });
  if (/\.jpe?g$/i.test(target)) pipeline = (toJpeg ? pipeline.flatten({ background: "#ffffff" }) : pipeline).jpeg({ quality: 90, mozjpeg: true });
  else if (/\.png$/i.test(target)) pipeline = pipeline.png({ compressionLevel: 9 });
  else pipeline = pipeline.webp({ quality: 90 });

  const out = await pipeline.toBuffer();
  writeFileSync(target + ".tmp", out);
  renameSync(target + ".tmp", target);
  if (toJpeg) {
    unlinkSync(file);
    renamed.push(["/" + relative(PUBLIC, file).split(sep).join("/"), "/" + relative(PUBLIC, target).split(sep).join("/")]);
  }
  count++;
  console.log(
    `Photo resized for the web: ${relative(PUBLIC, target)} (${Math.round(bytes / 1048576)} MB → ${Math.max(1, Math.round(out.length / 1048576))} MB)`,
  );
}

// Point the editor's content at any photo that changed from PNG to JPEG.
if (renamed.length) {
  for (const name of readdirSync(CONTENT).filter((n) => n.endsWith(".json"))) {
    const path = join(CONTENT, name);
    let text = readFileSync(path, "utf8");
    const before = text;
    for (const [from, to] of renamed) text = text.split(`"${from}"`).join(`"${to}"`);
    if (text !== before) writeFileSync(path, text);
  }
}
if (count) console.log(`Photo optimiser: ${count} photograph(s) resized.`);
