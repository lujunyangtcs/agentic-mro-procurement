import { useApp, type DocId } from "@/state";
import { AIDot } from "@/components/ai/AIDot";
import { SpringIn } from "@/components/ai/SpringIn";

/* Shared chip that deep-links to a pay-cycle document. */
function DocChip({ id, label }: { id: DocId; label: string }) {
  const { go } = useApp();
  return (
    <button
      type="button"
      onClick={() => go({ kind: "doc", id })}
      className="ui-pill inline-flex items-center gap-1 rounded-md border border-divider bg-surface-fog px-2.5 py-1 text-[11px] font-medium text-surface-deep hover:bg-surface-mint"
    >
      {label}
      <span aria-hidden>↗</span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * STEP 6 — Issue the order and receive the belt (Fulfillment agent)
 * ──────────────────────────────────────────────────────────────────────*/

const receiptRows = [
  { label: "Order issued", detail: "PO-77310 posted to SAP · confirmed with BeltPro Industrial" },
  { label: "Shipment", detail: "Tracked against the 5-day promise · delivered to the mill" },
  { label: "Goods receipt", detail: "GR-77310 booked at the Containerboard mill dock · 1 belt · condition OK" },
];

export function GoodsReceiptCard() {
  return (
    <SpringIn>
      <article className="bg-white border border-divider rounded-md p-6 space-y-4">
        <header className="flex items-center gap-2">
          <AIDot size={6} tone="deep" pulse />
          <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Order issued · goods received at the mill
          </span>
        </header>
        <div className="space-y-2.5">
          {receiptRows.map((r) => (
            <div key={r.label} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-md bg-surface-deep text-ink-inverse flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                ✓
              </span>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-ink">{r.label}</div>
                <div className="text-[12px] text-mute leading-snug mt-0.5">{r.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </article>
    </SpringIn>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * STEP 7 — Three-way invoice match (Invoice agent)
 * The defining procure-to-PAY artifact: PO ↔ goods receipt ↔ invoice.
 * ──────────────────────────────────────────────────────────────────────*/

const matchDocs = [
  { label: "Purchase order", ref: "PO-77310", amount: "$48,200" },
  { label: "Goods receipt", ref: "GR-77310", amount: "1 belt · OK" },
  { label: "Supplier invoice", ref: "INV-BPI-5567", amount: "$48,200" },
];

export function ThreeWayMatchCard() {
  return (
    <SpringIn>
      <article className="bg-white border border-divider rounded-md p-6 space-y-4">
        <header className="flex items-center gap-2">
          <AIDot size={6} tone="deep" pulse />
          <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Three-way match · order, receipt and invoice
          </span>
          <span className="ml-auto">
            <DocChip id="invoice-match" label="Match report" />
          </span>
        </header>

        <div className="grid grid-cols-3 gap-2.5">
          {matchDocs.map((d) => (
            <div key={d.label} className="rounded-md bg-surface-fog px-3 py-3 text-center">
              <div className="text-[10px] tracking-[0.06em] uppercase text-mute font-medium">
                {d.label}
              </div>
              <div className="text-[13px] font-bold text-ink mt-1">{d.ref}</div>
              <div className="text-[12px] text-surface-deep mt-0.5">{d.amount}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 rounded-md bg-surface-mint border border-surface-deep/20 px-3 py-2.5">
          <span className="w-5 h-5 rounded-md bg-surface-deep text-ink-inverse flex items-center justify-center text-[11px] font-bold shrink-0">
            ✓
          </span>
          <p className="text-[12px] text-ink leading-snug">
            Amounts tie out · variance <span className="font-bold">$0</span> · within the ±2%
            tolerance. The payment hold clears itself — no buyer touch needed.
          </p>
        </div>
      </article>
    </SpringIn>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * STEP 8 — Release to AP and close (Orchestrator)
 * ──────────────────────────────────────────────────────────────────────*/

const paymentRows = [
  { label: "Terms", value: "Net 30 · framework terms honored" },
  { label: "Method", value: "ACH · remittance PAY-77310 to BeltPro Industrial" },
  { label: "Posted", value: "$48,200 scheduled · finance ledger updated in SAP" },
];

export function PaymentReleaseCard() {
  return (
    <SpringIn>
      <article className="bg-white border border-divider rounded-md p-6 space-y-4">
        <header className="flex items-center gap-2">
          <AIDot size={6} tone="deep" pulse />
          <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Payment released · audit closed
          </span>
          <span className="ml-auto">
            <DocChip id="payment-advice" label="Remittance" />
          </span>
        </header>

        <div className="space-y-2">
          {paymentRows.map((r) => (
            <div key={r.label} className="grid grid-cols-[88px_1fr] gap-3 items-start">
              <span className="text-[11px] tracking-[0.06em] uppercase text-mute font-medium pt-0.5">
                {r.label}
              </span>
              <span className="text-[13px] text-ink">{r.value}</span>
            </div>
          ))}
        </div>

        <div className="rounded-md bg-surface-fog px-3 py-2.5 text-[12px] text-ink">
          Audit envelope closed with all six artifacts attached — requisition, three bids, draft
          order, control-check report, match report and remittance. One trail, end to end.
        </div>
      </article>
    </SpringIn>
  );
}
