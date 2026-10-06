/**
 * Agent catalog — the authoritative spec for the six-agent inbound-haulage
 * freight workforce: Lane Intake · Rate & Surcharge · Carrier Tender · Load
 * Capture · Freight Settlement (the hero three-way check), with the Approval &
 * Exception Router coordinating handoffs and the touchless/exception lanes.
 *
 * Every agent surface (work-menu pages, cockpit fleet, run accountability) reads
 * from here so names and autonomy stay consistent. Operating entity is the
 * fictional "Northgate Paper Co." — a recycled-fibre mill network moving OCC,
 * mixed paper, DLK and ONP/OMG. The AI drafts, recommends and routes; a human
 * approves every real decision.
 *
 * NOTE: internal ids (intake/sourcing/po/invoice/vendor/orchestrator) are
 * inherited from the procure-to-pay base and never render — see menuLabel/name
 * for what each agent actually is in this freight line.
 */

import type { LucideIcon } from "lucide-react";
import {
  Route,
  Calculator,
  Truck,
  ClipboardCheck,
  ScanSearch,
  Workflow,
} from "lucide-react";

export type AgentId =
  | "intake"
  | "sourcing"
  | "po"
  | "invoice"
  | "vendor"
  | "orchestrator";

export type AgentStatus = "running" | "review" | "idle";

/** L2 Assistant → L3 Supervised → L4 Autonomous (configurable guardrails). */
export type AutonomyLevel = 2 | 3 | 4;

export const AUTONOMY_LABEL: Record<AutonomyLevel, string> = {
  2: "Assistant",
  3: "Supervised",
  4: "Autonomous",
};

export type AgentSpec = {
  id: AgentId;
  /** Full name shown as the page title. */
  name: string;
  /** Short nav label — ≤ 3 words, no abbreviations. */
  menuLabel: string;
  icon: LucideIcon;
  purpose: string;
  inputs: string[];
  outputs: string[];
  tech: string[];
  /** Default autonomy level; the detail page lets the presenter dial it. */
  autonomy: AutonomyLevel;
  /** The L3 guardrail rule — the auto-execute condition for this agent. */
  autonomyRule: string;
  escalation: string[];
  /** Throughput stat shown on rows and the detail hero. */
  stat: string;
  status: AgentStatus;
  /** Context callout shown on the console detail. */
  note?: string;
  /** The router coordinates rather than executes — no autonomy dial. */
  coordinator?: boolean;
};

export const agents: AgentSpec[] = [
  {
    id: "intake",
    name: "Lane Intake Orchestrator",
    menuLabel: "Lane intake",
    icon: Route,
    purpose:
      "Turns a raw pickup requirement for recovered fibre into a clean, tender-ready lane — classifying the haul type and binding it to the right origin, destination mill and approved movement pattern.",
    inputs: [
      "Pickup requirement (site, broker, municipality or retail/DC source)",
      "Material grade (OCC, mixed paper, DLK, ONP/OMG)",
      "Lane master and approved movement patterns",
      "Destination mill calendar and receiving windows",
      "Historical lane volumes and seasonality",
    ],
    outputs: [
      "Structured lane draft — origin, destination, grade, haul type, window",
      "Haul-type classification (live load · roll-off · backhaul · approved pattern)",
      "Flags for non-standard movements or new origins",
      "Tender-ready packet handed to rate validation",
      "Escalation to a transportation coordinator for novel lanes",
    ],
    tech: ["Document intelligence", "Lane master graph", "Haul-type classifier", "Mill calendar feed"],
    autonomy: 3,
    autonomyRule:
      "Auto-classifies and releases the lane when it matches an approved movement pattern with a known origin — anything novel is drafted and routed to a coordinator.",
    escalation: [
      "Novel origin or lane",
      "Unclassified haul type",
      "Outside the mill receiving window",
      "Mixed or contaminated grade",
      "Ambiguous pickup details",
    ],
    stat: "128 lanes today",
    status: "running",
  },
  {
    id: "sourcing",
    name: "Rate & Surcharge Engine",
    menuLabel: "Rate & surcharge",
    icon: Calculator,
    purpose:
      "Validates every shipment request against the contracted lane rate, fuel-surcharge table and tolerance thresholds — normalising flat-fee-versus-percentage surcharges so quotes are finally apples-to-apples.",
    inputs: [
      "Tender-ready lane from intake",
      "Contracted rate card (lane rates, accessorials, tiers)",
      "Fuel-surcharge index and effective dates",
      "Tolerance thresholds by lane and grade",
      "Prior invoice-defect history on the lane",
    ],
    outputs: [
      "Validated rate basis with the contract clause cited",
      "Normalised surcharge view (flat fee vs percentage, like-for-like)",
      "In-tolerance / out-of-tolerance verdict per cost line",
      "Expected-cost envelope handed to carrier tender and settlement",
      "Recommendation for human sign-off when out of tolerance",
    ],
    tech: ["Rate-card graph", "Fuel-index feed", "Surcharge normaliser", "Tolerance rules engine"],
    autonomy: 3,
    autonomyRule:
      "Auto-confirms the rate basis when every line is on-contract and inside tolerance — out-of-tolerance lines are flagged and routed to sourcing for sign-off.",
    escalation: [
      "Out-of-tolerance lane rate",
      "Surcharge format mismatch",
      "Expired or missing rate card",
      "Accessorial not in the contract",
    ],
    stat: "94% on-contract",
    status: "running",
    note: "Targets the costliest leak today — inconsistent fuel surcharges and hidden accessorials that make lane costs impossible to compare.",
  },
  {
    id: "po",
    name: "Carrier Tender Advisor",
    menuLabel: "Carrier tender",
    icon: Truck,
    purpose:
      "Recommends the best-fit approved carrier on lane economics, sourcing-agreement compliance and prior invoice-defect history — then drafts the tender for a human to release.",
    inputs: [
      "Validated lane and expected-cost envelope",
      "Approved carrier pool (capacity, lanes served, equipment)",
      "Sourcing-agreement commitments and volume tiers",
      "Carrier scorecard (on-time, defect rate, dispute history)",
      "Live capacity and backhaul opportunities",
    ],
    outputs: [
      "Ranked carrier recommendation with the rationale",
      "Drafted tender with rate, equipment and pickup window",
      "Compliance check against sourcing commitments",
      "Backhaul / cube-out optimisation suggestion",
      "Full recommendation for human release of the tender",
    ],
    tech: ["Carrier scorecard", "Lane-economics model", "Capacity feed", "Tender drafting"],
    autonomy: 2,
    autonomyRule:
      "Auto-tenders to the best-fit approved carrier for routine in-tolerance lanes within volume commitments — otherwise it drafts and routes for release.",
    escalation: [
      "No approved carrier with capacity",
      "Volume commitment at risk",
      "Carrier with recent defect history",
      "Spot-market premium over tolerance",
    ],
    stat: "41 tenders",
    status: "running",
  },
  {
    id: "vendor",
    name: "Load Capture Agent",
    menuLabel: "Load capture",
    icon: ScanSearch,
    purpose:
      "Assembles a standardised digital packet for every load before invoicing — pickup confirmation, shipment reference and receiving evidence — and reconciles estimated versus actual (cube-out) weight so the settlement check starts clean.",
    inputs: [
      "Bill of lading and pickup confirmation",
      "Shipment reference and booking details",
      "Mill receiving and weigh-bridge ticket",
      "Estimated versus scaled weight",
      "Photos and contamination/grade notes",
    ],
    outputs: [
      "One standardised digital load packet per shipment",
      "Estimated-vs-actual weight reconciliation (cube-out variance)",
      "Missing-document and data-entry-error flags",
      "Clean evidence set handed to settlement",
      "Master-data quality view across origins and mills",
    ],
    tech: ["Document intelligence (BOL)", "Weigh-bridge feed", "Field normalisation", "Evidence packet store"],
    autonomy: 2,
    autonomyRule:
      "Auto-completes the packet when every document is present and the weight variance is inside tolerance — missing evidence or a large variance escalates.",
    escalation: [
      "Missing BOL or receiving ticket",
      "Weight variance over tolerance",
      "Suspected manual-entry error",
      "Contamination or grade dispute",
      "Duplicate shipment reference",
    ],
    stat: "1,180 packets",
    status: "running",
    note: "Replaces error-prone manual BOL entry — the root cause of typos and disconnected data across sites and mills.",
  },
  {
    id: "invoice",
    name: "Freight Settlement Matcher",
    menuLabel: "Freight settlement",
    icon: ClipboardCheck,
    purpose:
      "Runs the three-way check line-by-line — Invoice (PDF) × Shipment (SAP) × Contract (Excel) — clears in-tolerance lines, and surfaces only the non-standard lines (demurrage, accessorials, weight variance) as exceptions for a person.",
    inputs: [
      "Carrier freight invoice (PDF, EDI or scanned)",
      "Shipment record and load packet (SAP)",
      "Contracted rate card and tolerance rules (Excel)",
      "Fuel-surcharge index and accessorial schedule",
      "Prior dispute history on the lane and carrier",
    ],
    outputs: [
      "Extracted invoice lines with confidence scores",
      "Three-way match result per line — invoice, shipment, contract",
      "In-tolerance lines cleared and posted for payment",
      "Exception root-cause + recommended resolution + draft carrier note",
      "Recovered-overcharge total with the audit trail",
    ],
    tech: ["Document intelligence (invoice)", "Three-way match engine", "Tolerance + fraud rules", "SAP integration"],
    autonomy: 3,
    autonomyRule:
      "Auto-clears and posts lines when the three-way match is clean, inside tolerance and above the confidence floor — demurrage, accessorial and variance exceptions are drafted for approval.",
    escalation: [
      "Demurrage or detention charge",
      "Surcharge or accessorial mismatch",
      "Cube-out weight variance",
      "Missing booking / PO / shipment number",
      "Duplicate booking or wrong company code",
      "Price or quantity mismatch",
    ],
    stat: "96% lines matched",
    status: "review",
    note: "The hero — directly recovers the 3–6% of freight spend that leaks through demurrage, hidden accessorials and unmatched lane rates.",
  },
  {
    id: "orchestrator",
    name: "Approval & Exception Router",
    menuLabel: "Approvals",
    icon: Workflow,
    purpose:
      "Coordinates the five specialist agents end-to-end — posting in-tolerance shipments touchless with a full audit trail, and routing every exception to a managed lane with drafted carrier communications and a recommended resolution.",
    inputs: [
      "Every agent's output and state",
      "Process-level tolerance policies and SLAs",
      "Cross-agent context for human resolution",
    ],
    outputs: [
      "Touchless settlement of in-tolerance shipments with audit trail",
      "Process dashboards (cycle time, touchless rate, leakage recovered)",
      "Exception lane with drafted comms and recommended fixes",
      "One unified human-approval interface",
      "A full audit log per shipment",
    ],
    tech: ["Agent orchestration", "Shared evidence store", "Audit + observability"],
    autonomy: 4,
    autonomyRule:
      "Coordinates the workforce rather than settling invoices itself — it posts the clean in-tolerance batch, sequences handoffs and routes the exceptions that need a person.",
    escalation: [
      "Cross-agent match failure",
      "SLA breach risk",
      "Repeated exception on one carrier or lane",
    ],
    stat: "71% touchless",
    status: "running",
    coordinator: true,
  },
];

export const agentsById: Record<AgentId, AgentSpec> = agents.reduce(
  (acc, a) => ((acc[a.id] = a), acc),
  {} as Record<AgentId, AgentSpec>,
);

/** The five specialists, in pipeline order (router excluded). */
export const specialistAgents: AgentSpec[] = agents.filter((a) => a.id !== "orchestrator");
