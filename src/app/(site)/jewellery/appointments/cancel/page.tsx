import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CancelAppointment } from "@/components/booking/CancelAppointment";
import { Breadcrumbs } from "@/components/ui/Editorial";
import { pageTitle } from "@/components/ui/type";
import { jewelleryPage, settings } from "@/content";
import { JEWELLERY_APPOINTMENTS_PATH, jewelleryBookingLive } from "@/lib/booking/status";

export const metadata: Metadata = { title: "Cancel an appointment", robots: { index: false, follow: false } };

/**
 * CANCEL A JEWELLERY APPOINTMENT — reached only from the links in the booking
 * emails (the client's "Cancel this appointment", and the house's "Cancel and
 * tell the client"). The page reads the link in the browser and asks the server
 * to check it, so it is never built ahead or listed anywhere.
 */
export default function CancelAppointmentPage() {
  if (!jewelleryBookingLive()) notFound();
  return (
    <div className="shell pt-8 pb-20 md:pb-24">
      <Breadcrumbs
        items={[
          { label: jewelleryPage.hero.title || "Jewellery", href: "/jewellery" },
          { label: "Appointments", href: JEWELLERY_APPOINTMENTS_PATH },
          { label: "Cancel" },
        ]}
      />
      <h1 className={`mt-10 ${pageTitle}`}>Cancel an appointment</h1>
      <div className="mt-10 max-w-[44rem]">
        <CancelAppointment phone={settings.mainPhone} rebook={JEWELLERY_APPOINTMENTS_PATH} />
      </div>
    </div>
  );
}
