import * as React from "react";
import { useApp, type AgentOutputStatus } from "@/state";
import { cn } from "@/lib/utils";
import { PurchaseOrder } from "@/components/docs/sap/PurchaseOrder";
import { OutlineAgreementDoc, VendorRecordDoc } from "@/components/docs/sources";
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
 * PO Management Agent console.
 *
 * Owns the order end-to-end: reads an approved requisition, binds it to the
 * contract, checks budget headroom, drafts a contract-bound SAP PO, then
 * monitors and expedites open orders to on-time delivery. Data surface:
 * approved-PR queue · supplier+contract · contract terms · budget-headroom bar ·
 * open-order expediting. The ceremony reveals PO-77310 and tracks it to the
 * Invoice agent.
 * ────────────────────────────────────────────────────────────────────────── */

const queue: QueueItem[] = [
  {
    id: "pr-48201",
    primary: "PR-48201 · double-backer belt",
    secondary: "BeltPro Industrial · 88-DBX · $48,200 · on framework 4600001207",
    meta: "09:04",
    readyTag: "Ready to draft PO",
    actionable: true,
  },
  {
    id: "pr-48190",
    primary: "PR-48190 · hydraulic hose assy",
    secondary: "Grainger · punchout catalog · $1,240",
    meta: "08:30",
    handledTag: "PO-77305 posted",
  },
  {
    id: "pr-48177",
    primary: "PR-48177 · drive bearing set",
    secondary: "Apex Power Transmission · $9,860 · framework 4600000934",
    meta: "Yesterday",
    handledTag: "PO-77298 posted",
  },
];

type Term = { label: string; value: string };
const contractTerms: Term[] = [
  { label: "Price", value: "$48,200 net · −8% vs list (PB00/RA01)" },
  { label: "Lead time", value: "5 days · framework standard" },
  { label: "Quality", value: "A · 99.1% OTIF · inspection waived" },
  { label: "Payment", value: "Net 30 · NT30" },
  { label: "SLA", value: "On-time ≥ 98% · 24h ack" },
];

type HistRow = { po: string; item: string; value: string; lead: string };
const history: HistRow[] = [
  { po: "PO-77188", item: "Double-backer belt 88-DBX", value: "$47,900", lead: "5d · on time" },
  { po: "PO-76920", item: "Idler roller set", value: "$12,400", lead: "4d · on time" },
  { po: "PO-76551", item: "Corrugator wear strips", value: "$6,180", lead: "6d · on time" },
];

const BUDGET = { used: 312_400, commit: 48_200, total: 500_000 };

const outputMeta: OutputMeta = {
  none: { label: "No PO yet", kind: "neutral", note: "Open the approved requisition to draft a purchase order." },
  pending: { label: "On pending", kind: "neutral", note: "PO-77310 parked — resume it from the queue when ready." },
  approved: {
    label: "Approved · posted to SAP",
    kind: "active",
    note: "PO-77310 posted, tracked through delivery, and handed to the Invoice agent for matching.",
  },
  rejected: { label: "Rejected", kind: "critical", note: "PO-77310 was rejected — nothing posted." },
  escalated: { label: "Escalated", kind: "critical", note: "Routed to the buyer for approval with the draft PO attached." },
};

const chatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the Purchase Order Agent — I turn an approved requisition into a contract-bound PO, budget-check it and post to SAP. Ask me about the order.",
        children: (
          <div className="text-[12.5px] text-ink leading-[19px]">
            <div className="text-mute mb-1">For example —</div>
            <ul className="space-y-0.5">
              <li>· How the PO is priced from the contract</li>
              <li>· Whether budget covers it</li>
              <li>· What needs an approver</li>
            </ul>
          </div>
        ),
      },
    ],
    chips: ["How is PO-77310 priced?", "Is there budget?", "Why does this need approval?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "Off the BeltPro framework 4600001207, item 10 — list $52,391.30 less the −8% RA01 discount lands the net at $48,200.00. No manual price entry; it's all condition records.",
      },
    ],
    chips: ["Is there budget?", "Why does this need approval?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "Cost center 0000041702 has $187,600 headroom this period; the $48,200 commitment leaves $139,400. Comfortably within budget, so no over-run flag.",
      },
    ],
    chips: ["Why does this need approval?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I run at L2 by default — I draft and wait. The order's contract-compliant and in budget, so it's a one-click approve; raise the dial to L3 and contract-clean orders under the ceiling post on their own.",
      },
    ],
  },
];

const config: ConsoleConfig = {
  id: "po",
  statLabel: "Orders",
  artifactLabel: "Purchase order · PO-77310",
  outputMeta,
  chatName: "Purchase Order agent",
  chatScript,
  runRole: "Drafts purchase order PO-77310, bound to the framework contract.",
  openRunLabel: "Open the approved PR",
};

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

type SupplierField = { field: string; value: React.ReactNode; key: boolean };
const supplierContract: SupplierField[] = [
  {
    field: "Supplier",
    key: true,
    value: (
      <span className="inline-flex items-center gap-2">
        BeltPro Industrial
        <CellTag tone="deep">Contracted</CellTag>
      </span>
    ),
  },
  { field: "Vendor", key: true, value: "100482" },
  { field: "Category", key: false, value: "Conveyor & belting (MRO-CONV) · sole on-contract source" },
  { field: "Outline agreement", key: true, value: "4600001207 · item 10" },
  { field: "Validity", key: false, value: "MRO framework · −8% vs list · valid to 2026-12-31" },
];

function SupplierContractPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Selected supplier & contract" />
      <div className="mt-4">
        <DataTable
          rows={supplierContract}
          rowKey={(r) => r.field}
          highlight={(r) => r.key}
          openDoc={(_r, i) => (i === 0 ? <VendorRecordDoc variant="golden" /> : null)}
          openTitle={() => "Vendor master · 100482 BeltPro"}
          columns={[
            { header: "Field", className: "w-44", cell: (r) => <span className="font-semibold">{r.field}</span> },
            { header: "Detail", cell: (r) => r.value },
          ]}
        />
      </div>
    </article>
  );
}

function ContractTermsPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Contract terms" />
      <div className="mt-4">
        <DataTable
          rows={contractTerms}
          rowKey={(t) => t.label}
          openDoc={(_t, i) => (i === 0 ? <OutlineAgreementDoc /> : null)}
          openTitle={() => "Outline agreement · 4600001207"}
          columns={[
            { header: "Term", className: "w-40", cell: (t) => <span className="font-semibold">{t.label}</span> },
            { header: "Detail", cell: (t) => t.value },
          ]}
        />
      </div>
    </article>
  );
}

function BudgetHeadroomPanel() {
  const usedPct = (BUDGET.used / BUDGET.total) * 100;
  const commitPct = (BUDGET.commit / BUDGET.total) * 100;
  const headroom = BUDGET.total - BUDGET.used - BUDGET.commit;
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader
        label="Budget headroom · cost center 0000041702"
        right={<span className="text-[11px] text-mute">MRO maintenance · this period</span>}
      />
      <div className="mt-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <span className="text-[22px] font-bold text-surface-deep tabular-nums leading-none">{usd(headroom)}</span>
            <span className="text-[12px] text-mute ml-2">headroom after this PO</span>
          </div>
          <span className="text-[11px] text-mute tabular-nums">of {usd(BUDGET.total)}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-surface-fog overflow-hidden flex">
          <div className="h-full bg-surface-deep" style={{ width: `${usedPct}%` }} title="Committed to date" />
          <div className="h-full bg-surface-sage" style={{ width: `${commitPct}%` }} title="This PO" />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2.5 text-[11px]">
          <span className="flex items-center gap-1.5 text-mute">
            <span className="w-2.5 h-2.5 rounded-sm bg-surface-deep" /> Committed {usd(BUDGET.used)}
          </span>
          <span className="flex items-center gap-1.5 text-mute">
            <span className="w-2.5 h-2.5 rounded-sm bg-surface-sage" /> This PO {usd(BUDGET.commit)}
          </span>
          <span className="flex items-center gap-1.5 text-mute">
            <span className="w-2.5 h-2.5 rounded-sm bg-surface-fog border border-divider" /> Free {usd(headroom)}
          </span>
        </div>
      </div>
    </article>
  );
}

function HistoryPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Historical PO patterns · BeltPro Industrial" />
      <div className="mt-4">
        <DataTable
          rows={history}
          rowKey={(r) => r.po}
          openDoc={(_r, i) => (i === 0 ? <PurchaseOrder /> : null)}
          openTitle={() => "Purchase order · PO-77188"}
          columns={[
            { header: "Order", cell: (r) => <span className="font-semibold text-surface-deep">{r.po}</span> },
            { header: "Item", cell: (r) => r.item },
            { header: "Value", align: "right", cell: (r) => r.value },
            { header: "Lead time", align: "right", cell: (r) => <span className="text-mute">{r.lead}</span> },
          ]}
        />
      </div>
    </article>
  );
}

type Expedite = { po: string; item: string; status: string; due: string; tone: "ok" | "warn" | "risk" };
const expediting: Expedite[] = [
  { po: "PO-77310", item: "Double-backer belt 88-DBX", status: "Acknowledged · shipped, ETA on time", due: "On track", tone: "ok" },
  { po: "PO-76840", item: "Winder drum motor", status: "Expedite note #2 sent to supplier", due: "4 days late", tone: "risk" },
  { po: "PO-76980", item: "Roll wrapping film", status: "Chasing supplier acknowledgement", due: "2 days late", tone: "warn" },
  { po: "PO-75540", item: "MRO bearings", status: "Short 12 units · flagged to buyer", due: "3 days late", tone: "warn" },
];

function ExpeditingPanel() {
  const toneTag = { ok: "sage", warn: "amber", risk: "red" } as const;
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader
        label="Expediting · open orders to delivery"
        right={<span className="text-[11px] text-mute">1,940 open · 47 chased today</span>}
      />
      <div className="mt-4">
        <DataTable
          rows={expediting}
          rowKey={(e) => e.po}
          highlight={(e) => e.po === "PO-77310"}
          columns={[
            { header: "Order", cell: (e) => <span className="font-semibold text-surface-deep">{e.po}</span> },
            { header: "Item", cell: (e) => e.item },
            { header: "Status", cell: (e) => <span className="text-mute">{e.status}</span> },
            { header: "Delivery", align: "right", cell: (e) => <CellTag tone={toneTag[e.tone]}>{e.due}</CellTag> },
          ]}
        />
      </div>
    </article>
  );
}

function POContext() {
  return (
    <div className={cn("rounded-md border border-divider bg-surface-fog/60 px-4 py-3")}>
      <div className="text-[11px] tracking-[0.05em] uppercase text-surface-deep font-bold">Approved requisition</div>
      <div className="text-[13px] font-bold text-ink mt-1">PR-48201 · double-backer belt 88-DBX</div>
      <p className="text-[12.5px] text-ink leading-snug mt-1">
        Released by the Intake agent · supplier BeltPro Industrial on framework 4600001207 · $48,200 · delivery
        2026-06-10 to the Containerboard mill (M042). Ready to convert to a purchase order.
      </p>
    </div>
  );
}

export function POConsole() {
  const { setAgentOutput, go } = useApp();
  const [open, setOpen] = React.useState(false);

  const decide = (status: AgentOutputStatus) => {
    setAgentOutput("po", status);
    if (status === "approved") go({ kind: "workspace", flow: "belt" });
    else setOpen(false);
  };

  return (
    <>
      <AgentConsole config={config} onOpenRun={() => setOpen(true)}>
        <QueuePanel
          title="Approved requisitions · ready for PO"
          badge="1 ready"
          items={queue}
          onOpen={() => setOpen(true)}
        />
        <SupplierContractPanel />
        <ContractTermsPanel />
        <BudgetHeadroomPanel />
        <ExpeditingPanel />
        <HistoryPanel />
      </AgentConsole>

      {open && (
        <CeremonyModal
          title="PR-48201 · build the purchase order"
          subtitle="Approved by Intake · BeltPro Industrial · $48,200 · 2026-06-03"
          context={<POContext />}
          ceremony={{
            agentLabel: "PO agent · building the order",
            steps: [
              "Reading approved requisition PR-48201",
              "Binding to BeltPro framework 4600001207 · item 10",
              "Pricing the line from contract conditions — −8% vs list",
              "Checking budget headroom — cost center 0000041702",
              "Populating PO fields · compliance check vs contract",
              "Drafting purchase order PO-77310",
            ],
            doneSummary: (
              <>
                Contract-bound · <span className="font-bold">$48,200</span> net at −8% · within budget headroom and
                the L2 limit. PO-77310 drafted and ready to post to SAP.
              </>
            ),
            document: <PurchaseOrder />,
            footerIntro: "The agent will bind contract terms, price the line, budget-check and populate every PO field.",
            approveLabel: "Approve & post to SAP",
          }}
          onClose={() => setOpen(false)}
          onDecide={decide}
        />
      )}
    </>
  );
}
