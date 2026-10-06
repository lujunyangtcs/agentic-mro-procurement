import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIDot } from "@/components/ai/AIDot";
import type { AgentOutputStatus } from "@/state";
import { agentsById } from "@/data/agents";
import type { RunStep } from "@/data/runSteps";

/** Short chip wording for a finished step's output status. */
const statusChip: Partial<Record<AgentOutputStatus, { label: string; cls: string }>> = {
  approved: { label: "Approved", cls: "bg-surface-mint text-surface-deep" },
  pending: { label: "On hold", cls: "bg-surface-fog text-mute" },
  escalated: { label: "Escalated", cls: "bg-surface-rose text-mark-red" },
  rejected: { label: "Rejected", cls: "bg-surface-rose text-mark-red" },
};

type Phase = "done" | "active" | "locked";

function phaseFor(i: number, activeStep: number): Phase {
  if (i < activeStep) return "done";
  if (i === activeStep) return "active";
  return "locked";
}

function DotBadge({ phase }: { phase: Phase }) {
  if (phase === "done")
    return (
      <span className="w-6 h-6 rounded-full bg-surface-deep text-ink-inverse flex items-center justify-center shrink-0">
        <Check size={13} strokeWidth={3} />
      </span>
    );
  if (phase === "active")
    return (
      <span className="w-6 h-6 rounded-full bg-white border-2 border-surface-deep flex items-center justify-center shrink-0">
        <AIDot size={8} tone="deep" pulse />
      </span>
    );
  return (
    <span className="w-6 h-6 rounded-full bg-surface-fog border border-divider text-mute flex items-center justify-center shrink-0">
      <Lock size={11} />
    </span>
  );
}

export function RunStepsRail({
  steps,
  activeStep,
  selectedStep,
  decisions,
  onSelect,
}: {
  steps: RunStep[];
  activeStep: number;
  selectedStep: number;
  /** Human decisions on each step, keyed by step index. */
  decisions: Record<number, AgentOutputStatus>;
  onSelect: (i: number) => void;
}) {
  const done = Math.min(activeStep, steps.length);
  const pct = Math.round((done / steps.length) * 100);

  return (
    <aside className="bg-white border border-divider rounded-md overflow-hidden flex flex-col shrink-0">
      <div className="px-4 pt-4 pb-3 border-b border-divider">
        <div className="text-[11px] uppercase tracking-[0.08em] text-mute font-medium">
          Agent run
        </div>
        <div className="text-[15px] font-bold text-ink mt-0.5">
          {done} of {steps.length} handed off
        </div>
        <div className="mt-2 h-1 rounded-full bg-surface-fog overflow-hidden">
          <div
            className="h-full bg-ink rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ol className="p-2">
        {steps.map((s, i) => {
          const phase = phaseFor(i, activeStep);
          const selected = i === selectedStep;
          const clickable = i <= activeStep;
          const chip = statusChip[decisions[i]];
          const agent = agentsById[s.id];
          return (
            <li key={i}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onSelect(i)}
                className={cn(
                  "w-full text-left rounded-md px-2.5 py-2.5 flex items-start gap-2.5 transition-colors",
                  selected ? "bg-surface-mint/50" : "hover:bg-surface-fog",
                  !clickable && "opacity-55 cursor-default hover:bg-transparent",
                )}
              >
                <DotBadge phase={phase} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] tabular-nums text-mute">
                      {String(s.n).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "text-[13px] leading-tight truncate",
                        selected ? "font-bold text-ink" : "font-medium text-ink",
                      )}
                    >
                      {s.agentName ?? agent.menuLabel}
                    </span>
                  </span>
                  <span className="block text-[11px] text-mute leading-snug mt-0.5 truncate">
                    {s.title}
                  </span>
                  {chip && (
                    <span
                      className={cn(
                        "inline-block mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium",
                        chip.cls,
                      )}
                    >
                      {chip.label}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
