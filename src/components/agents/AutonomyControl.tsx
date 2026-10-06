import * as React from "react";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/state";
import { AUTONOMY_LABEL, type AgentSpec, type AutonomyLevel } from "@/data/agents";
import { AIDot } from "@/components/ai/AIDot";
import { SpringIn } from "@/components/ai/SpringIn";
import { AgentSettingsModal } from "@/components/agents/AgentSettingsModal";

const LEVELS: AutonomyLevel[] = [2, 3, 4];

const headline: Record<AutonomyLevel, string> = {
  2: "Drafts and waits for you on every transaction",
  3: "Auto-runs the routine path · routes the rest to you",
  4: "Runs end-to-end within policy · exceptions escalate",
};

/* The L3 rule is the agent's own auto-execute condition; L2 and L4 bracket it. */
function blurb(agent: AgentSpec, level: AutonomyLevel): string {
  if (level === 2)
    return "Every output is prepared for you to review — nothing executes until you approve it. The agent is a co-pilot; you keep the controls on each transaction.";
  if (level === 3) return agent.autonomyRule;
  return "The agent handles the routine path on its own, within policy, and logs every step. Only the escalation triggers below ever reach a person.";
}

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/**
 * Interactive guardrail dial — the presenter clicks L2 / L3 / L4 and the
 * threshold copy + escalation framing update live. Level and thresholds are
 * persisted in `agentConfig`; the gear opens the savable settings modal.
 */
export function AutonomyControl({ agent }: { agent: AgentSpec }) {
  const { agentConfig, setAgentConfig } = useApp();
  const config = agentConfig[agent.id];
  const level = config.level;
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  return (
    <article className="bg-white border border-divider rounded-md p-6 space-y-4">
      <header className="flex items-center gap-2">
        <AIDot size={6} tone="deep" pulse />
        <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
          Autonomy guardrail
        </span>
        <span className="ml-auto text-[11px] text-mute">
          Ships at L{agent.autonomy} · {AUTONOMY_LABEL[agent.autonomy]}
        </span>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="ui-pill w-7 h-7 rounded-full text-mute hover:text-surface-deep hover:bg-surface-fog flex items-center justify-center"
          aria-label="Configure guardrails"
          title="Configure guardrails"
        >
          <Settings size={15} strokeWidth={1.9} />
        </button>
      </header>

      <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-fog rounded-md">
        {LEVELS.map((l) => {
          const active = l === level;
          return (
            <button
              key={l}
              type="button"
              onClick={() => setAgentConfig(agent.id, { level: l })}
              className={cn(
                "ui-pill rounded-md px-3 py-2.5 text-left",
                active
                  ? "bg-surface-deep text-ink-inverse shadow-sm"
                  : "bg-transparent text-mute hover:bg-white",
              )}
            >
              <div className="text-[11px] font-medium opacity-75">Level {l}</div>
              <div className="text-[13px] font-bold leading-tight">{AUTONOMY_LABEL[l]}</div>
            </button>
          );
        })}
      </div>

      <SpringIn key={level}>
        <div className="rounded-md bg-surface-mint/40 border border-surface-deep/15 p-4 space-y-1.5">
          <div className="text-[13px] font-bold text-ink">{headline[level]}</div>
          <p className="text-[12px] text-ink leading-snug">{blurb(agent, level)}</p>
        </div>
      </SpringIn>

      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className="ui-pill w-full flex items-center justify-between rounded-md border border-divider bg-surface-fog px-3 py-2.5 text-left hover:border-surface-deep"
      >
        <span className="flex items-center gap-2">
          <Settings size={14} strokeWidth={1.9} className="text-surface-deep" />
          <span className="text-[12px] text-ink">
            Auto-execute ≤ <span className="font-bold tabular-nums">{usd(config.autoThreshold)}</span>
            <span className="text-mute"> · confidence ≥ </span>
            <span className="font-bold tabular-nums">{Math.round(config.minConfidence * 100)}%</span>
          </span>
        </span>
        <span className="text-[11px] font-bold text-surface-deep">Configure</span>
      </button>

      {settingsOpen && <AgentSettingsModal agent={agent} onClose={() => setSettingsOpen(false)} />}
    </article>
  );
}
