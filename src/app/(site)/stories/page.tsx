import { notFound } from "next/navigation";
import { isPageOn } from "@/content";
import type { Metadata } from "next";
import { HoldingPage } from "@/components/layout/HoldingPage";
import { storiesPage as c } from "@/content";

export const metadata: Metadata = { title: c.seo.title, description: c.seo.description };

export default function StoriesPage() {
  if (!isPageOn("/stories")) notFound();
  return (
    <HoldingPage
      eyebrow={c.eyebrow}
      title={c.title}
      lede={c.text}
    />
  );
}
