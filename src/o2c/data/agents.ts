/**
 * Agent catalog — the authoritative spec for the five specialist agents and the
 * orchestrator that make up the order-to-cash (O2C) workforce: Cash Application ·
 * Deduction Triage · Evidence & Validation · Dispute Resolution · Customer Master
 * & Credit, with the orchestrator owning Reporting & CI. Transcribed from the
 * the engagement brief (the engagement brief) and aligned to the official scope deck.
 * Every agent surface (work-menu pages, cockpit fleet, run accountability) reads
 * from here so names and autonomy stay consistent.
 *
 * Internal ids (intake/sourcing/po/invoice/vendor/orchestrator) are carried over
 * from the P2P engine and are never shown to the user — only `name`/`menuLabel`.
 */

import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Tags,
  FileSearch,
  Gavel,
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
  /** client-specific context callout (e.g. post-merger dedup for the customer agent). */
  note?: string;
  /** The orchestrator coordinates rather than executes — no autonomy dial. */
  coordinator?: boolean;
};

export const agents: AgentSpec[] = [
  {
    id: "intake",
    name: "Cash Application Agent",
    menuLabel: "Cash application",
    icon: Banknote,
    purpose:
      "Applies incoming customer payments and remittances to open invoices — auto-matches clean receipts, splits partial payments, and isolates short-pays and deductions so nothing sits unapplied on the customer's account.",
    inputs: [
      "Bank lockbox / ACH / wire files (BAI2, EDI 820 remittance)",
      "Open AR items by customer (SAP FI-AR)",
      "Customer remittance advice (portal, email, PDF)",
      "Historical pay-and-deduct behavior per customer",
      "Trade-promotion and pricing master for expected nets",
    ],
    outputs: [
      "Auto-applied cash with invoice-level matching and confidence",
      "Partial-payment split — paid lines cleared, balance kept open",
      "Short-pay / deduction isolated as a discrete open item with a reason hypothesis",
      "Unapplied-cash worklist for anything the agent cannot tie out",
      "Hand-off of every deduction to triage with the remittance evidence attached",
    ],
    tech: ["Document intelligence (IDP)", "ML remittance matching", "Viki LLM + graph relational DB", "SAP FI-AR API"],
    autonomy: 3,
    autonomyRule:
      "Auto-applies and clears when the remittance ties to open items within tolerance and confidence is above 0.95 — short-pays and deductions are isolated and routed to triage.",
    escalation: [
      "Remittance can't be tied to open items",
      "Deduction or short-pay taken",
      "Payment spans multiple customers",
      "Confidence below the threshold",
      "On-account / prepayment with no invoice",
    ],
    stat: "12,480 applied",
    status: "running",
    note: "1.28M cash-application items a year against ~10 FTE today — the highest-volume, lowest-touch bucket and a priority AI target.",
  },
  {
    id: "sourcing",
    name: "Deduction Triage Agent",
    menuLabel: "Deduction triage",
    icon: Tags,
    purpose:
      "Classifies every deduction and chargeback by reason code, scores whether it is valid or disputable, and routes it — valid deductions post and close, disputable ones go to evidence with a recovery hypothesis.",
    inputs: [
      "Isolated deduction from cash application (amount, customer, invoice)",
      "Customer deduction / chargeback notice and backup",
      "Reason-code taxonomy (shortage, damage, pricing, promo/trade, compliance/OTIF)",
      "Customer agreement — allowances, OTIF penalties, trade terms",
      "Historical valid-vs-recovered outcomes by customer and reason",
    ],
    outputs: [
      "Reason-code classification with confidence",
      "Valid / disputable call with the rule and the value at risk",
      "Recovery hypothesis for disputable items (what evidence would refute it)",
      "Auto-post of clearly valid, contracted allowances within tolerance",
      "Routing of disputable deductions to evidence & validation",
    ],
    tech: ["GenAI reason-code classification", "ML recovery-likelihood scoring", "Viki LLM + graph relational DB", "SAP FSCM dispute case"],
    autonomy: 3,
    autonomyRule:
      "Auto-posts a deduction only when it maps to a contracted allowance within tolerance — anything disputable or above the threshold is sent to evidence for validation.",
    escalation: [
      "High-value chargeback",
      "Repeat-offender customer pattern",
      "Unmapped or ambiguous reason code",
      "Compliance / OTIF penalty dispute",
      "Promotion or pricing claim",
    ],
    stat: "72K disputes/yr",
    status: "review",
    note: "Bulk-shipment shortage and OTIF chargebacks are the packaging-specific margin leak — the single biggest recovery lever in O2C.",
  },
  {
    id: "po",
    name: "Evidence & Validation Agent",
    menuLabel: "Evidence & validation",
    icon: FileSearch,
    purpose:
      "Assembles the proof that validates or refutes a disputed deduction — pulls the proof of delivery, bill of lading, weight ticket, sales order and pricing, and renders a one-glance verdict with the evidence bundled for the human reviewer.",
    inputs: [
      "Disputable deduction + recovery hypothesis from triage",
      "Proof of delivery, bill of lading, signed delivery receipt",
      "Sales order, pricing condition records and trade agreement",
      "Carrier weight ticket / scan and OTIF telemetry",
      "Original customer invoice and shipment manifest",
    ],
    outputs: [
      "Validated verdict — valid deduction (accept) or invalid (recover)",
      "Evidence pack — POD, BOL, weight ticket, pricing, cross-referenced",
      "Dollar recovery quantified with the supporting line",
      "Draft dispute-back rationale citing the contract clause",
      "Clean recommendation routed for a human decision",
    ],
    tech: ["Document intelligence (IDP)", "GenAI evidence reasoning", "Carrier / TMS integration", "SAP delivery & pricing API"],
    autonomy: 2,
    autonomyRule:
      "Builds the verdict and the evidence pack but never writes off or recovers on its own — every resolution above zero goes to a person with the proof attached.",
    escalation: [
      "Evidence incomplete or contradictory",
      "POD missing or unsigned",
      "Pricing / promotion interpretation in question",
      "Recovery value above the threshold",
      "Customer relationship flag",
    ],
    stat: "94% evidenced",
    status: "running",
  },
  {
    id: "invoice",
    name: "Dispute Resolution Agent",
    menuLabel: "Dispute resolution",
    icon: Gavel,
    purpose:
      "Closes the loop on a deduction once a human decides — posts the write-off or the recovery to AR, builds the customer-facing recovery package or credit memo, and tracks the dispute-back through to cash.",
    inputs: [
      "Human decision on the validated deduction (accept / recover)",
      "Evidence pack from validation",
      "Customer contact and dispute-portal routing",
      "AR open item and dispute case (SAP FSCM)",
      "Recovery worklist and aging",
    ],
    outputs: [
      "Posted resolution — write-off to the right reason code, or recovery rebill",
      "Customer recovery package or credit memo with the evidence attached",
      "Dispute-back correspondence drafted for review and send",
      "Updated AR open item and dispute-case status",
      "Recovery tracked to cash with an immutable audit trail",
    ],
    tech: ["GenAI correspondence drafting", "Structured workflow", "SAP FI-AR / FSCM write-back", "Customer dispute-portal integration"],
    autonomy: 3,
    autonomyRule:
      "Posts the resolution and sends the package only after a human approves the verdict — it never decides validity itself, it executes and tracks the human's decision.",
    escalation: [
      "Customer rejects the recovery",
      "Partial-settlement negotiation",
      "Repeat dispute on the same shipment",
      "Credit-memo above the threshold",
      "Escalation to the account team",
    ],
    stat: "$3.1M recovered",
    status: "running",
  },
  {
    id: "vendor",
    name: "Customer Master & Credit Agent",
    menuLabel: "Customer & credit",
    icon: Building2,
    purpose:
      "Master-data and credit management for the sell side — keeps the customer master clean (duplicates, hierarchy, merges), maintains credit limits and risk, and releases or holds orders against exposure.",
    inputs: [
      "Live customer master and hierarchy (SAP)",
      "Credit exposure, DSO and payment behavior per customer",
      "External credit data (D&B, credit insurance, watchlists)",
      "Open AR, disputes and deduction history",
      "post-merger customer overlap and consolidation file",
    ],
    outputs: [
      "Duplicate / hierarchy detection with merge proposals",
      "Credit-limit recommendation with the reasoning",
      "Blocked-order release or hold against exposure",
      "Risk flags — deterioration, concentration, watchlist",
      "Customer-master quality dashboard (completeness, accuracy, freshness)",
    ],
    tech: ["ML fuzzy matching", "GenAI name & address normalization", "External credit APIs", "SAP master-data write-back"],
    autonomy: 2,
    autonomyRule:
      "Auto-releases an order only when exposure is within the approved limit and the customer is clean — new, over-limit or watchlisted customers escalate.",
    escalation: [
      "New or over-limit customer",
      "Credit deterioration",
      "Watchlist or insurance withdrawal",
      "Duplicate across the merged book",
      "Concentration above the threshold",
    ],
    stat: "880 cleaned",
    status: "running",
    note: "A recent merger left an estimated 30–40% duplicate customers across the combined book — cleaning it is part of unlocking the $514M synergy target.",
  },
  {
    id: "orchestrator",
    name: "O2C Process Orchestrator",
    menuLabel: "Orchestrator",
    icon: Workflow,
    purpose:
      "Coordinates the five specialist agents end-to-end — managing handoffs, keeping shared context and routing exceptions — and owns the Reporting & CI tower (working-capital reporting and continuous improvement).",
    inputs: [
      "Every agent's output and state",
      "Process-level policies and SLAs",
      "Cross-agent context for human resolution",
    ],
    outputs: [
      "Working-capital dashboards (DSO, unapplied cash, deduction recovery)",
      "Proactive 80/20 leakage and recovery-opportunity insights",
      "Cross-agent handoff coordination",
      "One unified human-escalation interface",
      "A full audit log per receivable",
    ],
    tech: ["Agent orchestration platform", "Shared memory store", "Observability stack"],
    autonomy: 4,
    autonomyRule:
      "Coordinates the workforce rather than settling cash itself — it keeps shared context, sequences handoffs and routes the exceptions that need a person.",
    escalation: [
      "Cross-agent match failure",
      "SLA breach risk",
      "Repeated dispute on one customer or reason code",
    ],
    stat: "5.1 days DSO ↓",
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
