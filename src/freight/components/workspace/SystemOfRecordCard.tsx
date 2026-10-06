import * as React from "react";
import { CountUp } from "@/freight/components/ai/CountUp";
import { SpringIn } from "@/freight/components/ai/SpringIn";
import { AIDot } from "@/freight/components/ai/AIDot";
import { Database, FileCheck2, Ticket, Check } from "lucide-react";
import { cn } from "@/freight/lib/utils";

export type SystemOfRecordCardProps = {
  apDoc: string;
  postedCount: number;
  postedAmount: string;
  tickets: { id: string; team: string; type: string }[];
};

/**
 * Close beat for the settlement flow — the run WRITING to the system of record.
 * Cleared lines POST to SAP AP (an AP document number stamps in), and each
 * exception WRITES a tracked ticket id into the record, staggered with a check.
 */
export function SystemOfRecordCard({
  apDoc,
  postedCount,
  postedAmount,
  tickets,
}: SystemOfRecordCardProps): React.ReactElement {
  return (
    <article className="bg-white border border-divider rounded-md p-5 overflow-hidden">
      <style>{`
        @keyframes sor-stamp { 0% { opacity: 0; transform: scale(0.7) rotate(-4deg); } 70% { opacity: 1; transform: scale(1.08) rotate(0deg); } 100% { transform: scale(1) rotate(0deg); } }
        @keyframes sor-write { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes sor-tick { 0% { opacity: 0; transform: scale(0); } 60% { opacity: 1; transform: scale(1.2); } 100% { transform: scale(1); } }
      `}</style>

      <header className="flex items-center gap-2 mb-4">
        <AIDot size={6} tone="deep" pulse />
        <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
          System of record · updated
        </span>
        <Database size={13} strokeWidth={2.2} className="ml-auto text-mute" />
      </header>

      {/* AP posting — cleared lines POST to SAP AP, document number stamps in */}
      <SpringIn delay={120}>
        <div className="rounded-lg bg-surface-deep text-ink-inverse px-4 py-4 flex items-center gap-3.5">
          <span className="w-10 h-10 rounded-full bg-ink-inverse/15 flex items-center justify-center shrink-0">
            <FileCheck2 size={20} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.06em] text-ink-inverse/70">
              Posted to SAP AP
            </div>
            <div
              className="text-[15px] font-semibold leading-tight tabular-nums"
              style={{ animation: "sor-stamp 640ms 420ms cubic-bezier(.34,1.56,.64,1) both" }}
            >
              {apDoc}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4 shrink-0 text-right">
            <div>
              <div className="text-[18px] font-bold leading-none tabular-nums">
                <CountUp to={postedCount} duration={1000} delay={300} />
              </div>
              <div className="text-[10px] text-ink-inverse/65 uppercase tracking-[0.05em] mt-1">
                lines posted
              </div>
            </div>
            <div className="w-px h-8 bg-ink-inverse/20" />
            <div>
              <div className="text-[18px] font-bold leading-none tabular-nums">{postedAmount}</div>
              <div className="text-[10px] text-ink-inverse/65 uppercase tracking-[0.05em] mt-1">
                cleared
              </div>
            </div>
          </div>
        </div>
      </SpringIn>

      {/* Exception tickets — each WRITES a tracked ticket id into the record */}
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-[0.06em] text-mute mb-2 flex items-center gap-1.5">
          <Ticket size={12} strokeWidth={2.2} className="text-mark-red" />
          Exception tickets written to record
        </div>
        <div className="space-y-1.5">
          {tickets.map((t, i) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-md bg-surface-fog/70 border border-divider px-3 py-2.5"
              style={{ animation: `sor-write 420ms ${720 + i * 150}ms cubic-bezier(.22,1,.36,1) both` }}
            >
              <span className="text-[12px] font-mono font-semibold text-surface-deep tabular-nums shrink-0 w-[112px]">
                {t.id}
              </span>
              <span className="text-[13px] font-medium text-ink truncate">{t.team}</span>
              <span className="text-[11px] text-mute truncate ml-auto mr-1">{t.type}</span>
              <span
                className="w-6 h-6 rounded-full bg-surface-mint flex items-center justify-center shrink-0"
                style={{ animation: `sor-tick 460ms ${900 + i * 150}ms cubic-bezier(.34,1.56,.64,1) both` }}
              >
                <Check size={14} strokeWidth={3} className="text-surface-deep" />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer tally */}
      <SpringIn delay={900 + tickets.length * 150 + 220} className="mt-4">
        <div className="flex items-center gap-2.5 rounded-md bg-surface-sage/40 px-3 py-2.5">
          <span className="w-7 h-7 rounded-full bg-surface-deep text-ink-inverse flex items-center justify-center shrink-0">
            <Database size={14} strokeWidth={2.4} />
          </span>
          <span className="text-[12px] font-semibold text-surface-deep">
            {tickets.length + 1} records updated
          </span>
          <span className="text-mute" aria-hidden>
            ·
          </span>
          <span className="text-[12px] text-ink">1 AP posting</span>
          <span className="text-mute" aria-hidden>
            ·
          </span>
          <span className={cn("text-[12px]", tickets.length ? "text-mark-red" : "text-ink")}>
            {tickets.length} exception tickets
          </span>
        </div>
      </SpringIn>
    </article>
  );
}

/** Demo fixture — freight settlement close beat. */
export const systemOfRecordCardDemo: SystemOfRecordCardProps = {
  apDoc: "AP 5105004471",
  postedCount: 16,
  postedAmount: "$30.7K",
  tickets: [
    { id: "EXC-2206-01", team: "Procurement", type: "missing PO" },
    { id: "EXC-2206-02", team: "Finance master-data", type: "wrong company code" },
    { id: "EXC-2206-03", team: "Buyer-AP", type: "insufficient PO value" },
    { id: "EXC-2206-04", team: "Freight desk", type: "rate mismatch" },
  ],
};
