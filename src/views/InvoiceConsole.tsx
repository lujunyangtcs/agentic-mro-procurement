import * as React from "react";
import { useApp, type AgentOutputStatus } from "@/state";
import { cn } from "@/lib/utils";
import { InvoiceMatch } from "@/components/docs/sap/InvoiceMatch";
import {
  VendorInvoiceDoc,
  OutlineAgreementDoc,
  VendorRecordDoc,
  ExternalMatchDoc,
} from "@/components/docs/sources";
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
 * Invoice Resolution Agent console.
 *
 * Resolves procurement-side invoice blocks, runs the four-way match across
 * contract · PO · goods receipt · invoice, and manages buyer/supplier/AP queries
 * on those blocks. Data surface: IDP extraction with confidence · the four match
 * sources · supplier remittance master · fraud signal · query deflection. The
 * ceremony posts INV-BPI-5567 and releases it to AP.
 * ────────────────────────────────────────────────────────────────────────── */

const queue: QueueItem[] = [
  {
    id: "inv-bpi-5567",
    primary: "INV-BPI-5567 · BeltPro Industrial",
    secondary: "$48,200.00 · PO-77310 · GR posted · ready to match",
    meta: "14:20",
    readyTag: "Ready to match",
    actionable: true,
  },
  {
    id: "inv-apx-2207",
    primary: "INV-APX-2207 · Apex Drives",
    secondary: "$12,480.00 · four-way clean · posted to SAP",
    meta: "1h",
    handledTag: "Auto-posted",
  },
  {
    id: "inv-mw-0991",
    primary: "INV-MW-0991 · Midwest Belting",
    secondary: "Price variance $310 over contract · resolution proposed",
    meta: "3h",
    handledTag: "Fix drafted",
  },
];

type Extract = { field: string; value: string; conf: number };
const extracted: Extract[] = [
  { field: "Vendor", value: "100482 · BeltPro Industrial", conf: 0.99 },
  { field: "Invoice no.", value: "BPI-5567", conf: 0.99 },
  { field: "Invoice date", value: "2026-06-09", conf: 0.98 },
  { field: "Net amount", value: "USD 48,200.00", conf: 0.99 },
  { field: "Tax", value: "USD 0.00 · U1", conf: 0.97 },
  { field: "PO reference", value: "PO-77310", conf: 0.99 },
];

type Source = { label: string; ref: string; detail: string };
const sources: Source[] = [
  { label: "Contract", ref: "4600001207 · item 10", detail: "Price & terms locked · $48,200 · Net 30" },
  { label: "Purchase order", ref: "PO-77310 · item 10", detail: "1 EA · $48,200 net · Incoterms FCA" },
  { label: "Goods receipt", ref: "GR-77310 · 5000031882", detail: "1 EA received · mvt 101 · store MNT1" },
  { label: "Invoice", ref: "INV-BPI-5567", detail: "1 EA · $48,200 · vendor ref BPI-5567" },
];

type Remit = { label: string; value: string };
const remittance: Remit[] = [
  { label: "Bank account", value: "Wells Fargo · ****4471 · ABA 121000248" },
  { label: "Payment terms", value: "NT30 · Net 30 days · baseline 2026-06-09" },
  { label: "Tax registration", value: "U1 · self-assessed use tax" },
  { label: "Remittance email", value: "ap@beltpro-ind.com · on file" },
  { label: "Bank detail last changed", value: "None in 18 months · stable" },
];

type FraudCheck = { label: string; result: string };
const fraudChecks: FraudCheck[] = [
  { label: "Duplicate-invoice scan", result: "No prior BPI-5567" },
  { label: "Price vs contract", result: "Within 0% of $48,200" },
  { label: "Bank-detail change", result: "None — account stable" },
  { label: "Split / round-number pattern", result: "Not detected" },
];
const FRAUD_SCORE = 0.02;

const outputMeta: OutputMeta = {
  none: { label: "Not matched yet", kind: "neutral", note: "Open the invoice to run the four-way match." },
  pending: { label: "On pending", kind: "neutral", note: "INV-BPI-5567 parked — resume from the worklist." },
  approved: {
    label: "Posted · cleared to pay",
    kind: "active",
    note: "INV-BPI-5567 posted to SAP and scheduled for the Net-30 payment run.",
  },
  rejected: { label: "Rejected", kind: "critical", note: "Invoice rejected — a dispute note goes back to BeltPro." },
  escalated: { label: "Escalated", kind: "critical", note: "Match exception raised — routed to the buyer to resolve." },
};

const chatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the Invoice Resolution & Match Agent — I run the four-way match and clear clean invoices to pay. Ask me about the worklist.",
        children: (
          <div className="text-[12.5px] text-ink leading-[19px]">
            <div className="text-mute mb-1">For example —</div>
            <ul className="space-y-0.5">
              <li>· Is INV-BPI-5567 clean</li>
              <li>· What's the fraud score</li>
              <li>· When does it pay</li>
            </ul>
          </div>
        ),
      },
    ],
    chips: ["Is INV-BPI-5567 clean?", "What's the fraud score?", "When does it pay?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "Yes — the match ties out across contract, PO, goods receipt and invoice at $48,200.00 net with a 0.00 balance. Extraction confidence 0.985, fraud 0.02. Cleared to post.",
      },
    ],
    chips: ["What's the fraud score?", "When does it pay?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "0.02 — low. No duplicate of BPI-5567, the price sits on contract, the bank account hasn't changed in 18 months and there's no split-invoice pattern.",
      },
    ],
    chips: ["When does it pay?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "On your approval I post INV-BPI-5567 to SAP and schedule the Net-30 payment — due 2026-07-09 to BeltPro's account on file. The line then hands to AP for the payment run.",
      },
    ],
  },
];

const config: ConsoleConfig = {
  id: "invoice",
  statLabel: "Auto-match rate",
  artifactLabel: "Four-way match · INV-BPI-5567",
  outputMeta,
  chatName: "Invoice agent",
  chatScript,
  runRole: "Matches the invoice to the contract, PO and goods receipt, then posts INV-BPI-5567 and schedules payment.",
  openRunLabel: "Open the blocked invoice",
};

function confTone(conf: number) {
  if (conf >= 0.98) return "bg-surface-deep";
  if (conf >= 0.95) return "bg-surface-sage";
  return "bg-surface-rose";
}

function ExtractionPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Extracted invoice · IDP" />
      <div className="mt-4">
        <DataTable
          rows={extracted}
          rowKey={(e) => e.field}
          openDoc={(_e, i) => (i === 0 ? <VendorInvoiceDoc /> : null)}
          openTitle={() => "Supplier invoice · BPI-5567"}
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
      <CardHeader label="Four-way match sources" />
      <div className="mt-4">
        <DataTable
          rows={sources}
          rowKey={(s) => s.label}
          openDoc={(_s, i) => (i === 0 ? <OutlineAgreementDoc /> : null)}
          openTitle={() => "Outline agreement · 4600001207"}
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
      <CardHeader label="Supplier master · remittance" />
      <div className="mt-4">
        <DataTable
          rows={remittance}
          rowKey={(r) => r.label}
          openDoc={(_r, i) => (i === 0 ? <VendorRecordDoc variant="golden" /> : null)}
          openTitle={() => "Vendor master · 100482 BeltPro"}
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
      <CardHeader label="Fraud & anomaly signal" />
      <div className="mt-4 rounded-md bg-surface-fog/70 px-3 py-3">
        <div className="flex items-center justify-between text-[12px] mb-1.5">
          <span className="text-ink font-medium">Fraud score</span>
          <span className="tabular-nums text-surface-deep font-bold">{FRAUD_SCORE.toFixed(2)} · low</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white overflow-hidden border border-divider">
          <div className="h-full rounded-full bg-surface-sage" style={{ width: `${FRAUD_SCORE * 100}%` }} />
        </div>
      </div>
      <div className="mt-4">
        <DataTable
          rows={fraudChecks}
          rowKey={(c) => c.label}
          openDoc={(_c, i) => (i === 0 ? <ExternalMatchDoc /> : null)}
          openTitle={() => "External match · D&B / OFAC"}
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
  { id: "PRC-3322", q: "When does the No.2 double-backer belt arrive?", status: "Auto-resolved · KB-PROC-0148", tone: "sage" },
  { id: "PRC-3316", q: "Why is invoice INV-ADS-4419 on hold?", status: "Routed to fraud review", tone: "neutral" },
  { id: "PRC-3309", q: "Has BeltPro invoice BPI-5567 been paid?", status: "Auto-resolved · remittance sent", tone: "sage" },
];

function QueriesPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader
        label="Buyer & supplier queries · on the block"
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
      <div className="text-[11px] tracking-[0.05em] uppercase text-surface-deep font-bold">Invoice to match</div>
      <div className="text-[13px] font-bold text-ink mt-1">INV-BPI-5567 · BeltPro Industrial · vendor 100482</div>
      <p className="text-[12.5px] text-ink leading-snug mt-1">
        $48,200.00 net · received 2026-06-09 against PO-77310 · goods receipt GR-77310 posted · contract 4600001207
        terms in force. Ready to run the four-way match and post.
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
        <QueuePanel title="Invoice worklist · blocks & matches" badge="1 to match" items={queue} onOpen={() => setOpen(true)} />
        <ExtractionPanel />
        <MatchSourcesPanel />
        <RemittancePanel />
        <FraudPanel />
        <QueriesPanel />
      </AgentConsole>

      {open && (
        <CeremonyModal
          title="INV-BPI-5567 · run four-way match"
          subtitle="BeltPro invoice · $48,200.00 · received 2026-06-09"
          context={<InvoiceContext />}
          ceremony={{
            agentLabel: "Invoice agent · running the match",
            steps: [
              "Extracting invoice fields from BPI-5567 (IDP)",
              "Pulling contract 4600001207, PO-77310 and GR-77310",
              "Comparing price, quantity and terms — four-way",
              "Scoring fraud and anomaly signals",
              "Posting the invoice and scheduling payment",
            ],
            doneSummary: (
              <>
                Four-way match ties out at <span className="font-bold">$48,200.00</span> · balance 0.00 · fraud 0.02.
                INV-BPI-5567 posted and scheduled for the Net-30 payment run.
              </>
            ),
            document: <InvoiceMatch />,
            footerIntro: "The agent will extract the invoice, run the four-way match, score fraud and post on a clean result.",
            approveLabel: "Approve & post invoice",
          }}
          onClose={() => setOpen(false)}
          onDecide={decide}
        />
      )}
    </>
  );
}
