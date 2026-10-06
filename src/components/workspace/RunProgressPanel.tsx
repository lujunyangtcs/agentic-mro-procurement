import * as React from "react";
import { cn } from "@/lib/utils";
import { AIDot } from "@/components/ai/AIDot";
import { Spinner } from "@/components/ai/Spinner";

type StepState = "done" | "running" | "awaiting" | "pending";

export type RunStep = {
  /** Short title shown on the row. */
  title: string;
  /** Single-line description shown next to the title. */
  sub: string;
  /** Optional source tag (e.g. "EU regulatory feed", "HR record"). */
  source?: string;
  /** Optional timestamp shown on the right. */
  time?: string;
  /** Body shown when this step is the expanded row. */
  expanded?: React.ReactNode;
};

/**
 * Run-progress panel — one panel that lays out every step in the agent run
 * as a row, with the active step expanded inline (matching the
 * Predictive-Risk-Agent's "Step N · ...· Show more" pattern).
 *
 * Replaces the previous mix of floating StepIntroOverlay + AnalyzingBanner
 * + per-step cards that produced overlap and uneven heights.
 */
export function RunProgressPanel({
  steps,
  activeStep,
  pauseAt,
  awaitingApproval,
  finished,
}: {
  steps: RunStep[];
  activeStep: number;
  pauseAt: number;
  awaitingApproval: boolean;
  finished: boolean;
}) {
  return (
    <section className="bg-white border border-divider rounded-md overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-divider">
        <div className="flex items-center gap-2">
          <AIDot size={6} tone="deep" pulse={!finished} />
          <span className="text-[12px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Agent run · {finished ? `${steps.length} of ${steps.length} done` : `${Math.min(activeStep + 1, steps.length)} of ${steps.length}`}
          </span>
        </div>
        <span className="text-[11px] text-mute">
          {awaitingApproval ? "Awaiting your decision" : finished ? "Complete" : "Running"}
        </span>
      </header>

      <ol>
        {steps.map((s, i) => {
          const state: StepState =
            i < activeStep
              ? "done"
              : i === activeStep
                ? i === pauseAt && awaitingApproval
                  ? "awaiting"
                  : "running"
                : "pending";
          const isExpanded = i === activeStep && !!s.expanded;
          return (
            <li
              key={s.title}
              className={cn(
                "border-t border-divider first:border-t-0 transition-colors",
                state === "running" && "bg-surface-mint/30",
                state === "awaiting" && "bg-surface-mint/40",
              )}
            >
              <div className="grid grid-cols-[36px_1fr_auto] items-center gap-3 px-4 py-2.5">
                <StateIcon state={state} index={i} />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] tracking-[0.08em] uppercase font-bold text-mute shrink-0">
                    Step {i + 1}
                  </span>
                  <span
                    className={cn(
                      "text-[14px] font-medium truncate",
                      state === "pending" ? "text-mute" : "text-ink",
                    )}
                  >
                    {s.title}
                  </span>
                  <span
                    className={cn(
                      "text-[12px] truncate",
                      state === "pending" ? "text-mute/70" : "text-mute",
                    )}
                  >
                    · {s.sub}
                  </span>
                  {s.source && (
                    <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] tracking-[0.06em] uppercase font-medium bg-surface-fog text-surface-deep">
                      {s.source}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-mute shrink-0">{s.time ?? ""}</span>
              </div>

              {isExpanded && s.expanded && (
                <div className="px-4 pb-4 pt-1 border-t border-surface-deep/10">
                  {s.expanded}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StateIcon({ state, index }: { state: StepState; index: number }) {
  if (state === "done")
    return (
      <div className="w-7 h-7 rounded-full bg-surface-deep text-ink-inverse flex items-center justify-center text-[13px] font-bold">
        ✓
      </div>
    );
  if (state === "running")
    return (
      <div className="w-7 h-7 rounded-full bg-surface-mint border border-surface-deep flex items-center justify-center text-surface-deep">
        <Spinner size={14} />
      </div>
    );
  if (state === "awaiting")
    return (
      <div className="w-7 h-7 rounded-full bg-white border-2 border-surface-deep flex items-center justify-center text-[13px] font-bold text-surface-deep">
        !
      </div>
    );
  return (
    <div className="w-7 h-7 rounded-full bg-white border border-divider text-mute flex items-center justify-center text-[12px] font-bold">
      {index + 1}
    </div>
  );
}
