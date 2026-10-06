import { useApp, type DocId } from "@/mro/state";
import { PillButton } from "@/mro/components/blocks/PillButton";
import { AIDot } from "@/mro/components/ai/AIDot";

const DOC_META: Record<DocId, { eyebrow: string; title: string; note: string }> = {
  "purchase-req": {
    eyebrow: "Lane Intake agent",
    title: "Lane intake packet · FRT-48201",
    note: "Inbound OCC live load · lane CHI→RIV · classified from the pickup requirement and bound to an approved movement pattern.",
  },
  "bid-comparison": {
    eyebrow: "Rate & Surcharge agent",
    title: "Rate & surcharge validation",
    note: "Line haul checked against the contracted lane rate · fuel surcharge normalised · billed as a flat fee vs the contracted percentage.",
  },
  "draft-po": {
    eyebrow: "Carrier Tender agent",
    title: "Carrier tender · TND-77310",
    note: "Load tendered to the approved carrier · rate, equipment and pickup window confirmed against the sourcing agreement.",
  },
  "envelope-report": {
    eyebrow: "Router",
    title: "Settlement control report",
    note: "Duplicate-booking, company-code, PO-value and tolerance checks · clean except the three flagged lines.",
  },
  "invoice-match": {
    eyebrow: "Settlement agent",
    title: "Three-way match report · INV-SUM-5567",
    note: "Invoice matched line-by-line to the shipment (SAP) and the contract (Excel) · in-tolerance lines clear · demurrage, surcharge mismatch and cube-out variance flagged.",
  },
  "payment-advice": {
    eyebrow: "Router",
    title: "Settlement & dispute advice · SET-77310",
    note: "Cleared lines posted to AP on the net terms · the three exception lines sent to the carrier as a drafted dispute · audit envelope closed with every artifact.",
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
