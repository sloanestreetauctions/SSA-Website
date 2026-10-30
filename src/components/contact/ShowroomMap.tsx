"use client";

import { Fragment, useState } from "react";
import { contactPage, mapsDirections as DIRECTIONS, mapsEmbed as EMBED, settings } from "@/content";

const t = contactPage.map;

/**
 * The navy map band from the approved mockup. The decorative street pattern is
 * clearly a backdrop (no false streets are labelled); the genuine Google map
 * loads only when the visitor asks, so nothing is sent to Google before then.
 */
export function ShowroomMap() {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <div className="relative h-[26rem] bg-navy-deep md:h-[30rem]">
        <iframe
          title={`Map showing ${settings.addressLines.join(", ")}`}
          src={EMBED}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <div className="theme-dark relative isolate flex min-h-[15rem] items-center justify-center overflow-hidden bg-navy-deep px-5 py-12 text-ivory">
      {/* Decorative street lines, purely a backdrop */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full opacity-25"
        preserveAspectRatio="none"
        viewBox="0 0 1440 240"
      >
        <g fill="none" stroke="#6f86a8" strokeWidth="1">
          <path d="M-20 200L420 20M180 260L560 -10M600 250L760 -20M820 260L1120 -20M1040 250L1460 60M-20 90L560 140L1460 120M0 170L700 210L1460 190M300 -10L340 260M980 -10L940 260M1240 -10L1180 260" />
          <path d="M60 60L260 120M460 40L620 110M1080 40L1300 110M1200 200L1400 150" strokeWidth="0.6" />
        </g>
      </svg>
      {t.areaLabel && (
      <p className="absolute bottom-6 left-[12%] font-serif text-[1.75rem] tracking-[0.18em] text-ivory/70 uppercase [font-variation-settings:'opsz'_36] max-md:hidden">
        {t.areaLabel}
      </p>
      )}

      <div className="flex flex-col items-center gap-5 md:flex-row md:gap-8">
        {t.placeName && (
        <div className="flex items-center gap-4 border border-ivory/15 bg-navy-deep/90 px-6 py-4">
          <svg aria-hidden="true" width="34" height="44" viewBox="0 0 34 44">
            <path d="M17 1C8.2 1 1 8 1 16.8 1 28 17 43 17 43s16-15 16-26.2C33 8 25.8 1 17 1z" fill="#c9b393" />
            <circle cx="17" cy="16.5" r="6" fill="none" stroke="#051327" strokeWidth="1.6" />
          </svg>
          <p className="font-serif text-[1.25rem] leading-tight tracking-[0.14em] uppercase [font-variation-settings:'opsz'_24]">
            {t.placeName.split("\n").map((l, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {l}
              </Fragment>
            ))}
          </p>
        </div>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setLoaded(true)}
            className="min-h-12 bg-ivory px-6 font-serif text-[1.0625rem] text-navy hover:bg-stone"
          >
            {t.buttonLabel}
          </button>
          {t.directionsLabel && (
          <a
            href={DIRECTIONS}
            target="_blank"
            rel="noopener"
            className="min-h-12 content-center border border-ivory/50 px-6 font-serif text-[1.0625rem] hover:border-ivory"
          >
            {t.directionsLabel} <span className="sr-only">(opens Google Maps in a new tab)</span>
          </a>
          )}
        </div>
      </div>
      {t.note && <p className="absolute right-5 bottom-3 text-[0.75rem] text-ivory/60">{t.note}</p>}
    </div>
  );
}
