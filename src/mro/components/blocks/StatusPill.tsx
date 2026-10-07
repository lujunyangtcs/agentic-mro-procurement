import { cn } from "@/mro/lib/utils";

type Kind = "critical" | "ready" | "progress" | "resolved" | "neutral" | "alert" | "active" | "ok";

/* Square, tracked, uppercase — a tracked label rather than a rounded pill. */
const styles: Record<Kind, { bg: string; dot: string; ink: string }> = {
  critical: { bg: "bg-surface-red border-transparent", dot: "bg-mark-red", ink: "text-mark-red" },
  ready: { bg: "bg-sand border-transparent", dot: "bg-surface-deep", ink: "text-ink" },
  progress: { bg: "bg-white border-divider", dot: "bg-steel", ink: "text-ink" },
  resolved: { bg: "bg-white border-ink/30", dot: "bg-accent-green", ink: "text-ink" },
  neutral: { bg: "bg-white border-divider", dot: "bg-steel", ink: "text-mute" },
  alert: { bg: "bg-surface-red border-transparent", dot: "bg-mark-red", ink: "text-mark-red" },
  active: { bg: "bg-accent-navy border-transparent", dot: "bg-sand", ink: "text-ink-inverse" },
  ok: { bg: "bg-white border-divider", dot: "bg-accent-green", ink: "text-ink" },
};

export function StatusPill({
  label,
  kind = "neutral",
  pulse = false,
  className,
}: {
  label: string;
  kind?: Kind;
  pulse?: boolean;
  className?: string;
}) {
  const s = styles[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border px-2.5 py-1 text-[11px] uppercase leading-[16px] tracking-[0.1em]",
        s.bg,
        s.ink,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", s.dot, pulse && "ai-pulse")} />
      {label}
    </span>
  );
}
