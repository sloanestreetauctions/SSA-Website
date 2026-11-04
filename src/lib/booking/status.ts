import "server-only";

/**
 * Whether Stephen's jewellery appointment booking is switched on. It stays off
 * (no menu item, no "Book an appointment" buttons, the page itself returns
 * "not found") until the setting JEWELLERY_BOOKING=on is added on the host,
 * once Google Calendar has been connected. Read on the server only.
 */
export function jewelleryBookingLive() {
  return process.env.JEWELLERY_BOOKING === "on";
}

export const JEWELLERY_APPOINTMENTS_PATH = "/jewellery/appointments";
