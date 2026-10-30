import type { ReactNode } from "react";

/**
 * A slim gilt frame with an ivory mount, drawn in CSS: a narrow gold moulding
 * with a light bevel, a bevelled ivory mount, and a fine gold fillet around the
 * picture. Restrained on purpose — a gallery frame, not a carved one.
 * The frame takes the box it is given (className); the picture fills the window.
 */
export function GiltFrame({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`p-[clamp(9px,1.1vw,16px)] bg-[linear-gradient(135deg,#7d5d22_0%,#c9a24d_18%,#f1d98c_32%,#b98f3a_50%,#e6c873_66%,#8a6a2b_84%,#c49b46_100%)] shadow-[inset_0_0_0_1px_rgba(70,45,10,0.7),inset_0_0_0_3px_rgba(255,236,170,0.35),inset_0_0_0_4px_rgba(70,45,10,0.35),0_14px_34px_-10px_rgba(20,15,5,0.45)] ${className}`}
    >
      <div className="h-full bg-[#f4efe3] p-[clamp(14px,2.2vw,36px)] shadow-[inset_1px_1px_0_rgba(70,45,10,0.45),inset_2px_3px_7px_rgba(40,30,10,0.28)]">
        <div className="relative h-full shadow-[0_0_0_1px_#b8913f,0_0_0_3px_#f4efe3,0_0_0_4px_rgba(184,145,63,0.55)]">
          {children}
        </div>
      </div>
    </div>
  );
}
