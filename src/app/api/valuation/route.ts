import { settings } from "@/content";
import { deliverValuationRequest, newReference } from "@/lib/valuation/delivery";
import { PHOTO_LIMITS, validateFields, validatePhotoCount, type FieldErrors, type ValuationFields } from "@/lib/valuation/schema";

/**
 * Receives a valuation request from the form at /valuation.
 * Everything is checked again here — the browser's checks are a convenience,
 * this is the real gatekeeper.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, message: "We couldn’t read your request. Please try again." }, { status: 400 });
  }

  // Spam trap: a hidden field people never see. Bots fill it in.
  if (String(form.get("website") ?? "").trim() !== "") {
    return Response.json({ ok: true, reference: newReference(), delivered: false });
  }

  const text = (key: string) => String(form.get(key) ?? "").trim();
  const fields: ValuationFields = {
    category: text("category"),
    description: text("description"),
    dimensions: text("dimensions"),
    history: text("history"),
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    consent: form.get("consent") === "yes",
  };

  const errors: FieldErrors = validateFields(fields);
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const countError = validatePhotoCount(files.length);
  if (countError) errors.photos = countError;
  else if (files.some((f) => !(PHOTO_LIMITS.acceptedTypes as readonly string[]).includes(f.type))) {
    errors.photos = "Photographs must be JPEG, PNG or WebP images";
  } else if (files.some((f) => f.size > PHOTO_LIMITS.maxBytes)) {
    errors.photos = "One of the photographs is too large. Please choose a smaller image";
  }

  if (Object.keys(errors).length > 0) {
    return Response.json({ ok: false, errors }, { status: 422 });
  }

  const reference = newReference();
  const photos = await Promise.all(files.map(async (f) => ({ name: f.name, type: f.type, bytes: await f.arrayBuffer() })));
  try {
    const result = await deliverValuationRequest({ fields, photos, reference });
    return Response.json({ ok: true, reference, delivered: result.delivered });
  } catch (error) {
    // Never pretend it worked: the visitor is asked to email instead.
    console.error(`Valuation request ${reference} could not be delivered:`, error);
    return Response.json(
      { ok: false, message: `Sorry, we couldn’t send your request just now. Please email ${settings.generalEmail} or call ${settings.mainPhone}.` },
      { status: 502 },
    );
  }
}
