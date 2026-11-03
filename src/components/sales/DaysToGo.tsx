"use client";

import { useSyncExternalStore } from "react";

/** Today's date in London as YYYY-MM-DD. */
function todayInLondon() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
}

/** Nothing to listen for: the count is worked out once per page view. */
const noChanges = () => () => {};

/**
 * "in 30 days", "tomorrow" or "today", worked out in the visitor's browser so it
 * is always right on the day, however long the page has been cached. Shows
 * nothing until the browser has worked it out, so the page never flickers.
 */
export function DaysToGo({ date }: { date: string }) {
  const words = useSyncExternalStore(
    noChanges,
    () => {
      const days = Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${todayInLondon()}T12:00:00Z`)) / 86_400_000);
      return days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
    },
    () => "",
  );
  if (!words) return null;
  return (
    <>
      <span aria-hidden="true" className="text-gold">
        ·
      </span>
      <span className="text-navy">{words}</span>
    </>
  );
}
