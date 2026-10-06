import * as React from "react";
import { ChevronRight, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, type AgentOutputStatus } from "@/state";
import { agentsById, specialistAgents, type AgentId } from "@/data/agents";
import { AIDot } from "@/components/ai/AIDot";
import { SpringIn } from "@/components/ai/SpringIn";
import { StatusPill } from "@/components/blocks/StatusPill";
import { PillButton } from "@/components/blocks/PillButton";
import { TopRow } from "@/components/blocks/TopRow";
import { AgentChat, type ChatTurn } from "@/components/agents/AgentChat";
import { AgentFlowDiagram } from "@/components/agents/AgentFlowDiagram";
import { CardHeader } from "@/components/agents/ConsoleKit";

/* ──────────────────────────────────────────────────────────────────────────
 * P2P Process Orchestrator console.
 *
 * The coordinator — no autonomy dial, no ceremony. It keeps shared context
 * across the five agents, sequences handoffs and routes the few exceptions a
 * person must own. Data surface: process metrics · the live agent-flow map ·
 * each agent's current output state · the cross-agent exception queue · chat.
 * ────────────────────────────────────────────────────────────────────────── */

type Metric = { label: string; value: string; sub: string };
const metrics: Metric[] = [
  { label: "Touchless rate", value: "82%", sub: "target 85%" },
  { label: "PR → PO median", value: "4.2h", sub: "was 11 days" },
  { label: "Exception rate", value: "6.1%", sub: "−2 pts MoM" },
  { label: "Agents online", value: "7 / 7", sub: "1 needs a look" },
];

const OUT_PILL: Record<AgentOutputStatus, { label: string; kind: "active" | "critical" | "neutral" }> = {
  none: { label: "Queued", kind: "neutral" },
  pending: { label: "On pending", kind: "neutral" },
  approved: { label: "Approved", kind: "active" },
  rejected: { label: "Rejected", kind: "critical" },
  escalated: { label: "Escalated", kind: "critical" },
};

type Exc = { id: AgentId; title: string; detail: string; tag: string };
const exceptions: Exc[] = [
  { id: "po", title: "PO-77310 · over-threshold approval", detail: "Compliant + budget OK · waiting on your sign-off", tag: "Decision" },
  { id: "sourcing", title: "Strategic category · belt-drive overhaul", detail: "Above the spot-buy threshold → sourcing manager", tag: "Sign-off" },
  { id: "vendor", title: "Midwest Belting duplicate · conf 0.88", detail: "Below the auto-merge bar → data steward", tag: "Review" },
  { id: "invoice", title: "INV-MW-0991 · $310 price variance", detail: "Root cause found · resolution drafted", tag: "Proposed" },
];

const chatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the P2P Process Orchestrator — I sequence the five agents, keep shared context and route the exceptions that need you. Ask me where things stand.",
        children: (
          <div className="text-[12.5px] text-ink leading-[19px]">
            <div className="text-mute mb-1">For example —</div>
            <ul className="space-y-0.5">
              <li>· Where's the belt order now</li>
              <li>· What needs me today</li>
              <li>· How touchless are we</li>
            </ul>
          </div>
        ),
      },
    ],
    chips: ["Where's the belt order?", "What needs me today?", "How touchless are we?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "The double-backer belt is mid-pipeline — Intake raised PR-48201, Sourcing recommended BeltPro and the PO agent is holding PO-77310 for your approval. I'm carrying the shared context across all three.",
      },
    ],
    chips: ["What needs me today?", "How touchless are we?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "Three things: the PO over-threshold approval, a strategic-category sign-off in Sourcing and a Midwest duplicate the Vendor agent couldn't auto-merge. Everything else is running touchless.",
      },
    ],
    chips: ["How touchless are we?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "82% of orders ran end-to-end with no human touch this month, median requisition-to-order 4.2 hours — down from 11 days. The 18% that stop are the exceptions I route to you here.",
      },
    ],
  },
];

function OrchestratorHero() {
  const agent = agentsById.orchestrator;
  const Icon = agent.icon;
  return (
    <SpringIn>
      <section className="bg-white border border-divider rounded-md p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-surface-deep flex items-center justify-center shrink-0">
            <Icon size={20} strokeWidth={1.9} color="var(--ink-inverse)" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[19px] font-bold text-ink leading-tight">{agent.name}</h1>
              <StatusPill label="Coordinating" kind="active" pulse />
            </div>
            <p className="text-[13px] text-mute leading-snug mt-1 max-w-2xl">{agent.purpose}</p>
          </div>
          <div className="text-right shrink-0 pl-3">
            <div className="text-[18px] font-bold text-surface-deep leading-none">{agent.stat}</div>
            <div className="text-[10px] tracking-[0.06em] uppercase text-mute mt-1">Coordinator · L4</div>
          </div>
        </div>
      </section>
    </SpringIn>
  );
}

function MetricsStrip() {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <div key={m.label} className="bg-white border border-divider rounded-md px-4 py-3">
          <div className="text-[10px] tracking-[0.05em] uppercase text-mute font-medium">{m.label}</div>
          <div className="text-[22px] font-bold text-surface-deep tabular-nums leading-none mt-1.5">{m.value}</div>
          <div className="text-[11px] text-mute leading-snug mt-1">{m.sub}</div>
        </div>
      ))}
    </section>
  );
}

function PipelineStatusPanel() {
  const { agentOutputs, go } = useApp();
  return (
    <article className="bg-white border border-divider rounded-md p-5 flex flex-col h-full">
      <CardHeader label="Pipeline status · live" right={<span className="text-[11px] text-mute">5 agents</span>} />
      <div className="mt-3 divide-y divide-divider flex-1">
        {specialistAgents.map((a) => {
          const Icon = a.icon;
          const pill = OUT_PILL[agentOutputs[a.id]];
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => go({ kind: "agent", id: a.id })}
              className="ui-pill w-full flex items-center gap-3 py-2.5 text-left hover:bg-surface-fog rounded"
            >
              <span className="w-7 h-7 rounded-md bg-surface-mint flex items-center justify-center shrink-0">
                <Icon size={15} strokeWidth={2} className="text-surface-deep" />
              </span>
              <span className="text-[12.5px] font-medium text-ink flex-1 min-w-0 truncate">{a.menuLabel}</span>
              <StatusPill label={pill.label} kind={pill.kind} pulse={agentOutputs[a.id] === "approved"} />
              <ChevronRight size={14} className="text-mute shrink-0" />
            </button>
          );
        })}
      </div>
    </article>
  );
}

function ExceptionQueuePanel() {
  const { go } = useApp();
  return (
    <article className="bg-white border border-divider rounded-md p-5 flex flex-col h-full">
      <CardHeader
        label="Exception queue · routed to a person"
        right={<span className="text-[11px] font-bold text-surface-deep bg-surface-mint px-2 py-0.5 rounded-full">4 open</span>}
      />
      <div className="mt-3 space-y-2 flex-1">
        {exceptions.map((e) => (
          <button
            key={e.title}
            type="button"
            onClick={() => go({ kind: "agent", id: e.id })}
            className="ui-pill w-full flex items-start gap-3 rounded-md bg-surface-fog/70 px-3 py-2.5 text-left hover:bg-surface-fog"
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-[12.5px] font-bold text-ink truncate">{e.title}</span>
                <span className="ml-auto text-[9px] tracking-[0.05em] uppercase font-bold text-surface-deep bg-surface-mint px-1.5 py-0.5 rounded shrink-0">
                  {e.tag}
                </span>
              </span>
              <span className="block text-[11.5px] text-mute leading-snug mt-0.5">{e.detail}</span>
              <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.04em] uppercase font-medium text-surface-deep mt-1.5">
                <AIDot size={5} tone="deep" pulse /> {agentsById[e.id].menuLabel} agent
              </span>
            </span>
            <ChevronRight size={14} className="text-mute shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </article>
  );
}

export function OrchestratorConsole() {
  const { go } = useApp();
  const [chatHidden, setChatHidden] = React.useState(true);
  return (
    <div className="pl-5 pr-6 pt-4 pb-10 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <TopRow breadcrumb={{ label: "Agent workforce", chip: "Orchestrator" }} />

      <div
        className={cn(
          "mt-3 grid grid-cols-1 gap-3 items-start",
          !chatHidden && "lg:grid-cols-[1fr_360px]",
        )}
      >
        <div className="space-y-3 min-w-0">
          <OrchestratorHero />
          <MetricsStrip />
          <AgentFlowDiagram />
          <div className="grid grid-cols-2 gap-3 items-stretch">
            <PipelineStatusPanel />
            <ExceptionQueuePanel />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-md bg-white border border-divider px-5 py-4">
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-ink">See the workforce in the live run</div>
              <p className="text-[12px] text-mute leading-snug mt-0.5">
                The orchestrator sequences all five agents and routes the one decision to you.
              </p>
            </div>
            <PillButton variant="deep" size="sm" arrow onClick={() => go({ kind: "workspace", flow: "belt" })}>
              <span className="inline-flex items-center gap-1">
                Open the belt run <ChevronRight size={14} />
              </span>
            </PillButton>
          </div>
        </div>

        {!chatHidden && (
          <aside className="lg:sticky lg:top-4">
            <div className="rounded-md border border-divider overflow-hidden h-[calc(100vh-2rem)]">
              <AgentChat
                agentName="Orchestrator"
                script={chatScript}
                onHide={() => setChatHidden(true)}
              />
            </div>
          </aside>
        )}
      </div>

      {chatHidden && (
        <button
          type="button"
          onClick={() => setChatHidden(false)}
          className="ui-pill fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-surface-deep text-ink-inverse px-4 py-2.5 text-[13px] font-bold shadow-lg hover:bg-accent-green"
        >
          <Bot size={16} strokeWidth={1.9} /> Chat with Orchestrator
        </button>
      )}
    </div>
  );
}
