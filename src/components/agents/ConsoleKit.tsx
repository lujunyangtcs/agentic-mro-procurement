import * as React from "react";
import { Check, Clock, AlertTriangle, X, FileText, ChevronRight, Flag, Bot } from "lucide-react";
import { useApp, type AgentOutputStatus } from "@/state";
import { agentsById, type AgentId } from "@/data/agents";
import { cn } from "@/lib/utils";
import { AIDot } from "@/components/ai/AIDot";
import { SpringIn } from "@/components/ai/SpringIn";
import { Spinner } from "@/components/ai/Spinner";
import { StatusPill } from "@/components/blocks/StatusPill";
import { PillButton } from "@/components/blocks/PillButton";
import { TopRow } from "@/components/blocks/TopRow";
import { AutonomyControl } from "@/components/agents/AutonomyControl";
import { AgentChat, type ChatTurn } from "@/components/agents/AgentChat";

/* ──────────────────────────────────────────────────────────────────────────
 * ConsoleKit — the shared engine behind every specialist agent console.
 *
 * Generalised from the Intake reference: a left-column work surface (hero ·
 * autonomy dial+gear · output/handoff card · the agent's data panels · cross-
 * link) beside a scripted chat rail, plus the read → analyse → reveal → decide
 * ceremony modal. Each agent view supplies only its data panels, work-queue,
 * ceremony document and chat script; this file owns the rest so the six new
 * consoles stay consistent with each other and with Intake.
 * ────────────────────────────────────────────────────────────────────────── */

const STATUS_META: Record<string, { label: string; kind: "active" | "critical" | "neutral"; pulse: boolean }> = {
  running: { label: "Running", kind: "active", pulse: true },
  review: { label: "Needs a look", kind: "critical", pulse: true },
  idle: { label: "Idle", kind: "neutral", pulse: false },
};

export function CardHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <header className="flex items-center gap-2">
      <AIDot size={6} tone="deep" pulse />
      <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">{label}</span>
      {right && <span className="ml-auto">{right}</span>}
    </header>
  );
}

function ConsoleHero({ id, statLabel }: { id: AgentId; statLabel: string }) {
  const agent = agentsById[id];
  const Icon = agent.icon;
  const s = STATUS_META[agent.status];
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
              <StatusPill label={s.label} kind={s.kind} pulse={s.pulse} />
            </div>
            <p className="text-[13px] text-mute leading-snug mt-1 max-w-2xl">{agent.purpose}</p>
          </div>
          <div className="text-right shrink-0 pl-3">
            <div className="text-[18px] font-bold text-surface-deep leading-none">{agent.stat}</div>
            <div className="text-[10px] tracking-[0.06em] uppercase text-mute mt-1">{statLabel}</div>
          </div>
        </div>
      </section>
    </SpringIn>
  );
}

/* ── Output / handoff card ─────────────────────────────────────────────── */

export type OutputMeta = Record<AgentOutputStatus, { label: string; kind: "active" | "critical" | "neutral"; note: string }>;

/* ── Work queue ────────────────────────────────────────────────────────── */

export type QueueItem = {
  id: string;
  primary: string;
  secondary: string;
  meta?: string;
  /** Right-side highlight chip for the live row, e.g. "Ready to draft". */
  readyTag?: string;
  /** Green handled chip for already-done rows. */
  handledTag?: string;
  priority?: "high";
  flagged?: boolean;
  actionable?: boolean;
};

export function QueuePanel({
  title,
  badge,
  items,
  onOpen,
}: {
  title: string;
  badge?: string;
  items: QueueItem[];
  onOpen: (item: QueueItem) => void;
}) {
  return (
    <article className="bg-white border border-divider rounded-md overflow-hidden">
      <div className="px-4 py-3 border-b border-divider flex items-center gap-2">
        <AIDot size={6} tone="deep" pulse />
        <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">{title}</span>
        {badge && (
          <span className="ml-auto text-[11px] font-bold text-surface-deep bg-surface-mint px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(item)}
            className={cn(
              "ui-pill w-full text-left flex gap-3 px-4 py-3 border-b border-divider last:border-b-0 hover:bg-surface-fog",
              item.actionable && "bg-surface-mint/15",
            )}
          >
            <span className="pt-1 shrink-0">
              {item.actionable ? (
                <span className="w-2 h-2 rounded-full bg-surface-deep block" />
              ) : (
                <span className="w-2 h-2 rounded-full border border-divider block" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                {item.flagged && <Flag size={12} className="text-mark-red shrink-0" fill="currentColor" />}
                <span className={cn("text-[13px] truncate", item.actionable ? "font-bold text-ink" : "text-ink")}>
                  {item.primary}
                </span>
                {item.priority === "high" && (
                  <span className="text-[9px] tracking-[0.06em] uppercase font-bold text-mark-red bg-surface-rose/40 px-1.5 py-0.5 rounded shrink-0">
                    High
                  </span>
                )}
                {item.meta && <span className="ml-auto text-[11px] text-mute shrink-0">{item.meta}</span>}
              </span>
              <span className="block text-[12px] text-mute leading-snug mt-0.5 line-clamp-1">{item.secondary}</span>
              {item.readyTag && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] tracking-[0.04em] uppercase font-bold text-surface-deep bg-surface-mint px-2 py-0.5 rounded">
                  <AIDot size={5} tone="deep" pulse /> {item.readyTag}
                </span>
              )}
              {item.handledTag && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] tracking-[0.04em] uppercase font-medium text-surface-deep bg-surface-mint/40 px-2 py-0.5 rounded">
                  <Check size={10} strokeWidth={3} /> {item.handledTag}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </article>
  );
}

/* ── Ceremony modal ────────────────────────────────────────────────────── */

function AnalysisSteps({ steps, onComplete }: { steps: string[]; onComplete: () => void }) {
  const [done, setDone] = React.useState(0);
  React.useEffect(() => {
    if (done >= steps.length) {
      const t = window.setTimeout(onComplete, 650);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setDone((d) => d + 1), 820);
    return () => window.clearTimeout(t);
  }, [done, steps.length, onComplete]);

  return (
    <div className="space-y-2.5">
      {steps.map((label, i) => {
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

type Phase = "read" | "analyzing" | "done";

export type Ceremony = {
  /** Strip label while analysing, e.g. "PO agent · building the order". */
  agentLabel: string;
  steps: string[];
  /** Green confirmation banner above the document. */
  doneSummary: React.ReactNode;
  /** The revealed SAP/standards document. */
  document: React.ReactNode;
  /** Sentence beside the "Run AI analysis" button in the read phase. */
  footerIntro: string;
  /** Label on the run-analysis button (default "Run AI analysis"). */
  runLabel?: string;
  /** Label on the approve action (default "Approve & hand off"). */
  approveLabel?: string;
  /** Decide-prompt label (default "Decide on the output"). */
  decidePrompt?: string;
};

export function CeremonyModal({
  title,
  subtitle,
  flagged,
  context,
  ceremony,
  onClose,
  onDecide,
}: {
  title: string;
  subtitle: string;
  flagged?: boolean;
  /** Request context shown before the analysis runs. */
  context: React.ReactNode;
  ceremony: Ceremony;
  onClose: () => void;
  onDecide: (status: AgentOutputStatus) => void;
}) {
  const [phase, setPhase] = React.useState<Phase>("read");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="ai-spring w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-divider flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {flagged && <Flag size={13} className="text-mark-red shrink-0" fill="currentColor" />}
              <h2 className="text-[15px] font-bold text-ink leading-tight truncate">{title}</h2>
            </div>
            <div className="text-[12px] text-mute mt-1">{subtitle}</div>
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
          {context}

          {phase === "analyzing" && (
            <SpringIn>
              <div className="rounded-md border border-[#e1e6ec] bg-[#f4f6f9] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AIDot size={6} tone="deep" pulse />
                  <span className="text-[11px] tracking-[0.08em] uppercase text-[#0a6ed1] font-bold">
                    {ceremony.agentLabel}
                  </span>
                </div>
                <AnalysisSteps steps={ceremony.steps} onComplete={() => setPhase("done")} />
              </div>
            </SpringIn>
          )}

          {phase === "done" && (
            <SpringIn>
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-md bg-[#eaf2fb] border border-[#cfe0f5] px-3 py-2.5">
                  <span className="w-5 h-5 rounded-md bg-[#0a6ed1] text-white flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <p className="text-[12.5px] text-ink leading-snug">{ceremony.doneSummary}</p>
                </div>
                {ceremony.document}
              </div>
            </SpringIn>
          )}
        </div>

        <footer className="px-5 py-4 border-t border-divider bg-surface-fog/50 shrink-0">
          {phase === "read" && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] text-mute">{ceremony.footerIntro}</span>
              <PillButton variant="deep" arrow onClick={() => setPhase("analyzing")}>
                {ceremony.runLabel ?? "Run AI analysis"}
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
                {ceremony.decidePrompt ?? "Decide on the output"}
              </div>
              <div className="flex">
                <ActionButton
                  tone="approve"
                  icon={<Check size={15} strokeWidth={2.4} />}
                  label={ceremony.approveLabel ?? "Approve & hand off"}
                  onClick={() => onDecide("approved")}
                />
              </div>
              <div className="flex items-stretch gap-2">
                <ActionButton
                  tone="pending"
                  icon={<Clock size={15} strokeWidth={2.2} />}
                  label="Pending"
                  onClick={() => onDecide("pending")}
                />
                <ActionButton
                  tone="escalate"
                  icon={<AlertTriangle size={15} strokeWidth={2.2} />}
                  label="Escalate"
                  onClick={() => onDecide("escalated")}
                />
                <ActionButton
                  tone="reject"
                  icon={<X size={15} strokeWidth={2.2} />}
                  label="Reject"
                  onClick={() => onDecide("rejected")}
                />
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

/* ── Console shell ─────────────────────────────────────────────────────── */

export type ConsoleConfig = {
  id: AgentId;
  statLabel: string;
  /** Output artifact handed downstream, e.g. "Purchase order · PO-77310". */
  artifactLabel: string;
  /** Status → label/kind/note for the handoff card. */
  outputMeta: OutputMeta;
  chatName: string;
  chatScript: ChatTurn[];
  /** Cross-link footer copy + button. */
  runRole: string;
  openRunLabel: string;
  /** Bold line on the cross-link footer (defaults to the live-run phrasing). */
  runTitle?: string;
  /** Standalone console (not a step in a run) — hides the handoff deep-link. */
  standalone?: boolean;
};

function HandoffCard({
  id,
  artifactLabel,
  meta,
  standalone,
}: {
  id: AgentId;
  artifactLabel: string;
  meta: OutputMeta;
  standalone?: boolean;
}) {
  const { agentOutputs, go } = useApp();
  const status = agentOutputs[id];
  const m = meta[status];
  return (
    <article className="bg-white border border-divider rounded-md p-5 space-y-3">
      <CardHeader label="Current output · handoff" right={<StatusPill label={m.label} kind={m.kind} pulse={status === "approved"} />} />
      <div className="flex items-center gap-3 rounded-md bg-surface-fog px-3 py-3">
        <span
          className={cn(
            "w-9 h-9 rounded-md flex items-center justify-center shrink-0",
            status === "approved"
              ? "bg-surface-deep text-ink-inverse"
              : "bg-white border border-divider text-surface-deep",
          )}
        >
          <FileText size={17} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-ink">{artifactLabel}</div>
          <div className="text-[12px] text-mute leading-snug mt-0.5">{m.note}</div>
        </div>
        {status === "approved" && !standalone && (
          <PillButton variant="deep" size="sm" arrow onClick={() => go({ kind: "workspace", flow: "belt" })}>
            Open the run
          </PillButton>
        )}
      </div>
    </article>
  );
}

/**
 * Full console layout. The agent view passes its bespoke work surface as
 * `children` (queue + data panels) and an `onOpenRun` to trigger its ceremony
 * from the cross-link footer.
 */
export function AgentConsole({
  config,
  onOpenRun,
  children,
}: {
  config: ConsoleConfig;
  onOpenRun: () => void;
  children: React.ReactNode;
}) {
  const agent = agentsById[config.id];
  const [chatHidden, setChatHidden] = React.useState(true);
  return (
    <div className="pl-5 pr-6 pt-4 pb-10 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <TopRow breadcrumb={{ label: "Agent workforce", chip: agent.menuLabel }} />

      <div
        className={cn(
          "mt-3 grid grid-cols-1 gap-3 items-start",
          !chatHidden && "lg:grid-cols-[1fr_360px]",
        )}
      >
        <div className="space-y-3 min-w-0">
          <ConsoleHero id={config.id} statLabel={config.statLabel} />
          <AutonomyControl agent={agent} />
          <HandoffCard id={config.id} artifactLabel={config.artifactLabel} meta={config.outputMeta} standalone={config.standalone} />
          {children}
          <div className="flex items-center justify-between gap-4 rounded-md bg-white border border-divider px-5 py-4">
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-ink">
              {config.runTitle ?? `See the ${agent.menuLabel} agent in the live run`}
            </div>
              <p className="text-[12px] text-mute leading-snug mt-0.5">{config.runRole}</p>
            </div>
            <PillButton variant="deep" size="sm" arrow onClick={onOpenRun}>
              <span className="inline-flex items-center gap-1">
                {config.openRunLabel} <ChevronRight size={14} />
              </span>
            </PillButton>
          </div>
        </div>

        {!chatHidden && (
          <aside className="lg:sticky lg:top-4">
            <div className="rounded-md border border-divider overflow-hidden h-[calc(100vh-2rem)]">
              <AgentChat
                agentName={config.chatName}
                script={config.chatScript}
                onHide={() => setChatHidden(true)}
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
          <Bot size={16} strokeWidth={1.9} /> Chat with {config.chatName}
        </button>
      )}
    </div>
  );
}
