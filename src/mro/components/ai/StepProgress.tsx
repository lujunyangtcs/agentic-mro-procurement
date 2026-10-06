import * as React from "react";
import { Check } from "lucide-react";
import { Spinner } from "@/mro/components/ai/Spinner";
import { AIDot } from "@/mro/components/ai/AIDot";
import { cn } from "@/mro/lib/utils";

/**
 * The "agent is working" loader shown before a step's wizard or reveal. The bar
 * fills 0 → 100% over `durationMs`, the four phase chips light up in sequence,
 * and once it reaches 100% it holds briefly on a "done" state and then calls
 * `onDone`. The caller advances on `onDone` (not a competing timer) so the bar
 * always finishes before it hands off — it never gets cut mid-animation.
 */

const PHASES = ["Read", "Reason", "Draft", "Verify"];
const HOLD_MS = 320; // show the completed 100% state briefly before handing off
const TICK_MS = 50;

export function StepProgress({
  agentName,
  docLabel,
  durationMs = 2600,
  onDone,
}: {
  agentName: string;
  docLabel: string;
  /** How long the bar takes to fill to 100%. */
  durationMs?: number;
  /** Fired once, after the bar reaches 100% and a short hold. */
  onDone?: () => void;
}) {
  const [pct, setPct] = React.useState(0);
  const onDoneRef = React.useRef(onDone);
  onDoneRef.current = onDone;

  React.useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setPct(100);
      window.setTimeout(() => onDoneRef.current?.(), HOLD_MS);
    };
    // Hidden tabs freeze RAF/intervals — skip straight to the completed state so
    // the sequence never stalls on a frozen spinner.
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      finish();
      return;
    }
    setPct(0);
    const start = Date.now();
    const iv = window.setInterval(() => {
      const elapsed = Date.now() - start; // real elapsed, robust to throttling
      const p = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setPct(p);
      if (p >= 100) {
        window.clearInterval(iv);
        finish();
      }
    }, TICK_MS);
    // Fallback if the interval is throttled (e.g. briefly backgrounded mid-run).
    const fallback = window.setTimeout(finish, durationMs + 500);
    return () => {
      window.clearInterval(iv);
      window.clearTimeout(fallback);
    };
  }, [durationMs]);

  const complete = pct >= 100;
  const activePhase = complete
    ? PHASES.length
    : Math.min(PHASES.length - 1, Math.floor((pct / 100) * PHASES.length));
  const docName = docLabel.split(" · ")[0];
  const titles = [
    "Reading the sources",
    "Reasoning over the evidence",
    `Drafting ${docName}`,
    "Verifying the controls",
  ];

  return (
    <div className="rounded-md border border-divider bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        {complete ? (
          <Check size={14} className="text-surface-deep shrink-0" strokeWidth={3} />
        ) : (
          <Spinner size={14} className="shrink-0" />
        )}
        <span className="text-[13px] font-bold text-ink leading-tight truncate">
          {complete ? "Done" : `${titles[activePhase]}…`}
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-mute shrink-0">
          <AIDot size={6} tone="deep" pulse /> {agentName}
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-2.5">
        <div className="flex-1 h-1.5 rounded-full bg-surface-fog overflow-hidden">
          <div
            className="h-full rounded-full bg-surface-deep"
            style={{ width: `${pct}%`, transition: "width 140ms linear" }}
          />
        </div>
        <span className="text-[11px] tabular-nums text-mute w-8 text-right">{pct}%</span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {PHASES.map((p, i) => (
          <span
            key={p}
            className={cn(
              "inline-flex items-center gap-1 text-[10.5px] tracking-[0.02em] rounded-full px-2 py-0.5 border whitespace-nowrap",
              i < activePhase
                ? "border-surface-mint bg-surface-mint/50 text-surface-deep"
                : i === activePhase
                  ? "border-surface-deep bg-surface-deep text-ink-inverse"
                  : "border-divider bg-white text-mute",
            )}
          >
            {i < activePhase && <Check size={10} strokeWidth={3} />}
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
