import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CancelAppointment } from "@/components/booking/CancelAppointment";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { pageTitle } from "@/components/ui/type";
import { appointmentsPage, isPageOn, jewelleryPage, settings } from "@/content";
import { JEWELLERY_APPOINTMENTS_PATH, jewelleryBookingLive } from "@/lib/booking/status";

export const metadata: Metadata = { title: "Cancel a jewellery valuation", robots: { index: false, follow: false } };

/**
 * CANCEL A JEWELLERY APPOINTMENT — reached only from the links in the booking
 * emails (the client's "Cancel this valuation", and the house's "Cancel and
 * tell the client"). The page reads the link in the browser and asks the server
 * to check it, so it is never built ahead or listed anywhere.
 */
export default function CancelAppointmentPage() {
  if (!jewelleryBookingLive()) notFound();
  return (
    <div className="shell pt-8 pb-20 md:pb-24">
      <Breadcrumbs
        items={[
          ...(isPageOn("/jewellery") ? [{ label: jewelleryPage.hero.title || "Jewellery", href: "/jewellery" }] : []),
          { label: appointmentsPage.page.title || "Book a jewellery valuation", href: JEWELLERY_APPOINTMENTS_PATH },
          { label: "Cancel" },
        ]}
      />
      <h1 className={`mt-10 ${pageTitle}`}>Cancel a jewellery valuation</h1>
      <div className="mt-10 max-w-[44rem]">
        <CancelAppointment phone={settings.mainPhone} rebook={JEWELLERY_APPOINTMENTS_PATH} />
      </div>
    </div>
  );
}
