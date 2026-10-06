import * as React from "react";
import { Check, ShieldCheck } from "lucide-react";
import { cn } from "@/freight/lib/utils";
import { TouchlessFunnel } from "@/freight/components/workspace/TouchlessFunnel";
import { ToleranceGauge } from "@/freight/components/workspace/ToleranceGauge";
import { ExceptionRouterBoard } from "@/freight/components/workspace/ExceptionRouterBoard";
import { batchLanes, batchTotals, batchOutliers } from "@/freight/data/settleBatch";

/**
 * The orchestrator's batch-approval surface (on the Approvals page). The day's
 * settlement run is pre-computed: most lines settle touchless, the rest bucket
 * into the four exception types. The analyst approves the whole run in one click
 * — posting the in-tolerance lines and routing the exceptions to the owning
 * teams. Reuses the settlement visuals at batch scale.
 */
export function SettlementBatchPanel() {
  const [approved, setApproved] = React.useState(false);
  return (
    <section className="bg-white border border-divider rounded-md p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold tracking-[0.09em] uppercase text-surface-deep">
          Settlement batch · {batchTotals.runId} · 9:00 AM · {batchTotals.carriers} carriers
        </span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold transition-colors",
            approved ? "bg-surface-deep/10 text-surface-deep" : "bg-surface-fog text-mute",
          )}
        >
          {approved ? (
            <>
              <Check size={11} strokeWidth={3} /> posted touchless · 36 routed
            </>
          ) : (
            "awaiting your approval"
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
        <TouchlessFunnel
          total={batchTotals.total}
          touchless={batchTotals.touchless}
          exceptions={batchTotals.exceptions}
          carriers={batchTotals.carriers}
          clearedAmount={batchTotals.clearedAmount}
          atRiskAmount={batchTotals.atRiskAmount}
          touchlessPct={batchTotals.touchlessPct}
        />
        <ToleranceGauge band="±2%" inCount={batchTotals.touchless} median="0.4%" outliers={batchOutliers} />
      </div>

      <ExceptionRouterBoard lanes={batchLanes} routed={approved} />

      <div className="flex items-center justify-between gap-4 rounded-md bg-surface-mint/30 border border-surface-mint px-4 py-3">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-ink">Approve the auto-cleared batch</div>
          <p className="text-[12px] text-mute leading-snug mt-0.5">
            {approved
              ? "1,604 in-tolerance lines posted to AP touchless ($3.64M) · 36 exceptions routed to 4 teams with tracked SLAs · audit record written."
              : "Post the 1,604 in-tolerance lines to AP and route the 36 exceptions to the owning teams. You approve the run, not each line."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setApproved(true)}
          disabled={approved}
          className={cn(
            "ui-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-bold whitespace-nowrap shrink-0",
            approved
              ? "bg-surface-mint text-surface-deep cursor-default"
              : "bg-surface-deep text-ink-inverse hover:bg-accent-green",
          )}
        >
          {approved ? (
            <>
              <Check size={15} /> Batch approved
            </>
          ) : (
            <>
              <ShieldCheck size={15} /> Approve & post 1,604 · route 36
            </>
          )}
        </button>
      </div>
    </section>
  );
}
