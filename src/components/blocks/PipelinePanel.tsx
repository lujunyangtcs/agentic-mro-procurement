import { cn } from "@/lib/utils";
import { useApp } from "@/state";
import { pipelineStages, pipelineFooter, type PipelineStage } from "@/data/cockpit";
import { AIDot } from "@/components/ai/AIDot";

const statusLabel: Record<PipelineStage["status"], string> = {
  running: "On track",
  review: "Needs a look",
  idle: "Queued",
};

const statusTone: Record<PipelineStage["status"], "green" | "red" | "mute"> = {
  running: "green",
  review: "red",
  idle: "mute",
};

/** A numbered node with the connecting flow line above and below it. */
function Node({ n, last }: { n: number; last: boolean }) {
  return (
    <div className="w-9 shrink-0 self-stretch flex flex-col items-center">
      <div className={cn("w-px flex-1", n === 1 ? "bg-transparent" : "bg-surface-deep/30")} />
      <span className="my-0.5 w-6 h-6 rounded-full border-2 border-surface-deep bg-white text-surface-deep text-[11px] font-bold flex items-center justify-center">
        {n}
      </span>
      <div className={cn("w-px flex-1", last ? "bg-transparent" : "bg-surface-deep/30")} />
    </div>
  );
}

function StageRow({ stage, last }: { stage: PipelineStage; last: boolean }) {
  const { go } = useApp();
  const right = (
    <div className="flex items-center gap-3 flex-1 min-w-0 py-3 pr-4">
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-bold text-ink leading-tight">{stage.name}</div>
        <div className="text-[12px] text-mute leading-snug">{stage.detail}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[13px] font-medium text-ink">{stage.volume}</div>
        <div className="flex items-center justify-end gap-1.5 mt-0.5">
          <AIDot size={6} tone={statusTone[stage.status]} pulse={stage.status === "running"} />
          <span className="text-[11px] text-mute">{statusLabel[stage.status]}</span>
        </div>
      </div>
      {stage.agent && (
        <span aria-hidden className="text-mute text-[13px] shrink-0">
          ↗
        </span>
      )}
    </div>
  );

  if (!stage.agent) {
    return (
      <div className="w-full flex items-stretch gap-3 pl-2">
        <Node n={stage.n} last={last} />
        {right}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => go({ kind: "agent", id: stage.agent! })}
      className="ui-pill w-full text-left flex items-stretch gap-3 pl-2 hover:bg-surface-mint/35"
    >
      <Node n={stage.n} last={last} />
      {right}
    </button>
  );
}

export function PipelinePanel({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "bg-white border border-divider rounded-md overflow-hidden flex flex-col",
        className,
      )}
    >
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-divider">
        <div className="flex items-center gap-3">
          <AIDot size={6} tone="deep" pulse />
          <span className="text-[12px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Pipeline
          </span>
        </div>
        <span className="text-[11px] text-mute">Requisition to payment</span>
      </header>

      <div className="flex-1">
        {pipelineStages.map((s, i) => (
          <StageRow key={s.n} stage={s} last={i === pipelineStages.length - 1} />
        ))}
      </div>

      <div className="mt-auto border-t border-divider px-4 py-2.5">
        <span className="text-[12px] text-mute">{pipelineFooter}</span>
      </div>
    </section>
  );
}
