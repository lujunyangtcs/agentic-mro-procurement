/**
 * Per-flow run registry — three distinct procure-to-pay transactions, each a
 * gated agent run the buyer can open from the cockpit.
 *
 *  ① belt    — happy path · runs clean to Paid (PR → Sourcing → PO → Invoice).
 *  ② pump    — front-office exceptions · Intake → Sourcing → PO, blocked at PO.
 *  ③ gearbox — back-office exceptions · PO management → Invoices, payment blocked.
 *
 * The exception flows reuse the same RunStep shape and the same prop-driven SAP
 * documents as the belt run — only the data and the recommended decision change.
 * A non-approve decision halts the run; the terminal pill is flow-specific.
 */

import type { FlowId, Decision, View } from "@/state";
import { beltUpstreamSteps, beltDownstreamSteps, type RunStep, type ExceptionResolution } from "@/data/runSteps";

import { PurchaseRequisition, type SapPR } from "@/components/docs/sap/PurchaseRequisition";
import { RfqComparison, type RfqTender } from "@/components/docs/sap/RfqComparison";
import { PurchaseOrder, type SapPO } from "@/components/docs/sap/PurchaseOrder";
import { GoodsReceipt, type SapGR } from "@/components/docs/sap/GoodsReceipt";
import { InvoiceMatch, type SapInvoice } from "@/components/docs/sap/InvoiceMatch";
import { EmailDoc, SpendingPolicyDoc, VendorRecordDoc, ExternalMatchDoc, DeliveryNoteDoc } from "@/components/docs/sources";
import { LedgerDoc } from "@/components/docs/finance/LedgerDoc";
import { SalesOrderDoc } from "@/components/docs/o2c/SalesOrderDoc";
import { DeliveryDoc } from "@/components/docs/o2c/DeliveryDoc";
import { CustomerInvoiceDoc } from "@/components/docs/o2c/CustomerInvoiceDoc";
import { PaymentCollectionsWorkspace } from "@/components/workspace/PaymentCollectionsWorkspace";
import { ExceptionResolutionCard } from "@/components/workspace/ExceptionResolutionCard";

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
    /**
     * Where "back to cockpit" lands when this run closes. Upstream returns to
     * the cockpit; the downstream AP run lands on the feedback-loop console.
     * Defaults to the cockpit when omitted.
     */
    nextView?: View;
    /** Label for the close-ceremony's primary button (defaults to "Back to cockpit"). */
    nextLabel?: string;
    /**
     * When present, the happy-path close shows the payment-scheduled success
     * card (animated) instead of the generic flow-complete modal — the F110
     * schedule the Invoice agent just booked.
     */
    paymentSchedule?: {
      vendor: string;
      amount: string;
      terms: string;
      method: string;
      reference: string;
      /** Three points on the pay timeline — posted → due → run. */
      timeline: { label: string; date: string; done: boolean }[];
    };
  };
};

const halted = (d: Record<number, Decision>) =>
  Object.values(d).some((s) => s === "escalated" || s === "rejected");

/* ════════════════════════════════════════════════════════════════════════
 * ② PUMP — front-office exceptions (Intake · Sourcing · PO)
 * Boiler feed pump · Power House · Cascade Fluid Systems · off-contract · $96.4k
 * ════════════════════════════════════════════════════════════════════════ */

const prPump: SapPR = {
  number: "PR-48630",
  docType: "NB · Standard purchase requisition",
  status: "Drafted · routed to buyer",
  releaseStrategy: "MRO2 — held · off-contract and above the $50k MRO ceiling",
  createdBy: "Intake Agent",
  createdOn: "2026-06-03 · 10:46",
  purchasingOrg: "NG01 · Northgate North America",
  purchasingGroup: "P14 · Rotating equipment",
  headerNote:
    "Boiler feed pump on Power House Unit 1 failed inspection — replacement needed inside the week. No active framework agreement covers rotating-equipment pumps, and the value sits above the maintenance-spend ceiling, so the requisition is drafted and routed for buyer approval.",
  item: {
    line: "10",
    material: "PMP-440BF",
    shortText: "Boiler feed pump — Power House Unit 1",
    materialGroup: "MRO-ROT · Rotating equipment",
    quantity: "1",
    unit: "EA",
    deliveryDate: "2026-06-11",
    plant: "P051 · Power House",
    storageLocation: "MNT2 · Powerhouse store",
    valuationPrice: "96,400.00",
    currency: "USD",
    totalValue: "96,400.00",
    requisitioner: "T. Okafor · Powerhouse reliability",
    trackingNumber: "MNT-2318",
  },
  source: {
    fixedVendor: "Cascade Fluid Systems · 200914 (off-contract)",
    agreement: "— · no framework agreement",
    agreementItem: "—",
    infoRecord: "—",
  },
  acct: {
    category: "K · Cost center",
    glAccount: "510000",
    glAccountText: "Repairs & maintenance — MRO",
    costCenter: "0000051180",
    costCenterText: "Power House — Unit 1",
    order: "800051144 · PM maintenance order",
    wbs: "—",
    recipient: "T. Okafor",
    unloadingPoint: "Power House dock",
    percentage: "100 %",
  },
};

const rfqPump: RfqTender = {
  collectiveNumber: "RFQ-6600-2390",
  status: "Evaluated · single compliant bid",
  createdOn: "2026-06-03 · 13:20",
  createdBy: "Tactical Sourcing Agent",
  material: "PMP-440BF",
  shortText: "Boiler feed pump — Power House Unit 1",
  quantity: "1 EA",
  plant: "P051 · Power House",
  reference: "Cascade Fluid Systems (only compliant quotation)",
  bids: [
    {
      rfqNumber: "6500042210",
      supplier: "Cascade Fluid Systems",
      vendorCode: "200914",
      onContract: false,
      grossPrice: 96400,
      freight: 1200,
      tax: 0,
      leadDays: 8,
      paymentTerms: "Net 30",
      qualityScore: "B · new supplier",
      rank: 1,
      recommended: true,
    },
  ],
};

const poPump: SapPO = {
  number: "PO-77688",
  docType: "NB · Standard PO",
  status: "Blocked · not released",
  createdOn: "2026-06-03 · 14:02",
  createdBy: "Purchase Order Agent",
  vendor: "200914",
  vendorName: "Cascade Fluid Systems",
  purchasingOrg: "NG01 · Northgate North America",
  purchasingGroup: "P14 · Rotating equipment",
  companyCode: "1000 · Northgate Paper Co.",
  paymentTerms: "NT30 · Net 30 days",
  incoterms: "FCA · Cascade Houston DC",
  currency: "USD",
  agreement: "— · no framework agreement",
  item: {
    line: "10",
    material: "PMP-440BF",
    shortText: "Boiler feed pump — Power House Unit 1",
    materialGroup: "MRO-ROT · Rotating equipment",
    quantity: "1",
    unit: "EA",
    netPrice: "97,600.00",
    per: "1 EA",
    plant: "P051 · Power House",
    storageLocation: "MNT2 · Powerhouse store",
    deliveryDate: "2026-06-11",
    glAccount: "510000 · Repairs & maintenance",
    costCenter: "0000051180 · Power House Unit 1",
    taxCode: "U1 · Self-assessed use tax",
  },
  conditions: [
    { label: "PB00 · Gross price (quoted)", rate: "96,400.00 / 1 EA", value: "96,400.00", sign: "+" },
    { label: "FRB1 · Freight", rate: "1,200.00", value: "1,200.00", sign: "+" },
    { label: "Benchmark · last comparable buy", rate: "78,500.00", value: "78,500.00" },
    { label: "Net value (PO item)", rate: "", value: "97,600.00", sign: "=" },
  ],
  netValue: "97,600.00",
  schedule: {
    type: "Requested delivery",
    date: "2026-06-11",
    quantity: "1 EA",
    note: "Held — 24% over the last comparable buy, no framework, above the touchless limit.",
  },
};

const pumpNote = (
  <EmailDoc
    from="T. Okafor"
    fromAddr="tokafor@northgatepaper.com"
    to="Procurement Intake"
    sent="2026-06-03 · 10:32"
    subject="Boiler feed pump failed inspection — Power House Unit 1"
    lines={[
      "The boiler feed pump on Power House Unit 1 failed its vibration inspection this morning. Reliability wants it replaced inside the week before we lose the unit.",
      "I don't think we have a contract for these pumps — Cascade Fluid Systems quoted us last year. Please raise the requisition; charge it to Power House Unit 1, cost center 51180.",
    ]}
  />
);

const pumpDecline = (
  <EmailDoc
    from="Tactical Sourcing Agent"
    fromAddr="sourcing@northgatepaper.com"
    to="Buyer · Rotating equipment"
    sent="2026-06-03 · 13:18"
    subject="RFQ-6600-2390 — two suppliers declined to quote"
    tone="inbound"
    lines={[
      "Invited three suppliers for the boiler feed pump. Two declined: Hydratech (capacity, no quote) and Gulf Rotating (lead time beyond the window).",
      "Only Cascade Fluid Systems returned a compliant quote — $96,400 + freight, 8-day lead. That leaves a single-source tender below the three-bid threshold.",
    ]}
  />
);

const pumpIntakeStep: RunStep = {
  id: "intake",
  n: 1,
  title: "Intake — off-contract flag",
  sub: "Drafts the PR and flags the policy breach",
  reasoning: [
    "Reading the maintenance note from Power House reliability",
    "Classifying — MRO · Rotating equipment · pump PMP-440BF",
    "Searching frameworks — no agreement covers rotating-equipment pumps",
    "Checking policy — $96,400 is above the $50k MRO ceiling",
    "Drafting PR-48630 and routing to the buyer",
  ],
  docLabel: "PR-48630 · Purchase requisition",
  document: <PurchaseRequisition pr={prPump} />,
  sources: [
    { id: "pump-note", label: "Maintenance note", meta: "Outlook · 10:32", kind: "email", body: pumpNote },
    { id: "pump-policy", label: "Spending policy", meta: "POL-MRO-04", kind: "policy", body: <SpendingPolicyDoc /> },
  ],
  recommendation:
    "Off-contract and above the $50k MRO ceiling — drafted and routed to you, not auto-submitted. Approve to send it to sourcing.",
  stages: [
    {
      sourceId: "pump-note",
      reasoning: "Reading the maintenance note from Power House reliability",
      title: "Item — what's needed",
      fields: [
        { label: "Material", value: "PMP-440BF" },
        { label: "Short text", value: "Boiler feed pump — Power House Unit 1" },
        { label: "Quantity", value: "1 EA" },
        { label: "Delivery date", value: "2026-06-11" },
        { label: "Plant", value: "P051 · Power House" },
        { label: "Requisitioner", value: "T. Okafor · Powerhouse reliability" },
      ],
    },
    {
      sourceId: "pump-policy",
      reasoning: "Checking policy — $96,400 is above the $50k MRO ceiling, off-contract",
      title: "Policy flag",
      fields: [
        { label: "Release strategy", value: "MRO2 — held · off-contract, above the ceiling" },
        { label: "Valuation", value: "96,400.00 USD" },
        { label: "Framework", value: "— · no agreement" },
        { label: "Cost center", value: "0000051180 · Power House Unit 1" },
      ],
    },
  ],
};

const pumpSourcingStep: RunStep = {
  id: "sourcing",
  n: 2,
  title: "Sourcing — single-bid tender",
  sub: "Only one compliant quote returned",
  reasoning: [
    "Reading PR-48630 and building a three-supplier shortlist",
    "Sending RFQ-6600-2390 to Cascade, Hydratech and Gulf Rotating",
    "Hydratech declined (capacity) · Gulf Rotating declined (lead time)",
    "Only Cascade returned a compliant quote — below the three-bid rule",
    "Compiling a single-source justification for the buyer",
  ],
  docLabel: "RFQ-6600-2390 · Price comparison",
  document: <RfqComparison tender={rfqPump} />,
  sources: [
    { id: "pr-pump-handoff", label: "PR-48630", meta: "from Intake · SAP ME53N", kind: "sap", handoff: true, body: <PurchaseRequisition pr={prPump} /> },
    { id: "pump-decline", label: "Bid summary", meta: "Sourcing · 13:18", kind: "email", body: pumpDecline },
  ],
  recommendation:
    "Only one compliant bid returned — below the three-bid threshold. Approve the single-source justification to proceed, or escalate to the category manager.",
  stages: [
    {
      sourceId: "pr-pump-handoff",
      reasoning: "Reading PR-48630 and building the supplier shortlist",
      title: "Tender",
      fields: [
        { label: "RFQ", value: "RFQ-6600-2390" },
        { label: "Material", value: "PMP-440BF · boiler feed pump" },
        { label: "Quantity", value: "1 EA" },
        { label: "Plant", value: "P051 · Power House" },
      ],
    },
    {
      sourceId: "pump-decline",
      reasoning: "Two suppliers declined — only Cascade returned a compliant quote",
      title: "Bids returned",
      fields: [
        { label: "Invited", value: "Cascade · Hydratech · Gulf Rotating" },
        { label: "Declines", value: "Hydratech (capacity) · Gulf Rotating (lead time)" },
        { label: "Compliant", value: "Cascade only — single source" },
        { label: "Quote", value: "$96,400 + $1,200 freight · 8-day lead" },
      ],
    },
  ],
};

const pumpPoStep: RunStep = {
  id: "po",
  n: 3,
  title: "Purchase order — blocked",
  sub: "Price variance and no contract — held before release",
  reasoning: [
    "Reading the single-source award for Cascade Fluid Systems",
    "No framework to bind — pricing has no contract reference",
    "Comparing the $97,600 landed cost to the $78,500 benchmark — 24% over",
    "Value above the touchless limit, supplier off-contract",
    "Blocking PO-77688 before release — routing to the buyer",
  ],
  docLabel: "PO-77688 · Purchase order",
  document: <PurchaseOrder po={poPump} />,
  sources: [
    { id: "rfq-pump-handoff", label: "RFQ-6600-2390", meta: "from Sourcing · award", kind: "sap", handoff: true, body: <RfqComparison tender={rfqPump} /> },
    { id: "pump-policy-po", label: "Spending policy", meta: "POL-MRO-04", kind: "policy", body: <SpendingPolicyDoc /> },
  ],
  recommendation:
    "24% over the last comparable buy, no framework and above the touchless limit. Recommend escalate to the category manager before any order is placed.",
  stages: [
    {
      sourceId: "rfq-pump-handoff",
      reasoning: "Reading the single-source award for Cascade Fluid Systems",
      title: "Header & terms",
      fields: [
        { label: "Vendor", value: "Cascade Fluid Systems · 200914" },
        { label: "Payment terms", value: "NT30 · Net 30 days" },
        { label: "Incoterms", value: "FCA · Cascade Houston DC" },
        { label: "Agreement", value: "— · no framework" },
      ],
    },
    {
      sourceId: "pump-policy-po",
      reasoning: "24% over benchmark, no framework, above the limit — blocking PO-77688",
      title: "Price & block",
      fields: [
        { label: "Gross price", value: "$96,400.00" },
        { label: "Freight", value: "$1,200.00" },
        { label: "Net value", value: "$97,600.00" },
        { label: "Benchmark", value: "$78,500 last buy · 24% over" },
        { label: "Status", value: "Blocked · not released" },
      ],
    },
  ],
  exception: {
    title: "Order held · do-not-execute envelope",
    gates: [
      { name: "Three-bid rule", state: "tripped", result: "Only Cascade returned a compliant quote — Hydratech and Gulf Rotating declined, below the three-bid threshold." },
      { name: "Price variance", state: "tripped", result: "$97,600 landed is 24% over the $78,500 last comparable buy." },
      { name: "Framework coverage", state: "tripped", result: "No framework agreement covers rotating-equipment pumps — pricing has no contract reference." },
      { name: "Approval limit", state: "tripped", result: "$96,400 is above the $50k MRO touchless ceiling — cannot auto-issue." },
      { name: "Budget", state: "clear", result: "PM maintenance order 800051144 has headroom on cost center 51180." },
    ],
    evidence: [
      { label: "RFQ-6600-2390", detail: "single-source justification · two suppliers declined to quote" },
      { label: "PO-77688", detail: "drafted and blocked before release · net $97,600" },
      { label: "Benchmark", detail: "last comparable buy $78,500 · 24% delta" },
    ],
    handoff: {
      to: "Category Manager · Rotating equipment",
      sla: "decision due in 4 business hours",
      nextStep: "negotiate a framework or approve the single-source buy on record before any order is placed.",
    },
    audit: {
      id: "EXC-48630-PO",
      logged: "2026-06-03 · 14:05",
      note: "off-contract escalation · nothing ordered · full evidence bundle attached.",
    },
    draft: {
      to: "Category Manager · Rotating equipment",
      subject: "Approval needed — boiler feed pump PR-48630 · single-source, 24% over benchmark",
      lines: [
        "Escalating the Power House Unit 1 boiler feed pump for your decision. Only Cascade Fluid Systems returned a compliant quote — Hydratech and Gulf Rotating declined — so this is a single-source award below the three-bid threshold.",
        "At $97,600 landed it is 24% over the $78,500 last comparable buy, and no framework agreement covers rotating-equipment pumps. PO-77688 is drafted and held — nothing is ordered until you approve the single-source buy or direct us to renegotiate.",
        "Evidence bundle attached: RFQ-6600-2390, the two declines, and the benchmark. Audit ref EXC-48630-PO.",
      ],
      sendLabel: "Send the escalation",
      sentLabel: "Sent · logged to the case",
    },
  },
};

/* ════════════════════════════════════════════════════════════════════════
 * ③ GEARBOX — back-office exceptions (PO management · Invoices)
 * Drive gearbox · Containerboard · Apex Drive Systems · PO-77642 · $72k · 2 EA
 * ════════════════════════════════════════════════════════════════════════ */

const poGearbox: SapPO = {
  number: "PO-77642",
  docType: "NB · Standard PO",
  status: "Released · in delivery",
  createdOn: "2026-06-01 · 15:40",
  createdBy: "Purchase Order Agent",
  vendor: "201185",
  vendorName: "Apex Drive Systems",
  purchasingOrg: "NG01 · Northgate North America",
  purchasingGroup: "P13 · Power transmission",
  companyCode: "1000 · Northgate Paper Co.",
  paymentTerms: "NT30 · Net 30 days",
  incoterms: "FCA · Apex Houston DC",
  currency: "USD",
  agreement: "4600001318 · item 20 · Drives framework",
  item: {
    line: "10",
    material: "GBX-220K",
    shortText: "Drive gearbox — Containerboard line",
    materialGroup: "MRO-PTX · Power transmission",
    quantity: "2",
    unit: "EA",
    netPrice: "36,000.00",
    per: "1 EA",
    plant: "M042 · Containerboard mill",
    storageLocation: "MNT1 · Maintenance store",
    deliveryDate: "2026-06-09",
    glAccount: "510000 · Repairs & maintenance",
    costCenter: "0000041702 · Corrugating No.2",
    taxCode: "U1 · Self-assessed use tax",
  },
  conditions: [
    { label: "PB00 · Gross price", rate: "36,000.00 / 1 EA", value: "72,000.00", sign: "+" },
    { label: "FRB1 · Freight (delivered)", rate: "0.00", value: "0.00", sign: "+" },
    { label: "Net value (PO item)", rate: "", value: "72,000.00", sign: "=" },
  ],
  netValue: "72,000.00",
  schedule: {
    type: "Confirmed delivery",
    date: "2026-06-09",
    quantity: "2 EA",
    note: "Two units against the drives framework · ahead of the planned shutdown.",
  },
};

const grGearbox: SapGR = {
  number: "GR-77642 · 5000032914",
  status: "Partial · quality hold",
  createdOn: "2026-06-09 · 08:15",
  createdBy: "PO Management Agent",
  movementType: "101 · GR goods receipt for PO",
  postingDate: "2026-06-09",
  documentDate: "2026-06-09",
  deliveryNote: "ADS-DN-2207",
  billOfLading: "HOUSTON-8841-2026",
  poReference: "PO-77642 · item 10",
  item: {
    line: "1",
    material: "GBX-220K",
    shortText: "Drive gearbox — Containerboard line (2 ordered)",
    quantity: "1",
    unit: "EA",
    plant: "M042 · Containerboard mill",
    storageLocation: "MNT1 · Maintenance store",
    stockType: "Quality inspection",
    okIndicator: "1 of 2 received · unit 2 damaged in transit · quality hold",
  },
};

const invGearbox: SapInvoice = {
  number: "INV-ADS-4419",
  status: "Blocked · payment hold",
  createdOn: "2026-06-10 · 09:30",
  createdBy: "Invoice Resolution Agent",
  vendorReference: "ADS-4419",
  vendor: "201185 · Apex Drive Systems",
  invoiceDate: "2026-06-10",
  postingDate: "—",
  baselineDate: "—",
  dueDate: "2026-07-10",
  paymentTerms: "NT30 · Net 30 days",
  taxCode: "U1 · Self-assessed use tax",
  grossAmount: "72,000.00",
  taxAmount: "0.00",
  currency: "USD",
  balance: "36,000.00",
  fraudScore: "0.86 · high — bank detail change",
  poReference: "PO-77642 · item 10",
  grReference: "GR-77642 · partial (1 of 2)",
  match: [
    { dimension: "Unit price (USD)", contract: "36,000.00", po: "36,000.00", goodsReceipt: "—", invoice: "36,000.00", ok: true },
    { dimension: "Quantity (EA)", contract: "2", po: "2", goodsReceipt: "1", invoice: "2", ok: false },
    { dimension: "Net value (USD)", contract: "72,000.00", po: "72,000.00", goodsReceipt: "36,000.00", invoice: "72,000.00", ok: false },
    { dimension: "Bank account", contract: "IBAN ·· 4471 (on file)", po: "—", goodsReceipt: "—", invoice: "IBAN ·· 9920 (new)", ok: false },
    { dimension: "Payment terms", contract: "Net 30", po: "Net 30", goodsReceipt: "—", invoice: "Net 30", ok: true },
  ],
};

const gearboxCarrier = (
  <EmailDoc
    from="Apex Drive Systems"
    fromAddr="dispatch@apexdrives.com"
    to="PO Management"
    sent="2026-06-09 · 07:50"
    subject="PO-77642 — one of two gearboxes damaged in transit"
    tone="inbound"
    lines={[
      "Both gearboxes shipped on PRO 8841. The carrier reports unit 2 was dropped in transit — the housing is cracked. Unit 1 arrived sound.",
      "We can ship a replacement for unit 2 in 6 working days. Please receive unit 1 and raise a discrepancy for unit 2.",
    ]}
  />
);

const gearboxBankChange = (
  <EmailDoc
    from="Apex Drive Systems · Accounts"
    fromAddr="ar@apex-drives-billing.com"
    to="Accounts Payable"
    sent="2026-06-10 · 09:12"
    subject="Updated remittance details — please pay invoice ADS-4419 to new account"
    tone="inbound"
    lines={[
      "Please note our banking has changed. Kindly remit invoice ADS-4419 ($72,000) to our new account IBAN ·· 9920 with immediate effect.",
      "Disregard the account on file. A confirmation letter is attached; treat this as urgent so we don't fall past terms.",
    ]}
  />
);

const gearboxFulfillmentStep: RunStep = {
  id: "po",
  n: 1,
  title: "PO management — short delivery",
  sub: "Expediting PO-77642 · one of two units damaged — quality hold",
  reasoning: [
    "Monitoring PO-77642 against the contracted date 2026-06-09",
    "Receiving the carrier notice — unit 2 damaged in transit",
    "Confirming on the dock — unit 1 sound, unit 2 housing cracked",
    "Plant posts a partial goods receipt for 1 of 2 — quality hold on unit 2",
    "Raising a delivery discrepancy and prompting the buyer",
  ],
  docLabel: "GR-77642 · Goods receipt (partial)",
  document: <GoodsReceipt gr={grGearbox} />,
  sources: [
    { id: "po-gbx-handoff", label: "PO-77642", meta: "from PO agent · SAP ME23N", kind: "sap", handoff: true, body: <PurchaseOrder po={poGearbox} /> },
    { id: "gbx-carrier", label: "Carrier notice", meta: "Apex · 07:50", kind: "email", body: gearboxCarrier },
  ],
  recommendation:
    "1 of 2 received, unit 2 damaged in transit. Approve the partial receipt to proceed on the good unit, or hold for the full delivery.",
  stages: [
    {
      sourceId: "po-gbx-handoff",
      reasoning: "Tracking PO-77642 against the contracted date 2026-06-09",
      title: "Receipt header",
      fields: [
        { label: "Movement type", value: "101 · GR goods receipt for PO" },
        { label: "PO reference", value: "PO-77642 · item 10" },
        { label: "Delivery note", value: "ADS-DN-2207" },
        { label: "Posting date", value: "2026-06-09" },
      ],
    },
    {
      sourceId: "gbx-carrier",
      reasoning: "Carrier notice — unit 2 damaged; posting a partial receipt (1 of 2)",
      title: "Where — partial receipt",
      fields: [
        { label: "Material", value: "GBX-220K · 2 ordered" },
        { label: "Received", value: "1 of 2 EA" },
        { label: "Stock type", value: "Quality inspection" },
        { label: "OK indicator", value: "Unit 2 damaged in transit · quality hold" },
      ],
    },
  ],
  dossier: {
    swimlane: "Procurement Operations",
    rows: [
      { lane: "Key process steps", points: ["Goods receipt", "Service-entry approval"] },
      { lane: "AI intervention points", points: ["Predictive GRN creation (services)", "IoT / digital-proof validation", "NLP on emails / documents to confirm completion"] },
      { lane: "Value delivered", points: ["20–40% fewer missing-GRN issues"] },
      { lane: "Key controls", points: ["System-enforced — no invoice without GRN", "AI flags delays / inconsistencies"] },
      { lane: "Systems / tools", points: ["SAP S/4HANA", "Coupa", "Oracle Cloud", "IoT platforms"] },
    ],
  },
};

/* The Orchestrator's routing of the two exceptions to the agents that own them. */
const gearboxRoutingPanel = (
  <div className="rounded-md border border-divider bg-surface-fog/40 px-4 py-3">
    <div className="text-[11px] uppercase tracking-[0.08em] text-surface-deep font-bold">
      Orchestrator · routed to the agents that own it
    </div>
    <div className="grid grid-cols-3 gap-2 mt-2">
      <div className="rounded border border-divider bg-white px-2.5 py-2">
        <div className="text-[10px] uppercase tracking-[0.04em] text-mute font-bold">Bank change</div>
        <div className="text-[12px] font-bold text-ink mt-0.5 leading-snug">MDM Support Agent</div>
        <div className="text-[10px] text-mute mt-0.5 leading-snug">reject ·· 9920 · keep ·· 4471 · report</div>
      </div>
      <div className="rounded border border-divider bg-white px-2.5 py-2">
        <div className="text-[10px] uppercase tracking-[0.04em] text-mute font-bold">Short receipt</div>
        <div className="text-[12px] font-bold text-ink mt-0.5 leading-snug">Invoice Resolution Agent</div>
        <div className="text-[10px] text-mute mt-0.5 leading-snug">short-pay 1 of 2 · park the rest</div>
      </div>
      <div className="rounded border border-divider bg-white px-2.5 py-2">
        <div className="text-[10px] uppercase tracking-[0.04em] text-mute font-bold">Replacement</div>
        <div className="text-[12px] font-bold text-ink mt-0.5 leading-snug">PO Management Agent</div>
        <div className="text-[10px] text-mute mt-0.5 leading-snug">claim · expedite · re-receive</div>
      </div>
    </div>
    <p className="text-[11.5px] text-ink leading-snug mt-2.5">
      The exception is detected here, then resolved by the agents already in the workforce — you approve every hand-off.
    </p>
  </div>
);

const gearboxInvoiceStep: RunStep = {
  id: "invoice",
  n: 2,
  title: "Invoice — exceptions detected & routed",
  sub: "Two exceptions on one invoice — the Orchestrator routes the fix",
  reasoning: [
    "Extracting invoice ADS-4419 — $72,000 for 2 units",
    "Running the four-way match against PO-77642 and the partial goods receipt",
    "Quantity mismatch — invoiced 2, received 1 (unit 2 damaged)",
    "Bank account changed — IBAN ·· 9920 does not match vendor master 201185",
    "Holding payment · routing each exception to the agent that owns it",
  ],
  docLabel: "INV-ADS-4419 · Four-way match",
  document: (
    <div className="space-y-4">
      <InvoiceMatch invoice={invGearbox} />
      {gearboxRoutingPanel}
    </div>
  ),
  sources: [
    { id: "gbx-bank", label: "Bank-change email", meta: "Apex AR · 09:12", kind: "email", body: gearboxBankChange },
    { id: "gr-gbx-handoff", label: "GR-77642", meta: "from PO management · MIGO", kind: "sap", handoff: true, body: <GoodsReceipt gr={grGearbox} /> },
  ],
  recommendation:
    "Two exceptions on one invoice: a short receipt (1 of 2 received, unit 2 damaged) and a bank-detail change to an unverified account (IBAN ·· 9920, fraud 0.86). Nothing pays yet. The Orchestrator routes the bank change to MDM Support, the short-pay to Invoice Resolution and the replacement to PO Management. Approve to work the resolution.",
  stages: [
    {
      sourceId: "gbx-bank",
      reasoning: "Bank account changed — IBAN ·· 9920 does not match vendor master 201185",
      title: "Bank-change flag",
      fields: [
        { label: "Invoice", value: "ADS-4419 · $72,000" },
        { label: "Account of record", value: "IBAN ·· 4471" },
        { label: "Requested", value: "IBAN ·· 9920 (new)" },
        { label: "Verification", value: "Unverified · beneficiary differs" },
      ],
    },
    {
      sourceId: "gr-gbx-handoff",
      reasoning: "Quantity mismatch + bank change → fraud 0.86, payment held",
      title: "Four-way match",
      fields: [
        { label: "Quantity", value: "invoiced 2 · received 1" },
        { label: "Net value", value: "invoiced $72,000 · received $36,000" },
        { label: "Fraud score", value: "0.86 · high" },
        { label: "Decision", value: "Hold payment — route to resolution" },
      ],
    },
  ],
  dossier: {
    swimlane: "Accounts Payable",
    rows: [
      { lane: "Key process steps", points: ["Match invoice vs PO vs GRN", "Exception identification"] },
      { lane: "AI intervention points", points: ["AI matching engine (fuzzy price / qty tolerance)", "ML learns from past exceptions", "Semantic matching for unstructured data"] },
      { lane: "Value delivered", points: ["25–40% fewer exceptions · higher first-pass match"] },
      { lane: "Key controls", points: ["Tolerance thresholds with AI recommendations", "Exception clustering & pattern detection"] },
      { lane: "Systems / tools", points: ["SAP S/4HANA", "Oracle Cloud AP", "BlackLine Match", "Tradeshift"] },
    ],
  },
};

/* ── Step 3 · Bank verification & fraud control (MDM Support Agent) ──────── */

const bankFraudEnvelope: ExceptionResolution = {
  title: "Bank-change rejected · pay only the account of record",
  gates: [
    { name: "Callback verification", state: "tripped", result: "Callback to the AR contact on vendor master 201185 went unanswered — Apex's known line has no record of a bank-change request." },
    { name: "Signed bank letter", state: "tripped", result: "No signed bank-change letter on company letterhead — the request arrived only by email." },
    { name: "Sender domain", state: "tripped", result: "ar@apex-drives-billing.com is a look-alike domain, not Apex's verified apexdrives.com — classic redirection-fraud pattern (fraud score 0.86)." },
    { name: "Beneficiary name", state: "tripped", result: "The beneficiary on IBAN ·· 9920 does not match the legal entity on record 201185." },
    { name: "Account of record", state: "clear", result: "Verified account IBAN ·· 4471 remains on file and unchanged — all payment routes here only." },
  ],
  evidence: [
    { label: "Bank-change email", detail: "ar@apex-drives-billing.com · look-alike domain · no signed letter" },
    { label: "Vendor master 201185", detail: "account of record IBAN ·· 4471 · verified · unchanged" },
    { label: "Identity check", detail: "D&B / OFAC — beneficiary name mismatch on the new account" },
  ],
  handoff: {
    to: "Fraud desk + the genuine Apex AR (known channel)",
    sla: "vendor record locked — no payment can route to ·· 9920",
    nextStep: "report the look-alike domain, lock ·· 9920 out, and tell the real Apex their billing identity is being spoofed.",
  },
  audit: {
    id: "EXC-ADS-4419-BANK",
    logged: "2026-06-10 · 09:40",
    note: "bank change rejected · account of record preserved · fraud reported · $0 exposure.",
  },
  draft: {
    to: "Apex Drive Systems · AR (verified ar@apexdrives.com)",
    subject: "We rejected a bank-change request that wasn't from you — please confirm",
    lines: [
      "We received a request to remit INV-ADS-4419 to a new account (IBAN ·· 9920) from ar@apex-drives-billing.com. It failed our verification — callback unanswered, no signed letter, beneficiary-name mismatch — so we have rejected it and locked the account.",
      "Your payment will go only to the account of record on file (IBAN ·· 4471), as always. Please confirm you did not request any change, and check whether your billing identity is being spoofed.",
      "We've reported the look-alike domain to our fraud desk. Audit ref EXC-ADS-4419-BANK.",
    ],
    sendLabel: "Send to the verified Apex AR",
    sentLabel: "Sent · fraud reported · ·· 9920 locked out",
  },
};

const gearboxBankVerifyStep: RunStep = {
  id: "vendor",
  n: 3,
  title: "Bank verification & fraud control",
  sub: "MDM rejects the bank change and locks the account of record",
  reasoning: [
    "Picking up the bank-change request routed from the Orchestrator",
    "Calling back the AR contact on vendor master 201185 — unanswered",
    "Checking for a signed bank-change letter — none on file",
    "Matching the beneficiary on IBAN ·· 9920 — does not match 201185",
    "Rejecting ·· 9920, locking the record to ·· 4471, reporting the domain",
  ],
  docLabel: "EXC-ADS-4419-BANK · bank-change rejected",
  document: <ExceptionResolutionCard ex={bankFraudEnvelope} />,
  sources: [
    { id: "gbx-bank-3", label: "Bank-change email", meta: "look-alike · 09:12", kind: "email", body: gearboxBankChange },
    { id: "gbx-vendor-rec", label: "Vendor 201185", meta: "golden · account ·· 4471", kind: "master", body: <VendorRecordDoc variant="golden" /> },
    { id: "gbx-identity", label: "Identity check", meta: "D&B / OFAC", kind: "external", body: <ExternalMatchDoc /> },
  ],
  recommendation:
    "Callback unanswered, no signed letter, look-alike domain, beneficiary-name mismatch — this is a redirection-fraud attempt, not a real bank change. Reject IBAN ·· 9920, keep the account of record ·· 4471, lock the vendor record and report the spoofed domain. Approve to lock it and notify the genuine Apex AR.",
  dossier: {
    swimlane: "Accounts Payable",
    rows: [
      { lane: "Key process steps", points: ["Route exceptions", "Buyer / vendor resolution"] },
      { lane: "AI intervention points", points: ["Predictive routing to the right owner", "GenAI copilot drafts emails / summarizes issues", "Root-cause analytics"] },
      { lane: "Value delivered", points: ["30–50% faster exception resolution"] },
      { lane: "Key controls", points: ["Escalation workflows", "AI flags recurring supplier issues", "Explainable AI logs"] },
      { lane: "Systems / tools", points: ["ServiceNow", "SAP Workflow", "UiPath", "MS Copilot"] },
    ],
  },
};

/* ── Step 4 · Short-pay the received unit (Invoice Resolution Agent) ─────── */

const invGearboxShortPay: SapInvoice = {
  number: "INV-ADS-4419 · short-pay 1 of 2",
  status: "Short-paid · 1 of 2 · balance parked",
  createdOn: "2026-06-10 · 10:05",
  createdBy: "Invoice Resolution Agent",
  vendorReference: "ADS-4419",
  vendor: "201185 · Apex Drive Systems",
  invoiceDate: "2026-06-10",
  postingDate: "2026-06-10",
  baselineDate: "2026-06-10",
  dueDate: "2026-07-10",
  paymentTerms: "NT30 · Net 30 days",
  termsSource: "Pay to the account of record IBAN ·· 4471 — never the emailed ·· 9920",
  cashDiscount: "None · pay on the net date",
  paymentRunDate: "2026-07-10",
  taxCode: "U1 · Self-assessed use tax",
  grossAmount: "36,000.00",
  taxAmount: "0.00",
  currency: "USD",
  balance: "0.00",
  fraudScore: "0.02 · low — paid to verified account ·· 4471",
  poReference: "PO-77642 · item 10",
  grReference: "GR-77642 · 1 of 2 received",
  match: [
    { dimension: "Unit price (USD)", contract: "36,000.00", po: "36,000.00", goodsReceipt: "—", invoice: "36,000.00", ok: true },
    { dimension: "Quantity paid (EA)", contract: "1", po: "1", goodsReceipt: "1", invoice: "1", ok: true },
    { dimension: "Net value paid (USD)", contract: "36,000.00", po: "36,000.00", goodsReceipt: "36,000.00", invoice: "36,000.00", ok: true },
    { dimension: "Bank account", contract: "IBAN ·· 4471 (on file)", po: "—", goodsReceipt: "—", invoice: "IBAN ·· 4471 (verified)", ok: true },
    { dimension: "Payment terms", contract: "Net 30", po: "Net 30", goodsReceipt: "—", invoice: "Net 30", ok: true },
  ],
  postingJournal: [
    { line: "1", glAccount: "191100", text: "GR/IR clearing — cleared against GR-77642 (1 of 2)", drcr: "Dr", amount: "36,000.00" },
    { line: "2", glAccount: "160000", text: "Accounts payable — Apex Drive Systems (201185)", drcr: "Cr", amount: "36,000.00" },
  ],
  paymentJournal: [
    { line: "1", glAccount: "160000", text: "Accounts payable — Apex (201185) · to verified IBAN ·· 4471", drcr: "Dr", amount: "36,000.00" },
    { line: "2", glAccount: "113100", text: "Bank — outgoing payments (account of record ·· 4471)", drcr: "Cr", amount: "36,000.00" },
  ],
};

const gearboxShortPayStep: RunStep = {
  id: "invoice",
  n: 4,
  title: "Short-pay the received unit",
  sub: "Pay the 1 received unit to the verified account, park the rest",
  reasoning: [
    "Bank locked to the verified account ·· 4471 — safe to pay",
    "Matching to receipt — 1 unit received, $36,000 cleared",
    "Posting in MIRO — clearing GR/IR for 1 unit, booking $36,000 AP",
    "Parking the remaining $36,000 against unit 2's replacement",
    "Raising a debit memo and requesting a corrected invoice",
  ],
  docLabel: "INV-ADS-4419 · short-pay 1 of 2",
  document: <InvoiceMatch invoice={invGearboxShortPay} />,
  sources: [
    { id: "gbx-sp-inv", label: "INV-ADS-4419", meta: "from Matching · held", kind: "invoice", handoff: true, body: <InvoiceMatch invoice={invGearbox} /> },
    { id: "gbx-sp-gr", label: "GR-77642", meta: "1 of 2 received", kind: "sap", handoff: true, body: <GoodsReceipt gr={grGearbox} /> },
    { id: "gbx-sp-vendor", label: "Vendor 201185", meta: "account ·· 4471 verified", kind: "master", body: <VendorRecordDoc variant="golden" /> },
  ],
  email: {
    cta: "Request the corrected invoice",
    to: "Apex Drive Systems · AR (verified)",
    subject: "INV-ADS-4419 — short-paid 1 of 2 · corrected invoice requested",
    lines: [
      "We've paid the 1 unit received against INV-ADS-4419 — $36,000 to your account of record (IBAN ·· 4471) on Net 30. The second unit was damaged in transit and is on a carrier claim.",
      "Please issue a corrected invoice for the delivered unit and bill the replacement on dispatch. Debit memo DM-ADS-4419 raised for the over-billed unit.",
    ],
    toastTitle: "Corrected invoice requested",
    toastBody: "Apex acknowledged — corrected invoice to follow.",
    reply: {
      from: "Apex Drive Systems",
      receivedMeta: "Outlook · 10:40",
      subject: "RE: INV-ADS-4419 — corrected invoice to follow",
      lines: [
        "Understood — we'll issue the corrected invoice for the delivered unit and bill the replacement on dispatch.",
      ],
      source: {
        id: "gbx-sp-reply",
        label: "Apex reply",
        meta: "Outlook · 10:40",
        kind: "email",
        body: (
          <EmailDoc
            from="Apex Drive Systems"
            fromAddr="ar@apexdrives.com"
            to="Invoice Resolution Agent"
            sent="2026-06-10 · 10:40"
            subject="RE: INV-ADS-4419 — corrected invoice to follow"
            tone="inbound"
            lines={[
              "Understood — we'll issue the corrected invoice for the delivered unit and bill the replacement on dispatch.",
              "Apologies for the transit damage.",
            ]}
          />
        ),
      },
    },
  },
  recommendation:
    "Bank is locked to the verified account, so pay to receipt: short-pay the 1 delivered unit — $36,000 to IBAN ·· 4471 on Net 30 — and park the remaining $36,000 until the replacement is received. Debit memo raised; corrected invoice requested. Approve the short payment.",
  stages: [
    {
      sourceId: "gbx-sp-gr",
      reasoning: "Matching to the receipt — pay only the 1 unit received",
      title: "Short-pay decision",
      fields: [
        { label: "Invoiced", value: "2 EA · $72,000.00" },
        { label: "Received & matched", value: "1 EA · $36,000.00" },
        { label: "Pay now", value: "$36,000.00" },
        { label: "Pay to account", value: "IBAN ·· 4471 (verified)", options: ["IBAN ·· 4471 (verified)", "IBAN ·· 9920 (rejected)"] },
        { label: "Parked balance", value: "$36,000.00 · awaiting replacement" },
      ],
    },
    {
      sourceId: "gbx-sp-inv",
      reasoning: "Posting the short-pay in MIRO and raising the debit memo",
      title: "Posting & debit memo",
      fields: [
        { label: "Dr · 191100 GR/IR clearing", value: "USD 36,000.00" },
        { label: "Cr · 160000 Accounts payable", value: "USD 36,000.00" },
        { label: "Debit memo", value: "DM-ADS-4419 · 1 unit over-billed" },
        { label: "Corrected invoice", value: "Requested from Apex" },
      ],
    },
  ],
  dossier: {
    swimlane: "Accounts Payable",
    rows: [
      { lane: "Key process steps", points: ["Payment run", "Bank-file creation"] },
      { lane: "AI intervention points", points: ["Fraud detection (bank-details anomaly)", "Payment-pattern anomaly", "Dynamic-discounting optimization"] },
      { lane: "Value delivered", points: ["2–5% working-capital improvement / discount capture"] },
      { lane: "Key controls", points: ["Vendor bank validation", "Payment-anomaly monitoring", "Dual approval + AI alerts"] },
      { lane: "Systems / tools", points: ["SAP S/4HANA", "Kyriba", "TIS", "Treasury"] },
    ],
  },
};

/* ── Step 5 · Replacement & release (PO Management → Invoice Resolution) ──── */

const grGearboxReplacement: SapGR = {
  number: "GR-77642-2 · 5000033010",
  status: "Posted · replacement",
  createdOn: "2026-06-15 · 08:05",
  createdBy: "PO Management Agent",
  movementType: "101 · GR goods receipt for PO",
  postingDate: "2026-06-15",
  documentDate: "2026-06-15",
  deliveryNote: "ADS-DN-2261",
  billOfLading: "HOUSTON-8919-2026",
  poReference: "PO-77642 · item 10 (unit 2 replacement)",
  item: {
    line: "1",
    material: "GBX-220K",
    shortText: "Drive gearbox — Containerboard line (unit 2 replacement)",
    quantity: "1",
    unit: "EA",
    plant: "M042 · Containerboard mill",
    storageLocation: "MNT1 · Maintenance store",
    stockType: "Unrestricted-use",
    okIndicator: "Item OK · inspected · replacement received",
  },
};

const invGearboxRelease: SapInvoice = {
  number: "INV-ADS-4419 · release 2 of 2",
  status: "Released · 2 of 2 · paid in full",
  createdOn: "2026-06-15 · 09:10",
  createdBy: "Invoice Resolution Agent",
  vendorReference: "ADS-4419",
  vendor: "201185 · Apex Drive Systems",
  invoiceDate: "2026-06-15",
  postingDate: "2026-06-15",
  baselineDate: "2026-06-15",
  dueDate: "2026-07-15",
  paymentTerms: "NT30 · Net 30 days",
  termsSource: "Released to the account of record IBAN ·· 4471",
  cashDiscount: "None · pay on the net date",
  paymentRunDate: "2026-07-15",
  taxCode: "U1 · Self-assessed use tax",
  grossAmount: "72,000.00",
  taxAmount: "0.00",
  currency: "USD",
  balance: "0.00",
  fraudScore: "0.02 · low — paid to verified account ·· 4471",
  poReference: "PO-77642 · item 10",
  grReference: "GR-77642-2 · replacement received",
  match: [
    { dimension: "Unit price (USD)", contract: "36,000.00", po: "36,000.00", goodsReceipt: "—", invoice: "36,000.00", ok: true },
    { dimension: "Quantity (EA)", contract: "2", po: "2", goodsReceipt: "2", invoice: "2", ok: true },
    { dimension: "Net value (USD)", contract: "72,000.00", po: "72,000.00", goodsReceipt: "72,000.00", invoice: "72,000.00", ok: true },
    { dimension: "Bank account", contract: "IBAN ·· 4471 (on file)", po: "—", goodsReceipt: "—", invoice: "IBAN ·· 4471 (verified)", ok: true },
    { dimension: "Payment terms", contract: "Net 30", po: "Net 30", goodsReceipt: "—", invoice: "Net 30", ok: true },
  ],
  postingJournal: [
    { line: "1", glAccount: "191100", text: "GR/IR clearing — cleared against GR-77642-2 (replacement)", drcr: "Dr", amount: "36,000.00" },
    { line: "2", glAccount: "160000", text: "Accounts payable — Apex Drive Systems (201185)", drcr: "Cr", amount: "36,000.00" },
  ],
  paymentJournal: [
    { line: "1", glAccount: "160000", text: "Accounts payable — Apex (201185) · to verified IBAN ·· 4471", drcr: "Dr", amount: "36,000.00" },
    { line: "2", glAccount: "113100", text: "Bank — outgoing payments (account of record ·· 4471)", drcr: "Cr", amount: "36,000.00" },
  ],
};

const gearboxClaimEmail = (
  <EmailDoc
    from="PO Management Agent"
    fromAddr="po@northgatepaper.com"
    to="Houston Freight Lines · Claims"
    sent="2026-06-10 · 10:20"
    subject="Damage claim — PRO 8841 · 1 gearbox cracked in transit (PO-77642)"
    lines={[
      "Filing a transit-damage claim against PRO 8841: 1 of 2 drive gearboxes (GBX-220K) arrived with a cracked housing. Unit 1 received sound; unit 2 rejected on inspection.",
      "Apex is shipping a replacement (ETA 2026-06-15). Please process the carrier claim for the damaged unit — GR-77642 discrepancy and photos attached.",
    ]}
  />
);

const gearboxReleaseStep: RunStep = {
  id: "po",
  agentName: "PO Management → Invoice Resolution",
  n: 5,
  title: "Replacement & release",
  sub: "Replacement received, match clears, parked balance released",
  reasoning: [
    "Filing the carrier damage claim for unit 2",
    "Expediting the replacement — Apex ships, received 2026-06-15",
    "Posting the replacement goods receipt GR-77642-2",
    "Re-running the three-way match — now clears on 2 of 2",
    "Releasing the parked $36,000 to the verified account ·· 4471",
  ],
  docLabel: "GR-77642-2 · replacement received · balance released",
  document: (
    <div className="space-y-4">
      <GoodsReceipt gr={grGearboxReplacement} />
      <InvoiceMatch invoice={invGearboxRelease} />
    </div>
  ),
  sources: [
    { id: "gbx-claim", label: "Carrier damage claim", meta: "filed · unit 2", kind: "email", body: gearboxClaimEmail },
    { id: "gbx-rep-po", label: "PO-77642", meta: "SAP ME23N", kind: "sap", handoff: true, body: <PurchaseOrder po={poGearbox} /> },
    { id: "gbx-rep-dn", label: "Replacement delivery", meta: "ADS-DN-2261", kind: "edi", body: <DeliveryNoteDoc /> },
  ],
  recommendation:
    "Carrier claim filed and Apex shipped the replacement (received 2026-06-15). GR-77642-2 posted, the three-way match now clears on 2 of 2, and the parked $36,000 releases to the verified account ·· 4471. Approve to release the final payment — full quantity received and paid, $0 lost.",
  stages: [
    {
      sourceId: "gbx-rep-dn",
      reasoning: "Posting the replacement goods receipt for unit 2",
      title: "Replacement receipt",
      fields: [
        { label: "Movement type", value: "101 · GR goods receipt for PO" },
        { label: "Material", value: "GBX-220K · unit 2 replacement" },
        { label: "Received", value: "1 EA · inspected OK" },
        { label: "Posting date", value: "2026-06-15", type: "date" },
      ],
    },
    {
      sourceId: "gbx-rep-po",
      reasoning: "Re-running the three-way match and releasing the parked balance",
      title: "Re-match & release",
      fields: [
        { label: "Quantity now", value: "2 of 2 received · matched" },
        { label: "Release", value: "$36,000.00 · parked balance" },
        { label: "Pay to account", value: "IBAN ·· 4471 (verified)" },
        { label: "Total paid", value: "$72,000.00 · 2 tranches · $0 lost" },
      ],
    },
  ],
  dossier: {
    swimlane: "Procurement Operations",
    rows: [
      { lane: "Key process steps", points: ["Goods receipt", "Service-entry approval"] },
      { lane: "AI intervention points", points: ["Predictive GRN creation (services)", "IoT / digital-proof validation", "NLP on emails / documents to confirm completion"] },
      { lane: "Value delivered", points: ["20–40% fewer missing-GRN issues"] },
      { lane: "Key controls", points: ["System-enforced — no invoice without GRN", "AI flags delays / inconsistencies"] },
      { lane: "Systems / tools", points: ["SAP S/4HANA", "Coupa", "Oracle Cloud", "IoT platforms"] },
    ],
  },
};

/* ════════════════════════════════════════════════════════════════════════
 * ④ COLLECT — Payment & Collections (overdue receivable · dunning · posting)
 * BlueRidge Foods · INV-90357 · $208,400 · 47 days past Net-45 · GL ↔ sub-ledger
 * ════════════════════════════════════════════════════════════════════════ */

const collectCustomerNote = (
  <EmailDoc
    from="BlueRidge Foods · Accounts Payable"
    fromAddr="ap@blueridgefoods.com"
    to="Northgate Paper · Collections"
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
    to="Northgate Paper · Order Management"
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
    to="Northgate Fulfillment"
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
    contextTitle: "Corrugator No.2 · double-backer belt",
    contextSub: "Procurement operations (upstream) · maintenance flagged a worn belt at 9:01 AM",
    reviewPill: "Procurement operations · in review",
    completeNote: "Upstream complete · goods received, ready for invoicing",
    steps: beltUpstreamSteps,
    terminal: (d) =>
      halted(d)
        ? { label: "Held · buyer review", kind: "critical" }
        : { label: "Received · ready for AP", kind: "ready" },
    completion: {
      title: "GR-77310 · received · ready for invoicing",
      tone: "ready",
      routedTo: "Accounts Payable",
      routedSub: "invoice & pay",
      stats: [
        { value: "4", label: "agents handed off" },
        { value: "$48,200", label: "PO on contract" },
        { value: "1/1", label: "goods received" },
      ],
      caption:
        "Supplier onboarded and de-duplicated · requisition raised · contract-bound PO-77310 issued and transmitted · goods received and GR posted. Back to the dashboard — the invoice run is ready when BeltPro bills.",
      nextView: { kind: "cockpit" },
    },
  },
  "belt-ap": {
    id: "belt-ap",
    contextTitle: "INV-BPI-5567 · accounts payable",
    contextSub: "Accounts payable (downstream) · match, post & pay · finance → procurement loop",
    reviewPill: "Accounts payable · in review",
    completeNote: "Run complete · invoice paid, loop closed back to procurement",
    steps: beltDownstreamSteps,
    terminal: () => ({ label: "Paid · audit closed", kind: "ready" }),
    completion: {
      title: "INV-BPI-5567 · paid and audit-closed",
      tone: "ready",
      routedTo: "Procurement",
      routedSub: "loop closed",
      stats: [
        { value: "5", label: "agents handed off" },
        { value: "$48,200", label: "paid to AP" },
        { value: "186/204", label: "batch clean" },
      ],
      caption:
        "Captured · four-way matched · the batch exception routed back to procurement · posted in MIRO · payment scheduled on net 30. The finance → procurement loop is ready to review.",
      paymentSchedule: {
        vendor: "BeltPro Industrial · 100482",
        amount: "USD 48,200.00",
        terms: "NT30 · Net 30 · per contract 4600001207",
        method: "F110 payment run · bank ACH",
        reference: "INV-BPI-5567 · PO-77310",
        timeline: [
          { label: "Invoice posted", date: "2026-06-09", done: true },
          { label: "Net due", date: "2026-07-09", done: false },
          { label: "F110 payment run", date: "2026-07-09", done: false },
        ],
      },
      nextView: { kind: "feedback" },
      nextLabel: "See the feedback loop",
    },
  },
  pump: {
    id: "pump",
    contextTitle: "Power House Unit 1 · boiler feed pump",
    contextSub: "Off-contract spot-buy · above the touchless limit · front-office review",
    reviewPill: "Front-office review",
    completeNote: "Order released · single-source buy approved against policy",
    steps: [pumpIntakeStep, pumpSourcingStep, pumpPoStep],
    terminal: (d) =>
      halted(d)
        ? { label: "Escalated · buyer review", kind: "critical" }
        : { label: "Order released", kind: "ready" },
    completion: {
      title: "PR-48630 · escalated to buyer review",
      tone: "critical",
      routedTo: "Category Manager",
      routedSub: "buyer review",
      stats: [
        { value: "3", label: "agents reviewed" },
        { value: "$96,400", label: "order held" },
        { value: "24%", label: "over benchmark" },
      ],
      caption:
        "Single-source, 24% over the benchmark, no framework · nothing ordered · routed to the category manager · EXC-48630-PO logged.",
    },
  },
  gearbox: {
    id: "gearbox",
    contextTitle: "Containerboard line · drive gearbox",
    contextSub: "PO-77642 · short receipt + bank-change fraud · back-office resolution",
    reviewPill: "Back-office resolution · in review",
    completeNote: "Resolved · paid clean to the verified account, fraud blocked",
    steps: [gearboxFulfillmentStep, gearboxInvoiceStep, gearboxBankVerifyStep, gearboxShortPayStep, gearboxReleaseStep],
    terminal: (d) =>
      halted(d)
        ? { label: "Escalated · fraud & buyer review", kind: "critical" }
        : { label: "Resolved · paid to verified account", kind: "ready" },
    completion: {
      title: "INV-ADS-4419 · resolved — paid clean, fraud blocked",
      tone: "ready",
      routedTo: "Orchestrator",
      routedSub: "audit close",
      stats: [
        { value: "$72,000", label: "paid to verified account" },
        { value: "$0", label: "to the fraud account" },
        { value: "2 of 2", label: "received & paid" },
      ],
      caption:
        "Bank-change fraud rejected and reported · account of record ·· 4471 preserved · short-paid the received unit, released the rest on the replacement · $0 lost · audit envelope closed.",
      paymentSchedule: {
        vendor: "Apex Drive Systems · 201185",
        amount: "USD 72,000.00",
        terms: "NT30 · Net 30 · to verified IBAN ·· 4471",
        method: "F110 payment run · bank ACH",
        reference: "INV-ADS-4419 · PO-77642 · two tranches",
        timeline: [
          { label: "Short-pay 1 of 2", date: "2026-07-10", done: true },
          { label: "Replacement in", date: "2026-06-15", done: true },
          { label: "Release 2 of 2", date: "2026-07-15", done: false },
        ],
      },
      nextView: { kind: "cockpit" },
      nextLabel: "Back to cockpit",
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
