/**
 * What one agent in the workforce actually does.
 *
 * Everything here is read from the agent catalogue in `data/agents.ts` — the
 * same record the work menu, the cockpit pipeline and the run accountability
 * chips are built from, so an agent can never be described one way here and
 * another way where it does its work.
 */

import { useApp, type FlowId } from "@/mro/state";
import type { AgentId } from "@/mro/data/agents";
import { agentsById, AUTONOMY_LABEL } from "@/mro/data/agents";
import { useProcurement } from "@/mro/data/store";
import { exceptionLanes } from "@/mro/data/procurement";
import { ConsolePage, Panel } from "@/mro/components/console/kit";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { AiFinding } from "@/mro/components/console/kit";
import { PillButton } from "@/mro/components/blocks/PillButton";
import { ArrowRight, ArrowDownToLine, ArrowUpFromLine, TriangleAlert } from "lucide-react";
import { ICON } from "@/mro/components/console/icons";

function List({
  title,
  icon,
  items,
  tone = "ink",
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  tone?: "ink" | "red";
}) {
  return (
    <Panel title={title} className="h-full">
      <ul className="divide-y divide-divider border-t border-divider">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2.5 px-4 py-2.5">
            <span className={tone === "red" ? "text-mark-red" : "text-mute"}>{icon}</span>
            <span className="text-[13px] leading-[19px] text-ink">{i}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/**
 * The run this agent leads, so "open the run" lands where the agent's own work
 * is on show rather than always on the seal case.
 */
const runFor = (id: AgentId): FlowId => {
  if (id === "vendor") return "onboarding";
  if (id === "intake") return "bearing";
  return "pump";
};

export function AgentProfile({ id }: { id: AgentId }) {
  const { go } = useApp();
  const { requisitions } = useProcurement();
  const agent = agentsById[id];

  /* What this agent is currently holding, straight from the live records. */
  const held = exceptionLanes(requisitions).filter((l) => l.raisedBy === agent.name);
  const holding = held.reduce((n, l) => n + l.count, 0);

  return (
    <ConsolePage
      title={agent.name}
      lead="What this agent does, what it hands on, and when it stops for you."
      actions={
        <PillButton variant="secondary" onClick={() => go({ kind: "exceptions" })} arrow>
          See what it stopped
        </PillButton>
      }
    >
      {/* The full job description, in full — the page lead stays one line. */}
      <SpringIn>
        <p className="rounded-md border border-divider bg-white px-4 py-3.5 text-[13px] leading-[19px] text-ink">
          {agent.purpose}
        </p>
      </SpringIn>

      <SpringIn>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-md border border-divider bg-white px-4 py-3.5">
            <div className="text-[13px] text-mute">Autonomy</div>
            <div className="mt-0.5 text-[15px] font-bold text-ink">
              {agent.coordinator ? "Coordinates the workforce" : AUTONOMY_LABEL[agent.autonomy]}
            </div>
          </div>
          <div className="rounded-md border border-divider bg-white px-4 py-3.5">
            <div className="text-[13px] text-mute">Throughput</div>
            <div className="mt-0.5 text-[15px] font-bold text-ink">{agent.stat}</div>
          </div>
          <div className="rounded-md border border-divider bg-white px-4 py-3.5">
            <div className="text-[13px] text-mute">Holding for a person right now</div>
            <div className="mt-0.5 text-[15px] font-bold text-ink">
              {holding} {holding === 1 ? "request" : "requests"}
            </div>
          </div>
        </div>
      </SpringIn>

      <AiFinding text={agent.autonomyRule} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 items-stretch">
        <List
          title="What it reads"
          icon={<ArrowDownToLine size={ICON.row} strokeWidth={ICON.stroke} />}
          items={agent.inputs}
        />
        <List
          title="What it produces"
          icon={<ArrowUpFromLine size={ICON.row} strokeWidth={ICON.stroke} />}
          items={agent.outputs}
        />
      </div>

      <List
        title="When it stops and asks a person"
        icon={<TriangleAlert size={ICON.row} strokeWidth={ICON.stroke} />}
        items={agent.escalation}
        tone="red"
      />

      {agent.note && (
        <Panel title="Why this one matters">
          <p className="px-4 pb-4 pt-1 text-[13px] leading-[19px] text-mute">{agent.note}</p>
        </Panel>
      )}

      <Panel title="Where it runs" sub="Follow a real requisition through the whole workforce.">
        <div className="flex items-center justify-between gap-4 px-4 pb-4 pt-1">
          <p className="text-[13px] text-mute">
            The guided run shows this agent handing off to the next, with the document it
            produced at every step.
          </p>
          <button
            type="button"
            onClick={() => go({ kind: "workspace", flow: runFor(id) })}
            className="ui-pill inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-surface-deep px-3.5 py-2 text-[13px] font-medium text-ink-inverse hover:brightness-110"
          >
            Open the run
            <ArrowRight size={ICON.row} strokeWidth={ICON.stroke} />
          </button>
        </div>
      </Panel>
    </ConsolePage>
  );
}
