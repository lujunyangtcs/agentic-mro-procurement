import * as React from "react";
import { ChevronDown, ArrowRight, Bot } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import type { RunStep } from "@/mro/data/stories/runModel";
import { IoBody } from "@/mro/components/story/IoBody";
import { ConfidenceCard, GuardrailCard, LaneCard } from "@/mro/components/story/Envelope";
import { HumanTaskCard } from "@/mro/components/story/HumanTaskCard";
import { useStoryCopy } from "@/mro/components/story/copy";
import { StoryEvidence, hasEvidence } from "@/mro/components/story/StoryEvidence";
import type { UseCaseKey } from "@/mro/data/stories/io";

function Working() {
  const { c } = useStoryCopy();
  const lines = [c.reading, c.checking, c.scoring];
  return (
    <div className="jlr-scan flex flex-col gap-4 border border-divider bg-white px-6 py-6" role="status" aria-live="polite">
      {lines.map((l, i) => (
        <div
          key={l}
          className="flex items-center gap-4 opacity-0 [animation:story-line_500ms_cubic-bezier(0.22,1,0.36,1)_forwards]"
          style={{ animationDelay: `${i * 450}ms` }}
        >
          <span className="text-[12px] font-extralight tabular-nums text-steel" aria-hidden>
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="h-px w-6 bg-steel/50" aria-hidden />
          <span className="text-[14px] leading-[20px] text-ink">{l}…</span>
          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-steel ai-pulse" aria-hidden />
        </div>
      ))}
    </div>
  );
}

export function AgentRunPanel({
  uc,
  paused,
  step,
  running,
  isFrontier,
  finished,
  decisions,
  pendingCount,
  nextAgent,
  onDecide,
  onHandOff,
}: {
  uc: UseCaseKey;
  paused?: boolean;
  step: RunStep;
  running: boolean;
  isFrontier: boolean;
  finished: boolean;
  decisions: Record<string, string>;
  pendingCount: number;
  nextAgent?: string;
  onDecide: (taskId: string, optionId: string) => void;
  onHandOff: () => void;
}) {
  const { c } = useStoryCopy();
  const [showInput, setShowInput] = React.useState(false);
  const r = step.run;
  const seconds = Math.max(1, Math.round((Date.parse(r.finishedAt) - Date.parse(r.startedAt)) / 1000));
  const firstOpen = step.tasks.findIndex((t) => !decisions[t.id]);
  const canHandOff = isFrontier && !finished && !running && pendingCount === 0;

  return (
    <article className="flex min-w-0 flex-col gap-3" aria-labelledby={`agent-${step.index}`}>
      <header className="jlr-fade-up relative flex flex-wrap items-center gap-x-4 gap-y-1 bg-accent-navy px-5 py-4 text-ink-inverse">
        <span aria-hidden className="jlr-rule absolute inset-x-0 bottom-0 block h-[2px] bg-sand" />
        <span className="grid h-10 w-10 shrink-0 place-items-center border border-sand/60 text-sand" aria-hidden>
          <Bot size={19} className={running ? "ai-pulse" : undefined} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="jlr-eyebrow truncate text-[10.5px] text-sand">
            {String(step.index + 1).padStart(2, "0")} · {r.flowStep}
          </p>
          <h2 id={`agent-${step.index}`} className="jlr-title mt-1 truncate text-[17px] leading-[22px] text-ink-inverse">
            {r.agent}
          </h2>
        </div>
        {!running && (
          <p className="shrink-0 text-right text-[12px] font-light leading-[17px] text-ink-inverse/75">
            {r.caseId}
            <br />
            {r.model && `${c.model} ${r.model} · `}
            {c.ran(seconds)}
          </p>
        )}
      </header>

      {paused && isFrontier && !finished ? (
        <p role="status" className="border-t-[3px] border-mark-amber bg-surface-amber px-5 py-4 text-[13.5px] leading-[20px] text-ink">
          {c.pausedNotice}
        </p>
      ) : running ? (
        <Working />
      ) : (
        <>
          <section className="jlr-fade-up flex flex-col gap-4 border border-divider bg-white p-5" style={{ animationDelay: "80ms" }}>
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-2">
                <h3 className="jlr-title text-[13px] leading-[18px] text-ink">{c.produced}</h3>
                <span aria-hidden className="jlr-rule block h-px w-8 bg-ink" />
              </div>
              <button
                type="button"
                onClick={() => setShowInput((v) => !v)}
                aria-expanded={showInput}
                className="jlr-link ml-auto inline-flex items-center gap-1 whitespace-nowrap py-1 text-[12.5px] text-surface-deep"
              >
                {showInput ? c.hideInput : c.showInput}
                <ChevronDown size={14} className={cn("transition-transform", showInput && "rotate-180")} aria-hidden />
              </button>
            </div>
            {showInput && (
              <div className="flex flex-col gap-2 rounded-md border border-dashed border-divider bg-surface-fog/50 p-3">
                <h4 className="text-[12px] font-bold uppercase tracking-[0.05em] text-mute">{c.read}</h4>
                <IoBody body={step.input} />
              </div>
            )}
            {hasEvidence(uc, step.index) ? (
              <>
                <StoryEvidence uc={uc} index={step.index} />
                <details className="group rounded-md border border-divider">
                  <summary className="flex cursor-pointer list-none items-center gap-1 px-3 py-2 text-[12.5px] font-medium text-surface-deep">
                    {c.rawOutput}
                    <ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="border-t border-divider p-3">
                    <IoBody body={step.output} />
                  </div>
                </details>
              </>
            ) : (
              <IoBody body={step.output} />
            )}
            {r.evidenceIds.length > 0 && (
              <p className="flex flex-wrap items-center gap-1.5 border-t border-divider pt-3 text-[12px] text-mute">
                {c.evidence}:
                {r.evidenceIds.map((e) => (
                  <span key={e} className="rounded bg-surface-fog px-1.5 py-0.5 font-medium text-ink">
                    {e}
                  </span>
                ))}
              </p>
            )}
          </section>

          <div className="grid grid-cols-1 items-start gap-3 2xl:grid-cols-2">
            {r.confidence && <ConfidenceCard confidence={r.confidence} />}
            {r.guardrails.length > 0 && <GuardrailCard guardrails={r.guardrails} />}
          </div>

          {r.lane && <LaneCard lane={r.lane} />}

          {step.tasks.map((t, i) => (
            <HumanTaskCard
              key={t.id}
              task={t}
              decided={decisions[t.id]}
              active={!finished && isFrontier && i === firstOpen}
              onDecide={(o) => onDecide(t.id, o)}
            />
          ))}

          {canHandOff && (
            <div className="jlr-fade-up flex flex-wrap items-center gap-4 border border-ink bg-white px-5 py-4" style={{ animationDelay: "160ms" }}>
              <p className="min-w-0 flex-1 text-[13px] leading-[19px] text-mute">
                {step.tasks.length === 0 ? c.policyHandoff : c.decidedBy(step.tasks.map((t) => t.persona).join(", "))}
              </p>
              <button
                type="button"
                onClick={onHandOff}
                className="ui-pill jlr-cta inline-flex items-center gap-3 whitespace-nowrap bg-ink px-6 py-3 text-[12.5px] text-ink-inverse"
              >
                {nextAgent ? c.handTo(nextAgent) : c.closeCase}
                <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          )}
        </>
      )}
    </article>
  );
}
