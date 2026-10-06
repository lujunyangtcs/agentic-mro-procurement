import * as React from "react";
import { useApp, type AgentOutputStatus } from "@/state";
import { cn } from "@/lib/utils";
import { RfqComparison } from "@/components/docs/sap/RfqComparison";
import { SupplierPoolDoc, ExternalMatchDoc, OutlineAgreementDoc } from "@/components/docs/sources";
import { DataTable, CellTag } from "@/components/blocks/DataTable";
import {
  AgentConsole,
  CardHeader,
  QueuePanel,
  CeremonyModal,
  type ConsoleConfig,
  type OutputMeta,
  type QueueItem,
} from "@/components/agents/ConsoleKit";
import type { ChatTurn } from "@/components/agents/AgentChat";

/* ──────────────────────────────────────────────────────────────────────────
 * Tactical Sourcing & Spot-Buy Agent console.
 *
 * Takes an approved PR or category event and runs the operational tender:
 * auto-RFQ, three bids, scored shortlist. Data surface: sourcing-event queue ·
 * qualified supplier pool · active contracts & pricing · historical RFQ
 * outcomes · supplier risk. The ceremony reveals the price comparison and hands
 * the award to the PO agent.
 * ────────────────────────────────────────────────────────────────────────── */

const queue: QueueItem[] = [
  {
    id: "pr-48201",
    primary: "PR-48201 · double-backer belt",
    secondary: "MRO-CONV · spot tender under the threshold · 3 qualified sources",
    meta: "09:06",
    readyTag: "Ready to tender",
    actionable: true,
  },
  {
    id: "evt-pkg",
    primary: "Stretch wrap · category event",
    secondary: "Consumables · auto-RFQ to 4 sources · awaiting quotes",
    meta: "08:10",
    handledTag: "Bids in · scoring",
  },
  {
    id: "pr-48160",
    primary: "PR-48160 · gearbox oil (bulk)",
    secondary: "Apex framework · catalog price held",
    meta: "Yesterday",
    handledTag: "Awarded · on contract",
  },
];

type Supplier = { name: string; code: string; perf: string; health: string; tag: "Contracted" | "Preferred" | "Spot"; match?: boolean };
const pool: Supplier[] = [
  { name: "BeltPro Industrial", code: "100482", perf: "99.1% OTIF · A", health: "D&B 4A1 · low risk", tag: "Contracted", match: true },
  { name: "Heartland Rubber", code: "100774", perf: "96.4% OTIF · B", health: "D&B 3A2 · medium", tag: "Preferred" },
  { name: "Midwest Belting Co", code: "101355", perf: "95.0% OTIF · B", health: "D&B 2A3 · medium", tag: "Spot" },
];

type Contract = { ref: string; supplier: string; terms: string; match?: boolean };
const contracts: Contract[] = [
  { ref: "4600001207", supplier: "BeltPro Industrial", terms: "Conveyor & belting · −8% vs list · Net 30 · 5-day lead", match: true },
  { ref: "—", supplier: "Heartland Rubber", terms: "Preferred · spot quotes · Net 30 · 7–10 day lead" },
  { ref: "—", supplier: "Midwest Belting Co", terms: "Spot only · Net 45 · 12-day lead" },
];

type RfqHist = { tender: string; category: string; outcome: string };
const rfqHistory: RfqHist[] = [
  { tender: "RFQ-6600-2188", category: "Double-backer belt", outcome: "BeltPro · −8% · 5d" },
  { tender: "RFQ-6600-2091", category: "Idler rollers", outcome: "BeltPro · −7.5% · 6d" },
  { tender: "RFQ-6600-1955", category: "Wear strips", outcome: "Heartland · spot · 9d" },
];

type Risk = { supplier: string; financial: string; geo: string; esg: string };
const risk: Risk[] = [
  { supplier: "BeltPro Industrial", financial: "Low", geo: "Low · US-TN", esg: "B+ · disclosed" },
  { supplier: "Heartland Rubber", financial: "Medium", geo: "Low · US-OH", esg: "C · partial" },
  { supplier: "Midwest Belting Co", financial: "Medium", geo: "Low · US-IL", esg: "C · partial" },
];

const outputMeta: OutputMeta = {
  none: { label: "No award yet", kind: "neutral", note: "Open the sourcing event to run the three-bid tender." },
  pending: { label: "On pending", kind: "neutral", note: "Tender RFQ-6600-2241 parked — resume from the queue." },
  approved: {
    label: "Awarded · handed off",
    kind: "active",
    note: "BeltPro recommendation handed to the PO agent for order creation.",
  },
  rejected: { label: "Rejected", kind: "critical", note: "Award rejected — re-tender or source manually." },
  escalated: { label: "Escalated", kind: "critical", note: "Routed to the category sourcing manager with the bid analysis." },
};

const chatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the Tactical Sourcing Agent — I run the RFQ, score the bids and recommend an award for operational buys. Ask me about this tender.",
        children: (
          <div className="text-[12.5px] text-ink leading-[19px]">
            <div className="text-mute mb-1">For example —</div>
            <ul className="space-y-0.5">
              <li>· Why BeltPro won</li>
              <li>· How the bids were scored</li>
              <li>· What would go to a sourcing manager</li>
            </ul>
          </div>
        ),
      },
    ],
    chips: ["Why did BeltPro win?", "How were bids scored?", "What would escalate this?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "Lowest delivered cost at $48,200, the shortest lead time at 5 days, and the only on-contract bid (framework 4600001207, −8% vs list). Heartland and Midwest came in $2.2k–$3.9k higher and 4–7 days slower.",
      },
    ],
    chips: ["How were bids scored?", "What would escalate this?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "Weighted on delivered cost, lead time, quality (OTIF history) and supplier risk. BeltPro tops every dimension here, so the recommendation is unambiguous — no negotiation round needed.",
      },
    ],
    chips: ["What would escalate this?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "A strategic category, a new-supplier introduction, spend over the threshold or a risk score above the line would stop the auto-path and route to a human sourcing manager with the full bid analysis attached.",
      },
    ],
  },
];

const config: ConsoleConfig = {
  id: "sourcing",
  statLabel: "Tenders",
  artifactLabel: "Supplier recommendation · BeltPro Industrial",
  outputMeta,
  chatName: "Sourcing agent",
  chatScript,
  runRole: "Runs the three-bid spot tender and recommends the on-contract supplier.",
  openRunLabel: "Open the sourcing event",
};

const tagTone = { Contracted: "deep", Preferred: "sage", Spot: "neutral" } as const;

function AwardNote() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-surface-deep font-medium">
      <span className="w-3 h-3 rounded-sm bg-surface-mint border border-surface-deep/40" />
      Recommended award
    </span>
  );
}

function SupplierPoolPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Qualified supplier pool" right={<AwardNote />} />
      <div className="mt-4">
        <DataTable
          rows={pool}
          rowKey={(s) => s.code}
          highlight={(s) => !!s.match}
          openDoc={(_s, i) => (i === 0 ? <SupplierPoolDoc /> : null)}
          openTitle={() => "Approved supplier pool · MRO-CONV"}
          columns={[
            {
              header: "Supplier",
              cell: (s) => (
                <span className={cn("font-semibold", s.match && "text-surface-deep")}>{s.name}</span>
              ),
            },
            { header: "Status", cell: (s) => <CellTag tone={tagTone[s.tag]}>{s.tag}</CellTag> },
            { header: "Performance", cell: (s) => s.perf },
            { header: "Financial health", cell: (s) => s.health },
            { header: "Code", align: "right", cell: (s) => s.code },
          ]}
        />
      </div>
    </article>
  );
}

function RiskPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Supplier risk" />
      <div className="mt-4">
        <DataTable
          rows={risk}
          rowKey={(r) => r.supplier}
          openDoc={(_r, i) => (i === 0 ? <ExternalMatchDoc /> : null)}
          openTitle={() => "External risk · Dun & Bradstreet"}
          columns={[
            { header: "Supplier", cell: (r) => <span className="font-semibold">{r.supplier}</span> },
            { header: "Financial", cell: (r) => r.financial },
            { header: "Geography", cell: (r) => r.geo },
            { header: "ESG", cell: (r) => r.esg },
          ]}
        />
      </div>
    </article>
  );
}

function ContractsPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Active contracts & pricing" right={<AwardNote />} />
      <div className="mt-4">
        <DataTable
          rows={contracts}
          rowKey={(c) => c.supplier}
          highlight={(c) => !!c.match}
          openDoc={(_c, i) => (i === 0 ? <OutlineAgreementDoc /> : null)}
          openTitle={() => "Outline agreement · 4600001207"}
          columns={[
            {
              header: "Supplier",
              cell: (c) => (
                <span className={cn("font-semibold", c.match && "text-surface-deep")}>{c.supplier}</span>
              ),
            },
            { header: "Terms", cell: (c) => c.terms },
            {
              header: "Agreement",
              align: "right",
              cell: (c) => (c.ref === "—" ? <span className="text-mute">—</span> : c.ref),
            },
          ]}
        />
      </div>
    </article>
  );
}

function RfqHistoryPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Historical RFQ outcomes" />
      <div className="mt-4">
        <DataTable
          rows={rfqHistory}
          rowKey={(h) => h.tender}
          openDoc={(_h, i) => (i === 0 ? <RfqComparison /> : null)}
          openTitle={() => "RFQ comparison · RFQ-6600-2188"}
          columns={[
            { header: "Tender", cell: (h) => <span className="font-semibold text-surface-deep">{h.tender}</span> },
            { header: "Category", cell: (h) => h.category },
            { header: "Outcome", cell: (h) => h.outcome },
          ]}
        />
      </div>
    </article>
  );
}

function SourcingContext() {
  return (
    <div className="rounded-md border border-divider bg-surface-fog/60 px-4 py-3">
      <div className="text-[11px] tracking-[0.05em] uppercase text-surface-deep font-bold">Sourcing event</div>
      <div className="text-[13px] font-bold text-ink mt-1">PR-48201 · double-backer belt 88-DBX</div>
      <p className="text-[12.5px] text-ink leading-snug mt-1">
        Approved requisition · MRO-CONV · qty 1 · target delivery 2026-06-10. Under the spot-buy threshold with three
        qualified sources — runs as an automated three-bid mini-tender.
      </p>
    </div>
  );
}

export function SourcingConsole() {
  const { setAgentOutput, go } = useApp();
  const [open, setOpen] = React.useState(false);

  const decide = (status: AgentOutputStatus) => {
    setAgentOutput("sourcing", status);
    if (status === "approved") go({ kind: "workspace", flow: "belt" });
    else setOpen(false);
  };

  return (
    <>
      <AgentConsole config={config} onOpenRun={() => setOpen(true)}>
        <QueuePanel title="Sourcing events · ready to tender" badge="1 ready" items={queue} onOpen={() => setOpen(true)} />
        <SupplierPoolPanel />
        <RiskPanel />
        <ContractsPanel />
        <RfqHistoryPanel />
      </AgentConsole>

      {open && (
        <CeremonyModal
          title="PR-48201 · run the three-bid tender"
          subtitle="Approved requisition · MRO-CONV · spot tender under the threshold"
          context={<SourcingContext />}
          ceremony={{
            agentLabel: "Sourcing agent · running the tender",
            steps: [
              "Reading approved requisition PR-48201",
              "Pulling the qualified supplier pool — 3 sources",
              "Auto-drafting the RFQ — specs, terms, evaluation criteria",
              "Collecting and normalising the three bids",
              "Scoring price, lead time, quality and risk",
              "Ranking and recommending the award",
            ],
            doneSummary: (
              <>
                <span className="font-bold">BeltPro Industrial</span> wins on delivered cost ($48,200), lead time
                (5d) and is the only on-contract bid. Recommended for award and handed to the PO agent.
              </>
            ),
            document: <RfqComparison />,
            footerIntro: "The agent will draft the RFQ, collect three bids, score them and recommend an award.",
            approveLabel: "Approve award & hand off",
          }}
          onClose={() => setOpen(false)}
          onDecide={decide}
        />
      )}
    </>
  );
}
