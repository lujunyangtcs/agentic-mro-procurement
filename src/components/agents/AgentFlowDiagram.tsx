import type { CSSProperties } from "react";
import { useApp } from "@/state";
import { agentsById, type AgentId } from "@/data/agents";
import { AIDot } from "@/components/ai/AIDot";

/* ──────────────────────────────────────────────────────────────────────────
 * Agent-flow diagram — the orchestrator's live map of the 6-tower workforce
 * (five specialist agents + the orchestrator that owns Reporting & CI).
 *
 * HTML nodes (clickable → each agent's page) sit on top of an SVG connector
 * layer in a fixed 1200×470 coordinate space. The container holds that aspect
 * ratio, so percentage-positioned nodes line up with the meet-scaled SVG.
 *   · green  pipeline links  → auto-advance, marching-ants animation
 *   · red    escalation arrows → exception routes down to a person
 *   · dashed sage links      → always-on support feeds the pipeline
 * ────────────────────────────────────────────────────────────────────────── */

const W = 1200;
const H = 470;
const px = (x: number) => `${(x / W) * 100}%`;
const py = (y: number) => `${(y / H) * 100}%`;

/** Position + size a node by its centre, in 1200×470 space. */
function node(cx: number, cy: number, w: number, h: number): CSSProperties {
  return {
    left: px(cx),
    top: py(cy),
    width: px(w),
    height: py(h),
    transform: "translate(-50%, -50%)",
  };
}

type Stage = { id: AgentId; n: number; cx: number; auto: string; esc: string };

// The 4-stage core pipeline (PR → Sourcing → PO management → Invoice), evenly spaced.
const STAGES: Stage[] = [
  { id: "intake", n: 1, cx: 140, auto: "On-contract · under limit", esc: "Else → approver" },
  { id: "sourcing", n: 2, cx: 370, auto: "Routine buy · under limit", esc: "Strategic / new → manager" },
  { id: "po", n: 3, cx: 600, auto: "Compliant + on-time", esc: "Over limit / late → you" },
  { id: "invoice", n: 4, cx: 830, auto: "Clean match > 0.95", esc: "Exception → analyst" },
];

const STAGE_CY = 170;
const STAGE_W = 158;
const STAGE_H = 106;
const STAGE_BOTTOM = STAGE_CY + STAGE_H / 2; // 223

// Horizontal green links between consecutive stages, plus invoice → release.
const greenLinks = [
  [224, 286],
  [454, 516],
  [684, 746],
  [914, 1006],
];

function StageNode({ stage }: { stage: Stage }) {
  const { go } = useApp();
  const agent = agentsById[stage.id];
  const Icon = agent.icon;
  return (
    <button
      type="button"
      onClick={() => go({ kind: "agent", id: stage.id })}
      style={node(stage.cx, STAGE_CY, STAGE_W, STAGE_H)}
      className="ui-pill absolute z-10 flex flex-col rounded-md border border-divider bg-white p-2.5 text-left shadow-sm hover:border-surface-deep"
      title={`Open the ${agent.menuLabel} agent`}
    >
      <div className="flex items-center justify-between">
        <span className="w-4 h-4 rounded bg-surface-deep text-ink-inverse text-[9px] font-bold flex items-center justify-center shrink-0">
          {stage.n}
        </span>
        <Icon size={15} strokeWidth={2} className="text-surface-deep" />
      </div>
      <div className="text-[12px] font-bold text-ink leading-tight mt-1">{agent.menuLabel}</div>
      <div className="mt-auto space-y-1 pt-1.5">
        <div className="flex items-start gap-1">
          <span className="text-surface-deep text-[10px] leading-none mt-px">✓</span>
          <span className="text-[9.5px] text-surface-deep leading-tight">{stage.auto}</span>
        </div>
        <div className="flex items-start gap-1">
          <span className="text-mark-red text-[10px] leading-none mt-px">→</span>
          <span className="text-[9.5px] text-mark-red leading-tight">{stage.esc}</span>
        </div>
      </div>
    </button>
  );
}

function SupportNode({ id, cx, blurb }: { id: AgentId; cx: number; blurb: string }) {
  const { go } = useApp();
  const agent = agentsById[id];
  const Icon = agent.icon;
  return (
    <button
      type="button"
      onClick={() => go({ kind: "agent", id })}
      style={node(cx, 414, 336, 86)}
      className="ui-pill absolute z-10 flex items-center gap-3 rounded-md border border-divider bg-white p-3 text-left hover:border-surface-deep"
      title={`Open the ${agent.menuLabel} agent`}
    >
      <span className="w-9 h-9 rounded-md bg-surface-mint flex items-center justify-center shrink-0">
        <Icon size={18} strokeWidth={2} className="text-surface-deep" />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-ink leading-tight">{agent.menuLabel}</span>
          <span className="text-[8.5px] tracking-[0.08em] uppercase font-bold text-surface-deep bg-surface-sage/25 px-1.5 py-0.5 rounded">
            Always-on
          </span>
        </div>
        <p className="text-[11px] text-mute leading-snug mt-0.5">{blurb}</p>
      </div>
    </button>
  );
}

function LegendItem({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {swatch}
      <span>{label}</span>
    </span>
  );
}

export function AgentFlowDiagram() {
  const { go } = useApp();
  const Orchestrator = agentsById.orchestrator.icon;

  return (
    <article className="bg-white border border-divider rounded-md p-6 space-y-4">
      <header className="flex items-center gap-2">
        <AIDot size={6} tone="deep" pulse />
        <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
          Agent flow
        </span>
        <span className="text-[10px] font-bold text-surface-deep bg-surface-mint px-2 py-0.5 rounded-full">
          5 agents + orchestrator
        </span>
        <span className="ml-auto text-[11px] text-mute">Click any agent to open its page</span>
      </header>

      <div className="overflow-x-auto">
        <div className="relative w-full" style={{ aspectRatio: "1200 / 470", minWidth: 760 }}>
          {/* Connector layer */}
          <svg
            viewBox="0 0 1200 470"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full z-0"
            aria-hidden
          >
            <defs>
              <marker
                id="flow-arrow"
                markerWidth="7"
                markerHeight="7"
                refX="5.5"
                refY="3"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M0 0 L6 3 L0 6 Z" fill="var(--mark-red)" />
              </marker>
            </defs>

            {/* Green pipeline — auto-advance, marching ants */}
            {greenLinks.map(([x1, x2]) => (
              <line
                key={`g-${x1}`}
                x1={x1}
                y1={STAGE_CY}
                x2={x2}
                y2={STAGE_CY}
                stroke="var(--accent-green)"
                strokeWidth={8}
                strokeLinecap="round"
                opacity={0.85}
                className="hr-flow"
              />
            ))}

            {/* Red escalation — each stage drops to the human band */}
            {STAGES.map((s) => (
              <line
                key={`r-${s.id}`}
                x1={s.cx}
                y1={STAGE_BOTTOM}
                x2={s.cx}
                y2={305}
                stroke="var(--mark-red)"
                strokeWidth={2.4}
                opacity={0.7}
                markerEnd="url(#flow-arrow)"
              />
            ))}

            {/* Dashed support — the always-on MDM agent feeds the pipeline */}
            {[
              "M600 371 C 420 330, 230 285, 140 225",
              "M600 371 C 540 330, 620 285, 600 225",
              "M600 371 C 780 330, 940 285, 830 225",
            ].map((d) => (
              <path
                key={d}
                d={d}
                fill="none"
                stroke="var(--surface-sage)"
                strokeWidth={1.8}
                opacity={0.55}
                className="hr-flow-soft"
              />
            ))}
          </svg>

          {/* Orchestrator band — coordinates the workforce (this page) */}
          <div
            style={node(600, 37, 1144, 46)}
            className="absolute z-10 flex items-center justify-center gap-2 rounded-md bg-surface-deep text-ink-inverse px-4"
          >
            <Orchestrator size={15} strokeWidth={2} className="shrink-0" />
            <span className="text-[12px] font-medium text-center leading-tight">
              Orchestrator · coordinates handoffs · enforces the do-not-execute envelope · reporting
              &amp; continuous improvement
            </span>
          </div>

          {/* Core pipeline */}
          {STAGES.map((s) => (
            <StageNode key={s.id} stage={s} />
          ))}

          {/* Release to AP — terminal outcome */}
          <div
            style={node(1075, STAGE_CY, 128, 72)}
            className="absolute z-10 flex flex-col items-center justify-center rounded-md bg-surface-deep text-ink-inverse px-2 text-center"
          >
            <span className="text-[12.5px] font-bold leading-tight">Release to AP</span>
            <span className="text-[10px] opacity-80 mt-0.5">Payment on net terms</span>
          </div>

          {/* Human-in-the-loop band → opens the live run */}
          <button
            type="button"
            onClick={() => go({ kind: "workspace", flow: "belt" })}
            style={node(600, 334, 1144, 44)}
            className="ui-pill absolute z-10 flex items-center justify-center gap-2 rounded-md border border-mark-red/30 bg-surface-rose/40 hover:bg-surface-rose/60"
            title="Open the live belt run"
          >
            <span className="text-[12px] font-medium text-ink">
              Human-in-the-loop · review, fix or approve the exceptions
            </span>
            <span className="text-[11px] font-bold text-surface-deep">Open the run ↗</span>
          </button>

          {/* Always-on support agent — MDM feeds every stage */}
          <SupportNode
            id="vendor"
            cx={600}
            blurb="MDM Support — dedupes the vendor master, keeps PIR & pricing aligned, feeds every stage."
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-[11px] text-mute">
        <LegendItem
          swatch={<span className="inline-block w-5 h-[3px] rounded-full bg-accent-green" />}
          label="Auto-advance to the next stage"
        />
        <LegendItem
          swatch={<span className="inline-block w-5 h-[3px] rounded-full bg-mark-red" />}
          label="Exception routes to a person"
        />
        <LegendItem
          swatch={
            <span className="inline-block w-5 border-t border-dashed border-surface-sage" />
          }
          label="Always-on support feeds the pipeline"
        />
      </div>
    </article>
  );
}
