import Link from "next/link";
import { isPageOn } from "@/content";
import { Arrow } from "@/components/ui/Button";

const serif = "font-serif [font-variation-settings:'opsz'_18]";

/**
 * "Still have questions?" with a button to the FAQs, centred at the end of a
 * page. Shown only while the FAQs page is switched on and has questions.
 */
export function FaqPrompt() {
  if (!isPageOn("/faqs")) return null;
  return (
    <div className="shell flex flex-col items-center py-16 text-center md:py-20">
      <p className={`${serif} text-[1.625rem] leading-snug text-ink md:text-[1.875rem]`}>Still have questions?</p>
      <Link
        href="/faqs"
        className={`group mt-5 inline-flex min-h-14 items-center gap-3 border border-ink/30 px-8 ${serif} text-[1.1875rem] transition-colors hover:border-navy hover:bg-navy hover:text-ivory`}
      >
        Read our FAQs <Arrow />
      </Link>
    </div>
  );
}
