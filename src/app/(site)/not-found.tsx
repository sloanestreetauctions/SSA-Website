import type { Metadata } from "next";
import { NotFoundContent } from "@/components/ui/NotFoundContent";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** A page that has been switched off in the editor: just the message (the header and footer are already there). */
export default function SiteNotFound() {
  return <NotFoundContent />;
}
