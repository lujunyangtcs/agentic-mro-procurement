/**
 * Cockpit (hub) data — the orchestrator's view of the P2P workforce.
 * Numbers are seeded for the demo and tie out across the cockpit panels.
 */

import type { View } from "@/state";
import type { AgentId } from "@/data/agents";
import type { KPI } from "@/components/blocks/KPIStrip";

/**
 * Top KPI strip — outcome-led, money first. The two left tiles carry the
 * value story (maverick spend kept on-contract · fraud blocked this week) and
 * deep-link to the evidence; the two right tiles read operational health.
 */
export const cockpitKpis: KPI[] = [
  {
    label: "Spend under control",
    value: 1.24,
    prefix: "$",
    suffix: "M",
    decimals: 2,
    trend: { delta: "this quarter", direction: "up" },
    spark: [0.41, 0.55, 0.68, 0.81, 0.94, 1.06, 1.16, 1.24],
    target: { kind: "workspace", flow: "pump" },
  },
  {
    label: "Fraud blocked",
    value: 72,
    prefix: "$",
    suffix: "K",
    trend: { delta: "this week", direction: "up" },
    spark: [0, 0, 0, 0, 0, 0, 0, 72],
    target: { kind: "workspace", flow: "gearbox" },
  },
  {
    label: "Touchless rate",
    value: 82,
    suffix: "%",
    trend: { delta: "+9 pts", direction: "up" },
    spark: [61, 64, 68, 70, 73, 77, 80, 82],
  },
  {
    label: "Capacity freed",
    value: 86,
    suffix: " roles",
    trend: { delta: "+18", direction: "up" },
    spark: [40, 48, 55, 61, 68, 74, 81, 86],
  },
];

export type AgentStatus = "running" | "review" | "idle";

/** One stage of the procure-to-pay value chain, in flow order onboarding → payment. */
export type PipelineStage = {
  /** Position in the 9-stage end-to-end flow — drawn as the rail node. */
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

/**
 * The live pipeline — the full nine-stage value chain across both swimlanes:
 * Procurement Operations (1–4 · onboarding → goods receipt) and Accounts
 * Payable (5–9 · capture → payment).
 */
export const pipelineStages: PipelineStage[] = [
  { n: 1, name: "Supplier onboarding", agent: "vendor", volume: "1,204 vendors", detail: "9 duplicates merged", status: "running" },
  { n: 2, name: "Requisition → PO", agent: "intake", volume: "142 today", detail: "118 auto-submitted", status: "running" },
  { n: 3, name: "Contract & pricing", agent: "sourcing", volume: "38 tenders", detail: "94% on-contract", status: "review" },
  { n: 4, name: "Goods receipt", agent: "po", volume: "1,940 receipts", detail: "47 chased today", status: "running" },
  { n: 5, name: "Invoice capture", agent: "invoice", volume: "2,180 captured", detail: "88% touchless", status: "running" },
  { n: 6, name: "Invoice match", agent: "invoice", volume: "1,610 matched", detail: "22 on hold", status: "review" },
  { n: 7, name: "Exception handling", agent: "invoice", volume: "186 routed", detail: "30% faster", status: "review" },
  { n: 8, name: "Posting & accounting", agent: "invoice", volume: "1,588 posted", detail: "GL clean", status: "running" },
  { n: 9, name: "Payment processing", agent: null, volume: "188 scheduled", detail: "$4.6M to Treasury", status: "idle" },
];

export const pipelineFooter = "9 stages · requisition-to-order median 4.2 h · 82% touchless end-to-end";

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
    id: "PR-48201",
    type: "Procurement ops · upstream",
    site: "Containerboard mill",
    urgency: "critical",
    title: "Corrugator No.2 double-backer belt — $48,200",
    sub: "Onboard → requisition → contract & PO → goods receipt · the 4 upstream stages · above your touchless limit",
    dueLabel: "Needed",
    dueWhen: "Today",
    target: { kind: "workspace", flow: "belt" },
  },
  {
    id: "INV-BPI-5567",
    type: "Accounts payable · downstream",
    site: "Containerboard mill",
    urgency: "high",
    title: "Invoice INV-BPI-5567 · PO-77310 — match, post & pay",
    sub: "Goods received · capture → match → exception → post → pay · the 5 downstream stages · closes the finance↔procurement loop",
    dueLabel: "Due",
    dueWhen: "Today",
    target: { kind: "workspace", flow: "belt-ap" },
  },
  {
    id: "PR-48630",
    type: "Off-contract spot-buy",
    site: "Power House",
    urgency: "high",
    title: "Boiler feed pump — $96,400",
    sub: "Off-contract · single compliant bid · 24% over benchmark · front-office review",
    dueLabel: "Due",
    dueWhen: "Today",
    target: { kind: "workspace", flow: "pump" },
  },
  {
    id: "INV-ADS-4419",
    type: "Payment exception · resolve",
    site: "Containerboard mill",
    urgency: "critical",
    title: "Drive gearbox invoice — short receipt + bank-change fraud",
    sub: "See the exception, then resolve via the existing agents · verify bank → short-pay → release on replacement · back-office",
    dueLabel: "Resolve",
    dueWhen: "Now",
    target: { kind: "workspace", flow: "gearbox" },
  },
];

/** A live expedite / follow-up — the chase stage made concrete. */
export type ChaseRow = {
  id: string;
  /** What is being chased. */
  subject: string;
  /** What the agent has already done on its own. */
  action: string;
  /** How overdue, e.g. "4 days late". */
  lateLabel: string;
  /** Value at risk on the line. */
  amount: string;
  /** Drives the urgency colour on the days-late figure. */
  tone: "critical" | "high" | "medium";
  /** Optional deep-link into the run that owns this line. */
  target?: View;
};

export const expediting = {
  rows: [
    { id: "PO-76840", subject: "Winder drum motor", action: "Sent expedite note #2 to supplier", lateLabel: "4 days late", amount: "$48K", tone: "critical", target: { kind: "agent", id: "po" } },
    { id: "PO-76980", subject: "Roll wrapping film", action: "Chasing supplier acknowledgement", lateLabel: "2 days late", amount: "$128K", tone: "high", target: { kind: "agent", id: "po" } },
    { id: "INV-55012", subject: "Late freight invoice", action: "Requested proof of delivery", lateLabel: "6 days open", amount: "$31K", tone: "high", target: { kind: "agent", id: "po" } },
    { id: "PO-75540", subject: "MRO bearings", action: "Short 12 units · flagged to buyer", lateLabel: "3 days late", amount: "$9.4K", tone: "medium", target: { kind: "agent", id: "po" } },
  ] as ChaseRow[],
  footer: "$216K at risk being worked · 47 chases auto-sent today · 9 cleared",
};

/* ── Overdue receivables — the Payment & Collections agent's watchlist ────── */

export type OverdueRow = {
  id: string;
  customer: string;
  aging: string;
  amount: string;
  /** Dunning tier last sent or drafted, e.g. "Tier 4 · final notice". */
  tier: string;
  /** Auto-send status, e.g. "auto-sent 2h ago" or "drafted · needs you". */
  status: string;
  /** True when the agent has gone as far as it can on its own. */
  actionable?: boolean;
  tone: "critical" | "high" | "medium";
  target?: View;
};

export const overduePayments = {
  alert: { count: 8, amount: "$1.84M", lead: "BlueRidge Foods · $208K · 47 days" },
  rows: [
    {
      id: "INV-90357",
      customer: "BlueRidge Foods",
      aging: "47 days overdue",
      amount: "$208K",
      tier: "Tier 4 · final notice",
      status: "drafted · needs you",
      actionable: true,
      tone: "critical",
      target: { kind: "workspace", flow: "collect" },
    },
    {
      id: "INV-90412",
      customer: "Sigma Containers USA",
      aging: "34 days overdue",
      amount: "$452K",
      tier: "Tier 4 · final notice",
      status: "auto-sent 2h ago",
      tone: "critical",
    },
    {
      id: "INV-90388",
      customer: "Cedar Mills Packaging",
      aging: "31 days overdue",
      amount: "$312K",
      tier: "Tier 3 · firm follow-up",
      status: "auto-sent today",
      tone: "critical",
    },
    {
      id: "INV-90370",
      customer: "Harbor Point Foods",
      aging: "27 days overdue",
      amount: "$268K",
      tier: "Tier 3 · firm follow-up",
      status: "auto-sent 1d ago",
      tone: "high",
    },
    {
      id: "INV-90401",
      customer: "Apex Retail Group",
      aging: "18 days overdue",
      amount: "$174K",
      tier: "Tier 2 · reminder",
      status: "auto-sent today",
      tone: "high",
    },
    {
      id: "INV-90419",
      customer: "Vantage Paper Products",
      aging: "12 days overdue",
      amount: "$158K",
      tier: "Tier 2 · reminder",
      status: "auto-sent today",
      tone: "medium",
    },
    {
      id: "INV-90341",
      customer: "Northwind Logistics",
      aging: "7 days overdue",
      amount: "$142K",
      tier: "Tier 1 · courtesy",
      status: "auto-sent today",
      tone: "medium",
    },
    {
      id: "INV-90433",
      customer: "Lakeside Distributors",
      aging: "5 days overdue",
      amount: "$126K",
      tier: "Tier 1 · courtesy",
      status: "auto-sent today",
      tone: "medium",
    },
  ] as OverdueRow[],
  footer: "$1.84M overdue · 8 accounts · 31 reminders auto-sent today · 6 cleared",
};
