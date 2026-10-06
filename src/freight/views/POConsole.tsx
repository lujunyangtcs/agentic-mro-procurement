import * as React from "react";
import { useApp, type AgentOutputStatus } from "@/freight/state";
import { cn } from "@/freight/lib/utils";
import { CarrierTenderDoc, RateCardDoc } from "@/freight/components/docs/freight/FreightDocs";
import { DataTable, CellTag } from "@/freight/components/blocks/DataTable";
import {
  AgentConsole,
  CardHeader,
  QueuePanel,
  CeremonyModal,
  type ConsoleConfig,
  type OutputMeta,
  type QueueItem,
} from "@/freight/components/agents/ConsoleKit";
import type { ChatTurn } from "@/freight/components/agents/AgentChat";

/* ──────────────────────────────────────────────────────────────────────────
 * Carrier Tender Advisor console.
 *
 * Reads a validated lane and expected-cost envelope, ranks the approved carrier
 * pool on lane economics, sourcing-agreement compliance and prior invoice-defect
 * history, then drafts the tender for a human to release. Also tracks open
 * tenders and pickups. Data surface: validated-lane queue · recommended carrier ·
 * tender terms · sourcing-commitment headroom · carrier scorecard · open-tender
 * tracker. The ceremony reveals tender TND-77310 and hands it to Load Capture.
 * ────────────────────────────────────────────────────────────────────────── */

const queue: QueueItem[] = [
  {
    id: "lane-48201",
    primary: "CHI → RIV · OCC · 22.0 t",
    secondary: "Summit Carriers recommended · 53' dry van · $3,640 all-in · within commitment",
    meta: "09:04",
    readyTag: "Ready to draft tender",
    actionable: true,
  },
  {
    id: "lane-48190",
    primary: "MEM → NGT · mixed paper · 19.4 t",
    secondary: "Cedar Haul Logistics · live load · $2,980",
    meta: "08:30",
    handledTag: "TND-77305 released",
  },
  {
    id: "lane-48177",
    primary: "STL → RIV · DLK · 20.6 t",
    secondary: "Ironwood Freight Lines · backhaul match · $3,110",
    meta: "Yesterday",
    handledTag: "TND-77298 released",
  },
];

type Term = { label: string; value: string };
const tenderTerms: Term[] = [
  { label: "Line haul", value: "$3,160 · −6% vs lane benchmark" },
  { label: "Fuel surcharge", value: "$480 · 22% of line haul · contracted basis" },
  { label: "Equipment", value: "53' dry van · live load · tarps not required" },
  { label: "Pickup window", value: "2026-06-19 · 13:00–15:00 · Riverside mill" },
  { label: "Transit / SLA", value: "1 day · on-time ≥ 95% · 2h tender response" },
];

type HistRow = { tnd: string; lane: string; value: string; result: string };
const history: HistRow[] = [
  { tnd: "TND-77188", lane: "CHI → RIV · OCC", value: "$3,610", result: "On time · clean invoice" },
  { tnd: "TND-76920", lane: "CHI → RIV · mixed paper", value: "$3,540", result: "On time · clean invoice" },
  { tnd: "TND-76551", lane: "STL → RIV · DLK", value: "$3,180", result: "On time · clean invoice" },
];

const COMMIT = { used: 312_400, commit: 3_640, total: 500_000 };

const outputMeta: OutputMeta = {
  none: { label: "No tender yet", kind: "neutral", note: "Open the validated lane to draft a carrier tender." },
  pending: { label: "On pending", kind: "neutral", note: "TND-77310 parked — resume it from the queue when ready." },
  approved: {
    label: "Released to carrier",
    kind: "active",
    note: "TND-77310 released to Summit Carriers, tracked to pickup, and handed to the Load Capture agent.",
  },
  rejected: { label: "Declined", kind: "critical", note: "TND-77310 was declined — nothing was tendered." },
  escalated: { label: "Escalated", kind: "critical", note: "Routed to the transportation lead for release with the drafted tender attached." },
};

const chatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the Carrier Tender Advisor — I rank the approved carrier pool on lane economics, sourcing-agreement compliance and prior invoice-defect history, then draft the tender for you to release. Ask me about the recommendation.",
        children: (
          <div className="text-[12.5px] text-ink leading-[19px]">
            <div className="text-mute mb-1">For example —</div>
            <ul className="space-y-0.5">
              <li>· Why this carrier was recommended</li>
              <li>· Whether we're within the volume commitment</li>
              <li>· What needs a person to release</li>
            </ul>
          </div>
        ),
      },
    ],
    chips: ["Why Summit Carriers?", "Are we within commitment?", "Why does this need a release?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "On CHI → RIV, Summit Carriers prices $3,640 all-in — 6% under the lane benchmark — with a 96% on-time record and a 1.4% invoice-defect rate, the cleanest in the approved pool for OCC. Cedar Haul is $40 cheaper but has two surcharge disputes on this lane in the last quarter.",
      },
    ],
    chips: ["Are we within commitment?", "Why does this need a release?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "The CHI → RIV sourcing agreement has 187,600 lbs of committed volume left this period; this 22-tonne load leaves comfortable headroom and keeps Summit on track to its tier. No commitment-at-risk flag.",
      },
    ],
    chips: ["Why does this need a release?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I run at L2 by default — I rank, draft and wait. This lane is in tolerance and within commitment, so it's a one-click release; raise the dial to L3 and routine in-tolerance lanes within commitment tender on their own.",
      },
    ],
  },
];

const config: ConsoleConfig = {
  id: "po",
  statLabel: "Tenders",
  artifactLabel: "Carrier tender · TND-77310",
  outputMeta,
  chatName: "Carrier Tender",
  chatScript,
  runRole: "Drafts carrier tender TND-77310 to the recommended approved carrier.",
  openRunLabel: "Open the validated lane",
};

const lbs = (n: number) => `${n.toLocaleString("en-US")} lbs`;

type CarrierField = { field: string; value: React.ReactNode; key: boolean };
const recommendedCarrier: CarrierField[] = [
  {
    field: "Carrier",
    key: true,
    value: (
      <span className="inline-flex items-center gap-2">
        Summit Carriers
        <CellTag tone="deep">Recommended</CellTag>
      </span>
    ),
  },
  { field: "SCAC", key: true, value: "SUMC" },
  { field: "Lane fit", key: false, value: "CHI → RIV · OCC · best-fit in approved pool" },
  { field: "Sourcing agreement", key: true, value: "CHI-RIV-2026 · within volume commitment" },
  { field: "Scorecard", key: false, value: "On-time 96% · defect 1.4% · no open disputes" },
];

function RecommendedCarrierPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Recommended carrier & agreement" />
      <div className="mt-4">
        <DataTable
          rows={recommendedCarrier}
          rowKey={(r) => r.field}
          highlight={(r) => r.key}
          openDoc={(_r, i) => (i === 0 ? <RateCardDoc /> : null)}
          openTitle={() => "Carrier rate card · Summit Carriers"}
          columns={[
            { header: "Field", className: "w-44", cell: (r) => <span className="font-semibold">{r.field}</span> },
            { header: "Detail", cell: (r) => r.value },
          ]}
        />
      </div>
    </article>
  );
}

function TenderTermsPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Tender terms" />
      <div className="mt-4">
        <DataTable
          rows={tenderTerms}
          rowKey={(t) => t.label}
          openDoc={(_t, i) => (i === 0 ? <RateCardDoc /> : null)}
          openTitle={() => "Lane rate card · CHI → RIV"}
          columns={[
            { header: "Term", className: "w-40", cell: (t) => <span className="font-semibold">{t.label}</span> },
            { header: "Detail", cell: (t) => t.value },
          ]}
        />
      </div>
    </article>
  );
}

function CommitmentHeadroomPanel() {
  const usedPct = (COMMIT.used / COMMIT.total) * 100;
  const commitPct = (COMMIT.commit / COMMIT.total) * 100;
  const headroom = COMMIT.total - COMMIT.used - COMMIT.commit;
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader
        label="Volume commitment · lane CHI → RIV"
        right={<span className="text-[11px] text-mute">Sourcing agreement · this period</span>}
      />
      <div className="mt-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <span className="text-[22px] font-bold text-surface-deep tabular-nums leading-none">{lbs(headroom)}</span>
            <span className="text-[12px] text-mute ml-2">headroom after this tender</span>
          </div>
          <span className="text-[11px] text-mute tabular-nums">of {lbs(COMMIT.total)}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-surface-fog overflow-hidden flex">
          <div className="h-full bg-surface-deep" style={{ width: `${usedPct}%` }} title="Tendered to date" />
          <div className="h-full bg-surface-sage" style={{ width: `${commitPct}%` }} title="This tender" />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2.5 text-[11px]">
          <span className="flex items-center gap-1.5 text-mute">
            <span className="w-2.5 h-2.5 rounded-sm bg-surface-deep" /> Tendered {lbs(COMMIT.used)}
          </span>
          <span className="flex items-center gap-1.5 text-mute">
            <span className="w-2.5 h-2.5 rounded-sm bg-surface-sage" /> This tender {lbs(COMMIT.commit)}
          </span>
          <span className="flex items-center gap-1.5 text-mute">
            <span className="w-2.5 h-2.5 rounded-sm bg-surface-fog border border-divider" /> Free {lbs(headroom)}
          </span>
        </div>
      </div>
    </article>
  );
}

function HistoryPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Prior tenders · Summit Carriers" />
      <div className="mt-4">
        <DataTable
          rows={history}
          rowKey={(r) => r.tnd}
          openDoc={(_r, i) => (i === 0 ? <CarrierTenderDoc /> : null)}
          openTitle={() => "Carrier tender · TND-77188"}
          columns={[
            { header: "Tender", cell: (r) => <span className="font-semibold text-surface-deep">{r.tnd}</span> },
            { header: "Lane", cell: (r) => r.lane },
            { header: "Rate", align: "right", cell: (r) => r.value },
            { header: "Result", align: "right", cell: (r) => <span className="text-mute">{r.result}</span> },
          ]}
        />
      </div>
    </article>
  );
}

type Scorecard = { carrier: string; lanes: string; ontime: string; defect: string; capacity: string; tone: "ok" | "warn" | "risk" };
const scorecard: Scorecard[] = [
  { carrier: "Summit Carriers", lanes: "CHI→RIV · MEM→NGT", ontime: "96%", defect: "1.4%", capacity: "Open today", tone: "ok" },
  { carrier: "Cedar Haul Logistics", lanes: "MEM→NGT · STL→RIV", ontime: "93%", defect: "2.1%", capacity: "Open today", tone: "ok" },
  { carrier: "Ironwood Freight Lines", lanes: "STL→RIV · CHI→RIV", ontime: "91%", defect: "3.0%", capacity: "Tight", tone: "warn" },
  { carrier: "Harbor Point Carriers", lanes: "CHI→RIV", ontime: "88%", defect: "4.2%", capacity: "Tight", tone: "risk" },
];

function ScorecardPanel() {
  const toneTag = { ok: "sage", warn: "amber", risk: "red" } as const;
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader
        label="Carrier scorecard · approved pool"
        right={<span className="text-[11px] text-mute">4 approved · ranked for CHI → RIV</span>}
      />
      <div className="mt-4">
        <DataTable
          rows={scorecard}
          rowKey={(s) => s.carrier}
          highlight={(s) => s.carrier === "Summit Carriers"}
          columns={[
            { header: "Carrier", cell: (s) => <span className="font-semibold text-surface-deep">{s.carrier}</span> },
            { header: "Lanes served", cell: (s) => <span className="text-mute">{s.lanes}</span> },
            { header: "On-time", align: "right", cell: (s) => s.ontime },
            { header: "Defect rate", align: "right", cell: (s) => s.defect },
            { header: "Capacity", align: "right", cell: (s) => <CellTag tone={toneTag[s.tone]}>{s.capacity}</CellTag> },
          ]}
        />
        <p className="text-[12px] text-mute leading-snug mt-3">
          Ranking on lane economics, on-time and invoice-defect history keeps recommendations on the best-fit carrier —
          on-time across the pool is up to 94% since the agent began advising tenders.
        </p>
      </div>
    </article>
  );
}

type OpenTender = { tnd: string; lane: string; status: string; pickup: string; tone: "ok" | "warn" | "risk" };
const openTenders: OpenTender[] = [
  { tnd: "TND-77310", lane: "CHI → RIV · OCC", status: "Accepted · driver assigned, en route to pickup", pickup: "On track", tone: "ok" },
  { tnd: "TND-76840", lane: "STL → RIV · DLK", status: "Awaiting carrier acceptance · response window closing", pickup: "At risk", tone: "risk" },
  { tnd: "TND-76980", lane: "MEM → NGT · mixed paper", status: "Accepted · pickup confirmation pending", pickup: "2h to window", tone: "warn" },
  { tnd: "TND-75540", lane: "CHI → RIV · OCC", status: "Capacity tight · backhaul match suggested", pickup: "Re-tender advised", tone: "warn" },
];

function OpenTendersPanel() {
  const toneTag = { ok: "sage", warn: "amber", risk: "red" } as const;
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader
        label="Open tenders & pickups"
        right={<span className="text-[11px] text-mute">62 open · 18 tendered today</span>}
      />
      <div className="mt-4">
        <DataTable
          rows={openTenders}
          rowKey={(o) => o.tnd}
          highlight={(o) => o.tnd === "TND-77310"}
          columns={[
            { header: "Tender", cell: (o) => <span className="font-semibold text-surface-deep">{o.tnd}</span> },
            { header: "Lane", cell: (o) => o.lane },
            { header: "Status", cell: (o) => <span className="text-mute">{o.status}</span> },
            { header: "Pickup", align: "right", cell: (o) => <CellTag tone={toneTag[o.tone]}>{o.pickup}</CellTag> },
          ]}
        />
        <p className="text-[12px] text-mute leading-snug mt-3">
          Tracking acceptance and pickup windows holds carrier on-time pickup at 92% — up from 74% before the agent
          began chasing acceptances.
        </p>
      </div>
    </article>
  );
}

function TenderContext() {
  return (
    <div className={cn("rounded-md border border-divider bg-surface-fog/60 px-4 py-3")}>
      <div className="text-[11px] tracking-[0.05em] uppercase text-surface-deep font-bold">Validated lane</div>
      <div className="text-[13px] font-bold text-ink mt-1">CHI → RIV · OCC · 22.0 t</div>
      <p className="text-[12.5px] text-ink leading-snug mt-1">
        Validated by the Rate &amp; Surcharge agent · expected-cost envelope $3,640 all-in · pickup 2026-06-19 at the
        Riverside mill. Ready to recommend a carrier and draft the tender.
      </p>
    </div>
  );
}

export function POConsole() {
  const { setAgentOutput, go } = useApp();
  const [open, setOpen] = React.useState(false);

  const decide = (status: AgentOutputStatus) => {
    setAgentOutput("po", status);
    if (status === "approved") go({ kind: "workspace", flow: "belt" });
    else setOpen(false);
  };

  return (
    <>
      <AgentConsole config={config} onOpenRun={() => setOpen(true)}>
        <QueuePanel
          title="Validated lanes · ready to tender"
          badge="1 ready"
          items={queue}
          onOpen={() => setOpen(true)}
        />
        <RecommendedCarrierPanel />
        <TenderTermsPanel />
        <CommitmentHeadroomPanel />
        <ScorecardPanel />
        <OpenTendersPanel />
        <HistoryPanel />
      </AgentConsole>

      {open && (
        <CeremonyModal
          title="CHI → RIV · recommend a carrier & draft the tender"
          subtitle="Validated by Rate & Surcharge · OCC · 22.0 t · $3,640 all-in · 2026-06-19"
          context={<TenderContext />}
          ceremony={{
            agentLabel: "Carrier Tender Advisor · drafting the tender",
            steps: [
              "Reading the validated lane and expected-cost envelope",
              "Ranking the approved carrier pool on lane economics",
              "Checking sourcing-agreement compliance and volume commitment",
              "Scoring on-time and prior invoice-defect history",
              "Recommending Summit Carriers · drafting rate, equipment and pickup window",
              "Drafting carrier tender TND-77310 for release",
            ],
            doneSummary: (
              <>
                Best-fit carrier · <span className="font-bold">Summit Carriers</span> at $3,640 all-in (−6% vs lane) ·
                within commitment and the L2 limit. TND-77310 drafted and ready to release.
              </>
            ),
            document: <CarrierTenderDoc />,
            footerIntro: "The agent will rank the approved pool, check sourcing compliance and draft every tender field.",
            approveLabel: "Release tender to carrier",
          }}
          onClose={() => setOpen(false)}
          onDecide={decide}
        />
      )}
    </>
  );
}
