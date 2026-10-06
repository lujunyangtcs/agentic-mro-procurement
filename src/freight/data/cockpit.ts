/**
 * Cockpit (hub) data — the router's view of the inbound-haulage freight
 * workforce for Northgate Paper Co. Numbers are seeded for the demo and tie out
 * across the cockpit panels. Dual narrative: the left tiles carry the CFO money
 * story (overcharge recovered · demurrage avoided), the right tiles read the
 * COO operational health (touchless settlement · capacity freed).
 *
 * NOTE: flow ids (belt/pump/gearbox/collect) are inherited from the base and
 * never render — here they mean: belt = the hero OCC settlement, pump = a
 * mixed-paper rate review, gearbox = a duplicate-booking payment hold, collect
 * = a carrier overcharge-recovery run.
 */

import type { View } from "@/freight/state";
import type { AgentId } from "@/freight/data/agents";
import type { KPI } from "@/freight/components/blocks/KPIStrip";

/**
 * Top KPI strip — outcome-led, money first. The two left tiles carry the value
 * story (freight overcharge recovered · demurrage avoided) and deep-link to the
 * evidence; the two right tiles read operational health.
 *
 * SOURCING — seeded for a large recovered-fibre inbound-haulage network and
 * grounded in docs/BLUEPRINT.md §5 (KPI targets) + the brief's "thousands of
 * loads of baled recovered fibre into our mills every month":
 *  · Overcharge recovered $1.18M/qtr ← BLUEPRINT "freight-spend leakage 3–6%"
 *    band, applied to a ~$118M/yr inbound-fibre network (~6,000 loads/mo, ~4%
 *    realised → ~$4.7M/yr).
 *  · Demurrage & accessorial avoided $214K/qtr ← BLUEPRINT "$/quarter recovered".
 *  · Touchless settlement 71% ← BLUEPRINT target band 65–75%.
 *  · Capacity freed 64 FTE ← BLUEPRINT "AP FTE hours released".
 * Tie-outs: the hero banner (views/Cockpit.tsx), the OCC settlement run
 * ($15,480 invoice · $1,816 disputed) and the dispute watchlist ($96K open).
 */
export const cockpitKpis: KPI[] = [
  {
    label: "Overcharge recovered",
    value: 1.18,
    prefix: "$",
    suffix: "M",
    decimals: 2,
    trend: { delta: "this quarter", direction: "up" },
    spark: [0.32, 0.47, 0.61, 0.74, 0.88, 0.99, 1.09, 1.18],
    target: { kind: "workspace", flow: "belt" },
  },
  {
    label: "Demurrage avoided",
    value: 214,
    prefix: "$",
    suffix: "K",
    trend: { delta: "this quarter", direction: "up" },
    spark: [22, 48, 71, 96, 128, 159, 188, 214],
    target: { kind: "workspace", flow: "belt" },
  },
  {
    label: "Touchless settlement",
    value: 71,
    suffix: "%",
    trend: { delta: "+12 pts", direction: "up" },
    spark: [48, 52, 56, 59, 63, 66, 69, 71],
    target: { kind: "workspace", flow: "settle" },
  },
  {
    label: "Capacity freed",
    value: 64,
    suffix: " FTE",
    trend: { delta: "+15", direction: "up" },
    spark: [28, 34, 40, 46, 52, 57, 61, 64],
    target: { kind: "workspace", flow: "settle" },
  },
];

export type AgentStatus = "running" | "review" | "idle";

/** One stage of the freight value chain, in flow order intake → payment. */
export type PipelineStage = {
  /** Position in the flow (1–6) — drawn as the rail node. */
  n: number;
  name: string;
  /** Owning agent for the deep-link — null where work hands off to AP. */
  agent: AgentId | null;
  /** Primary throughput count. */
  volume: string;
  /** Secondary read on the stage's health. */
  detail: string;
  status: AgentStatus;
};

/** The live pipeline — pickup requirement all the way through to payment-ready. */
export const pipelineStages: PipelineStage[] = [
  { n: 1, name: "Lane intake", agent: "intake", volume: "128 lanes", detail: "112 auto-classified", status: "running" },
  { n: 2, name: "Rate & surcharge", agent: "sourcing", volume: "94% on-contract", detail: "9 out of tolerance", status: "review" },
  { n: 3, name: "Carrier tender", agent: "po", volume: "41 tendered", detail: "6 need release", status: "running" },
  { n: 4, name: "Load capture", agent: "vendor", volume: "1,180 packets", detail: "31 missing evidence", status: "running" },
  { n: 5, name: "Settlement match", agent: "invoice", volume: "1,580 lines", detail: "94% cleared touchless · 41 routed today", status: "review" },
  { n: 6, name: "Payment ready", agent: null, volume: "176 scheduled", detail: "$3.8M to AP", status: "idle" },
];

export const pipelineFooter = "Receipt-to-settlement median 2.4 days · 71% touchless · on-time pickup 91%";

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
  /** A non-built use case shown greyed as "Not in scope" — not actionable. */
  outOfScope?: boolean;
};

export const pendingDecisions: PendingDecision[] = [
  {
    id: "INV-IRN-2206",
    type: "Settlement automation · carrier invoice",
    site: "Ironwood Freight Lines · CHI→RIV",
    urgency: "critical",
    title: "Carrier invoice — 20 lines · 16 cleared touchless · 4 exceptions to route",
    sub: "80% auto-cleared ($30.7K to AP) · $4.1K across 4 exception types routed to 4 teams · ready for you",
    dueLabel: "Route",
    dueWhen: "Now",
    target: { kind: "workspace", flow: "settle" },
  },
  {
    id: "FRT-48201",
    type: "Settlement exception · OCC live load",
    site: "Riverside mill",
    urgency: "critical",
    title: "OCC haul invoice — $15,790 · mis-class + surcharge + demurrage + cube-out + re-bill",
    sub: "Five lines flagged · $13,144 cleared touchless · $2,646 dispute drafted, ready for you",
    dueLabel: "Needed",
    dueWhen: "Today",
    target: { kind: "workspace", flow: "belt" },
  },
  {
    id: "UC-LANE",
    type: "AI lane intake & carrier orchestration",
    site: "Network · all lanes",
    urgency: "medium",
    title: "Lane intake & carrier orchestration — classify haul, score carriers, tender",
    sub: "Recommends the optimal carrier and triggers tendering",
    dueLabel: "Not in scope",
    dueWhen: "—",
    target: { kind: "cockpit" },
    outOfScope: true,
  },
  {
    id: "UC-RATE",
    type: "Dynamic rate card & surcharge intelligence",
    site: "Network · all lanes",
    urgency: "medium",
    title: "Dynamic rate card & surcharge intelligence — standardise surcharges, benchmark rates",
    sub: "Eliminates hidden charges, improves freight-cost transparency",
    dueLabel: "Not in scope",
    dueWhen: "—",
    target: { kind: "cockpit" },
    outOfScope: true,
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
    { id: "SHP-76840", subject: "Missing proof of delivery", action: "Requested POD from the carrier", lateLabel: "4 days open", amount: "$11K", tone: "critical", target: { kind: "agent", id: "po" } },
    { id: "SHP-76980", subject: "Detention charge disputed", action: "Sent dispute note #2 with gate logs", lateLabel: "2 days open", amount: "$6.2K", tone: "high", target: { kind: "agent", id: "po" } },
    { id: "SHP-55012", subject: "Late freight invoice", action: "Matched to shipment · awaiting credit", lateLabel: "6 days open", amount: "$8.4K", tone: "high", target: { kind: "agent", id: "po" } },
    { id: "SHP-75540", subject: "Cube-out weight variance", action: "Requested scaled-weight ticket", lateLabel: "3 days open", amount: "$3.1K", tone: "medium", target: { kind: "agent", id: "po" } },
  ] as ChaseRow[],
  footer: "$28.7K in dispute being worked · 39 chases auto-sent today · 11 cleared",
};

/* ── Carrier overcharge recovery — the router's dispute watchlist ─────────── */

export type OverdueRow = {
  id: string;
  customer: string;
  aging: string;
  amount: string;
  /** Dispute stage last sent or drafted, e.g. "Stage 3 · firm follow-up". */
  tier: string;
  /** Auto-send status, e.g. "auto-sent 2h ago" or "drafted · needs you". */
  status: string;
  /** True when the agent has gone as far as it can on its own. */
  actionable?: boolean;
  tone: "critical" | "high" | "medium";
  target?: View;
};

export const overduePayments = {
  alert: { count: 7, amount: "$96K", lead: "Summit Carriers · $24K · demurrage dispute · 23 days" },
  rows: [
    {
      id: "DSP-90357",
      customer: "Summit Carriers",
      aging: "23 days open",
      amount: "$24K",
      tier: "Stage 4 · escalation",
      status: "credit chased · auto-sent",
      tone: "critical",
    },
    {
      id: "DSP-90412",
      customer: "Ironwood Freight Lines",
      aging: "19 days open",
      amount: "$18K",
      tier: "Stage 4 · escalation",
      status: "auto-sent 2h ago",
      tone: "critical",
    },
    {
      id: "DSP-90388",
      customer: "Cedar Haul Logistics",
      aging: "16 days open",
      amount: "$14K",
      tier: "Stage 3 · firm follow-up",
      status: "auto-sent today",
      tone: "high",
    },
    {
      id: "DSP-90370",
      customer: "Harbor Point Carriers",
      aging: "12 days open",
      amount: "$11K",
      tier: "Stage 3 · firm follow-up",
      status: "auto-sent 1d ago",
      tone: "high",
    },
    {
      id: "DSP-90401",
      customer: "Vantage Owner-Operators",
      aging: "9 days open",
      amount: "$9.5K",
      tier: "Stage 2 · reminder",
      status: "auto-sent today",
      tone: "medium",
    },
    {
      id: "DSP-90419",
      customer: "Lakeside Trucking",
      aging: "6 days open",
      amount: "$8.2K",
      tier: "Stage 2 · reminder",
      status: "auto-sent today",
      tone: "medium",
    },
    {
      id: "DSP-90341",
      customer: "Northwind Regional",
      aging: "4 days open",
      amount: "$6.8K",
      tier: "Stage 1 · courtesy",
      status: "auto-sent today",
      tone: "medium",
    },
  ] as OverdueRow[],
  footer: "$96K in carrier disputes · 7 carriers · 24 follow-ups auto-sent today · 5 cleared",
};
