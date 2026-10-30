import { easyLive } from "@/content";

/**
 * Old addresses that belonged to the Easy Live side of the previous website
 * (sign-in, registration, catalogues and lots). They are forwarded to the same
 * place on the Easy Live auction site once its address is set in the editor
 * (Auction calendar → Easy Live links); until then, to the nearest page here.
 */
export function toSignIn(): Response {
  return redirect(easyLive.signIn ?? "/how-to-buy#register");
}

export function toEasyLive(request: Request, fallback = "/auctions"): Response {
  if (!easyLive.site) return redirect(fallback);
  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, easyLive.site);
  return redirect(target.toString());
}

function redirect(location: string): Response {
  // 307: temporary, because the destination depends on settings that may change.
  return new Response(null, { status: 307, headers: { Location: location } });
}
