/**
 * The close card — lands once when a case closes, sums up what the run did
 * from its own records (touchpoints, money, cycle, documents) and offers the
 * way back to the dashboard. Same card for catalogue cases and all five
 * stories; the builders in completion.ts decide what goes in it.
 */

import * as React from "react";
import { Check, CircleCheck, FileText, ArrowRight, Flag, X } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { useDashCopy } from "@/mro/components/dashboard/copy";

export type CompletionDoc = { key: string; label: string; meta?: string; settled: boolean };

export type CompletionSummary = {
  tone: "complete" | "ended";
  eyebrow: string;
  title: string;
  metrics: { value: string; label: string }[];
  caption: string;
  docs: CompletionDoc[];
};

export function CaseCompleteModal({ summary, onStay, onBack }: { summary: CompletionSummary; onStay: () => void; onBack: () => void }) {
  const k = useDashCopy();
  const backRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    backRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onStay();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStay]);

  const ended = summary.tone === "ended";

  return (
    <div className="fixed inset-0 z-50 flex overflow-y-auto bg-ink/45 px-4 py-6" onClick={onStay}>
      {/* m-auto, not items-center: a card taller than the screen scrolls instead of losing its top. */}
      <SpringIn className="m-auto w-full max-w-[600px]">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(e) => e.stopPropagation()}
          className="relative flex flex-col items-center rounded-2xl border border-divider bg-white px-8 pb-7 pt-9 text-center shadow-xl"
        >
          <button
            type="button"
            onClick={onStay}
            aria-label={k.stay}
            className="ui-pill absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-mute hover:bg-surface-fog"
          >
            <X size={17} aria-hidden />
          </button>

          <span className={cn("grid h-[68px] w-[68px] place-items-center rounded-full", ended ? "bg-surface-amber" : "bg-surface-mint")}>
            <span
              className={cn(
                "grid h-[42px] w-[42px] place-items-center rounded-full border-[3px] case-complete-pop",
                ended ? "border-mark-amber text-mark-amber" : "border-surface-deep text-surface-deep",
              )}
            >
              {ended ? <Flag size={20} strokeWidth={2.5} aria-hidden /> : <Check size={22} strokeWidth={3} aria-hidden />}
            </span>
          </span>

          <p className={cn("mt-4 whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.14em]", ended ? "text-mark-amber" : "text-surface-deep")}>{summary.eyebrow}</p>
          <h2 id={titleId} className="mt-1.5 text-balance text-[22px] font-bold leading-[28px] tracking-[-0.01em] text-ink">
            {summary.title}
          </h2>

          <ul className="mt-5 grid w-full grid-cols-2 gap-2.5">
            {summary.metrics.map((x, i) => (
              <li
                key={x.label}
                className="case-complete-tile flex flex-col items-center justify-center gap-1 rounded-xl bg-surface-fog px-3 py-3.5"
                style={{ animationDelay: `${120 + i * 70}ms` }}
              >
                <span className="whitespace-nowrap text-[20px] font-bold leading-none text-ink tabular-nums">{x.value}</span>
                <span className="whitespace-nowrap text-[12.5px] text-mute">{x.label}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-pretty text-[14px] leading-[21px] text-mute">{summary.caption}</p>

          <div className="mt-5 flex w-full flex-col gap-2 text-left">
            <p className="text-[12.5px] font-medium text-mute">{k.produced}</p>
            <ul className="flex flex-col gap-2">
              {summary.docs.map((d, i) => (
                <li
                  key={d.key}
                  className="case-complete-tile flex min-w-0 items-center gap-3 rounded-lg border border-divider bg-white px-3.5 py-2.5"
                  style={{ animationDelay: `${300 + i * 60}ms` }}
                >
                  {d.settled ? (
                    <CircleCheck size={17} className="shrink-0 text-surface-deep" aria-hidden />
                  ) : (
                    <FileText size={17} className="shrink-0 text-ink" aria-hidden />
                  )}
                  <span className="shrink-0 whitespace-nowrap text-[14px] font-bold text-ink">{d.label}</span>
                  {d.meta && (
                    <span className="ml-auto min-w-0 truncate text-right text-[12.5px] text-mute" title={d.meta}>
                      {d.meta}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStay}
              className="ui-pill whitespace-nowrap rounded-md px-4 py-2.5 text-[14px] font-medium text-ink hover:bg-surface-fog"
            >
              {k.stay}
            </button>
            <button
              ref={backRef}
              type="button"
              onClick={onBack}
              className="ui-pill group inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-surface-deep px-5 py-2.5 text-[14px] font-bold text-ink-inverse transition hover:bg-accent-green focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface-deep active:translate-y-px"
            >
              {k.back}
              <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </SpringIn>
    </div>
  );
}

/**
 * Opens the card once when `closed` turns true while the page is mounted —
 * opening an already-closed case does not replay it; `show()` reopens it.
 */
export function useCloseCeremony(closed: boolean) {
  const [open, setOpen] = React.useState(false);
  const was = React.useRef(closed);
  React.useEffect(() => {
    if (closed && !was.current) setOpen(true);
    was.current = closed;
  }, [closed]);
  return { open, show: () => setOpen(true), hide: () => setOpen(false) };
}
