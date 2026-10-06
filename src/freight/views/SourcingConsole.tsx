import * as React from "react";
import { useApp, type AgentOutputStatus } from "@/freight/state";
import { cn } from "@/freight/lib/utils";
import { RateCardDoc, RateValidationDoc } from "@/freight/components/docs/freight/FreightDocs";
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
 * Rate & Surcharge Engine console.
 *
 * Validates every shipment's lane rate, fuel surcharge and accessorials against
 * the contracted rate card RC-OCC-2026 and tolerance thresholds, normalising
 * flat-fee-vs-percentage surcharges so quotes are apples-to-apples. Data
 * surface: validation queue · rate-card lanes · contracted carrier terms ·
 * recent validation outcomes · surcharge-basis checks. The ceremony reveals the
 * rate comparison and hands a validated rate basis to Carrier Tender.
 * ────────────────────────────────────────────────────────────────────────── */

const queue: QueueItem[] = [
  {
    id: "val-7741",
    primary: "VAL-7741 · CHI→RIV (OCC)",
    secondary: "Surcharge billed flat vs contracted 22% · out of tolerance · sign-off needed",
    meta: "09:06",
    readyTag: "Ready to validate",
    actionable: true,
  },
  {
    id: "val-7738",
    primary: "MEM→NGT (mixed paper) · surcharge mismatch",
    secondary: "Fuel surcharge 24.6% vs contracted 22% · outside ±2% band",
    meta: "08:10",
    handledTag: "Flagged · awaiting review",
  },
  {
    id: "val-7720",
    primary: "DET→RIV (DLK) · rate check",
    secondary: "Line haul + surcharge within tolerance · validated basis issued",
    meta: "Yesterday",
    handledTag: "Cleared · in tolerance",
  },
];

type Lane = { lane: string; grade: string; rate: string; surcharge: string; tag: "In tolerance" | "Out of tolerance" | "Review"; match?: boolean };
const pool: Lane[] = [
  { lane: "CHI→RIV", grade: "OCC", rate: "$2,640 billed vs $2,640 RC", surcharge: "Flat $640 vs 22% ($581)", tag: "Out of tolerance", match: true },
  { lane: "MEM→NGT", grade: "Mixed paper", rate: "$3,120 billed vs $3,060 RC", surcharge: "24.6% vs 22%", tag: "Out of tolerance" },
  { lane: "DET→RIV", grade: "DLK", rate: "$1,980 billed vs $1,975 RC", surcharge: "22.1% vs 22%", tag: "In tolerance" },
];

type Term = { ref: string; carrier: string; terms: string; match?: boolean };
const contracts: Term[] = [
  { ref: "RC-OCC-2026", carrier: "Summit Carriers", terms: "Primary OCC lanes · line haul per RC-OCC-2026 · fuel 22% of line haul · ±2% tolerance", match: true },
  { ref: "RC-OCC-2026", carrier: "Ironwood Freight Lines", terms: "Backup capacity · same rate card · fuel 22% of line haul · ±2% tolerance" },
  { ref: "—", carrier: "Cedar Haul Logistics", terms: "Spot overflow · rate quoted per load · surcharge basis validated on receipt" },
];

type ValHist = { ref: string; lane: string; outcome: string };
const rfqHistory: ValHist[] = [
  { ref: "VAL-7705", lane: "CHI→RIV (OCC)", outcome: "Cleared · surcharge normalised to 22%" },
  { ref: "VAL-7691", lane: "MEM→NGT (mixed paper)", outcome: "Out of tolerance · flat surcharge corrected" },
  { ref: "VAL-7677", lane: "DET→NGT (DLK)", outcome: "Cleared · line haul within ±2%" },
];

type Basis = { carrier: string; lineHaul: string; surcharge: string; accessorials: string };
const risk: Basis[] = [
  { carrier: "Summit Carriers", lineHaul: "Per RC-OCC-2026", surcharge: "22% of line haul", accessorials: "Detention · capped" },
  { carrier: "Ironwood Freight Lines", lineHaul: "Per RC-OCC-2026", surcharge: "22% of line haul", accessorials: "Detention · capped" },
  { carrier: "Cedar Haul Logistics", lineHaul: "Spot quote", surcharge: "Validated on receipt", accessorials: "Itemised · reviewed" },
];

const outputMeta: OutputMeta = {
  none: { label: "No basis issued yet", kind: "neutral", note: "Open the validation to check the lane rate and surcharge." },
  pending: { label: "On pending", kind: "neutral", note: "Validation VAL-7741 parked — resume from the queue." },
  approved: {
    label: "Validated · handed off",
    kind: "active",
    note: "Validated rate basis for CHI→RIV handed to Carrier Tender.",
  },
  rejected: { label: "Rejected", kind: "critical", note: "Basis rejected — re-rate the lane or dispute the surcharge." },
  escalated: { label: "Escalated", kind: "critical", note: "Routed to the freight settlement manager with the rate analysis." },
};

const chatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the Rate & Surcharge Engine — I validate each lane rate and fuel surcharge against RC-OCC-2026 and flag anything outside the ±2% tolerance. Ask me about this validation.",
        children: (
          <div className="text-[12.5px] text-ink leading-[19px]">
            <div className="text-mute mb-1">For example —</div>
            <ul className="space-y-0.5">
              <li>· Why CHI→RIV is out of tolerance</li>
              <li>· How flat vs percentage surcharges are normalised</li>
              <li>· What would go to a settlement manager</li>
            </ul>
          </div>
        ),
      },
    ],
    chips: ["Why is CHI→RIV out of tolerance?", "How are surcharges normalised?", "What would escalate this?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "The carrier billed a flat $640 fuel surcharge on CHI→RIV, but the contract sets fuel at 22% of line haul — on a $2,640 line haul that should be $581. The $59 gap puts it well outside the ±2% band, so the line is flagged for sign-off.",
      },
    ],
    chips: ["How are surcharges normalised?", "What would escalate this?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "I restate every surcharge on a single basis — 22% of line haul — so a flat-fee bill and a percentage bill can be compared apples-to-apples. Once normalised, the line haul and surcharge are each checked against the ±2% tolerance on RC-OCC-2026.",
      },
    ],
    chips: ["What would escalate this?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "A line outside tolerance after normalisation, a new accessorial not on the rate card, or a spot-quote basis I can't reconcile would stop the auto-path and route to a human settlement manager with the full rate analysis attached.",
      },
    ],
  },
];

const config: ConsoleConfig = {
  id: "sourcing",
  statLabel: "Validations",
  artifactLabel: "Validated rate basis · CHI→RIV (OCC)",
  outputMeta,
  chatName: "Rate & Surcharge",
  chatScript,
  runRole: "Validates the lane rate and fuel surcharge against the contracted rate card.",
  openRunLabel: "Open the rate validation",
};

const tagTone = { "In tolerance": "sage", "Out of tolerance": "neutral", Review: "deep" } as const;

function AwardNote() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-surface-deep font-medium">
      <span className="w-3 h-3 rounded-sm bg-surface-mint border border-surface-deep/40" />
      Validated basis
    </span>
  );
}

function SupplierPoolPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Rate & surcharge validation" right={<AwardNote />} />
      <div className="mt-4">
        <DataTable
          rows={pool}
          rowKey={(s) => s.lane}
          highlight={(s) => !!s.match}
          openDoc={(_s, i) => (i === 0 ? <RateCardDoc /> : null)}
          openTitle={() => "Rate card · RC-OCC-2026"}
          columns={[
            {
              header: "Lane",
              cell: (s) => (
                <span className={cn("font-semibold", s.match && "text-surface-deep")}>{s.lane}</span>
              ),
            },
            { header: "Verdict", cell: (s) => <CellTag tone={tagTone[s.tag]}>{s.tag}</CellTag> },
            { header: "Line haul", cell: (s) => s.rate },
            { header: "Fuel surcharge", cell: (s) => s.surcharge },
            { header: "Grade", align: "right", cell: (s) => s.grade },
          ]}
        />
      </div>
    </article>
  );
}

function RiskPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Contracted surcharge basis" />
      <div className="mt-4">
        <DataTable
          rows={risk}
          rowKey={(r) => r.carrier}
          openDoc={(_r, i) => (i === 0 ? <RateValidationDoc /> : null)}
          openTitle={() => "Surcharge basis · RC-OCC-2026"}
          columns={[
            { header: "Carrier", cell: (r) => <span className="font-semibold">{r.carrier}</span> },
            { header: "Line haul", cell: (r) => r.lineHaul },
            { header: "Fuel surcharge", cell: (r) => r.surcharge },
            { header: "Accessorials", cell: (r) => r.accessorials },
          ]}
        />
      </div>
    </article>
  );
}

function ContractsPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Contracted carrier terms" right={<AwardNote />} />
      <div className="mt-4">
        <DataTable
          rows={contracts}
          rowKey={(c) => c.carrier}
          highlight={(c) => !!c.match}
          openDoc={(_c, i) => (i === 0 ? <RateCardDoc /> : null)}
          openTitle={() => "Rate card · RC-OCC-2026"}
          columns={[
            {
              header: "Carrier",
              cell: (c) => (
                <span className={cn("font-semibold", c.match && "text-surface-deep")}>{c.carrier}</span>
              ),
            },
            { header: "Terms", cell: (c) => c.terms },
            {
              header: "Rate card",
              align: "right",
              cell: (c) => (c.ref === "—" ? <span className="text-mute">—</span> : c.ref),
            },
          ]}
        />
      </div>
    </article>
  );
}

function RfqHistoryPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Recent validation outcomes" />
      <div className="mt-4">
        <DataTable
          rows={rfqHistory}
          rowKey={(h) => h.ref}
          openDoc={(_h, i) => (i === 0 ? <RateValidationDoc /> : null)}
          openTitle={() => "Rate comparison · VAL-7705"}
          columns={[
            { header: "Validation", cell: (h) => <span className="font-semibold text-surface-deep">{h.ref}</span> },
            { header: "Lane", cell: (h) => h.lane },
            { header: "Outcome", cell: (h) => h.outcome },
          ]}
        />
        <p className="text-[12px] text-mute leading-snug mt-3">
          One in six billed lines this quarter needed a surcharge basis correction before settlement.
        </p>
      </div>
    </article>
  );
}

function SourcingContext() {
  return (
    <div className="rounded-md border border-divider bg-surface-fog/60 px-4 py-3">
      <div className="text-[11px] tracking-[0.05em] uppercase text-surface-deep font-bold">Rate validation</div>
      <div className="text-[13px] font-bold text-ink mt-1">VAL-7741 · CHI→RIV · OCC</div>
      <p className="text-[12.5px] text-ink leading-snug mt-1">
        Billed shipment · Summit Carriers · line haul $2,640 matches RC-OCC-2026, but the fuel surcharge is billed as a
        flat $640 against a contracted 22% of line haul ($581). The line falls outside the ±2% tolerance and needs human
        sign-off.
      </p>
    </div>
  );
}

export function SourcingConsole() {
  const { setAgentOutput, go } = useApp();
  const [open, setOpen] = React.useState(false);

  const decide = (status: AgentOutputStatus) => {
    setAgentOutput("sourcing", status);
    if (status === "approved") go({ kind: "workspace", flow: "belt" });
    else setOpen(false);
  };

  return (
    <>
      <AgentConsole config={config} onOpenRun={() => setOpen(true)}>
        <QueuePanel title="Rate validations · awaiting sign-off" badge="1 ready" items={queue} onOpen={() => setOpen(true)} />
        <SupplierPoolPanel />
        <RiskPanel />
        <ContractsPanel />
        <RfqHistoryPanel />
      </AgentConsole>

      {open && (
        <CeremonyModal
          title="VAL-7741 · validate the lane rate & surcharge"
          subtitle="Billed shipment · CHI→RIV (OCC) · checked against RC-OCC-2026"
          context={<SourcingContext />}
          ceremony={{
            agentLabel: "Rate & Surcharge Engine · validating the lane",
            steps: [
              "Reading billed shipment VAL-7741 · CHI→RIV (OCC)",
              "Matching the lane to rate card RC-OCC-2026",
              "Comparing billed line haul against the contracted rate",
              "Normalising the flat fuel surcharge to 22% of line haul",
              "Checking line haul and surcharge against the ±2% tolerance",
              "Flagging out-of-tolerance lines and drafting the rate basis",
            ],
            doneSummary: (
              <>
                <span className="font-bold">CHI→RIV (OCC)</span> line haul matches RC-OCC-2026, but the fuel surcharge
                is billed flat ($640) against the contracted 22% ($581) — flagged out of tolerance. The validated rate
                basis is ready to hand to Carrier Tender.
              </>
            ),
            document: <RateValidationDoc />,
            footerIntro:
              "The agent will match the rate card, normalise the surcharge, flag out-of-tolerance lines and draft a validated rate basis.",
            approveLabel: "Approve basis & hand off",
          }}
          onClose={() => setOpen(false)}
          onDecide={decide}
        />
      )}
    </>
  );
}
