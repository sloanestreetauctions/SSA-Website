import { toSignIn } from "@/lib/easy-live-redirect";

/** /login on the previous website → Easy Live sign-in / create account. */
export function GET() {
  return toSignIn();
}
