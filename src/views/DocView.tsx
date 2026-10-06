import { useApp, type DocId } from "@/state";
import { PillButton } from "@/components/blocks/PillButton";
import { AIDot } from "@/components/ai/AIDot";

const DOC_META: Record<DocId, { eyebrow: string; title: string; note: string }> = {
  "purchase-req": {
    eyebrow: "Intake agent",
    title: "Purchase requisition · PR-48201",
    note: "Corrugator No.2 double-backer belt · catalog part 88-DBX · raised from the maintenance request.",
  },
  "bid-comparison": {
    eyebrow: "Sourcing agent",
    title: "Three-bid comparison",
    note: "BeltPro Industrial vs Heartland vs Apex · price, lead time and freight to the mill.",
  },
  "draft-po": {
    eyebrow: "PO agent",
    title: "Draft purchase order · PO-77310",
    note: "$48,200 · bound to the framework contract · freight included · 5-day delivery promise.",
  },
  "envelope-report": {
    eyebrow: "Orchestrator",
    title: "Control-check report",
    note: "Policy, contract, budget, duplicate-supplier and approval-limit checks · all clear.",
  },
  "invoice-match": {
    eyebrow: "Invoice agent",
    title: "Three-way match report · INV-BPI-5567",
    note: "Purchase order PO-77310, goods receipt GR-77310 and the supplier invoice all read $48,200 · variance $0 · within the ±2% tolerance.",
  },
  "payment-advice": {
    eyebrow: "Orchestrator",
    title: "Remittance advice · PAY-77310",
    note: "$48,200 paid to BeltPro Industrial by ACH on the net-30 framework terms · audit envelope closed with all six artifacts.",
  },
};

export function DocView({ id }: { id: DocId }) {
  const { back } = useApp();
  const meta = DOC_META[id];

  return (
    <div className="min-h-screen bg-surface-fog">
      <header className="flex items-center gap-6 px-8 py-4 bg-white border-b border-divider">
        <button
          type="button"
          onClick={back}
          className="ui-pill text-[13px] text-ink hover:text-surface-deep flex items-center gap-1.5"
        >
          <span aria-hidden>←</span>
          Back
        </button>
        <span className="w-px h-5 bg-divider" />
        <div className="leading-tight">
          <div className="text-[15px] font-bold text-ink">{meta.title}</div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-mute mt-0.5">{meta.eyebrow}</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-10">
        <article className="bg-white border border-divider rounded-md p-10 space-y-5">
          <div className="flex items-center gap-2">
            <AIDot size={6} tone="deep" pulse />
            <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
              {meta.eyebrow}
            </span>
          </div>
          <h1 className="text-[26px] font-bold text-ink leading-tight">{meta.title}</h1>
          <p className="text-[15px] text-mute leading-relaxed">{meta.note}</p>

          <div className="rounded-md bg-surface-mint/40 border border-surface-deep/15 p-5">
            <div className="text-[13px] text-ink">
              Full document preview is part of the next build. The decision card already links here so
              the audience can see every artifact the agents produced for this order.
            </div>
          </div>

          <PillButton variant="primary" arrow onClick={back}>
            Back to the run
          </PillButton>
        </article>
      </main>
    </div>
  );
}
