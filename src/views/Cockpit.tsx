import { BellRing, Repeat, ArrowRight } from "lucide-react";
import { TopRow } from "@/components/blocks/TopRow";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { KPIStrip } from "@/components/blocks/KPIStrip";
import { PillButton } from "@/components/blocks/PillButton";
import { PendingDecisionsPanel } from "@/components/blocks/PendingDecisionsPanel";
import { PipelinePanel } from "@/components/blocks/PipelinePanel";
import { OverduePaymentsPanel } from "@/components/blocks/OverduePaymentsPanel";
import { cockpitKpis, overduePayments } from "@/data/cockpit";
import { useApp } from "@/state";

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

/**
 * Compact teaser for the Finance → Procurement feedback loop. Sits under the
 * decisions queue and deep-links into the Feedback loop surface — the close of
 * the procurement/payables story (Payables feeds insight back to procurement).
 */
function FeedbackLoopTeaser() {
  const { go } = useApp();
  const moves = [
    { tag: "Match & pay", note: "186/204 clean" },
    { tag: "Payment timing", note: "DPO 38 → 52 · $4.7M freed" },
    { tag: "Discount + perf", note: "Apex · $128K captured" },
    { tag: "Joint negotiation", note: "Cascade · $96K/yr" },
  ];
  return (
    <button
      type="button"
      onClick={() => go({ kind: "feedback" })}
      className="ui-pill w-full text-left rounded-md border border-surface-deep/25 bg-surface-mint/35 px-4 py-3.5 hover:bg-surface-mint/55"
    >
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-lg bg-surface-deep flex items-center justify-center shrink-0">
          <Repeat size={17} strokeWidth={2} className="text-ink-inverse" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-ink">Finance → Procurement feedback loop</span>
            <span className="text-[11px] font-bold text-surface-deep bg-white/80 px-2 py-0.5 rounded-full">
              4 insights ready
            </span>
          </div>
          <p className="text-[12px] text-mute leading-snug mt-0.5">
            Payables feeds insight back to procurement — clean-match release, payment-timing cash, vendor discount
            re-prioritisation and a joint negotiation. You approve each hand-off.
          </p>
        </div>
        <span className="hidden lg:flex items-center gap-1.5 shrink-0">
          {moves.map((m) => (
            <span
              key={m.tag}
              className="rounded-md bg-white/70 border border-surface-deep/15 px-2.5 py-1 text-center"
            >
              <span className="block text-[11px] font-bold text-surface-deep leading-tight">{m.tag}</span>
              <span className="block text-[10px] text-mute leading-tight tabular-nums">{m.note}</span>
            </span>
          ))}
        </span>
        <ArrowRight size={16} className="text-surface-deep shrink-0" />
      </div>
    </button>
  );
}

export function Cockpit() {
  return (
    <div className="pl-5 pr-6 pt-4 pb-8 space-y-3 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <TopRow breadcrumb={{ label: "Procure-to-pay", chip: "Orchestrator" }} />
        </div>
        <PaymentAlert />
      </div>

      <HeroBanner
        eyebrow="Autonomous procure-to-pay"
        summary="This quarter the workforce kept $1.24M of maverick spend on-contract and blocked a $72,000 payment-redirection fraud this week — while running 82% of orders touchless and cutting requisition-to-order from 11 days to 4.2 hours. It is also auto-chasing $1.84M of overdue receivables. 3 decisions need you today."
        cta={<PillButton variant="deep" size="sm">+ New request</PillButton>}
        meta="Updated 1 min ago"
      />

      <KPIStrip items={cockpitKpis} />

      <PendingDecisionsPanel />

      <FeedbackLoopTeaser />

      <div className="grid grid-cols-2 gap-3 items-stretch">
        <OverduePaymentsPanel />
        <PipelinePanel />
      </div>
    </div>
  );
}
