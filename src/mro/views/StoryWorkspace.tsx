/**
 * One client use case, run agent by agent from its I/O. The stepper is the
 * manifest's agent chain; the panel is the selected agent's output, envelope
 * and any human tasks its lane created. Nothing advances past a HiTL lane
 * until the named persona decides.
 */

import { ArrowLeft, RotateCcw } from "lucide-react";
import { useApp } from "@/mro/state";
import type { StoryId } from "@/mro/domain/types";
import { storyRunById } from "@/mro/data/stories/runModel";
import { StatusPill } from "@/mro/components/blocks/StatusPill";
import { LanguageSwitch } from "@/mro/lib/i18n";
import { useStoryCopy } from "@/mro/components/story/copy";
import { useStoryRun } from "@/mro/components/story/useStoryRun";
import { AgentStepper } from "@/mro/components/story/AgentStepper";
import { AgentRunPanel } from "@/mro/components/story/AgentRunPanel";
import { OutcomeCard } from "@/mro/components/story/OutcomeCard";
import { RequestSummary } from "@/mro/components/story/RequestSummary";

export function StoryWorkspace({ storyId }: { storyId: StoryId }) {
  const { go } = useApp();
  const { c, lang } = useStoryCopy();
  const run = storyRunById[storyId];
  const { state, running, stepDone, pendingTasks, decide, handOff, select, restart, humanDecisions, status } = useStoryRun(run);

  const step = run.steps[state.selected];
  const doneCount = run.steps.filter((_, i) => stepDone(i) && (i < state.reached || state.finished)).length;
  const waitingOn = pendingTasks(state.reached)[0]?.persona;

  const pill =
    status === "done"
      ? { label: c.status.done, kind: "resolved" as const }
      : status === "ended"
        ? { label: c.status.ended, kind: "neutral" as const }
        : status === "waiting"
          ? { label: waitingOn ? c.waitingOn(waitingOn) : c.status.waiting, kind: "progress" as const }
          : status === "ready"
            ? { label: c.status.ready, kind: "ready" as const }
            : { label: c.status.running, kind: "active" as const };

  return (
    <div className="min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-divider bg-white px-5 py-3">
        <button
          type="button"
          onClick={() => go({ kind: "agent", id: "intake" })}
          className="ui-pill inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] font-medium text-ink hover:bg-surface-fog"
        >
          <ArrowLeft size={15} aria-hidden /> {c.back}
        </button>
        <div className="min-w-0 flex-1 border-l border-divider pl-3">
          <h1 className="truncate text-[16px] font-bold leading-[21px] text-ink">
            {run.story.caseId} · {run.story.title[lang]}
          </h1>
          <p className="truncate text-[12px] leading-[16px] text-mute">
            {run.story.ucLabel} · {run.manifest.use_case.replace(/^UC\d+\s–\s/, "")}
          </p>
        </div>
        <StatusPill
          label={pill.label}
          kind={pill.kind}
          pulse={status === "running" || status === "waiting"}
          className={status === "waiting" ? "max-w-[260px] truncate bg-surface-amber text-mark-amber" : "max-w-[260px] truncate"}
        />
        <button
          type="button"
          onClick={restart}
          aria-label="Restart run"
          title="Restart run"
          className="ui-pill grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink hover:bg-surface-fog"
        >
          <RotateCcw size={15} aria-hidden />
        </button>
        <LanguageSwitch />
      </header>

      <div className="flex flex-col gap-3 px-5 pb-10 pt-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink">{c.agentRun}</h2>
          <span className="text-[12.5px] text-mute">{c.ofAgents(doneCount, run.steps.length)}</span>
        </div>
        <AgentStepper run={run} state={state} stepDone={stepDone} pending={(i) => pendingTasks(i).length} onSelect={select} />

        <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-3">
            {state.finished && <OutcomeCard run={run} endedBy={state.endedBy} humanDecisions={humanDecisions} />}
            <AgentRunPanel
              key={state.selected}
              step={step}
              running={running && state.selected === state.reached}
              isFrontier={state.selected === state.reached}
              finished={state.finished}
              decisions={state.decisions}
              pendingCount={pendingTasks(state.selected).length}
              nextAgent={run.steps[state.selected + 1]?.run.agent}
              onDecide={decide}
              onHandOff={handOff}
            />
          </div>

          <aside className="flex flex-col gap-3">
            <section className="rounded-md border border-divider bg-white p-4">
              <h2 className="mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-ink">{c.theRequest}</h2>
              <RequestSummary request={run.request} compact />
            </section>
            <section className="flex flex-col gap-2 rounded-md border border-divider bg-white p-4">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink">{c.humanTouchpoints}</h2>
              <ul className="flex flex-col gap-1.5">
                {run.manifest.human_touchpoints.map((h) => (
                  <li key={h} className="text-[13px] leading-[19px] text-ink text-pretty">
                    {h}
                  </li>
                ))}
              </ul>
              <p className="border-t border-divider pt-2 text-[12px] leading-[17px] text-mute">
                {c.flowPath}: {run.manifest.flow_path}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
