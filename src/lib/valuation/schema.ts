/**
 * VALUATION REQUEST — the fields, limits and validation rules.
 * Used by both the form (instant feedback) and the server (the real check),
 * so the two can never disagree.
 */

export const VALUATION_CATEGORIES = [
  { value: "paintings", label: "Painting" },
  { value: "works-on-paper", label: "Drawing, watercolour or print" },
  { value: "sculpture", label: "Sculpture" },
  { value: "furniture", label: "Furniture or mirror" },
  { value: "decorative-arts", label: "Ceramics, glass, silver or objects" },
  { value: "jewellery", label: "Jewellery or watches" },
  { value: "collections", label: "A collection or house contents" },
  { value: "unsure", label: "Not sure" },
] as const;

export const PHOTO_LIMITS = {
  maxCount: 8,
  /** Photos are resized in the browser to fit within this many pixels on the longest side. */
  maxDimension: 2400,
  /** Per-photo limit on the server, after resizing. */
  maxBytes: 3 * 1024 * 1024,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;

export type ValuationFields = {
  category: string;
  description: string;
  dimensions: string;
  history: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
};

export type FieldErrors = Partial<Record<keyof ValuationFields | "photos", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns an error message per field, written to tell people how to fix it. */
export function validateFields(v: ValuationFields): FieldErrors {
  const e: FieldErrors = {};
  if (!VALUATION_CATEGORIES.some((c) => c.value === v.category)) e.category = "Choose what kind of item it is, or “Not sure”";
  if (v.description.trim().length < 10) e.description = "Tell us a little about the item — at least a sentence";
  else if (v.description.length > 3000) e.description = "Please keep the description under 3,000 characters";
  if (v.dimensions.length > 200) e.dimensions = "Please keep this under 200 characters";
  if (v.history.length > 2000) e.history = "Please keep this under 2,000 characters";
  if (!v.name.trim()) e.name = "Enter your name";
  else if (v.name.length > 120) e.name = "Please keep your name under 120 characters";
  if (!v.email.trim()) e.email = "Enter your email address so we can reply";
  else if (!EMAIL.test(v.email.trim())) e.email = "Enter an email address in the format name@example.com";
  if (v.phone.length > 40) e.phone = "Please check your telephone number";
  if (!v.consent) e.consent = "Please confirm we may contact you about this request";
  return e;
}

export function validatePhotoCount(count: number): string | undefined {
  if (count === 0) return "Add at least one photograph";
  if (count > PHOTO_LIMITS.maxCount) return `You can add up to ${PHOTO_LIMITS.maxCount} photographs`;
  return undefined;
}

/** The order fields appear in, for the error summary at the top of the form. */
export const FIELD_ORDER: (keyof FieldErrors)[] = [
  "category",
  "description",
  "dimensions",
  "history",
  "photos",
  "name",
  "email",
  "phone",
  "consent",
];
