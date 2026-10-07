import { Check, UserRound, Lock, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import type { StoryRun } from "@/mro/data/stories/runModel";
import type { RunState } from "@/mro/components/story/useStoryRun";
import { useStoryCopy } from "@/mro/components/story/copy";

type StepStatus = "done" | "running" | "waiting" | "locked" | "ready";

/** The rule along each card's head: what the step is doing, at a glance. */
const barTone: Record<StepStatus, string> = {
  done: "bg-ink",
  ready: "bg-ink",
  waiting: "bg-mark-amber",
  running: "bg-steel",
  locked: "bg-divider",
};

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
    <ol className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-3" data-equal-row>
      {run.steps.map((s, i) => {
        const st = statusOf(i);
        const selected = state.selected === i;
        const personas = s.tasks.map((t) => t.persona);
        return (
          <li key={s.run.agent + i} className="aap-fade-up h-full" style={{ animationDelay: `${i * 80}ms` }}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              disabled={st === "locked"}
              aria-current={selected ? "step" : undefined}
              className={cn(
                "group relative flex h-full w-full flex-col gap-3 border bg-white px-4 pb-4 pt-5 text-left transition-colors duration-150 ease-out disabled:cursor-not-allowed",
                selected ? "border-ink" : "border-divider hover:border-ink/40",
                st === "running" && "aap-scan",
                st === "locked" && "bg-white/60",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-0 top-0 h-[3px] origin-left transition-transform duration-300 ease-out",
                  barTone[st],
                  selected || st === "waiting" || st === "running" ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                )}
              />

              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "text-[30px] font-extralight leading-none tabular-nums tracking-[-0.02em]",
                    st === "locked" ? "text-mute/50" : "text-ink",
                  )}
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center border",
                    st === "done" || st === "ready"
                      ? "border-ink bg-ink text-ink-inverse"
                      : st === "waiting"
                        ? "border-mark-amber bg-surface-amber text-mark-amber"
                        : st === "running"
                          ? "border-steel text-steel"
                          : "border-divider text-mute",
                  )}
                  aria-hidden
                >
                  {st === "done" || st === "ready" ? (
                    <Check size={14} />
                  ) : st === "waiting" ? (
                    <UserRound size={14} className="ai-pulse" />
                  ) : st === "running" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Lock size={12} />
                  )}
                </span>
              </div>

              <span className="min-w-0">
                <span className={cn("block truncate text-[14px] leading-[20px]", st === "locked" ? "text-mute" : "text-ink")}>
                  {s.run.agent}
                </span>
                <span className="mt-0.5 block truncate text-[12px] leading-[16px] text-mute">{s.run.flowStep}</span>
              </span>

              <span className="mt-auto flex items-center gap-2 border-t border-divider pt-3">
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                  {st === "locked" && i > state.reached ? (
                    <span className="aap-eyebrow text-[10.5px] text-mute">{c.locked}</span>
                  ) : personas.length > 0 ? (
                    personas.map((p) => (
                      <span
                        key={p}
                        className="max-w-full truncate bg-surface-amber px-2 py-0.5 text-[11.5px] text-mark-amber"
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="bg-sand px-2 py-0.5 text-[11.5px] text-ink">{s.run.lane?.lane ?? "—"}</span>
                  )}
                </span>
                {st !== "locked" && (
                  <ChevronRight
                    size={16}
                    aria-hidden
                    className="shrink-0 text-steel transition-transform duration-150 ease-out group-hover:translate-x-1"
                  />
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
