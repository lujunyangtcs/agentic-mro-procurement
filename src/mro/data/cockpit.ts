/**
 * Cockpit (hub) data — the orchestrator's view of the MRO procurement workforce
 * for Bond. Numbers are seeded for the demo and tie out across
 * the cockpit panels. Dual narrative: the left tiles carry the CFO money story
 * (off-contract avoided · duplicate spend caught), the right tiles read the
 * operational health (touchless release · capacity freed).
 *
 * NOTE: flow ids belt/pump/gearbox/collect are inherited from the base; `risk`
 * is the UC2 predictive flow (steps in prCases.tsx `riskPrSteps`). The cockpit
 * surfaces exactly the FOUR worked use cases, one decision card + one KPI tile
 * each: pump = mechanical-seal free-text PR (PR-48630), gearbox = grinding-media
 * duplicate/transfer PR (PR-48655), risk = drive-gearbox stock-out pre-buy
 * (RISK-49001), compliance = PR→PO commercial gate (PR-48690 → PO-77412).
 * belt/collect hold leftover base content and are NOT surfaced.
 */

import type { View } from "@/mro/state";
import type { AgentId } from "@/mro/data/agents";

export type AgentStatus = "running" | "review" | "idle";

/** One stage of the MRO procurement value chain, in flow order intake → release. */
export type PipelineStage = {
  /** Position in the flow (1–6) — drawn as the rail node. */
  n: number;
  name: string;
  /** Owning agent for the deep-link — null where work hands off to the buyer. */
  agent: AgentId | null;
  /** Primary throughput count. */
  volume: string;
  /** Secondary read on the stage's health. */
  detail: string;
  status: AgentStatus;
};

/** The live pipeline — free-text request all the way through to a released PR. */
export const pipelineStages: PipelineStage[] = [
  { n: 1, name: "PR processing", agent: "intake", volume: "96 requisitions", detail: "84 auto-coded", status: "running" },
  { n: 2, name: "Master data", agent: "vendor", volume: "31 duplicates", detail: "9 stock transfers found", status: "review" },
  { n: 3, name: "Warranty & coverage", agent: "invoice", volume: "12 claims", detail: "3 need a decision", status: "review" },
  { n: 4, name: "Sourcing & contract", agent: "sourcing", volume: "94% on-contract", detail: "6 off-contract flagged", status: "running" },
  { n: 5, name: "Approval & routing", agent: "po", volume: "41 routed", detail: "5 need release", status: "running" },
  { n: 6, name: "PR released", agent: null, volume: "188 this week", detail: "$1.4M committed", status: "idle" },
];

export const pipelineFooter = "Request-to-release median 1.6 days · 68% touchless · on-contract 94%";

export type PendingDecision = {
  id: string;
  type: string;
  site: string;
  urgency: "critical" | "high" | "medium";
  title: string;
  dueLabel: string;
  dueWhen: string;
  target: View;
};

export const pendingDecisions: PendingDecision[] = [
  {
    id: "PR-48630",
    type: "PR intake & validation · MRO",
    site: "Dispersion · Mixing Line 2",
    urgency: "critical",
    title: "Mechanical-seal request — line down; specification needs confirmation to release",
    dueLabel: "Confirm",
    dueWhen: "Now",
    target: { kind: "workspace", flow: "pump" },
  },
  {
    id: "RISK-49001",
    type: "Predictive risk · auto-procurement",
    site: "Northgate · Utilities line",
    urgency: "high",
    title: "Drive-gearbox seal kit — projected shortage in 9 days; early purchase recommended",
    dueLabel: "Pre-empt",
    dueWhen: "Today",
    target: { kind: "workspace", flow: "risk" },
  },
  {
    id: "PR-48690",
    type: "PR → PO · compliance & commercial",
    site: "Resin Plant · Reactor Train",
    urgency: "high",
    title: "Gearbox rebuild kit — $42,000; ready for purchase order and compliance review",
    dueLabel: "Convert",
    dueWhen: "Today",
    target: { kind: "workspace", flow: "compliance" },
  },
  {
    id: "PR-48655",
    type: "PR intake & validation · MRO",
    site: "Dispersion · Bead Mill 3",
    urgency: "high",
    title: "Grinding-media request — mostly covered by existing stock and warranty",
    dueLabel: "Review",
    dueWhen: "Today",
    target: { kind: "workspace", flow: "gearbox" },
  },
];

/** A live open requisition the workforce is still working before it can release. */
export type ChaseRow = {
  id: string;
  /** What is being worked. */
  subject: string;
  /** What the agent has already done on its own. */
  action: string;
  /** How long it has been open, e.g. "2 days open". */
  lateLabel: string;
  /** Value on the line. */
  amount: string;
  /** Drives the urgency colour on the open-days figure. */
  tone: "critical" | "high" | "medium";
  /** Optional deep-link into the agent that owns this line. */
  target?: View;
};

export const expediting = {
  rows: [
    { id: "PR-48672", subject: "Hydraulic oil — spec incomplete", action: "Requested grade from the engineer", lateLabel: "1 day open", amount: "$2.1K", tone: "high", target: { kind: "agent", id: "intake" } },
    { id: "PR-48668", subject: "Pump diaphragm — duplicate suspected", action: "Matched to open PR-48651", lateLabel: "2 days open", amount: "$640", tone: "medium", target: { kind: "agent", id: "vendor" } },
    { id: "PR-48659", subject: "Gearbox seal — warranty check", action: "Pulled the OEM commissioning date", lateLabel: "1 day open", amount: "$1.8K", tone: "medium", target: { kind: "agent", id: "invoice" } },
    { id: "PR-48647", subject: "Drive motor — off-contract vendor", action: "Found a preferred-supplier match", lateLabel: "3 days open", amount: "$5.4K", tone: "high", target: { kind: "agent", id: "sourcing" } },
  ] as ChaseRow[],
  footer: "$9.9K across 4 open requisitions · 27 chased today · 14 released",
};

/* ── Duplicate spend & interplant savings — the orchestrator's watchlist ───── */

export type OverdueRow = {
  id: string;
  /** The plant / requester the line belongs to. */
  customer: string;
  /** How long the line has been open, e.g. "2 days open". */
  aging: string;
  /** Spend avoided or value redirected on the line. */
  amount: string;
  /** What the agent recommended, e.g. "Transfer · 6 EA in store". */
  tier: string;
  /** Action status, e.g. "drafted · needs you" or "transfer routed". */
  status: string;
  /** True when the line needs a person to decide. */
  actionable?: boolean;
  tone: "critical" | "high" | "medium";
  target?: View;
};

export const overduePayments = {
  alert: { count: 5, amount: "$148K", lead: "Bead Mill 3 · $708 · grinding media in stock + warranty · 2 days" },
  rows: [
    {
      id: "PR-48655",
      customer: "Bead Mill 3 · grinding media",
      aging: "2 days open",
      amount: "$708",
      tier: "Transfer + warranty claim",
      status: "drafted · needs you",
      actionable: true,
      tone: "critical",
      target: { kind: "workspace", flow: "gearbox" },
    },
    {
      id: "PR-48641",
      customer: "Bead Mill 3 · grinding media",
      aging: "6 days open",
      amount: "$708",
      tier: "Duplicate of PR-48655",
      status: "cancellation drafted",
      tone: "critical",
    },
    {
      id: "PR-48619",
      customer: "Boiler house · pump seals",
      aging: "4 days open",
      amount: "$2.2K",
      tier: "6 EA at Eastbrook store",
      status: "transfer suggested",
      tone: "high",
    },
    {
      id: "PR-48603",
      customer: "Resin plant · gearbox spares",
      aging: "5 days open",
      amount: "$3.6K",
      tier: "Inside OEM warranty",
      status: "claim drafted",
      tone: "high",
    },
    {
      id: "PR-48588",
      customer: "Mixing Line 2 · agitator seals",
      aging: "3 days open",
      amount: "$1.1K",
      tier: "On-hand at this plant",
      status: "stock flagged",
      tone: "medium",
    },
    {
      id: "PR-48571",
      customer: "Filling Line · hydraulic hoses",
      aging: "7 days open",
      amount: "$780",
      tier: "Duplicate of PR-48560",
      status: "cancellation drafted",
      tone: "medium",
    },
    {
      id: "PR-48552",
      customer: "Bead mill · drive gearbox",
      aging: "8 days open",
      amount: "$1.3K",
      tier: "4 EA at Westport store",
      status: "transfer routed",
      tone: "medium",
    },
  ] as OverdueRow[],
  footer: "$148K duplicate & off-stock spend caught this quarter · 5 plants · 31 lines redirected · 14 cleared",
};
