"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

/**
 * MAILING LIST — a small, polite panel (bottom-right on laptops, along the
 * bottom on phones) inviting visitors to join the mailing list. It is not a
 * modal: the page stays usable behind it.
 *
 *  - Appears once, after a short time on the site or halfway down a page.
 *  - Closing it keeps it away for 90 days; signing up keeps it away for good.
 *  - Never shown on the valuation form or in the editor.
 */
const DISMISSED = "ssa-mailing-dismissed";
const JOINED = "ssa-mailing-joined";
const QUIET_DAYS = 90;
const HIDDEN_ON = ["/valuation", "/keystatic"];

export type MailingListContent = {
  title: string;
  text: string;
  buttonLabel: string;
  successText: string;
  delaySeconds: number;
};

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* Private browsing: the panel may simply appear again next visit. */
  }
}

export function MailingListPanel({
  content,
  consent,
  preview,
}: {
  content: MailingListContent;
  /** The consent line, already rendered (with its links) on the server. */
  consent: ReactNode;
  preview: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const hidden = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (hidden || open) return;
    if (read(JOINED)) return;
    const dismissed = Number(read(DISMISSED) ?? 0);
    if (dismissed && Date.now() - dismissed < QUIET_DAYS * 864e5) return;

    const show = () => setOpen(true);
    const timer = window.setTimeout(show, Math.max(3, content.delaySeconds || 20) * 1000);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max > 0.5) show();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [hidden, open, content.delaySeconds]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function close() {
    setOpen(false);
    if (state !== "done") write(DISMISSED, String(Date.now()));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    setMessage("");
    try {
      const res = await fetch("/api/mailing-list", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (res.ok && data.ok) {
        setState("done");
        write(JOINED, "1");
      } else {
        setState("error");
        setMessage(data.message ?? "Sorry, something went wrong. Please try again.");
        inputRef.current?.focus();
      }
    } catch {
      setState("error");
      setMessage("Sorry, we couldn’t reach the server. Please check your connection and try again.");
    }
  }

  if (hidden || !open) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-paper shadow-[0_-12px_40px_-12px_rgba(10,15,30,0.35)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[26rem] sm:border sm:shadow-[0_18px_50px_-14px_rgba(10,15,30,0.45)] motion-safe:animate-[ssa-rise_420ms_ease-out]"
    >
      <div className="relative px-6 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-7">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-2 right-2 inline-flex size-11 items-center justify-center text-ink-soft hover:text-navy"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>

        <h2 id={titleId} className="pr-8 font-serif text-[1.75rem] leading-tight text-navy [font-variation-settings:'opsz'_36]">
          {content.title || "Join our mailing list"}
        </h2>

        {state === "done" ? (
          <p role="status" className="mt-3 font-serif text-[1.1875rem] leading-snug text-ink [font-variation-settings:'opsz'_18]">
            {content.successText || "Thank you. Please check your inbox to confirm your subscription."}
          </p>
        ) : (
          <>
            {content.text && (
              <p className="mt-2 font-serif text-[1.125rem] leading-snug text-ink-soft [font-variation-settings:'opsz'_18]">{content.text}</p>
            )}
            <form onSubmit={submit} noValidate className="mt-5">
              <label htmlFor={`${titleId}-email`} className="block font-sans text-[0.875rem] text-ink">
                Email address
              </label>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <input
                  ref={inputRef}
                  id={`${titleId}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-invalid={state === "error" || undefined}
                  aria-describedby={message ? `${titleId}-msg` : undefined}
                  className="min-h-12 w-full min-w-0 flex-1 border border-ink/30 bg-white px-3 font-sans text-[1rem] text-ink focus:border-navy focus:outline-2 focus:outline-offset-0 focus:outline-navy"
                />
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="min-h-12 shrink-0 bg-navy-deep px-6 font-serif text-[1.0625rem] text-ivory hover:bg-navy-soft disabled:opacity-60"
                >
                  {state === "sending" ? "Sending…" : content.buttonLabel || "Sign up"}
                </button>
              </div>
              {/* Spam trap: hidden from people, filled in by bots. */}
              <div aria-hidden="true" className="absolute -left-[9999px]">
                <label>
                  Website <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              {message && (
                <p id={`${titleId}-msg`} role="alert" className="mt-2 font-sans text-[0.875rem] text-[#9b2c2c]">
                  {message}
                </p>
              )}
              {consent && <p className="mt-3 font-sans text-[0.8125rem] leading-relaxed text-ink-soft">{consent}</p>}
              {preview && (
                <p className="mt-3 border-l-2 border-gold pl-3 font-sans text-[0.8125rem] text-ink-soft">
                  Preview on your computer: sign-ups aren’t sent until Mailchimp is connected. On the live site this panel stays hidden until then.
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
