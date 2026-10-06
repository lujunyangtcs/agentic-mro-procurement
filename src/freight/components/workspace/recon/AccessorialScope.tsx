import * as React from "react";
import { CountUp } from "@/freight/components/ai/CountUp";
import { SpringIn } from "@/freight/components/ai/SpringIn";

export type AccessorialScopeProps = {
  contractBasis: string;
  contractValue: string;
  billedBasis: string;
  billedValue: string;
  delta: string;
  note?: string;
};

const money = (s: string) => Number(s.replace(/[^0-9.]/g, "")) || 0;

/**
 * Surcharge basis normalizer: a contract bar (% of line haul) resolving against
 * a billed flat block, with an over-bracket tagging the delta. The basis chips
 * naming the unit are the whole point — % vs flat.
 */
export function AccessorialScope({
  contractBasis,
  contractValue,
  billedBasis,
  billedValue,
  delta,
  note = "normalized to like-for-like basis",
}: AccessorialScopeProps) {
  const [phase, setPhase] = React.useState(0);
  React.useEffect(() => {
    const t1 = window.setTimeout(() => setPhase(1), 140);
    const t2 = window.setTimeout(() => setPhase(2), 720);
    const t3 = window.setTimeout(() => setPhase(3), 1200);
    return () => [t1, t2, t3].forEach(window.clearTimeout);
  }, []);

  const contractN = money(contractValue);
  const billedN = money(billedValue);
  const deltaN = money(delta);
  const max = Math.max(contractN, billedN) || 1;
  // bar track runs y 150 (bottom) up to y 44 (top) = 106px tall.
  const BOT = 150;
  const H = 106;
  const contractH = (contractN / max) * H;
  const billedH = (billedN / max) * H;

  return (
    <SpringIn className="bg-white border border-divider rounded-md p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-sm font-semibold text-ink">Accessorial scope</div>
        <div className="text-[11px] text-mute">contract basis vs billed</div>
      </div>

      <svg viewBox="0 0 360 196" className="w-full" role="img" aria-label="Accessorial basis comparison">
        {/* baseline */}
        <line x1="20" y1={BOT} x2="340" y2={BOT} stroke="currentColor" strokeWidth="1.5" className="text-border-divider" />

        {/* contract bar */}
        <rect
          x="60" width="70" rx="4"
          y={phase >= 1 ? BOT - contractH : BOT}
          height={phase >= 1 ? contractH : 0}
          className="text-surface-deep" fill="currentColor"
          style={{ transition: "height 580ms ease-out, y 580ms ease-out" }}
        />
        <text x="95" y={BOT + 16} textAnchor="middle" fontSize="10" className="text-mute" fill="currentColor">Contract</text>
        <text x="95" y={(phase >= 1 ? BOT - contractH : BOT) - 7} textAnchor="middle" fontSize="12" fontWeight="700" className="text-surface-deep" fill="currentColor" opacity={phase >= 1 ? 1 : 0} style={{ transition: "opacity 300ms" }}>
          {contractValue}
        </text>

        {/* billed flat block — snaps in */}
        <rect
          x="230" width="70" rx="4"
          y={BOT - billedH}
          height={billedH}
          fill="#bb0000" opacity="0.16"
          style={{ transform: phase >= 2 ? "scaleY(1)" : "scaleY(0)", transformOrigin: `0px ${BOT}px`, transition: "transform 260ms cubic-bezier(.2,.9,.3,1.3)" }}
        />
        <rect
          x="230" width="70" rx="4"
          y={BOT - billedH} height={billedH}
          fill="none" stroke="#bb0000" strokeWidth="1.5"
          style={{ transform: phase >= 2 ? "scaleY(1)" : "scaleY(0)", transformOrigin: `0px ${BOT}px`, transition: "transform 260ms cubic-bezier(.2,.9,.3,1.3)" }}
        />
        <text x="265" y={BOT + 16} textAnchor="middle" fontSize="10" className="text-mute" fill="currentColor">Billed</text>
        <text x="265" y={BOT - billedH - 7} textAnchor="middle" fontSize="12" fontWeight="700" fill="#bb0000" opacity={phase >= 2 ? 1 : 0} style={{ transition: "opacity 300ms" }}>
          {billedValue}
        </text>

        {/* over-bracket — draws last */}
        <g opacity={phase >= 3 ? 1 : 0} style={{ transition: "opacity 360ms" }}>
          <path
            d={`M95 ${BOT - contractH - 22} V ${BOT - billedH - 30} H 265 V ${BOT - billedH - 22}`}
            fill="none" stroke="#bb0000" strokeWidth="1.4"
          />
          <text x="180" y={BOT - billedH - 36} textAnchor="middle" fontSize="12" fontWeight="700" fill="#bb0000">
            +<tspan>{delta.replace(/[^0-9.,$]/g, "")}</tspan> over
          </text>
        </g>
      </svg>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-mint px-2 py-0.5 text-[11px] text-surface-deep">
          basis · {contractBasis}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-rose px-2 py-0.5 text-[11px]" style={{ color: "#bb0000" }}>
          basis · {billedBasis}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[12px]">
        <span className="text-mute">{note}</span>
        <span className="font-semibold tabular-nums" style={{ color: "#bb0000" }}>
          <CountUp to={deltaN} prefix="+$" className="tabular-nums" />
        </span>
      </div>
    </SpringIn>
  );
}
