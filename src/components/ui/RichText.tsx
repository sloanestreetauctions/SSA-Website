import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { isPageOn, tokens } from "@/content";

/**
 * Text from the editor, with two simple conveniences:
 *  - [the words](address) becomes a link
 *  - {phone}, {phone2}, {email}, {accountsEmail} become the live contact details, linked
 * Anything else is shown exactly as typed.
 */
const PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)|\{(\w+)\}/g;

export function RichText({ text, linkClassName = "", nowrapTokens = true }: { text: string; linkClassName?: string; nowrapTokens?: boolean }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(PATTERN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    if (m[1] !== undefined) {
      out.push(<SmartLink key={at} href={m[2]} className={linkClassName}>{m[1]}</SmartLink>);
    } else {
      const token = tokens[m[3]];
      if (token) {
        const isPhone = token.href.startsWith("tel:");
        out.push(
          <a
            key={at}
            href={token.href}
            className={`${linkClassName} ${isPhone && nowrapTokens ? "whitespace-nowrap" : ""} ${isPhone ? "" : "break-words"}`}
          >
            {token.text}
          </a>,
        );
      } else {
        out.push(m[0]);
      }
    }
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</>;
}

/** Internal addresses (starting with /) use the site's fast navigation; everything else is a normal link. */
export function SmartLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (href.startsWith("/") && !isPageOn(href)) return <>{children}</>;
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

/** Headline text where the editor's line breaks become breaks on larger screens only. */
export function BreakLines({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <>
              {" "}
              <br className="hidden md:block" />
            </>
          )}
          {l}
        </Fragment>
      ))}
    </>
  );
}
