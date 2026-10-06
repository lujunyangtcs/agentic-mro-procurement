import * as React from "react";
import { Flag, Check, Clock, AlertTriangle, X, FileText, ChevronRight, Bot, ArrowRight } from "lucide-react";
import { useApp } from "@/state";
import { agentsById } from "@/data/agents";
import {
  intakeInbox,
  preferredSuppliers,
  spendingPolicies,
  type IntakeEmail,
} from "@/data/intake";
import { cn } from "@/lib/utils";
import { AIDot } from "@/components/ai/AIDot";
import { SpringIn } from "@/components/ai/SpringIn";
import { Spinner } from "@/components/ai/Spinner";
import { StatusPill } from "@/components/blocks/StatusPill";
import { PillButton } from "@/components/blocks/PillButton";
import { TopRow } from "@/components/blocks/TopRow";
import { DataTable, CellTag, DocPreviewModal } from "@/components/blocks/DataTable";
import { AutonomyControl } from "@/components/agents/AutonomyControl";
import { AgentChat, type ChatTurn } from "@/components/agents/AgentChat";
import { PurchaseRequisition } from "@/components/docs/sap/PurchaseRequisition";
import { OutlineAgreementDoc, SpendingPolicyDoc } from "@/components/docs/sources";

/* ──────────────────────────────────────────────────────────────────────────
 * Intake Agent console — the reference build.
 *
 * Left column: slim hero · autonomy dial+gear · output/handoff status ·
 * Outlook-style inbox · contracts + spending-policy panels. Right rail: the
 * scripted AgentChat. Clicking the flagged email opens the centre modal whose
 * ceremony is read → "Run AI analysis" → stepped animation → SAP PR reveal →
 * Approve / Pending / Escalate / Reject. Approving hands PR-48201 to Sourcing
 * and jumps into the belt run.
 * ────────────────────────────────────────────────────────────────────────── */

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
            <div className="text-[10px] tracking-[0.06em] uppercase text-mute mt-1">Requisitions</div>
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
    note: "Open the flagged request to draft a requisition.",
  },
  pending: {
    label: "On pending",
    kind: "neutral",
    note: "PR-48201 is parked — resume it from the inbox when ready.",
  },
  approved: {
    label: "Approved · handed off",
    kind: "active",
    note: "PR-48201 handed to the Sourcing agent. It's queued for the three-bid tender.",
  },
  rejected: {
    label: "Rejected",
    kind: "critical",
    note: "PR-48201 was rejected — nothing handed downstream.",
  },
  escalated: {
    label: "Escalated",
    kind: "critical",
    note: "Routed to the category sourcing manager with the draft attached.",
  },
};

function OutputStatusCard() {
  const { agentOutputs, go } = useApp();
  const status = agentOutputs.intake;
  const meta = OUTPUT_META[status];
  // The PR number is only assigned once the agent has drafted it. Before that
  // the handoff slot is empty — naming PR-48201 would be wrong.
  const hasDraft = status !== "none";
  const [docOpen, setDocOpen] = React.useState(false);

  return (
    <article className="bg-white border border-divider rounded-md p-5 space-y-3">
      <CardHeader label="Current output · handoff to Sourcing" right={<StatusPill label={meta.label} kind={meta.kind} pulse={status === "approved"} />} />
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
            {hasDraft ? "Purchase requisition · PR-48201" : "Requisition · not drafted yet"}
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
        <DocPreviewModal title="Purchase requisition · PR-48201" onClose={() => setDocOpen(false)}>
          <PurchaseRequisition />
        </DocPreviewModal>
      )}
    </article>
  );
}

function InboxRow({ email, onOpen }: { email: IntakeEmail; onOpen: (e: IntakeEmail) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(email)}
      className={cn(
        "ui-pill w-full text-left flex gap-3 px-4 py-3 border-b border-divider last:border-b-0 hover:bg-surface-fog",
        email.unread && "bg-surface-mint/15",
      )}
    >
      <span className="pt-1 shrink-0">
        {email.unread ? (
          <span className="w-2 h-2 rounded-full bg-surface-deep block" />
        ) : (
          <span className="w-2 h-2 rounded-full border border-divider block" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn("text-[13px] truncate", email.unread ? "font-bold text-ink" : "text-ink")}>
            {email.from}
          </span>
          <span className="text-[11px] text-mute truncate">· {email.fromRole}</span>
          {email.priority === "high" && (
            <span className="text-[9px] tracking-[0.06em] uppercase font-bold text-mark-red bg-surface-rose/40 px-1.5 py-0.5 rounded shrink-0">
              High
            </span>
          )}
          <span className="ml-auto text-[11px] text-mute shrink-0">{email.time}</span>
        </span>
        <span className="flex items-center gap-1.5 mt-0.5">
          {email.flagged && <Flag size={12} className="text-mark-red shrink-0" fill="currentColor" />}
          <span className={cn("text-[13px] truncate", email.unread ? "font-medium text-ink" : "text-ink")}>
            {email.subject}
          </span>
        </span>
        <span className="block text-[12px] text-mute leading-snug mt-0.5 line-clamp-1">{email.preview}</span>
        {email.handledTag && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] tracking-[0.04em] uppercase font-medium text-surface-deep bg-surface-mint/40 px-2 py-0.5 rounded">
            <Check size={10} strokeWidth={3} /> {email.handledTag}
          </span>
        )}
      </span>
    </button>
  );
}

function OutlookInbox({ onOpen }: { onOpen: (e: IntakeEmail) => void }) {
  const unread = intakeInbox.filter((e) => e.unread).length;
  return (
    <article className="bg-white border border-divider rounded-md overflow-hidden">
      <div className="px-4 py-3 border-b border-divider flex items-center gap-2">
        <AIDot size={6} tone="deep" pulse />
        <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
          Inbox · intake queue
        </span>
        <span className="ml-auto text-[11px] font-bold text-surface-deep bg-surface-mint px-2 py-0.5 rounded-full">
          {unread} unread
        </span>
      </div>
      <div>
        {intakeInbox.map((e) => (
          <InboxRow key={e.id} email={e} onOpen={onOpen} />
        ))}
      </div>
    </article>
  );
}

function ContractsPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Contracts & preferred suppliers" right={<MatchNote />} />
      <div className="mt-3">
        <DataTable
          rows={preferredSuppliers}
          rowKey={(s) => s.supplier}
          highlight={(s) => !!s.match}
          openDoc={(_s, i) => (i === 0 ? <OutlineAgreementDoc /> : null)}
          openTitle={() => "Outline agreement · 4600001207"}
          columns={[
            {
              header: "Supplier",
              cell: (s) => (
                <span className={cn("font-bold", s.match ? "text-surface-deep" : "text-ink")}>{s.supplier}</span>
              ),
            },
            {
              header: "Status",
              className: "w-[112px]",
              cell: (s) => (
                <CellTag tone={s.kind === "Contracted" ? "deep" : s.kind === "Preferred" ? "sage" : "neutral"}>
                  {s.kind}
                </CellTag>
              ),
            },
            { header: "Category", cell: (s) => s.category },
            { header: "Terms", cell: (s) => s.terms },
            {
              header: "Agreement",
              align: "right",
              className: "w-[120px]",
              cell: (s) => (s.contractRef === "—" ? <span className="text-mute">—</span> : s.contractRef),
            },
          ]}
        />
      </div>
    </article>
  );
}

function SpendingPolicyPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Spending policy" right={<MatchNote />} />
      <div className="mt-3">
        <DataTable
          rows={spendingPolicies}
          rowKey={(p) => p.ref}
          highlight={(p) => !!p.match}
          openDoc={(_p, i) => (i === 0 ? <SpendingPolicyDoc /> : null)}
          openTitle={() => "Spending policy · POL-MRO-04"}
          columns={[
            {
              header: "Policy",
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
      Governs this request
    </span>
  );
}

/* ── Analysis ceremony ─────────────────────────────────────────────────── */

const ANALYSIS_STEPS = [
  "Reading the request from Dale Whitfield",
  "Classifying — MRO · Conveyor & belting · part 88-DBX",
  "Matching to contract — BeltPro framework 4600001207",
  "Checking budget — cost center 41702 · headroom available",
  "Drafting requisition PR-48201",
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

function EmailModal({ email, onClose }: { email: IntakeEmail; onClose: () => void }) {
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
        {/* Email header */}
        <header className="px-5 py-4 border-b border-divider flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {email.flagged && <Flag size={13} className="text-mark-red shrink-0" fill="currentColor" />}
              <h2 className="text-[15px] font-bold text-ink leading-tight truncate">{email.subject}</h2>
            </div>
            <div className="text-[12px] text-mute mt-1">
              {email.from} · {email.fromRole} · {email.time}
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
          {/* Email body */}
          <div className="space-y-2.5">
            {email.body.map((p, i) => (
              <p key={i} className="text-[13.5px] text-ink leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          {!email.actionable && email.handledTag && (
            <div className="flex items-center gap-2 rounded-md bg-surface-fog px-3 py-2.5 text-[12.5px] text-mute">
              <Check size={14} className="text-surface-deep" strokeWidth={3} />
              {email.handledTag} — no action needed.
            </div>
          )}

          {/* Analyzing */}
          {phase === "analyzing" && (
            <SpringIn>
              <div className="rounded-md border border-[#e1e6ec] bg-[#f4f6f9] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AIDot size={6} tone="deep" pulse />
                  <span className="text-[11px] tracking-[0.08em] uppercase text-[#0a6ed1] font-bold">
                    Intake agent · analysing the request
                  </span>
                </div>
                <AnalysisSteps onComplete={() => setPhase("done")} />
              </div>
            </SpringIn>
          )}

          {/* Done — reveal the SAP PR */}
          {phase === "done" && (
            <SpringIn>
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-md bg-[#eaf2fb] border border-[#cfe0f5] px-3 py-2.5">
                  <span className="w-5 h-5 rounded-md bg-[#0a6ed1] text-white flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <p className="text-[12.5px] text-ink leading-snug">
                    On-contract · <span className="font-bold">$48,200</span> under the $50k MRO ceiling ·
                    budget available. Met the L3 auto-submit rule — requisition drafted.
                  </p>
                </div>
                <PurchaseRequisition />
              </div>
            </SpringIn>
          )}
        </div>

        {/* Footer actions */}
        <footer className="px-5 py-4 border-t border-divider bg-surface-fog/50 shrink-0">
          {phase === "read" && email.actionable && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] text-mute">
                The agent will classify, contract-match, budget-check and draft the requisition.
              </span>
              <PillButton variant="deep" arrow onClick={() => setPhase("analyzing")}>
                Run AI analysis
              </PillButton>
            </div>
          )}
          {phase === "read" && !email.actionable && (
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

/* ── Material stock — shown inline in the chat ─────────────────────────── */

type StockState = "critical" | "low" | "ok";

const stockLines: {
  material: string;
  onHand: number;
  reorder: number;
  unit: string;
  state: StockState;
  note: string;
}[] = [
  {
    material: "88-DBX · Double-backer belt",
    onHand: 0,
    reorder: 1,
    unit: "EA",
    state: "critical",
    note: "Worn past limit · Corrugator No.2",
  },
  {
    material: "FLT-220 · Fluting medium roll",
    onHand: 3,
    reorder: 8,
    unit: "RL",
    state: "low",
    note: "Below reorder · cover for ~9 days",
  },
  {
    material: "DBL-14 · Doctor blades",
    onHand: 6,
    reorder: 12,
    unit: "EA",
    state: "low",
    note: "Below reorder · cover for ~3 weeks",
  },
  {
    material: "ADH-90 · Starch adhesive",
    onHand: 142,
    reorder: 80,
    unit: "KG",
    state: "ok",
    note: "Healthy · above reorder point",
  },
];

const stockTone: Record<StockState, { bar: string; chip: string; label: string }> = {
  critical: { bar: "bg-mark-red", chip: "bg-surface-rose text-mark-red", label: "Critical" },
  low: { bar: "bg-mute", chip: "bg-surface-fog text-mute", label: "Below reorder" },
  ok: { bar: "bg-surface-deep", chip: "bg-surface-mint text-surface-deep", label: "Healthy" },
};

function MaterialStockBars() {
  return (
    <div className="space-y-2.5 pt-1">
      {stockLines.map((s) => {
        const pct = Math.max(4, Math.min(100, Math.round((s.onHand / s.reorder) * 100)));
        const tone = stockTone[s.state];
        return (
          <div key={s.material}>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-ink truncate flex-1">{s.material}</span>
              <span className={cn("text-[9.5px] tracking-[0.04em] uppercase font-bold px-1.5 py-0.5 rounded shrink-0", tone.chip)}>
                {tone.label}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-white/70 overflow-hidden">
              <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10.5px] text-mute mt-0.5 tabular-nums">
              <span>{s.note}</span>
              <span>
                {s.onHand} / {s.reorder} {s.unit}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Chat script — shortage scan → PR offer → raise ────────────────────── */

const intakeChatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the Intake Agent. I watch the containerboard mill's MRO stock and turn shortages into compliant requisitions. Want me to check what's running short?",
      },
    ],
    chips: ["Which materials are running short?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "Here's the mill's MRO stock against reorder points. One item is past its limit — the No.2 double-backer belt is at zero and flagged worn.",
        children: <MaterialStockBars />,
      },
    ],
    chips: ["Which do we need to buy now?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "The double-backer belt 88-DBX is the one to act on now — it's production-critical, at zero, with a maintenance window on 2026-06-10. The fluting roll and doctor blades are below reorder but still have cover. The belt is on the BeltPro framework at $48,200, under the $50k MRO ceiling. Shall I raise the requisition for it?",
      },
    ],
    chips: ["Yes — raise the requisition"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "Raising PR-48201 now — classifying as MRO, contract-matching to framework 4600001207 and budget-checking cost center 41702. Opening it for you.",
      },
    ],
  },
];

/** Turn index whose reply confirms the raise — fires the requisition modal. */
const PR_TRIGGER_TURN = 3;

/* ── Requisition modal — the chat's hand-off into the run ──────────────── */

function RequisitionModal({ onClose }: { onClose: () => void }) {
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
            <h2 className="text-[15px] font-bold text-ink leading-tight">Requisition ready · PR-48201</h2>
            <div className="text-[12px] text-mute mt-1">
              Drafted by the Intake agent from the No.2 double-backer belt shortage
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
              On-contract · <span className="font-bold">$48,200</span> under the $50k MRO ceiling · budget
              available. Met the L3 auto-submit rule — requisition drafted.
            </p>
          </div>
          <PurchaseRequisition />
        </div>

        <footer className="px-5 py-4 border-t border-divider bg-surface-fog/50 shrink-0 flex items-center justify-between gap-4">
          <span className="text-[12px] text-mute min-w-0">
            Entering hands PR-48201 to Sourcing and opens the seven-agent run.
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

/* ── Console ───────────────────────────────────────────────────────────── */

export function IntakeConsole() {
  const [openEmail, setOpenEmail] = React.useState<IntakeEmail | null>(null);
  const [chatHidden, setChatHidden] = React.useState(true);
  const [prOpen, setPrOpen] = React.useState(false);
  const agent = agentsById.intake;

  const handleReachTurn = React.useCallback((i: number) => {
    if (i === PR_TRIGGER_TURN) window.setTimeout(() => setPrOpen(true), 900);
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
          <OutlookInbox onOpen={setOpenEmail} />
          <ContractsPanel />
          <SpendingPolicyPanel />
          <div className="flex items-center justify-between gap-4 rounded-md bg-white border border-divider px-5 py-4">
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-ink">See the Intake agent in the live run</div>
              <p className="text-[12px] text-mute leading-snug mt-0.5">
                Structures the mill's maintenance note into requisition PR-48201.
              </p>
            </div>
            <PillButton variant="deep" size="sm" arrow onClick={() => setOpenEmail(intakeInbox[0])}>
              <span className="inline-flex items-center gap-1">
                Open the flagged request <ChevronRight size={14} />
              </span>
            </PillButton>
          </div>
        </div>

        {/* Right — conversation rail (hideable) */}
        {!chatHidden && (
          <aside className="lg:sticky lg:top-4">
            <div className="rounded-md border border-divider overflow-hidden h-[calc(100vh-2rem)]">
              <AgentChat
                agentName="Intake agent"
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
          <Bot size={16} strokeWidth={1.9} /> Chat with Intake
        </button>
      )}

      {openEmail && <EmailModal email={openEmail} onClose={() => setOpenEmail(null)} />}
      {prOpen && <RequisitionModal onClose={() => setPrOpen(false)} />}
    </div>
  );
}
