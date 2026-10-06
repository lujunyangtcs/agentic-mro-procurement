import * as React from "react";
import { Check, ShieldAlert, X, FileText } from "lucide-react";
import { cn } from "@/freight/lib/utils";
import { SpringIn } from "@/freight/components/ai/SpringIn";
import type { FlowRun } from "@/freight/data/flowRuns";
import type { SourceArtifact } from "@/freight/data/runSteps";

/**
 * The close ceremony — a centered card that lands when a run settles. Reused
 * across all three flows: the happy path closes green ("flow complete · paid"),
 * the exception flows close red ("exception raised · escalated / blocked"). Each
 * shows three stat tiles, the run's produced artifacts (PR · RFQ · PO · GR ·
 * invoice) stacked as clickable chips that open the real document, and two
 * actions: stay on the run, or return to the cockpit.
 */
export function FlowCompleteModal({
  run,
  onOpenArtifact,
  onBackToCockpit,
  onClose,
}: {
  run: FlowRun;
  onOpenArtifact: (s: SourceArtifact) => void;
  onBackToCockpit: () => void;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const c = run.completion;
  if (!c) return null;
  const critical = c.tone === "critical";

  // Each agent step's produced document becomes a clickable artifact chip.
  const artifacts: SourceArtifact[] = run.steps.map((s, i) => ({
    id: `done-${i}-${s.id}`,
    label: s.docLabel.split(" · ")[0],
    meta: s.docLabel,
    kind: "sap",
    body: s.document,
  }));

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <SpringIn className="w-full max-w-[420px]">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-xl px-7 pt-8 pb-6 text-center"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ui-pill absolute top-4 right-4 w-8 h-8 rounded-full text-mute hover:bg-surface-fog flex items-center justify-center"
          >
            <X size={18} />
          </button>

          {/* Tone icon — green tick for a clean close, red shield for a halt */}
          <div className="flex justify-center">
            <span
              className={cn(
                "w-[64px] h-[64px] rounded-full flex items-center justify-center",
                critical ? "bg-surface-rose" : "bg-surface-mint",
              )}
            >
              <span
                className={cn(
                  "w-[50px] h-[50px] rounded-full text-ink-inverse flex items-center justify-center",
                  critical ? "bg-mark-red" : "bg-surface-deep",
                )}
              >
                {critical ? <ShieldAlert size={26} /> : <Check size={28} strokeWidth={3} />}
              </span>
            </span>
          </div>

          <div
            className={cn(
              "text-[11px] uppercase tracking-[0.1em] font-bold mt-4",
              critical ? "text-mark-red" : "text-surface-deep",
            )}
          >
            {critical ? "Exception raised" : "Flow complete"}
          </div>
          <div className="text-[20px] font-bold text-ink tracking-[-0.01em] mt-1 leading-tight">
            {c.title}
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {c.stats.map((s) => (
              <div key={s.label} className="rounded-lg border border-divider bg-surface-fog/60 py-2.5 px-1">
                <div
                  className={cn(
                    "text-[18px] font-bold leading-none",
                    critical ? "text-mark-red" : "text-surface-deep",
                  )}
                >
                  {s.value}
                </div>
                <div className="text-[10px] text-mute mt-1 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>

          <p className="text-[12.5px] text-mute leading-snug mt-3.5">{c.caption}</p>

          {/* Clickable artifacts — stacked vertically */}
          <div className="mt-4 text-left">
            <div className="text-[11px] uppercase tracking-[0.07em] text-mute font-medium mb-2">
              Artifacts · click to open
            </div>
            <div className="flex flex-col gap-2">
              {artifacts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onOpenArtifact(a)}
                  className="ui-pill w-full inline-flex items-center gap-2 rounded-md border border-divider bg-white px-3 py-2 text-[12.5px] text-ink hover:border-surface-deep hover:bg-surface-mint/40"
                >
                  <FileText size={14} className="text-surface-deep shrink-0" />
                  <span className="font-medium">{a.label}</span>
                  <span className="text-mute text-[11px] ml-auto truncate">
                    {a.meta.split(" · ")[1] ?? ""}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="ui-pill flex-1 rounded-full border border-ink/25 bg-white px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-surface-fog"
            >
              Stay on the run
            </button>
            <button
              type="button"
              onClick={onBackToCockpit}
              className="ui-pill flex-1 rounded-full bg-surface-deep px-4 py-2.5 text-[13px] font-bold text-ink-inverse hover:bg-accent-green"
            >
              Back to cockpit
            </button>
          </div>
        </div>
      </SpringIn>
    </div>
  );
}
