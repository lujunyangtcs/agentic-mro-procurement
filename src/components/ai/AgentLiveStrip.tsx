import { useEffect, useState } from "react";
import { AIDot } from "@/components/ai/AIDot";
import { StreamingText } from "@/components/ai/StreamingText";
import { cn } from "@/lib/utils";

/**
 * Slim "live agent" strip — sits above the active card and rotates through
 * a script of status lines so the audience always sees what the agent is
 * doing right now. Typewriter feel + pulsing dot + soft mint surface.
 */
export function AgentLiveStrip({
  lines,
  pulseMs = 2400,
  className,
}: {
  lines: string[];
  /** Time each line is shown before swapping to the next. */
  pulseMs?: number;
  className?: string;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
    if (lines.length < 2) return;
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % lines.length);
    }, pulseMs);
    return () => window.clearInterval(t);
  }, [lines, pulseMs]);

  if (!lines.length) return null;
  const safeIdx = idx % lines.length;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-3.5 py-2 rounded-md bg-surface-mint/55 border border-surface-deep/15",
        className,
      )}
      aria-live="polite"
    >
      <AIDot size={7} tone="deep" pulse />
      <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-bold shrink-0">
        Agent live
      </span>
      <span className="text-[12px] text-ink truncate" key={safeIdx}>
        <StreamingText text={lines[safeIdx]} cps={90} />
      </span>
    </div>
  );
}
