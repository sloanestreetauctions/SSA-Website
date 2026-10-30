/**
 * Reads the width and height of every photograph in public/images and saves
 * them to src/content/photo-sizes.json, so nobody has to measure images by hand.
 *
 * Runs automatically before `npm run dev` and `npm run build`.
 * Supports JPEG, PNG and WebP. No extra software needed.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const PUBLIC = join(ROOT, "public");
const FOLDER = join(PUBLIC, "images");
const OUT = join(ROOT, "src", "content", "photo-sizes.json");

function jpegSize(b) {
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    // Start-of-frame markers carry the dimensions (excluding DHT/JPG/DAC)
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

function jpegOrientationSwaps(b) {
  // EXIF orientation 5–8 means the photo is shown rotated 90°, so width/height swap.
  const exif = b.indexOf(Buffer.from("Exif\0\0"));
  if (exif < 0 || exif > 65536) return false;
  const tiff = exif + 6;
  const le = b.toString("ascii", tiff, tiff + 2) === "II";
  const u16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
  const u32 = (o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
  const ifd = tiff + u32(tiff + 4);
  const count = u16(ifd);
  for (let n = 0; n < count; n++) {
    const entry = ifd + 2 + n * 12;
    if (u16(entry) === 0x0112) return u16(entry + 8) >= 5;
  }
  return false;
}

function sizeOf(file) {
  const b = readFileSync(file);
  if (b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") {
      const bits = b.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (kind === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    const s = jpegSize(b);
    if (s && jpegOrientationSwaps(b)) return { width: s.height, height: s.width };
    return s;
  }
  return null;
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const sizes = {};
const skipped = [];
for (const file of walk(FOLDER).sort()) {
  if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
  const size = sizeOf(file);
  const url = "/" + relative(PUBLIC, file).split(sep).join("/");
  if (size) sizes[url] = size;
  else skipped.push(url);
}

writeFileSync(OUT, JSON.stringify(sizes, null, 2) + "\n");
console.log(`Photo sizes: ${Object.keys(sizes).length} photographs measured.`);
if (skipped.length) console.warn(`Could not read: ${skipped.join(", ")} — please save as JPEG, PNG or WebP.`);
