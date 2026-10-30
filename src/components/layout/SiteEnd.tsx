import { RichText } from "@/components/ui/RichText";
import { mailingList } from "@/content";
import { mailingListReady } from "@/lib/mailing-list";
import { MailingListPanel } from "./MailingListPanel";
import { SiteFooter } from "./SiteFooter";

/** Everything below the page content, plus the mailing-list panel. */
export function SiteEnd() {
  const ready = mailingListReady();
  // On the live site the panel only appears once Mailchimp is connected; on your computer it shows as a preview.
  const preview = !ready && process.env.NODE_ENV === "development";
  const m = mailingList;
  return (
    <>
      <SiteFooter />
      {m.show !== false && (ready || preview) && (
        <MailingListPanel
          preview={preview}
          content={{
            title: m.title,
            text: m.text,
            buttonLabel: m.buttonLabel,
            successText: m.successText,
            delaySeconds: m.delaySeconds ?? 20,
          }}
          consent={m.consent ? <RichText text={m.consent} linkClassName="underline underline-offset-2 hover:text-navy" /> : null}
        />
      )}
    </>
  );
}
