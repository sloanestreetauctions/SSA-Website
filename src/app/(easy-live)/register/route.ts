import { toSignIn } from "@/lib/easy-live-redirect";

/** /register on the previous website → Easy Live sign-in / create account. */
export function GET() {
  return toSignIn();
}
