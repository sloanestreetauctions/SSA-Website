"use client";

import Link from "next/link";
import { useEffect, useId, useState, type FormEvent } from "react";

/**
 * The cancel page's box: reads the link (ref, start, t, by), shows which
 * appointment it is, and cancels on a second, deliberate press. From the house
 * link ("by=house") there is an optional note for the client.
 */

type Found = { when: string; reference: string; clientName?: string };
type CancelLink = { ref: string; start: string; t: string; by: "client" | "house" };

const serif = "font-serif [font-variation-settings:'opsz'_18]";
const box = "border-t-2 border-navy bg-paper px-6 py-10 md:px-10";

export function CancelAppointment({ phone, rebook }: { phone: string; rebook: string }) {
  const uid = useId();
  const [link, setLink] = useState<CancelLink | null>(null);
  const [found, setFound] = useState<Found | null>(null);
  const [problem, setProblem] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ when: string; emailed: boolean } | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const l: CancelLink = { ref: q.get("ref") ?? "", start: q.get("start") ?? "", t: q.get("t") ?? "", by: q.get("by") === "house" ? "house" : "client" };
    const query = new URLSearchParams({ ref: l.ref, start: l.start, t: l.t, ...(l.by === "house" ? { by: "house" } : {}) });
    fetch(`/api/appointments/cancel?${query}`, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as Found & { ok?: boolean; message?: string };
        if (res.ok && body.ok) {
          setLink(l);
          setFound(body);
        } else setProblem(body.message || `Sorry, we can’t look up the appointment just now. Please call us on ${phone}.`);
      })
      .catch(() => setProblem(`Sorry, we can’t look up the appointment just now. Please call us on ${phone}.`));
  }, [phone]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!link || sending) return;
    setSending(true);
    setProblem("");
    try {
      const res = await fetch("/api/appointments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...link, note }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; when?: string; emailed?: boolean; message?: string };
      if (res.ok && body.ok) setDone({ when: body.when ?? found?.when ?? "", emailed: Boolean(body.emailed) });
      else setProblem(body.message || `Sorry, we couldn’t cancel that just now. Please call us on ${phone}.`);
    } catch {
      setProblem(`Sorry, we couldn’t cancel that just now. Please call us on ${phone}.`);
    } finally {
      setSending(false);
    }
  }

  const house = link?.by === "house";

  if (done) {
    return (
      <div role="status" className={box}>
        <h2 className="font-serif text-[2rem] leading-tight font-[380] text-navy [font-variation-settings:'opsz'_60]">Appointment cancelled</h2>
        <p className={`mt-5 ${serif} text-[1.25rem] leading-snug text-ink`}>{done.when}</p>
        <p className={`mt-5 ${serif} text-[1.125rem] leading-[1.5] text-ink-soft`}>
          {house
            ? done.emailed
              ? "The client has been emailed, and the time is free to book again."
              : "The time is free to book again, but the email to the client couldn’t be sent: please let them know."
            : done.emailed
              ? "We’ve emailed you to confirm."
              : "It’s cancelled, though we couldn’t send the email confirming it."}
        </p>
        {!house && (
          <p className={`mt-6 ${serif} text-[1.125rem]`}>
            <Link href={rebook} className="text-navy underline decoration-gold underline-offset-4">
              Book another time
            </Link>
          </p>
        )}
      </div>
    );
  }

  if (problem && !found) {
    return (
      <div role="alert" className={`${box} ${serif} text-[1.1875rem] leading-[1.5] text-ink`}>
        <p>{problem}</p>
        <p className="mt-5">
          <Link href={rebook} className="text-navy underline decoration-gold underline-offset-4">
            Book an appointment
          </Link>
        </p>
      </div>
    );
  }

  if (!found) return <p className={`${serif} text-[1.1875rem] text-ink-soft`}>Looking up the appointment…</p>;

  return (
    <form onSubmit={submit} className={box}>
      <p className="type-label text-gold-ink">Reference {found.reference}</p>
      <p className={`mt-4 ${serif} text-[1.375rem] leading-snug text-ink`}>
        {house && found.clientName ? `${found.clientName}: ` : ""}
        {found.when}
      </p>
      <p className={`mt-4 ${serif} text-[1.125rem] leading-[1.5] text-ink-soft`}>
        {house
          ? "Cancelling removes it from the Jewellery appointments calendar, frees the time and emails the client to tell them."
          : "Would you like to cancel this jewellery appointment? We’ll email you to confirm."}
      </p>
      {house && (
        <div className="mt-6">
          <label htmlFor={`${uid}-note`} className="block font-[560]">
            A note for the client <span className="font-normal text-ink-soft">(optional, included in the email)</span>
          </label>
          <textarea
            id={`${uid}-note`}
            rows={4}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-2 w-full border border-stone-deep bg-paper px-4 py-3 text-[1rem] text-ink focus:border-navy"
          />
        </div>
      )}
      {problem && (
        <p role="alert" className="mt-5 text-error">
          {problem}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className={`mt-8 inline-flex min-h-14 w-full items-center justify-center bg-navy-deep px-10 ${serif} text-[1.1875rem] text-ivory transition-colors hover:bg-navy-soft disabled:opacity-60 sm:w-auto`}
      >
        {sending ? "Cancelling…" : house ? "Cancel and tell the client" : "Cancel this appointment"}
      </button>
      {!house && (
        <p className={`mt-5 ${serif} text-[1.0625rem] text-ink-soft`}>
          Want a different time instead? Cancel this one, then{" "}
          <Link href={rebook} className="text-navy underline decoration-gold underline-offset-4">
            choose a new time
          </Link>
          .
        </p>
      )}
    </form>
  );
}
