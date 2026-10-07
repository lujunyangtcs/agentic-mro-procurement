import * as React from "react";
import { ChevronDown, ArrowRight, Bot } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import type { RunStep } from "@/mro/data/stories/runModel";
import { IoBody } from "@/mro/components/story/IoBody";
import { ConfidenceCard, GuardrailCard, LaneCard } from "@/mro/components/story/Envelope";
import { HumanTaskCard } from "@/mro/components/story/HumanTaskCard";
import { useStoryCopy } from "@/mro/components/story/copy";

function Working() {
  const { c } = useStoryCopy();
  const lines = [c.reading, c.checking, c.scoring];
  return (
    <div className="flex flex-col gap-3 rounded-md border border-divider bg-white p-5" role="status" aria-live="polite">
      {lines.map((l, i) => (
        <div
          key={l}
          className="flex items-center gap-3 opacity-0 [animation:story-line_400ms_ease-out_forwards]"
          style={{ animationDelay: `${i * 450}ms` }}
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-surface-sage ai-pulse" aria-hidden />
          <span className="text-[14px] leading-[20px] text-ink">{l}…</span>
        </div>
      ))}
    </div>
  );
}

export function AgentRunPanel({
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
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-divider bg-white px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-surface-deep text-ink-inverse" aria-hidden>
          <Bot size={18} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`agent-${step.index}`} className="truncate text-[17px] font-bold leading-[22px] text-ink">
            {r.agent}
          </h2>
          <p className="truncate text-[12.5px] leading-[17px] text-mute">
            {r.flowStep} · {r.caseId}
          </p>
        </div>
        {!running && (
          <p className="shrink-0 text-[12px] leading-[16px] text-mute">
            {r.model && `${c.model} ${r.model} · `}
            {c.ran(seconds)}
          </p>
        )}
      </header>

      {running ? (
        <Working />
      ) : (
        <>
          <section className="flex flex-col gap-3 rounded-md border border-divider bg-white p-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink">{c.produced}</h3>
              <button
                type="button"
                onClick={() => setShowInput((v) => !v)}
                aria-expanded={showInput}
                className="ml-auto inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-[12.5px] font-medium text-surface-deep hover:bg-surface-fog"
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
            <IoBody body={step.output} />
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
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-divider bg-white px-4 py-3">
              <p className="min-w-0 flex-1 text-[13px] leading-[18px] text-mute">
                {step.tasks.length === 0 ? c.policyHandoff : c.decidedBy(step.tasks.map((t) => t.persona).join(", "))}
              </p>
              <button
                type="button"
                onClick={onHandOff}
                className="ui-pill inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-surface-deep px-4 py-2.5 text-[13px] font-medium text-ink-inverse hover:brightness-110 active:translate-y-px"
              >
                {nextAgent ? c.handTo(nextAgent) : c.closeCase}
                <ArrowRight size={15} aria-hidden />
              </button>
            </div>
          )}
        </>
      )}
    </article>
  );
}
