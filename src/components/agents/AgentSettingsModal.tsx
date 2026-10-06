import * as React from "react";
import { X } from "lucide-react";
import { useApp } from "@/state";
import { AUTONOMY_LABEL, type AgentSpec, type AutonomyLevel } from "@/data/agents";
import { cn } from "@/lib/utils";
import { PillButton } from "@/components/blocks/PillButton";

const LEVELS: AutonomyLevel[] = [2, 3, 4];

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/**
 * Gear → guardrail settings. Configures the chosen autonomy level's auto-
 * execute ceiling and the minimum AI confidence to act without a human, then
 * persists to `agentConfig` on Save. Centre-screen modal card.
 */
export function AgentSettingsModal({
  agent,
  onClose,
}: {
  agent: AgentSpec;
  onClose: () => void;
}) {
  const { agentConfig, setAgentConfig } = useApp();
  const saved = agentConfig[agent.id];

  const [level, setLevel] = React.useState<AutonomyLevel>(saved.level);
  const [threshold, setThreshold] = React.useState<number>(saved.autoThreshold);
  const [confidence, setConfidence] = React.useState<number>(saved.minConfidence);

  const save = () => {
    setAgentConfig(agent.id, { level, autoThreshold: threshold, minConfidence: confidence });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="ai-spring w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-divider">
          <div className="leading-tight">
            <div className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-bold">
              Guardrail settings
            </div>
            <div className="text-[15px] font-bold text-ink mt-1">{agent.name}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-pill w-8 h-8 rounded-full text-mute hover:text-ink flex items-center justify-center shrink-0"
            aria-label="Close settings"
          >
            <X size={16} />
          </button>
        </header>

        <div className="px-5 py-5 space-y-5">
          {/* Autonomy level */}
          <div className="space-y-2">
            <div className="text-[12px] font-bold text-ink">Autonomy level</div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-fog rounded-md">
              {LEVELS.map((l) => {
                const active = l === level;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={cn(
                      "ui-pill rounded-md px-2 py-2 text-center",
                      active ? "bg-surface-deep text-ink-inverse shadow-sm" : "text-mute hover:bg-white",
                    )}
                  >
                    <div className="text-[10px] font-medium opacity-75">L{l}</div>
                    <div className="text-[12px] font-bold leading-tight">{AUTONOMY_LABEL[l]}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto-execute ceiling */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor="auto-threshold" className="text-[12px] font-bold text-ink">
                Auto-execute ceiling
              </label>
              <span className="text-[12px] tabular-nums text-surface-deep font-bold">
                {usd(threshold)}
              </span>
            </div>
            <p className="text-[11px] text-mute leading-snug">
              Transactions at or below this value run without a human at L{level}. Anything above is
              drafted and routed for approval.
            </p>
            <input
              id="auto-threshold"
              type="range"
              min={0}
              max={100000}
              step={1000}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-[var(--accent-green-deep)]"
            />
            <div className="flex justify-between text-[10px] text-mute tabular-nums">
              <span>$0</span>
              <span>$100,000</span>
            </div>
          </div>

          {/* Minimum confidence */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor="min-confidence" className="text-[12px] font-bold text-ink">
                Minimum AI confidence
              </label>
              <span className="text-[12px] tabular-nums text-surface-deep font-bold">
                {Math.round(confidence * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-mute leading-snug">
              The agent only acts on its own when its confidence is at or above this bar.
            </p>
            <input
              id="min-confidence"
              type="range"
              min={0.5}
              max={1}
              step={0.01}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full accent-[var(--accent-green-deep)]"
            />
            <div className="flex justify-between text-[10px] text-mute tabular-nums">
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-divider bg-surface-fog/50">
          <PillButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </PillButton>
          <PillButton variant="deep" size="sm" onClick={save}>
            Save guardrails
          </PillButton>
        </footer>
      </div>
    </div>
  );
}
