import { BellRing } from "lucide-react";
import { TopRow } from "@/o2c/components/blocks/TopRow";
import { HeroBanner } from "@/o2c/components/blocks/HeroBanner";
import { KPIStrip } from "@/o2c/components/blocks/KPIStrip";
import { PillButton } from "@/o2c/components/blocks/PillButton";
import { PendingDecisionsPanel } from "@/o2c/components/blocks/PendingDecisionsPanel";
import { PipelinePanel } from "@/o2c/components/blocks/PipelinePanel";
import { OverduePaymentsPanel } from "@/o2c/components/blocks/OverduePaymentsPanel";
import { cockpitKpis, overduePayments } from "@/o2c/data/cockpit";
import { useApp } from "@/o2c/state";

/**
 * Top-right notification — the Payment & Collections agent flags overdue
 * receivables. Deliberately just a small bell with a live red dot (no label):
 * the detail lives in the tooltip and the Overdue payments panel, so the
 * breadcrumb row stays clean. Deep-links into the collections run.
 */
function PaymentAlert() {
  const { go } = useApp();
  const a = overduePayments.alert;
  return (
    <button
      type="button"
      onClick={() => go({ kind: "workspace", flow: "collect" })}
      title={`${a.count} payments overdue · ${a.amount} — ${a.lead}`}
      aria-label={`${a.count} payments overdue, ${a.amount}`}
      className="ui-pill relative shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border border-divider bg-white hover:bg-surface-rose/40"
    >
      <BellRing size={16} className="text-mark-red" strokeWidth={2} />
      <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-mark-red animate-ping" />
      <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-mark-red ring-2 ring-white" />
    </button>
  );
}

export function Cockpit() {
  return (
    <div className="pl-5 pr-6 pt-4 pb-8 space-y-3 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <TopRow breadcrumb={{ label: "Order-to-cash", chip: "Orchestrator" }} />
        </div>
        <PaymentAlert />
      </div>

      <HeroBanner
        eyebrow="Autonomous order-to-cash"
        summary="This quarter the workforce applied 91% of customer cash touchless and recovered $3.1M of invalid deductions that would have leaked — releasing $6.4M of working capital and cutting DSO by 5.1 days. It is now working $2.34M of open deductions across 8 customers. 3 decisions need you today."
        cta={<PillButton variant="deep" size="sm">+ New review</PillButton>}
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
