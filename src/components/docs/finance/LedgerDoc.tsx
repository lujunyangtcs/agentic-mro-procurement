/**
 * SAP FI ledger view — the Payment & Collections agent reconciling the General
 * Ledger control account to the AR sub-ledger for one overdue customer, with
 * the aging position. Faithful-but-light SAP FI chrome (FBL5N customer line
 * items + FAGLB03 GL balance). Presentational — takes a `recon`.
 */

import { DocShell, DocTitleBand, SectionBand, Field } from "../sap/parts";
import { cn } from "@/lib/utils";

export type LedgerRecon = {
  number: string;
  status: string;
  createdOn: string;
  createdBy: string;
  customer: string;
  customerCode: string;
  glAccount: string;
  glText: string;
  terms: string;
  /** GL control-account balance and the AR sub-ledger total — they must tie. */
  glBalance: string;
  subledgerBalance: string;
  openItem: {
    invoice: string;
    docDate: string;
    dueDate: string;
    daysOverdue: string;
    amount: string;
    currency: string;
  };
  aging: { bucket: string; amount: string; tone: "ok" | "warn" | "risk" }[];
};

export const ledgerBlueRidge: LedgerRecon = {
  number: "AR-RECON-90357",
  status: "Open · past due",
  createdOn: "2026-06-04 · 08:10",
  createdBy: "Payment & Collections Agent",
  customer: "BlueRidge Foods Co.",
  customerCode: "0000610248",
  glAccount: "120000",
  glText: "Trade receivables — domestic",
  terms: "ZB45 · Net 45 (contract CTR-BRF-2024)",
  glBalance: "412,880.00",
  subledgerBalance: "412,880.00",
  openItem: {
    invoice: "INV-90357",
    docDate: "2026-04-03",
    dueDate: "2026-05-18",
    daysOverdue: "47 days",
    amount: "208,400.00",
    currency: "USD",
  },
  aging: [
    { bucket: "Current", amount: "96,000.00", tone: "ok" },
    { bucket: "1–30 days", amount: "108,480.00", tone: "warn" },
    { bucket: "31–60 days · overdue", amount: "208,400.00", tone: "risk" },
    { bucket: "60+ days", amount: "0.00", tone: "ok" },
  ],
};

const agingTone: Record<LedgerRecon["aging"][number]["tone"], string> = {
  ok: "text-ink",
  warn: "text-[#a25b00]",
  risk: "text-mark-red font-semibold",
};

export function LedgerDoc({ recon = ledgerBlueRidge }: { recon?: LedgerRecon }) {
  const tie = recon.glBalance === recon.subledgerBalance;
  return (
    <DocShell>
      <DocTitleBand
        number={recon.number}
        status={recon.status}
        docType="AR reconciliation · GL ↔ sub-ledger"
        system="SAP FI · FBL5N / FAGLB03"
        createdOn={recon.createdOn}
        createdBy={recon.createdBy}
      />

      <SectionBand>Customer & control account</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Customer" value={recon.customer} />
        <Field label="Customer code" value={recon.customerCode} mono />
        <Field label="Payment terms" value={recon.terms} />
        <Field label="GL account" value={`${recon.glAccount} · ${recon.glText}`} mono />
        <Field label="GL balance (control)" value={`USD ${recon.glBalance}`} mono />
        <Field label="AR sub-ledger total" value={`USD ${recon.subledgerBalance}`} mono />
      </div>

      <SectionBand>Overdue open item</SectionBand>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-surface-fog/60 text-left text-mute">
              {["Invoice", "Doc date", "Due date", "Past due", "Amount", ""].map((h, i) => (
                <th key={i} className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-ink">
              <td className="px-3 py-2.5 border-b border-divider font-semibold text-surface-deep tabular-nums">{recon.openItem.invoice}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums">{recon.openItem.docDate}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums">{recon.openItem.dueDate}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums text-mark-red font-bold">{recon.openItem.daysOverdue}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums font-medium">{recon.openItem.currency} {recon.openItem.amount}</td>
              <td className="px-3 py-2.5 border-b border-divider">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#bb0000] text-white text-[9px] font-bold">!</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <SectionBand>Aging — {recon.customer}</SectionBand>
      <div className="px-4 py-3 grid grid-cols-4 gap-3">
        {recon.aging.map((a) => (
          <div key={a.bucket} className="rounded-md bg-surface-fog/60 px-3 py-2.5">
            <div className="text-[10px] tracking-[0.04em] uppercase text-mute font-medium">{a.bucket}</div>
            <div className={cn("text-[14px] tabular-nums mt-1", agingTone[a.tone])}>USD {a.amount}</div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 flex items-center gap-2.5 border-t border-divider">
        <span className={cn("w-3 h-3 rounded-full ring-2", tie ? "bg-[#107e3e] ring-[#107e3e]/25" : "bg-[#bb0000] ring-[#bb0000]/25")} />
        <span className="text-[12.5px] text-ink">
          {tie ? "GL control ties to the AR sub-ledger" : "GL and sub-ledger out of balance"} —{" "}
          <span className="font-bold tabular-nums">USD {recon.openItem.amount}</span> open on {recon.openItem.invoice}, {recon.openItem.daysOverdue} past the Net-45 due date.
        </span>
      </div>
    </DocShell>
  );
}
