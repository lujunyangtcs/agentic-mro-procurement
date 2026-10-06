/**
 * SAP FI cash-receipt posting — animated. The Payment & Collections agent applies
 * the incoming payment against the overdue receivable: it auto-fills the GL
 * journal (debit Bank, credit Trade receivables) pulled from the invoice, then
 * clears the open item on the AR sub-ledger and updates the control balance.
 *
 * The sheet renders "empty" (accounts and texts pre-filled, amount cells blank)
 * and the agent fills it field by field with a brief highlight — the same motion
 * vocabulary as the extraction wizard — so the debit/credit posting is visible,
 * not instant. Presentational; plays its fill on mount.
 */

import * as React from "react";
import { DocShell, DocTitleBand, SectionBand } from "../sap/parts";
import { cn } from "@/lib/utils";

export type PostingLine = {
  line: string;
  glAccount: string;
  text: string;
  drcr: "Dr" | "Cr";
  amount: string;
};

export type SubledgerItem = {
  invoice: string;
  docDate: string;
  dueDate: string;
  amount: string;
  /** The overdue item being cleared by this posting — others stay open. */
  clears: boolean;
};

export type BalanceSheetLine = {
  line: string;
  before: string;
  after: string;
  delta: string;
  dir: "up" | "down" | "flat";
  total?: boolean;
};

export type PaymentPosting = {
  number: string;
  status: string;
  createdOn: string;
  createdBy: string;
  docType: string;
  postingDate: string;
  reference: string;
  pulledFrom: string;
  currency: string;
  customer: string;
  customerCode: string;
  lines: PostingLine[];
  subledger: SubledgerItem[];
  /** The balance-sheet movement the posting produces (asset reclassification). */
  balanceSheet: BalanceSheetLine[];
  balanceBefore: string;
  balanceAfter: string;
};

export const postingBlueRidge: PaymentPosting = {
  number: "5100049217",
  status: "Posted · cleared",
  createdOn: "2026-06-09 · 11:20",
  createdBy: "Payment & Collections Agent",
  docType: "DZ · Customer payment",
  postingDate: "2026-06-09",
  reference: "INV-90357 · BlueRidge Foods Co.",
  pulledFrom: "INV-90357 · AR-RECON-90357",
  currency: "USD",
  customer: "BlueRidge Foods Co.",
  customerCode: "0000610248",
  lines: [
    { line: "1", glAccount: "110000", text: "Bank — incoming (Wells Fargo)", drcr: "Dr", amount: "208,400.00" },
    { line: "2", glAccount: "120000", text: "Trade receivables — domestic", drcr: "Cr", amount: "208,400.00" },
  ],
  subledger: [
    { invoice: "INV-90357", docDate: "2026-04-03", dueDate: "2026-05-18", amount: "208,400.00", clears: true },
    { invoice: "INV-90478", docDate: "2026-05-12", dueDate: "2026-06-26", amount: "108,480.00", clears: false },
    { invoice: "INV-90502", docDate: "2026-05-29", dueDate: "2026-07-13", amount: "96,000.00", clears: false },
  ],
  balanceSheet: [
    { line: "Cash & cash equivalents · 110000", before: "3,180,000.00", after: "3,388,400.00", delta: "+208,400.00", dir: "up" },
    { line: "Trade receivables · 120000", before: "412,880.00", after: "204,480.00", delta: "−208,400.00", dir: "down" },
    { line: "Inventory · 140000", before: "5,149,270.00", after: "5,149,270.00", delta: "0.00", dir: "flat" },
    { line: "Total current assets", before: "8,742,150.00", after: "8,742,150.00", delta: "0.00", dir: "flat", total: true },
  ],
  balanceBefore: "412,880.00",
  balanceAfter: "204,480.00",
};

const FILL_DELAY = 650; // blank for ~0.65s, then start filling
const LINE_STAGGER = 720; // gap between each Dr/Cr posting

function AmountCell({
  filled,
  hot,
  value,
}: {
  filled: boolean;
  hot: boolean;
  value: React.ReactNode;
}) {
  return (
    <td className="px-3 py-2.5 border-b border-divider">
      {filled ? (
        <span
          className={cn(
            "inline-block rounded px-1.5 py-0.5 tabular-nums font-medium transition-all duration-300",
            hot && "bg-surface-mint/60 ring-1 ring-surface-deep/30",
          )}
        >
          {value}
        </span>
      ) : (
        <span className="inline-block w-24 h-5 rounded bg-[#f4f6f9] border border-dashed border-[#d4dae1] align-middle" />
      )}
    </td>
  );
}

export function PaymentPostingDoc({ posting = postingBlueRidge }: { posting?: PaymentPosting }) {
  const [filled, setFilled] = React.useState<boolean[]>(() => posting.lines.map(() => false));
  const [hot, setHot] = React.useState(-1);
  const [cleared, setCleared] = React.useState(false);
  const [posted, setPosted] = React.useState(false);

  React.useEffect(() => {
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        posting.lines.forEach((_, i) => {
          timers.push(
            window.setTimeout(() => {
              setFilled((prev) => prev.map((v, j) => (j === i ? true : v)));
              setHot(i);
              timers.push(window.setTimeout(() => setHot((h) => (h === i ? -1 : h)), 520));
            }, i * LINE_STAGGER),
          );
        });
        const total = posting.lines.length * LINE_STAGGER;
        timers.push(window.setTimeout(() => setCleared(true), total + 350));
        timers.push(window.setTimeout(() => setPosted(true), total + 850));
      }, FILL_DELAY),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [posting]);

  const allFilled = filled.every(Boolean);

  return (
    <DocShell>
      <DocTitleBand
        number={posting.number}
        status={posted ? posting.status : "Posting…"}
        docType={`FI posting · ${posting.docType}`}
        system="SAP FI · FB01 / FBL5N"
        createdOn={posting.createdOn}
        createdBy={posting.createdBy}
      />

      <SectionBand>Document header</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-2 text-[12.5px]">
        <div><span className="text-mute text-[11px] block">Posting date</span><span className="tabular-nums">{posting.postingDate}</span></div>
        <div><span className="text-mute text-[11px] block">Reference</span><span className="tabular-nums">{posting.reference}</span></div>
        <div><span className="text-mute text-[11px] block">Pulled from</span><span className="tabular-nums">{posting.pulledFrom}</span></div>
      </div>

      <SectionBand>General ledger — journal entry</SectionBand>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-surface-fog/60 text-left text-mute">
              {["Itm", "G/L account", "Text", "D/C", "Amount"].map((h, i) => (
                <th key={i} className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posting.lines.map((l, i) => (
              <tr key={l.line} className="text-ink">
                <td className="px-3 py-2.5 border-b border-divider text-mute tabular-nums">{l.line}</td>
                <td className="px-3 py-2.5 border-b border-divider font-semibold text-surface-deep tabular-nums">{l.glAccount}</td>
                <td className="px-3 py-2.5 border-b border-divider">{l.text}</td>
                <td className={cn("px-3 py-2.5 border-b border-divider font-bold", l.drcr === "Dr" ? "text-surface-deep" : "text-[#107e3e]")}>{l.drcr}</td>
                <AmountCell filled={filled[i]} hot={hot === i} value={`${posting.currency} ${l.amount}`} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 flex items-center gap-2 text-[11.5px]">
        {allFilled ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full bg-[#107e3e]" />
            <span className="text-ink">Debits = Credits · balanced</span>
          </>
        ) : (
          <span className="text-mute">Auto-posting the debit and credit from the invoice…</span>
        )}
      </div>

      <SectionBand>AR sub-ledger — {posting.customer} · {posting.customerCode}</SectionBand>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-surface-fog/60 text-left text-mute">
              {["Open item", "Doc date", "Due date", "Amount", "Status"].map((h, i) => (
                <th key={i} className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posting.subledger.map((s) => {
              const isCleared = s.clears && cleared;
              return (
                <tr key={s.invoice} className={cn("text-ink", s.clears && "bg-surface-mint/20")}>
                  <td className="px-3 py-2.5 border-b border-divider font-semibold text-surface-deep tabular-nums">{s.invoice}</td>
                  <td className="px-3 py-2.5 border-b border-divider tabular-nums">{s.docDate}</td>
                  <td className="px-3 py-2.5 border-b border-divider tabular-nums">{s.dueDate}</td>
                  <td className="px-3 py-2.5 border-b border-divider tabular-nums font-medium">{posting.currency} {s.amount}</td>
                  <td className="px-3 py-2.5 border-b border-divider">
                    {s.clears ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium transition-all duration-300",
                          isCleared ? "bg-[#107e3e]/12 text-[#107e3e] ring-1 ring-[#107e3e]/25" : "bg-surface-rose text-mark-red",
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", isCleared ? "bg-[#107e3e]" : "bg-mark-red")} />
                        {isCleared ? "Cleared" : "Open · past due"}
                      </span>
                    ) : (
                      <span className="text-[11px] text-mute">Open · not due</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SectionBand>Balance-sheet impact · current assets</SectionBand>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-surface-fog/60 text-left text-mute">
              {["Balance-sheet line", "Before", "After", "Change"].map((h, i) => (
                <th key={i} className={cn("px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap", i > 0 && "text-right")}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posting.balanceSheet.map((b) => (
              <tr key={b.line} className={cn("text-ink", b.total && "bg-surface-fog/40")}>
                <td className={cn("px-3 py-2.5 border-b border-divider", b.total ? "font-bold text-ink" : "text-ink")}>{b.line}</td>
                <td className="px-3 py-2.5 border-b border-divider text-right tabular-nums text-mute">{posting.currency} {b.before}</td>
                <td className="px-3 py-2.5 border-b border-divider text-right">
                  {cleared ? (
                    <span className={cn("inline-block rounded px-1.5 py-0.5 tabular-nums font-medium transition-all duration-300", b.total ? "text-ink" : "text-ink")}>
                      {posting.currency} {b.after}
                    </span>
                  ) : (
                    <span className="inline-block w-24 h-5 rounded bg-[#f4f6f9] border border-dashed border-[#d4dae1] align-middle" />
                  )}
                </td>
                <td className="px-3 py-2.5 border-b border-divider text-right tabular-nums">
                  {cleared ? (
                    <span className={cn("font-medium", b.dir === "up" ? "text-[#107e3e]" : b.dir === "down" ? "text-mark-red" : "text-mute")}>{b.delta}</span>
                  ) : (
                    <span className="inline-block w-20 h-5 rounded bg-[#f4f6f9] border border-dashed border-[#d4dae1] align-middle" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-[11px] text-mute">
        Asset reclassification — the receivable converts to cash; total assets unchanged, no P&amp;L impact.
      </div>

      <div className="px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-divider text-[12.5px]">
        <div className="flex items-center gap-2.5">
          <span className={cn("w-3 h-3 rounded-full ring-2", posted ? "bg-[#107e3e] ring-[#107e3e]/25" : "bg-[#a25b00] ring-[#a25b00]/25")} />
          <span className="text-ink">
            Control balance{" "}
            <span className={cn("tabular-nums", cleared && "text-mute line-through")}>USD {posting.balanceBefore}</span>
            {cleared && (
              <>
                {" "}→ <span className="font-bold text-[#107e3e] tabular-nums">USD {posting.balanceAfter}</span>
              </>
            )}
          </span>
        </div>
        {posted && (
          <span className="text-[12px] text-mute">GL and AR sub-ledger updated · INV-90357 cleared · credit hold lifted</span>
        )}
      </div>
    </DocShell>
  );
}
