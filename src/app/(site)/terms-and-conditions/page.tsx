import type { Metadata } from "next";
import { pageMetadata } from "@/lib/page-metadata";
import { PolicyPage } from "@/components/policy/PolicyPage";
import { policyPages } from "@/content";

const c = policyPages.terms;

export const metadata: Metadata = pageMetadata("/terms-and-conditions", c.seo);

/** Same address as on the previous website, so existing links keep working. Edited under Policies. */
export default function Page() {
  return <PolicyPage page={c} />;
}
