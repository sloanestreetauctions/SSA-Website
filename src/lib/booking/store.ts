import "server-only";
import { createHash, randomUUID } from "node:crypto";

/**
 * A tiny shared store (Upstash Redis, free plan, added from Vercel → Storage)
 * used for two things only:
 *  - a two-minute "hold" on a time while it is being booked, so two people
 *    pressing "Confirm" at the same moment can't both get it;
 *  - counting booking attempts, to slow down spam.
 * It never holds names, emails or phone numbers: only the appointment time and
 * a one-way scrambled form of the visitor's network address, which expire on
 * their own.
 *
 * Settings (added automatically by Vercel's Upstash integration):
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN  (or KV_REST_API_URL / KV_REST_API_TOKEN)
 */

const url = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const storeConfigured = () => Boolean(url() && token());

async function command<T = unknown>(...args: (string | number)[]): Promise<T> {
  const res = await fetch(url()!, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify(args.map(String)),
    signal: AbortSignal.timeout(5_000),
  });
  if (!res.ok) throw new Error(`Booking store unavailable (${res.status}).`);
  return ((await res.json()) as { result: T }).result;
}

/** Holds `key` for a short while. Returns a release function, or null if someone else is holding it. */
export async function hold(key: string, seconds = 120): Promise<(() => Promise<void>) | null> {
  const mine = randomUUID();
  const ok = await command<string | null>("SET", key, mine, "NX", "EX", seconds);
  if (ok !== "OK") return null;
  return async () => {
    // Only let go if it's still our hold (it may have expired and been taken by someone else).
    await command(
      "EVAL",
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      1,
      key,
      mine,
    ).catch(() => {});
  };
}

/** True while `who` has made fewer than `limit` attempts in the last `seconds`. */
export async function withinLimit(bucket: string, who: string, limit: number, seconds: number): Promise<boolean> {
  const key = `ratelimit:${bucket}:${createHash("sha256").update(who).digest("hex").slice(0, 32)}`;
  const count = await command<number>("INCR", key);
  if (count === 1) await command("EXPIRE", key, seconds);
  return count <= limit;
}
