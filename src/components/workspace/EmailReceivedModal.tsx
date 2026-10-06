import * as React from "react";
import { createPortal } from "react-dom";
import { MailCheck } from "lucide-react";
import { SpringIn } from "@/components/ai/SpringIn";

/**
 * A centered, animated notification that a customer reply has landed — shown the
 * moment the agent's dunning notice is sent. It announces "Email received"
 * before the reply itself is revealed in the run, so the round-trip reads as a
 * real inbound event rather than the answer just appearing. Dismiss reveals the
 * reply. Purely presentational.
 */
export function EmailReceivedModal({
  from = "BlueRidge Foods · AP",
  subject = "RE: FINAL NOTICE — INV-90357 · payment today",
  onView,
}: {
  from?: string;
  subject?: string;
  onView: () => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onView();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onView]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onView}
    >
      <SpringIn className="w-full max-w-[400px]">
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl px-7 pt-7 pb-6 text-center"
        >
          <div className="flex justify-center">
            <span className="relative w-[60px] h-[60px] rounded-full bg-surface-mint flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-surface-deep/20 animate-ping" />
              <span className="relative w-[46px] h-[46px] rounded-full bg-surface-deep text-ink-inverse flex items-center justify-center">
                <MailCheck size={24} />
              </span>
            </span>
          </div>

          <div className="text-[11px] uppercase tracking-[0.1em] font-bold text-surface-deep mt-4">
            Email received
          </div>
          <div className="text-[17px] font-bold text-ink mt-1 leading-tight">{from} replied</div>
          <p className="text-[12.5px] text-mute leading-snug mt-2">{subject}</p>

          <button
            type="button"
            onClick={onView}
            className="ui-pill w-full mt-5 rounded-full bg-surface-deep px-4 py-2.5 text-[13px] font-bold text-ink-inverse hover:bg-accent-green"
          >
            View reply
          </button>
        </div>
      </SpringIn>
    </div>,
    document.body,
  );
}
