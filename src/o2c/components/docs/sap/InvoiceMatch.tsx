/**
 * Faithful SAP MIRO-style logistics invoice verification with a four-way match.
 *
 * Basic-data header (invoice date · vendor reference · gross amount · tax code),
 * then the control principle: contract ↔ PO ↔ goods receipt ↔ invoice agree on
 * price and quantity. Balance 0.00 lights the green traffic light and the
 * invoice posts. The Invoice agent's output — clean match releases to AP.
 */

import { DocShell, DocTitleBand, SectionBand, Field } from "./parts";
import { cn } from "@/o2c/lib/utils";

export type MatchRow = {
  dimension: string;
  contract: string;
  po: string;
  goodsReceipt: string;
  invoice: string;
  ok: boolean;
};

export type SapInvoice = {
  number: string;
  status: string;
  createdOn: string;
  createdBy: string;
  vendorReference: string;
  vendor: string;
  invoiceDate: string;
  postingDate: string;
  baselineDate: string;
  dueDate: string;
  paymentTerms: string;
  taxCode: string;
  grossAmount: string;
  taxAmount: string;
  currency: string;
  balance: string;
  fraudScore: string;
  poReference: string;
  grReference: string;
  match: MatchRow[];
};

/** INV-BPI-5567 — BeltPro's invoice, four-way matched to a $0 variance. */
export const invoiceBelt: SapInvoice = {
  number: "INV-BPI-5567",
  status: "Posted · cleared to pay",
  createdOn: "2026-06-09 · 14:20",
  createdBy: "Invoice Resolution Agent",
  vendorReference: "BPI-5567",
  vendor: "100482 · BeltPro Industrial",
  invoiceDate: "2026-06-09",
  postingDate: "2026-06-09",
  baselineDate: "2026-06-09",
  dueDate: "2026-07-09",
  paymentTerms: "NT30 · Net 30 days",
  taxCode: "U1 · Self-assessed use tax",
  grossAmount: "48,200.00",
  taxAmount: "0.00",
  currency: "USD",
  balance: "0.00",
  fraudScore: "0.02 · low",
  poReference: "PO-77310 · item 10",
  grReference: "GR-77310 · 5000031882",
  match: [
    {
      dimension: "Unit price (USD)",
      contract: "48,200.00",
      po: "48,200.00",
      goodsReceipt: "—",
      invoice: "48,200.00",
      ok: true,
    },
    { dimension: "Quantity (EA)", contract: "1", po: "1", goodsReceipt: "1", invoice: "1", ok: true },
    {
      dimension: "Net value (USD)",
      contract: "48,200.00",
      po: "48,200.00",
      goodsReceipt: "48,200.00",
      invoice: "48,200.00",
      ok: true,
    },
    { dimension: "Tax code", contract: "U1", po: "U1", goodsReceipt: "—", invoice: "U1", ok: true },
    {
      dimension: "Payment terms",
      contract: "Net 30",
      po: "Net 30",
      goodsReceipt: "—",
      invoice: "Net 30",
      ok: true,
    },
  ],
};

export function InvoiceMatch({ invoice = invoiceBelt }: { invoice?: SapInvoice }) {
  const clean = invoice.match.every((r) => r.ok);
  return (
    <DocShell>
      <DocTitleBand
        number={invoice.number}
        status={invoice.status}
        docType="Invoice verification · four-way match"
        system="SAP MM · MIRO"
        createdOn={invoice.createdOn}
        createdBy={invoice.createdBy}
      />

      {/* Basic data */}
      <SectionBand>Basic data</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Vendor" value={invoice.vendor} mono />
        <Field label="Vendor reference" value={invoice.vendorReference} mono />
        <Field label="Invoice date" value={invoice.invoiceDate} mono />
        <Field label="Gross amount" value={`${invoice.currency} ${invoice.grossAmount}`} mono />
        <Field label="Tax amount" value={`${invoice.currency} ${invoice.taxAmount}`} mono />
        <Field label="Tax code" value={invoice.taxCode} mono />
        <Field label="PO reference" value={invoice.poReference} mono />
        <Field label="Goods receipt" value={invoice.grReference} mono />
        <Field label="Fraud score" value={invoice.fraudScore} mono />
      </div>

      {/* Four-way match grid */}
      <SectionBand>Four-way match — contract · PO · GR · invoice</SectionBand>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-surface-fog/60 text-left text-mute">
              {["", "Contract", "PO", "Goods receipt", "Invoice", ""].map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.match.map((r) => (
              <tr key={r.dimension} className="text-ink">
                <td className="px-3 py-2.5 border-b border-divider text-mute whitespace-nowrap">{r.dimension}</td>
                <td className="px-3 py-2.5 border-b border-divider tabular-nums">{r.contract}</td>
                <td className="px-3 py-2.5 border-b border-divider tabular-nums">{r.po}</td>
                <td className="px-3 py-2.5 border-b border-divider tabular-nums">{r.goodsReceipt}</td>
                <td className="px-3 py-2.5 border-b border-divider tabular-nums font-medium">{r.invoice}</td>
                <td className="px-3 py-2.5 border-b border-divider">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold",
                      r.ok ? "bg-[#107e3e]" : "bg-[#bb0000]",
                    )}
                  >
                    {r.ok ? "✓" : "✕"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Balance / payment */}
      <SectionBand>Balance &amp; payment</SectionBand>
      <div className="px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "w-3 h-3 rounded-full ring-2",
              clean ? "bg-[#107e3e] ring-[#107e3e]/25" : "bg-[#bb0000] ring-[#bb0000]/25",
            )}
          />
          <span className="text-[12.5px] text-ink">
            Balance <span className="font-bold tabular-nums">{invoice.currency} {invoice.balance}</span> —{" "}
            {clean ? "no discrepancies · ready to post" : "discrepancies found · payment held"}
          </span>
        </div>
        <div className="h-5 w-px bg-divider hidden sm:block" />
        <div className="text-[12px] text-mute">
          Baseline <span className="tabular-nums text-ink">{invoice.baselineDate}</span> · terms{" "}
          {invoice.paymentTerms} · due <span className="tabular-nums text-ink">{invoice.dueDate}</span>
        </div>
      </div>
    </DocShell>
  );
}
