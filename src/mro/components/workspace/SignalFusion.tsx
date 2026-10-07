import * as React from "react";
import { Check, CornerUpRight, Eye, Mail, Sparkles } from "lucide-react";
import { Spinner } from "@/mro/components/ai/Spinner";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { SourceArtifactModal } from "@/mro/components/workspace/SourceArtifactModal";
import type { RiskSignal, SignalSpec, SourceArtifact } from "@/mro/data/runSteps";

/**
 * The signal-fusion view — plays in place of the extraction wizard on the
 * predictive risk step. No PR was raised: the agent reads N evidence signals as a
 * compact list of previewable rows (each opens the full email), reveals them one
 * by one as it "reads" them, then types a fused analysis and hands off to the
 * prediction. Human-readable in one glance, every signal one click from its email.
 */

const ROW_DELAY = 450; // before the first row appears
const ROW_STAGGER = 560; // gap between each signal row landing

export function SignalFusion({ spec, onComplete }: { spec: SignalSpec; onComplete: () => void }) {
  const [shown, setShown] = React.useState(0);
  const [analyzed, setAnalyzed] = React.useState(false);
  const [openSig, setOpenSig] = React.useState<SourceArtifact | null>(null);

  React.useEffect(() => {
    const timers = spec.signals.map((_, i) =>
      window.setTimeout(() => setShown((n) => Math.max(n, i + 1)), ROW_DELAY + i * ROW_STAGGER),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [spec.signals]);

  const allShown = shown >= spec.signals.length;

  const checklist = [
    { label: `Reading the ${spec.signals.length} risk signals`, done: allShown },
    { label: "Fusing the signals into a stock-out prediction", done: analyzed },
  ];
  const activeIdx = allShown ? 1 : 0;

  return (
    <div className="space-y-3 min-w-0">
      <div className="space-y-1.5">
        {checklist.slice(0, activeIdx + 1).map((s, i) => {
          const active = i === activeIdx;
          return (
            <div key={i} className="flex items-start gap-2 text-[12.5px] leading-snug">
              {s.done ? (
                <Check size={13} className="text-surface-deep mt-[3px] shrink-0" strokeWidth={3} />
              ) : (
                <Spinner size={13} className="mt-[2px] shrink-0" />
              )}
              <span className={active ? "text-ink font-medium" : "text-ink"}>{s.label}</span>
            </div>
          );
        })}
      </div>

      <SpringIn>
        <div className="bg-white border border-divider rounded-md overflow-hidden">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#eef1f5] border-b border-divider border-l-[3px] border-l-[#27455c]">
            <Sparkles size={12} className="text-ink shrink-0" />
            <span className="text-[10.5px] uppercase tracking-[0.06em] text-ink font-bold">
              Risk signals · {shown} / {spec.signals.length}
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-[10px] text-mute whitespace-nowrap">
              {allShown ? (
                "fused"
              ) : (
                <>
                  <Spinner size={9} className="shrink-0" /> reading…
                </>
              )}
            </span>
          </div>

          <div className="p-3 space-y-2">
            {spec.signals.map((sig, i) => (
              <SignalRow key={sig.id} signal={sig} shown={i < shown} onPreview={() => setOpenSig(sig)} />
            ))}
          </div>

          {allShown && (
            <div className="px-4 pb-4 pt-1">
              <div className="rounded-md bg-surface-mint/40 border border-surface-mint px-3 py-2.5 flex gap-2">
                <Sparkles size={13} className="text-surface-deep mt-[2px] shrink-0" />
                <p className="text-[12.5px] text-ink leading-relaxed min-h-[1.2em]">
                  <StreamingText text={spec.analysis} cps={52} startDelay={250} onDone={() => setAnalyzed(true)} />
                </p>
              </div>
            </div>
          )}

          <div className="px-4 py-3 border-t border-divider flex items-center gap-2">
            {allShown ? (
              <button
                type="button"
                onClick={onComplete}
                className="ui-pill inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold bg-surface-deep text-ink-inverse hover:bg-accent-green"
              >
                <CornerUpRight size={14} /> Continue to the prediction
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-mute">
                <Spinner size={11} className="shrink-0" /> Reading the signals one by one…
              </span>
            )}
          </div>
        </div>
      </SpringIn>

      <SourceArtifactModal source={openSig} onClose={() => setOpenSig(null)} />
    </div>
  );
}

function SignalRow({
  signal,
  shown,
  onPreview,
}: {
  signal: RiskSignal;
  shown: boolean;
  onPreview: () => void;
}) {
  if (!shown) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-divider bg-surface-fog/40 px-3 py-2.5 opacity-40">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-mint text-surface-deep">
          <Mail size={15} />
        </span>
        <span className="flex-1">
          <Spinner size={12} />
        </span>
      </div>
    );
  }
  return (
    <SpringIn>
      <button
        type="button"
        onClick={onPreview}
        className="ui-pill flex w-full items-center gap-3 rounded-md border border-divider bg-white px-3 py-2.5 text-left transition-colors hover:border-surface-deep hover:bg-surface-fog"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-mint text-surface-deep">
          <Mail size={15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-[12.5px] font-bold text-ink truncate">{signal.label}</span>
            <span className="text-[10px] text-mute shrink-0 whitespace-nowrap">{signal.meta}</span>
          </span>
          <span className="block text-[11.5px] text-mute leading-snug truncate">{signal.summary}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-surface-deep shrink-0">
          <Eye size={14} /> Preview
        </span>
      </button>
    </SpringIn>
  );
}
