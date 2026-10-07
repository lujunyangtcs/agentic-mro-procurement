import { Check, UserRound, Lock, Loader2 } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import type { StoryRun } from "@/mro/data/stories/runModel";
import type { RunState } from "@/mro/components/story/useStoryRun";
import { useStoryCopy } from "@/mro/components/story/copy";

type StepStatus = "done" | "running" | "waiting" | "locked" | "ready";

/** The agent chain as equal-height cards, in manifest order. */
export function AgentStepper({
  run,
  state,
  stepDone,
  pending,
  onSelect,
}: {
  run: StoryRun;
  state: RunState;
  stepDone: (i: number) => boolean;
  pending: (i: number) => number;
  onSelect: (i: number) => void;
}) {
  const { c } = useStoryCopy();

  const statusOf = (i: number): StepStatus => {
    if (i > state.reached) return "locked";
    if (!state.revealed.includes(i)) return state.finished ? "locked" : "running";
    if (pending(i) > 0) return state.finished ? "locked" : "waiting";
    if (stepDone(i) && (i < state.reached || state.finished)) return "done";
    return "ready";
  };

  return (
    <ol className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-3" data-equal-row>
      {run.steps.map((s, i) => {
        const st = statusOf(i);
        const selected = state.selected === i;
        const personas = s.tasks.map((t) => t.persona);
        return (
          <li key={s.run.agent + i} className="h-full">
            <button
              type="button"
              onClick={() => onSelect(i)}
              disabled={st === "locked"}
              aria-current={selected ? "step" : undefined}
              className={cn(
                "flex h-full w-full flex-col gap-2 rounded-md border bg-white p-3 text-left transition-colors disabled:cursor-not-allowed",
                selected ? "border-surface-deep shadow-[0_0_0_1px_var(--accent-green-deep)]" : "border-divider hover:border-surface-sage",
                st === "locked" && "opacity-55",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold",
                    st === "done" || st === "ready"
                      ? "bg-surface-deep text-ink-inverse"
                      : st === "waiting"
                        ? "bg-surface-amber text-mark-amber"
                        : st === "running"
                          ? "bg-surface-mint text-surface-deep"
                          : "bg-surface-fog text-mute",
                  )}
                  aria-hidden
                >
                  {st === "done" || st === "ready" ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : st === "waiting" ? (
                    <UserRound size={14} />
                  ) : st === "running" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : st === "locked" && i > state.reached ? (
                    <Lock size={12} />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold leading-[19px] text-ink">{s.run.agent}</span>
                  <span className="block truncate text-[12px] leading-[16px] text-mute">{s.run.flowStep}</span>
                </span>
              </div>
              <span className="mt-auto flex flex-wrap items-center gap-1.5">
                {st === "locked" && i > state.reached ? (
                  <span className="text-[12px] text-mute">{c.locked}</span>
                ) : personas.length > 0 ? (
                  personas.map((p) => (
                    <span key={p} className="max-w-full truncate rounded-full bg-surface-amber px-2 py-0.5 text-[11.5px] font-medium text-mark-amber">
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-surface-mint px-2 py-0.5 text-[11.5px] font-medium text-surface-deep">
                    {s.run.lane?.lane ?? "—"}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
