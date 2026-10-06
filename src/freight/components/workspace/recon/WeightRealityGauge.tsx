import * as React from "react";
import { CountUp } from "@/freight/components/ai/CountUp";
import { SpringIn } from "@/freight/components/ai/SpringIn";

export type WeightRealityGaugeProps = {
  claimT: number;
  scaledT: number;
  gross: number;
  tare: number;
  cubePctVolume: number;
  cubePctWeight: number;
  accessorialAtRisk: string;
  ticket: string;
};

/**
 * Volumetric-vs-actual weight gauge: a trailer silhouette with a claimed
 * (hatched) fill and a shorter scaled (solid) fill, the gap tagged as phantom
 * tonnage. Reveals in sequence on mount.
 */
export function WeightRealityGauge({
  claimT,
  scaledT,
  gross,
  tare,
  cubePctVolume,
  cubePctWeight,
  accessorialAtRisk,
  ticket,
}: WeightRealityGaugeProps) {
  const [phase, setPhase] = React.useState(0);
  React.useEffect(() => {
    const t1 = window.setTimeout(() => setPhase(1), 120);
    const t2 = window.setTimeout(() => setPhase(2), 760);
    const t3 = window.setTimeout(() => setPhase(3), 1340);
    return () => [t1, t2, t3].forEach(window.clearTimeout);
  }, []);

  // Geometry: inner cargo box of the trailer runs x 92 → 612 (width 520).
  const X0 = 92;
  const FULL = 520;
  const max = Math.max(claimT, scaledT) || 1;
  const claimW = (claimT / max) * FULL;
  const scaledW = (scaledT / max) * FULL;
  const delta = +(claimT - scaledT).toFixed(1);

  return (
    <SpringIn className="bg-white border border-divider rounded-md p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-sm font-semibold text-ink">Weight reality check</div>
        <div className="text-[11px] text-mute">scaled vs claimed tonnage</div>
      </div>

      <svg viewBox="0 0 700 230" className="w-full" role="img" aria-label="Weight gauge">
        <defs>
          <pattern id="wrg-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="7" fill="currentColor" className="text-surface-fog" />
            <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" strokeWidth="3" className="text-mute" opacity="0.55" />
          </pattern>
        </defs>

        {/* volume axis */}
        <line x1={X0} y1="26" x2={X0 + FULL} y2="26" stroke="currentColor" strokeWidth="1.5" className="text-border-divider" />
        <g className="text-mute" fill="currentColor" fontSize="10">
          <circle cx={X0 + (cubePctWeight / 100) * FULL} cy="26" r="3.5" className="text-surface-deep" fill="currentColor" />
          <text x={X0 + (cubePctWeight / 100) * FULL} y="16" textAnchor="middle">weight {cubePctWeight}%</text>
          <circle cx={X0 + (cubePctVolume / 100) * FULL} cy="26" r="3.5" fill="#bb0000" />
          <text x={X0 + (cubePctVolume / 100) * FULL} y="16" textAnchor="middle" fill="#bb0000">cube-out {cubePctVolume}%</text>
        </g>

        {/* trailer silhouette */}
        <rect x="78" y="48" width="548" height="96" rx="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink" />
        <line x1="56" y1="96" x2="78" y2="96" stroke="currentColor" strokeWidth="3" className="text-ink" />
        <circle cx="160" cy="152" r="9" className="text-ink" fill="currentColor" />
        <circle cx="196" cy="152" r="9" className="text-ink" fill="currentColor" />
        <circle cx="540" cy="152" r="9" className="text-ink" fill="currentColor" />

        {/* claimed (hatched) fill — back, grows first */}
        <rect
          x={X0} y="58" height="34" rx="4"
          width={phase >= 1 ? claimW : 0}
          fill="url(#wrg-hatch)"
          style={{ transition: "width 620ms ease-out" }}
        />
        <text x={X0 + 6} y="79" fontSize="11" className="text-mute" fill="currentColor" opacity={phase >= 1 ? 1 : 0} style={{ transition: "opacity 300ms" }}>
          claimed {claimT.toFixed(1)}t
        </text>

        {/* phantom gap shade */}
        <rect
          x={X0 + scaledW} y="100" height="34" rx="4"
          width={phase >= 3 ? claimW - scaledW : 0}
          fill="#bb0000" opacity="0.1"
          style={{ transition: "width 420ms ease-out" }}
        />

        {/* scaled (solid) fill — front, grows second, stops short */}
        <rect
          x={X0} y="100" height="34" rx="4"
          width={phase >= 2 ? scaledW : 0}
          className="text-surface-deep" fill="currentColor"
          style={{ transition: "width 540ms ease-out" }}
        />
        <text x={X0 + 6} y="121" fontSize="11" className="text-ink-inverse" fill="currentColor" opacity={phase >= 2 ? 1 : 0} style={{ transition: "opacity 300ms" }}>
          scaled {scaledT.toFixed(1)}t
        </text>

        {/* phantom tag */}
        <g opacity={phase >= 3 ? 1 : 0} style={{ transition: "opacity 360ms" }}>
          <line x1={X0 + scaledW} y1="100" x2={X0 + scaledW} y2="186" stroke="#bb0000" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1={X0 + claimW} y1="58" x2={X0 + claimW} y2="186" stroke="#bb0000" strokeWidth="1.2" strokeDasharray="3 3" />
          <text x={(X0 + scaledW + X0 + claimW) / 2} y="204" textAnchor="middle" fontSize="11" fontWeight="600" fill="#bb0000">
            phantom +{delta.toFixed(1)}t · billed, not on the scale → {accessorialAtRisk}
          </text>
        </g>
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink">
        <span className="text-mute">gross</span>
        <CountUp to={gross} decimals={1} suffix="t" className="font-medium tabular-nums" />
        <span className="text-mute">− tare</span>
        <CountUp to={tare} decimals={1} suffix="t" className="font-medium tabular-nums" />
        <span className="text-mute">=</span>
        <span className="font-semibold text-surface-deep tabular-nums">net {(gross - tare).toFixed(1)}t</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-surface-mint px-2 py-0.5 text-[11px] text-surface-deep">
          Weigh-bridge {ticket}
          <span aria-hidden>✓</span>
        </span>
      </div>
    </SpringIn>
  );
}
