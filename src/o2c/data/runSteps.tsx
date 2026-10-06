/**
 * The BlueRidge deduction run — four gated agent steps in process order.
 *
 * The customer (BlueRidge Foods) paid an invoice $208,400 short, taking a
 * shortage chargeback against a bulk corrugated shipment. Each step is one O2C
 * specialist working the same receivable: it reads upstream evidence (clickable
 * source files), streams its reasoning, produces a faithful finance artifact, and
 * pauses for a human decision (approve · pending · escalate · reject). Approve
 * hands the output to the next agent. Two steps run an email round-trip — the
 * remittance acknowledgement and the dispute-back to the customer.
 *
 * Process order — Cash Application → Deduction Triage → Evidence & Validation →
 * Dispute Resolution. The proof of delivery is the pivot: it shows the full
 * tonnage was delivered and signed for, so the shortage claim is invalid and the
 * $208,400 is recovered rather than written off.
 */

import * as React from "react";
import type { AgentId } from "@/o2c/data/agents";
import type { SourceSystem } from "@/o2c/components/brand/SourceLogo";
import { CustomerInvoiceDoc } from "@/o2c/components/docs/o2c/CustomerInvoiceDoc";
import { SalesOrderDoc } from "@/o2c/components/docs/o2c/SalesOrderDoc";
import { DeliveryDoc } from "@/o2c/components/docs/o2c/DeliveryDoc";
import { LedgerDoc } from "@/o2c/components/docs/finance/LedgerDoc";
import { PaymentPostingDoc } from "@/o2c/components/docs/finance/PaymentPostingDoc";
import { JournalDoc } from "@/o2c/components/docs/finance/JournalDoc";
import { EmailDoc } from "@/o2c/components/docs/sources";
import { Edi820Doc, PodDoc, WeightTicketDoc } from "@/o2c/components/docs/o2c/EvidenceDocs";

export type SourceKind =
  | "sap"
  | "email"
  | "contract"
  | "policy"
  | "budget"
  | "master"
  | "external"
  | "edi"
  | "kb"
  | "invoice";

export type SourceArtifact = {
  id: string;
  label: string;
  meta: string;
  kind: SourceKind;
  /** The system this file came from — drives the logo on the source header. */
  system?: SourceSystem;
  /** Marks the previous agent's output handed into this step. */
  handoff?: boolean;
  body: React.ReactNode;
};

export type EmailReply = {
  from: string;
  receivedMeta: string;
  subject: string;
  lines: string[];
  /** Appended to the step's source panel once the reply lands. */
  source: SourceArtifact;
};

export type EmailAction = {
  cta: string;
  to: string;
  subject: string;
  lines: string[];
  reply: EmailReply;
  toastTitle: string;
  toastBody: string;
};

/** One evaluated control in the do-not-pay / do-not-write-off envelope. */
export type ControlGate = {
  name: string;
  result: string;
  /** "clear" = passed · "tripped" = this control caught the exception. */
  state: "clear" | "tripped";
};

/**
 * The resolution surface a step shows once it halts on an exception. It turns a
 * one-line "run halted" into the audit-grade payoff a Controller acts on:
 * which control tripped, the evidence bundled, where it routes, and the
 * immutable audit record.
 */
export type ExceptionResolution = {
  title: string;
  gates: ControlGate[];
  evidence: { label: string; detail: string }[];
  handoff: { to: string; sla: string; nextStep: string };
  audit: { id: string; logged: string; note: string };
  draft?: {
    to: string;
    subject: string;
    lines: string[];
    sendLabel: string;
    sentLabel: string;
  };
};

export type ExtractStage = {
  sourceId: string;
  reasoning: string;
  title: string;
  fields: { label: string; value: string }[];
};

export type RunStep = {
  id: AgentId;
  /** Optional display name override. */
  agentName?: string;
  n: number;
  title: string;
  sub: string;
  /** Streamed reasoning lines shown in the AI workspace. */
  reasoning: string[];
  docLabel: string;
  document: React.ReactNode;
  sources: SourceArtifact[];
  email?: EmailAction;
  /** One-line AI verdict shown above the decision buttons. */
  recommendation: string;
  /** Resolution surface shown when this step halts the run (escalate / reject). */
  exception?: ExceptionResolution;
  /** Staged auto-fill wizard — one stage per source. Omit for auto-reveal steps. */
  stages?: ExtractStage[];
};

/* ── Step 1 · Cash Application — payment short by $208,400 ─────────────────── */

const cashAppStep: RunStep = {
  id: "intake",
  n: 1,
  title: "Apply the cash",
  sub: "Matches the payment and isolates the short-pay",
  reasoning: [
    "Reading the lockbox file — BlueRidge Foods ACH $1,142,600",
    "Matching to open items on the BlueRidge account",
    "Invoice 9100488 expected $1,351,000 — paid $1,142,600",
    "Isolating the $208,400 gap — a deduction, not an underpayment",
    "Clearing the paid balance · routing the deduction to triage",
  ],
  docLabel: "Cash application · BlueRidge ACH 4471",
  document: <PaymentPostingDoc />,
  sources: [
    {
      id: "remittance",
      label: "EDI 820 remittance",
      meta: "X12 820 · 08:12",
      kind: "edi",
      system: "bank",
      body: <Edi820Doc />,
    },
    {
      id: "open-invoice",
      label: "Open invoice 9100488",
      meta: "SAP FI-AR · $1,351,000",
      kind: "invoice",
      body: <CustomerInvoiceDoc />,
    },
    {
      id: "open-items",
      label: "Open AR items",
      meta: "SAP FBL5N · BlueRidge",
      kind: "sap",
      body: <LedgerDoc />,
    },
  ],
  email: {
    cta: "Acknowledge the remittance",
    to: "BlueRidge Foods · Accounts Payable",
    subject: "Payment received on 9100488 — deduction logged for review",
    lines: [
      "We've applied your ACH of $1,142,600.00 to invoice 9100488 and cleared the paid balance.",
      "The $208,400.00 shortage deduction (SC-200) is logged as an open dispute item and is under review. We'll come back to you with our finding.",
    ],
    toastTitle: "Remittance acknowledged",
    toastBody: "BlueRidge AP confirmed the reference — added to your sources.",
    reply: {
      from: "BlueRidge Foods",
      receivedMeta: "Outlook · 08:31",
      subject: "RE: Payment received on 9100488",
      lines: [
        "Thanks — noted. The shortage was flagged by our receiving team at the Greensboro DC.",
      ],
      source: {
        id: "brf-ack",
        label: "Customer reply",
        meta: "Outlook · 08:31",
        kind: "email",
        body: (
          <EmailDoc
            from="BlueRidge Foods · Accounts Payable"
            fromAddr="ap@blueridgefoods.com"
            to="Northgate Paper · Cash Application"
            sent="2026-06-09 · 08:31"
            subject="RE: Payment received on 9100488"
            tone="inbound"
            lines={[
              "Thanks — noted. The shortage was flagged by our receiving team at the Greensboro DC.",
              "Backup is the deduction notice we sent with the remittance.",
            ]}
          />
        ),
      },
    },
  },
  recommendation:
    "Payment ties to invoice 9100488 within tolerance on the paid lines. The $208,400 gap is a customer-taken deduction (SC-200), not an underpayment — isolated as a discrete open item and routed to triage.",
  stages: [
    {
      sourceId: "remittance",
      reasoning: "Reading the EDI 820 remittance — BPR header, RMR open-item and ADX adjustment loops",
      title: "Payment header · EDI 820",
      fields: [
        { label: "Payment method", value: "ACH CTX · BPR04" },
        { label: "Payment amount", value: "$1,142,600.00 · BPR02" },
        { label: "Remittance ref", value: "BRF-REM-4471" },
        { label: "Payer", value: "BlueRidge Foods · 0000610248" },
        { label: "Value date", value: "2026-06-09" },
        { label: "Business reason", value: "BPR17 · trade payment" },
      ],
    },
    {
      sourceId: "open-invoice",
      reasoning: "Matching the RMR loop to open item 9100488 in SAP FI-AR",
      title: "Open-item match · RMR loop",
      fields: [
        { label: "Invoice", value: "9100488" },
        { label: "Invoiced (RMR)", value: "$1,351,000.00" },
        { label: "Paid (RMR04)", value: "$1,142,600.00" },
        { label: "Match", value: "Exact on paid lines · in tolerance" },
      ],
    },
    {
      sourceId: "open-items",
      reasoning: "Reading the ADX adjustment — the short-pay isolated as a residual deduction",
      title: "Deduction · ADX loop → SAP residual",
      fields: [
        { label: "Adjustment (ADX01)", value: "−$208,400.00" },
        { label: "Reason (ADX02)", value: "SC-200 · shortage" },
        { label: "Residual item", value: "Created · SAP FBL5N" },
        { label: "Posting key", value: "15 · incoming payment (partial)" },
        { label: "Route to", value: "Deduction triage · FSCM case" },
      ],
    },
  ],
};

/* ── Step 2 · Deduction Triage — classify and call it ─────────────────────── */

const triageStep: RunStep = {
  id: "sourcing",
  n: 2,
  title: "Triage the deduction",
  sub: "Classifies the chargeback and calls it disputable",
  reasoning: [
    "Reading deduction SC-200 — $208,400 against PO 55-22418",
    "Classifying — shortage chargeback on a bulk corrugated shipment",
    "Checking the customer agreement — no shortage allowance on bulk",
    "Scoring recovery likelihood — proof of delivery would refute it",
    "Calling it disputable · routing to evidence with a recovery hypothesis",
  ],
  docLabel: "Deduction SC-200 · triage case",
  document: <CustomerInvoiceDoc />,
  sources: [
    {
      id: "deduction-handoff",
      label: "Deduction SC-200",
      meta: "from Cash Application",
      kind: "sap",
      handoff: true,
      body: <PaymentPostingDoc />,
    },
    {
      id: "deduction-notice",
      label: "Chargeback notice",
      meta: "BlueRidge · BRF-CB-2218",
      kind: "email",
      body: (
        <EmailDoc
          from="BlueRidge Foods · Deductions"
          fromAddr="deductions@blueridgefoods.com"
          to="Northgate Paper · Order-to-Cash"
          sent="2026-06-09 · 08:10"
          subject="Chargeback BRF-CB-2218 — shortage on PO 55-22418"
          tone="inbound"
          lines={[
            "We are charging back $208,400.00 against invoice 9100488 for a product shortage on PO 55-22418.",
            "Our Greensboro DC receiving log shows 1,640 units short of the 8,200 ordered. Reason code SC-200.",
          ]}
        />
      ),
    },
    {
      id: "sales-order-triage",
      label: "Sales order 55-22418",
      meta: "SAP VA03 · 8,200 units",
      kind: "sap",
      body: <SalesOrderDoc />,
    },
  ],
  recommendation:
    "Shortage chargeback (SC-200), $208,400. The BlueRidge agreement carries no shortage allowance on bulk corrugated, and the claim rests only on a receiving-log count. Disputable — recovery likely if proof of delivery shows full tonnage. Routed to evidence.",
  stages: [
    {
      sourceId: "deduction-notice",
      reasoning: "Reading chargeback BRF-CB-2218 — reason code and cited backup",
      title: "Chargeback · classification",
      fields: [
        { label: "Deduction code", value: "SC-200 · shortage" },
        { label: "Amount", value: "$208,400.00" },
        { label: "Against", value: "PO 55-22418 · invoice 9100488" },
        { label: "Backup cited", value: "Greensboro DC receiving log" },
        { label: "Claimed short", value: "1,640 of 8,200 units" },
      ],
    },
    {
      sourceId: "sales-order-triage",
      reasoning: "Checking the BlueRidge agreement — no shortage allowance on bulk corrugated",
      title: "Validity call · SAP FSCM",
      fields: [
        { label: "Contracted allowance", value: "None · bulk corrugated" },
        { label: "Recovery score", value: "0.88 · disputable" },
        { label: "Refuting evidence", value: "Signed POD would settle it" },
        { label: "Dispute case", value: "DC-90357 · opened" },
      ],
    },
    {
      sourceId: "deduction-handoff",
      reasoning: "Routing to evidence & validation with the recovery hypothesis",
      title: "Routing · recovery hypothesis",
      fields: [
        { label: "Route to", value: "Evidence & validation" },
        { label: "Hypothesis", value: "POD shows full 8,200 → recover" },
        { label: "Value at risk", value: "$208,400.00" },
        { label: "Recovery window", value: "Before the claim ages out" },
      ],
    },
  ],
};

/* ── Step 3 · Evidence & Validation — the proof of delivery ───────────────── */

const evidenceStep: RunStep = {
  id: "po",
  n: 3,
  title: "Validate against the proof",
  sub: "Pulls the POD and refutes the shortage claim",
  reasoning: [
    "Pulling the proof of delivery for PO 55-22418",
    "Reading the signed delivery receipt — 8,200 units received",
    "Cross-checking the carrier weight ticket — full tonnage scanned",
    "Reconciling sales order ↔ delivery ↔ invoice — all agree at 8,200",
    "Verdict — the shortage claim is unsupported · recover $208,400",
  ],
  docLabel: "POD 80017734 · delivery validation",
  document: <DeliveryDoc />,
  sources: [
    {
      id: "triage-handoff",
      label: "Triage case SC-200",
      meta: "from Deduction Triage",
      kind: "sap",
      handoff: true,
      body: <CustomerInvoiceDoc />,
    },
    {
      id: "pod",
      label: "Proof of delivery · signed",
      meta: "POD 80017734 · EDI 214",
      kind: "edi",
      system: "carrier",
      body: <PodDoc />,
    },
    {
      id: "weight-ticket",
      label: "Certified weight ticket",
      meta: "Scale · WT-44712",
      kind: "edi",
      system: "scale",
      body: <WeightTicketDoc />,
    },
    {
      id: "sales-order-evidence",
      label: "Sales order 55-22418",
      meta: "SAP VA03 · 8,200 units",
      kind: "sap",
      body: <SalesOrderDoc />,
    },
  ],
  recommendation:
    "Proof of delivery 80017734 is signed for the full 8,200 units, and the carrier weight ticket scans to full tonnage at the Greensboro dock. The shortage claim is unsupported by the delivery evidence — recommend recovering the full $208,400.",
  stages: [
    {
      sourceId: "pod",
      reasoning: "Reading the EDI 214 proof of delivery — signatory, pieces and exceptions",
      title: "Proof of delivery · EDI 214",
      fields: [
        { label: "POD number", value: "80017734" },
        { label: "Delivered", value: "8,200 EA · in full" },
        { label: "Signed by", value: "M. Carrow · Greensboro DC" },
        { label: "Delivered on", value: "2026-05-12 · 14:20" },
        { label: "Lading exception", value: "None reported" },
      ],
    },
    {
      sourceId: "weight-ticket",
      reasoning: "Cross-checking the EDI 856 ASN weight ticket scanned at the dock",
      title: "Carrier weight · EDI 856 ASN",
      fields: [
        { label: "ASN / BOL", value: "856 · BOL 4471-22418" },
        { label: "Gross weight", value: "41,820 lb · scaled" },
        { label: "Pieces", value: "8,200 EA · 205 pallets" },
        { label: "Dock scan", value: "Confirmed · in full" },
      ],
    },
    {
      sourceId: "sales-order-evidence",
      reasoning: "Reconciling sales order ↔ delivery ↔ invoice — all at 8,200",
      title: "Three-way reconcile · verdict",
      fields: [
        { label: "Ordered (SO 55-22418)", value: "8,200 EA" },
        { label: "Delivered (POD)", value: "8,200 EA" },
        { label: "Invoiced (9100488)", value: "8,200 EA" },
        { label: "Variance", value: "0 units · claim unsupported" },
      ],
    },
  ],
};

/* ── Step 4 · Dispute Resolution — recover the money ─────────────────────── */

const resolutionStep: RunStep = {
  id: "invoice",
  n: 4,
  title: "Recover and close",
  sub: "Posts the recovery and disputes it back to the customer",
  reasoning: [
    "Building the recovery package — POD, weight ticket, sales order",
    "Drafting the dispute-back citing the signed delivery receipt",
    "Posting the $208,400 recovery rebill to the BlueRidge account",
    "Reopening invoice 9100488 to its full $1,351,000 value",
    "Closing the dispute case with the audit trail attached",
  ],
  docLabel: "Recovery 9100488-R · journal & rebill",
  document: <JournalDoc />,
  sources: [
    {
      id: "evidence-handoff",
      label: "Evidence pack 80017734",
      meta: "from Evidence & Validation",
      kind: "edi",
      system: "sap",
      handoff: true,
      body: <DeliveryDoc />,
    },
    {
      id: "open-items-resolution",
      label: "BlueRidge open items",
      meta: "SAP FBL5N",
      kind: "sap",
      body: <LedgerDoc />,
    },
  ],
  email: {
    cta: "Send the dispute-back to BlueRidge",
    to: "BlueRidge Foods · Deductions",
    subject: "Chargeback BRF-CB-2218 declined — full delivery evidenced",
    lines: [
      "We've reviewed chargeback BRF-CB-2218 ($208,400, SC-200) against PO 55-22418.",
      "Proof of delivery 80017734 is signed for the full 8,200 units and the carrier weight ticket confirms full tonnage at your Greensboro DC. The shortage is not supported by the delivery evidence.",
      "We are rebilling the $208,400 to invoice 9100488. The signed POD and weight ticket are attached for your records.",
    ],
    toastTitle: "Dispute-back sent",
    toastBody: "BlueRidge Deductions acknowledged the evidence — added to your sources.",
    reply: {
      from: "BlueRidge Foods · Deductions",
      receivedMeta: "Outlook · 16:40",
      subject: "RE: Chargeback BRF-CB-2218 declined",
      lines: [
        "Understood — the signed POD settles it. We'll reverse the chargeback and release the $208,400 on the next run.",
      ],
      source: {
        id: "brf-concede",
        label: "Customer concession",
        meta: "Outlook · 16:40",
        kind: "email",
        body: (
          <EmailDoc
            from="BlueRidge Foods · Deductions"
            fromAddr="deductions@blueridgefoods.com"
            to="Northgate Paper · Order-to-Cash"
            sent="2026-06-09 · 16:40"
            subject="RE: Chargeback BRF-CB-2218 declined"
            tone="inbound"
            lines={[
              "Understood — the signed POD settles it. We'll reverse the chargeback and release the $208,400 on the next run.",
              "Our receiving team has been re-briefed on the count process.",
            ]}
          />
        ),
      },
    },
  },
  recommendation:
    "Evidence is complete and the verdict is clean — recover the full $208,400. On your approval, the agent posts the rebill, reopens invoice 9100488 to its full value, sends the evidenced dispute-back, and closes the case with the audit trail attached.",
  stages: [
    {
      sourceId: "evidence-handoff",
      reasoning: "Building the evidence packet and the recovery posting in SAP FI-AR",
      title: "Recovery posting · SAP FI-AR",
      fields: [
        { label: "Action", value: "Recover · rebill" },
        { label: "Amount", value: "+$208,400.00" },
        { label: "G/L 120000", value: "Trade receivables · Dr" },
        { label: "Reopen invoice", value: "9100488 → full $1,351,000" },
        { label: "Reason", value: "SC-200 declined · evidenced" },
      ],
    },
    {
      sourceId: "open-items-resolution",
      reasoning: "Drafting the one-click dispute-back to the BlueRidge deductions portal",
      title: "Dispute-back · evidence packet",
      fields: [
        { label: "To", value: "BlueRidge deductions portal" },
        { label: "Case", value: "DC-90357 · BRF-CB-2218" },
        { label: "Evidence packet", value: "POD 80017734 + ASN + SO" },
        { label: "Audit", value: "Immutable · logged" },
        { label: "Status", value: "Rebilled · awaiting customer" },
      ],
    },
  ],
};

export const runSteps: RunStep[] = [
  cashAppStep,
  triageStep,
  evidenceStep,
  resolutionStep,
];
