import { settings } from "@/content";
import { mailingListReady, subscribe } from "@/lib/mailing-list";

/** Receives a sign-up from the mailing-list panel. */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, message: "We couldn’t read that. Please try again." }, { status: 400 });
  }

  // Spam trap: a hidden field people never see. Bots fill it in.
  if (String(form.get("website") ?? "").trim() !== "") return Response.json({ ok: true });

  const email = String(form.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return Response.json({ ok: false, message: "Please enter a valid email address, like name@example.com." }, { status: 422 });
  }

  if (!mailingListReady()) {
    return Response.json(
      { ok: false, message: "Sign-ups aren’t switched on yet (Mailchimp isn’t connected). Nothing was sent." },
      { status: 503 },
    );
  }

  try {
    await subscribe(email);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Mailing-list sign-up failed:", error);
    return Response.json(
      { ok: false, message: `Sorry, we couldn’t sign you up just now. Please try again later, or email ${settings.generalEmail}.` },
      { status: 502 },
    );
  }
}
