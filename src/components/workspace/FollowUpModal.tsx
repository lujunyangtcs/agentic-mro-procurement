import * as React from "react";
import { createPortal } from "react-dom";
import { X, CalendarClock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpringIn } from "@/components/ai/SpringIn";

/**
 * After the agent sends a dunning notice, this modal asks whether to schedule a
 * follow-up. "Yes" reveals a month calendar with the agent's suggested date
 * pre-selected (the contractual response window); the buyer can pick another day
 * and Save. Purely presentational — the parent decides what "saved" means.
 *
 * The month is fixed to the demo's collections window (June 2026) so the view is
 * deterministic for screenshots; the suggested day is passed in.
 */

const MONTH_LABEL = "June 2026";
const DOW = ["S", "M", "T", "W", "T", "F", "S"];
// June 2026 starts on a Monday; 30 days.
const WEEKS: (number | null)[][] = [
  [null, 1, 2, 3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12, 13],
  [14, 15, 16, 17, 18, 19, 20],
  [21, 22, 23, 24, 25, 26, 27],
  [28, 29, 30, null, null, null, null],
];

export function FollowUpModal({
  suggestedDay = 16,
  sentDay = 9,
  onSave,
  onClose,
}: {
  /** The agent's recommended follow-up day in June 2026. */
  suggestedDay?: number;
  /** The day the notice was sent — marked for context. */
  sentDay?: number;
  onSave: (label: string) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = React.useState<"ask" | "calendar">("ask");
  const [day, setDay] = React.useState(suggestedDay);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = () => {
    onSave(`Jun ${day}, 2026`);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <SpringIn className="w-full max-w-[430px]">
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <header className="flex items-center gap-2 px-5 py-3 border-b border-divider">
            <span className="w-7 h-7 rounded-md bg-surface-deep text-ink-inverse flex items-center justify-center">
              <CalendarClock size={15} />
            </span>
            <span className="text-[13px] font-bold text-ink">Schedule a follow-up?</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ui-pill ml-auto w-8 h-8 rounded-full text-mute hover:bg-surface-fog flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </header>

          {phase === "ask" ? (
            <div className="px-5 py-5">
              <p className="text-[13px] text-ink leading-relaxed">
                The final notice asks BlueRidge to remit within{" "}
                <span className="font-semibold">5 business days</span>. Set a reminder to check the
                account and re-escalate if the payment hasn't landed.
              </p>
              <div className="flex items-center gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setPhase("calendar")}
                  className="ui-pill flex-1 rounded-full bg-surface-deep px-4 py-2.5 text-[13px] font-bold text-ink-inverse hover:bg-accent-green"
                >
                  Yes, schedule it
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="ui-pill flex-1 rounded-full border border-ink/25 bg-white px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-surface-fog"
                >
                  Not now
                </button>
              </div>
            </div>
          ) : (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold text-ink">{MONTH_LABEL}</span>
                <span className="text-[11px] text-mute">Suggested · Jun {suggestedDay}</span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {DOW.map((d, i) => (
                  <div key={i} className="text-[10px] uppercase tracking-[0.04em] text-mute font-medium py-1">
                    {d}
                  </div>
                ))}
                {WEEKS.flat().map((d, i) => {
                  if (d === null) return <div key={i} />;
                  const selected = d === day;
                  const suggested = d === suggestedDay;
                  const sent = d === sentDay;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDay(d)}
                      className={cn(
                        "ui-pill relative h-9 rounded-md text-[12.5px] tabular-nums flex items-center justify-center transition-colors",
                        selected
                          ? "bg-surface-deep text-ink-inverse font-bold"
                          : "text-ink hover:bg-surface-fog",
                        !selected && suggested && "ring-1 ring-surface-deep/40",
                      )}
                    >
                      {d}
                      {sent && !selected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-mark-red" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 mt-4">
                <span className="text-[11px] text-mute flex-1">
                  {sentDay ? `Notice sent Jun ${sentDay}` : ""}
                </span>
                <button
                  type="button"
                  onClick={save}
                  className="ui-pill inline-flex items-center gap-1.5 rounded-full bg-surface-deep px-5 py-2.5 text-[13px] font-bold text-ink-inverse hover:bg-accent-green"
                >
                  <Check size={15} strokeWidth={3} /> Save follow-up
                </button>
              </div>
            </div>
          )}
        </div>
      </SpringIn>
    </div>,
    document.body,
  );
}
