import { toEasyLive } from "@/lib/easy-live-redirect";

/** Auction registration pages from the previous website → the same page on the Easy Live auction site. */
export function GET(request: Request) {
  return toEasyLive(request);
}
