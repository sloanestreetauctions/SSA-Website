"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";

/**
 * JEWELLERY APPOINTMENT BOOKING — the calendar, times and form on
 * /jewellery/appointments. Free times come live from the server (which reads
 * Google Calendar); everything is checked again on the server when booking.
 *
 *  1. Choose a day: a month calendar where only days with free times can be chosen.
 *  2. Choose a time: the free times that day.
 *  3. Your details: name, email, telephone, optional notes, privacy tick.
 *  4. Confirmation, with the date and place.
 */

type Day = { date: string; times: { start: string; time: string }[] };
type Wording = {
  calendarTitle: string;
  timesTitle: string;
  formTitle: string;
  detailsLabel: string;
  buttonLabel: string;
  confirmationTitle: string;
};
type Result = { when: string; location: string; reference: string; emailed: boolean };

const TZ = "Europe/London";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const at = (date: string) => new Date(`${date}T12:00:00Z`);
/** Dates the British way, without the comma some browsers add after the weekday: "Wednesday 11 November". */
const fmt = (date: string, options: Intl.DateTimeFormatOptions) => {
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...o }).format(at(date));
  if (!options.weekday) return f(options);
  const { weekday, ...rest } = options;
  return Object.keys(rest).length ? `${f({ weekday })} ${f(rest)}` : f({ weekday });
};
/** "10:05" → "10:05am" */
const twelveHour = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}${h < 12 ? "am" : "pm"}`;
};
const monthOf = (date: string) => date.slice(0, 7);
const shiftMonth = (month: string, by: number) => {
  const d = new Date(`${month}-01T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + by);
  return d.toISOString().slice(0, 7);
};

const inputClass = (error?: string) =>
  `min-h-12 w-full appearance-none border bg-paper px-4 text-[1rem] text-ink focus:border-navy ${error ? "border-error" : "border-stone-deep"}`;
const serif = "font-serif [font-variation-settings:'opsz'_18]";

export function AppointmentBooking({
  wording,
  consent,
  confirmation,
  noDates,
  fallback,
}: {
  wording: Wording;
  /** The privacy tick-box wording, with its link (from the editor). */
  consent: ReactNode;
  /** Text shown once booked (from the editor). */
  confirmation: ReactNode;
  /** Shown when nothing is free. */
  noDates: ReactNode;
  /** "Please call us on …", for when times can't be loaded or booked. */
  fallback: ReactNode;
}) {
  const uid = useId();
  const [days, setDays] = useState<Day[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [month, setMonth] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [values, setValues] = useState({ name: "", email: "", phone: "", details: "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [announce, setAnnounce] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const openedAt = useRef(0);
  const formRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const timesRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (keep?: string) => {
    try {
      const res = await fetch("/api/appointments/slots", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const body = (await res.json()) as { days: Day[] };
      setDays(body.days);
      setLoadFailed(false);
      setMonth((m) => m || (body.days[0] ? monthOf(body.days[0].date) : ""));
      // After a clash, keep the chosen day if it still has times.
      if (keep && !body.days.some((d) => d.date === keep)) setDate("");
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    openedAt.current = performance.now();
    // Loading the free times when the page opens; the result arrives later.
    void load(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [load]);

  const byDate = useMemo(() => new Map((days ?? []).map((d) => [d.date, d])), [days]);
  const firstMonth = days?.[0] ? monthOf(days[0].date) : month;
  const lastMonth = days?.length ? monthOf(days[days.length - 1].date) : month;
  const chosenDay = date ? byDate.get(date) : undefined;
  const chosenTime = chosenDay?.times.find((t) => t.start === start);

  /** The month's grid: blank cells before the 1st so weeks start on Monday. */
  const cells = useMemo(() => {
    if (!month) return [];
    const first = at(`${month}-01`);
    const lead = (first.getUTCDay() + 6) % 7;
    const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    return [...Array<null>(lead).fill(null), ...Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)];
  }, [month]);

  const chooseDate = (d: string) => {
    setDate(d);
    setStart("");
    const n = byDate.get(d)?.times.length ?? 0;
    setAnnounce(`${fmt(d, { weekday: "long", day: "numeric", month: "long" })}: ${n} ${n === 1 ? "time" : "times"} available.`);
    requestAnimationFrame(() => timesRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  const chooseTime = (s: string, label: string) => {
    setStart(s);
    setMessage("");
    setAnnounce(`${label} chosen. Now fill in your details below.`);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  const set = (key: keyof typeof values, value: string | boolean) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  /** How long the form took to fill in (bots are instant), from the moment the page opened to pressing the button. */
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!start || submitting) return;
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, start, website: form.get("website") ?? "", elapsed: e.timeStamp - openedAt.current }),
      });
      const body = (await res.json()) as Partial<Result> & { ok: boolean; errors?: Record<string, string>; message?: string; taken?: boolean };
      if (body.ok) {
        setResult({ when: body.when ?? "", location: body.location ?? "", reference: body.reference ?? "", emailed: body.emailed !== false });
        requestAnimationFrame(() => resultRef.current?.focus());
        return;
      }
      if (body.errors) {
        setErrors(body.errors);
        setMessage("Please check the details marked below.");
      } else if (body.taken) {
        setMessage(body.message ?? "");
        setStart("");
        await load(date);
        requestAnimationFrame(() => timesRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
      } else {
        setMessage(body.message ?? "Sorry, something went wrong. Please try again.");
      }
    } catch {
      setMessage("We couldn’t reach the booking system. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------------------------------------ confirmation */
  if (result) {
    return (
      <div ref={resultRef} tabIndex={-1} className="border-t-2 border-navy bg-paper px-6 py-10 focus:outline-none md:px-12 md:py-14">
        <p className="type-label text-gold-ink">Reference {result.reference}</p>
        <h2 className="mt-4 font-serif text-[2.25rem] leading-tight font-[380] text-navy [font-variation-settings:'opsz'_60] md:text-[2.75rem]">
          {wording.confirmationTitle}
        </h2>
        <p className={`mt-6 ${serif} text-[1.375rem] leading-snug text-ink`}>{result.when}</p>
        {result.location && (
          <address className={`mt-3 not-italic ${serif} text-[1.1875rem] leading-snug text-ink-soft`}>
            {result.location.split("\n").map((line, i) => (
              <span key={`${line}-${i}`} className="block">
                {line}
              </span>
            ))}
          </address>
        )}
        <div className={`mt-6 max-w-[38rem] ${serif} text-[1.1875rem] leading-[1.5] text-ink-soft`}>{confirmation}</div>
        {!result.emailed && (
          <p className="mt-6 max-w-[38rem] border-l-2 border-gold pl-4 text-ink">
            Your appointment is booked, but we couldn’t send the confirmation email. Please make a note of the date and time; {fallback}
          </p>
        )}
      </div>
    );
  }

  /* --------------------------------------------------------- loading, errors */
  if (loadFailed) {
    return (
      <div role="alert" className={`border border-line bg-paper px-6 py-10 ${serif} text-[1.25rem] text-ink md:px-10`}>
        Sorry, we can’t show the appointment calendar just now. To book, {fallback}
      </div>
    );
  }
  if (!days) {
    return (
      <div aria-busy="true" className={`border border-line bg-paper px-6 py-16 text-center ${serif} text-[1.1875rem] text-ink-soft`}>
        Finding free appointments…
      </div>
    );
  }
  if (days.length === 0) {
    return <div className={`border border-line bg-paper px-6 py-10 ${serif} text-[1.25rem] text-ink md:px-10`}>{noDates}</div>;
  }

  /* ------------------------------------------------------------ the booking */
  return (
    <div className="border border-line bg-paper">
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>

      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* 1. Choose a day */}
        <section aria-labelledby={`${uid}-cal`} className="border-b border-line px-5 py-8 sm:px-8 lg:border-r lg:border-b-0 lg:px-10 lg:py-10">
          <h2 id={`${uid}-cal`} className="type-label text-ink-soft">
            <span className="text-gold-ink">1</span>&nbsp;&nbsp;{wording.calendarTitle || "Choose a day"}
          </h2>
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, -1))}
              disabled={month <= firstMonth}
              aria-label="Previous month"
              className="inline-flex size-11 items-center justify-center border border-line text-ink hover:border-navy disabled:opacity-30"
            >
              <Chevron direction="left" />
            </button>
            <p aria-live="polite" className={`${serif} text-[1.5rem] [font-variation-settings:'opsz'_36]`}>
              {fmt(`${month}-01`, { month: "long", year: "numeric" })}
            </p>
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, 1))}
              disabled={month >= lastMonth}
              aria-label="Next month"
              className="inline-flex size-11 items-center justify-center border border-line text-ink hover:border-navy disabled:opacity-30"
            >
              <Chevron direction="right" />
            </button>
          </div>

          <table className="mt-5 w-full table-fixed border-collapse text-center">
            <caption className="sr-only">
              {fmt(`${month}-01`, { month: "long", year: "numeric" })}. Days with free appointments can be chosen.
            </caption>
            <thead>
              <tr>
                {WEEKDAYS.map((d, i) => (
                  <th key={d} scope="col" className="pb-3 font-sans text-[0.75rem] font-[600] tracking-[0.12em] text-ink-soft uppercase">
                    <abbr title={WEEKDAYS_FULL[i]} className="no-underline">
                      {d}
                    </abbr>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(cells.length / 7) }, (_, w) => (
                <tr key={w}>
                  {cells.slice(w * 7, w * 7 + 7).map((d, i) => {
                    if (!d) return <td key={`blank-${i}`} />;
                    const free = byDate.get(d);
                    const chosen = d === date;
                    const day = Number(d.slice(8));
                    return (
                      <td key={d} className="p-0.5 sm:p-1">
                        {free ? (
                          <button
                            type="button"
                            onClick={() => chooseDate(d)}
                            aria-pressed={chosen}
                            aria-label={`${fmt(d, { weekday: "long", day: "numeric", month: "long" })}, ${free.times.length} ${free.times.length === 1 ? "time" : "times"} available`}
                            className={`mx-auto flex aspect-square w-full max-w-14 items-center justify-center ${serif} text-[1.1875rem] transition-colors ${
                              chosen ? "bg-navy-deep text-ivory" : "border border-gold text-navy hover:bg-navy-deep hover:text-ivory"
                            }`}
                          >
                            {day}
                          </button>
                        ) : (
                          <span className={`mx-auto flex aspect-square w-full max-w-14 items-center justify-center ${serif} text-[1.0625rem] text-[#75727a]`}>
                            {day}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 2. Choose a time */}
        <div ref={timesRef} className="scroll-mt-6 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <fieldset>
            <legend className="type-label text-ink-soft">
              <span className="text-gold-ink">2</span>&nbsp;&nbsp;{wording.timesTitle || "Choose a time"}
            </legend>
            {chosenDay ? (
              <>
                <p className={`mt-6 ${serif} text-[1.375rem] [font-variation-settings:'opsz'_36]`}>
                  {fmt(chosenDay.date, { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <p className="type-small mt-1 text-ink-soft">UK time</p>
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
                  {chosenDay.times.map((t) => (
                    <label key={t.start} className="cursor-pointer">
                      <input
                        type="radio"
                        name={`${uid}-time`}
                        value={t.start}
                        checked={start === t.start}
                        onChange={() => chooseTime(t.start, twelveHour(t.time))}
                        className="peer sr-only"
                      />
                      <span
                        className={`flex min-h-12 items-center justify-center border ${serif} text-[1.125rem] tabular-nums transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy ${
                          start === t.start ? "border-navy-deep bg-navy-deep text-ivory" : "border-line text-ink hover:border-navy"
                        }`}
                      >
                        {twelveHour(t.time)}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <p className={`mt-6 ${serif} text-[1.1875rem] text-ink-soft`}>Choose a day in the calendar to see the free times.</p>
            )}
          </fieldset>
        </div>
      </div>

      {/* 3. Your details */}
      <div ref={formRef} className="scroll-mt-6 border-t border-line px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <h2 className="type-label text-ink-soft">
          <span className="text-gold-ink">3</span>&nbsp;&nbsp;{wording.formTitle || "Your details"}
        </h2>
        {chosenTime && chosenDay ? (
          <form onSubmit={submit} noValidate className="mt-6 grid max-w-[44rem] gap-7">
            <p className={`${serif} text-[1.25rem] text-ink`}>
              {fmt(chosenDay.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} at {twelveHour(chosenTime.time)}
            </p>
            <Field id={`${uid}-name`} label="Full name" error={errors.name}>
              <input id={`${uid}-name`} autoComplete="name" value={values.name} onChange={(e) => set("name", e.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${uid}-name-error` : undefined} className={inputClass(errors.name)} />
            </Field>
            <div className="grid gap-7 sm:grid-cols-2">
              <Field id={`${uid}-email`} label="Email address" error={errors.email}>
                <input id={`${uid}-email`} type="email" autoComplete="email" spellCheck={false} value={values.email} onChange={(e) => set("email", e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${uid}-email-error` : undefined} className={inputClass(errors.email)} />
              </Field>
              <Field id={`${uid}-phone`} label="Telephone" error={errors.phone}>
                <input id={`${uid}-phone`} type="tel" autoComplete="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? `${uid}-phone-error` : undefined} className={inputClass(errors.phone)} />
              </Field>
            </div>
            <Field id={`${uid}-details`} label={wording.detailsLabel || "About your jewellery (optional)"}>
              <textarea id={`${uid}-details`} rows={4} maxLength={2000} value={values.details} onChange={(e) => set("details", e.target.value)} className={`${inputClass()} py-3`} />
            </Field>
            <div>
              <label htmlFor={`${uid}-consent`} className="flex cursor-pointer items-start gap-4">
                <input id={`${uid}-consent`} type="checkbox" checked={values.consent} onChange={(e) => set("consent", e.target.checked)} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? `${uid}-consent-error` : undefined} className="mt-0.5 size-6 shrink-0 accent-navy" />
                <span>{consent}</span>
              </label>
              {errors.consent && <ErrorText id={`${uid}-consent-error`}>{errors.consent}</ErrorText>}
            </div>

            {/* Spam trap: hidden from people and screen readers */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Leave this empty
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            {message && (
              <p role="alert" className="text-error">
                {message}
              </p>
            )}
            <div>
              <button
                type="submit"
                disabled={submitting}
                className={`group inline-flex min-h-16 w-full items-center justify-center gap-4 bg-navy-deep px-10 ${serif} text-[1.1875rem] text-ivory transition-colors hover:bg-navy-soft disabled:opacity-60 sm:w-auto`}
              >
                {submitting ? "Booking…" : wording.buttonLabel}
              </button>
            </div>
          </form>
        ) : (
          <>
            {message && (
              <p role="alert" className="mt-6 text-error">
                {message}
              </p>
            )}
            <p className={`mt-6 ${serif} text-[1.1875rem] text-ink-soft`}>Choose a day and a time first.</p>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block font-[560]">
        {label}
      </label>
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="type-small mt-1.5 font-[560] text-error">
      <span className="sr-only">Error: </span>
      {children}
    </p>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" width="9" height="14" viewBox="0 0 9 14" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d={direction === "left" ? "M8 1 2 7l6 6" : "M1 1l6 6-6 6"} />
    </svg>
  );
}
