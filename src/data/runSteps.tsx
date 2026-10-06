/**
 * The belt run — the full end-to-end procure-to-pay journey, mirroring the
 * enterprise process map's two swimlanes:
 *
 *   PROCUREMENT OPERATIONS (upstream) — 4 steps the buyer runs, then returns
 *   to the dashboard:
 *     1 Supplier onboarding & master data   (MDM)
 *     2 Requisition to PO creation          (PR Processing)
 *     3 Contract & pricing alignment        (Sourcing & Contract)
 *     4 Goods receipt / service entry       (PO Management)
 *
 *   ACCOUNTS PAYABLE (downstream) — 5 steps launched from a second cockpit
 *   decision once the invoice lands, closing on the finance→procurement loop:
 *     5 Invoice receipt & capture           (Invoice Capture)
 *     6 Invoice matching (2/3-way)          (Invoice Matching)
 *     7 Exception handling & workflow       (Exception & Workflow)
 *     8 Invoice posting & accounting        (Invoice Posting)
 *     9 Payment processing                  (Payment & Treasury)
 *
 * Each step is one specialist agent doing its job on the same double-backer-belt
 * transaction: it reads upstream evidence (clickable source files), streams its
 * reasoning, renders the enterprise stage blueprint (the 5 process-map lanes),
 * produces a faithful SAP artifact, and pauses for a human decision (approve ·
 * pending · escalate · reject). Every figure ties to the worked example
 * (Corrugator No.2 double-backer belt · BeltPro Industrial · $48,200).
 */

import * as React from "react";
import type { AgentId } from "@/data/agents";
import { PurchaseRequisition } from "@/components/docs/sap/PurchaseRequisition";
import { RfqComparison } from "@/components/docs/sap/RfqComparison";
import { PurchaseOrder } from "@/components/docs/sap/PurchaseOrder";
import { GoodsReceipt } from "@/components/docs/sap/GoodsReceipt";
import { InvoiceMatch, invoiceBelt, type SapInvoice } from "@/components/docs/sap/InvoiceMatch";
import { VendorMaster } from "@/components/docs/sap/VendorMaster";
import { ExceptionResolutionCard } from "@/components/workspace/ExceptionResolutionCard";
import {
  EmailDoc,
  OutlineAgreementDoc,
  SpendingPolicyDoc,
  BudgetDoc,
  SupplierPoolDoc,
  VendorRecordDoc,
  VendorInvoiceDoc,
} from "@/components/docs/sources";

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

/** One evaluated control in the do-not-execute / do-not-pay envelope. */
export type ControlGate = {
  name: string;
  result: string;
  /** "clear" = passed · "tripped" = this control caught the exception. */
  state: "clear" | "tripped";
};

/**
 * The resolution surface a step shows when an exception is worked. It turns a
 * one-line "exception" into the audit-grade payoff a Controller acts on: which
 * control tripped, the evidence bundled, where it routes, and the immutable
 * audit record. Rendered either as a halting step's resolution (escalate /
 * reject) or, for a peer exception worked inside a clean run, as the step's
 * produced document.
 */
export type ExceptionResolution = {
  /** Headline for the resolution card (e.g. "Payment held · do-not-pay envelope"). */
  title: string;
  /** Every control evaluated — tripped ones render red, clear ones deep. */
  gates: ControlGate[];
  /** The evidence the agent bundled for the human reviewer. */
  evidence: { label: string; detail: string }[];
  /** The controlled handoff — who receives it, the SLA, and the next action. */
  handoff: { to: string; sla: string; nextStep: string };
  /** The immutable audit record written when the run halted. */
  audit: { id: string; logged: string; note: string };
  /** The controlled response the agent drafted — review and send, no reply. */
  draft?: {
    to: string;
    subject: string;
    lines: string[];
    sendLabel: string;
    sentLabel: string;
  };
};

/**
 * One stage of the staged-extraction wizard. The agent reads a single source
 * file (sourceId), shows the reasoning line for it (spinner while active), and
 * fills one section of the produced document as an editable form box. When a
 * step carries `stages`, the workspace plays this wizard one source at a time
 * before revealing the complete document.
 */
export type ExtractStage = {
  /** Must match one of the step's sources[].id — rendered on the right. */
  sourceId: string;
  /** The reasoning line for this stage (spins until Proceed). */
  reasoning: string;
  /** The form-box section title (a section of the produced doc). */
  title: string;
  /**
   * A short AI rationale written out (typed) above the fields — used on the
   * recommendation stage so the agent explains its pick in prose, not just
   * form cells. Omit on the plain extraction stages.
   */
  narrative?: string;
  /**
   * Auto-filled, editable fields extracted from the source. A field with
   * `options` renders as a dropdown (e.g. payment terms — Net 30 / 60 / 90) so
   * the reviewer can override the agent's pick; a field with `type: "date"`
   * renders a date input with a native calendar picker; otherwise text.
   * Omit on match-grid stages.
   */
  fields?: { label: string; value: string; options?: string[]; type?: "date" }[];
  /**
   * Renders the cumulative four-way-match grid instead of a form box. The grid
   * persists across the match stages: each stage reveals one more column
   * (`reveal` is the cumulative set), so the checked values from the previous
   * file stay on screen and the next file's column fills in beside them — a
   * live side-by-side comparison. Same model is shared by every match stage.
   */
  matchGrid?: MatchGrid;
};

/** One cell of the four-way-match grid — a value and whether it agrees. */
export type MatchCell = { value: string; ok: boolean };

/** The shared four-way-match comparison grid (contract · PO · GR · invoice). */
export type MatchGrid = {
  columns: { key: string; label: string }[];
  rows: { dimension: string; cells: Record<string, MatchCell> }[];
  /** Cumulative columns visible by the end of THIS stage (left → right fill). */
  reveal: string[];
  /** Summary line shown under the grid once every column is in. */
  verdict?: string;
};

/** One lane of a stage's enterprise process-map blueprint. */
export type DossierRow = {
  lane:
    | "Key process steps"
    | "AI intervention points"
    | "Value delivered"
    | "Key controls"
    | "Systems / tools";
  points: string[];
};

/** The five-lane process-map dossier shown above a step's produced artifact. */
export type StageDossier = {
  swimlane: "Procurement Operations" | "Accounts Payable";
  rows: DossierRow[];
};

export type RunStep = {
  id: AgentId;
  /** Optional display name override (e.g. "Payment & Treasury Agent"). */
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
  /** Enterprise process-map blueprint — 5 lanes, shown above the produced doc. */
  dossier?: StageDossier;
};

/* ════════════════════════════════════════════════════════════════════════
 * Shared evidence emails
 * ════════════════════════════════════════════════════════════════════════ */

const onboardingRequest = (
  <EmailDoc
    from="Procurement · MRO buyer"
    fromAddr="buyer@northgatepaper.com"
    to="Master Data Management"
    sent="2026-06-03 · 08:40"
    subject="Set up BeltPro Industrial for the double-backer belt buy"
    lines={[
      "Reliability needs a double-backer belt from BeltPro Industrial this week. Please make sure BeltPro is set up and clean in the vendor master before I raise the requisition.",
      "I think we may already have them under a slightly different spelling — can you check for a duplicate? Tax ID and bank should be on their W-9 attached.",
    ]}
  />
);

const deliveryNote = (
  <EmailDoc
    from="BeltPro Industrial"
    fromAddr="dispatch@beltpro.com"
    to="Goods Receiving · M042"
    sent="2026-06-09 · 07:30"
    subject="Delivery BPI-DN-5567 — 1 EA 88-DBX to Containerboard mill"
    tone="inbound"
    lines={[
      "Delivering 1 EA of 88-DBX (double-backer belt) against PO-77310 on BOL MEMPHIS-4471-2026. One day ahead of the contract date.",
      "Delivery note BPI-DN-5567 attached. Please confirm receipt at the maintenance store.",
    ]}
  />
);

const midwestInvoiceEmail = (
  <EmailDoc
    from="Midwest Belting"
    fromAddr="ar@midwestbelting.com"
    to="Accounts Payable"
    sent="2026-06-09 · 11:18"
    subject="Invoice INV-MW-0991 — conveyor belting, $4,610"
    tone="inbound"
    lines={[
      "Please find invoice INV-MW-0991 for $4,610.00 covering the conveyor belting on PO-77118, Net 30.",
      "Payment to the account on file. Thank you for your business.",
    ]}
  />
);

/* ════════════════════════════════════════════════════════════════════════
 * PROCUREMENT OPERATIONS (UPSTREAM) · 4 steps
 * ════════════════════════════════════════════════════════════════════════ */

/* ── Step 1 · Supplier onboarding & master data ──────────────────────────── */

const vendorStep: RunStep = {
  id: "vendor",
  n: 1,
  title: "Supplier onboarding & master data",
  sub: "Onboards and de-duplicates the belt supplier",
  reasoning: [
    "Receiving the BeltPro onboarding request from the mill buyer",
    "Running entity resolution — found a near-duplicate record 100731",
    "Screening — sanctions, tax (EIN) and bank verification clear",
    "Scoring supplier risk — low · single legal entity confirmed",
    "Proposing the golden record and retiring the duplicate",
  ],
  docLabel: "DM-100482-100731 · Vendor master",
  document: <VendorMaster />,
  sources: [
    { id: "onboarding-request", label: "Onboarding request", meta: "Outlook · 08:40", kind: "email", body: onboardingRequest },
    { id: "vendor-golden", label: "Vendor 100482", meta: "golden · SAP XK03", kind: "master", body: <VendorRecordDoc variant="golden" /> },
    { id: "policy-vendor", label: "Onboarding policy", meta: "POL-MDM-02", kind: "policy", body: <SpendingPolicyDoc /> },
  ],
  recommendation:
    "BeltPro Industrial cleared onboarding — EIN, DUNS and bank verified, sanctions clear, risk low. Entity resolution caught duplicate 100731 (0.991 match) — recommend keeping 100482 as the golden record and retiring the duplicate before any order is raised.",
  stages: [
    {
      sourceId: "onboarding-request",
      reasoning: "Reading the onboarding request and the supplier's details",
      title: "General data",
      fields: [
        { label: "Name", value: "BeltPro Industrial" },
        { label: "Country / region", value: "US · Memphis, TN" },
        { label: "Tax number (US EIN)", value: "47-1839220" },
        { label: "DUNS", value: "07-114-8829" },
      ],
    },
    {
      sourceId: "policy-vendor",
      reasoning: "Screening — sanctions, tax and bank verification",
      title: "Screening & risk",
      fields: [
        { label: "Sanctions / watchlist", value: "Clear · no match (Dow Jones)" },
        { label: "Tax / EIN", value: "Validated" },
        { label: "Bank verification", value: "Verified · 084000026 · ••••4471" },
        { label: "Risk score", value: "Low · 0.04" },
      ],
    },
    {
      sourceId: "vendor-golden",
      reasoning: "Entity resolution — duplicate 100731 detected, propose merge",
      title: "Golden record & de-duplication",
      fields: [
        { label: "Match confidence", value: "0.991" },
        { label: "Golden record", value: "100482 · keep" },
        { label: "Duplicate", value: "100731 · retire" },
        { label: "Action", value: "Merge & redirect info records" },
      ],
    },
  ],
  dossier: {
    swimlane: "Procurement Operations",
    rows: [
      { lane: "Key process steps", points: ["Vendor onboarding", "KYC / tax validation", "Vendor master creation"] },
      { lane: "AI intervention points", points: ["Entity-resolution AI (duplicate-vendor detection)", "Risk scoring (fraud, sanctions, GST)", "OCR + NLP vendor-data extraction"] },
      { lane: "Value delivered", points: ["20–30% fewer duplicate vendors & fraud risk"] },
      { lane: "Key controls", points: ["AI duplicate & blacklist check", "Workflow approval", "Vendor-risk monitoring"] },
      { lane: "Systems / tools", points: ["SAP MDG", "Ariba Sourcing", "Coupa", "D&B", "Dow Jones"] },
    ],
  },
};

/* ── Step 2 · Requisition to PO creation — PR-48201 ──────────────────────── */

const intakeStep: RunStep = {
  id: "intake",
  n: 2,
  title: "Requisition to PO creation",
  sub: "Turns the mill's note into a compliant PR",
  reasoning: [
    "Reading the maintenance note from the Containerboard mill",
    "Classifying — MRO · Conveyor & belting · material 88-DBX",
    "Guided buying — matching to the BeltPro framework 4600001207 (−8% vs list)",
    "Auto-coding the budget — cost center 0000041702 · headroom available",
    "Drafting requisition PR-48201",
  ],
  docLabel: "PR-48201 · Purchase requisition",
  document: <PurchaseRequisition />,
  sources: [
    {
      id: "maintenance-note",
      label: "Maintenance note",
      meta: "Outlook · 09:01",
      kind: "email",
      body: (
        <EmailDoc
          from="Dale Whitfield"
          fromAddr="dwhitfield@northgatepaper.com"
          to="Procurement Intake"
          sent="2026-06-03 · 09:01"
          subject="No.2 double-backer belt — wear beyond limit"
          lines={[
            "The double-backer belt on Corrugator No.2 is flagging wear beyond the limit. Reliability wants it replaced inside the week or we risk the line.",
            "It's the BeltPro 88-DBX we run on the MRO framework. Can you raise the requisition? Maintenance window is 2026-06-10.",
            "Charge it to Corrugating No.2 — cost center 41702. Thanks.",
          ]}
        />
      ),
    },
    {
      id: "policy-mro",
      label: "Spending policy",
      meta: "POL-MRO-04",
      kind: "policy",
      body: <SpendingPolicyDoc />,
    },
    {
      id: "framework-intake",
      label: "BeltPro framework",
      meta: "SAP ME33K · 4600001207",
      kind: "contract",
      body: <OutlineAgreementDoc />,
    },
    {
      id: "budget-intake",
      label: "Budget headroom",
      meta: "SAP CO · 0000041702",
      kind: "budget",
      body: <BudgetDoc />,
    },
  ],
  email: {
    cta: "Send the requisition confirmation",
    to: "Dale Whitfield · Reliability",
    subject: "PR-48201 raised — double-backer belt routed to sourcing",
    lines: [
      "Turned your note into requisition PR-48201 — matched the belt to catalog part 88-DBX on the BeltPro framework 4600001207, charged to cost center 41702.",
      "On-contract and under the $50k MRO ceiling, so it auto-submitted to sourcing. I'll keep this thread updated as the order moves.",
    ],
    toastTitle: "Requester confirmed",
    toastBody: "Dale Whitfield acknowledged the requisition — added to your sources.",
    reply: {
      from: "Dale Whitfield",
      receivedMeta: "Outlook · 09:14",
      subject: "RE: PR-48201 raised",
      lines: [
        "Thanks — that's the right part. We need it before the maintenance window on 2026-06-10.",
      ],
      source: {
        id: "intake-ack",
        label: "Requester reply",
        meta: "Outlook · 09:14",
        kind: "email",
        body: (
          <EmailDoc
            from="Dale Whitfield"
            fromAddr="dwhitfield@northgatepaper.com"
            to="Procurement Intake"
            sent="2026-06-03 · 09:14"
            subject="RE: PR-48201 raised"
            tone="inbound"
            lines={[
              "Thanks — that's the right part. We need it before the maintenance window on 2026-06-10.",
              "Appreciate the quick turn.",
            ]}
          />
        ),
      },
    },
  },
  recommendation:
    "On-contract · $48,200 under the $50k MRO ceiling · budget available. Met the L3 auto-submit rule — requisition drafted and routed to sourcing for the contract-bound PO.",
  stages: [
    {
      sourceId: "maintenance-note",
      reasoning: "Reading the maintenance note from the Containerboard mill",
      title: "Item — what's needed",
      fields: [
        { label: "Material", value: "88-DBX" },
        { label: "Short text", value: "Belt, double-backer — Corrugator No.2" },
        { label: "Quantity", value: "1 EA" },
        { label: "Delivery date", value: "2026-06-10", type: "date" },
        { label: "Plant", value: "M042 · Containerboard mill" },
        { label: "Requisitioner", value: "R. Alvarez · Reliability" },
      ],
    },
    {
      sourceId: "policy-mro",
      reasoning: "Checking the spending policy — on-contract, under the $50k MRO ceiling",
      title: "Release strategy",
      fields: [
        { label: "Purchasing org", value: "NG01 · Northgate North America" },
        { label: "Purchasing group", value: "P12 · MRO & Spares" },
        { label: "Release strategy", value: "MRO1 — auto-released · under the L3 limit" },
        { label: "Policy", value: "POL-MRO-04 · maintenance-spend" },
      ],
    },
    {
      sourceId: "framework-intake",
      reasoning: "Guided buying — matching to the BeltPro framework 4600001207 (−8% vs list)",
      title: "Source of supply",
      fields: [
        { label: "Fixed vendor", value: "BeltPro Industrial · 100482" },
        { label: "Outline agreement", value: "4600001207 · item 10" },
        { label: "Net price", value: "$48,200.00 (−8% vs list)" },
        { label: "Info record", value: "5300008841" },
      ],
    },
    {
      sourceId: "budget-intake",
      reasoning: "Auto-coding the budget — cost center 0000041702 · headroom available",
      title: "Account assignment",
      fields: [
        { label: "Account category", value: "K · Cost center" },
        { label: "G/L account", value: "510000 · Repairs & maintenance" },
        { label: "Cost center", value: "0000041702 · Corrugating No.2" },
        { label: "Recipient", value: "R. Alvarez" },
      ],
    },
  ],
  dossier: {
    swimlane: "Procurement Operations",
    rows: [
      { lane: "Key process steps", points: ["PR creation", "Budget check", "PO creation & approval"] },
      { lane: "AI intervention points", points: ["Guided buying (suggest vendors / catalogs)", "Auto-coding (GL, cost-center prediction)", "Spend analytics (off-contract detection)"] },
      { lane: "Value delivered", points: ["10–20% better spend compliance & PO accuracy"] },
      { lane: "Key controls", points: ["Budget + delegation matrix", "AI alerts on abnormal pricing / GL coding"] },
      { lane: "Systems / tools", points: ["SAP Ariba", "Coupa", "Jaggaer", "SAP S/4HANA", "ServiceNow"] },
    ],
  },
};

/* ── Step 3 · Contract & pricing alignment — RFQ-6600-2241 · PO-77310 ─────── */

const contractPoStep: RunStep = {
  id: "sourcing",
  agentName: "Sourcing & Contract Agent",
  n: 3,
  title: "Contract & pricing alignment",
  sub: "Awards the three-bid tender and binds the PO to contract",
  reasoning: [
    "Reading the requisition PR-48201 and the approved supplier pool",
    "Running the three-bid tender RFQ-6600-2241 — BeltPro wins",
    "Parsing framework 4600001207 — validating price −8% vs list",
    "Checking clause & terms compliance — Net 30, FCA, no deviation",
    "Binding the award to contract and issuing PO-77310",
  ],
  docLabel: "RFQ-6600-2241 award · PO-77310",
  document: (
    <div className="space-y-4">
      <RfqComparison />
      <PurchaseOrder />
    </div>
  ),
  sources: [
    {
      id: "pr-handoff",
      label: "PR-48201",
      meta: "from Intake · SAP ME53N",
      kind: "sap",
      handoff: true,
      body: <PurchaseRequisition />,
    },
    {
      id: "supplier-pool",
      label: "Supplier pool",
      meta: "3 qualified · MRO-CONV",
      kind: "master",
      body: <SupplierPoolDoc />,
    },
    {
      id: "framework-contract",
      label: "BeltPro framework",
      meta: "SAP ME33K · 4600001207",
      kind: "contract",
      body: <OutlineAgreementDoc />,
    },
    {
      id: "vendor-golden3",
      label: "Vendor 100482",
      meta: "golden · SAP XK03",
      kind: "master",
      body: <VendorRecordDoc variant="golden" />,
    },
    {
      id: "budget-contract",
      label: "Budget headroom",
      meta: "SAP CO · 0000041702",
      kind: "budget",
      body: <BudgetDoc />,
    },
  ],
  email: {
    cta: "Transmit the PO to BeltPro",
    to: "BeltPro Industrial · orders@beltpro.com",
    subject: "PO-77310 issued — 1 EA 88-DBX to Northgate Paper M042",
    lines: [
      "Issuing PO-77310 against framework 4600001207 · item 10 — 1 EA of 88-DBX at $48,200.00 net, FCA Memphis DC, Net 30.",
      "Requested delivery 2026-06-10 to the Containerboard mill (M042). Please acknowledge and confirm the ship date.",
    ],
    toastTitle: "Order acknowledged",
    toastBody: "BeltPro confirmed PO-77310 — order acknowledgement added to your sources.",
    reply: {
      from: "BeltPro Industrial",
      receivedMeta: "Outlook · 14:22",
      subject: "RE: PO-77310 — order confirmed",
      lines: [
        "PO-77310 acknowledged. Confirmed to ship 2026-06-08, delivery 06-09 — one day ahead of contract.",
      ],
      source: {
        id: "po-ack",
        label: "Order acknowledgement",
        meta: "BPI-OC-8841 · 14:22",
        kind: "email",
        body: (
          <EmailDoc
            from="BeltPro Industrial"
            fromAddr="orders@beltpro.com"
            to="Sourcing & Contract Agent"
            sent="2026-06-03 · 14:22"
            subject="RE: PO-77310 — order confirmed"
            tone="inbound"
            lines={[
              "PO-77310 acknowledged. Confirmed to ship 2026-06-08, delivery 06-09 — one day ahead of contract.",
              "Order confirmation BPI-OC-8841 attached. Net 30 as agreed.",
            ]}
          />
        ),
      },
    },
  },
  recommendation:
    "BeltPro's three-bid win is on-contract — price validated at −8% vs list against framework 4600001207, clauses and Net-30 terms match with no deviation. PO-77310 bound to contract, budget available — ready to post and transmit.",
  stages: [
    {
      sourceId: "pr-handoff",
      reasoning: "Reading PR-48201 and scoring the three-bid shortlist",
      title: "Three-bid award",
      fields: [
        { label: "Bidders", value: "BeltPro · Heartland Rubber · Midwest Belting" },
        { label: "Award to", value: "BeltPro Industrial · 100482" },
        { label: "Delivered cost", value: "$48,200.00 (−8% vs list)" },
        { label: "Lead time", value: "5 days · delivery 2026-06-09" },
      ],
    },
    {
      sourceId: "framework-contract",
      reasoning: "Parsing the framework — price benchmarking & clause-deviation check",
      title: "Contract & pricing validation",
      fields: [
        { label: "Framework", value: "4600001207 · item 10" },
        { label: "List price", value: "$52,391.30 / 1 EA" },
        { label: "Framework discount", value: "−8.0%" },
        { label: "Validated net", value: "$48,200.00" },
        { label: "Clause / terms check", value: "No deviation · Net 30 · FCA Memphis DC" },
      ],
    },
    {
      sourceId: "vendor-golden3",
      reasoning: "Binding the PO to the golden vendor and contract terms",
      title: "PO header & terms",
      fields: [
        { label: "Vendor", value: "100482 · BeltPro Industrial" },
        { label: "Company code", value: "1000 · Northgate Paper" },
        { label: "Payment terms", value: "NT30 · Net 30 days", options: ["NT30 · Net 30 days", "NT45 · Net 45 days", "NT60 · Net 60 days", "NT90 · Net 90 days"] },
        { label: "Incoterms", value: "FCA · Memphis DC" },
        { label: "Reference agreement", value: "4600001207 · item 10" },
        { label: "Tax code", value: "U1 · self-assessed use tax" },
      ],
    },
    {
      sourceId: "budget-contract",
      reasoning: "Compliance check — PO vs contract & budget, then post to SAP",
      title: "Conditions & account assignment",
      fields: [
        { label: "Net value", value: "$48,200.00" },
        { label: "G/L account", value: "510000 · Repairs & maintenance" },
        { label: "Cost center", value: "0000041702 · Corrugating No.2" },
        { label: "Delivery date", value: "2026-06-10", type: "date" },
      ],
    },
  ],
  dossier: {
    swimlane: "Procurement Operations",
    rows: [
      { lane: "Key process steps", points: ["Contract storage", "Price validation", "Terms enforcement"] },
      { lane: "AI intervention points", points: ["GenAI contract parsing (extract clauses & pricing)", "AI price benchmarking", "Clause-deviation detection"] },
      { lane: "Value delivered", points: ["2–5% cost-leakage reduction"] },
      { lane: "Key controls", points: ["Auto-validation against contract terms", "AI alerts on price mismatches"] },
      { lane: "Systems / tools", points: ["Icertis", "Sirion", "ContractPodAi", "OpenText"] },
    ],
  },
};

/* ── Step 4 · Goods receipt / service entry — GR-77310 ───────────────────── */

const grnStep: RunStep = {
  id: "po",
  n: 4,
  title: "Goods receipt / service entry",
  sub: "Receives the belt and posts the GR",
  reasoning: [
    "Tracking PO-77310 against the contracted date 2026-06-09",
    "Receiving the carrier delivery — note BPI-DN-5567",
    "Confirming on the dock — 1 EA, inspected, item OK",
    "Enforcing the control — no invoice can post without this GR",
    "Posting GR-77310 (movement 101) to the maintenance store",
  ],
  docLabel: "GR-77310 · Goods receipt",
  document: <GoodsReceipt />,
  sources: [
    { id: "po-handoff", label: "PO-77310", meta: "from Sourcing · SAP ME23N", kind: "sap", handoff: true, body: <PurchaseOrder /> },
    { id: "delivery-note", label: "Delivery note", meta: "BPI-DN-5567 · 07:30", kind: "email", body: deliveryNote },
    { id: "framework-grn", label: "BeltPro framework", meta: "SAP ME33K · 4600001207", kind: "contract", body: <OutlineAgreementDoc /> },
  ],
  recommendation:
    "Belt received in full — 1 EA, inspected, item OK against PO-77310. GR-77310 posted (movement 101) to the maintenance store. The three-way control is now armed: no invoice can post or pay without this goods receipt.",
  stages: [
    {
      sourceId: "po-handoff",
      reasoning: "Tracking PO-77310 against the contracted date 2026-06-09",
      title: "Receipt header",
      fields: [
        { label: "Movement type", value: "101 · GR goods receipt for PO" },
        { label: "PO reference", value: "PO-77310 · item 10" },
        { label: "Delivery note", value: "BPI-DN-5567" },
        { label: "Posting date", value: "2026-06-09", type: "date" },
      ],
    },
    {
      sourceId: "delivery-note",
      reasoning: "Confirming the delivery on the dock — 1 EA, inspected",
      title: "Receipt & stock posting",
      fields: [
        { label: "Material", value: "88-DBX" },
        { label: "Received", value: "1 of 1 EA" },
        { label: "Stock type", value: "Unrestricted-use" },
        { label: "OK indicator", value: "Item OK · inspected" },
        { label: "Storage location", value: "MNT1 · Maintenance store" },
      ],
    },
  ],
  dossier: {
    swimlane: "Procurement Operations",
    rows: [
      { lane: "Key process steps", points: ["Goods receipt", "Service-entry approval"] },
      { lane: "AI intervention points", points: ["Predictive GRN creation (services)", "IoT / digital-proof validation", "NLP on emails / documents to confirm completion"] },
      { lane: "Value delivered", points: ["20–40% fewer missing-GRN issues"] },
      { lane: "Key controls", points: ["System-enforced — no invoice without GRN", "AI flags delays / inconsistencies"] },
      { lane: "Systems / tools", points: ["SAP S/4HANA", "Coupa", "Oracle Cloud", "IoT platforms"] },
    ],
  },
};

/* ════════════════════════════════════════════════════════════════════════
 * ACCOUNTS PAYABLE (DOWNSTREAM) · 5 steps
 * ════════════════════════════════════════════════════════════════════════ */

/**
 * The four-way-match comparison grid the Invoice agent builds up as it reads
 * each file. Columns fill left → right (invoice seeded, then PO, then GR, then
 * contract); a row's verdict tick lights once every column that carries the
 * dimension agrees. "—" means the dimension doesn't apply to that document.
 */
const beltMatchColumns = [
  { key: "invoice", label: "Invoice" },
  { key: "po", label: "PO" },
  { key: "gr", label: "GR" },
  { key: "contract", label: "Contract" },
];
const beltMatchRows = [
  {
    dimension: "Unit price (USD)",
    cells: {
      invoice: { value: "48,200.00", ok: true },
      po: { value: "48,200.00", ok: true },
      gr: { value: "—", ok: false },
      contract: { value: "48,200.00", ok: true },
    },
  },
  {
    dimension: "Quantity (EA)",
    cells: {
      invoice: { value: "1", ok: true },
      po: { value: "1", ok: true },
      gr: { value: "1", ok: true },
      contract: { value: "1", ok: true },
    },
  },
  {
    dimension: "Net value (USD)",
    cells: {
      invoice: { value: "48,200.00", ok: true },
      po: { value: "48,200.00", ok: true },
      gr: { value: "48,200.00", ok: true },
      contract: { value: "48,200.00", ok: true },
    },
  },
  {
    dimension: "Tax code",
    cells: {
      invoice: { value: "U1", ok: true },
      po: { value: "U1", ok: true },
      gr: { value: "—", ok: false },
      contract: { value: "U1", ok: true },
    },
  },
  {
    dimension: "Payment terms",
    cells: {
      invoice: { value: "Net 30", ok: true },
      po: { value: "Net 30", ok: true },
      gr: { value: "—", ok: false },
      contract: { value: "Net 30", ok: true },
    },
  },
];

/** Match-only / posted views of the belt invoice, derived from the full doc. */
const invoiceMatchOnly: SapInvoice = {
  ...invoiceBelt,
  status: "Matched · clean · ready to post",
  postingJournal: undefined,
  paymentJournal: undefined,
};
const invoicePosted: SapInvoice = {
  ...invoiceBelt,
  status: "Posted · GR/IR cleared · AP booked",
  paymentJournal: undefined,
};

/** Today's AP batch context — folds the finance→procurement Match & pay move. */
const beltBatchPanel = (
  <div className="rounded-md border border-divider bg-surface-fog/40 px-4 py-3">
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] uppercase tracking-[0.08em] text-mute font-bold">Today's AP batch</span>
      <span className="text-[11px] text-mute">four-way match · same controls</span>
    </div>
    <div className="grid grid-cols-3 gap-2 mt-2">
      <div className="rounded border border-surface-mint bg-surface-mint/40 px-2.5 py-2 text-center">
        <div className="text-[17px] font-bold text-[#0a5c2b] tabular-nums leading-none">186</div>
        <div className="text-[10px] text-mute mt-1">four-way clean · paid</div>
      </div>
      <div className="rounded border border-divider bg-white px-2.5 py-2 text-center">
        <div className="text-[17px] font-bold text-ink tabular-nums leading-none">204</div>
        <div className="text-[10px] text-mute mt-1">in today's run</div>
      </div>
      <div className="rounded border border-mark-red/30 bg-surface-rose/40 px-2.5 py-2 text-center">
        <div className="text-[17px] font-bold text-mark-red tabular-nums leading-none">18</div>
        <div className="text-[10px] text-mute mt-1">held · routed to buyer</div>
      </div>
    </div>
    <p className="text-[11.5px] text-ink leading-snug mt-2.5">
      Belt invoice <span className="font-semibold">BPI-5567</span> is one of the 186 clean. Lead exception:{" "}
      <span className="font-semibold">Midwest Belting INV-MW-0991</span> — +$310 over contract 4600000934, routed to
      exception handling next. The exceptions are the signal that feeds procurement, not noise.
    </p>
  </div>
);

/* ── Step 5 · Invoice receipt & capture — BPI-5567 ───────────────────────── */

const captureStep: RunStep = {
  id: "invoice",
  agentName: "Invoice Capture Agent",
  n: 5,
  title: "Invoice receipt & capture",
  sub: "Captures and classifies the supplier invoice",
  reasoning: [
    "Receiving invoice BPI-5567 from BeltPro by email",
    "Running IDP — extracting vendor, amount, terms and tax",
    "Auto-classifying — PO-backed invoice against PO-77310",
    "Checking for duplicates — no prior capture of BPI-5567",
    "Routing the captured invoice into the four-way-match queue",
  ],
  docLabel: "BPI-5567 · captured & classified",
  document: <VendorInvoiceDoc />,
  sources: [
    { id: "invoice-pdf", label: "Supplier invoice", meta: "BPI-5567 · PDF", kind: "invoice", body: <VendorInvoiceDoc /> },
    { id: "po-capture", label: "PO-77310", meta: "SAP ME23N", kind: "sap", body: <PurchaseOrder /> },
  ],
  recommendation:
    "Invoice BPI-5567 captured by IDP at 0.98 confidence — classified as a PO-backed invoice against PO-77310, no duplicate found. Routed to the four-way match. Approve to match it.",
  stages: [
    {
      sourceId: "invoice-pdf",
      reasoning: "Reading the supplier invoice received by email — BPI-5567",
      title: "IDP extraction",
      fields: [
        { label: "Vendor", value: "100482 · BeltPro Industrial" },
        { label: "Invoice reference", value: "BPI-5567" },
        { label: "Invoice date", value: "2026-06-09", type: "date" },
        { label: "Gross amount", value: "USD 48,200.00" },
        { label: "Tax (U1)", value: "USD 0.00" },
        { label: "Stated terms", value: "Net 30", options: ["Net 30", "Net 45", "Net 60", "Net 90"] },
      ],
    },
    {
      sourceId: "po-capture",
      reasoning: "Auto-classifying and checking for duplicates",
      title: "Classification & duplicate check",
      fields: [
        { label: "Type", value: "PO-backed invoice" },
        { label: "PO reference", value: "PO-77310 · item 10" },
        { label: "Duplicate check", value: "No prior capture · unique" },
        { label: "Extraction confidence", value: "0.98 · high" },
        { label: "Route", value: "→ four-way match queue" },
      ],
    },
  ],
  dossier: {
    swimlane: "Accounts Payable",
    rows: [
      { lane: "Key process steps", points: ["Invoice receipt (email / EDI / paper)", "Data entry"] },
      { lane: "AI intervention points", points: ["IDP (OCR + NLP) invoice-data extraction", "Auto-classification (PO / non-PO, invoice type)", "Duplicate-invoice detection"] },
      { lane: "Value delivered", points: ["70–90% touchless data capture & classification"] },
      { lane: "Key controls", points: ["Duplicate detection before posting", "Audit trail of AI extraction confidence"] },
      { lane: "Systems / tools", points: ["ABBYY", "Kofax", "Rossum", "SAP Document Information Extraction"] },
    ],
  },
};

/* ── Step 6 · Invoice matching (2/3-way) — INV-BPI-5567 ──────────────────── */

const matchStep: RunStep = {
  id: "invoice",
  agentName: "Invoice Matching Agent",
  n: 6,
  title: "Invoice matching (2/3-way)",
  sub: "Four-way matches the captured invoice",
  reasoning: [
    "Reading the captured invoice BPI-5567",
    "Running the four-way match — contract ↔ PO ↔ goods receipt ↔ invoice",
    "Checking price and quantity — $48,200 · 1 EA · all agree",
    "Applying tolerance — variance $0.00, within threshold",
    "Clearing the belt and sweeping today's AP batch",
  ],
  docLabel: "INV-BPI-5567 · four-way match",
  document: (
    <div className="space-y-4">
      <InvoiceMatch invoice={invoiceMatchOnly} />
      {beltBatchPanel}
    </div>
  ),
  sources: [
    { id: "invoice-handoff", label: "BPI-5567", meta: "from Capture · classified", kind: "invoice", handoff: true, body: <VendorInvoiceDoc /> },
    { id: "po-match", label: "PO-77310", meta: "SAP ME23N", kind: "sap", body: <PurchaseOrder /> },
    { id: "gr-match", label: "GR-77310", meta: "SAP MIGO · plant-posted", kind: "sap", body: <GoodsReceipt /> },
    { id: "framework-match", label: "BeltPro framework", meta: "SAP ME33K · 4600001207", kind: "contract", body: <OutlineAgreementDoc /> },
  ],
  recommendation:
    "Belt invoice is four-way clean — contract, PO, goods receipt and invoice agree at $48,200 with $0 variance, within tolerance. In today's batch of 204, 186 cleared the same way; 18 broke on a price, quantity or receipt gap — led by Midwest Belting (+$310 over contract), routed to exception handling next.",
  stages: [
    {
      sourceId: "po-match",
      reasoning: "Matching against PO-77310 — price, quantity, net value",
      title: "Four-way match — invoice vs PO",
      matchGrid: { columns: beltMatchColumns, rows: beltMatchRows, reveal: ["invoice", "po"] },
    },
    {
      sourceId: "gr-match",
      reasoning: "Matching against the goods receipt GR-77310 — received quantity",
      title: "Four-way match — adding the goods receipt",
      matchGrid: { columns: beltMatchColumns, rows: beltMatchRows, reveal: ["invoice", "po", "gr"] },
    },
    {
      sourceId: "framework-match",
      reasoning: "Confirming the contract price and the four-way verdict",
      title: "Four-way match — adding the contract · verdict",
      matchGrid: {
        columns: beltMatchColumns,
        rows: beltMatchRows,
        reveal: ["invoice", "po", "gr", "contract"],
        verdict: "All four agree · variance USD 0.00 · contract −8% vs list · clean",
      },
    },
  ],
  dossier: {
    swimlane: "Accounts Payable",
    rows: [
      { lane: "Key process steps", points: ["Match invoice vs PO vs GRN", "Exception identification"] },
      { lane: "AI intervention points", points: ["AI matching engine (fuzzy price / qty tolerance)", "ML learns from past exceptions", "Semantic matching for unstructured data"] },
      { lane: "Value delivered", points: ["25–40% fewer exceptions · higher first-pass match"] },
      { lane: "Key controls", points: ["Tolerance thresholds with AI recommendations", "Exception clustering & pattern detection"] },
      { lane: "Systems / tools", points: ["SAP S/4HANA", "Oracle Cloud AP", "BlackLine Match", "Tradeshift"] },
    ],
  },
};

/* ── Step 7 · Exception handling & workflow — INV-MW-0991 ────────────────── */

const midwestException: ExceptionResolution = {
  title: "Price exception · routed to procurement",
  gates: [
    { name: "Contract price", state: "tripped", result: "Midwest Belting billed $4,610 — $310 (7.2%) over the contracted $4,300 on framework 4600000934." },
    { name: "Quantity match", state: "clear", result: "Invoiced quantity matches the PO and the goods receipt." },
    { name: "Duplicate check", state: "clear", result: "No prior capture of INV-MW-0991." },
    { name: "Price tolerance", state: "tripped", result: "+7.2% is outside the ±2% price tolerance — held, not auto-paid." },
  ],
  evidence: [
    { label: "INV-MW-0991", detail: "Midwest Belting · $4,610 billed vs $4,300 on contract · +$310" },
    { label: "Contract 4600000934", detail: "framework price $4,300 · Net 30 · price-protection clause" },
    { label: "Batch sweep", detail: "18 of 204 held · this is the lead price exception" },
  ],
  handoff: {
    to: "Buyer · MRO & belting",
    sla: "decision due in 4 business hours",
    nextStep: "hold payment, query Midwest on the price link, and feed the deviation back to the contract owner.",
  },
  audit: {
    id: "EXC-MW-0991-PRICE",
    logged: "2026-06-09 · 14:46",
    note: "price exception · payment held · routed to the buyer with the contract evidence.",
  },
  draft: {
    to: "Midwest Belting · Accounts Receivable",
    subject: "INV-MW-0991 — price query · $310 over contract 4600000934",
    lines: [
      "Invoice INV-MW-0991 bills $4,610 against contract 4600000934, which fixes the price at $4,300 — a $310 (7.2%) variance. We're holding the line for payment until it's reconciled.",
      "Please confirm the contracted price or issue a corrected invoice. We've flagged the deviation to our contract owner so the framework stays enforced on future orders.",
      "Audit ref EXC-MW-0991-PRICE.",
    ],
    sendLabel: "Send the price query",
    sentLabel: "Sent · routed to procurement",
  },
};

const exceptionStep: RunStep = {
  id: "invoice",
  agentName: "Exception & Workflow Agent",
  n: 7,
  title: "Exception handling & workflow",
  sub: "Routes the batch exception back to procurement",
  reasoning: [
    "Picking up the 18 held invoices from the match sweep",
    "Clustering — 11 price, 4 quantity, 3 receipt-timing",
    "Predictive routing — the lead breaks to the owning buyer",
    "Root cause — Midwest Belting billed +$310 over contract 4600000934",
    "Drafting the dispute and routing it back to procurement",
  ],
  docLabel: "INV-MW-0991 · exception routed to procurement",
  document: <ExceptionResolutionCard ex={midwestException} />,
  sources: [
    { id: "mw-invoice", label: "INV-MW-0991", meta: "Midwest · 11:18", kind: "invoice", body: midwestInvoiceEmail },
    { id: "mw-contract", label: "Contract 4600000934", meta: "SAP ME33K · price-protected", kind: "contract", body: <OutlineAgreementDoc /> },
  ],
  recommendation:
    "The belt invoice is clean and proceeds. The batch threw 18 exceptions — the lead is Midwest Belting INV-MW-0991, billed $310 over contract 4600000934. The agent drafted a dispute and routed it to the owning buyer; this is the signal that feeds procurement. Approve to continue the belt run.",
  dossier: {
    swimlane: "Accounts Payable",
    rows: [
      { lane: "Key process steps", points: ["Route exceptions", "Buyer / vendor resolution"] },
      { lane: "AI intervention points", points: ["Predictive routing to the right owner", "GenAI copilot drafts emails / summarizes issues", "Root-cause analytics"] },
      { lane: "Value delivered", points: ["30–50% faster exception resolution"] },
      { lane: "Key controls", points: ["Escalation workflows", "AI flags recurring supplier issues", "Explainable AI logs"] },
      { lane: "Systems / tools", points: ["ServiceNow", "SAP Workflow", "UiPath", "MS Copilot"] },
    ],
  },
};

/* ── Step 8 · Invoice posting & accounting — INV-BPI-5567 ────────────────── */

const postingStep: RunStep = {
  id: "invoice",
  agentName: "Invoice Posting Agent",
  n: 8,
  title: "Invoice posting & accounting",
  sub: "Posts the ledger and validates the accrual",
  reasoning: [
    "Reading the clean four-way match for BPI-5567",
    "Posting in MIRO — clearing GR/IR, booking the $48,200 AP liability",
    "Classifying the GL — R&M 510000 · cost center 0000041702",
    "Validating the accrual — GR/IR nets to zero, no GR-invoice gap",
    "Scanning for anomalies — none · ready to schedule payment",
  ],
  docLabel: "INV-BPI-5567 · posted (MIRO → FI)",
  document: <InvoiceMatch invoice={invoicePosted} />,
  sources: [
    { id: "invoice-handoff8", label: "INV-BPI-5567", meta: "from Matching · clean", kind: "invoice", handoff: true, body: <InvoiceMatch invoice={invoiceMatchOnly} /> },
    { id: "gr-handoff8", label: "GR-77310", meta: "SAP MIGO · GR/IR", kind: "sap", handoff: true, body: <GoodsReceipt /> },
    { id: "framework-post", label: "BeltPro framework", meta: "SAP ME33K · 4600001207", kind: "contract", body: <OutlineAgreementDoc /> },
  ],
  recommendation:
    "Four-way clean, so posted straight through in MIRO — GR/IR cleared against GR-77310 and the $48,200 AP liability booked to R&M. Accrual validated (no GR-invoice gap) and no anomalies. Ready to schedule payment.",
  stages: [
    {
      sourceId: "invoice-handoff8",
      reasoning: "Posting in MIRO — clearing GR/IR and booking the AP liability",
      title: "General ledger — invoice posting (MIRO)",
      fields: [
        { label: "Dr · 191100 GR/IR clearing", value: "USD 48,200.00" },
        { label: "Cr · 160000 Accounts payable", value: "USD 48,200.00" },
        { label: "Document type", value: "RE · invoice receipt" },
        { label: "Balance", value: "USD 0.00 · Dr = Cr" },
      ],
    },
    {
      sourceId: "gr-handoff8",
      reasoning: "Validating the accrual — GR/IR gap and anomaly scan",
      title: "Accrual validation",
      fields: [
        { label: "GR/IR balance", value: "USD 0.00 · cleared" },
        { label: "GR vs invoice gap", value: "None" },
        { label: "Anomaly scan", value: "Clear · no outlier" },
        { label: "Posting period", value: "2026-06 · open" },
      ],
    },
  ],
  dossier: {
    swimlane: "Accounts Payable",
    rows: [
      { lane: "Key process steps", points: ["Invoice posting", "Accrual validation"] },
      { lane: "AI intervention points", points: ["Auto-accounting (GL classification)", "Accrual prediction (GRN vs invoice gap)", "Anomaly detection in accruals"] },
      { lane: "Value delivered", points: ["Higher financial accuracy & faster close"] },
      { lane: "Key controls", points: ["GL validation rules", "Journal approval workflows", "Explainable AI logs"] },
      { lane: "Systems / tools", points: ["SAP S/4HANA FI", "Oracle Financials", "BlackLine", "Workiva"] },
    ],
  },
};

/* ── Step 9 · Payment processing — INV-BPI-5567 · F110 ───────────────────── */

const paymentStep: RunStep = {
  id: "invoice",
  agentName: "Payment & Treasury Agent",
  n: 9,
  title: "Payment processing",
  sub: "Validates the bank, screens fraud, schedules F110",
  reasoning: [
    "Reading the posted AP item for BPI-5567",
    "Validating the payee bank — ••••4471 matches the vendor master",
    "Screening fraud — score 0.02, no bank-detail change",
    "Checking dynamic discounting — none beats the 6.6% cost of capital",
    "Scheduling the F110 run for the Net-30 date 2026-07-09",
  ],
  docLabel: "INV-BPI-5567 · payment run (F110)",
  document: <InvoiceMatch invoice={invoiceBelt} />,
  sources: [
    { id: "invoice-handoff9", label: "INV-BPI-5567", meta: "from Posting · AP item", kind: "sap", handoff: true, body: <InvoiceMatch invoice={invoicePosted} /> },
    { id: "vendor-bank", label: "Vendor 100482", meta: "golden · bank on file", kind: "master", body: <VendorRecordDoc variant="golden" /> },
    { id: "framework-pay", label: "BeltPro framework", meta: "SAP ME33K · 4600001207", kind: "contract", body: <OutlineAgreementDoc /> },
  ],
  email: {
    cta: "Send the remittance advice",
    to: "BeltPro Industrial · ar@beltpro.com",
    subject: "Remittance advice — invoice BPI-5567 cleared for payment",
    lines: [
      "Invoice BPI-5567 ($48,200.00) passed the four-way match with $0 variance and cleared the fraud check (score 0.02). Released to AP for payment on Net 30.",
      "Payment settles on the due date to the account on file. This is your remittance advice — no action needed.",
    ],
    toastTitle: "Remittance confirmed",
    toastBody: "BeltPro confirmed the remittance — added to your sources.",
    reply: {
      from: "BeltPro Industrial",
      receivedMeta: "Outlook · 15:02",
      subject: "RE: Remittance advice — BPI-5567",
      lines: [
        "Thank you — remittance received and matched to BPI-5567. Account on file confirmed.",
      ],
      source: {
        id: "inv-remit",
        label: "Remittance confirmation",
        meta: "Outlook · 15:02",
        kind: "email",
        body: (
          <EmailDoc
            from="BeltPro Industrial"
            fromAddr="ar@beltpro.com"
            to="Payment & Treasury Agent"
            sent="2026-06-03 · 15:02"
            subject="RE: Remittance advice — BPI-5567"
            tone="inbound"
            lines={[
              "Thank you — remittance received and matched to BPI-5567. Account on file confirmed.",
              "We'll mark the invoice paid on settlement.",
            ]}
          />
        ),
      },
    },
  },
  recommendation:
    "Bank ••••4471 verified against the vendor master, fraud score 0.02, no mid-stream bank change. No dynamic discount beats the 6.6% cost of capital, so payment holds to the Net-30 date. F110 scheduled for 2026-07-09 with dual approval. Approve to release the payment run.",
  stages: [
    {
      sourceId: "vendor-bank",
      reasoning: "Validating the payee bank against the vendor master",
      title: "Bank validation & fraud",
      fields: [
        { label: "Payee bank", value: "084000026 · ••••4471" },
        { label: "Vendor master", value: "100482 · matches on file" },
        { label: "Bank-detail change", value: "None" },
        { label: "Fraud score", value: "0.02 · low" },
      ],
    },
    {
      sourceId: "framework-pay",
      reasoning: "Checking dynamic discounting against the cost of capital",
      title: "Dynamic discounting",
      fields: [
        { label: "Early-pay offer", value: "None on this invoice" },
        { label: "Cost of capital", value: "6.6%" },
        { label: "Decision", value: "Hold cash to the net date" },
        { label: "Working-capital note", value: "No early-pay beats 6.6%" },
      ],
    },
    {
      sourceId: "invoice-handoff9",
      reasoning: "Scheduling the F110 payment run on the net date",
      title: "AI recommendation — payment run",
      narrative:
        "Contract 4600001207 fixes BeltPro at Net 30 and no early-pay discount beats our 6.6% cost of capital, so I'm holding cash to the net date. Baseline is the 2026-06-09 invoice date → due 2026-07-09; the bank ••••4471 is verified against the vendor master and the fraud score is 0.02. F110 scheduled for 2026-07-09 with dual approval. Adjust any term or date before you approve.",
      fields: [
        { label: "Recommended terms", value: "NT30 · Net 30", options: ["NT30 · Net 30", "NT45 · Net 45", "NT60 · Net 60", "NT90 · Net 90"] },
        { label: "Per contract", value: "4600001207 · not Net 60/90" },
        { label: "Baseline date", value: "2026-06-09", type: "date" },
        { label: "Net due date", value: "2026-07-09", type: "date" },
        { label: "Cash discount", value: "None · pay on the net date", options: ["None · pay on the net date", "2% 10 · net 30", "1% 15 · net 30"] },
        { label: "Payment method", value: "F110 · bank ACH" },
        { label: "Dual approval", value: "Required · over $25k" },
        { label: "Payment run (F110)", value: "2026-07-09", type: "date" },
      ],
    },
  ],
  dossier: {
    swimlane: "Accounts Payable",
    rows: [
      { lane: "Key process steps", points: ["Payment run", "Bank-file creation"] },
      { lane: "AI intervention points", points: ["Fraud detection (bank-details anomaly)", "Payment-pattern anomaly", "Dynamic-discounting optimization"] },
      { lane: "Value delivered", points: ["2–5% working-capital improvement / discount capture"] },
      { lane: "Key controls", points: ["Vendor bank validation", "Payment-anomaly monitoring", "Dual approval + AI alerts"] },
      { lane: "Systems / tools", points: ["SAP S/4HANA", "Kyriba", "TIS", "Treasury"] },
    ],
  },
};

/* ════════════════════════════════════════════════════════════════════════
 * Exports — the two swimlanes
 * ════════════════════════════════════════════════════════════════════════ */

/** Procurement Operations (upstream) — runs from the belt cockpit decision. */
export const beltUpstreamSteps: RunStep[] = [vendorStep, intakeStep, contractPoStep, grnStep];

/** Accounts Payable (downstream) — runs from the invoice cockpit decision. */
export const beltDownstreamSteps: RunStep[] = [captureStep, matchStep, exceptionStep, postingStep, paymentStep];
