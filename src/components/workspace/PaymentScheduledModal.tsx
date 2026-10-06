import * as React from "react";
import { Check, X, CalendarClock, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpringIn } from "@/components/ai/SpringIn";

/**
 * The payment-scheduled success card — lands when the Invoice agent's output is
 * approved. A short confetti burst, an animated tick, the amount and vendor, the
 * F110 pay timeline (invoice posted → net due → payment run), and the booking
 * details. This is the happy-path payoff: the cash is scheduled, not just matched.
 */

type Schedule = {
  vendor: string;
  amount: string;
  terms: string;
  method: string;
  reference: string;
  timeline: { label: string; date: string; done: boolean }[];
};

const CONFETTI_COLORS = ["#107e3e", "#0a6ed1", "#354a5f", "#5bc98b", "#e6b800"];

function Confetti() {
  // 28 pieces fanned across the card top — random spread/rotation/delay so each
  // run looks a little different. Pure-CSS fall (hr-confetti keyframe).
  const pieces = React.useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: 6 + Math.random() * 88,
        x: (Math.random() - 0.5) * 240,
        rot: 360 + Math.random() * 540,
        delay: Math.random() * 240,
        dur: 1400 + Math.random() * 900,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-2 h-0 overflow-visible" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="hr-confetti-piece"
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${p.dur}ms`,
              "--hr-confetti-x": `${p.x}px`,
              "--hr-confetti-rot": `${p.rot}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function PaymentScheduledModal({
  schedule,
  onBackToCockpit,
  onClose,
  backLabel = "Back to cockpit",
}: {
  schedule: Schedule;
  onBackToCockpit: () => void;
  onClose: () => void;
  backLabel?: string;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <Confetti />
      <SpringIn className="w-full max-w-[440px]">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-xl px-7 pt-8 pb-6"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ui-pill absolute top-4 right-4 w-8 h-8 rounded-full text-mute hover:bg-surface-fog flex items-center justify-center"
          >
            <X size={18} />
          </button>

          {/* Animated tick */}
          <div className="flex justify-center">
            <span className="ai-pulse w-[64px] h-[64px] rounded-full bg-surface-mint flex items-center justify-center">
              <span className="w-[50px] h-[50px] rounded-full bg-surface-deep text-ink-inverse flex items-center justify-center">
                <Check size={28} strokeWidth={3} />
              </span>
            </span>
          </div>

          <div className="text-center mt-4">
            <div className="text-[11px] uppercase tracking-[0.1em] font-bold text-surface-deep">
              Payment scheduled
            </div>
            <div className="text-[22px] font-bold text-ink tracking-[-0.01em] mt-1 leading-tight tabular-nums">
              {schedule.amount}
            </div>
            <div className="text-[12.5px] text-mute mt-0.5">to {schedule.vendor}</div>
          </div>

          {/* Pay timeline — posted → due → run */}
          <div className="mt-6 flex items-start">
            {schedule.timeline.map((t, i) => (
              <React.Fragment key={t.label}>
                <div className="flex flex-col items-center text-center flex-1 min-w-0">
                  <span
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2",
                      t.done
                        ? "bg-surface-deep border-surface-deep text-ink-inverse"
                        : "bg-white border-surface-deep/40 text-surface-deep",
                    )}
                  >
                    {t.done ? <Check size={14} strokeWidth={3} /> : <CalendarClock size={14} />}
                  </span>
                  <div className="text-[11px] font-semibold text-ink mt-1.5 leading-tight">{t.label}</div>
                  <div className="text-[11px] text-mute tabular-nums leading-tight">{t.date}</div>
                </div>
                {i < schedule.timeline.length - 1 && (
                  <div
                    className={cn(
                      "h-[2px] flex-1 mt-[13px] rounded-full",
                      schedule.timeline[i + 1].done ? "bg-surface-deep" : "bg-divider",
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Booking details */}
          <div className="mt-6 rounded-lg border border-divider divide-y divide-divider">
            {[
              { icon: CalendarClock, label: "Terms", value: schedule.terms },
              { icon: Landmark, label: "Method", value: schedule.method },
              { icon: Check, label: "Reference", value: schedule.reference },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2.5 px-3.5 py-2.5">
                <r.icon size={14} className="text-surface-deep shrink-0" />
                <span className="text-[11px] uppercase tracking-[0.06em] text-mute font-medium w-[74px] shrink-0">
                  {r.label}
                </span>
                <span className="text-[12.5px] text-ink font-medium text-right ml-auto">{r.value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="ui-pill flex-1 rounded-full border border-ink/25 bg-white px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-surface-fog"
            >
              Stay on the run
            </button>
            <button
              type="button"
              onClick={onBackToCockpit}
              className="ui-pill flex-1 rounded-full bg-surface-deep px-4 py-2.5 text-[13px] font-bold text-ink-inverse hover:bg-accent-green whitespace-nowrap"
            >
              {backLabel}
            </button>
          </div>
        </div>
      </SpringIn>
    </div>
  );
}
