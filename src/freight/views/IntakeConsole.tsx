import * as React from "react";
import { Flag, Check, Clock, AlertTriangle, X, FileText, ChevronRight, Bot, ArrowRight } from "lucide-react";
import { useApp } from "@/freight/state";
import { agentsById } from "@/freight/data/agents";
import { cn } from "@/freight/lib/utils";
import { AIDot } from "@/freight/components/ai/AIDot";
import { SpringIn } from "@/freight/components/ai/SpringIn";
import { Spinner } from "@/freight/components/ai/Spinner";
import { StatusPill } from "@/freight/components/blocks/StatusPill";
import { PillButton } from "@/freight/components/blocks/PillButton";
import { TopRow } from "@/freight/components/blocks/TopRow";
import { DataTable, CellTag, DocPreviewModal } from "@/freight/components/blocks/DataTable";
import { AutonomyControl } from "@/freight/components/agents/AutonomyControl";
import { AgentChat, type ChatTurn } from "@/freight/components/agents/AgentChat";
import { LaneIntakePacket } from "@/freight/components/docs/freight/FreightDocs";

/* ──────────────────────────────────────────────────────────────────────────
 * Lane Intake Orchestrator console — the reference build.
 *
 * Left column: slim hero · autonomy dial+gear · output/handoff status ·
 * pickup-requirement queue · lane master + movement-pattern panels. Right rail:
 * the scripted AgentChat. Clicking the flagged requirement opens the centre
 * modal whose ceremony reads → "Run AI classification" → stepped animation →
 * lane-packet reveal → Approve / Pending / Escalate / Reject. Approving hands
 * lane FRT-48201 to Rate & Surcharge and jumps into the live run.
 * ────────────────────────────────────────────────────────────────────────── */

/* ── Pickup-requirement queue — the inbox this console reads ───────────────── */

type IntakeRequest = {
  id: string;
  from: string;
  fromRole: string;
  subject: string;
  preview: string;
  body: string[];
  time: string;
  unread: boolean;
  flagged?: boolean;
  priority?: "high" | "normal";
  /** Tag shown on already-classified requirements (released, routed, etc.). */
  handledTag?: string;
  /** Only the live requirement runs the classification → lane-packet ceremony. */
  actionable?: boolean;
};

const intakeQueue: IntakeRequest[] = [
  {
    id: "req-occ-chi",
    from: "Chicago DC",
    fromRole: "Dispatch · retail/DC source",
    subject: "Pickup — ~20t baled OCC for Riverside mill, live load",
    preview:
      "About 20 tonnes of baled OCC ready on our dock for the Riverside mill — needs a live load with a receiving slot tomorrow AM…",
    body: [
      "We have roughly 20 tonnes of baled OCC staged on the dock for the Riverside mill. It's clean grade, banded and ready to load.",
      "Please set this up as a live load on lane CHI→RIV with a receiving slot tomorrow morning. We've run this movement before, so it should match a standard pattern.",
      "Thanks — Chicago DC dispatch",
    ],
    time: "09:01",
    unread: true,
    flagged: true,
    priority: "high",
    actionable: true,
  },
  {
    id: "req-mrf-roll",
    from: "Northgate MRF",
    fromRole: "Municipal recycling site",
    subject: "Re: Mixed paper roll-off — Eastbrook mill — scheduled",
    preview:
      "Your mixed-paper roll-off for the Eastbrook mill was matched to an approved municipal pattern and scheduled. No action needed…",
    body: [
      "The mixed-paper roll-off from our municipal site to the Eastbrook mill was matched to an approved movement pattern and scheduled.",
      "Released to Rate & Surcharge automatically against the cited municipal lane. No action needed.",
    ],
    time: "08:42",
    unread: false,
    handledTag: "Auto-classified · roll-off",
  },
  {
    id: "req-retail-backhaul",
    from: "Apex Industrial Supply",
    fromRole: "Broker · retail DC network",
    subject: "OCC backhaul opportunity — lane CHI→RIV",
    preview:
      "An OCC backhaul is open on a retail DC return leg into Riverside — routed to the lane planning queue for review…",
    body: [
      "We have an OCC backhaul opening on a retail DC return leg that lines up with the Riverside mill.",
      "Standard recovered-fibre movement on lane CHI→RIV. Routed to the lane planning queue for a coordinator to confirm the return-leg window.",
    ],
    time: "Yesterday",
    unread: true,
    handledTag: "Routed · lane planning",
  },
  {
    id: "req-broker-rates",
    from: "Ironwood Freight Lines",
    fromRole: "Carrier portal",
    subject: "2026 lane availability — recovered fibre",
    preview:
      "Updated capacity and lead times for the OCC and DLK lanes into the mill network, effective Q3. Approved-pattern coverage maintained…",
    body: [
      "Updated capacity and lead times for our recovered-fibre lanes into the mill network, effective Q3.",
      "Approved-pattern coverage on the CHI→RIV and Northgate lanes is maintained. Filed against the lane master record.",
    ],
    time: "Mon",
    unread: false,
    handledTag: "Filed to lane master",
  },
];

function CardHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <header className="flex items-center gap-2">
      <AIDot size={6} tone="deep" pulse />
      <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
        {label}
      </span>
      {right && <span className="ml-auto">{right}</span>}
    </header>
  );
}

function SlimHero() {
  const agent = agentsById.intake;
  const Icon = agent.icon;
  return (
    <SpringIn>
      <section className="bg-white border border-divider rounded-md p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-surface-deep flex items-center justify-center shrink-0">
            <Icon size={20} strokeWidth={1.9} color="var(--ink-inverse)" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[19px] font-bold text-ink leading-tight">{agent.name}</h1>
              <StatusPill label="Running" kind="active" pulse />
            </div>
            <p className="text-[13px] text-mute leading-snug mt-1 max-w-2xl">{agent.purpose}</p>
          </div>
          <div className="text-right shrink-0 pl-3">
            <div className="text-[18px] font-bold text-surface-deep leading-none">{agent.stat}</div>
            <div className="text-[10px] tracking-[0.06em] uppercase text-mute mt-1">Lanes today</div>
          </div>
        </div>
      </section>
    </SpringIn>
  );
}

const OUTPUT_META: Record<
  string,
  { label: string; kind: "active" | "critical" | "neutral"; note: string }
> = {
  none: {
    label: "No output yet",
    kind: "neutral",
    note: "Open the flagged pickup requirement to draft a lane packet.",
  },
  pending: {
    label: "On pending",
    kind: "neutral",
    note: "Lane FRT-48201 is parked — resume it from the queue when ready.",
  },
  approved: {
    label: "Approved · handed off",
    kind: "active",
    note: "Lane FRT-48201 handed to Rate & Surcharge. It's queued for rate validation.",
  },
  rejected: {
    label: "Rejected",
    kind: "critical",
    note: "Lane FRT-48201 was rejected — nothing handed downstream.",
  },
  escalated: {
    label: "Escalated",
    kind: "critical",
    note: "Routed to a transportation coordinator with the lane draft attached.",
  },
};

function OutputStatusCard() {
  const { agentOutputs, go } = useApp();
  const status = agentOutputs.intake;
  const meta = OUTPUT_META[status];
  // The lane number is only assigned once the agent has drafted the packet.
  // Before that the handoff slot is empty — naming FRT-48201 would be wrong.
  const hasDraft = status !== "none";
  const [docOpen, setDocOpen] = React.useState(false);

  return (
    <article className="bg-white border border-divider rounded-md p-5 space-y-3">
      <CardHeader label="Current output · handoff to Rate & Surcharge" right={<StatusPill label={meta.label} kind={meta.kind} pulse={status === "approved"} />} />
      <div
        className={cn(
          "flex items-center gap-3 rounded-md bg-surface-fog px-3 py-3",
          hasDraft && "cursor-pointer transition-colors hover:bg-surface-mint/40",
        )}
        onClick={hasDraft ? () => setDocOpen(true) : undefined}
      >
        <span
          className={cn(
            "w-9 h-9 rounded-md flex items-center justify-center shrink-0",
            status === "approved" ? "bg-surface-deep text-ink-inverse" : "bg-white border border-divider text-surface-deep",
          )}
        >
          <FileText size={17} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-ink inline-flex items-center gap-1.5">
            {hasDraft ? "Lane packet · FRT-48201" : "Lane packet · not drafted yet"}
            {hasDraft && <ChevronRight size={13} className="text-surface-deep/60 shrink-0" />}
          </div>
          <div className="text-[12px] text-mute leading-snug mt-0.5">{meta.note}</div>
        </div>
        {status === "approved" && (
          <PillButton
            variant="deep"
            size="sm"
            arrow
            onClick={(e) => {
              e.stopPropagation();
              go({ kind: "workspace", flow: "belt" });
            }}
          >
            Open the run
          </PillButton>
        )}
      </div>

      {docOpen && (
        <DocPreviewModal title="Lane packet · FRT-48201" onClose={() => setDocOpen(false)}>
          <LaneIntakePacket />
        </DocPreviewModal>
      )}
    </article>
  );
}

function QueueRow({ request, onOpen }: { request: IntakeRequest; onOpen: (r: IntakeRequest) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(request)}
      className={cn(
        "ui-pill w-full text-left flex gap-3 px-4 py-3 border-b border-divider last:border-b-0 hover:bg-surface-fog",
        request.unread && "bg-surface-mint/15",
      )}
    >
      <span className="pt-1 shrink-0">
        {request.unread ? (
          <span className="w-2 h-2 rounded-full bg-surface-deep block" />
        ) : (
          <span className="w-2 h-2 rounded-full border border-divider block" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn("text-[13px] truncate", request.unread ? "font-bold text-ink" : "text-ink")}>
            {request.from}
          </span>
          <span className="text-[11px] text-mute truncate">· {request.fromRole}</span>
          {request.priority === "high" && (
            <span className="text-[9px] tracking-[0.06em] uppercase font-bold text-mark-red bg-surface-rose/40 px-1.5 py-0.5 rounded shrink-0">
              High
            </span>
          )}
          <span className="ml-auto text-[11px] text-mute shrink-0">{request.time}</span>
        </span>
        <span className="flex items-center gap-1.5 mt-0.5">
          {request.flagged && <Flag size={12} className="text-mark-red shrink-0" fill="currentColor" />}
          <span className={cn("text-[13px] truncate", request.unread ? "font-medium text-ink" : "text-ink")}>
            {request.subject}
          </span>
        </span>
        <span className="block text-[12px] text-mute leading-snug mt-0.5 line-clamp-1">{request.preview}</span>
        {request.handledTag && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] tracking-[0.04em] uppercase font-medium text-surface-deep bg-surface-mint/40 px-2 py-0.5 rounded">
            <Check size={10} strokeWidth={3} /> {request.handledTag}
          </span>
        )}
      </span>
    </button>
  );
}

function PickupQueue({ onOpen }: { onOpen: (r: IntakeRequest) => void }) {
  const unread = intakeQueue.filter((r) => r.unread).length;
  return (
    <article className="bg-white border border-divider rounded-md overflow-hidden">
      <div className="px-4 py-3 border-b border-divider flex items-center gap-2">
        <AIDot size={6} tone="deep" pulse />
        <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
          Pickup queue · awaiting classification
        </span>
        <span className="ml-auto text-[11px] font-bold text-surface-deep bg-surface-mint px-2 py-0.5 rounded-full">
          {unread} new
        </span>
      </div>
      <div>
        {intakeQueue.map((r) => (
          <QueueRow key={r.id} request={r} onOpen={onOpen} />
        ))}
      </div>
    </article>
  );
}

/* ── Lane master + movement patterns — what the agent classifies against ──── */

type LaneRow = {
  lane: string;
  origin: string;
  haul: "Live load" | "Roll-off" | "Backhaul";
  grade: string;
  pattern: "Approved" | "Standard" | "Review";
  /** Highlight the match for the live OCC pickup. */
  match?: boolean;
};

const laneMaster: LaneRow[] = [
  {
    lane: "CHI → RIV",
    origin: "Chicago DC · retail/DC source",
    haul: "Live load",
    grade: "OCC",
    pattern: "Approved",
    match: true,
  },
  {
    lane: "MRF → NGT",
    origin: "Northgate MRF · municipal",
    haul: "Roll-off",
    grade: "Mixed paper",
    pattern: "Approved",
  },
  {
    lane: "RDC → RIV",
    origin: "Retail DC return leg",
    haul: "Backhaul",
    grade: "OCC",
    pattern: "Standard",
  },
  {
    lane: "DLK → NGT",
    origin: "Converter site · broker",
    haul: "Live load",
    grade: "DLK",
    pattern: "Standard",
  },
  {
    lane: "MUN → RIV",
    origin: "Municipal contract · new origin",
    haul: "Roll-off",
    grade: "Mixed paper",
    pattern: "Review",
  },
];

type MovementPattern = {
  title: string;
  ref: string;
  rule: string;
  /** Highlight the pattern that governs the live requirement. */
  match?: boolean;
};

const movementPatterns: MovementPattern[] = [
  {
    title: "OCC live load · approved lanes",
    ref: "MP-OCC-04",
    rule: "Baled OCC on an approved lane with a known origin auto-classifies and releases to Rate & Surcharge.",
    match: true,
  },
  {
    title: "Municipal roll-off",
    ref: "MP-MRF-11",
    rule: "Mixed-paper roll-off from a contracted municipal site releases against the cited municipal lane.",
  },
  {
    title: "Backhaul on return legs",
    ref: "MP-BCK-02",
    rule: "Backhaul movements on a return leg need a coordinator to confirm the return-leg receiving window.",
  },
  {
    title: "New origin first check",
    ref: "MP-ORG-07",
    rule: "Route to an existing approved lane where one covers the grade before opening a new origin.",
  },
  {
    title: "Contaminated or mixed grade",
    ref: "MP-GRD-09",
    rule: "Loads flagged for mixed or contaminated grade are held and drafted to a coordinator for review.",
  },
];

function LaneMasterPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Lane master & approved patterns" right={<MatchNote />} />
      <div className="mt-3">
        <DataTable
          rows={laneMaster}
          rowKey={(l) => l.lane}
          highlight={(l) => !!l.match}
          columns={[
            {
              header: "Lane",
              cell: (l) => (
                <span className={cn("font-bold", l.match ? "text-surface-deep" : "text-ink")}>{l.lane}</span>
              ),
            },
            {
              header: "Pattern",
              className: "w-[112px]",
              cell: (l) => (
                <CellTag tone={l.pattern === "Approved" ? "deep" : l.pattern === "Standard" ? "sage" : "neutral"}>
                  {l.pattern}
                </CellTag>
              ),
            },
            { header: "Origin", cell: (l) => l.origin },
            { header: "Haul · grade", cell: (l) => `${l.haul} · ${l.grade}` },
          ]}
        />
      </div>
    </article>
  );
}

function MovementPatternPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Movement patterns" right={<MatchNote />} />
      <div className="mt-3">
        <DataTable
          rows={movementPatterns}
          rowKey={(p) => p.ref}
          highlight={(p) => !!p.match}
          columns={[
            {
              header: "Pattern",
              cell: (p) => <span className="font-bold text-ink">{p.title}</span>,
            },
            { header: "Reference", className: "w-[110px]", cell: (p) => <span className="tabular-nums">{p.ref}</span> },
            { header: "Rule", cell: (p) => p.rule },
          ]}
        />
      </div>
    </article>
  );
}

/** Tiny legend for the mint row — what the highlight means on these tables. */
function MatchNote() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-mute">
      <span className="w-3 h-3 rounded-sm bg-surface-mint border border-surface-deep/30" />
      Governs this requirement
    </span>
  );
}

/* ── Classification ceremony ───────────────────────────────────────────────── */

const ANALYSIS_STEPS = [
  "Reading the requirement from Chicago DC",
  "Classifying — OCC · live load · lane CHI→RIV",
  "Matching to movement pattern — MP-OCC-04 (approved)",
  "Checking the Riverside mill receiving window — slot available",
  "Drafting lane packet FRT-48201",
];

function AnalysisSteps({ onComplete }: { onComplete: () => void }) {
  const [done, setDone] = React.useState(0);

  React.useEffect(() => {
    if (done >= ANALYSIS_STEPS.length) {
      const t = window.setTimeout(onComplete, 650);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setDone((d) => d + 1), 820);
    return () => window.clearTimeout(t);
  }, [done, onComplete]);

  return (
    <div className="space-y-2.5">
      {ANALYSIS_STEPS.map((label, i) => {
        const isDone = i < done;
        const isActive = i === done;
        return (
          <div key={label} className="flex items-center gap-3">
            <span className="w-5 h-5 flex items-center justify-center shrink-0">
              {isDone ? (
                <span className="w-5 h-5 rounded-md bg-surface-deep text-ink-inverse flex items-center justify-center">
                  <Check size={12} strokeWidth={3} />
                </span>
              ) : isActive ? (
                <Spinner size={16} />
              ) : (
                <span className="w-2 h-2 rounded-full bg-divider" />
              )}
            </span>
            <span
              className={cn(
                "text-[13px] leading-snug",
                isDone ? "text-ink" : isActive ? "text-ink font-medium" : "text-mute",
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

type Phase = "read" | "analyzing" | "done";

function ActionButton({
  icon,
  label,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "approve" | "pending" | "escalate" | "reject";
  onClick: () => void;
}) {
  const cls = {
    approve: "bg-surface-deep text-ink-inverse hover:bg-accent-green",
    pending: "bg-white text-ink border border-ink/30 hover:bg-surface-fog",
    escalate: "bg-white text-mark-red border border-mark-red/40 hover:bg-surface-rose/30",
    reject: "bg-white text-mute border border-divider hover:bg-surface-fog",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ui-pill flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-[13px] font-bold whitespace-nowrap",
        cls,
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function RequestModal({ request, onClose }: { request: IntakeRequest; onClose: () => void }) {
  const { go, setAgentOutput, setFlowProgress } = useApp();
  const [phase, setPhase] = React.useState<Phase>("read");

  const decide = (status: "approved" | "pending" | "escalated" | "rejected") => {
    setAgentOutput("intake", status);
    if (status === "approved") {
      setFlowProgress("belt", { activeStep: 1, approved: false });
      go({ kind: "workspace", flow: "belt" });
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="ai-spring w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Requirement header */}
        <header className="px-5 py-4 border-b border-divider flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {request.flagged && <Flag size={13} className="text-mark-red shrink-0" fill="currentColor" />}
              <h2 className="text-[15px] font-bold text-ink leading-tight truncate">{request.subject}</h2>
            </div>
            <div className="text-[12px] text-mute mt-1">
              {request.from} · {request.fromRole} · {request.time}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-pill w-8 h-8 rounded-full text-mute hover:text-ink flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 space-y-4">
          {/* Requirement body */}
          <div className="space-y-2.5">
            {request.body.map((p, i) => (
              <p key={i} className="text-[13.5px] text-ink leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          {!request.actionable && request.handledTag && (
            <div className="flex items-center gap-2 rounded-md bg-surface-fog px-3 py-2.5 text-[12.5px] text-mute">
              <Check size={14} className="text-surface-deep" strokeWidth={3} />
              {request.handledTag} — no action needed.
            </div>
          )}

          {/* Analyzing */}
          {phase === "analyzing" && (
            <SpringIn>
              <div className="rounded-md border border-[#e1e6ec] bg-[#f4f6f9] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AIDot size={6} tone="deep" pulse />
                  <span className="text-[11px] tracking-[0.08em] uppercase text-[#0a6ed1] font-bold">
                    Lane Intake · classifying the requirement
                  </span>
                </div>
                <AnalysisSteps onComplete={() => setPhase("done")} />
              </div>
            </SpringIn>
          )}

          {/* Done — reveal the lane packet */}
          {phase === "done" && (
            <SpringIn>
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-md bg-[#eaf2fb] border border-[#cfe0f5] px-3 py-2.5">
                  <span className="w-5 h-5 rounded-md bg-[#0a6ed1] text-white flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <p className="text-[12.5px] text-ink leading-snug">
                    Approved pattern · <span className="font-bold">OCC live load on CHI→RIV</span> · known origin
                    and an open receiving slot. Matched the auto-classify rule — lane packet drafted.
                  </p>
                </div>
                <LaneIntakePacket />
              </div>
            </SpringIn>
          )}
        </div>

        {/* Footer actions */}
        <footer className="px-5 py-4 border-t border-divider bg-surface-fog/50 shrink-0">
          {phase === "read" && request.actionable && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] text-mute">
                The agent will classify the haul, pattern-match the lane, check the receiving window and draft the packet.
              </span>
              <PillButton variant="deep" arrow onClick={() => setPhase("analyzing")}>
                Run AI classification
              </PillButton>
            </div>
          )}
          {phase === "read" && !request.actionable && (
            <div className="flex justify-end">
              <PillButton variant="secondary" onClick={onClose}>
                Close
              </PillButton>
            </div>
          )}
          {phase === "analyzing" && (
            <div className="flex items-center gap-2 text-[12px] text-mute">
              <Spinner size={14} /> Working through the checks…
            </div>
          )}
          {phase === "done" && (
            <div className="space-y-2">
              <div className="text-[11px] tracking-[0.06em] uppercase text-mute font-medium">
                Decide on the output
              </div>
              <div className="flex">
                <ActionButton
                  tone="approve"
                  icon={<Check size={15} strokeWidth={2.4} />}
                  label="Approve & hand off"
                  onClick={() => decide("approved")}
                />
              </div>
              <div className="flex items-stretch gap-2">
                <ActionButton
                  tone="pending"
                  icon={<Clock size={15} strokeWidth={2.2} />}
                  label="Pending"
                  onClick={() => decide("pending")}
                />
                <ActionButton
                  tone="escalate"
                  icon={<AlertTriangle size={15} strokeWidth={2.2} />}
                  label="Escalate"
                  onClick={() => decide("escalated")}
                />
                <ActionButton
                  tone="reject"
                  icon={<X size={15} strokeWidth={2.2} />}
                  label="Reject"
                  onClick={() => decide("rejected")}
                />
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

/* ── Lane volume — shown inline in the chat ────────────────────────────────── */

type LaneState = "ready" | "watch" | "review";

const laneLines: {
  lane: string;
  ready: number;
  target: number;
  unit: string;
  state: LaneState;
  note: string;
}[] = [
  {
    lane: "CHI → RIV · OCC live load",
    ready: 20,
    target: 20,
    unit: "t",
    state: "ready",
    note: "Approved pattern · receiving slot open",
  },
  {
    lane: "MRF → NGT · mixed paper roll-off",
    ready: 6,
    target: 8,
    unit: "loads",
    state: "watch",
    note: "Municipal lane · within window",
  },
  {
    lane: "RDC → RIV · OCC backhaul",
    ready: 1,
    target: 2,
    unit: "loads",
    state: "watch",
    note: "Return leg · confirm window",
  },
  {
    lane: "MUN → RIV · mixed paper",
    ready: 0,
    target: 1,
    unit: "loads",
    state: "review",
    note: "New origin · needs a coordinator",
  },
];

const laneTone: Record<LaneState, { bar: string; chip: string; label: string }> = {
  review: { bar: "bg-mark-red", chip: "bg-surface-rose text-mark-red", label: "Needs review" },
  watch: { bar: "bg-mute", chip: "bg-surface-fog text-mute", label: "On watch" },
  ready: { bar: "bg-surface-deep", chip: "bg-surface-mint text-surface-deep", label: "Tender-ready" },
};

function LaneVolumeBars() {
  return (
    <div className="space-y-2.5 pt-1">
      {laneLines.map((l) => {
        const pct = Math.max(4, Math.min(100, Math.round((l.ready / l.target) * 100)));
        const tone = laneTone[l.state];
        return (
          <div key={l.lane}>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-ink truncate flex-1">{l.lane}</span>
              <span className={cn("text-[9.5px] tracking-[0.04em] uppercase font-bold px-1.5 py-0.5 rounded shrink-0", tone.chip)}>
                {tone.label}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-white/70 overflow-hidden">
              <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10.5px] text-mute mt-0.5 tabular-nums">
              <span>{l.note}</span>
              <span>
                {l.ready} / {l.target} {l.unit}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Chat script — queue scan → lane offer → release ───────────────────────── */

const intakeChatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the Lane Intake Orchestrator. I take raw pickup requirements for recovered fibre and turn them into clean, tender-ready lanes. Want me to check what's waiting in the queue?",
      },
    ],
    chips: ["Which pickups are waiting?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "Here are the pickup requirements against their lanes. One is ready to release now — Chicago DC has ~20t of baled OCC for the Riverside mill on an approved lane.",
        children: <LaneVolumeBars />,
      },
    ],
    chips: ["Which one should we tender first?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "The Chicago DC OCC pickup is the one to act on now — clean grade, a live load on the approved CHI→RIV lane, with a receiving slot open at the Riverside mill tomorrow morning. The roll-off and backhaul are within window but the new municipal origin needs a coordinator. Shall I draft the lane packet for the OCC pickup?",
      },
    ],
    chips: ["Yes — draft the lane packet"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "Drafting lane FRT-48201 now — classifying as OCC live load, pattern-matching to MP-OCC-04 on lane CHI→RIV and checking the Riverside receiving window. Opening it for you.",
      },
    ],
  },
];

/** Turn index whose reply confirms the draft — fires the lane-packet modal. */
const PACKET_TRIGGER_TURN = 3;

/* ── Lane-packet modal — the chat's hand-off into the run ───────────────────── */

function LanePacketModal({ onClose }: { onClose: () => void }) {
  const { go, setAgentOutput, setFlowProgress } = useApp();

  const enterWorkspace = () => {
    setAgentOutput("intake", "approved");
    setFlowProgress("belt", { activeStep: 1, approved: false });
    go({ kind: "workspace", flow: "belt" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="ai-spring w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-divider flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-ink leading-tight">Lane packet ready · FRT-48201</h2>
            <div className="text-[12px] text-mute mt-1">
              Drafted by the Lane Intake Orchestrator from the Chicago DC OCC pickup
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-pill w-8 h-8 rounded-full text-mute hover:text-ink flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 space-y-3">
          <div className="flex items-center gap-2 rounded-md bg-surface-mint border border-surface-deep/20 px-3 py-2.5">
            <span className="w-5 h-5 rounded-md bg-surface-deep text-ink-inverse flex items-center justify-center shrink-0">
              <Check size={12} strokeWidth={3} />
            </span>
            <p className="text-[12.5px] text-ink leading-snug">
              Approved pattern · <span className="font-bold">OCC live load on CHI→RIV</span> · known origin and an
              open receiving slot. Matched the auto-classify rule — lane packet drafted.
            </p>
          </div>
          <LaneIntakePacket />
        </div>

        <footer className="px-5 py-4 border-t border-divider bg-surface-fog/50 shrink-0 flex items-center justify-between gap-4">
          <span className="text-[12px] text-mute min-w-0">
            Entering hands lane FRT-48201 to Rate & Surcharge and opens the seven-agent run.
          </span>
          <PillButton variant="deep" onClick={enterWorkspace}>
            <span className="inline-flex items-center gap-1.5">
              Enter AI workspace <ArrowRight size={15} />
            </span>
          </PillButton>
        </footer>
      </div>
    </div>
  );
}

/* ── Console ───────────────────────────────────────────────────────────────── */

export function IntakeConsole() {
  const [openRequest, setOpenRequest] = React.useState<IntakeRequest | null>(null);
  const [chatHidden, setChatHidden] = React.useState(true);
  const [packetOpen, setPacketOpen] = React.useState(false);
  const agent = agentsById.intake;

  const handleReachTurn = React.useCallback((i: number) => {
    if (i === PACKET_TRIGGER_TURN) window.setTimeout(() => setPacketOpen(true), 900);
  }, []);

  return (
    <div className="pl-5 pr-6 pt-4 pb-10 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <TopRow breadcrumb={{ label: "Agent workforce", chip: agent.menuLabel }} />

      <div
        className={cn(
          "mt-3 grid grid-cols-1 gap-3 items-start",
          !chatHidden && "lg:grid-cols-[1fr_360px]",
        )}
      >
        {/* Left — work surface */}
        <div className="space-y-3 min-w-0">
          <SlimHero />
          <AutonomyControl agent={agent} />
          <OutputStatusCard />
          <PickupQueue onOpen={setOpenRequest} />
          <LaneMasterPanel />
          <MovementPatternPanel />
          <div className="flex items-center justify-between gap-4 rounded-md bg-white border border-divider px-5 py-4">
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-ink">See the Lane Intake agent in the live run</div>
              <p className="text-[12px] text-mute leading-snug mt-0.5">
                Classifies the Chicago DC OCC pickup into tender-ready lane FRT-48201.
              </p>
            </div>
            <PillButton variant="deep" size="sm" arrow onClick={() => setOpenRequest(intakeQueue[0])}>
              <span className="inline-flex items-center gap-1">
                Open the flagged requirement <ChevronRight size={14} />
              </span>
            </PillButton>
          </div>
        </div>

        {/* Right — conversation rail (hideable) */}
        {!chatHidden && (
          <aside className="lg:sticky lg:top-4">
            <div className="rounded-md border border-divider overflow-hidden h-[calc(100vh-2rem)]">
              <AgentChat
                agentName="Lane Intake"
                script={intakeChatScript}
                onHide={() => setChatHidden(true)}
                onReachTurn={handleReachTurn}
              />
            </div>
          </aside>
        )}
      </div>

      {chatHidden && (
        <button
          type="button"
          onClick={() => setChatHidden(false)}
          className="ui-pill fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-surface-deep text-ink-inverse px-4 py-2.5 text-[13px] font-bold shadow-lg hover:bg-accent-green"
        >
          <Bot size={16} strokeWidth={1.9} /> Chat with Lane Intake
        </button>
      )}

      {openRequest && <RequestModal request={openRequest} onClose={() => setOpenRequest(null)} />}
      {packetOpen && <LanePacketModal onClose={() => setPacketOpen(false)} />}
    </div>
  );
}
