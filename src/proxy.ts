import { NextResponse, type NextRequest } from "next/server";

/**
 * PRIVATE PREVIEW LOCK
 * While the setting SITE_PASSWORD is present on the host (Vercel → Settings →
 * Environment Variables), every page, photo and file asks for a password
 * first: the browser shows its own sign-in box (any name, that password).
 * Remove the setting and redeploy to open the site to the public at launch.
 * Without it (and on your computer) this does nothing.
 */
export function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const given = decoded.slice(decoded.indexOf(":") + 1);
      if (sameText(given, password)) return NextResponse.next();
    } catch {
      /* fall through to asking again */
    }
  }
  return new NextResponse("This site is private for now.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Sloane Street Auctions preview", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

/** Compares without leaking how many characters matched. */
function sameText(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
