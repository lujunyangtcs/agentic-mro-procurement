import * as React from "react";
import { cn } from "@/freight/lib/utils";
import { CountUp } from "@/freight/components/ai/CountUp";
import { AIDot } from "@/freight/components/ai/AIDot";

export type TouchlessFunnelProps = {
  total: number;
  touchless: number;
  exceptions: number;
  carriers: number;
  clearedAmount: string;
  atRiskAmount: string;
  touchlessPct: string;
};

/**
 * Touchless settlement batch sweep — a donut of auto-cleared vs exception
 * coverage beside a 3-stage funnel (swept → auto-cleared → exceptions). All
 * mount animations are driven by a single `mounted` flag so the donut arc and
 * funnel bars draw in together.
 */
export function TouchlessFunnel(props: TouchlessFunnelProps) {
  const { total, touchless, exceptions, carriers, clearedAmount, atRiskAmount, touchlessPct } = props;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Donut geometry: r=72 inside a 180×180 box, fills clockwise from 12 o'clock.
  const r = 72;
  const cx = 90;
  const cy = 90;
  const C = 2 * Math.PI * r;
  const greenFrac = total > 0 ? touchless / total : 0;
  const redFrac = total > 0 ? exceptions / total : 0;
  const greenLen = C * greenFrac;
  const redLen = C * redFrac;
  // Empty when unmounted (offset = full circumference), filled to arc on mount.
  const greenOffset = mounted ? C - greenLen : C;

  // Funnel stages — width as a fraction of the track, animated from 0 on mount.
  const stages = [
    { label: "Lines checked", value: total, frac: 1, bar: "bg-surface-deep", to: total },
    { label: "Auto-cleared", value: touchless, frac: greenFrac, bar: "bg-accent-green", to: touchless },
    { label: "Exceptions", value: exceptions, frac: redFrac, bar: "bg-mark-red", to: exceptions, dot: true },
  ];

  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <header className="flex items-center gap-2 mb-4">
        <AIDot size={7} tone="deep" pulse />
        <span className="text-[11px] font-bold tracking-[0.09em] uppercase text-surface-deep">
          Touchless settlement · {carriers === 1 ? "this invoice" : "batch sweep"}
        </span>
        <span className="ml-auto text-[11px] text-mute">
          {carriers === 1 ? "single carrier invoice" : `from ${carriers} carriers`}
        </span>
      </header>

      <div className="flex items-center gap-6">
        {/* LEFT — donut */}
        <div className="relative shrink-0" style={{ width: 168, height: 168 }}>
          <svg viewBox="0 0 180 180" className="w-full h-full" aria-hidden>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--divider)" strokeWidth={18} />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="var(--accent-green)"
              strokeWidth={18}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={greenOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: "stroke-dashoffset 900ms ease-out" }}
            />
            {/* Thin exception arc, seated at the end of the green ring. */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="var(--mark-red)"
              strokeWidth={6}
              strokeDasharray={`${mounted ? redLen : 0} ${C}`}
              strokeDashoffset={-greenLen}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: "stroke-dasharray 700ms ease-out 300ms" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[22px] font-bold text-surface-deep leading-none tabular-nums">
              <CountUp to={touchless} /> <span className="text-mute font-medium">/</span>{" "}
              <CountUp to={total} />
            </div>
            <div className="mt-1 text-[11px] text-mute">{touchlessPct} touchless</div>
          </div>
        </div>

        {/* RIGHT — 3-stage funnel */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {stages.map((s, i) => (
            <div key={s.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-[12px] text-ink">
                  {s.label}
                  {s.dot ? <AIDot size={7} tone="red" pulse /> : null}
                </span>
                <span className="text-[12px] font-bold text-surface-deep tabular-nums">
                  <CountUp to={s.to} />
                </span>
              </div>
              <div className="h-7 w-full rounded bg-surface-fog overflow-hidden">
                <div
                  className={cn("h-full rounded", s.bar)}
                  style={{
                    width: mounted ? `${Math.max(s.frac * 100, s.frac > 0 ? 3 : 0)}%` : "0%",
                    transition: "width 700ms cubic-bezier(0.22,1,0.36,1)",
                    transitionDelay: `${i * 120}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BELOW — stat chips */}
      <div className="mt-4 flex gap-4">
        <div className="flex-1 rounded border border-divider bg-surface-mint/40 px-3 py-2.5">
          <div className="text-[11px] text-mute">cleared to AP</div>
          <div className="text-[16px] font-bold text-surface-deep tabular-nums">{clearedAmount}</div>
        </div>
        <div className="flex-1 rounded border border-divider bg-surface-fog px-3 py-2.5">
          <div className="text-[11px] text-mute">at risk</div>
          <div className="text-[16px] font-bold text-mark-red tabular-nums">{atRiskAmount}</div>
        </div>
      </div>
    </article>
  );
}
