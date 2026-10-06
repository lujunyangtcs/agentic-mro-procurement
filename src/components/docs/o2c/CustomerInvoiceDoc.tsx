/**
 * SAP SD billing document / FI customer invoice — the Billing agent invoices the
 * delivered sales order, which posts the receivable to the AR control account.
 * This is the document that later runs past its Net-45 due date and becomes the
 * overdue item the Payment & Collections agent works. Faithful-but-light SAP
 * chrome (VF03 billing → FI accounting view). Presentational — takes an `invoice`.
 */

import { DocShell, DocTitleBand, SectionBand, Field } from "../sap/parts";
import { cn } from "@/lib/utils";

export type CustomerInvoiceLine = {
  line: string;
  glAccount: string;
  text: string;
  drcr: "Dr" | "Cr";
  amount: string;
};

export type CustomerInvoice = {
  number: string;
  billingDoc: string;
  status: string;
  createdOn: string;
  createdBy: string;
  billTo: string;
  billToCode: string;
  deliveryRef: string;
  soRef: string;
  billingDate: string;
  dueDate: string;
  daysOverdue: string;
  terms: string;
  currency: string;
  netValue: string;
  taxValue: string;
  grossValue: string;
  arAccount: string;
  arText: string;
  accounting: CustomerInvoiceLine[];
};

export const invoiceBlueRidge: CustomerInvoice = {
  number: "INV-90357",
  billingDoc: "0090000357",
  status: "Posted to FI · open · 47 days past due",
  createdOn: "2026-04-03 · 06:30",
  createdBy: "Billing Agent",
  billTo: "BlueRidge Foods Co.",
  billToCode: "0000610248",
  deliveryRef: "80004471",
  soRef: "SO-58841 · item 10",
  billingDate: "2026-04-03",
  dueDate: "2026-05-18",
  daysOverdue: "47 days",
  terms: "ZB45 · Net 45 (contract CTR-BRF-2024)",
  currency: "USD",
  netValue: "208,400.00",
  taxValue: "0.00",
  grossValue: "208,400.00",
  arAccount: "120000",
  arText: "Trade receivables — domestic",
  accounting: [
    { line: "1", glAccount: "120000", text: "Trade receivables — BlueRidge Foods Co.", drcr: "Dr", amount: "208,400.00" },
    { line: "2", glAccount: "400000", text: "Revenue — containerboard, domestic", drcr: "Cr", amount: "208,400.00" },
  ],
};

export function CustomerInvoiceDoc({ invoice = invoiceBlueRidge }: { invoice?: CustomerInvoice }) {
  return (
    <DocShell>
      <DocTitleBand
        number={invoice.number}
        status={invoice.status}
        docType="F2 · Customer invoice (billing)"
        system="SAP SD · VF03 → FI"
        createdOn={invoice.createdOn}
        createdBy={invoice.createdBy}
      />

      <SectionBand>Bill-to & reference</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Bill-to party" value={invoice.billTo} />
        <Field label="Customer code" value={invoice.billToCode} mono />
        <Field label="Billing document" value={invoice.billingDoc} mono />
        <Field label="Sales order ref." value={invoice.soRef} mono />
        <Field label="Delivery ref." value={invoice.deliveryRef} mono />
        <Field label="Payment terms" value={invoice.terms} />
      </div>

      <SectionBand>Amounts</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Billing date" value={invoice.billingDate} mono />
        <Field label="Due date" value={invoice.dueDate} mono />
        <Field label="Net value" value={`${invoice.currency} ${invoice.netValue}`} mono />
        <Field label="Tax (B2B exempt)" value={`${invoice.currency} ${invoice.taxValue}`} mono />
        <Field label="Gross value" value={`${invoice.currency} ${invoice.grossValue}`} mono />
        <Field label="AR account" value={`${invoice.arAccount} · ${invoice.arText}`} mono />
      </div>

      <SectionBand>FI accounting view</SectionBand>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-surface-fog/60 text-left text-mute">
              {["Itm", "G/L account", "Text", "D/C", "Amount"].map((h, i) => (
                <th key={i} className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.accounting.map((l) => (
              <tr key={l.line} className="text-ink">
                <td className="px-3 py-2.5 border-b border-divider text-mute tabular-nums">{l.line}</td>
                <td className="px-3 py-2.5 border-b border-divider font-semibold text-surface-deep tabular-nums">{l.glAccount}</td>
                <td className="px-3 py-2.5 border-b border-divider">{l.text}</td>
                <td className={cn("px-3 py-2.5 border-b border-divider font-bold", l.drcr === "Dr" ? "text-surface-deep" : "text-[#107e3e]")}>{l.drcr}</td>
                <td className="px-3 py-2.5 border-b border-divider tabular-nums font-medium">{invoice.currency} {l.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 flex items-center gap-2.5 border-t border-divider">
        <span className="w-3 h-3 rounded-full bg-[#bb0000] ring-2 ring-[#bb0000]/25" />
        <span className="text-[12.5px] text-ink">
          Receivable open on the AR sub-ledger —{" "}
          <span className="font-bold tabular-nums">{invoice.currency} {invoice.grossValue}</span> due {invoice.dueDate},{" "}
          <span className="text-mark-red font-semibold">{invoice.daysOverdue} past due</span>.
        </span>
      </div>
    </DocShell>
  );
}
