import * as React from "react";
import { cn } from "@/freight/lib/utils";
import { SpringIn } from "@/freight/components/ai/SpringIn";
import { AIDot } from "@/freight/components/ai/AIDot";

export type DetentionClockProps = {
  gateIn: string;
  gateOut: string;
  onSiteH: number;
  freeH: number;
  billed: string;
  log: string;
};

/**
 * Demurrage proof: a time band with a green free-time window and the actual
 * on-site span ending INSIDE it — so detention is zero and the billed charge is
 * struck through. Reveals in sequence on mount.
 */
export function DetentionClock({
  gateIn,
  gateOut,
  onSiteH,
  freeH,
  billed,
  log,
}: DetentionClockProps) {
  const [phase, setPhase] = React.useState(0);
  React.useEffect(() => {
    const t1 = window.setTimeout(() => setPhase(1), 140);
    const t2 = window.setTimeout(() => setPhase(2), 640);
    const t3 = window.setTimeout(() => setPhase(3), 1320);
    const t4 = window.setTimeout(() => setPhase(4), 1620);
    return () => [t1, t2, t3, t4].forEach(window.clearTimeout);
  }, []);

  // Track: x 60 → 600 maps 0 → span hours. Pad the axis past free-time.
  const X0 = 60;
  const FULL = 540;
  const span = Math.max(freeH, onSiteH) + 0.75;
  const px = (h: number) => X0 + (h / span) * FULL;
  const detention = Math.max(0, +(onSiteH - freeH).toFixed(1));

  // free-time ends label = gateIn + freeH, derived from the clock string.
  const endLabel = React.useMemo(() => {
    const m = /(\d{1,2}):(\d{2})/.exec(gateIn);
    if (!m) return "";
    const mins = (+m[1]) * 60 + +m[2] + Math.round(freeH * 60);
    const hh = String(Math.floor(mins / 60) % 24).padStart(2, "0");
    const mm = String(mins % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  }, [gateIn, freeH]);

  return (
    <SpringIn className="bg-white border border-divider rounded-md p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-sm font-semibold text-ink">Detention clock</div>
        <div className="text-[11px] text-mute">free-time window vs on-site</div>
      </div>

      <svg viewBox="0 0 660 150" className="w-full" role="img" aria-label="Detention time band">
        {/* time axis */}
        <line x1={X0} y1="96" x2={X0 + FULL} y2="96" stroke="currentColor" strokeWidth="1.5" className="text-border-divider" />

        {/* free-time band — lays down first */}
        <rect
          x={X0} y="50" height="46" rx="5"
          width={phase >= 1 ? px(freeH) - X0 : 0}
          className="text-accent-green" fill="currentColor" opacity="0.18"
          style={{ transition: "width 480ms ease-out" }}
        />
        <text x={X0 + 8} y="44" fontSize="10" className="text-accent-green" fill="currentColor" opacity={phase >= 1 ? 1 : 0} style={{ transition: "opacity 300ms" }}>
          free-time {freeH.toFixed(1)}h
        </text>

        {/* on-site bar — sweeps from gate-in, halts inside the band */}
        <rect
          x={X0} y="62" height="22" rx="4"
          width={phase >= 2 ? px(onSiteH) - X0 : 0}
          className="text-surface-deep" fill="currentColor"
          style={{ transition: "width 620ms cubic-bezier(.25,.8,.3,1)" }}
        />
        <text x={X0 + 6} y="78" fontSize="11" className="text-ink-inverse" fill="currentColor" opacity={phase >= 2 ? 1 : 0} style={{ transition: "opacity 300ms" }}>
          on-site {onSiteH.toFixed(1)}h
        </text>

        {/* gate-in marker */}
        <line x1={X0} y1="48" x2={X0} y2="112" stroke="currentColor" strokeWidth="1.5" className="text-ink" />
        <text x={X0} y="126" textAnchor="middle" fontSize="10" className="text-ink" fill="currentColor">gate-in {gateIn}</text>

        {/* gate-out marker (where the truck left) */}
        <g opacity={phase >= 2 ? 1 : 0} style={{ transition: "opacity 360ms" }}>
          <line x1={px(onSiteH)} y1="56" x2={px(onSiteH)} y2="112" stroke="currentColor" strokeWidth="1.5" className="text-surface-deep" />
          <text x={px(onSiteH)} y="126" textAnchor="middle" fontSize="10" className="text-surface-deep" fill="currentColor">left {gateOut}</text>
        </g>

        {/* free-time-ends marker — sits to the RIGHT of where the truck left */}
        <line x1={px(freeH)} y1="44" x2={px(freeH)} y2="104" stroke="#0a7d3c" strokeWidth="1.4" strokeDasharray="4 3" />
        <text x={px(freeH)} y="38" textAnchor="middle" fontSize="10" fill="#0a7d3c">free-time ends {endLabel}</text>
      </svg>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold text-ink-inverse bg-surface-deep",
          phase >= 3 && "detention-pulse",
        )}>
          <AIDot tone="green" size={7} />
          {detention.toFixed(1)}h detention · $0 owed
        </span>
        <span className="text-[12px]">
          <span className="text-mute mr-1">billed</span>
          <span
            className="font-semibold tabular-nums"
            style={{ color: "#bb0000", textDecoration: phase >= 4 ? "line-through" : "none" }}
          >
            {billed}
          </span>
        </span>
      </div>
      <div className="mt-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-mint px-2 py-0.5 text-[11px] text-surface-deep">
          Yard gate log {log}
          <span aria-hidden>✓</span>
        </span>
      </div>

      <style>{`
        @keyframes detention-pulse-kf { 0%,100%{transform:scale(1)} 45%{transform:scale(1.05)} }
        .detention-pulse { animation: detention-pulse-kf 520ms ease-in-out 1; }
      `}</style>
    </SpringIn>
  );
}
