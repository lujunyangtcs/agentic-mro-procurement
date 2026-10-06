import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ChartFrame — wraps a chart with title row + axis labels + price-tag callout.
 * The chart canvas itself is a placeholder — the DS ships the frame, not a chart engine.
 * Mirrors the "Share chart" card on the share-performance page (§17).
 */
export function ChartFrame({
  title,
  subTitle,
  actions,
  yMin,
  yMax,
  yStep = 4,
  series,
  callout,
  className,
}: {
  title: React.ReactNode;
  subTitle?: React.ReactNode;
  actions?: React.ReactNode;
  yMin: number;
  yMax: number;
  yStep?: number;
  series: number[];        // 0..1 normalized heights
  callout?: { x: number; value: string };  // x in 0..1
  className?: string;
}) {
  const ticks = Array.from({ length: yStep + 1 }, (_, i) =>
    yMin + ((yMax - yMin) * (yStep - i)) / yStep
  );

  return (
    <div
      className={cn(
        "p-6 bg-white border border-[color:var(--divider)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-6 mb-4">
        <div>
          <h3 className="text-[28px] font-bold tracking-[-0.01em]">{title}</h3>
          {subTitle && (
            <div className="mt-1 text-[14px] text-[color:var(--mute)]">{subTitle}</div>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <div className="relative" style={{ height: 280 }}>
        {/* y axis ticks */}
        <div className="absolute inset-y-0 left-0 w-12 flex flex-col justify-between text-[11px] text-[color:var(--mute)] font-mono">
          {ticks.map((t) => (
            <div key={t} className="h-0 leading-none">
              {t.toFixed(2)}
            </div>
          ))}
        </div>
        {/* grid + series */}
        <div className="absolute inset-y-0 left-12 right-0">
          {ticks.map((_, i) => (
            <div
              key={i}
              className="absolute inset-x-0 border-t border-[color:var(--divider)]"
              style={{ top: `${(i / yStep) * 100}%` }}
            />
          ))}
          <svg
            viewBox={`0 0 ${series.length} 100`}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            <polyline
              points={series.map((v, i) => `${i},${100 - v * 100}`).join(" ")}
              fill="none"
              stroke="#000000"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {callout && (
            <div
              className="absolute -translate-y-1/2 bg-[color:var(--accent-green)] text-white text-[12px] font-bold px-2.5 py-1 rounded-[6px] whitespace-nowrap"
              style={{
                left: `${callout.x * 100}%`,
                top: `30%`,
              }}
            >
              {callout.value}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
