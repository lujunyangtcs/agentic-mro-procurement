/**
 * SAP FI posting document — the journal the Payment & Collections agent posts
 * when an overdue receivable clears: the cash receipt debits the bank account
 * and credits the trade-receivables control account, and the AR sub-ledger open
 * item is cleared against the incoming payment. Faithful-but-light SAP FI
 * chrome (FB03 document display). Presentational — takes a `journal`.
 */

import { DocShell, DocTitleBand, SectionBand } from "../sap/parts";
import { cn } from "@/lib/utils";

export type JournalLine = {
  line: string;
  glAccount: string;
  text: string;
  drcr: "Dr" | "Cr";
  amount: string;
};

export type Journal = {
  number: string;
  status: string;
  createdOn: string;
  createdBy: string;
  docType: string;
  postingDate: string;
  reference: string;
  currency: string;
  lines: JournalLine[];
  subledger: { customer: string; invoice: string; before: string; after: string };
};

export const journalBlueRidge: Journal = {
  number: "5100049217",
  status: "Posted · cleared",
  createdOn: "2026-06-09 · 11:20",
  createdBy: "Payment & Collections Agent",
  docType: "DZ · Customer payment",
  postingDate: "2026-06-09",
  reference: "INV-90357 · BlueRidge Foods Co.",
  currency: "USD",
  lines: [
    { line: "1", glAccount: "110000", text: "Bank — incoming (Wells Fargo)", drcr: "Dr", amount: "208,400.00" },
    { line: "2", glAccount: "120000", text: "Trade receivables — domestic", drcr: "Cr", amount: "208,400.00" },
  ],
  subledger: { customer: "BlueRidge Foods Co. · 0000610248", invoice: "INV-90357", before: "208,400.00 open", after: "0.00 · cleared" },
};

export function JournalDoc({ journal = journalBlueRidge }: { journal?: Journal }) {
  return (
    <DocShell>
      <DocTitleBand
        number={journal.number}
        status={journal.status}
        docType={`FI posting · ${journal.docType}`}
        system="SAP FI · FB03"
        createdOn={journal.createdOn}
        createdBy={journal.createdBy}
      />

      <SectionBand>Document header</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-2 text-[12.5px]">
        <div><span className="text-mute text-[11px] block">Posting date</span><span className="tabular-nums">{journal.postingDate}</span></div>
        <div><span className="text-mute text-[11px] block">Reference</span><span className="tabular-nums">{journal.reference}</span></div>
        <div><span className="text-mute text-[11px] block">Currency</span>{journal.currency}</div>
      </div>

      <SectionBand>Journal entry</SectionBand>
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
            {journal.lines.map((l) => (
              <tr key={l.line} className="text-ink">
                <td className="px-3 py-2.5 border-b border-divider text-mute tabular-nums">{l.line}</td>
                <td className="px-3 py-2.5 border-b border-divider font-semibold text-surface-deep tabular-nums">{l.glAccount}</td>
                <td className="px-3 py-2.5 border-b border-divider">{l.text}</td>
                <td className={cn("px-3 py-2.5 border-b border-divider font-bold", l.drcr === "Dr" ? "text-surface-deep" : "text-[#107e3e]")}>{l.drcr}</td>
                <td className="px-3 py-2.5 border-b border-divider tabular-nums font-medium">{journal.currency} {l.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionBand>AR sub-ledger clearing</SectionBand>
      <div className="px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px]">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-[#107e3e] ring-2 ring-[#107e3e]/25" />
          <span className="text-ink">
            {journal.subledger.customer} · {journal.subledger.invoice} —{" "}
            <span className="text-mute line-through">{journal.subledger.before}</span>{" "}
            → <span className="font-bold text-[#107e3e]">{journal.subledger.after}</span>
          </span>
        </div>
        <span className="text-[12px] text-mute">Debits = Credits · balanced · GL and sub-ledger updated</span>
      </div>
    </DocShell>
  );
}
