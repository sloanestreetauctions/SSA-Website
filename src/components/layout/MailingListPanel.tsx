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
      className="theme-dark fixed inset-x-0 bottom-0 z-50 border-t-2 border-tan bg-navy-deep text-ivory shadow-[0_-12px_40px_-12px_rgba(5,10,20,0.5)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[21.5rem] sm:border sm:border-t-2 sm:border-ivory/15 sm:border-t-tan sm:shadow-[0_18px_50px_-14px_rgba(5,10,20,0.6)] motion-safe:animate-[ssa-rise_420ms_ease-out]"
    >
      <div className="relative px-5 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-5">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-1 right-1 inline-flex size-11 items-center justify-center text-ivory/70 hover:text-ivory"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>

        <h2 id={titleId} className="pr-8 font-serif text-[1.375rem] leading-tight text-ivory [font-variation-settings:'opsz'_36]">
          {content.title || "Join our mailing list"}
        </h2>

        {state === "done" ? (
          <p role="status" className="mt-2 font-serif text-[1.0625rem] leading-snug text-ivory [font-variation-settings:'opsz'_18]">
            {content.successText || "Thank you. Please check your inbox to confirm your subscription."}
          </p>
        ) : (
          <>
            {content.text && (
              <p className="mt-1.5 font-serif text-[1rem] leading-snug text-ivory/80 [font-variation-settings:'opsz'_18]">{content.text}</p>
            )}
            <form onSubmit={submit} noValidate className="mt-4">
              <label htmlFor={`${titleId}-email`} className="sr-only">
                Email address
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  id={`${titleId}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-invalid={state === "error" || undefined}
                  aria-describedby={message ? `${titleId}-msg` : undefined}
                  placeholder="Your email address"
                  className="min-h-11 w-full min-w-0 flex-1 border border-ivory/30 bg-white px-3 font-sans text-[0.9375rem] text-ink placeholder:text-ink-soft/80 focus:outline-2 focus:outline-offset-2 focus:outline-tan"
                />
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="min-h-11 shrink-0 bg-tan px-4 font-serif text-[1rem] text-navy-deep hover:bg-ivory disabled:opacity-60"
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
                <p id={`${titleId}-msg`} role="alert" className="mt-2 font-sans text-[0.875rem] text-[#ffb4a8]">
                  {message}
                </p>
              )}
              {consent && <p className="mt-2.5 font-sans text-[0.75rem] leading-snug text-ivory/65">{consent}</p>}
              {preview && (
                <p className="mt-2.5 border-l-2 border-tan pl-2.5 font-sans text-[0.75rem] leading-snug text-ivory/70">
                  Preview only: not connected to Mailchimp yet, so nothing is sent.
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
