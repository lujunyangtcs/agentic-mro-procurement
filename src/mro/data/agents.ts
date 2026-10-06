/**
 * Agent catalog — the authoritative spec for the five-agent MRO procurement
 * workforce: PR Processing · Master Data · Warranty & Coverage · Sourcing &
 * Contract · Approval & Routing, with the Procurement Orchestrator coordinating
 * handoffs and the touchless/exception lanes.
 *
 * Every agent surface (work-menu pages, cockpit fleet, run accountability) reads
 * from here so names and autonomy stay consistent. Operating entity is the
 * Siemens (illustrative data) — an electronics and automation manufacturing
 * network (Lindfeld, Clairmont, Riomar, Lianhe) whose plant engineers raise maintenance, repair and operations (MRO)
 * purchase requisitions. The AI structures, validates, recommends and routes;
 * a human approves every real decision.
 *
 * NOTE: internal ids (intake/sourcing/po/invoice/vendor/orchestrator) are
 * inherited from the procure-to-pay base and never render — see menuLabel/name
 * for what each agent actually is in this MRO procurement line.
 */

import type { LucideIcon } from "lucide-react";
import {
  Inbox,
  Database,
  ShieldCheck,
  FileText,
  ClipboardCheck,
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
    name: "PR Processing Agent",
    menuLabel: "PR processing",
    icon: Inbox,
    purpose:
      "Turns a plant engineer's free-text maintenance request into a clean, coded purchase requisition — extracting the item specification, mapping it to the right material code and binding it to the correct cost centre and G/L account.",
    inputs: [
      "Free-text requisition (email, intake portal or maintenance ticket)",
      "Equipment and failure description",
      "Material master and the MRO catalogue",
      "Cost-centre and G/L account structure",
      "Plant and line where the part is needed",
    ],
    outputs: [
      "Structured, coded requisition — item, quantity, UoM, plant",
      "Material-code mapping with a confidence score",
      "Cost-centre and G/L account assignment",
      "Flags for incomplete specs, missing part numbers or ambiguous quantities",
      "Escalation to a buyer for a novel or unmappable item",
    ],
    tech: ["Document intelligence", "Material-master graph", "Spec extraction", "Account-assignment rules"],
    autonomy: 3,
    autonomyRule:
      "Auto-structures and codes the requisition when the item maps cleanly to a known material code with a complete spec — anything ambiguous is drafted and routed to a buyer.",
    escalation: [
      "Incomplete specification",
      "No part number or material code match",
      "Ambiguous quantity or unit of measure",
      "Novel or non-catalogue item",
      "Unclear plant or cost centre",
    ],
    stat: "96 requisitions today",
    status: "running",
    note: "Replaces the manual re-keying of messy free-text requests — the root cause of wrong-part orders and mis-coded spend across the plants.",
  },
  {
    id: "vendor",
    name: "Master Data Agent",
    menuLabel: "Master data",
    icon: Database,
    purpose:
      "Validates every requisition against the material master, scans for duplicate demand and checks on-hand and interplant stock — so the network never buys what it already has open or in store.",
    inputs: [
      "Structured requisition from PR processing",
      "Material master and SKU mappings",
      "Open purchase requisitions and orders",
      "On-hand inventory by plant and storeroom",
      "Interplant stock and transfer lead times",
    ],
    outputs: [
      "Material-code and SKU confirmation",
      "Duplicate-requisition match against open demand",
      "On-hand and interplant stock availability",
      "Transfer-before-buy recommendation where stock exists",
      "Master-data quality flags across plants",
    ],
    tech: ["Material-master graph", "Duplicate detection", "Inventory feed", "Interplant stock lookup"],
    autonomy: 3,
    autonomyRule:
      "Auto-confirms the requisition when the SKU is clean, no duplicate is open and no stock is available to draw from — a duplicate or available stock is flagged for the buyer.",
    escalation: [
      "Duplicate open requisition",
      "Stock available at this plant",
      "Stock available at a sister plant",
      "Unmapped or conflicting SKU",
      "Inconsistent unit of measure",
    ],
    stat: "31 duplicates caught",
    status: "running",
    note: "Targets the costliest leak today — buying parts that are already on order or sitting in a sister-plant storeroom.",
  },
  {
    id: "invoice",
    name: "Warranty & Coverage Desk",
    menuLabel: "Warranty & coverage",
    icon: ShieldCheck,
    purpose:
      "Checks whether the failed equipment is still under OEM warranty or a service contract — turning a covered defect into a warranty claim rather than a purchase, and confirming a genuine buy where coverage has lapsed.",
    inputs: [
      "Structured requisition and the failure description",
      "Equipment register and commissioning dates",
      "OEM warranty terms and service contracts",
      "Failure type — defect versus wear and tear",
      "Prior claim history on the asset",
    ],
    outputs: [
      "Warranty and coverage status for the equipment",
      "Defect-versus-wear classification",
      "Coverage scope — parts, labour or full replacement",
      "Claim-versus-buy recommendation with the OEM cited",
      "Drafted warranty claim where the failure is covered",
    ],
    tech: ["Equipment register", "Warranty-terms graph", "Failure classifier", "Claim drafting"],
    autonomy: 3,
    autonomyRule:
      "Auto-confirms a new-buy when the equipment is out of warranty and the failure is wear and tear — a covered defect inside warranty is drafted as a claim for approval.",
    escalation: [
      "Equipment inside OEM warranty",
      "Possible covered defect",
      "Active service contract on the asset",
      "Premature or repeat failure",
      "Ambiguous defect-versus-wear call",
    ],
    stat: "12 claims raised",
    status: "review",
    note: "Stops the network paying for parts the OEM owes — premature failures inside warranty are claimed, not bought.",
  },
  {
    id: "sourcing",
    name: "Sourcing & Contract Agent",
    menuLabel: "Sourcing & contract",
    icon: FileText,
    purpose:
      "Validates the vendor, sourcing agreement and price for every buy — confirming an approved, preferred supplier, the lower-cost compliant route and a price that matches the contract, so nothing leaks off-contract.",
    inputs: [
      "Validated requisition and the recommended buy quantity",
      "Vendor master and approved-supplier list",
      "Sourcing agreements and price lists",
      "OEM-versus-distributor pricing",
      "Payment terms and HSE / insurance requirements",
    ],
    outputs: [
      "Approved, preferred-vendor confirmation",
      "OEM-versus-distributor cost comparison",
      "Sourcing-agreement and price match with the clause cited",
      "Off-contract and price-variance flags",
      "Recommendation for human sign-off on any spot or off-contract buy",
    ],
    tech: ["Vendor-master graph", "Sourcing-agreement engine", "Price-match rules", "Spend-compliance checks"],
    autonomy: 2,
    autonomyRule:
      "Auto-confirms the buy when the vendor is approved and the price matches a sourcing agreement inside tolerance — an off-contract vendor or a price variance is flagged for sign-off.",
    escalation: [
      "Off-contract or unapproved vendor",
      "Price above the sourcing agreement",
      "Expired or missing agreement",
      "Spot buy over the threshold",
      "Missing HSE or insurance on a service line",
    ],
    stat: "94% on-contract",
    status: "running",
  },
  {
    id: "po",
    name: "Approval & Routing Agent",
    menuLabel: "Approval & routing",
    icon: ClipboardCheck,
    purpose:
      "Runs the final control checks line-by-line — cost centre, competitive-bidding policy, delegation-of-authority limits and any open spec item — clears the routine requisitions and surfaces only the ones that need a person to approve.",
    inputs: [
      "Validated requisition with vendor, price and coverage",
      "Cost-centre and G/L assignment",
      "Competitive-bidding and spend policy",
      "Delegation-of-authority (DOA) approval matrix",
      "Open spec confirmations and sign-offs",
    ],
    outputs: [
      "Cost-centre and account-assignment check",
      "Competitive-bidding requirement (quotes if over threshold)",
      "DOA approval routing to the right limit",
      "Open-item summary — the one thing left to confirm",
      "A single, release-ready approval card for the buyer",
    ],
    tech: ["Spend-policy engine", "DOA matrix", "Bidding-threshold rules", "Approval routing"],
    autonomy: 2,
    autonomyRule:
      "Auto-routes the requisition to the right approver and releases it when every control passes inside policy — an over-threshold buy or an open spec item is held for approval.",
    escalation: [
      "Spend above the competitive-bidding threshold",
      "Outside the requester's DOA limit",
      "Open spec or diameter confirmation",
      "Wrong cost centre or G/L account",
      "Policy exception requested",
    ],
    stat: "41 routed",
    status: "running",
  },
  {
    id: "orchestrator",
    name: "Procurement Orchestrator",
    menuLabel: "Agent workforce",
    icon: Workflow,
    purpose:
      "Coordinates the five specialist agents end-to-end — releasing clean, on-contract requisitions touchless with a full audit trail, and routing every exception to a managed lane with a recommended action and drafted communications.",
    inputs: [
      "Every agent's output and state",
      "Process-level spend and approval policies",
      "Cross-agent context for human resolution",
    ],
    outputs: [
      "Touchless release of clean, on-contract requisitions with audit trail",
      "Process dashboards (cycle time, touchless rate, duplicate spend caught)",
      "Exception lane with recommended fixes and drafted comms",
      "One unified human-approval interface",
      "A full audit log per requisition",
    ],
    tech: ["Agent orchestration", "Shared evidence store", "Audit + observability"],
    autonomy: 4,
    autonomyRule:
      "Coordinates the workforce rather than raising requisitions itself — it releases the clean on-contract batch, sequences handoffs and routes the exceptions that need a person.",
    escalation: [
      "Cross-agent validation failure",
      "SLA breach risk on an urgent line",
      "Repeated exception on one vendor or plant",
    ],
    stat: "68% touchless",
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
