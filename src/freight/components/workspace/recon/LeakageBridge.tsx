import * as React from "react";
import { cn } from "@/freight/lib/utils";
import { CountUp } from "@/freight/components/ai/CountUp";
import { SpringIn } from "@/freight/components/ai/SpringIn";

export type LeakageBridgeProps = {
  invoiced: number;
  deductions: { label: string; amount: number; id: string }[];
  clears: number;
  recoveredLabel: string;
  pctNote?: string;
  onPickEvidence?: (id: string) => void;
};

const usd = (n: number) => "$" + n.toLocaleString("en-US");

/**
 * Revenue-leakage waterfall: Invoiced → red step-down deltas → Clears to AP,
 * with a bracket gathering the deltas into the recovered total. Reveals on mount.
 */
export function LeakageBridge({
  invoiced,
  deductions,
  clears,
  recoveredLabel,
  pctNote = "≈3.5% of this invoice was leakage — network band 3–6%",
  onPickEvidence,
}: LeakageBridgeProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  const PLOT = 150; // px of plottable height for the full bar
  const h = (v: number) => Math.max(2, (v / invoiced) * PLOT);
  // Running top of each floating delta bar (descends from the invoiced top).
  let cursor = invoiced;
  const steps = deductions.map((d) => {
    const top = cursor;
    cursor -= d.amount;
    return { ...d, topVal: top, bottomVal: cursor };
  });

  return (
    <div className="bg-white border border-divider rounded-md p-4">
      <div className="flex items-end gap-3" style={{ height: PLOT + 18 }}>
        {/* Invoiced bar */}
        <Column label="Invoiced" value={invoiced} mounted={mounted}>
          <div
            className="w-12 rounded-t-sm bg-accent-navy transition-[height] duration-700 ease-out"
            style={{ height: mounted ? h(invoiced) : 0 }}
          />
        </Column>

        {/* Red step-down deltas */}
        {steps.map((s, i) => (
          <div key={s.id} className="flex flex-col items-center justify-end" style={{ height: PLOT }}>
            <button
              type="button"
              onClick={() => onPickEvidence?.(s.id)}
              title={`See evidence — ${s.label}`}
              className={cn(
                "group relative w-11 rounded-sm bg-mark-red/85 hover:bg-mark-red",
                "transition-all duration-500 ease-out cursor-pointer focus:outline-none",
                "focus-visible:ring-2 focus-visible:ring-mark-red/50",
              )}
              style={{
                height: mounted ? h(s.amount) : 0,
                marginBottom: mounted ? (s.bottomVal / invoiced) * PLOT : 0,
                opacity: mounted ? 1 : 0,
                transitionDelay: `${500 + i * 260}ms`,
              }}
            >
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-mark-red">
                −<CountUp to={s.amount} prefix="$" delay={620 + i * 260} duration={520} />
              </span>
            </button>
            <span className="mt-1 w-14 text-center text-[9px] leading-tight text-mute">{s.label}</span>
          </div>
        ))}

        {/* Clears bar */}
        <Column label="Clears to AP" value={clears} mounted={mounted} accent>
          <div
            className="w-12 rounded-t-sm bg-surface-deep transition-[height] duration-700 ease-out"
            style={{ height: mounted ? h(clears) : 0, transitionDelay: "1280ms" }}
          />
        </Column>

        {/* Recovered bracket */}
        <SpringIn delay={1500} className="ml-1 self-stretch flex items-center">
          <div className="flex items-stretch">
            <div className="w-2 rounded-l-sm border-y border-l border-mark-red/50" />
            <div className="pl-2 flex flex-col justify-center">
              <div className="text-sm font-semibold text-mark-red whitespace-nowrap">
                {recoveredLabel}
              </div>
              <div className="text-[10px] text-mute whitespace-nowrap">caught before payment</div>
            </div>
          </div>
        </SpringIn>
      </div>

      <p className="mt-3 pt-2 border-t border-divider text-[10px] text-mute">{pctNote}</p>
    </div>
  );
}

function Column({
  label,
  value,
  mounted,
  accent,
  children,
}: {
  label: string;
  value: number;
  mounted: boolean;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-end" style={{ height: 150 }}>
      <span
        className={cn(
          "mb-1 text-[11px] font-semibold tabular-nums",
          accent ? "text-surface-deep" : "text-accent-navy",
        )}
      >
        {mounted ? usd(value) : "$0"}
      </span>
      {children}
      <span className="mt-1 w-14 text-center text-[9px] leading-tight text-ink">{label}</span>
    </div>
  );
}
