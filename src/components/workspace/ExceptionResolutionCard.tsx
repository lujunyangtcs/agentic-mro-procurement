import * as React from "react";
import { ShieldAlert, FileText, ArrowUpRight, Lock } from "lucide-react";
import { SpringIn } from "@/components/ai/SpringIn";
import { cn } from "@/lib/utils";
import { AiDraftEmailCard } from "@/components/workspace/AiDraftEmailCard";
import type { ExceptionResolution } from "@/data/runSteps";

/**
 * The payoff surface for a halted run. Where the happy path closes with the
 * orchestrator's audit envelope, an exception closes here: the control that
 * tripped, the evidence bundled, the controlled handoff, and the immutable
 * audit record a Controller signs off against. Single column, calm.
 */
export function ExceptionResolutionCard({ ex }: { ex: ExceptionResolution }) {
  const [sent, setSent] = React.useState(false);
  return (
    <SpringIn>
      <article className="bg-white border border-mark-red/30 rounded-md overflow-hidden">
        <header className="flex items-center gap-2 px-4 py-3 bg-surface-rose/50 border-b border-mark-red/20">
          <ShieldAlert size={15} className="text-mark-red shrink-0" />
          <span className="text-[11px] tracking-[0.08em] uppercase text-mark-red font-bold">
            {ex.title}
          </span>
          <span className="ml-auto text-[11px] text-mute tabular-nums">{ex.audit.id}</span>
        </header>

        <div className="p-4 space-y-4">
          {/* Control gates — which tripped, which cleared */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.07em] text-mute font-medium mb-2">
              Control envelope · nothing executes while a gate is tripped
            </div>
            <div className="space-y-2">
              {ex.gates.map((g) => (
                <div key={g.name} className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5",
                      g.state === "tripped"
                        ? "bg-mark-red text-ink-inverse"
                        : "bg-surface-deep text-ink-inverse",
                    )}
                  >
                    {g.state === "tripped" ? "!" : "✓"}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-ink">{g.name}</span>
                      <span
                        className={cn(
                          "text-[10px] tracking-[0.06em] uppercase font-medium px-1.5 py-0.5 rounded",
                          g.state === "tripped"
                            ? "bg-surface-rose text-mark-red"
                            : "bg-surface-mint text-surface-deep",
                        )}
                      >
                        {g.state === "tripped" ? "Tripped" : "Clear"}
                      </span>
                    </div>
                    <div className="text-[12px] text-mute leading-snug mt-0.5">{g.result}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence bundle */}
          <div className="border-t border-divider pt-3">
            <div className="text-[11px] uppercase tracking-[0.07em] text-mute font-medium mb-2">
              Evidence bundled for the reviewer
            </div>
            <div className="space-y-1.5">
              {ex.evidence.map((e) => (
                <div key={e.label} className="flex items-start gap-2 text-[12.5px] leading-snug">
                  <FileText size={13} className="text-surface-deep mt-[3px] shrink-0" />
                  <span className="text-ink">
                    <span className="font-medium">{e.label}</span>
                    <span className="text-mute"> · {e.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Controlled handoff */}
          <div className="border-t border-divider pt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 items-start">
            <ArrowUpRight size={15} className="text-mark-red mt-0.5 row-span-2" />
            <div className="text-[13px] text-ink">
              <span className="font-bold">Routed to {ex.handoff.to}</span>
              <span className="text-mute"> · {ex.handoff.sla}</span>
            </div>
            <div className="text-[12px] text-mute leading-snug col-start-2">
              Next: {ex.handoff.nextStep}
            </div>
          </div>

          {/* Immutable audit record */}
          <div className="rounded-md bg-surface-fog px-3 py-2.5 flex items-start gap-2">
            <Lock size={13} className="text-surface-deep mt-0.5 shrink-0" />
            <div className="text-[12px] text-ink leading-snug">
              <span className="font-medium">Audit record {ex.audit.id}</span>
              <span className="text-mute"> logged {ex.audit.logged}</span>
              <span className="text-mute"> — {ex.audit.note}</span>
            </div>
          </div>

          {/* Agent-drafted controlled response — review and send */}
          {ex.draft && (
            <div className="border-t border-divider pt-3">
              <div className="text-[11px] uppercase tracking-[0.07em] text-mute font-medium mb-2">
                Agent-drafted response · review before send
              </div>
              <AiDraftEmailCard
                email={ex.draft}
                sent={sent}
                onSend={() => setSent(true)}
                sendLabel={ex.draft.sendLabel}
                sentLabel={ex.draft.sentLabel}
              />
            </div>
          )}
        </div>
      </article>
    </SpringIn>
  );
}
