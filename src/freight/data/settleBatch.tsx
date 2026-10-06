/**
 * Today's settlement batch — the orchestrator's portfolio oversight surface
 * (the Approvals page). Where the settle FLOW walks one carrier invoice as a
 * worked case, this is the at-scale view the Approval & Exception Router posts in
 * one click: the 9:00 AM batch of 1,640 lines across 7 carriers, 1,604 cleared
 * touchless (97.8%), and the 36 exceptions bucketed into the four named types and
 * routed to the four owning teams. Reuses the settlement visuals at batch scale.
 */

import { DocShell, DocTitleBand, SectionBand, Field } from "@/freight/components/docs/sap/parts";
import type { RouterLane } from "@/freight/components/workspace/ExceptionRouterBoard";
import type { ExceptionType } from "@/freight/components/workspace/ToleranceGauge";

const ACCENT = {
  "missing-po": "#a6192e",
  "wrong-company-code": "#3f7d6e",
  "insufficient-po": "#c2740c",
  "rate-mismatch": "#123456",
} as const;

function excDoc(o: {
  invoice: string;
  carrier: string;
  amount: string;
  reason: string;
  bucket: string;
  team: string;
  sla: string;
}) {
  return (
    <DocShell>
      <DocTitleBand
        number={o.invoice}
        status={o.bucket}
        docType={`Freight invoice exception · ${o.carrier}`}
        system="SAP · Freight settlement"
        createdOn="2026-06-20 · 09:00"
        createdBy="Freight Settlement Matcher"
      />
      <SectionBand>Exception</SectionBand>
      <div className="grid grid-cols-2 gap-3 p-4">
        <Field label="Carrier" value={o.carrier} />
        <Field label="Invoice amount" value={o.amount} mono />
        <Field label="Exception type" value={o.bucket} />
        <Field label="Routed to" value={`${o.team} · SLA ${o.sla}`} />
      </div>
      <SectionBand>Why it breached the control</SectionBand>
      <div className="p-4 text-[12.5px] text-ink leading-snug">{o.reason}</div>
    </DocShell>
  );
}

/** Totals for the batch funnel. */
export const batchTotals = {
  runId: "SR-2206",
  total: 1640,
  touchless: 1604,
  exceptions: 36,
  carriers: 7,
  clearedAmount: "$3.64M",
  atRiskAmount: "$41.2K",
  touchlessPct: "97.8%",
};

/** The 36 outliers on the tolerance band, spread across the four buckets. */
export const batchOutliers: { type: ExceptionType; variancePct: number }[] = [
  ...Array.from({ length: 14 }, (_, i) => ({ type: "missing-po" as const, variancePct: 2.4 + i * 0.16 })),
  ...Array.from({ length: 6 }, (_, i) => ({ type: "wrong-company-code" as const, variancePct: 3.0 + i * 0.4 })),
  ...Array.from({ length: 9 }, (_, i) => ({ type: "insufficient-po" as const, variancePct: 2.6 + i * 0.28 })),
  ...Array.from({ length: 7 }, (_, i) => ({ type: "rate-mismatch" as const, variancePct: 3.5 + i * 0.55 })),
];

/** The four exception buckets — 36 lines across 7 carriers, routed to 4 teams. */
export const batchLanes: RouterLane[] = [
  {
    type: "missing-po",
    label: "Missing PO",
    accent: ACCENT["missing-po"],
    team: "Procurement",
    sla: "1 day",
    count: 14,
    atRisk: "$9.8K",
    cards: [
      { id: "mp1", carrier: "Summit Carriers", scac: "SUMC", invoice: "INV-SUM-5571", amount: "$1,260", reason: "Ref PO 4500-8821 not found in freight accruals", preview: excDoc({ invoice: "INV-SUM-5571", carrier: "Summit Carriers", amount: "$1,260", reason: "References PO 4500-8821, which doesn't exist in the freight-accrual ledger.", bucket: "Missing PO", team: "Procurement", sla: "1 day" }) },
      { id: "mp2", carrier: "Ironwood Freight Lines", scac: "IRNW", invoice: "INV-IRN-3340", amount: "$980", reason: "No PO on a spot-tendered backhaul", preview: excDoc({ invoice: "INV-IRN-3340", carrier: "Ironwood Freight Lines", amount: "$980", reason: "Spot-tendered backhaul moved without a purchase order raised.", bucket: "Missing PO", team: "Procurement", sla: "1 day" }) },
      { id: "mp3", carrier: "Cedar Haul Logistics", scac: "CEDR", invoice: "INV-CED-7711", amount: "$1,540", reason: "PO field blank on the carrier invoice" },
    ],
  },
  {
    type: "wrong-company-code",
    label: "Wrong company code",
    accent: ACCENT["wrong-company-code"],
    team: "Finance master-data",
    sla: "4 h",
    count: 6,
    atRisk: "$7.4K",
    cards: [
      { id: "cc1", carrier: "Harbor Point Carriers", scac: "HARB", invoice: "INV-HAR-2208", amount: "$2,100", reason: "Billed to CC 2000 (Eastbrook) — should be 1000 (Northgate)", preview: excDoc({ invoice: "INV-HAR-2208", carrier: "Harbor Point Carriers", amount: "$2,100", reason: "Header carries company code 2000 (Eastbrook); the Riverside load belongs to 1000 (Northgate).", bucket: "Wrong company code", team: "Finance master-data", sla: "4 h" }) },
      { id: "cc2", carrier: "Vantage Owner-Operators", scac: "VANT", invoice: "INV-VAN-9043", amount: "$1,820", reason: "Company code 3000 on a Riverside-bound load" },
    ],
  },
  {
    type: "insufficient-po",
    label: "Insufficient PO value",
    accent: ACCENT["insufficient-po"],
    team: "Buyer-AP",
    sla: "1 day",
    count: 9,
    atRisk: "$11.6K",
    cards: [
      { id: "ip1", carrier: "Lakeside Trucking", scac: "LAKE", invoice: "INV-LAK-5520", amount: "$1,980", reason: "Invoice $1,980 vs PO committed $1,500 — $480 over accrual", preview: excDoc({ invoice: "INV-LAK-5520", carrier: "Lakeside Trucking", amount: "$1,980", reason: "Invoiced $1,980 against a PO committed at $1,500 — $480 beyond the accrual.", bucket: "Insufficient PO value", team: "Buyer-AP", sla: "1 day" }) },
      { id: "ip2", carrier: "Summit Carriers", scac: "SUMC", invoice: "INV-SUM-5588", amount: "$2,240", reason: "Accessorials push the line $610 past the PO value" },
      { id: "ip3", carrier: "Northwind Regional", scac: "NWND", invoice: "INV-NWN-1180", amount: "$1,410", reason: "PO under-accrued for the fuel surcharge" },
    ],
  },
  {
    type: "rate-mismatch",
    label: "Rate mismatch",
    accent: ACCENT["rate-mismatch"],
    team: "Freight desk",
    sla: "2 days",
    count: 7,
    atRisk: "$12.4K",
    cards: [
      { id: "rm1", carrier: "Ironwood Freight Lines", scac: "IRNW", invoice: "INV-IRN-3361", amount: "$2,050", reason: "Line haul $11,650 vs contract $11,200 — out of ±2%", preview: excDoc({ invoice: "INV-IRN-3361", carrier: "Ironwood Freight Lines", amount: "$2,050", reason: "Line haul billed $11,650 against the contracted $11,200 — a 4.0% variance, outside ±2%.", bucket: "Rate mismatch", team: "Freight desk", sla: "2 days" }) },
      { id: "rm2", carrier: "Harbor Point Carriers", scac: "HARB", invoice: "INV-HAR-3402", amount: "$1,540", reason: "Surcharge billed flat vs the contracted percentage" },
      { id: "rm3", carrier: "Cedar Haul Logistics", scac: "CEDR", invoice: "INV-CED-7740", amount: "$1,290", reason: "Detention billed past the gate-log free time" },
    ],
  },
];
