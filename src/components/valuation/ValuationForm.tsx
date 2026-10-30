"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { settings } from "@/content";
import {
  FIELD_ORDER,
  PHOTO_LIMITS,
  VALUATION_CATEGORIES,
  validateFields,
  validatePhotoCount,
  type FieldErrors,
  type ValuationFields,
} from "@/lib/valuation/schema";
import { ChevronIcon, CloseIcon } from "@/components/ui/Icons";

type Photo = { id: string; file: File; url: string };
type Result = { reference: string; delivered: boolean; name: string };

const EMPTY: ValuationFields = {
  category: "",
  description: "",
  dimensions: "",
  history: "",
  name: "",
  email: "",
  phone: "",
  consent: false,
};

const FIELD_LABELS: Record<keyof FieldErrors, string> = {
  category: "Type of item",
  description: "Description",
  dimensions: "Dimensions",
  history: "History",
  photos: "Photographs",
  name: "Name",
  email: "Email",
  phone: "Telephone",
  consent: "Contact permission",
};

/**
 * Shrinks a photo in the browser before upload (phone photos are often
 * 5–10 MB). Also corrects rotation and converts to JPEG.
 */
async function preparePhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, PHOTO_LIMITS.maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob) throw new Error("encode failed");
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

export function ValuationForm({ deliveryReady = false }: { deliveryReady?: boolean }) {
  const [values, setValues] = useState<ValuationFields>(EMPTY);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [processing, setProcessing] = useState(0);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [dragging, setDragging] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uid = useId();
  const id = (field: string) => `${uid}-${field}`;

  // Free preview memory when photos are removed or the form unmounts.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  function set<K extends keyof ValuationFields>(key: K, value: ValuationFields[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    const room = PHOTO_LIMITS.maxCount - photos.length;
    const accepted = incoming.slice(0, Math.max(0, room));
    const notices: string[] = [];
    if (incoming.length > room) notices.push(`Only ${PHOTO_LIMITS.maxCount} photographs can be added; the rest were left out.`);
    setProcessing((n) => n + accepted.length);
    const prepared: Photo[] = [];
    for (const file of accepted) {
      try {
        const ready = await preparePhoto(file);
        prepared.push({ id: crypto.randomUUID(), file: ready, url: URL.createObjectURL(ready) });
      } catch {
        notices.push(`“${file.name}” couldn’t be read. Please choose a JPEG or PNG photograph.`);
      } finally {
        setProcessing((n) => n - 1);
      }
    }
    setPhotos((current) => [...current, ...prepared]);
    setPhotoNotice(notices.length ? notices.join(" ") : null);
    if (prepared.length) setErrors((e) => ({ ...e, photos: undefined }));
  }

  function removePhoto(photoId: string) {
    setPhotos((current) => {
      const gone = current.find((p) => p.id === photoId);
      if (gone) URL.revokeObjectURL(gone.url);
      return current.filter((p) => p.id !== photoId);
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerMessage(null);
    const found: FieldErrors = validateFields(values);
    const photoError = validatePhotoCount(photos.length);
    if (photoError) found.photos = photoError;
    if (Object.keys(found).length) {
      setErrors(found);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    const body = new FormData(event.currentTarget);
    body.delete("photos");
    photos.forEach((p) => body.append("photos", p.file));
    body.set("consent", values.consent ? "yes" : "");

    setSubmitting(true);
    try {
      const response = await fetch("/api/valuation", { method: "POST", body });
      const data = await response.json();
      if (data.ok) {
        setResult({ reference: data.reference, delivered: data.delivered, name: values.name.split(" ")[0] });
      } else if (data.errors) {
        setErrors(data.errors);
        requestAnimationFrame(() => summaryRef.current?.focus());
      } else {
        setServerMessage(data.message ?? "Something went wrong. Please try again.");
      }
    } catch {
      setServerMessage(`We couldn’t send your request. Please check your connection and try again, or email ${settings.generalEmail}.`);
    } finally {
      setSubmitting(false);
    }
  }

  function startAgain() {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setValues(EMPTY);
    setErrors({});
    setResult(null);
  }

  /* ------------------------------------------------------------ confirmation */
  if (result) {
    return (
      <div ref={resultRef} tabIndex={-1} className="border-t-2 border-navy pt-10 focus:outline-none">
        <p className="type-label text-gold-ink">Reference {result.reference}</p>
        <h2 className="type-headline mt-4 text-navy">Thank you{result.name ? `, ${result.name}` : ""}.</h2>
        {result.delivered ? (
          <p className="type-lede mt-6 max-w-xl text-ink-soft">
            Your valuation request has been sent. A specialist will review your photographs and reply by email. Please quote
            your reference if you contact us about it.
          </p>
        ) : (
          <div className="mt-8 max-w-xl border-l-2 border-gold pl-5">
            <p className="font-[560]">This is a preview: your request has not been sent.</p>
            <p className="mt-2 text-ink-soft">
              Everything was checked successfully, but this copy of the website is not connected to our inbox. To arrange a
              valuation now, email{" "}
              <a href={`mailto:${settings.generalEmail}`} className="text-navy underline decoration-gold underline-offset-4">
                {settings.generalEmail}
              </a>{" "}
              or call {settings.mainPhone}.
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={startAgain}
          className="mt-10 min-h-12 border border-navy px-7 text-[0.9375rem] font-[560] text-navy hover:bg-navy hover:text-ivory"
        >
          Request another valuation
        </button>
      </div>
    );
  }

  /* -------------------------------------------------------------------- form */
  const errorList = FIELD_ORDER.filter((f) => errors[f]);

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby={`${uid}-required-note`}>
      <p id={`${uid}-required-note`} className="type-small text-ink-soft">
        All fields are required unless marked optional.
      </p>

      {errorList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="mt-8 border-2 border-error bg-paper p-6 focus:outline-none">
          <h2 className="font-sans text-[1.0625rem] font-[600]">Please check {errorList.length === 1 ? "one thing" : `${errorList.length} things`}</h2>
          <ul className="mt-3 space-y-1.5">
            {errorList.map((f) => (
              <li key={f}>
                <a href={`#${id(f)}`} className="text-error underline underline-offset-4">
                  {FIELD_LABELS[f]}: {errors[f]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ------------------------------------------------------------- 1 item */}
      <FormStep number={1} title="About your item">
        <Field id={id("category")} label="What kind of item is it?" error={errors.category}>
          <div className="relative">
            <select
              id={id("category")}
              name="category"
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? `${id("category")}-error` : undefined}
              className={inputClass(errors.category)}
            >
              <option value="" disabled>
                Choose one
              </option>
              {VALUATION_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" />
          </div>
        </Field>

        <Field
          id={id("description")}
          label="Describe it"
          hint="What it is, what it’s made of, and any signature, label or maker’s mark."
          error={errors.description}
        >
          <textarea
            id={id("description")}
            name="description"
            rows={5}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={`${id("description")}-hint${errors.description ? ` ${id("description")}-error` : ""}`}
            className={`${inputClass(errors.description)} py-3`}
          />
        </Field>

        <Field id={id("dimensions")} label="Dimensions" optional hint="Height × width × depth, in cm or inches." error={errors.dimensions}>
          <input
            id={id("dimensions")}
            name="dimensions"
            value={values.dimensions}
            onChange={(e) => set("dimensions", e.target.value)}
            aria-describedby={`${id("dimensions")}-hint`}
            className={inputClass(errors.dimensions)}
          />
        </Field>

        <Field
          id={id("history")}
          label="What do you know about its history?"
          optional
          hint="How and when it was acquired, previous owners, receipts or exhibition labels."
          error={errors.history}
        >
          <textarea
            id={id("history")}
            name="history"
            rows={3}
            value={values.history}
            onChange={(e) => set("history", e.target.value)}
            aria-describedby={`${id("history")}-hint`}
            className={`${inputClass(errors.history)} py-3`}
          />
        </Field>
      </FormStep>

      {/* ----------------------------------------------------------- 2 photos */}
      <FormStep number={2} title="Photographs">
        <div>
          <p id={`${id("photos")}-hint`} className="text-ink-soft">
            Add up to {PHOTO_LIMITS.maxCount}. Clear daylight photographs work best: the front, the back, and close-ups of any
            signature, mark or damage.
          </p>
          {errors.photos && <ErrorText id={`${id("photos")}-error`}>{errors.photos}</ErrorText>}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files);
            }}
            className={`mt-5 flex flex-col items-center justify-center gap-4 border border-dashed px-6 py-10 text-center transition-colors ${
              dragging ? "border-navy bg-stone" : errors.photos ? "border-error bg-paper" : "border-ink-soft/50 bg-paper"
            }`}
          >
            <button
              type="button"
              id={id("photos")}
              onClick={() => fileInput.current?.click()}
              disabled={photos.length >= PHOTO_LIMITS.maxCount}
              aria-describedby={`${id("photos")}-hint${errors.photos ? ` ${id("photos")}-error` : ""}`}
              className="min-h-12 bg-navy px-7 text-[0.9375rem] font-[560] text-ivory hover:bg-navy-soft disabled:opacity-50"
            >
              {photos.length ? "Add more photographs" : "Choose photographs"}
            </button>
            <span className="type-small text-ink-soft">or drag them here · JPEG, PNG or WebP</span>
            <input
              ref={fileInput}
              type="file"
              name="photos"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                if (e.target.files?.length) void addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          <p aria-live="polite" className="type-small mt-3 min-h-5 text-ink-soft">
            {processing > 0
              ? `Preparing ${processing} photograph${processing === 1 ? "" : "s"}…`
              : photos.length
                ? `${photos.length} of ${PHOTO_LIMITS.maxCount} photographs added`
                : ""}
          </p>
          {photoNotice && <p className="type-small mt-1 text-error">{photoNotice}</p>}

          {photos.length > 0 && (
            <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {photos.map((p, i) => (
                <li key={p.id} className="group relative aspect-square border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the visitor's own file */}
                  <img src={p.url} alt={`Photograph ${i + 1}`} className="h-full w-full object-contain p-2 mix-blend-multiply" />
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    aria-label={`Remove photograph ${i + 1}`}
                    className="absolute top-1.5 right-1.5 inline-flex size-9 items-center justify-center bg-ivory/90 text-navy hover:bg-ivory"
                  >
                    <CloseIcon size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </FormStep>

      {/* ---------------------------------------------------------- 3 details */}
      <FormStep number={3} title="Your details">
        <Field id={id("name")} label="Full name" error={errors.name}>
          <input
            id={id("name")}
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${id("name")}-error` : undefined}
            className={inputClass(errors.name)}
          />
        </Field>
        <Field id={id("email")} label="Email address" hint="We’ll reply to this address." error={errors.email}>
          <input
            id={id("email")}
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={`${id("email")}-hint${errors.email ? ` ${id("email")}-error` : ""}`}
            className={inputClass(errors.email)}
          />
        </Field>
        <Field id={id("phone")} label="Telephone" optional hint="If you would like us to call you." error={errors.phone}>
          <input
            id={id("phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            aria-describedby={`${id("phone")}-hint`}
            className={inputClass(errors.phone)}
          />
        </Field>

        <div>
          <label htmlFor={id("consent")} className="flex cursor-pointer items-start gap-4">
            <input
              id={id("consent")}
              type="checkbox"
              checked={values.consent}
              onChange={(e) => set("consent", e.target.checked)}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? `${id("consent")}-error` : undefined}
              className="mt-0.5 size-6 shrink-0 accent-navy"
            />
            <span>
              I agree that Sloane Street Auctions may contact me about this valuation request. See our{" "}
              <a href={settings.links.privacy} className="text-navy underline decoration-gold underline-offset-4">
                privacy policy
              </a>
              .
            </span>
          </label>
          {errors.consent && <ErrorText id={`${id("consent")}-error`}>{errors.consent}</ErrorText>}
        </div>

        {/* Spam trap — hidden from people and screen readers */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Leave this empty
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </FormStep>

      <div className="mt-4 border-t border-navy pt-10">
        {!deliveryReady && (
          <p className="type-small mb-6 max-w-xl border-l-2 border-gold pl-4 text-ink-soft">
            <strong className="font-semibold text-ink">Preview:</strong> on this copy of the website, requests are checked but
            not sent anywhere. To arrange a valuation today, email {settings.generalEmail}.
          </p>
        )}
        {serverMessage && (
          <p role="alert" className="mb-6 text-error">
            {serverMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || processing > 0}
          className="min-h-14 w-full bg-navy px-10 text-[1rem] font-[560] text-ivory hover:bg-navy-soft disabled:opacity-60 sm:w-auto"
        >
          {submitting ? "Sending…" : processing > 0 ? "Preparing photographs…" : "Send valuation request"}
        </button>
      </div>
    </form>
  );
}

/* ---------------------------------------------------------------- helpers */

function inputClass(error?: string) {
  return `min-h-12 w-full appearance-none border bg-paper px-4 text-[1rem] text-ink focus:border-navy ${
    error ? "border-error" : "border-stone-deep"
  }`;
}

function FormStep({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="mt-12 grid gap-8 border-t border-line pt-10 md:grid-cols-[11rem_1fr] md:gap-10">
      <legend className="contents">
        <span className="flex items-baseline gap-3 md:block">
          <span className="font-serif text-[2rem] leading-none text-gold-ink [font-variation-settings:'opsz'_60]">{number}</span>
          <span className="type-subtitle md:mt-3 md:block">{title}</span>
        </span>
      </legend>
      <div className="space-y-8">{children}</div>
    </fieldset>
  );
}

function Field({
  id,
  label,
  hint,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-[560]">
        {label} {optional && <span className="font-normal text-ink-soft">(optional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="type-small mt-1 text-ink-soft">
          {hint}
        </p>
      )}
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
