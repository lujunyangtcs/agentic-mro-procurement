import { cn } from "@/lib/utils";

/**
 * BigPrice — large numeric display + delta (§17, share-perf hero stat).
 * "66.00 € / -1.80 (-2.65 %)" pattern.
 */
export function BigPrice({
  value,
  unit,
  delta,
  deltaPct,
  tone = "default",
  size = 72,
  className,
}: {
  value: string;
  unit?: string;
  delta?: string;     // "-1.80"
  deltaPct?: string;  // "-2.65 %"
  tone?: "default" | "inverse";
  size?: number;
  className?: string;
}) {
  const isNeg = (delta ?? "").trim().startsWith("-");
  const deltaColor = isNeg
    ? "text-[#A6192E]"
    : "text-[color:var(--accent-green)]";
  return (
    <div className={cn(tone === "inverse" ? "text-white" : "text-black", className)}>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span
          className="font-bold tracking-[-0.02em] leading-none"
          style={{ fontSize: size }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[18px] font-bold opacity-60">{unit}</span>
        )}
        {(delta || deltaPct) && (
          <span className={cn("text-[16px] font-bold", deltaColor)}>
            {delta}
            {deltaPct && (
              <span className="ml-2">({deltaPct})</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
