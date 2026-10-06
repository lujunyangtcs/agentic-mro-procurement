import { BellRing, PackageCheck } from "lucide-react";
import { TopRow } from "@/freight/components/blocks/TopRow";
import { HeroBanner } from "@/freight/components/blocks/HeroBanner";
import { KPIStrip } from "@/freight/components/blocks/KPIStrip";
import { PillButton } from "@/freight/components/blocks/PillButton";
import { PendingDecisionsPanel } from "@/freight/components/blocks/PendingDecisionsPanel";
import { PipelinePanel } from "@/freight/components/blocks/PipelinePanel";
import { OverduePaymentsPanel } from "@/freight/components/blocks/OverduePaymentsPanel";
import { cockpitKpis } from "@/freight/data/cockpit";
import { useApp } from "@/freight/state";

/**
 * Top-right notifications — the two hero triggers, each a second entry point
 * into its run. A mint settlement bell (touchless = healthy) deep-links into the
 * batch settlement run; a red dispute bell flags the carrier invoice that
 * arrived and failed the three-way check. Detail lives in the tooltip; the
 * decision cards carry the full story.
 */
function FlowBells() {
  const { go } = useApp();
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={() => go({ kind: "workspace", flow: "settle" })}
        title="Carrier invoice INV-IRN-2206 · 16/20 lines cleared touchless · 4 exceptions (missing PO / wrong company code / insufficient PO value / rate mismatch) — routed to 4 teams"
        aria-label="Carrier settlement invoice INV-IRN-2206 — open the workspace"
        className="ui-pill relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-divider bg-white hover:bg-surface-mint/50"
      >
        <PackageCheck size={16} className="text-surface-deep" strokeWidth={2} />
        <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-accent-green ring-2 ring-white" />
      </button>
      <button
        type="button"
        onClick={() => go({ kind: "workspace", flow: "belt" })}
        title="Carrier invoice INV-SUM-5567 received 9:01 AM — three-way check found $1,816 across surcharge, demurrage and cube-out lines"
        aria-label="Carrier invoice INV-SUM-5567 — open the workspace"
        className="ui-pill relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-divider bg-white hover:bg-surface-rose/40"
      >
        <BellRing size={16} className="text-mark-red" strokeWidth={2} />
        <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-mark-red animate-ping" />
        <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-mark-red ring-2 ring-white" />
      </button>
    </div>
  );
}

export function Cockpit() {
  return (
    <div className="pl-5 pr-6 pt-4 pb-8 space-y-3 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <TopRow breadcrumb={{ label: "Freight settlement", chip: "Router" }} />
        </div>
        <FlowBells />
      </div>

      <HeroBanner
        eyebrow="Autonomous freight settlement"
        summary="$1.18M overcharge recovered and $214K demurrage avoided this quarter · the Ironwood settlement invoice cleared 80% touchless with 4 exceptions routed · 2 decisions need you today."
        cta={<PillButton variant="deep" size="sm">+ New lane</PillButton>}
        meta="Updated 1 min ago"
      />

      <KPIStrip items={cockpitKpis} />

      <PendingDecisionsPanel />

      <div className="grid grid-cols-2 gap-3 items-stretch">
        <OverduePaymentsPanel />
        <PipelinePanel />
      </div>
    </div>
  );
}
