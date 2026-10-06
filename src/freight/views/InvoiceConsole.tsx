import * as React from "react";
import { useApp, type AgentOutputStatus } from "@/freight/state";
import { cn } from "@/freight/lib/utils";
import {
  ThreeWayMatchDoc,
  CarrierInvoiceDoc,
  RateCardDoc,
  GateLogDoc,
  WeighTicketDoc,
} from "@/freight/components/docs/freight/FreightDocs";
import { DataTable, CellTag } from "@/freight/components/blocks/DataTable";
import {
  AgentConsole,
  CardHeader,
  QueuePanel,
  CeremonyModal,
  type ConsoleConfig,
  type OutputMeta,
  type QueueItem,
} from "@/freight/components/agents/ConsoleKit";
import type { ChatTurn } from "@/freight/components/agents/AgentChat";

/* ──────────────────────────────────────────────────────────────────────────
 * Freight Settlement Matcher console.
 *
 * Runs the three-way check across carrier Invoice (PDF) · Shipment (SAP) ·
 * Contract rate card (Excel), clears in-tolerance lines for payment, and
 * surfaces only the non-standard lines as exceptions. Data surface: invoice
 * extraction with confidence · the three check sources · carrier remit master ·
 * exception signal · carrier query deflection. The ceremony settles the clean
 * lines on INV-SUM-5567 and drafts a dispute for the human to send.
 * ────────────────────────────────────────────────────────────────────────── */

const queue: QueueItem[] = [
  {
    id: "inv-sum-5567",
    primary: "INV-SUM-5567 · Summit Carriers",
    secondary: "$15,480.00 · lane CHI→RIV · shipment matched · ready to check",
    meta: "14:20",
    readyTag: "Ready to check",
    actionable: true,
  },
  {
    id: "inv-iwf-2207",
    primary: "INV-IWF-2207 · Ironwood Freight Lines",
    secondary: "$12,480.00 · three-way clean · settled for payment",
    meta: "1h",
    handledTag: "Auto-settled",
  },
  {
    id: "inv-cdr-0991",
    primary: "INV-CDR-0991 · Cedar Haul Logistics",
    secondary: "Fuel-surcharge format mismatch $310 over rate card · dispute drafted",
    meta: "3h",
    handledTag: "Dispute drafted",
  },
];

type Extract = { field: string; value: string; conf: number };
const extracted: Extract[] = [
  { field: "Carrier", value: "Summit Carriers · SCAC SUMT", conf: 0.99 },
  { field: "Invoice no.", value: "INV-SUM-5567", conf: 0.99 },
  { field: "Invoice date", value: "2026-06-09", conf: 0.98 },
  { field: "Lane", value: "CHI → RIV · Riverside mill", conf: 0.97 },
  { field: "Billed amount", value: "USD 15,480.00", conf: 0.99 },
  { field: "Shipment reference", value: "0085412 · OCC load", conf: 0.96 },
];

type Source = { label: string; ref: string; detail: string };
const sources: Source[] = [
  { label: "Contract rate card", ref: "RC-2026-CHI-RIV · v4", detail: "Linehaul, fuel & accessorial bands locked for CHI→RIV" },
  { label: "Shipment record", ref: "SAP 0085412 · CHI→RIV", detail: "44,180 lb OCC · delivered 2026-06-08 · 2 free hours" },
  { label: "Invoice", ref: "INV-SUM-5567", detail: "$15,480 billed · linehaul + fuel + accessorials" },
];

type Remit = { label: string; value: string };
const remittance: Remit[] = [
  { label: "Bank account", value: "Wells Fargo · ****4471 · ABA 121000248" },
  { label: "Payment terms", value: "NT30 · Net 30 days · baseline 2026-06-09" },
  { label: "Company code", value: "CF10 · Riverside mill · matched" },
  { label: "Remittance email", value: "billing@summit-carriers.com · on file" },
  { label: "Bank detail last changed", value: "None in 18 months · stable" },
];

type ExceptionCheck = { label: string; result: string };
const exceptionChecks: ExceptionCheck[] = [
  { label: "Duplicate-booking scan", result: "No prior INV-SUM-5567" },
  { label: "Linehaul vs rate card", result: "On band — clears $13,664" },
  { label: "Fuel-surcharge format", result: "Flat $ billed vs % band — flagged" },
  { label: "Detention / free-time", result: "5 hrs billed vs 2 free hrs — flagged" },
  { label: "Cube-out weight variance", result: "44,180 lb vs 41,000 lb rated — flagged" },
];
const EXCEPTION_RATE = 0.12;

const outputMeta: OutputMeta = {
  none: { label: "Not checked yet", kind: "neutral", note: "Open the invoice to run the three-way check." },
  pending: { label: "On pending", kind: "neutral", note: "INV-SUM-5567 parked — resume from the worklist." },
  approved: {
    label: "Settled · clean lines cleared",
    kind: "active",
    note: "Clean lines on INV-SUM-5567 settled for the Net-30 run; the $1,816 dispute is drafted for you to send.",
  },
  rejected: { label: "Rejected", kind: "critical", note: "Invoice rejected — a dispute note goes back to Summit Carriers." },
  escalated: { label: "Escalated", kind: "critical", note: "Exception raised — routed to the freight desk to resolve." },
};

const chatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the Freight Settlement Matcher — I run the three-way check on carrier invoices and clear in-tolerance lines to pay. Ask me about the worklist.",
        children: (
          <div className="text-[12.5px] text-ink leading-[19px]">
            <div className="text-mute mb-1">For example —</div>
            <ul className="space-y-0.5">
              <li>· Does INV-SUM-5567 clear</li>
              <li>· What's the exception</li>
              <li>· How much is disputed</li>
            </ul>
          </div>
        ),
      },
    ],
    chips: ["Does INV-SUM-5567 clear?", "What's the exception?", "How much is disputed?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "Mostly — the three-way check ties Invoice, Shipment and Contract rate card on CHI→RIV. Of $15,480 billed, $13,664 is on band and clears; $1,816 across 3 lines falls outside the rate card and is held as exceptions.",
      },
    ],
    chips: ["What's the exception?", "How much is disputed?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "Three non-standard lines: fuel surcharge billed flat-$ instead of the % band, 5 detention hours against 2 free hours on the shipment record, and a cube-out weight variance (44,180 lb billed vs 41,000 lb rated).",
      },
    ],
    chips: ["How much is disputed?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "$1,816 across those 3 lines. On your approval I settle the clean $13,664 for the Net-30 run and I've drafted a dispute to Summit Carriers for the $1,816 — you review and send it.",
      },
    ],
  },
];

const config: ConsoleConfig = {
  id: "invoice",
  statLabel: "Auto-clear rate",
  artifactLabel: "Three-way check · INV-SUM-5567",
  outputMeta,
  chatName: "Freight Settlement",
  chatScript,
  runRole: "Runs the three-way check on the carrier invoice, settles the clean lines on INV-SUM-5567 and drafts a dispute for the held lines.",
  openRunLabel: "Open the held invoice",
};

function confTone(conf: number) {
  if (conf >= 0.98) return "bg-surface-deep";
  if (conf >= 0.95) return "bg-surface-sage";
  return "bg-surface-rose";
}

function ExtractionPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Extracted invoice · carrier PDF" />
      <div className="mt-4">
        <DataTable
          rows={extracted}
          rowKey={(e) => e.field}
          openDoc={(_e, i) => (i === 0 ? <CarrierInvoiceDoc /> : null)}
          openTitle={() => "Carrier invoice · INV-SUM-5567"}
          columns={[
            { header: "Field", className: "w-36", cell: (e) => <span className="font-semibold">{e.field}</span> },
            { header: "Value", cell: (e) => e.value },
            {
              header: "Confidence",
              align: "right",
              className: "w-40",
              cell: (e) => (
                <span className="inline-flex items-center gap-2 justify-end">
                  <span className="h-1.5 w-16 rounded-full bg-surface-fog overflow-hidden">
                    <span className={cn("block h-full rounded-full", confTone(e.conf))} style={{ width: `${e.conf * 100}%` }} />
                  </span>
                  <span className="tabular-nums text-surface-deep w-8 text-right">{e.conf.toFixed(2)}</span>
                </span>
              ),
            },
          ]}
        />
      </div>
    </article>
  );
}

function MatchSourcesPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Three-way check sources" />
      <div className="mt-4">
        <DataTable
          rows={sources}
          rowKey={(s) => s.label}
          openDoc={(_s, i) => (i === 0 ? <RateCardDoc /> : null)}
          openTitle={() => "Contract rate card · RC-2026-CHI-RIV"}
          columns={[
            { header: "Source", cell: (s) => <span className="font-semibold">{s.label}</span> },
            { header: "Reference", cell: (s) => <span className="text-surface-deep">{s.ref}</span> },
            { header: "Detail", cell: (s) => s.detail },
          ]}
        />
      </div>
    </article>
  );
}

function RemittancePanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Carrier master · remittance" />
      <div className="mt-4">
        <DataTable
          rows={remittance}
          rowKey={(r) => r.label}
          openDoc={(_r, i) => (i === 0 ? <GateLogDoc /> : null)}
          openTitle={() => "Carrier master · Summit Carriers"}
          columns={[
            { header: "Field", className: "w-52", cell: (r) => <span className="font-semibold">{r.label}</span> },
            { header: "Detail", cell: (r) => r.value },
          ]}
        />
      </div>
    </article>
  );
}

function FraudPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Exception signal · line checks" />
      <div className="mt-4 rounded-md bg-surface-fog/70 px-3 py-3">
        <div className="flex items-center justify-between text-[12px] mb-1.5">
          <span className="text-ink font-medium">Lines outside rate card</span>
          <span className="tabular-nums text-surface-deep font-bold">{(EXCEPTION_RATE * 100).toFixed(0)}% · $1,816 held</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white overflow-hidden border border-divider">
          <div className="h-full rounded-full bg-surface-rose" style={{ width: `${EXCEPTION_RATE * 100}%` }} />
        </div>
      </div>
      <div className="mt-4">
        <DataTable
          rows={exceptionChecks}
          rowKey={(c) => c.label}
          openDoc={(_c, i) => (i === 0 ? <WeighTicketDoc /> : null)}
          openTitle={() => "Carrier history · prior bookings"}
          columns={[
            { header: "Check", cell: (c) => <span className="font-semibold">{c.label}</span> },
            { header: "Result", align: "right", cell: (c) => <span className="text-mute">{c.result}</span> },
          ]}
        />
      </div>
    </article>
  );
}

type Query = { id: string; q: string; status: string; tone: "sage" | "neutral" };
const queries: Query[] = [
  { id: "FRT-3322", q: "When does the CHI→RIV OCC load settle?", status: "Auto-resolved · KB-FRT-0148", tone: "sage" },
  { id: "FRT-3316", q: "Why is invoice INV-CDR-0991 on hold?", status: "Routed to freight desk", tone: "neutral" },
  { id: "FRT-3309", q: "Has Summit invoice INV-SUM-5567 been paid?", status: "Auto-resolved · clean lines settled", tone: "sage" },
];

function QueriesPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader
        label="Carrier queries · on the invoice"
        right={<span className="text-[11px] text-mute">71% deflected · 2m first response</span>}
      />
      <div className="mt-4">
        <DataTable
          rows={queries}
          rowKey={(r) => r.id}
          columns={[
            { header: "Ticket", className: "w-28", cell: (r) => <span className="font-semibold text-surface-deep tabular-nums">{r.id}</span> },
            { header: "Query", cell: (r) => r.q },
            { header: "Resolution", align: "right", cell: (r) => <CellTag tone={r.tone}>{r.status}</CellTag> },
          ]}
        />
      </div>
    </article>
  );
}

function InvoiceContext() {
  return (
    <div className="rounded-md border border-divider bg-surface-fog/60 px-4 py-3">
      <div className="text-[11px] tracking-[0.05em] uppercase text-surface-deep font-bold">Invoice to check</div>
      <div className="text-[13px] font-bold text-ink mt-1">INV-SUM-5567 · Summit Carriers · lane CHI→RIV</div>
      <p className="text-[12.5px] text-ink leading-snug mt-1">
        $15,480.00 billed · dated 2026-06-09 against shipment 0085412 (OCC, Riverside mill) · contract rate card
        RC-2026-CHI-RIV in force. Ready to run the three-way check and settle the clean lines.
      </p>
    </div>
  );
}

export function InvoiceConsole() {
  const { setAgentOutput, go } = useApp();
  const [open, setOpen] = React.useState(false);

  const decide = (status: AgentOutputStatus) => {
    setAgentOutput("invoice", status);
    if (status === "approved") go({ kind: "workspace", flow: "belt" });
    else setOpen(false);
  };

  return (
    <>
      <AgentConsole config={config} onOpenRun={() => setOpen(true)}>
        <QueuePanel title="Settlement worklist · invoices & exceptions" badge="1 to check" items={queue} onOpen={() => setOpen(true)} />
        <ExtractionPanel />
        <MatchSourcesPanel />
        <RemittancePanel />
        <FraudPanel />
        <QueriesPanel />
      </AgentConsole>

      {open && (
        <CeremonyModal
          title="INV-SUM-5567 · run three-way check"
          subtitle="Summit Carriers invoice · $15,480.00 · dated 2026-06-09"
          context={<InvoiceContext />}
          ceremony={{
            agentLabel: "Freight Settlement Matcher · running the check",
            steps: [
              "Extracting invoice fields from INV-SUM-5567 (carrier PDF)",
              "Pulling rate card RC-2026-CHI-RIV and shipment 0085412",
              "Comparing linehaul, fuel and accessorials — three-way",
              "Flagging non-standard lines as exceptions",
              "Settling the clean lines and drafting the carrier dispute",
            ],
            doneSummary: (
              <>
                Three-way check clears <span className="font-bold">$13,664.00</span> of $15,480 billed · 3 lines held
                at <span className="font-bold">$1,816.00</span>. Clean lines settled for the Net-30 run; a dispute to
                Summit Carriers is drafted for you to send.
              </>
            ),
            document: <ThreeWayMatchDoc />,
            footerIntro: "The agent runs the three-way check, settles the in-tolerance lines and drafts a dispute for the held lines — you approve the settlement and send the dispute.",
            approveLabel: "Approve settlement & dispute draft",
          }}
          onClose={() => setOpen(false)}
          onDecide={decide}
        />
      )}
    </>
  );
}
