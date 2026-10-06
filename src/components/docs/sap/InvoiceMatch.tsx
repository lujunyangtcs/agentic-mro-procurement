/**
 * Faithful SAP MIRO-style logistics invoice verification + the close.
 *
 * 1. Four-way match: contract ↔ PO ↔ goods receipt ↔ invoice agree on price and
 *    quantity (balance 0.00 → green → posts).
 * 2. General-ledger posting (MIRO): clears the GR/IR the goods receipt opened and
 *    books the accounts-payable liability — i.e. how the books change.
 * 3. Payment per the contract terms: Net 30 baseline → due date, then the
 *    scheduled payment run (F110) settles AP against the bank.
 *
 * The Invoice agent's output — clean match, posted to the ledger, scheduled to pay.
 */

import { DocShell, DocTitleBand, SectionBand, Field } from "./parts";
import { cn } from "@/lib/utils";

export type MatchRow = {
  dimension: string;
  contract: string;
  po: string;
  goodsReceipt: string;
  invoice: string;
  ok: boolean;
};

export type PostingLine = {
  line: string;
  glAccount: string;
  text: string;
  drcr: "Dr" | "Cr";
  amount: string;
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
  /** What the contract dictates vs the standing Net 60/90 alternatives. */
  termsSource?: string;
  cashDiscount?: string;
  paymentRunDate?: string;
  taxCode: string;
  grossAmount: string;
  taxAmount: string;
  currency: string;
  balance: string;
  fraudScore: string;
  poReference: string;
  grReference: string;
  match: MatchRow[];
  /** MIRO posting — clears GR/IR, books AP. */
  postingJournal?: PostingLine[];
  /** Scheduled payment run (F110) on the due date — settles AP against bank. */
  paymentJournal?: PostingLine[];
};

/** INV-BPI-5567 — BeltPro's invoice, four-way matched, posted, scheduled to pay. */
export const invoiceBelt: SapInvoice = {
  number: "INV-BPI-5567",
  status: "Posted · scheduled to pay",
  createdOn: "2026-06-09 · 14:20",
  createdBy: "Invoice Resolution Agent",
  vendorReference: "BPI-5567",
  vendor: "100482 · BeltPro Industrial",
  invoiceDate: "2026-06-09",
  postingDate: "2026-06-09",
  baselineDate: "2026-06-09",
  dueDate: "2026-07-09",
  paymentTerms: "NT30 · Net 30 days",
  termsSource: "Per contract 4600001207 (vendor standing NT30) — not Net 60/90",
  cashDiscount: "None · pay full on the net date",
  paymentRunDate: "2026-07-09",
  taxCode: "U1 · Self-assessed use tax",
  grossAmount: "48,200.00",
  taxAmount: "0.00",
  currency: "USD",
  balance: "0.00",
  fraudScore: "0.02 · low",
  poReference: "PO-77310 · item 10",
  grReference: "GR-77310 · 5000031882",
  match: [
    { dimension: "Unit price (USD)", contract: "48,200.00", po: "48,200.00", goodsReceipt: "—", invoice: "48,200.00", ok: true },
    { dimension: "Quantity (EA)", contract: "1", po: "1", goodsReceipt: "1", invoice: "1", ok: true },
    { dimension: "Net value (USD)", contract: "48,200.00", po: "48,200.00", goodsReceipt: "48,200.00", invoice: "48,200.00", ok: true },
    { dimension: "Tax code", contract: "U1", po: "U1", goodsReceipt: "—", invoice: "U1", ok: true },
    { dimension: "Payment terms", contract: "Net 30", po: "Net 30", goodsReceipt: "—", invoice: "Net 30", ok: true },
  ],
  postingJournal: [
    { line: "1", glAccount: "191100", text: "GR/IR clearing — cleared against GR-77310", drcr: "Dr", amount: "48,200.00" },
    { line: "2", glAccount: "160000", text: "Accounts payable — BeltPro (100482)", drcr: "Cr", amount: "48,200.00" },
  ],
  paymentJournal: [
    { line: "1", glAccount: "160000", text: "Accounts payable — BeltPro (100482)", drcr: "Dr", amount: "48,200.00" },
    { line: "2", glAccount: "113100", text: "Bank — outgoing payments", drcr: "Cr", amount: "48,200.00" },
  ],
};

function JournalTable({ lines, currency }: { lines: PostingLine[]; currency: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-[12px] border-collapse">
        <thead>
          <tr className="bg-surface-fog/60 text-left text-mute">
            {["Itm", "G/L account", "Text", "D/C", "Amount"].map((h, i) => (
              <th key={i} className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.line} className="text-ink">
              <td className="px-3 py-2.5 border-b border-divider text-mute tabular-nums">{l.line}</td>
              <td className="px-3 py-2.5 border-b border-divider font-semibold text-surface-deep tabular-nums">{l.glAccount}</td>
              <td className="px-3 py-2.5 border-b border-divider">{l.text}</td>
              <td className={cn("px-3 py-2.5 border-b border-divider font-bold", l.drcr === "Dr" ? "text-surface-deep" : "text-[#107e3e]")}>
                {l.drcr}
              </td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums font-medium">{currency} {l.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InvoiceMatch({ invoice = invoiceBelt }: { invoice?: SapInvoice }) {
  const clean = invoice.match.every((r) => r.ok);
  return (
    <DocShell>
      <DocTitleBand
        number={invoice.number}
        status={invoice.status}
        docType="Invoice verification · match · post · pay"
        system="SAP MM · MIRO → FI"
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
                <th key={i} className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap">
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
                  <span className={cn("inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold", r.ok ? "bg-[#107e3e]" : "bg-[#bb0000]")}>
                    {r.ok ? "✓" : "✕"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Balance */}
      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-divider">
        <span className={cn("w-3 h-3 rounded-full ring-2", clean ? "bg-[#107e3e] ring-[#107e3e]/25" : "bg-[#bb0000] ring-[#bb0000]/25")} />
        <span className="text-[12.5px] text-ink">
          Balance <span className="font-bold tabular-nums">{invoice.currency} {invoice.balance}</span> —{" "}
          {clean ? "no discrepancies · ready to post" : "discrepancies found · payment held"}
        </span>
      </div>

      {invoice.postingJournal || invoice.paymentJournal ? (
        <>
          {/* GL posting — how the books change (shown once the invoice is posted) */}
          {invoice.postingJournal && (
            <>
              <SectionBand>General ledger — invoice posting (MIRO)</SectionBand>
              <JournalTable lines={invoice.postingJournal} currency={invoice.currency} />
              <div className="px-4 py-2 flex items-center gap-2 text-[11.5px] text-ink">
                <span className="w-2.5 h-2.5 rounded-full bg-[#107e3e]" />
                Debits = Credits · the goods receipt's GR/IR clears, the AP liability is booked
              </div>

              {/* Payment terms from the contract */}
              <SectionBand>Payment terms — per contract</SectionBand>
              <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
                <Field label="Terms" value={invoice.paymentTerms} mono />
                <Field label="Baseline date" value={invoice.baselineDate} mono />
                <Field label="Net due date" value={invoice.dueDate} mono />
                <Field label="Cash discount" value={invoice.cashDiscount ?? "—"} />
                <Field label="Source" value={invoice.termsSource ?? "—"} />
                <Field label="Payment run (F110)" value={invoice.paymentRunDate ?? "—"} mono />
              </div>
            </>
          )}

          {/* Scheduled payment — cash out (shown once the payment run is scheduled) */}
          {invoice.paymentJournal && (
            <>
              <SectionBand>Scheduled payment (F110) · {invoice.paymentRunDate}</SectionBand>
              <JournalTable lines={invoice.paymentJournal} currency={invoice.currency} />
            </>
          )}

          {/* Books impact summary — the full settlement, once posted and scheduled */}
          {invoice.postingJournal && invoice.paymentJournal && (
            <div className="px-4 py-3 border-t border-divider text-[11.5px] text-mute leading-relaxed">
              How the books move: the goods receipt booked <span className="text-ink">Dr R&amp;M / Cr GR/IR</span>; this
              invoice clears <span className="text-ink">GR/IR → AP</span>; the payment run settles{" "}
              <span className="text-ink">AP → Bank</span> on the net date. GR/IR nets to zero, AP is created then
              cleared, cash drops {invoice.currency} {invoice.grossAmount} — a balance-sheet settlement, no P&amp;L at payment.
            </div>
          )}
        </>
      ) : (
        <div className="px-4 py-3 border-t border-divider text-[12px] text-mute">
          Baseline <span className="tabular-nums text-ink">{invoice.baselineDate}</span> · terms{" "}
          {invoice.paymentTerms} · due <span className="tabular-nums text-ink">{invoice.dueDate}</span>
        </div>
      )}
    </DocShell>
  );
}
