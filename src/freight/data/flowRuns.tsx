/**
 * Per-flow run registry — the gated agent runs the user opens from the cockpit.
 *
 *  ① belt    — HERO · inbound OCC freight settlement · three-way check (steps in runSteps.tsx).
 *  ② pump    — MRO PR intake & validation · conveyor belt example (steps in prCases.tsx).
 *  ③ gearbox — MRO PR intake & validation · idler roller example (steps in prCases.tsx).
 *  ④ collect — carrier overcharge recovery · dunning ladder (defined below).
 *
 * Every figure ties out across a run's documents. A non-approve decision halts the
 * run; the terminal pill is flow-specific.
 */

import type { FlowId, Decision } from "@/freight/state";
import { runSteps as beltSteps, type RunStep } from "@/freight/data/runSteps";
import { settleSteps } from "@/freight/data/settleSteps";
import { beltPrSteps, rollerPrSteps } from "@/freight/data/prCases";

import { EmailDoc, SpendingPolicyDoc } from "@/freight/components/docs/sources";
import { LedgerDoc } from "@/freight/components/docs/finance/LedgerDoc";
import { SalesOrderDoc } from "@/freight/components/docs/o2c/SalesOrderDoc";
import { DeliveryDoc } from "@/freight/components/docs/o2c/DeliveryDoc";
import { CustomerInvoiceDoc } from "@/freight/components/docs/o2c/CustomerInvoiceDoc";
import { PaymentCollectionsWorkspace } from "@/freight/components/workspace/PaymentCollectionsWorkspace";

export type TerminalPill = { label: string; kind: "ready" | "critical" | "progress" };

export type FlowRun = {
  id: FlowId;
  /** Topbar context line in the workspace. */
  contextTitle: string;
  contextSub: string;
  /** Pill shown while the run is still in review. */
  reviewPill: string;
  /** Note shown when the final step is approved (happy-path close). */
  completeNote: string;
  steps: RunStep[];
  /** Terminal pill once the run settles (halted or completed). */
  terminal: (decisions: Record<number, Decision>) => TerminalPill;
  /** Close ceremony — the center terminal card shown when the run settles. */
  completion?: {
    title: string;
    /** "ready" = green happy close · "critical" = red halted/blocked close. */
    tone: "ready" | "critical";
    /** The final owner the last step hands off to (control / human reviewer). */
    routedTo: string;
    routedSub: string;
    stats: { value: string; label: string }[];
    caption: string;
  };
};

const halted = (d: Record<number, Decision>) =>
  Object.values(d).some((s) => s === "escalated" || s === "rejected");

/* ════════════════════════════════════════════════════════════════════════
 * ④ COLLECT — Payment & Collections (overdue receivable · dunning · posting)
 * BlueRidge Foods · INV-90357 · $208,400 · 47 days past Net-45 · GL ↔ sub-ledger
 * ════════════════════════════════════════════════════════════════════════ */

const collectCustomerNote = (
  <EmailDoc
    from="BlueRidge Foods · Accounts Payable"
    fromAddr="ap@blueridgefoods.com"
    to="Northgate Paper · Recovery desk"
    sent="2026-05-22 · 14:10"
    subject="RE: Reminder — invoice INV-90357"
    tone="inbound"
    lines={[
      "Thanks for the reminder. We're working through a backlog after a system migration — the invoice is in our queue and should be processed shortly.",
      "We'll come back with a payment date. Apologies for the delay.",
    ]}
  />
);

const collectPoEmail = (
  <EmailDoc
    from="BlueRidge Foods · Procurement"
    fromAddr="orders@blueridgefoods.com"
    to="Northgate Paper · Freight desk"
    sent="2026-03-27 · 15:48"
    subject="Purchase order BRF-PO-7741 — containerboard, 320 MT"
    tone="inbound"
    lines={[
      "Please enter our order for 320 MT of 42 ECT kraft linerboard (your CB-42ECT) against contract CTR-BRF-2024, ship-to our Memphis DC.",
      "Requested delivery 2026-04-01. Net 45 as per the contract. Our PO number is BRF-PO-7741.",
    ]}
  />
);

const collectCreditNote = (
  <EmailDoc
    from="Credit Management Agent"
    fromAddr="credit@northgatepaper.com"
    to="Order Management"
    sent="2026-03-28 · 09:55"
    subject="Credit check — BlueRidge Foods Co. (0000610248)"
    tone="inbound"
    lines={[
      "BlueRidge Foods Co. is within its $750,000 credit limit — current exposure $204,480 before this order. Order of $208,400 keeps the account inside the limit at order date.",
      "Terms ZB45 · Net 45 per contract CTR-BRF-2024. Credit released.",
    ]}
  />
);

const collectShipNote = (
  <EmailDoc
    from="Ironwood Freight Lines"
    fromAddr="dispatch@ironwoodfreight.com"
    to="Northgate Paper Fulfillment"
    sent="2026-04-01 · 09:20"
    subject="BOL IWF-2026-44718 — SO-58841 picked up"
    tone="inbound"
    lines={[
      "Confirmed pickup of 320 MT from the Containerboard mill dock on BOL IWF-2026-44718, route US-SE-02 to BlueRidge Memphis DC.",
      "Goods issue can be posted against delivery 80004471.",
    ]}
  />
);

/* ── Step 1 · Sales order — SO-58841 ─────────────────────────────────────── */
const collectOrderStep: RunStep = {
  id: "intake",
  agentName: "Order Management Agent",
  n: 1,
  title: "Sales order",
  sub: "Turns the customer PO into a sales order",
  reasoning: [
    "Reading BlueRidge purchase order BRF-PO-7741",
    "Validating customer 0000610248 and the credit limit",
    "Pricing 320 MT containerboard on contract CTR-BRF-2024",
    "Confirming availability — fully confirmed for 2026-04-01",
    "Creating sales order SO-58841 — $208,400 net",
  ],
  docLabel: "SO-58841 · Sales order",
  document: <SalesOrderDoc />,
  sources: [
    { id: "brf-po", label: "Customer PO", meta: "BlueRidge · 03-27", kind: "email", body: collectPoEmail },
    { id: "credit-check", label: "Credit check", meta: "SAP FD32 · 0000610248", kind: "master", body: collectCreditNote },
  ],
  recommendation:
    "On contract (CTR-BRF-2024), within the credit limit, fully confirmed. Sales order SO-58841 created and released to fulfillment.",
  stages: [
    {
      sourceId: "brf-po",
      reasoning: "Reading BlueRidge purchase order BRF-PO-7741",
      title: "Sold-to & order",
      fields: [
        { label: "Sold-to party", value: "BlueRidge Foods Co. · 0000610248" },
        { label: "Customer PO", value: "BRF-PO-7741" },
        { label: "Material", value: "CB-42ECT · 42 ECT linerboard" },
        { label: "Quantity", value: "320 MT" },
        { label: "Requested delivery", value: "2026-04-01" },
        { label: "Ship-to", value: "BlueRidge · Memphis DC" },
      ],
    },
    {
      sourceId: "credit-check",
      reasoning: "Pricing 320 MT on contract and clearing the credit check",
      title: "Pricing & credit",
      fields: [
        { label: "Net price", value: "651.25 / MT" },
        { label: "Net value", value: "$208,400.00" },
        { label: "Payment terms", value: "ZB45 · Net 45 (CTR-BRF-2024)" },
        { label: "Credit status", value: "Released · within $750k limit" },
      ],
    },
  ],
};

/* ── Step 2 · Outbound delivery — 80004471 ───────────────────────────────── */
const collectDeliveryStep: RunStep = {
  id: "po",
  agentName: "Fulfillment Agent",
  n: 2,
  title: "Outbound delivery",
  sub: "Ships the order and posts goods issue",
  reasoning: [
    "Reading sales order SO-58841",
    "Picking 320 MT from finished goods FG01",
    "Booking carrier Ironwood Freight — route US-SE-02",
    "Posting goods issue 2026-04-01 · movement 601",
    "Delivery 80004471 complete — billing-relevant",
  ],
  docLabel: "80004471 · Outbound delivery",
  document: <DeliveryDoc />,
  sources: [
    { id: "so-handoff", label: "SO-58841", meta: "from Order Mgmt · SAP VA03", kind: "sap", handoff: true, body: <SalesOrderDoc /> },
    { id: "ship-note", label: "Carrier confirmation", meta: "Ironwood · 04-01", kind: "email", body: collectShipNote },
  ],
  recommendation:
    "Goods issue posted — 320 MT shipped and relieved from stock. Delivery 80004471 is billing-relevant and handed to billing.",
  stages: [
    {
      sourceId: "so-handoff",
      reasoning: "Reading sales order SO-58841 and picking from finished goods",
      title: "Delivery header",
      fields: [
        { label: "Sales order ref.", value: "SO-58841 · item 10" },
        { label: "Ship-to", value: "BlueRidge · Memphis DC" },
        { label: "Shipping point", value: "M042 · mill dock" },
        { label: "Material", value: "CB-42ECT · 320 MT" },
      ],
    },
    {
      sourceId: "ship-note",
      reasoning: "Booking the carrier and posting goods issue · movement 601",
      title: "Goods issue",
      fields: [
        { label: "Carrier", value: "Ironwood Freight Lines" },
        { label: "Bill of lading", value: "IWF-2026-44718" },
        { label: "Actual GI", value: "2026-04-01 · 09:05" },
        { label: "Movement", value: "601 · GI for delivery" },
      ],
    },
  ],
};

/* ── Step 3 · Customer invoice — INV-90357 ───────────────────────────────── */
const collectInvoiceStep: RunStep = {
  id: "invoice",
  agentName: "Billing Agent",
  n: 3,
  title: "Customer invoice",
  sub: "Bills the delivery and posts the receivable",
  reasoning: [
    "Reading delivery 80004471 and the sales order",
    "Billing 320 MT at the contract price — $208,400",
    "Posting to FI — Dr AR 120000 · Cr Revenue 400000",
    "Setting Net-45 terms — due 2026-05-18",
    "Issuing customer invoice INV-90357",
  ],
  docLabel: "INV-90357 · Customer invoice",
  document: <CustomerInvoiceDoc />,
  sources: [
    { id: "dlv-handoff", label: "80004471", meta: "from Fulfillment · SAP VL03N", kind: "sap", handoff: true, body: <DeliveryDoc /> },
    { id: "so-billing", label: "SO-58841", meta: "pricing reference", kind: "sap", body: <SalesOrderDoc /> },
  ],
  recommendation:
    "Billed on contract, posted to the AR control account, Net 45. Invoice INV-90357 issued — $208,400 due 2026-05-18.",
  stages: [
    {
      sourceId: "dlv-handoff",
      reasoning: "Reading delivery 80004471 and the sales order",
      title: "Bill-to & reference",
      fields: [
        { label: "Bill-to", value: "BlueRidge · 0000610248" },
        { label: "Billing document", value: "0090000357" },
        { label: "Delivery ref.", value: "80004471" },
        { label: "Billing date", value: "2026-04-03" },
      ],
    },
    {
      sourceId: "so-billing",
      reasoning: "Billing 320 MT at the contract price and posting to FI",
      title: "Amounts & terms",
      fields: [
        { label: "Net value", value: "$208,400.00" },
        { label: "Tax (B2B exempt)", value: "$0.00" },
        { label: "Due date", value: "2026-05-18 · Net 45" },
        { label: "AR account", value: "120000 · Trade receivables" },
      ],
    },
  ],
};

/* ── Step 4 · Reconcile — AR-RECON-90357 ─────────────────────────────────── */
const collectReconStep: RunStep = {
  id: "invoice",
  agentName: "Payment & Collections Agent",
  n: 4,
  title: "Reconcile the ledger",
  sub: "GL ↔ AR sub-ledger · flag the overdue item",
  reasoning: [
    "Reading the AR sub-ledger for BlueRidge Foods · account 120000",
    "Tying the GL control balance to the sub-ledger — USD 412,880",
    "Flagging INV-90357 — $208,400 open, 47 days past the Net-45 due date",
    "Pulling contract CTR-BRF-2024 — credit-hold clause",
    "Aging the account — $208,400 in the 31–60 day overdue bucket",
  ],
  docLabel: "AR-RECON-90357 · GL ↔ sub-ledger",
  document: <LedgerDoc />,
  sources: [
    { id: "inv-handoff", label: "INV-90357", meta: "from Billing · open item", kind: "sap", handoff: true, body: <CustomerInvoiceDoc /> },
    { id: "collect-note", label: "Last customer reply", meta: "BlueRidge AP · 05-22", kind: "email", body: collectCustomerNote },
    { id: "collect-policy", label: "Collections policy", meta: "POL-AR-02", kind: "policy", body: <SpendingPolicyDoc /> },
  ],
  recommendation:
    "GL ties to the sub-ledger; $208,400 is 47 days past the Net-45 due date and earlier reminders went unanswered. Recommend a Tier 4 final notice and arm a credit hold before any new orders ship.",
  stages: [
    {
      sourceId: "inv-handoff",
      reasoning: "Tying the GL control account to the AR sub-ledger",
      title: "Customer & control account",
      fields: [
        { label: "Customer", value: "BlueRidge · 0000610248" },
        { label: "GL account", value: "120000 · Trade receivables" },
        { label: "GL balance (control)", value: "USD 412,880.00" },
        { label: "AR sub-ledger total", value: "USD 412,880.00" },
      ],
    },
    {
      sourceId: "collect-note",
      reasoning: "Flagging the overdue open item against the Net-45 due date",
      title: "Overdue open item",
      fields: [
        { label: "Invoice", value: "INV-90357" },
        { label: "Due date", value: "2026-05-18" },
        { label: "Past due", value: "47 days" },
        { label: "Amount", value: "USD 208,400.00" },
      ],
    },
    {
      sourceId: "collect-policy",
      reasoning: "Aging the account into the overdue buckets",
      title: "Aging",
      fields: [
        { label: "Current", value: "USD 96,000.00" },
        { label: "1–30 days", value: "USD 108,480.00" },
        { label: "31–60 days · overdue", value: "USD 208,400.00" },
        { label: "60+ days", value: "USD 0.00" },
      ],
    },
  ],
};

/* ── Step 5 · Payment & Collections — dunning + cash application ──────────── */
const collectPaymentStep: RunStep = {
  id: "invoice",
  agentName: "Payment & Collections Agent",
  n: 5,
  title: "Dun & apply the cash",
  sub: "Final notice · follow-up · post the receipt",
  reasoning: [
    "Mapping 47 days past due onto the contract escalation ladder",
    "Tiers 1–3 auto-sent at 7, 21 and 35 days — no payment, no date",
    "Recommending Tier 4 · Final notice — credit-hold warning per CTR-BRF-2024",
    "On payment, applying the cash receipt against open item INV-90357",
    "Posting Dr Bank / Cr Trade receivables and clearing the GL and sub-ledger",
  ],
  docLabel: "Collections · dunning & cash application",
  document: <PaymentCollectionsWorkspace />,
  sources: [
    { id: "pay-inv", label: "INV-90357", meta: "customer invoice · open", kind: "sap", handoff: true, body: <CustomerInvoiceDoc /> },
    { id: "pay-recon", label: "AR-RECON-90357", meta: "from reconcile · GL/sub-ledger", kind: "sap", handoff: true, body: <LedgerDoc /> },
    { id: "pay-note", label: "Last customer reply", meta: "BlueRidge AP · 05-22", kind: "email", body: collectCustomerNote },
    { id: "pay-policy", label: "Collections policy", meta: "POL-AR-02", kind: "policy", body: <SpendingPolicyDoc /> },
  ],
  recommendation:
    "Tiers 1–3 went unanswered. Send the Tier 4 final notice, set a follow-up, and post the cash receipt when BlueRidge pays — clearing INV-90357 on the GL and the AR sub-ledger and lifting the credit hold.",
};

/* ════════════════════════════════════════════════════════════════════════
 * Registry
 * ════════════════════════════════════════════════════════════════════════ */

export const flowRuns: Record<FlowId, FlowRun> = {
  belt: {
    id: "belt",
    contextTitle: "Riverside mill · inbound OCC live load · lane CHI→RIV",
    contextSub: "Carrier freight invoice INV-SUM-5567 arrived at 9:01 AM · the three-way check found 5 discrepancies — mis-class, surcharge, demurrage, cube-out weight and a re-bill",
    reviewPill: "Settlement run · in review",
    completeNote: "Run complete · clean lines settled to AP, carrier dispute sent, audit envelope closed",
    steps: beltSteps,
    terminal: () => ({ label: "Settled · dispute sent", kind: "ready" }),
    completion: {
      title: "INV-SUM-5567 · settled and dispute sent",
      tone: "ready",
      routedTo: "Approval & Exception Router",
      routedSub: "audit close",
      stats: [
        { value: "5", label: "lines flagged" },
        { value: "$13,144", label: "settled to AP" },
        { value: "$2,646", label: "recovered via dispute" },
      ],
      caption:
        "In-tolerance portion posted to AP on net 30 ($13,144) · $2,646 disputed across 5 lines — a Class-55 mis-class, the surcharge basis, un-owed demurrage, a cube-out weight adjustment and a $310 re-bill already settled on INV-SUM-5560 · carrier credit acknowledged · audit envelope closed.",
    },
  },
  settle: {
    id: "settle",
    contextTitle: "Ironwood Freight Lines · carrier settlement invoice INV-IRN-2206 · lane CHI→RIV",
    contextSub: "20 lines settled · 16 auto-cleared touchless · 4 exceptions triaged to 4 teams",
    reviewPill: "Settlement automation · in review",
    completeNote: "Run complete · 16 lines posted touchless, 4 exceptions routed, audit envelope sealed",
    steps: settleSteps,
    terminal: () => ({ label: "Posted · exceptions routed", kind: "ready" }),
    completion: {
      title: "INV-IRN-2206 · settled and routed",
      tone: "ready",
      routedTo: "Approval & Exception Router",
      routedSub: "audit close",
      stats: [
        { value: "16", label: "posted touchless" },
        { value: "80%", label: "touchless settlement" },
        { value: "$4.1K", label: "routed to 4 teams" },
      ],
      caption:
        "16 in-tolerance lines posted to AP touchless ($30.7K) · 4 exception lines bucketed and routed to Procurement, Finance master-data, Buyer-AP and the Freight desk with tracked SLAs · audit envelope sealed.",
    },
  },
  pump: {
    id: "pump",
    contextTitle: "Recycling · Sorting Line 2 · conveyor belt PR",
    contextSub: "Free-text request · intake structured and validated it · one open spec item",
    reviewPill: "PR validation · in review",
    completeNote: "PR released · structured, coded and validated on-contract",
    steps: beltPrSteps,
    terminal: () => ({ label: "PR released · on-contract", kind: "ready" }),
    completion: {
      title: "PR-48630 · structured, validated & released",
      tone: "ready",
      routedTo: "Buyer · plant maintenance",
      routedSub: "PR release",
      stats: [
        { value: "5", label: "checks passed" },
        { value: "$4,180", label: "on-contract" },
        { value: "36 in", label: "spec confirmed" },
      ],
      caption:
        "Free-text request structured to MRO-CONV-BELT-36IN-HD · master data, warranty, vendor and approval validated · width confirmed with the engineer · released to Apex on-contract.",
    },
  },
  gearbox: {
    id: "gearbox",
    contextTitle: "Recycling · Sorting Line 1 · idler roller PR",
    contextSub: "Free-text request · intake found a duplicate, sister-plant stock and warranty cover",
    reviewPill: "PR validation · in review",
    completeNote: "Re-scoped · interplant transfer + warranty claim + 2-unit buy",
    steps: rollerPrSteps,
    terminal: () => ({ label: "Re-scoped · duplicate cancelled", kind: "ready" }),
    completion: {
      title: "PR-48655 · re-scoped and routed",
      tone: "ready",
      routedTo: "Buyer · plant maintenance",
      routedSub: "transfer + claim + buy",
      stats: [
        { value: "6 EA", label: "transferred in-plant" },
        { value: "$236", label: "residual buy only" },
        { value: "1", label: "duplicate PR cancelled" },
      ],
      caption:
        "8-unit buy re-scoped to a 6-unit interplant transfer + a warranty claim + a 2-unit on-contract buy · duplicate PR-48641 cancelled · avoided buying inventory the network already had.",
    },
  },
  collect: {
    id: "collect",
    contextTitle: "BlueRidge Foods · overdue receivable",
    contextSub: "INV-90357 · $208,400 · 47 days past Net-45 · collections review",
    reviewPill: "Collections review",
    completeNote: "Collected · cash applied and posted to the GL",
    steps: [
      collectOrderStep,
      collectDeliveryStep,
      collectInvoiceStep,
      collectReconStep,
      collectPaymentStep,
    ],
    terminal: (d) =>
      halted(d)
        ? { label: "Escalated · credit & legal", kind: "critical" }
        : { label: "Collected · posted", kind: "ready" },
    completion: {
      title: "INV-90357 · collected and posted",
      tone: "ready",
      routedTo: "Treasury & GL",
      routedSub: "cash applied",
      stats: [
        { value: "$208,400", label: "collected" },
        { value: "47 → 0", label: "days · cleared" },
        { value: "Tier 4", label: "notice that landed" },
      ],
      caption:
        "Final notice sent · payment received and applied · Dr Bank / Cr AR posted · INV-90357 cleared on the sub-ledger and the GL · credit hold lifted.",
    },
  },
};
