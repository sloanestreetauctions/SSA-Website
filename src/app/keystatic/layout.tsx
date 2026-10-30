import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { editorAvailable } from "@/lib/editor/availability";
import KeystaticApp from "./keystatic";

export const metadata: Metadata = { title: "Edit the website", robots: { index: false, follow: false } };

/** The editing screen at /keystatic. See README, "Editing the website". */
export default function KeystaticLayout() {
  if (!editorAvailable) notFound();
  return <KeystaticApp />;
}
