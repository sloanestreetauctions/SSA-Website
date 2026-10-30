"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { contactPage, settings, telHref } from "@/content";
import { Arrow } from "@/components/ui/Button";

type Route = {
  id: string;
  label: string;
  description: string;
  /** Either an on-site page or a pre-addressed email. Never a form that pretends to send. */
  action: { kind: "page"; href: string; label: string } | { kind: "email"; to: string; subject: string; body?: string; label: string };
};

const e = contactPage.enquiries;
const tel = telHref(settings.mainPhone);

function routesFor(lot: string | null, sale: string | null): Route[] {
  const lotRef = [lot && `Lot ${lot}`, sale].filter(Boolean).join(", ");
  const email = (o: { buttonLabel: string; subject: string }, to = settings.generalEmail) =>
    ({ kind: "email", to, subject: o.subject, label: o.buttonLabel }) as const;
  return [
    {
      id: "valuation",
      label: e.valuation.label,
      description: e.valuation.description,
      action: { kind: "page", href: "/valuation", label: e.valuation.buttonLabel },
    },
    { id: "buying", label: e.buying.label, description: e.buying.description, action: email(e.buying) },
    {
      id: "condition-report",
      label: e.conditionReport.label,
      description: lotRef ? e.conditionReport.descriptionWithLot.replace(/\{lot\}/g, lotRef) : e.conditionReport.description,
      action: {
        ...email(e.conditionReport),
        subject: `${e.conditionReport.subject}${lotRef ? `: ${lotRef}` : ""}`,
        body: `Please send me a condition report for ${lotRef || "the following lot:"}\n\nName:\nTelephone:\n`,
      },
    },
    { id: "accounts", label: e.accounts.label, description: e.accounts.description, action: email(e.accounts, settings.accountsEmail) },
    { id: "general", label: e.general.label, description: e.general.description, action: email(e.general) },
  ];
}

function mailto(a: Extract<Route["action"], { kind: "email" }>) {
  const params = new URLSearchParams({ subject: a.subject, ...(a.body ? { body: a.body } : {}) });
  return `mailto:${a.to}?${params.toString().replace(/\+/g, "%20")}`;
}

/**
 * "What is your enquiry about?" — one choice reveals the right way to reach us.
 * It routes to the valuation form or a pre-addressed email; it does not
 * collect or submit anything itself.
 */
export function EnquiryChooser() {
  const params = useSearchParams();
  const routes = routesFor(params.get("lot"), params.get("sale"));
  const initial = params.get("enquiry") === "condition-report" ? "condition-report" : "valuation";
  const [selected, setSelected] = useState(initial);
  const name = useId();
  const chosen = routes.find((r) => r.id === selected) ?? routes[0];

  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-14">
      <fieldset>
        <legend className="type-subtitle">{e.question}</legend>
        <div className="mt-5 border-b border-line">
          {routes.map((r) => (
            <label
              key={r.id}
              className={`flex min-h-14 cursor-pointer items-center gap-4 border-t border-line px-1 transition-colors ${
                selected === r.id ? "text-navy" : "text-ink-soft hover:text-ink"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={r.id}
                checked={selected === r.id}
                onChange={() => setSelected(r.id)}
                className="size-5 shrink-0 accent-navy"
              />
              <span className={`text-[1.0625rem] ${selected === r.id ? "font-[560]" : ""}`}>{r.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div aria-live="polite" className="self-start border-t-2 border-navy bg-paper p-8 md:mt-12">
        <p className="type-label text-gold-ink">{chosen.label}</p>
        <p className="mt-3 text-[1.0625rem]">{chosen.description}</p>
        {chosen.action.kind === "page" ? (
          <Link
            href={chosen.action.href}
            className="group mt-8 inline-flex min-h-12 items-center gap-3 bg-navy px-7 text-[0.9375rem] font-[560] text-ivory hover:bg-navy-soft"
          >
            {chosen.action.label} <Arrow />
          </Link>
        ) : (
          <>
            <a
              href={mailto(chosen.action)}
              className="group mt-8 inline-flex min-h-12 items-center gap-3 bg-navy px-7 text-[0.9375rem] font-[560] text-ivory hover:bg-navy-soft"
            >
              {chosen.action.label} <Arrow />
            </a>
            <p className="type-small mt-4 text-ink-soft">
              Opens your email app, addressed to {chosen.action.to}. Prefer to talk? Call{" "}
              <a href={tel} className="text-navy underline decoration-gold underline-offset-4">
                {settings.mainPhone}
              </a>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
