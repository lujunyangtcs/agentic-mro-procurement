/**
 * Flow B — Exception-Driven Freight Settlement Automation (HERO).
 *
 * ONE case: a single carrier settlement invoice (Ironwood INV-IRN-2206 · the
 * carrier's consolidated CHI→RIV settlement, 20 charge lines). The agent runs
 * the settlement automation on this invoice: it three-way checks every line,
 * auto-clears the 16 lines inside tolerance (touchless), and routes ONLY the 4
 * exception lines — bucketed into the four named types (missing PO · wrong
 * company code · insufficient PO value · rate mismatch) — to the team that owns
 * each fix, then posts the cleared lines and seals an audit record.
 *
 * Five gated steps; the human approves the auto-clear, the routing and the post.
 * Every figure ties: 20 lines · 16 touchless (80%) · 4 exceptions · $30.7K to AP
 * · $4.1K routed. Distinct from the reconciliation case (Summit INV-SUM-5567).
 */

import type { RunStep } from "@/freight/data/runSteps";
import { DocShell, DocTitleBand, SectionBand, Field } from "@/freight/components/docs/sap/parts";
import { EmailDoc } from "@/freight/components/docs/sources";
import { ToleranceGate } from "@/freight/components/workspace/ToleranceGate";
import { SystemOfRecordCard } from "@/freight/components/workspace/SystemOfRecordCard";
import { ToleranceGauge } from "@/freight/components/workspace/ToleranceGauge";
import { ResolutionTracker } from "@/freight/components/workspace/ResolutionTracker";
import { PostingEnvelopeCeremony } from "@/freight/components/workspace/PostingEnvelopeCeremony";
import { ExceptionRouterBoard, type RouterLane } from "@/freight/components/workspace/ExceptionRouterBoard";

const INV = "INV-IRN-2206";
const CARRIER = "Ironwood Freight Lines · SCAC IRNW";

/* Per-bucket accent — distinct hue per exception type, reused on the board. */
const ACCENT = {
  "missing-po": "#a6192e",
  "wrong-company-code": "#3f7d6e",
  "insufficient-po": "#c2740c",
  "rate-mismatch": "#123456",
} as const;

/* A drill-through doc for one flagged line — opened from its exception card. */
function settleExcDoc(o: {
  line: string;
  amount: string;
  reason: string;
  bucket: string;
  team: string;
  sla: string;
}) {
  return (
    <DocShell>
      <DocTitleBand
        number={`${INV} · ${o.line}`}
        status={o.bucket}
        docType={`Freight invoice exception · ${CARRIER}`}
        system="SAP · Freight settlement"
        createdOn="2026-06-20 · 09:00"
        createdBy="Freight Settlement Matcher"
      />
      <SectionBand>Exception line</SectionBand>
      <div className="grid grid-cols-2 gap-3 p-4">
        <Field label="Invoice" value={INV} />
        <Field label="Line amount" value={o.amount} mono />
        <Field label="Exception type" value={o.bucket} />
        <Field label="Routed to" value={`${o.team} · SLA ${o.sla}`} />
      </div>
      <SectionBand>Why it breached the control</SectionBand>
      <div className="p-4 text-[12.5px] text-ink leading-snug">{o.reason}</div>
    </DocShell>
  );
}

/* ── The four exception lines on this one invoice — one per bucket ─────────── */

const routerLanes: RouterLane[] = [
  {
    type: "missing-po",
    label: "Missing PO",
    accent: ACCENT["missing-po"],
    team: "Procurement",
    sla: "1 day",
    count: 1,
    atRisk: "$980",
    cards: [
      {
        id: "mp1",
        carrier: "Ironwood Freight Lines",
        scac: "Line 7",
        invoice: `${INV} · L7`,
        amount: "$980",
        reason: "Backhaul leg references PO 4500-8821 — not in freight accruals",
        preview: settleExcDoc({ line: "Line 7", amount: "$980", reason: "The backhaul leg references PO 4500-8821, but no such PO exists in the freight-accrual ledger — nothing to settle this line against.", bucket: "Missing PO", team: "Procurement", sla: "1 day" }),
      },
    ],
  },
  {
    type: "wrong-company-code",
    label: "Wrong company code",
    accent: ACCENT["wrong-company-code"],
    team: "Finance master-data",
    sla: "4 h",
    count: 1,
    atRisk: "$1,120",
    cards: [
      {
        id: "cc1",
        carrier: "Ironwood Freight Lines",
        scac: "Line 12",
        invoice: `${INV} · L12`,
        amount: "$1,120",
        reason: "Coded to CC 2000 (Eastbrook) — should be 1000 (Northgate)",
        preview: settleExcDoc({ line: "Line 12", amount: "$1,120", reason: "The Riverside delivery line carries company code 2000 (Eastbrook); this load belongs to company code 1000 (Northgate). Re-code before posting.", bucket: "Wrong company code", team: "Finance master-data", sla: "4 h" }),
      },
    ],
  },
  {
    type: "insufficient-po",
    label: "Insufficient PO value",
    accent: ACCENT["insufficient-po"],
    team: "Buyer-AP",
    sla: "1 day",
    count: 1,
    atRisk: "$1,180",
    cards: [
      {
        id: "ip1",
        carrier: "Ironwood Freight Lines",
        scac: "Line 15",
        invoice: `${INV} · L15`,
        amount: "$1,180",
        reason: "Detention accessorial pushes the load $610 past the PO value",
        preview: settleExcDoc({ line: "Line 15", amount: "$1,180", reason: "A detention accessorial pushes this load to $1,180 against a PO committed at $570 — $610 over the accrued value. Needs a PO top-up before AP can post.", bucket: "Insufficient PO value", team: "Buyer-AP", sla: "1 day" }),
      },
    ],
  },
  {
    type: "rate-mismatch",
    label: "Rate mismatch",
    accent: ACCENT["rate-mismatch"],
    team: "Freight desk",
    sla: "2 days",
    count: 1,
    atRisk: "$820",
    cards: [
      {
        id: "rm1",
        carrier: "Ironwood Freight Lines",
        scac: "Line 4",
        invoice: `${INV} · L4`,
        amount: "$820",
        reason: "Line haul $11,650 vs contract $11,200 — out of the ±2% band",
        preview: settleExcDoc({ line: "Line 4", amount: "$820", reason: "Line haul billed $11,650 against the contracted $11,200 — a 4.0% variance, outside the ±2% lane tolerance. The $820 delta is held pending a rate dispute.", bucket: "Rate mismatch", team: "Freight desk", sla: "2 days" }),
      },
    ],
  },
];

/* The invoice's 20 lines on the tolerance band — 16 inside, 4 outliers. */
const tolOutliers = [
  { type: "missing-po" as const, variancePct: 3.2 },
  { type: "wrong-company-code" as const, variancePct: 2.6 },
  { type: "insufficient-po" as const, variancePct: 5.1 },
  { type: "rate-mismatch" as const, variancePct: 4.0 },
];

/* The carrier settlement invoice — reused as the source body across the steps. */
function SettlementInvoiceDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number={INV}
        status="20 lines · 4 flagged"
        docType={`Carrier settlement invoice · ${CARRIER}`}
        system="SAP · Freight settlement"
        createdOn="2026-06-20 · 09:00"
        createdBy="Freight Settlement Matcher"
      />
      <SectionBand>Invoice</SectionBand>
      <div className="grid grid-cols-2 gap-3 p-4">
        <Field label="Carrier" value={CARRIER} />
        <Field label="Lane" value="CHI → RIV · consolidated settlement" />
        <Field label="Lines" value="20 charge lines · $34,800" mono />
        <Field label="Cleared touchless" value="16 lines · $30,700 · 80%" />
        <Field label="Exceptions" value="4 lines · $4,100 at risk" />
        <Field label="Tolerance" value="±2% per line · TOL-FRT-02" />
      </div>
    </DocShell>
  );
}

/* ── Step 1 · Settle the invoice ──────────────────────────────────────────── */
const sweepStep: RunStep = {
  id: "invoice",
  agentName: "Freight Settlement Matcher",
  n: 1,
  title: "Settle the invoice",
  sub: "Three-way checks every line · auto-clears in tolerance",
  reasoning: [
    `Streaming the 20 lines of ${INV} through the ±2% tolerance gate`,
    "Three-way checking each line — invoice vs PO vs rate card",
    "16 lines on-contract and inside tolerance — auto-cleared touchless",
    "4 lines breach a control — held at the gate",
    "Line 7 references PO 4500-8821 — not in accruals",
    "Line 12 coded to company code 2000 — not 1000",
    "Line 15 sits $610 over its PO value",
    "Line 4 line haul is 4.0% off contract — outside ±2%",
  ],
  docLabel: `${INV} · Touchless settlement`,
  document: (
    <ToleranceGate
      total={20}
      cleared={16}
      exceptions={[
        { label: "L7", type: "missing PO" },
        { label: "L12", type: "wrong company code" },
        { label: "L15", type: "insufficient PO value" },
        { label: "L4", type: "rate mismatch" },
      ]}
    />
  ),
  sources: [
    { id: "invoice", label: "Settlement invoice", meta: `${INV} · 20 lines`, kind: "invoice", body: <SettlementInvoiceDoc /> },
    { id: "ratelib", label: "Rate-card library", meta: "RC-OCC-2026 · CHI→RIV", kind: "contract", body: <SettlementInvoiceDoc /> },
    { id: "tolpolicy", label: "Tolerance policy", meta: "TOL-FRT-02 · ±2%", kind: "policy", body: <SettlementInvoiceDoc /> },
  ],
  recommendation:
    `16 of the 20 lines on ${INV} are on-contract and inside tolerance — cleared touchless to AP ($30.7K). 4 lines breach a control and need triage before posting.`,
};

/* ── Step 2 · Score against tolerance ─────────────────────────────────────── */
const scoreStep: RunStep = {
  id: "sourcing",
  agentName: "Rate & Surcharge Engine",
  n: 2,
  title: "Score against tolerance",
  sub: "Normalises surcharges · plots the outliers on the band",
  reasoning: [
    "Normalising fuel + accessorials to a like-for-like basis per line",
    "Scoring each line's variance against its ±2% lane band",
    "16 lines land inside the band — median variance 0.4%",
    "Line 4 plots at +4.0% · Line 15 at +5.1% — clear outliers",
    "Lines 7 & 12 fail the match, not the rate — flagged separately",
  ],
  docLabel: `${INV} · Tolerance distribution`,
  document: <ToleranceGauge band="±2%" inCount={16} median="0.4%" outliers={tolOutliers} />,
  sources: [
    { id: "score-handoff", label: "Touchless settlement", meta: "from Settlement Matcher", kind: "sap", handoff: true, body: <SettlementInvoiceDoc /> },
    { id: "fuelindex", label: "Fuel index", meta: "weekly · DOE", kind: "external", body: <SettlementInvoiceDoc /> },
  ],
  recommendation:
    "Variance is healthy — 16 lines sit at a 0.4% median, well inside ±2%. The 4 outliers each trace to a distinct root cause; each maps cleanly to one owning team.",
};

/* ── Step 3 · Triage the exceptions (HERO) ────────────────────────────────── */
const triageStep: RunStep = {
  id: "invoice",
  agentName: "Freight Settlement Matcher",
  n: 3,
  title: "Triage the exceptions",
  sub: "Buckets the 4 flagged lines · routes only exceptions to the owning team",
  reasoning: [
    "Line 7 → missing PO → Procurement owns the fix",
    "Line 12 → wrong company code → Finance master-data",
    "Line 15 → insufficient PO value → Buyer-AP",
    "Line 4 → rate mismatch → Freight desk",
    "Drafting one routing slip per line · $4,100 held",
  ],
  docLabel: `${INV} · Exception router`,
  hasExceptions: true,
  approveLabel: "Approve & route the 4 exceptions",
  document: <ExceptionRouterBoard lanes={routerLanes} />,
  sources: [
    { id: "triage-handoff", label: "Tolerance distribution", meta: "from Rate & Surcharge", kind: "sap", handoff: true, body: <SettlementInvoiceDoc /> },
    { id: "cc-master", label: "Company-code master", meta: "CC 1000 · Northgate", kind: "master", body: <SettlementInvoiceDoc /> },
    { id: "po-ledger", label: "PO accrual ledger", meta: "freight accruals", kind: "sap", body: <SettlementInvoiceDoc /> },
  ],
  recommendation:
    "4 exception lines · $4,100 at risk. The missing-PO leg → Procurement · the wrong-company-code line → Finance master-data · the over-PO accessorial → Buyer-AP · the rate-mismatch line haul → Freight desk. Routing slips drafted — route on your approval.",
};

/* ── Step 4 · Set SLAs & route ────────────────────────────────────────────── */
const routeStep: RunStep = {
  id: "orchestrator",
  agentName: "Approval & Exception Router",
  n: 4,
  title: "Set SLAs & route",
  sub: "Opens a tracked ticket per exception · notifies the 4 teams",
  reasoning: [
    "Line 12 → 4h SLA · Lines 7 & 15 → 1 day · Line 4 → 2 days",
    "Opening a tracked ticket against each of the 4 lines",
    "Holding all 4 lines out of tonight's payment run",
    "Notifying the four owning teams with one digest · arming the clock",
  ],
  docLabel: `${INV} · Resolution tracker`,
  document: (
    <ResolutionTracker
      lanes={[
        { team: "Procurement", type: "missing-po", count: 1, sla: "1d", status: "in-progress" },
        { team: "Finance master-data", type: "wrong-company-code", count: 1, sla: "4h", status: "in-progress" },
        { team: "Buyer-AP", type: "insufficient-po", count: 1, sla: "1d", status: "queued" },
        { team: "Freight desk", type: "rate-mismatch", count: 1, sla: "2d", status: "queued" },
      ]}
      footer="4 tracked · 0 breached · next due 4h · Finance master-data"
    />
  ),
  sources: [
    { id: "route-handoff", label: "Exception router", meta: "from Settlement Matcher", kind: "sap", handoff: true, body: <SettlementInvoiceDoc /> },
    { id: "sla-policy", label: "SLA policy", meta: "SLA-FRT · by exception type", kind: "policy", body: <SettlementInvoiceDoc /> },
    { id: "team-roster", label: "Team roster", meta: "4 owning teams", kind: "master", body: <SettlementInvoiceDoc /> },
  ],
  email: {
    cta: "Send the routing digest",
    to: "Procurement · Finance master-data · Buyer-AP · Freight desk",
    subject: `${INV} — 4 exception lines routed · 4 teams`,
    lines: [
      `Settlement of ${INV} cleared 16 lines touchless ($30.7K to AP). 4 lines breached a control and are routed to you with a tracked ticket each:`,
      "Procurement — Line 7 missing PO ($980 · SLA 1 day). Finance master-data — Line 12 wrong company code ($1,120 · SLA 4h). Buyer-AP — Line 15 over PO value ($1,180 · SLA 1 day). Freight desk — Line 4 rate mismatch ($820 · SLA 2 days).",
      "Each ticket links the offending line and PO. The lines are held out of the payment run until cleared.",
    ],
    toastTitle: "Teams notified",
    toastBody: "4 tickets opened across 4 teams — Finance master-data acknowledged first.",
    reply: {
      from: "Finance master-data",
      receivedMeta: "Outlook · 09:14",
      subject: `RE: ${INV} — 4 exception lines routed`,
      lines: ["Got Line 12 — re-coding company code 2000→1000 now, clearing within the 4h SLA."],
      source: {
        id: "route-ack",
        label: "Team acknowledgement",
        meta: "Outlook · 09:14",
        kind: "email",
        body: (
          <EmailDoc
            from="Finance master-data"
            fromAddr="masterdata@northgatepaper.com"
            to="Approval & Exception Router"
            sent="2026-06-20 · 09:14"
            subject={`RE: ${INV} — 4 exception lines routed`}
            tone="inbound"
            lines={["Got Line 12 — re-coding company code 2000→1000 now, clearing within the 4h SLA."]}
          />
        ),
      },
    },
  },
  recommendation:
    "SLAs set — 4h master-data fix, 1-day PO actions, 2-day rate dispute. Four teams notified with one digest; 4 tickets open and tracking. Send the digest to arm the clock.",
};

/* ── Step 5 · Post & close the envelope ───────────────────────────────────── */
const postStep: RunStep = {
  id: "orchestrator",
  agentName: "Approval & Exception Router",
  n: 5,
  title: "Post & close the envelope",
  sub: "Posts the cleared lines · holds the 4 · seals the audit record",
  reasoning: [
    "Posting the 16 cleared lines to SAP AP doc 5105004471 on net terms",
    "Holding the 4 routed lines out of tonight's payment run",
    "Writing 4 exception tickets (EXC-2206-01…04) into the record",
    `Sealing the immutable audit envelope — ${INV}`,
  ],
  docLabel: `${INV} · Audit envelope`,
  document: (
    <div className="space-y-4">
      <PostingEnvelopeCeremony
        runId={INV}
        postedCount={16}
        postedAmount="$30.7K"
        heldCount={4}
        routedAmount="$4.1K"
        touchlessPct="80%"
      />
      <SystemOfRecordCard
        apDoc="AP 5105004471"
        postedCount={16}
        postedAmount="$30.7K"
        tickets={[
          { id: "EXC-2206-01", team: "Procurement", type: "missing PO" },
          { id: "EXC-2206-02", team: "Finance master-data", type: "wrong company code" },
          { id: "EXC-2206-03", team: "Buyer-AP", type: "insufficient PO value" },
          { id: "EXC-2206-04", team: "Freight desk", type: "rate mismatch" },
        ]}
      />
    </div>
  ),
  sources: [
    { id: "post-handoff", label: "Resolution tracker", meta: "from Exception Router", kind: "sap", handoff: true, body: <SettlementInvoiceDoc /> },
    { id: "ap-posting", label: "AP posting", meta: "SAP · net terms", kind: "sap", body: <SettlementInvoiceDoc /> },
  ],
  recommendation:
    "16 lines posted to AP touchless on net terms; the 4 routed lines held out of the payment run and tracking to SLA; the invoice's audit envelope is sealed. Nothing leaks, nothing pays twice.",
};

export const settleSteps: RunStep[] = [sweepStep, scoreStep, triageStep, routeStep, postStep];
