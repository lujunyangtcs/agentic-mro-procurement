/**
 * One client use case, run agent by agent from its I/O. The stepper is the
 * manifest's agent chain; the panel is the selected agent's output, envelope
 * and any human tasks its lane created. Nothing advances past a HiTL lane
 * until the named persona decides.
 */

import * as React from "react";
import { ArrowLeft, RotateCcw, UserRound } from "lucide-react";
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

export function StoryWorkspace({ storyId, step: openStep }: { storyId: StoryId; step?: number }) {
  const { go } = useApp();
  const { c, lang } = useStoryCopy();
  const run = storyRunById[storyId];
  const { state, running, paused, stepDone, pendingTasks, decide, handOff, select, restart, humanDecisions, status } = useStoryRun(run);

  /* Deep links from the workbenches open a step that has already run. */
  React.useEffect(() => {
    if (openStep !== undefined && openStep <= state.reached) select(openStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openStep]);

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
  const progress = run.steps.length ? doneCount / run.steps.length : 0;

  return (
    <div className="min-h-screen bg-surface-fog">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-divider bg-white px-5 py-3">
        <button
          type="button"
          onClick={() => go({ kind: "agent", id: "intake" })}
          className="ui-pill group jlr-cta inline-flex shrink-0 items-center gap-2 whitespace-nowrap border border-ink/25 bg-white px-3.5 py-2 text-[12px] text-ink"
        >
          <ArrowLeft size={15} aria-hidden className="transition-transform duration-150 ease-out group-hover:-translate-x-1" />
          {c.back}
        </button>
        <div className="min-w-0 flex-1 border-l border-divider pl-4">
          <p className="jlr-eyebrow truncate text-[11px] text-steel">
            {run.story.ucLabel} · {run.story.caseId}
          </p>
          <p className="truncate text-[15px] leading-[21px] text-ink">{run.story.title[lang]}</p>
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
          className="ui-pill group grid h-9 w-9 shrink-0 place-items-center border border-ink/25 bg-white text-ink"
        >
          <RotateCcw size={15} aria-hidden className="transition-transform duration-300 ease-out group-hover:-rotate-[120deg]" />
        </button>
        <LanguageSwitch />
      </header>

      <StoryHero
        storyId={storyId}
        eyebrow={`${run.story.ucLabel} · ${run.story.caseId}`}
        title={run.story.title[lang]}
        useCase={run.manifest.use_case.replace(/^UC\d+\s–\s/, "")}
        progress={progress}
        progressLabel={c.ofAgents(doneCount, run.steps.length)}
      />

      <div className="flex flex-col gap-4 px-5 pb-12 pt-5">
        <SectionHead title={c.agentRun} aside={c.ofAgents(doneCount, run.steps.length)} />
        <AgentStepper run={run} state={state} stepDone={stepDone} pending={(i) => pendingTasks(i).length} onSelect={select} />

        <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-3">
            {state.finished && <OutcomeCard run={run} endedBy={state.endedBy} humanDecisions={humanDecisions} />}
            <AgentRunPanel
              key={state.selected}
              uc={run.story.uc}
              paused={paused}
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
            <section className="jlr-fade-up border border-divider bg-white p-5" style={{ animationDelay: "120ms" }}>
              <SectionHead title={c.theRequest} />
              <div className="mt-4">
                <RequestSummary request={run.request} compact />
              </div>
            </section>
            <section className="jlr-fade-up flex flex-col gap-3 border border-divider bg-white p-5" style={{ animationDelay: "220ms" }}>
              <SectionHead title={c.humanTouchpoints} />
              <ul className="flex flex-col gap-2">
                {run.manifest.human_touchpoints.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-[13px] leading-[19px] text-ink text-pretty">
                    <UserRound size={14} aria-hidden className="mt-[3px] shrink-0 text-steel" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-divider pt-3 text-[12px] leading-[17px] text-mute">
                <span className="jlr-eyebrow mb-1 block text-[10.5px] text-steel">{c.flowPath}</span>
                {run.manifest.flow_path}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Block header in the jlr.com idiom: tracked capitals over a short ink rule. */
function SectionHead({ title, aside }: { title: string; aside?: string }) {
  return (
    <div className="flex items-end gap-3">
      <div className="flex flex-col gap-2">
        <h2 className="jlr-title text-[13px] leading-[18px] text-ink">{title}</h2>
        <span aria-hidden className="jlr-rule block h-px w-8 bg-ink" />
      </div>
      {aside && <span className="pb-0.5 text-[12.5px] text-mute">{aside}</span>}
    </div>
  );
}

/**
 * The story's photograph with a frosted panel over it — the jlr.com strategy
 * card. The rule along the panel's foot fills as agents complete.
 */
function StoryHero({
  storyId,
  eyebrow,
  title,
  useCase,
  progress,
  progressLabel,
}: {
  storyId: StoryId;
  eyebrow: string;
  title: string;
  useCase: string;
  progress: number;
  progressLabel: string;
}) {
  return (
    <section aria-label={title} className="relative mx-5 mt-4 h-[248px] overflow-hidden bg-accent-navy">
      <img
        key={storyId}
        src={`/jlr/story-${storyId.toLowerCase()}.png`}
        alt=""
        className="jlr-settle absolute inset-0 h-full w-full object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgb(12_18_28/0.35)_0%,transparent_60%)]" />
      <div className="relative flex h-full items-end p-5">
        <div className="jlr-glass jlr-fade-up flex w-full max-w-[560px] flex-col px-7 pb-5 pt-6" style={{ animationDelay: "150ms" }}>
          <p className="jlr-eyebrow text-[11px] text-mute">
            <span className="jlr-line">
              <span style={{ animationDelay: "260ms" }}>{eyebrow}</span>
            </span>
          </p>
          <h1 className="jlr-title mt-3 text-balance text-[22px] leading-[30px] text-ink">
            <span className="jlr-line">
              <span style={{ animationDelay: "360ms" }}>{title}</span>
            </span>
          </h1>
          <p className="jlr-fade-up mt-2 line-clamp-2 text-pretty text-[14px] font-light leading-[21px] text-ink" style={{ animationDelay: "480ms" }}>
            {useCase}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div
              className="relative h-[2px] flex-1 bg-ink/15"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              aria-label={progressLabel}
            >
              <span
                className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="jlr-eyebrow shrink-0 text-[10.5px] text-mute tabular-nums">{progressLabel}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
