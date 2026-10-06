/**
 * The hero OCC settlement run — five gated agent steps in process order.
 *
 * Each step is one specialist agent doing its job on the same inbound OCC live
 * load (lane CHI→RIV, carrier Summit Carriers, invoice INV-SUM-5567): it reads
 * upstream evidence (clickable source files), streams its reasoning, produces a
 * freight artifact, and pauses for a human decision. Approve hands the output to
 * the next agent. The Settlement step runs the three-way check (Invoice ×
 * Shipment × Contract), clears the in-tolerance line and drafts a carrier
 * dispute for the five flagged lines — the AI drafts it, the human sends it.
 *
 * Process order — Lane Intake → Rate & Surcharge → Carrier Tender → Load Capture
 * → Freight Settlement. Every figure ties out: billed $15,790 · clears $13,144 ·
 * disputed $2,646.
 */

import * as React from "react";
import type { AgentId } from "@/freight/data/agents";
import {
  LaneIntakePacket,
  LaneMasterDoc,
  RateValidationDoc,
  CarrierTenderDoc,
  LoadPacketDoc,
  CarrierInvoiceDoc,
  RateCardDoc,
  GateLogDoc,
  WeighTicketDoc,
} from "@/freight/components/docs/freight/FreightDocs";
import { EmailDoc } from "@/freight/components/docs/sources";
import { ReconciliationBoard, type ReconLine } from "@/freight/components/workspace/recon/ReconciliationBoard";
import { WeightRealityGauge } from "@/freight/components/workspace/recon/WeightRealityGauge";
import { ClassificationScope } from "@/freight/components/workspace/recon/ClassificationScope";
import { AccessorialScope } from "@/freight/components/workspace/recon/AccessorialScope";
import { DetentionClock } from "@/freight/components/workspace/recon/DetentionClock";
import { LeakageBridge } from "@/freight/components/workspace/recon/LeakageBridge";
import {
  DuplicateBillingRadar,
  type SettledInvoiceRow,
} from "@/freight/components/workspace/recon/DuplicateBillingRadar";

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

/** One evaluated control in the settlement envelope. */
export type ControlGate = {
  name: string;
  result: string;
  state: "clear" | "tripped";
};

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
  /** Must match one of the step's sources[].id — rendered on the right. */
  sourceId: string;
  /** The reasoning line for this stage (spins until Proceed). */
  reasoning: string;
  /** The form-box section title. */
  title: string;
  /** Auto-filled, editable fields extracted from the source. */
  fields: { label: string; value: string }[];
};

export type RunStep = {
  id: AgentId;
  agentName?: string;
  n: number;
  title: string;
  sub: string;
  reasoning: string[];
  docLabel: string;
  document: React.ReactNode;
  sources: SourceArtifact[];
  email?: EmailAction;
  recommendation: string;
  exception?: ExceptionResolution;
  stages?: ExtractStage[];
  /** The produced report surfaced red exceptions → the primary action turns amber. */
  hasExceptions?: boolean;
  /** Overrides the primary-action button label (used with hasExceptions). */
  approveLabel?: string;
};

/* ── Step 1 · Lane intake — FRT-48201 ─────────────────────────────────────── */

const intakeStep: RunStep = {
  id: "intake",
  n: 1,
  title: "Lane intake — classify",
  sub: "Turns the pickup requirement into a tender-ready lane",
  reasoning: [
    "Reading the pickup requirement from the Chicago DC",
    "Classifying — OCC · live load · lane CHI→RIV",
    "Matching to an approved movement pattern · confidence 98%",
    "Checking the Riverside mill receiving window",
    "Drafting lane packet FRT-48201",
  ],
  docLabel: "FRT-48201 · Lane intake packet",
  document: <LaneIntakePacket />,
  sources: [
    {
      id: "pickup-req",
      label: "Pickup requirement",
      meta: "Intake portal · 09:00",
      kind: "email",
      body: (
        <EmailDoc
          from="Chicago DC · dispatch"
          fromAddr="dispatch@northgatepaper.com"
          to="Lane Intake"
          sent="2026-06-19 · 09:00"
          subject="OCC pickup — Chicago DC → Riverside mill"
          lines={[
            "We have ~20 t of baled OCC ready at the Chicago DC for the Riverside mill. Needs a live-load pickup today, receiving tomorrow morning.",
            "Run it on the contracted CHI→RIV lane. Reference the DC source.",
          ]}
        />
      ),
    },
    {
      id: "lane-master",
      label: "Lane master",
      meta: "CHI→RIV · approved",
      kind: "contract",
      body: <LaneMasterDoc />,
    },
  ],
  recommendation:
    "Approved OCC live-load pattern on a known lane · inside the mill receiving window. Met the auto-classify rule — lane packet drafted.",
  stages: [
    {
      sourceId: "pickup-req",
      reasoning: "Reading the pickup requirement from the Chicago DC",
      title: "Pickup — what's moving",
      fields: [
        { label: "Origin", value: "Chicago DC · retail/DC source" },
        { label: "Destination", value: "Riverside mill · M042" },
        { label: "Grade", value: "OCC · old corrugated containers" },
        { label: "Haul type", value: "Live load" },
      ],
    },
    {
      sourceId: "lane-master",
      reasoning: "Matching to an approved movement pattern · lane CHI→RIV",
      title: "Lane & window",
      fields: [
        { label: "Lane", value: "CHI → RIV" },
        { label: "Movement pattern", value: "Approved · OCC live load" },
        { label: "Receiving window", value: "2026-06-20 · 06:00–14:00" },
        { label: "Confidence", value: "98% · auto-classified" },
      ],
    },
  ],
};

/* ── Step 2 · Rate & surcharge — RATE-CHI-RIV ─────────────────────────────── */

const sourcingStep: RunStep = {
  id: "sourcing",
  n: 2,
  title: "Rate & surcharge — validate",
  sub: "Checks the rate and normalises the surcharge",
  reasoning: [
    "Reading lane packet FRT-48201",
    "Pulling the contracted rate card RC-OCC-2026",
    "Line haul $11,200 — on-contract, inside tolerance",
    "Normalising the fuel surcharge against the index",
    "Flag — surcharge billed as a flat fee vs the contracted percentage",
  ],
  docLabel: "RATE-CHI-RIV · Rate & surcharge",
  document: <RateValidationDoc />,
  sources: [
    {
      id: "lane-handoff",
      label: "FRT-48201",
      meta: "from Lane Intake",
      kind: "sap",
      handoff: true,
      body: <LaneIntakePacket />,
    },
    {
      id: "rate-card",
      label: "Rate card",
      meta: "RC-OCC-2026 · Excel",
      kind: "contract",
      body: <RateCardDoc />,
    },
  ],
  recommendation:
    "Line haul on-contract and in tolerance. Fuel surcharge billed flat ($2,900) vs the contracted 22% ($2,464) — $436 over · carried forward to settlement.",
  stages: [
    {
      sourceId: "rate-card",
      reasoning: "Validating the line haul against the contracted lane rate",
      title: "Line haul",
      fields: [
        { label: "Contract rate", value: "USD 11,200 / load" },
        { label: "Billed", value: "USD 11,200" },
        { label: "Tolerance", value: "±2% · within" },
        { label: "Verdict", value: "On-contract ✓" },
      ],
    },
    {
      sourceId: "rate-card",
      reasoning: "Normalising the fuel surcharge against the index",
      title: "Fuel surcharge",
      fields: [
        { label: "Contract basis", value: "22% of line haul" },
        { label: "Contract value", value: "USD 2,464" },
        { label: "Billed", value: "flat USD 2,900" },
        { label: "Verdict", value: "Out of tolerance · +436" },
      ],
    },
  ],
};

/* ── Step 3 · Carrier tender — TND-77310 ──────────────────────────────────── */

const poStep: RunStep = {
  id: "po",
  n: 3,
  title: "Carrier tender — confirm",
  sub: "Confirms the approved carrier and the load",
  reasoning: [
    "Reading the validated lane and expected-cost envelope",
    "Confirming the load tendered to Summit Carriers",
    "Checking the sourcing-agreement volume commitment",
    "Ranking the approved pool — lane economics, compliance, prior defects",
    "Reading the carrier scorecard — Summit best-fit (on-time 96%, defect 1.4%)",
    "Tender confirmed · pickup window set",
  ],
  docLabel: "TND-77310 · Carrier tender",
  document: <CarrierTenderDoc />,
  sources: [
    {
      id: "rate-handoff",
      label: "RATE-CHI-RIV",
      meta: "from Rate & Surcharge",
      kind: "sap",
      handoff: true,
      body: <RateValidationDoc />,
    },
    {
      id: "scorecard",
      label: "Carrier scorecard",
      meta: "Summit Carriers · SUMC",
      kind: "master",
      body: <CarrierTenderDoc />,
    },
  ],
  recommendation:
    "Summit Carriers is the best-fit approved carrier on this lane, within the volume commitment and clean on the scorecard. Tender confirmed.",
  stages: [
    {
      sourceId: "scorecard",
      reasoning: "Confirming the approved carrier on lane economics and compliance",
      title: "Award",
      fields: [
        { label: "Carrier", value: "Summit Carriers · SUMC" },
        { label: "Equipment", value: "53' dry van · live load" },
        { label: "Sourcing agreement", value: "Within volume commitment" },
        { label: "Scorecard", value: "On-time 96% · defect 1.4%" },
      ],
    },
  ],
};

/* ── Step 4 · Load capture — SHP-55012 ────────────────────────────────────── */

const vendorStep: RunStep = {
  id: "vendor",
  n: 4,
  title: "Load capture — reconcile",
  sub: "Builds the packet and reconciles the weight",
  reasoning: [
    "Collecting the BOL, pickup confirmation and receiving ticket",
    "Reading the weigh-bridge ticket at the Riverside mill",
    "Estimated 22.0 t vs scaled 20.0 t — cubed out light",
    "The weight-adjustment accessorial bills on the claimed weight",
    "Flag — cube-out weight variance above tolerance",
  ],
  docLabel: "SHP-55012 · Load packet",
  document: <LoadPacketDoc />,
  sources: [
    {
      id: "bol",
      label: "Bill of lading",
      meta: "BOL-SUMC-44812",
      kind: "edi",
      body: <CarrierInvoiceDoc />,
    },
    {
      id: "weigh-ticket",
      label: "Weigh-bridge ticket",
      meta: "WB-RIV-44812",
      kind: "sap",
      body: <WeighTicketDoc />,
    },
  ],
  recommendation:
    "Packet complete, but the load cubed out 2 t under the claimed weight. The carrier's weight-adjustment accessorial ($480) bills on 22 t vs the scaled 20 t — carried forward to settlement.",
  stages: [
    {
      sourceId: "weigh-ticket",
      reasoning: "Reconciling estimated vs scaled weight",
      title: "Weight reconciliation",
      fields: [
        { label: "Carrier claim", value: "22.0 t" },
        { label: "Scaled (weigh-bridge)", value: "20.0 t" },
        { label: "Variance", value: "−2.0 t · cubed out" },
        { label: "Accessorial at risk", value: "USD 480" },
      ],
    },
  ],
};

/* ── Step 5 · Freight settlement — INV-SUM-5567 (HERO) ────────────────────── */

/* Recently-settled Summit invoices the duplicate radar sweeps against — all
 * distinct shipments, so this load reads as unique. */
const sihHistory: SettledInvoiceRow[] = [
  { invoice: "INV-SUM-5519", shipment: "SHP-54880", amount: "$14,920", lane: "CHI→RIV", settledOn: "2026-06-06", score: 8 },
  { invoice: "INV-SUM-5531", shipment: "SHP-54941", amount: "$15,110", lane: "CHI→RIV", settledOn: "2026-06-11", score: 11 },
  { invoice: "INV-SUM-5548", shipment: "SHP-54990", amount: "$12,740", lane: "DET→RIV", settledOn: "2026-06-15", score: 5 },
  { invoice: "INV-SUM-5560", shipment: "SHP-55003", amount: "$15,205", lane: "CHI→RIV", settledOn: "2026-06-18", score: 86 },
];

/* The five invoice lines against contract + shipment-reality. Reality is the
 * anchor; the three divergent lines each mount their own evidence visual. */
const reconLines: ReconLine[] = [
  {
    id: "classification",
    label: "Classification",
    contract: { display: "Class 50 · $10,680", basis: "NMFC · baled OCC" },
    reality: { display: "BOL: Class 50", source: "BOL-SUMC-44812" },
    invoice: { display: "Class 55 · $11,200" },
    status: "flag",
    delta: { amount: "+$520", sign: "over" },
    evidenceNode: (
      <ClassificationScope
        contractClass="Class 50"
        contractValue="$10,680"
        billedClass="Class 55"
        billedValue="$11,200"
        delta="+$520"
        commodity="baled OCC"
      />
    ),
  },
  {
    id: "fuel",
    label: "Fuel surcharge",
    contract: { display: "$2,464", basis: "22% of line haul" },
    reality: { display: "index 22%", source: "Fuel index" },
    invoice: { display: "flat $2,900" },
    status: "flag",
    delta: { amount: "+$436", sign: "over" },
    evidenceNode: (
      <AccessorialScope
        contractBasis="22% of line haul"
        contractValue="$2,464"
        billedBasis="flat fee"
        billedValue="$2,900"
        delta="+$436"
        note="Billed as a flat fee instead of the contracted percentage of line haul."
      />
    ),
  },
  {
    id: "demurrage",
    label: "Demurrage",
    contract: { display: "free 2.0h" },
    reality: { display: "gate 1.5h", source: "GATE-RIV-0620" },
    invoice: { display: "$900" },
    status: "flag",
    delta: { amount: "$900", sign: "not-owed" },
    evidenceNode: (
      <DetentionClock gateIn="07:31" gateOut="09:01" onSiteH={1.5} freeH={2.0} billed="$900" log="GATE-RIV-0620" />
    ),
  },
  {
    id: "weight",
    label: "Weight adj.",
    contract: { display: "per-load" },
    reality: { display: "scaled 20.0t", source: "WB-RIV-44812" },
    invoice: { display: "22.0t · $480" },
    status: "flag",
    delta: { amount: "$480", sign: "over" },
    evidenceNode: (
      <WeightRealityGauge
        claimT={22.0}
        scaledT={20.0}
        gross={34.4}
        tare={14.4}
        cubePctVolume={93}
        cubePctWeight={91}
        accessorialAtRisk="$480"
        ticket="WB-RIV-44812"
      />
    ),
  },
  {
    id: "duplicate",
    label: "Re-bill",
    contract: { display: "—" },
    reality: { display: "settled on INV-SUM-5560", source: "Settlement history" },
    invoice: { display: "$310 lumper" },
    status: "flag",
    delta: { amount: "$310", sign: "over" },
  },
  {
    id: "booking",
    label: "Booking / CC",
    contract: { display: "1000 · CF" },
    reality: { display: "SHP-55012", source: "Load packet" },
    invoice: { display: "SHP-55012 · 1000" },
    status: "clears",
  },
];

/* The Reconciliation Cockpit — the hero working surface: the reality-lens board
 * with inline evidence, the duplicate-billing radar and the leakage bridge. */
const reconCockpit = (
  <div className="space-y-4">
    <ReconciliationBoard
      lines={reconLines}
      verdict="One line clears. Five diverge from contract and shipment reality — a Class-55-vs-50 mis-class (+$520), the surcharge basis (+$436), un-owed demurrage ($900), a cube-out weight adjustment ($480) and a $310 lumper already settled on INV-SUM-5560 — $2,646 to dispute, $13,144 to AP."
    />
    <DuplicateBillingRadar
      current={{ invoice: "INV-SUM-5567", shipment: "SHP-55012", amount: "$15,790" }}
      history={sihHistory}
      verdict="duplicate"
    />
    <LeakageBridge
      invoiced={15790}
      deductions={[
        { label: "Classification", amount: 520, id: "classification" },
        { label: "Fuel surcharge", amount: 436, id: "fuel" },
        { label: "Demurrage", amount: 900, id: "demurrage" },
        { label: "Weight (cube-out)", amount: 480, id: "weight" },
        { label: "Duplicate re-bill", amount: 310, id: "duplicate" },
      ]}
      clears={13144}
      recoveredLabel="$2,646 recovered"
      pctNote="≈16.8% leakage on this invoice — an outlier vs the 3–6% network band."
    />
  </div>
);

const invoiceStep: RunStep = {
  id: "invoice",
  n: 5,
  title: "Freight settlement — three-way check",
  sub: "Matches Invoice × Shipment × Contract and drafts the dispute",
  reasoning: [
    "Reading INV-SUM-5567 line by line against the contract and the shipment record",
    "Line haul billed Class 55 — the BOL commodity is baled OCC, which rates Class 50: $520 mis-class",
    "Fuel surcharge billed flat $2,900 vs the contracted 22% ($2,464): $436 over",
    "Demurrage $900 — the gate log shows 1.5h on site vs 2.0h free: nothing owed",
    "Weight adjustment billed on 22.0t — the weigh-bridge scaled 20.0t: $480 on a cube-out",
    "Scanning settlement history — the $310 lumper was already settled on INV-SUM-5560: holding as a re-bill",
    "One line clears · clearing $13,144 · drafting a $2,646 carrier dispute",
  ],
  docLabel: "INV-SUM-5567 · Reconciliation cockpit",
  hasExceptions: true,
  approveLabel: "Approve with flags & send dispute",
  document: reconCockpit,
  sources: [
    {
      id: "invoice-pdf",
      label: "Carrier invoice",
      meta: "INV-SUM-5567 · PDF",
      kind: "invoice",
      body: <CarrierInvoiceDoc />,
    },
    {
      id: "load-handoff",
      label: "SHP-55012",
      meta: "from Load Capture",
      kind: "sap",
      handoff: true,
      body: <LoadPacketDoc />,
    },
    {
      id: "rate-card-match",
      label: "Rate card",
      meta: "RC-OCC-2026 · Excel",
      kind: "contract",
      body: <RateCardDoc />,
    },
    {
      id: "gate-log",
      label: "Yard gate log",
      meta: "GATE-RIV-0620",
      kind: "kb",
      body: <GateLogDoc />,
    },
  ],
  email: {
    cta: "Send the carrier dispute",
    to: "Summit Carriers · billing@summitcarriers.example",
    subject: "Dispute — INV-SUM-5567 · 5 lines · USD 2,646",
    lines: [
      "We've settled the in-tolerance line on INV-SUM-5567 ($13,144) on net 30. Five lines are disputed against the contract and the shipment record:",
      "1) Line haul billed Class 55 vs the BOL commodity (baled OCC, Class 50) — $520 mis-class. 2) Fuel surcharge billed flat $2,900 vs the contracted 22% ($2,464) — $436 over. 3) Demurrage $900 — gate log shows 1.5 h on site vs 2.0 h free time, none owed. 4) Weight adjustment $480 — billed on 22 t vs the weigh-bridge scaled 20 t. 5) Lumper $310 — already settled on INV-SUM-5560, a re-bill.",
      "Please issue a credit of $2,646. Rate card, BOL, gate log, weigh ticket and the prior settlement attached.",
    ],
    toastTitle: "Credit acknowledged",
    toastBody: "Summit Carriers acknowledged the dispute and will credit $2,646 — reply added to your sources.",
    reply: {
      from: "Summit Carriers",
      receivedMeta: "Outlook · 11:18",
      subject: "RE: Dispute — INV-SUM-5567",
      lines: [
        "Reviewed — you're right on all five. We'll issue a credit memo for $2,646 against INV-SUM-5567.",
      ],
      source: {
        id: "dispute-ack",
        label: "Carrier credit reply",
        meta: "Outlook · 11:18",
        kind: "email",
        body: (
          <EmailDoc
            from="Summit Carriers"
            fromAddr="billing@summitcarriers.example"
            to="Freight Settlement"
            sent="2026-06-20 · 11:18"
            subject="RE: Dispute — INV-SUM-5567"
            tone="inbound"
            lines={[
              "Reviewed — you're right on all five. We'll issue a credit memo for $2,646 against INV-SUM-5567.",
              "Surcharge will move to the contracted percentage on future invoices.",
            ]}
          />
        ),
      },
    },
  },
  recommendation:
    "One line clears (booking, in tolerance). Five lines are flagged totalling $2,646 — Class-55-vs-50 mis-class +$520, surcharge +$436, demurrage $900 not owed, weight $480 on a cube-out, and a $310 lumper already settled on INV-SUM-5560. Settle $13,144 to AP and send the drafted $2,646 dispute.",
};

export const runSteps: RunStep[] = [
  intakeStep,
  sourcingStep,
  poStep,
  vendorStep,
  invoiceStep,
];
