/**
 * Agent catalog — the authoritative spec for the five specialist agents and the
 * orchestrator that make up the 6-tower procure-to-pay workforce: PR Processing ·
 * Tactical & Spot Buying · PO Management · Invoice Resolution · MDM Support, with
 * the orchestrator owning Reporting & CI. Transcribed from the engagement brief and
 * aligned to the official scope deck. Every agent surface (work-menu pages, cockpit
 * fleet, run accountability) reads from here so names and autonomy stay consistent.
 */

import type { LucideIcon } from "lucide-react";
import {
  Inbox,
  Search,
  FileText,
  ReceiptText,
  Building2,
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
  /** client-specific context callout (e.g. post-merger dedup for the vendor agent). */
  note?: string;
  /** The orchestrator coordinates rather than executes — no autonomy dial. */
  coordinator?: boolean;
};

export const agents: AgentSpec[] = [
  {
    id: "intake",
    name: "PR Processing Agent",
    menuLabel: "PR processing",
    icon: Inbox,
    purpose:
      "Turns an employee's plain-language need into a structured, compliant purchase requisition — PR gatekeeping, compliance checks and approval routing through LevelPath.",
    inputs: [
      "Employee request (chat, email or LevelPath form)",
      "category tree and spending policy",
      "Active contracts and preferred-supplier list",
      "Budget mapping (employee → cost center → budget)",
      "Historical purchasing patterns for the department",
    ],
    outputs: [
      "Structured PR draft — category, quantity, spec, justification, suggested supplier",
      "Ranked supplier list (contracted → preferred → new)",
      "Compliance flags for off-contract spend or threshold breaches",
      "Approver routing recommendation",
      "Escalation to a category sourcing manager for novel requests",
    ],
    tech: ["Instruction-tuned LLM", "Viki LLM + graph relational DB", "LevelPath API", "SAP master data"],
    autonomy: 3,
    autonomyRule:
      "Auto-submits the requisition when it is under the threshold, on-contract and budget is available — anything else is drafted and routed to a human approver.",
    escalation: [
      "Novel category",
      "Off-contract over the threshold",
      "Budget over-run",
      "Compliance flag",
      "Ambiguous specification",
    ],
    stat: "142 today",
    status: "running",
  },
  {
    id: "sourcing",
    name: "Tactical & Spot Buying Agent",
    menuLabel: "Spot buying",
    icon: Search,
    purpose:
      "Runs operational tactical buying within thresholds — auto-RFQs, three-bid mini-tenders and spot buys — while strategic categories escalate to human sourcing managers.",
    inputs: [
      "Approved PR or category sourcing event",
      "Existing supplier pool (capability, performance, financial health)",
      "Active contracts and pricing terms",
      "Historical RFQ outcomes",
      "Supplier risk data (geopolitical, financial, ESG)",
    ],
    outputs: [
      "Auto-drafted RFQ with specs, terms and evaluation criteria",
      "Supplier shortlist with ranking rationale",
      "Negotiation brief (leverage points, BATNA, walk-away)",
      "Bid analysis comparison",
      "Full recommendation for human sign-off on strategic categories",
    ],
    tech: ["GenAI", "ML demand & price forecasting", "Viki LLM + graph relational DB", "e-Sourcing integration"],
    autonomy: 3,
    autonomyRule:
      "Auto-runs the RFQ and selects the supplier for routine categories under the threshold from the approved pool — strategic categories go to a sourcing manager.",
    escalation: [
      "Strategic category",
      "New supplier introduction",
      "Spend over the threshold",
      "Risk score above the threshold",
    ],
    stat: "38 tenders",
    status: "running",
    note: "Highest-cost, lowest-productivity bucket today (~600 mini-tenders per FTE per year) — a priority AI target.",
  },
  {
    id: "po",
    name: "PO Management Agent",
    menuLabel: "PO management",
    icon: FileText,
    purpose:
      "Owns the purchase order end-to-end — creates it from an approved requisition, binds it to contract terms, posts it to SAP, then monitors, follows up and expedites open orders to on-time delivery.",
    inputs: [
      "Approved PR",
      "Selected supplier and contract",
      "Contract terms (price, lead time, quality, payment, SLAs)",
      "Real-time budget headroom",
      "Supplier acknowledgements, shipment status and open-order ageing",
    ],
    outputs: [
      "Contract-bound PO with every required field populated",
      "Compliance check — PO vs contract terms and budget",
      "Approval workflow routed to the right approvers",
      "Posted to SAP and transmitted to the supplier on the approved channel",
      "Expedite worklist + status chases on orders at risk of late delivery",
    ],
    tech: ["GenAI contract-PO alignment", "Structured workflow", "SAP API", "LevelPath orchestration"],
    autonomy: 2,
    autonomyRule:
      "Auto-creates and approves under the threshold when the order is contract-compliant and budget is available — otherwise it drafts and routes for approval.",
    escalation: [
      "Over the threshold",
      "Contract-term deviation",
      "Budget over-run",
      "Supplier not in the master",
      "Confirmed late delivery or quality hold",
    ],
    stat: "210 orders",
    status: "running",
  },
  {
    id: "invoice",
    name: "Invoice Resolution Agent",
    menuLabel: "Invoice resolution",
    icon: ReceiptText,
    purpose:
      "Resolves procurement-side invoice blocks, runs the four-way match across contract, PO, goods receipt and invoice, and manages buyer and supplier queries on those blocks; clean items release to AP, exceptions get a classified fix.",
    inputs: [
      "Invoice (PDF, EDI, portal or scanned paper)",
      "Matching PO and goods receipt",
      "Underlying contract terms",
      "Supplier master (bank account, terms, tax)",
      "Historical invoice patterns (fraud baseline)",
    ],
    outputs: [
      "Extracted invoice data with confidence scores",
      "Four-way match result — contract, PO, goods receipt, invoice",
      "Clean invoices posted to SAP and scheduled for payment",
      "Exception root-cause + proposed resolution + draft note",
      "Auto-resolved buyer / supplier / AP queries on the block, with the cited policy",
    ],
    tech: ["Document intelligence (IDP)", "GenAI for unstructured fields", "ML matching & fraud", "Viki LLM", "SAP API"],
    autonomy: 3,
    autonomyRule:
      "Auto-posts and releases to AP when the four-way match is clean, confidence is above 0.95, under the threshold and no fraud flag — otherwise it proposes a fix for approval.",
    escalation: [
      "Match failure",
      "Low extraction confidence",
      "Fraud signal",
      "Dispute history with the supplier",
      "Query beyond invoice authority (master-data or PO change)",
    ],
    stat: "91% matched",
    status: "review",
    note: "Full AP invoice processing stays with the Capgemini-run finance & accounting tower — this agent owns the procurement-side match and resolution.",
  },
  {
    id: "vendor",
    name: "MDM Support Agent",
    menuLabel: "Master data",
    icon: Building2,
    purpose:
      "Master-data management for procurement — maintains vendor-master quality (duplicates, risk, merges), processes add/change requests, and keeps purchasing-info records (PIR) and item pricing aligned to contracts and source lists.",
    inputs: [
      "Live vendor master (SAP)",
      "Vendor onboarding requests",
      "Per-vendor transaction history (spend, payments, disputes)",
      "External data (Dun & Bradstreet, sanctions, tax, credit)",
      "Vendor-portal self-service updates",
    ],
    outputs: [
      "Duplicate / near-duplicate detection with merge proposals",
      "Onboarding decision (approve, request info, reject) with reasoning",
      "Risk flags — financial distress, sanctions, fraud pattern",
      "Payment-hold recommendations",
      "Master-data quality dashboard (completeness, accuracy, freshness)",
    ],
    tech: ["ML fuzzy matching", "GenAI name & address normalization", "External data APIs", "SAP master-data write-back"],
    autonomy: 2,
    autonomyRule:
      "Auto-merges only when confidence is above 0.98 across multiple match dimensions and value-at-risk is low — everything else escalates.",
    escalation: [
      "New vendor",
      "High-value vendor",
      "Sanctions match",
      "Fraud pattern",
      "Conflicting external signals",
    ],
    stat: "1,204 cleaned",
    status: "running",
    note: "Directly attacks the post-merger duplicate-vendor problem (estimated 30–40% duplicates) — part of unlocking $117M of the $514M synergy target.",
  },
  {
    id: "orchestrator",
    name: "P2P Process Orchestrator",
    menuLabel: "Orchestrator",
    icon: Workflow,
    purpose:
      "Coordinates the five specialist agents end-to-end — managing handoffs, keeping shared context and routing exceptions — and owns the Reporting & CI tower (process reporting and continuous improvement).",
    inputs: [
      "Every agent's output and state",
      "Process-level policies and SLAs",
      "Cross-agent context for human resolution",
    ],
    outputs: [
      "Process dashboards (cycle time, touchless rate, exception rate)",
      "Proactive 80/20 leakage and opportunity insights",
      "Cross-agent handoff coordination",
      "One unified human-escalation interface",
      "A full audit log per transaction",
    ],
    tech: ["Agent orchestration platform", "Shared memory store", "Observability stack"],
    autonomy: 4,
    autonomyRule:
      "Coordinates the workforce rather than executing buys itself — it keeps shared context, sequences handoffs and routes the exceptions that need a person.",
    escalation: [
      "Cross-agent match failure",
      "SLA breach risk",
      "Repeated exception on one supplier or category",
    ],
    stat: "82% touchless",
    status: "running",
    coordinator: true,
  },
];

export const agentsById: Record<AgentId, AgentSpec> = agents.reduce(
  (acc, a) => ((acc[a.id] = a), acc),
  {} as Record<AgentId, AgentSpec>,
);

/** The five specialists, in pipeline order (orchestrator excluded). */
export const specialistAgents: AgentSpec[] = agents.filter((a) => a.id !== "orchestrator");
