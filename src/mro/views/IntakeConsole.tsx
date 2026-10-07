/**
 * The front door. Each row is one of the client's five use cases arriving as
 * its I/O records it — a front-door form, a handoff from another flow, or an
 * award confirmation. Opening one shows the request untouched and the agent
 * chain it will run through; running it opens the case workspace.
 */

import * as React from "react";
import { ArrowRight, Bot } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { useApp } from "@/mro/state";
import type { StoryId } from "@/mro/domain/types";
import { ConsolePage } from "@/mro/components/console/kit";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { STORY_RUNS, storyRunById } from "@/mro/data/stories/runModel";
import { useStoryCopy } from "@/mro/components/story/copy";
import { RequestSummary } from "@/mro/components/story/RequestSummary";
import { CHANNEL_ICON, gbpWhole } from "@/mro/components/story/format";
import { ToneChip } from "@/mro/components/story/IoBody";
import { hasProgress } from "@/mro/components/story/useStoryRun";
import { RequestComposer } from "@/mro/components/desk/RequestComposer";

function RequestRow({ id, active, onOpen }: { id: StoryId; active: boolean; onOpen: () => void }) {
  const { c, lang } = useStoryCopy();
  const run = storyRunById[id];
  const Icon = CHANNEL_ICON[run.request.channelKind];
  const who = run.request.requester;
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-pressed={active}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
          active ? "bg-surface-mint/45" : "hover:bg-surface-fog",
        )}
      >
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface-fog text-surface-deep" aria-hidden>
          <Icon size={16} strokeWidth={1.75} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-[14px] font-bold leading-[19px] text-ink">{run.request.headline}</span>
            <span className="shrink-0 text-[13px] font-bold tabular-nums text-ink">{gbpWhole(run.request.startingCostGBP)}</span>
          </span>
          <span className="truncate text-[12.5px] leading-[17px] text-mute">
            {[who?.role, who?.site].filter(Boolean).join(" · ") || run.request.channel}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="rounded bg-surface-fog px-1.5 py-0.5 text-[11.5px] font-bold text-ink">{run.story.ucLabel}</span>
            <span className="truncate text-[12px] text-mute">{run.story.title[lang]}</span>
            <ToneChip
              className="ml-auto"
              value={run.needsHuman ? c.expectHuman : c.expectTouchless}
              tone={run.needsHuman ? "warn" : "ok"}
            />
          </span>
        </span>
      </button>
    </li>
  );
}

export function IntakeConsole() {
  const { go } = useApp();
  const { c, lang } = useStoryCopy();
  const [openId, setOpenId] = React.useState<StoryId>(STORY_RUNS[0].story.id);
  const run = storyRunById[openId];

  return (
    <ConsolePage title={c.newRequestTitle} lead={c.newRequestLead}>
      <SpringIn>
        <RequestComposer />
      </SpringIn>
      <h2 className="pt-2 text-[13px] font-bold uppercase tracking-[0.06em] text-ink">{c.todayArrivals}</h2>
      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <SpringIn>
          <section className="overflow-hidden rounded-md border border-divider bg-white">
            <header className="flex items-center gap-2 px-4 pb-2.5 pt-3.5">
              <h2 className="text-[15px] font-bold leading-tight text-ink">{c.inbox}</h2>
              <span className="ml-auto text-[12px] text-mute">{STORY_RUNS.length}</span>
            </header>
            <ul className="divide-y divide-divider border-t border-divider">
              {STORY_RUNS.map((r) => (
                <RequestRow key={r.story.id} id={r.story.id} active={r.story.id === openId} onOpen={() => setOpenId(r.story.id)} />
              ))}
            </ul>
          </section>
        </SpringIn>

        <SpringIn>
          <section className="flex flex-col rounded-md border border-divider bg-white" aria-live="polite">
            <header className="flex items-center gap-2 px-5 pb-2.5 pt-3.5">
              <h2 className="text-[15px] font-bold leading-tight text-ink">{c.asArrived}</h2>
              <span className="ml-auto text-[12px] font-medium text-mute">
                {run.story.caseId} · {run.story.ucLabel}
              </span>
            </header>
            <div className="border-t border-divider px-5 py-4">
              <RequestSummary request={run.request} />
            </div>

            <div className="flex flex-col gap-2.5 border-t border-divider px-5 py-4">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink">{c.agentChain}</h3>
              <ol className="flex flex-col gap-2">
                {run.steps.map((s, i) => (
                  <li key={s.run.agent + i} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-fog text-[12px] font-bold text-ink" aria-hidden>
                      {i + 1}
                    </span>
                    <Bot size={15} strokeWidth={1.75} className="shrink-0 text-surface-deep" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">{s.run.agent}</span>
                    <span className="shrink-0 text-[12px] text-mute">{s.run.flowStep}</span>
                  </li>
                ))}
              </ol>
              <p className="text-[12.5px] leading-[18px] text-mute text-pretty">
                {c.humanTouchpoints}: {run.manifest.human_touchpoints.join(" · ")}
              </p>
            </div>

            <footer className="flex flex-wrap items-center gap-3 border-t border-divider px-5 py-3.5">
              <p className="min-w-0 flex-1 truncate text-[12.5px] leading-[17px] text-mute">{run.story.title[lang]}</p>
              <button
                type="button"
                onClick={() => go({ kind: "story", storyId: openId })}
                className="ui-pill inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-surface-deep px-4 py-2.5 text-[13px] font-medium text-ink-inverse hover:brightness-110 active:translate-y-px"
              >
                {hasProgress(openId) ? c.resume : c.run}
                <ArrowRight size={15} aria-hidden />
              </button>
            </footer>
          </section>
        </SpringIn>
      </div>
    </ConsolePage>
  );
}
