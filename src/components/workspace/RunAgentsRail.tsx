import { useApp } from "@/state";
import { agentsById, type AgentId } from "@/data/agents";
import { AIDot } from "@/components/ai/AIDot";
import { AutonomyChip } from "@/components/agents/AutonomyChip";

export type RunAgent = { id: AgentId; did: string };

/* The team behind the live run — each row deep-links to its agent page. */
export function RunAgentsRail({ items }: { items: RunAgent[] }) {
  const { go } = useApp();
  return (
    <section className="bg-white border border-divider rounded-md overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-divider">
        <div className="flex items-center gap-2">
          <AIDot size={6} tone="deep" pulse />
          <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Agents on this run
          </span>
        </div>
        <span className="text-[11px] text-mute">{items.length}</span>
      </header>
      <ul className="divide-y divide-divider">
        {items.map(({ id, did }) => {
          const a = agentsById[id];
          const Icon = a.icon;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => go({ kind: "agent", id })}
                className="ui-pill w-full text-left flex items-start gap-3 px-4 py-2.5 hover:bg-surface-mint/35"
              >
                <span className="w-8 h-8 rounded-lg bg-surface-fog flex items-center justify-center shrink-0">
                  <Icon size={16} strokeWidth={1.9} color="var(--accent-green-deep)" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-ink truncate">{a.menuLabel}</span>
                    <AutonomyChip agent={a} />
                  </span>
                  <span className="block text-[11.5px] text-mute leading-snug mt-0.5">{did}</span>
                </span>
                <span aria-hidden className="text-mute text-[13px] mt-0.5">
                  ↗
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
