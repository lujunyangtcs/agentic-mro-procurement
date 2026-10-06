import * as React from "react";
import { CountUp } from "@/freight/components/ai/CountUp";
import { AIDot } from "@/freight/components/ai/AIDot";

export type ExceptionType =
  | "missing-po"
  | "wrong-company-code"
  | "insufficient-po"
  | "rate-mismatch";

export type ToleranceGaugeProps = {
  band: string;
  inCount: number;
  median: string;
  outliers: { type: ExceptionType; variancePct: number }[];
};

// Example demo shape (NOT rendered — passed in by the caller):
//   band="±2%", inCount=1604, median="0.4%", outliers=[
//     ...14× missing-po, 6× wrong-company-code, 9× insufficient-po, 7× rate-mismatch
//     ... each variancePct between 2.1 and 9.0
//   ]  → "in band 1,604 · out 36"

const ACCENT: Record<ExceptionType, string> = {
  "missing-po": "var(--mark-red)",
  "wrong-company-code": "var(--surface-sage)",
  "insufficient-po": "#c2740c",
  "rate-mismatch": "var(--accent-green-deep)",
};

const LABEL: Record<ExceptionType, string> = {
  "missing-po": "Missing PO",
  "wrong-company-code": "Wrong company code",
  "insufficient-po": "Insufficient PO",
  "rate-mismatch": "Rate mismatch",
};

const ORDER: ExceptionType[] = [
  "missing-po",
  "wrong-company-code",
  "insufficient-po",
  "rate-mismatch",
];

const VB_W = 720;
const VB_H = 240;
const MAX = 10; // band ±2%, outliers reach ~9%
const CX = VB_W / 2;
const AXIS_Y = 132;
const HALF = 300; // px from center to each edge of the plotted scale
const ZONE = (2 / MAX) * HALF; // half-width of the ±2% tolerance zone

export function ToleranceGauge(props: ToleranceGaugeProps) {
  const { band, inCount, median, outliers } = props;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Spread outliers both directions from center; alternate sign by index.
  const plotted = outliers.map((o, i) => {
    const sign = i % 2 === 0 ? 1 : -1;
    const x = CX + sign * (o.variancePct / MAX) * HALF;
    const y = AXIS_Y - 40 + ((i * 13) % 80); // jitter so dots don't overlap
    const delay = Math.min(900, Math.abs(o.variancePct) * 40);
    return { ...o, x, y, delay, sign };
  });

  const counts = ORDER.map((t) => ({
    type: t,
    n: outliers.filter((o) => o.type === t).length,
  }));

  return (
    <div className="bg-white border border-divider rounded-md p-4">
      <div className="flex items-center gap-2 mb-3">
        <AIDot size={8} pulse tone="deep" />
        <span className="text-surface-deep text-[11px] font-bold tracking-wide uppercase">
          Tolerance band · why a line clears
        </span>
      </div>

      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="auto" role="img">
        {/* baseline axis */}
        <line x1={20} y1={AXIS_Y} x2={VB_W - 20} y2={AXIS_Y} stroke="var(--divider)" strokeWidth={1} />

        {/* tolerance zone */}
        <rect
          x={CX - ZONE}
          y={AXIS_Y - 64}
          width={ZONE * 2}
          height={128}
          fill="var(--accent-green)"
          fillOpacity={0.12}
          rx={4}
        />
        <line x1={CX - ZONE} y1={AXIS_Y - 64} x2={CX - ZONE} y2={AXIS_Y + 64} stroke="var(--accent-green)" strokeWidth={1.5} strokeDasharray="4 4" />
        <line x1={CX + ZONE} y1={AXIS_Y - 64} x2={CX + ZONE} y2={AXIS_Y + 64} stroke="var(--accent-green)" strokeWidth={1.5} strokeDasharray="4 4" />
        <text x={CX} y={AXIS_Y - 74} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--accent-green-deep)">
          {band} band
        </text>

        {/* in-tolerance mass — grows on mount via scaleY from its bottom */}
        <g
          style={{
            transform: mounted ? "scaleY(1)" : "scaleY(0)",
            transformOrigin: `${CX}px ${AXIS_Y + 60}px`,
            transformBox: "view-box",
            transition: "transform 700ms ease-out",
          }}
        >
          <rect x={CX - 30} y={AXIS_Y - 56} width={60} height={116} rx={5} fill="var(--surface-mint)" />
          <rect x={CX - 30} y={AXIS_Y - 56} width={60} height={5} rx={2.5} fill="var(--accent-green)" />
        </g>

        {/* outlier ticks — pop in staggered center-outward */}
        {plotted.map((o, i) => (
          <circle
            key={i}
            cx={o.x}
            cy={o.y}
            r={4}
            fill={ACCENT[o.type]}
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "scale(1)" : "scale(0)",
              transformOrigin: `${o.x}px ${o.y}px`,
              transformBox: "view-box",
              transition: `opacity 280ms ease-out ${o.delay}ms, transform 320ms cubic-bezier(.34,1.56,.64,1) ${o.delay}ms`,
            }}
          />
        ))}

        {/* pointer needle — sweeps from far left to center on mount */}
        <g
          style={{
            transform: mounted ? "translateX(0px)" : `translateX(${-(CX - 24)}px)`,
            transition: "transform 900ms ease-out",
          }}
        >
          <line x1={CX} y1={AXIS_Y - 72} x2={CX} y2={AXIS_Y + 64} stroke="var(--accent-green-deep)" strokeWidth={2} />
          <path d={`M ${CX - 5} ${AXIS_Y - 72} L ${CX + 5} ${AXIS_Y - 72} L ${CX} ${AXIS_Y - 64} Z`} fill="var(--accent-green-deep)" />
        </g>

        {/* mass caption */}
        <text x={CX} y={AXIS_Y + 86} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--mute)">
          {inCount.toLocaleString("en-US")} lines · median {median}
        </text>
      </svg>

      {/* legend */}
      <div className="grid grid-cols-2 gap-4 mt-3 sm:grid-cols-4">
        {counts.map(({ type, n }) => (
          <div key={type} className="flex items-center gap-2 min-h-[20px]">
            <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ACCENT[type] }} />
            <span className="text-[11px] text-ink leading-tight">{LABEL[type]}</span>
            <span className="text-[11px] font-bold text-mute ml-auto">{n}</span>
          </div>
        ))}
      </div>

      {/* mini-readout */}
      <div className="text-[11px] text-mute mt-3 pt-3 border-t border-divider">
        in band{" "}
        <CountUp to={inCount} className="text-surface-deep font-bold" /> · out{" "}
        <CountUp to={outliers.length} className="text-mark-red font-bold" />
      </div>
    </div>
  );
}
