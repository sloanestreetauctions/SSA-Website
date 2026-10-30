/**
 * Checks every content file in src/content/pages against the editing screen's
 * definitions (keystatic.config.ts), so a hand-edited file with a missing or
 * misspelt field is caught before the site is built. Part of `npm run check`.
 */
import { createReader } from "@keystatic/core/reader";
import config from "../keystatic.config.ts";

const reader = createReader(new URL("..", import.meta.url).pathname, config);
let failures = 0;
for (const [key, singleton] of Object.entries(config.singletons)) {
  try {
    await (reader.singletons as Record<string, { readOrThrow(): Promise<unknown> }>)[key].readOrThrow();
  } catch (error) {
    failures++;
    console.error(`✗ ${singleton.label}: ${(error as Error).message}`);
  }
}
console.log(failures ? `Content check: ${failures} page(s) need fixing.` : `Content check: all ${Object.keys(config.singletons).length} pages are valid.`);
process.exit(failures ? 1 : 0);
