import { cn } from "@/lib/utils";

type Kind = "critical" | "ready" | "progress" | "resolved" | "neutral" | "alert" | "active" | "ok";

const styles: Record<Kind, { bg: string; dot: string; ink: string }> = {
  critical: { bg: "bg-surface-rose", dot: "bg-mark-red", ink: "text-mark-red" },
  ready: { bg: "bg-surface-mint", dot: "bg-surface-deep", ink: "text-surface-deep" },
  progress: { bg: "bg-surface-fog", dot: "bg-mute", ink: "text-ink" },
  resolved: { bg: "bg-surface-mint", dot: "bg-surface-deep", ink: "text-surface-deep" },
  neutral: { bg: "bg-surface-fog", dot: "bg-mute", ink: "text-ink" },
  alert: { bg: "bg-surface-rose", dot: "bg-mark-red", ink: "text-mark-red" },
  active: { bg: "bg-surface-mint", dot: "bg-surface-deep", ink: "text-surface-deep" },
  ok: { bg: "bg-surface-fog", dot: "bg-accent-green", ink: "text-ink" },
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
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium",
        s.bg,
        s.ink,
        className,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot, pulse && "ai-pulse")} />
      {label}
    </span>
  );
}
