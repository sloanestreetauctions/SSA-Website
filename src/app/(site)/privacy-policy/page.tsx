import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy/PolicyPage";
import { policyPages } from "@/content";

const c = policyPages.privacy;

export const metadata: Metadata = { title: c.seo.title, description: c.seo.description };

/** Same address as on the previous website, so existing links keep working. Edited under Policies. */
export default function Page() {
  return <PolicyPage page={c} />;
}
