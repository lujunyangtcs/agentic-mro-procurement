import * as React from "react";
import { cn } from "@/freight/lib/utils";
import { AIDot } from "@/freight/components/ai/AIDot";
import { SpringIn } from "@/freight/components/ai/SpringIn";

export type SettledInvoiceRow = {
  invoice: string;
  shipment: string;
  amount: string;
  lane: string;
  settledOn: string;
  score: number;
};

export type DuplicateRadarProps = {
  current: { invoice: string; shipment: string; amount: string };
  history: SettledInvoiceRow[];
  verdict: "unique" | "duplicate";
};

/**
 * Settled-invoice memory check. A scan-line sweeps the recently-settled list on
 * mount; each row resolves against the current invoice, then a verdict chip closes.
 */
export function DuplicateBillingRadar({ current, history, verdict }: DuplicateRadarProps) {
  const [scanned, setScanned] = React.useState(0); // rows revealed so far
  const total = history.length;
  const dup = verdict === "duplicate";
  const hitIdx = dup ? history.reduce((m, r, i) => (r.score > history[m].score ? i : m), 0) : -1;

  React.useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setScanned(i);
      if (i >= total) window.clearInterval(id);
    }, 360);
    return () => window.clearInterval(id);
  }, [total]);

  const done = scanned >= total;

  return (
    <div className="bg-white border border-divider rounded-md p-4">
      {/* Pinned current invoice */}
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-divider">
        <AIDot tone="deep" pulse={!done} size={7} />
        <span className="text-[11px] font-semibold text-ink">Checking against settled invoices</span>
        <span className="ml-auto flex items-center gap-2 text-[11px]">
          <span className="font-mono text-accent-navy">{current.invoice}</span>
          <span className="text-mute">·</span>
          <span className="font-mono text-mute">{current.shipment}</span>
          <span className="font-semibold text-ink tabular-nums">{current.amount}</span>
        </span>
      </div>

      {/* Scan list */}
      <div className="relative">
        {/* sweeping scan-line */}
        {!done && (
          <div
            className="pointer-events-none absolute inset-x-0 h-[2px] bg-accent-green/70 shadow-[0_0_6px_rgba(39,126,110,0.6)] z-10 transition-[top] duration-300 ease-linear"
            style={{ top: `${(scanned / total) * 100}%` }}
          />
        )}
        <ul className="flex flex-col gap-1">
          {history.map((r, i) => {
            const shown = i < scanned;
            const isHit = i === hitIdx;
            return (
              <li
                key={r.invoice}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-2 py-1.5 text-[11px]",
                  "transition-all duration-300 ease-out",
                  shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
                  isHit && shown ? "bg-surface-rose/60" : "bg-surface-fog",
                )}
              >
                <span className="font-mono text-accent-navy w-[92px] shrink-0">{r.invoice}</span>
                <span className="font-mono text-mute w-[78px] shrink-0">{r.shipment}</span>
                <span className="text-mute w-[64px] shrink-0">{r.lane}</span>
                <span className="text-ink tabular-nums w-[64px] shrink-0">{r.amount}</span>
                <span className="text-mute w-[72px] shrink-0 tabular-nums">{r.settledOn}</span>
                {/* match-score bar */}
                <span className="ml-auto flex items-center gap-1.5 shrink-0">
                  <span className="relative h-1.5 w-16 rounded-full bg-border-divider overflow-hidden">
                    <span
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out",
                        isHit ? "bg-mark-red" : "bg-accent-green/70",
                      )}
                      style={{ width: shown ? `${Math.min(100, r.score)}%` : 0 }}
                    />
                  </span>
                  <span
                    className={cn(
                      "w-8 text-right tabular-nums",
                      isHit ? "text-mark-red font-semibold" : "text-mute",
                    )}
                  >
                    {shown ? `${r.score}%` : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Verdict chip */}
      {done && (
        <SpringIn delay={60} className="mt-3">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold",
              dup
                ? "bg-surface-rose/70 text-mark-red"
                : "bg-surface-mint/50 text-surface-deep",
            )}
          >
            <AIDot tone={dup ? "red" : "green"} size={7} />
            {dup ? (
              <span>
                Possible duplicate — hold ·{" "}
                <span className="font-mono">{history[hitIdx]?.shipment}</span> already settled
              </span>
            ) : (
              <span>
                Unique · no prior settlement on{" "}
                <span className="font-mono">{current.shipment}</span> — safe to pay
              </span>
            )}
          </div>
        </SpringIn>
      )}
    </div>
  );
}
