import * as React from "react";
import { AlertTriangle, Check } from "lucide-react";
import { useApp, type AgentOutputStatus } from "@/freight/state";
import { cn } from "@/freight/lib/utils";
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
 * Load Capture Agent console — load-packet assembly before invoicing.
 *
 * Standalone control surface, not a step inside a run. It assembles a
 * standardized digital packet for every load before invoicing — bill of lading
 * (BOL), pickup confirmation, shipment reference and the mill receiving /
 * weigh-bridge ticket — and reconciles estimated-vs-actual (cube-out) weight,
 * flagging missing evidence, manual-entry errors and duplicate shipment
 * references. The live case is shipment SHP-55012 (Summit Carriers, OCC into
 * Riverside mill): scaled 20.0 t against an estimated 22.0 t — a −2.0 t cube-out
 * variance a human resolves before the packet hands off to Freight Settlement.
 * ────────────────────────────────────────────────────────────────────────── */

const queue: QueueItem[] = [
  {
    id: "wv-shp-55012",
    primary: "SHP-55012 · weight variance",
    secondary: "Summit Carriers · OCC · est 22.0 t vs scaled 20.0 t · cube-out −2.0 t",
    meta: "09:14",
    readyTag: "Reconcile & approve",
    actionable: true,
    flagged: true,
    priority: "high",
  },
  {
    id: "me-shp-54977",
    primary: "Missing evidence · SHP-54977",
    secondary: "Mixed paper · Eastbrook mill · receiving ticket attached · packet complete",
    meta: "1h",
    handledTag: "Resolved",
  },
  {
    id: "dr-shp-54812",
    primary: "Duplicate reference · SHP-54812",
    secondary: "Re-keyed BOL matched to original · second packet voided",
    meta: "3h",
    handledTag: "Cleared",
  },
];

/* ── The four packet checks on the live load ── */
type Check = { check: string; result: string; tone: "ok" | "flag" };
const checks: Check[] = [
  { check: "Bill of lading (BOL)", result: "BOL-SUMC-44812 · attached · matches shipment reference", tone: "ok" },
  { check: "Pickup confirmation", result: "Summit Carriers · pickup confirmed at origin", tone: "ok" },
  { check: "Weight reconciliation", result: "Scaled 20.0 t vs estimated 22.0 t · cube-out −2.0 t over tolerance", tone: "flag" },
  { check: "Receiving ticket", result: "WB-RIV-44812 · weigh-bridge ticket attached · Riverside mill", tone: "ok" },
];

type Quality = { label: string; pct: number; tone: "ok" | "warn" };
const quality: Quality[] = [
  { label: "BOL attached", pct: 0.97, tone: "ok" },
  { label: "Receiving ticket matched", pct: 0.93, tone: "ok" },
  { label: "Weight within tolerance", pct: 0.89, tone: "ok" },
  { label: "Duplicate-reference-free", pct: 0.71, tone: "warn" },
];

type Onb = { vendor: string; status: string; done: boolean };
const onboarding: Onb[] = [
  { vendor: "SHP-55020 · DLK · Eastbrook mill", status: "Packet complete", done: true },
  { vendor: "SHP-55018 · mixed paper · Riverside mill", status: "Awaiting receiving ticket", done: false },
  { vendor: "SHP-55014 · OCC · Eastbrook mill", status: "Packet complete", done: true },
];

const outputMeta: OutputMeta = {
  none: { label: "Not reviewed yet", kind: "neutral", note: "Open the load to reconcile the cube-out variance before the packet goes to settlement." },
  pending: { label: "On hold", kind: "neutral", note: "Variance review parked — resume from the worklist." },
  approved: { label: "Packet approved", kind: "active", note: "Load packet for SHP-55012 sealed and handed off to Freight Settlement." },
  rejected: { label: "Variance held · settlement paused", kind: "critical", note: "Cube-out −2.0 t unresolved · SHP-55012 stays out of settlement pending carrier confirmation." },
  escalated: { label: "Escalated", kind: "critical", note: "Routed to the logistics coordinator and the carrier desk." },
};

const chatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the Load Capture Agent — I assemble a standardized digital packet for every load before invoicing and reconcile estimated against actual weight. The live one is shipment SHP-55012 with a cube-out variance. Ask me about it.",
        children: (
          <div className="text-[12.5px] text-ink leading-[19px]">
            <div className="text-mute mb-1">For example —</div>
            <ul className="space-y-0.5">
              <li>· Why is the load flagged</li>
              <li>· What's in the packet</li>
              <li>· What happens at settlement</li>
            </ul>
          </div>
        ),
      },
    ],
    chips: ["Why is the load flagged?", "What's in the packet?", "What happens at settlement?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "Summit Carriers booked SHP-55012 at an estimated 22.0 t of OCC, but the Riverside mill weigh-bridge scaled it at 20.0 t — a −2.0 t cube-out variance, over tolerance. Paying on the estimate would overpay the carrier, so I held the packet before handoff.",
      },
    ],
    chips: ["What's in the packet?", "What happens at settlement?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "The BOL (BOL-SUMC-44812), pickup confirmation and the weigh-bridge receiving ticket (WB-RIV-44812) are all attached and matched to the shipment reference — no missing evidence and no duplicate reference. The one open item is the weight: scaled 20.0 t against the estimated 22.0 t.",
      },
    ],
    chips: ["What happens at settlement?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "Until a human resolves the variance, SHP-55012 stays out of Freight Settlement. Approve the scaled 20.0 t and the packet seals and hands off; hold it, and settlement waits on a carrier confirmation. Either way, nothing settles on an unverified estimate.",
      },
    ],
  },
];

const config: ConsoleConfig = {
  id: "vendor",
  statLabel: "Packets assembled",
  artifactLabel: "Load packet · SHP-55012",
  outputMeta,
  chatName: "Load Capture",
  chatScript,
  runTitle: "This weight variance is holding a load out of settlement",
  runRole: "Shipment SHP-55012 stays out of Freight Settlement until the −2.0 t cube-out variance is reconciled or held.",
  openRunLabel: "Open the settlement hold",
  standalone: true,
};

/* ── The produced load-packet artifact, shown in the ceremony ──────────── */
function BankChangeVerification() {
  return (
    <div className="rounded-md border border-divider overflow-hidden bg-white text-[12.5px]">
      <div className="px-4 py-2.5 border-b border-divider bg-surface-fog/60">
        <div className="text-[11px] tracking-[0.06em] uppercase text-surface-deep font-bold">
          Load packet · SHP-55012
        </div>
        <div className="text-[11px] text-mute mt-0.5">Summit Carriers · OCC into Riverside mill · captured 2026-06-03 09:12</div>
      </div>

      <div className="px-4 py-3 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-[#cfe0f5] bg-[#eaf2fb] px-3 py-2.5">
          <div className="text-[10px] tracking-[0.06em] uppercase text-[#0a6ed1] font-bold">Estimated weight</div>
          <div className="text-[13px] font-bold text-ink mt-0.5 tabular-nums">22.0 t</div>
          <div className="text-[11px] text-mute">Booked on BOL-SUMC-44812</div>
        </div>
        <div className="rounded-md border border-surface-rose bg-surface-rose/30 px-3 py-2.5">
          <div className="text-[10px] tracking-[0.06em] uppercase text-mark-red font-bold">Scaled weight</div>
          <div className="text-[13px] font-bold text-ink mt-0.5 tabular-nums">20.0 t</div>
          <div className="text-[11px] text-mark-red">Cube-out −2.0 t · over tolerance</div>
        </div>
      </div>

      <div className="px-4 pb-3 space-y-1.5">
        {checks.map((c) => (
          <div key={c.check} className="flex items-start gap-2">
            {c.tone === "ok" ? (
              <Check size={14} className="text-surface-deep mt-[1px] shrink-0" strokeWidth={3} />
            ) : (
              <AlertTriangle size={14} className="text-mark-red mt-[1px] shrink-0" />
            )}
            <span className="text-mute w-40 shrink-0">{c.check}</span>
            <span className={cn("flex-1", c.tone === "flag" ? "text-mark-red font-medium" : "text-ink")}>{c.result}</span>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-divider bg-surface-rose/20">
        <div className="text-[11px] tracking-[0.06em] uppercase text-mark-red font-bold">Recommendation</div>
        <p className="text-[12.5px] text-ink leading-snug mt-1">
          Settle on the scaled weight, not the estimate. Hold <span className="font-bold">SHP-55012</span> out of
          settlement — cube-out <span className="font-bold tabular-nums">−2.0 t</span>. Approve the packet only against the
          weigh-bridge ticket <span className="font-bold">WB-RIV-44812</span> and a carrier confirmation of the actual load.
        </p>
      </div>
    </div>
  );
}

function ChecksPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Packet checks · SHP-55012" right={<span className="text-[11px] text-mute">Summit Carriers</span>} />
      <div className="mt-4">
        <DataTable
          rows={checks}
          rowKey={(c) => c.check}
          highlight={(c) => c.tone === "flag"}
          openDoc={(c) => (c.tone === "flag" ? <BankChangeVerification /> : null)}
          openTitle={() => "Load packet · SHP-55012"}
          columns={[
            { header: "Check", className: "w-52", cell: (c) => <span className="font-semibold">{c.check}</span> },
            { header: "Result", cell: (c) => c.result },
            {
              header: "",
              align: "right",
              className: "w-20",
              cell: (c) => <CellTag tone={c.tone === "ok" ? "sage" : "red"}>{c.tone === "ok" ? "Clear" : "Flag"}</CellTag>,
            },
          ]}
        />
      </div>
    </article>
  );
}

function QualityPanel() {
  const barTone = { ok: "bg-surface-deep", warn: "bg-surface-sage" };
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Load-packet completeness" right={<span className="text-[11px] text-mute">1,204 assembled</span>} />
      <div className="mt-4 space-y-3">
        {quality.map((q) => (
          <div key={q.label}>
            <div className="flex items-center justify-between text-[11.5px] mb-1">
              <span className={cn(q.tone === "warn" ? "text-surface-deep font-medium" : "text-ink")}>{q.label}</span>
              <span className="tabular-nums text-mute">{Math.round(q.pct * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-fog overflow-hidden">
              <div className={cn("h-full rounded-full", barTone[q.tone])} style={{ width: `${q.pct * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-mute leading-snug mt-3 pt-3 border-t border-divider">
        Manual BOL entry produces ~30–40% of load packets with a typo or duplicate reference — clearing them before settlement stops disputes at the source.
      </p>
    </article>
  );
}

function OnboardingPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Recent load packets" />
      <div className="mt-4">
        <DataTable
          rows={onboarding}
          rowKey={(o) => o.vendor}
          columns={[
            { header: "Load", cell: (o) => <span className="font-semibold">{o.vendor}</span> },
            {
              header: "Status",
              align: "right",
              cell: (o) => <CellTag tone={o.done ? "sage" : "neutral"}>{o.status}</CellTag>,
            },
          ]}
        />
      </div>
    </article>
  );
}

function BankChangeContext() {
  return (
    <div className="rounded-md border border-divider bg-surface-fog/60 px-4 py-3">
      <div className="text-[11px] tracking-[0.05em] uppercase text-surface-deep font-bold">Weight variance</div>
      <div className="text-[13px] font-bold text-ink mt-1">SHP-55012 · Summit Carriers · OCC into Riverside mill</div>
      <p className="text-[12.5px] text-ink leading-snug mt-1">
        The load was booked at an estimated 22.0 t, but the Riverside mill weigh-bridge (WB-RIV-44812) scaled it at 20.0 t —
        a −2.0 t cube-out variance, over tolerance. Settling on the estimate would overpay the carrier, so the packet is
        held out of Freight Settlement until a human reconciles the weight.
      </p>
    </div>
  );
}

export function VendorConsole() {
  const { setAgentOutput, go } = useApp();
  const [open, setOpen] = React.useState(false);

  const decide = (status: AgentOutputStatus) => {
    setAgentOutput("vendor", status);
    setOpen(false);
  };

  return (
    <>
      <AgentConsole config={config} onOpenRun={() => go({ kind: "workspace", flow: "gearbox" })}>
        <QueuePanel title="Loads missing evidence or over weight tolerance" badge="1 to reconcile" items={queue} onOpen={() => setOpen(true)} />
        <ChecksPanel />
        <QualityPanel />
        <OnboardingPanel />
      </AgentConsole>

      {open && (
        <CeremonyModal
          title="SHP-55012 · weight variance"
          subtitle="Summit Carriers · OCC · est 22.0 t vs scaled 20.0 t · cube-out −2.0 t"
          flagged
          context={<BankChangeContext />}
          ceremony={{
            agentLabel: "Load Capture · assembling the packet",
            steps: [
              "Reading the bill of lading (BOL-SUMC-44812) and pickup confirmation",
              "Matching the Riverside mill receiving ticket (WB-RIV-44812)",
              "Checking the shipment reference for a duplicate",
              "Reconciling scaled 20.0 t against the estimated 22.0 t",
              "Flagging the −2.0 t cube-out variance for review",
            ],
            doneSummary: (
              <>
                Packet complete — BOL, pickup and receiving ticket all matched. One open item: scaled{" "}
                <span className="font-bold">20.0 t</span> against the estimated <span className="font-bold">22.0 t</span>,
                a <span className="font-bold">−2.0 t</span> cube-out variance over tolerance.
              </>
            ),
            document: <BankChangeVerification />,
            footerIntro: "The agent assembles the packet, matches the evidence and reconciles the weight; a human approves the packet or holds the variance.",
            approveLabel: "Approve the packet",
            decidePrompt: "Decide on the weight variance",
          }}
          onClose={() => setOpen(false)}
          onDecide={decide}
        />
      )}
    </>
  );
}
