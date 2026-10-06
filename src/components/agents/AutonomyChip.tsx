import { cn } from "@/lib/utils";
import { AUTONOMY_LABEL, type AgentSpec } from "@/data/agents";

const base =
  "inline-flex items-center rounded text-[10px] tracking-[0.04em] uppercase font-semibold px-1.5 py-0.5 whitespace-nowrap";

/* Compact autonomy badge. L2 reads quietest, L4 the boldest. */
export function AutonomyChip({ agent, className }: { agent: AgentSpec; className?: string }) {
  if (agent.coordinator) {
    return <span className={cn(base, "bg-surface-deep text-ink-inverse", className)}>Coordinator</span>;
  }
  const tone =
    agent.autonomy === 2
      ? "bg-surface-fog text-mute border border-divider"
      : agent.autonomy === 3
        ? "bg-surface-mint text-surface-deep"
        : "bg-surface-deep text-ink-inverse";
  return (
    <span className={cn(base, tone, className)}>
      L{agent.autonomy} {AUTONOMY_LABEL[agent.autonomy]}
    </span>
  );
}
