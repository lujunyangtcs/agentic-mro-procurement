/**
 * Cockpit (hub) data — the orchestrator's view of the O2C workforce.
 * Numbers are seeded for the demo and tie out across the cockpit panels.
 * The value story is working-capital first: cash applied, deductions recovered,
 * DSO down — with the deduction worklist deep-linking into the live runs.
 */

import type { View } from "@/o2c/state";
import type { AgentId } from "@/o2c/data/agents";
import type { KPI } from "@/o2c/components/blocks/KPIStrip";

/**
 * Top KPI strip — outcome-led, money first. The two left tiles carry the value
 * story (working capital released by faster, cleaner cash · deductions recovered
 * that would have leaked) and deep-link to the evidence; the two right tiles read
 * operational health.
 */
export const cockpitKpis: KPI[] = [
  {
    label: "Working capital released",
    value: 6.4,
    prefix: "$",
    suffix: "M",
    decimals: 1,
    trend: { delta: "DSO 5.1 days lower", direction: "up" },
    spark: [1.2, 2.1, 2.9, 3.6, 4.4, 5.2, 5.9, 6.4],
    target: { kind: "workspace", flow: "belt" },
  },
  {
    label: "Deductions recovered",
    value: 3.1,
    prefix: "$",
    suffix: "M",
    decimals: 1,
    trend: { delta: "this quarter", direction: "up" },
    spark: [0.3, 0.7, 1.1, 1.6, 2.0, 2.5, 2.8, 3.1],
    target: { kind: "workspace", flow: "belt" },
  },
  {
    label: "Cash applied automatically",
    value: 91,
    suffix: "%",
    trend: { delta: "+14 pts", direction: "up" },
    spark: [70, 73, 77, 80, 83, 86, 89, 91],
  },
  {
    label: "Capacity freed",
    value: 84,
    suffix: " roles",
    trend: { delta: "+17", direction: "up" },
    spark: [38, 46, 53, 60, 67, 74, 80, 84],
  },
];

export type AgentStatus = "running" | "review" | "idle";

/** One stage of the order-to-cash value chain, in flow order invoice → cash. */
export type PipelineStage = {
  /** Position in the flow (1–6) — drawn as the rail node. */
  n: number;
  name: string;
  /** Owning agent for the deep-link — null where work hands off to Treasury. */
  agent: AgentId | null;
  /** Primary throughput count. */
  volume: string;
  /** Secondary read on the stage's health. */
  detail: string;
  status: AgentStatus;
};

/** The live pipeline — invoice all the way through to cash cleared. */
export const pipelineStages: PipelineStage[] = [
  { n: 1, name: "Invoices billed", agent: null, volume: "2,150 today", detail: "$31.4M billed", status: "idle" },
  { n: 2, name: "Cash application", agent: "intake", volume: "12,480 applied", detail: "91% touchless", status: "running" },
  { n: 3, name: "Deduction triage", agent: "sourcing", volume: "318 deductions", detail: "44 disputable", status: "review" },
  { n: 4, name: "Evidence & recovery", agent: "po", volume: "44 in evidence", detail: "$2.3M at stake", status: "running" },
  { n: 5, name: "Dispute resolution", agent: "invoice", volume: "26 resolving", detail: "$3.1M recovered", status: "review" },
  { n: 6, name: "Cash cleared", agent: null, volume: "$28.9M", detail: "to Treasury", status: "idle" },
];

export const pipelineFooter = "Remittance-to-applied median 3.4 h · 91% cash applied touchless end-to-end";

export type PendingDecision = {
  id: string;
  type: string;
  site: string;
  urgency: "critical" | "high" | "medium";
  title: string;
  sub: string;
  dueLabel: string;
  dueWhen: string;
  target: View;
};

export const pendingDecisions: PendingDecision[] = [
  {
    id: "DED-90357",
    type: "Shortage chargeback · disputable",
    site: "BlueRidge Foods",
    urgency: "critical",
    title: "BlueRidge Foods — $208,400 shortage deduction",
    sub: "Bulk corrugated shipment · proof of delivery signed in full · evidence says invalid — recover",
    dueLabel: "Recover by",
    dueWhen: "Today",
    target: { kind: "workspace", flow: "belt" },
  },
  {
    id: "DED-90412",
    type: "OTIF penalty · disputable",
    site: "Sigma Containers USA",
    urgency: "high",
    title: "Sigma Containers — $96,400 OTIF chargeback",
    sub: "On-time-in-full penalty · carrier scan shows on-time delivery · 24% of the claim disputable",
    dueLabel: "Due",
    dueWhen: "Today",
    target: { kind: "agent", id: "sourcing" },
  },
  {
    id: "DED-90388",
    type: "Pricing claim · disputable",
    site: "Cedar Mills Packaging",
    urgency: "high",
    title: "Cedar Mills — $54,200 trade-promotion deduction",
    sub: "Promo allowance claimed twice · pricing master shows one valid claim · partial recovery",
    dueLabel: "Due",
    dueWhen: "Tomorrow",
    target: { kind: "agent", id: "po" },
  },
];

/** A live dispute / recovery in flight — the recovery stage made concrete. */
export type ChaseRow = {
  id: string;
  /** What is being recovered. */
  subject: string;
  /** What the agent has already done on its own. */
  action: string;
  /** How far along, e.g. "evidence ready". */
  lateLabel: string;
  /** Value at risk on the line. */
  amount: string;
  /** Drives the urgency colour on the status figure. */
  tone: "critical" | "high" | "medium";
  /** Optional deep-link into the run that owns this line. */
  target?: View;
};

export const expediting = {
  rows: [
    { id: "DED-91040", subject: "Harbor Point · damage deduction", action: "POD + photos pulled · claim valid", lateLabel: "accept · post", amount: "$18K", tone: "medium", target: { kind: "agent", id: "po" } },
    { id: "DED-90980", subject: "Apex Retail · shortage chargeback", action: "Weight ticket refutes the claim", lateLabel: "evidence ready", amount: "$74K", tone: "high", target: { kind: "agent", id: "po" } },
    { id: "DED-91012", subject: "Vantage Paper · OTIF penalty", action: "Carrier scan requested", lateLabel: "evidence pending", amount: "$31K", tone: "high", target: { kind: "agent", id: "po" } },
    { id: "DED-90540", subject: "Lakeside · pricing claim", action: "Promo terms cross-checked", lateLabel: "partial recovery", amount: "$22K", tone: "medium", target: { kind: "agent", id: "po" } },
  ] as ChaseRow[],
  footer: "$2.3M of deductions in evidence · 44 disputable items worked today · 9 recovered",
};

/* ── Open deductions — the Deduction Triage agent's worklist ──────────────── */

export type OverdueRow = {
  id: string;
  customer: string;
  aging: string;
  amount: string;
  /** Reason code + validity call, e.g. "Shortage · disputable". */
  tier: string;
  /** Agent status, e.g. "evidence ready · needs you" or "posted valid". */
  status: string;
  /** True when the agent has gone as far as it can on its own. */
  actionable?: boolean;
  tone: "critical" | "high" | "medium";
  target?: View;
};

export const overduePayments = {
  alert: { count: 8, amount: "$2.34M", lead: "BlueRidge Foods · $208K · shortage chargeback" },
  rows: [
    {
      id: "DED-90357",
      customer: "BlueRidge Foods",
      aging: "taken 6 days ago",
      amount: "$208K",
      tier: "Shortage · disputable",
      status: "evidence ready · needs you",
      actionable: true,
      tone: "critical",
      target: { kind: "workspace", flow: "belt" },
    },
    {
      id: "DED-90412",
      customer: "Sigma Containers USA",
      aging: "taken 4 days ago",
      amount: "$452K",
      tier: "OTIF penalty · disputable",
      status: "evidence ready · needs you",
      actionable: true,
      tone: "critical",
    },
    {
      id: "DED-90388",
      customer: "Cedar Mills Packaging",
      aging: "taken 5 days ago",
      amount: "$312K",
      tier: "Pricing claim · disputable",
      status: "in evidence",
      tone: "critical",
    },
    {
      id: "DED-90370",
      customer: "Harbor Point Foods",
      aging: "taken 8 days ago",
      amount: "$268K",
      tier: "Damage · valid",
      status: "posted · accepted",
      tone: "high",
    },
    {
      id: "DED-90401",
      customer: "Apex Retail Group",
      aging: "taken 3 days ago",
      amount: "$174K",
      tier: "Shortage · disputable",
      status: "evidence ready",
      tone: "high",
    },
    {
      id: "DED-90419",
      customer: "Vantage Paper Products",
      aging: "taken 2 days ago",
      amount: "$158K",
      tier: "OTIF penalty · disputable",
      status: "evidence pending",
      tone: "medium",
    },
    {
      id: "DED-90341",
      customer: "Northwind Logistics",
      aging: "taken 7 days ago",
      amount: "$142K",
      tier: "Promotion · valid",
      status: "posted · accepted",
      tone: "medium",
    },
    {
      id: "DED-90433",
      customer: "Lakeside Distributors",
      aging: "taken 1 day ago",
      amount: "$126K",
      tier: "Pricing claim · disputable",
      status: "in triage",
      tone: "medium",
    },
  ] as OverdueRow[],
  footer: "$2.34M in open deductions · 8 customers · 31 triaged today · 6 recovered",
};
