import * as React from "react";
import { Check, ThumbsUp, PauseCircle, ArrowUpRight, X, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { useRunText, useT } from "@/mro/lib/i18n";
import {
  CatalogueAdoption,
  DemandSpread,
  VolumePricing,
  SplitVsConsolidated,
} from "@/mro/components/workspace/BuyingInsight";
import { AIDot } from "@/mro/components/ai/AIDot";
import { Spinner } from "@/mro/components/ai/Spinner";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { EmailReplyModal } from "@/mro/components/workspace/EmailReplyModal";
import { AiDraftEmailCard } from "@/mro/components/workspace/AiDraftEmailCard";
import { ExceptionResolutionCard } from "@/mro/components/workspace/ExceptionResolutionCard";
import { ExtractionWizard } from "@/mro/components/workspace/ExtractionWizard";
import { RfqFlow } from "@/mro/components/workspace/RfqFlow";
import { QuoteReview } from "@/mro/components/workspace/QuoteReview";
import { SignalFusion } from "@/mro/components/workspace/SignalFusion";
import { StepProgress } from "@/mro/components/ai/StepProgress";
import { agentsById } from "@/mro/data/agents";
import type { AgentOutputStatus } from "@/mro/state";
import type { RunStep } from "@/mro/data/runSteps";

const LEAD_MS = 2400; // the lead-in spinner before the staged wizard
const REC_CPS = 46; // recommendation typing speed (chars/sec)

/** A step plays as a gated sequence; the panel is keyed by step in the parent
 *  so this resets every time a step opens:
 *   loading  — (staged only) the lead-in spinner runs on the working screen
 *   working  — (staged only) the extraction wizard; user validates each stage
 *   revealed — reasoning lines pop in one-by-one (circle → check) on the SAME
 *              clock as the recommendation typing, so the last check lands as the
 *              text finishes; then the produced artifact follows.
 *  Non-staged (L4) steps skip the spinner and land straight on the reveal. */
type Phase = "loading" | "working" | "revealed";

type Decision = Exclude<AgentOutputStatus, "none">;

/* The label is a key — the wording follows the reader's language at render. */
const noteFor: Record<Decision, { key: string; cls: string }> = {
  approved: { key: "run.approvedHanded", cls: "text-surface-deep" },
  pending: { key: "run.pendingParked", cls: "text-mute" },
  escalated: { key: "run.escalatedHalted", cls: "text-mark-red" },
  rejected: { key: "run.rejectedHalted", cls: "text-mark-red" },
};

export function AiWorkspacePanel({
  step,
  flow,
  status,
  replied,
  awaiting = false,
  resolved = false,
  isLast,
  completeNote = "Run complete · invoice released to AP, audit envelope closed",
  holdContinue,
  sent = false,
  onDecision,
  onHoldContinue,
  onWizardActive,
  onChoice,
  useAltDoc = false,
  staged = false,
}: {
  step: RunStep;
  /** Which run this step belongs to — keys its translated lines. */
  flow: string;
  status: AgentOutputStatus;
  replied: boolean;
  /** True after send while the reply is still in flight (drives the email card's waiting state). */
  awaiting?: boolean;
  /** For a flagged step: the amber "continue despite the flag" action label + toast. */
  holdContinue?: { label: string; toastTitle: string; toastBody: string };
  /** Advance the run past a flagged step (keeps it parked). */
  onHoldContinue?: () => void;
  /** True once the reply email has been read & closed — swaps the produced doc to its resolved version. */
  resolved?: boolean;
  isLast: boolean;
  /** Note shown when the final step is approved (happy-path close). */
  completeNote?: string;
  /** True once the step's outbound email has been sent (drives the draft card state). */
  sent?: boolean;
  onDecision: (status: Decision) => void;
  /** Tells the workspace whether the staged wizard is running (to hide the rail). */
  onWizardActive?: (active: boolean) => void;
  /** Bubbles a choice-stage pick up to the run (e.g. on-contract → drop the RFQ step). */
  onChoice?: (optionId: string) => void;
  /** When true, render the step's altDocument (the off-contract PR doc with vendor
   *  & price hidden) instead of the default produced document. */
  useAltDoc?: boolean;
  /** True when this step plays the staged wizard (L2/L3); false reveals directly (L4). */
  staged?: boolean;
}) {
  const agent = agentsById[step.id];
  const hasWizard = staged && Boolean(step.stages);
  const hasRfq = staged && Boolean(step.rfq);
  const hasQuotes = staged && Boolean(step.quotes);
  const hasSignals = staged && Boolean(step.signals);
  const resolvedDoc = step.email?.resolvedDocument;
  const showResolved = resolved && !!resolvedDoc;
  // Off-contract branch swaps in the alternate produced doc (vendor & price hidden).
  const producedDoc = useAltDoc && step.altDocument ? step.altDocument : step.document;

  const [phase, setPhase] = React.useState<Phase>(hasWizard || hasRfq || hasQuotes || hasSignals ? "loading" : "revealed");
  // For a merged sourcing step (rfq + stages): the RFQ plays first, then the
  // vendor-selection wizard. This flips once the RFQ hands off.
  const [rfqDone, setRfqDone] = React.useState(false);
  const [recTyped, setRecTyped] = React.useState(false);
  const [detailsShown, setDetailsShown] = React.useState(false);
  // 0 → 1 over the recommendation's typing duration; drives the reasoning checks.
  const [reasonClock, setReasonClock] = React.useState(0);
  const [emailOpen, setEmailOpen] = React.useState(false);

  const revealed = phase === "revealed";
  const decided = status !== "none";

  // Reasoning checklist — for wizard steps it mirrors the stages; otherwise the
  // step's own reasoning lines.
  const rt = useRunText(flow, step.n);
  const { t } = useT();
  /* Each reasoning line carries its own key, so a run can be translated line
     by line without the case file changing shape. */
  const reasoningLines = (hasWizard ? step.stages!.map((s) => s.reasoning) : step.reasoning).map(
    (line, i) => rt(`reasoning.${i}`, line),
  );

  // The reveal animation length = how long the recommendation takes to type, so
  // the reasoning checks and the typewriter finish together.
  const recMs = Math.max(1100, Math.round((step.recommendation.length / REC_CPS) * 1000));

  // Drive the shared reveal clock 0 → 1 over recMs. Hidden tabs freeze timers, so
  // jump straight to the finished state when the tab isn't visible.
  React.useEffect(() => {
    if (phase !== "revealed") {
      setReasonClock(0);
      return;
    }
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      setReasonClock(1);
      return;
    }
    const start = Date.now();
    const iv = window.setInterval(() => {
      const c = Math.min(1, (Date.now() - start) / recMs);
      setReasonClock(c);
      if (c >= 1) window.clearInterval(iv);
    }, 50);
    return () => window.clearInterval(iv);
  }, [phase, recMs]);

  // Recommendation done → reveal the produced artifact. A fallback timer mirrors
  // the typewriter's onDone (covers frozen/hidden tabs).
  const handleRecTyped = React.useCallback(() => setRecTyped(true), []);
  React.useEffect(() => {
    if (phase !== "revealed") {
      setRecTyped(false);
      return;
    }
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      setRecTyped(true);
      return;
    }
    const t = window.setTimeout(() => setRecTyped(true), recMs + 400);
    return () => window.clearTimeout(t);
  }, [phase, recMs]);

  React.useEffect(() => {
    if (!recTyped) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      setDetailsShown(true);
      return;
    }
    const t = window.setTimeout(() => setDetailsShown(true), 450);
    return () => window.clearTimeout(t);
  }, [recTyped]);

  // The step's outbound email now fires from the Approve action itself (see
  // Workspace.onDecision): the draft auto-pops the moment the human approves, so
  // there's no separate "send" button to hunt for and the draft never gets
  // skipped on the way to the close.

  // Keep the rail hidden for the staged lead-in + wizard, so the spinner shares
  // the wizard's wide layout rather than sitting on a separate rail'd page.
  React.useEffect(() => {
    onWizardActive?.((hasWizard || hasRfq || hasSignals) && (phase === "loading" || phase === "working"));
    return () => onWizardActive?.(false);
  }, [phase, hasWizard, hasRfq, hasSignals, onWizardActive]);

  const viewThread = () => setEmailOpen(true);

  return (
    <section className="bg-white border border-divider rounded-md overflow-hidden flex flex-col">
      <header className="px-5 pt-4 pb-3 border-b border-divider">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-surface-deep text-ink-inverse flex items-center justify-center shrink-0">
            <agent.icon size={15} />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.08em] text-mute font-medium leading-none">
              {t("run.stepN", { n: step.n })}
            </div>
            <div className="text-[15px] font-bold text-ink leading-tight mt-0.5 truncate">
              {rt("agentName", step.agentName ?? agent.name)}
            </div>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-[12px] text-mute shrink-0">
            {revealed ? (
              <>
                <AIDot size={7} tone="green" /> {t("run.ready")}
              </>
            ) : (
              <>
                <Spinner size={13} /> {t("run.working")}
              </>
            )}
          </span>
        </div>
      </header>

      <div className="p-5 space-y-4">
        {/* The agent's opening thought — it reads & interprets the request in
            plain English (the NLP read) before it starts the structured work. */}
        {step.aiThought && (
          <div className="flex items-start gap-2.5 rounded-md bg-surface-mint/30 border border-surface-mint/70 px-3.5 py-2.5">
            <span className="mt-[1px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface-deep text-ink-inverse">
              <Sparkles size={11} />
            </span>
            <p className="text-[13px] text-ink leading-relaxed min-h-[1.2em]">
              <StreamingText text={rt("aiThought", step.aiThought)} cps={52} startDelay={150} />
            </p>
          </div>
        )}
        {phase === "loading" ? (
          /* Lead-in spinner — fills to 100%, then hands off to the wizard. */
          <StepProgress
            key="lead"
            agentName={step.agentName ?? agent.name}
            docLabel={step.docLabel}
            durationMs={LEAD_MS}
            onDone={() => setPhase("working")}
          />
        ) : phase === "working" && step.signals ? (
          /* The signal-fusion view — read N evidence signals as previewable rows,
             fuse them into an analysis, then reveal the prediction. */
          <SignalFusion spec={step.signals} onComplete={() => setPhase("revealed")} />
        ) : phase === "working" && step.rfq && !rfqDone ? (
          /* The RFQ flow — search → RFQ → send 2 vendor emails → quotes. When the
             step also carries stages (the merged sourcing step), hand off to the
             vendor-selection wizard next; otherwise straight to the reveal. */
          <RfqFlow rfq={step.rfq} onComplete={() => (step.stages ? setRfqDone(true) : setPhase("revealed"))} />
        ) : phase === "working" && step.quotes ? (
          /* The quotes, side by side — no document rail, because the replies
             are the evidence. It weighs them, then recommends one. */
          <QuoteReview spec={step.quotes} onComplete={() => setPhase("revealed")} />
        ) : phase === "working" && step.stages ? (
          /* The extraction wizard — validate each stage, then straight to reveal. */
          <ExtractionWizard
            flow={flow}
            stepN={step.n}
            stages={step.stages}
            sources={step.sources}
            onComplete={() => setPhase("revealed")}
            onChoice={onChoice}
          />
        ) : (
          /* The reveal — reasoning lines and the recommendation animate together. */
          <div className="space-y-4">
            {/* Reasoning — each line pops in (circle → check) on the shared clock,
                so the last check lands as the recommendation finishes typing. */}
            <div className="space-y-1.5">
              {reasoningLines.map((line, i) => {
                const shown = reasonClock >= i / reasoningLines.length;
                const checked = reasonClock >= (i + 1) / reasoningLines.length;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2 text-[12.5px] text-ink leading-snug transition-all duration-300",
                      shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
                    )}
                  >
                    {checked ? (
                      <Check size={13} className="text-surface-deep mt-[3px] shrink-0" strokeWidth={3} />
                    ) : (
                      <Spinner size={13} className="mt-[2px] shrink-0" />
                    )}
                    <span>{line}</span>
                  </div>
                );
              })}
            </div>

            {/* AI recommendation — types out, finishing in sync with the last check */}
            <div className="rounded-md bg-surface-mint/40 border border-surface-mint px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.08em] text-surface-deep font-bold">
                {t("run.aiRecommendation")}
              </div>
              <p className="text-[13px] text-ink leading-snug mt-1">
                <StreamingText text={rt("recommendation", step.recommendation)} cps={REC_CPS} onDone={handleRecTyped} />
              </p>
            </div>

            {/* The produced artifact + decision land after the recommendation */}
            {detailsShown && (
              <SpringIn className="space-y-4">
                {/* Produced document — swaps to the resolved version once the reply lands */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={13} className="text-surface-deep" />
                    <span className="text-[11px] uppercase tracking-[0.08em] text-surface-deep font-bold">
                      {showResolved ? t("run.updated") : t("run.produced")} · {step.docLabel}
                    </span>
                  </div>
                  {showResolved ? (
                    <SpringIn key="resolved-doc">{resolvedDoc}</SpringIn>
                  ) : (
                    producedDoc
                  )}
                </div>

                {/* The category question this step has just made answerable. */}
                {step.insight && (
                  <>
                    {step.insight.kind === "adoption" && <CatalogueAdoption spec={step.insight.spec} />}
                    {step.insight.kind === "demand" && <DemandSpread spec={step.insight.spec} />}
                    {step.insight.kind === "pricing" && <VolumePricing spec={step.insight.spec} />}
                    {step.insight.kind === "consolidation" && (
                      <SplitVsConsolidated spec={step.insight.spec} />
                    )}
                  </>
                )}

                {/* The agent's email — drafted here, but it auto-pops & sends from
                    the Approve action, so this card is a passive preview. */}
                {step.email && (
                  <AiDraftEmailCard
                    email={step.email}
                    sent={sent}
                    replied={replied}
                    awaiting={awaiting}
                    hasReply={!!step.email.reply}
                    onViewThread={step.email.reply ? viewThread : undefined}
                  />
                )}

                {decided && (
                  <div className={cn("flex items-center gap-2 text-[12.5px] font-medium", noteFor[status as Decision].cls)}>
                    <AIDot size={7} tone={status === "approved" ? "green" : status === "pending" ? "mute" : "red"} />
                    {isLast && status === "approved"
                      ? completeNote
                      : t(noteFor[status as Decision].key)}
                  </div>
                )}

                {/* Exception payoff — the halt resolves into an audit-grade envelope */}
                {decided && (status === "escalated" || status === "rejected") && step.exception && (
                  <ExceptionResolutionCard ex={step.exception} />
                )}

                {!(decided && status === "approved") && !awaiting && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {step.flagged && holdContinue ? (
                      <button
                        type="button"
                        onClick={onHoldContinue}
                        className="ui-pill inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold bg-[#c2740c] text-white hover:bg-[#a8640a]"
                      >
                        <AlertTriangle size={14} /> {holdContinue.label}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onDecision("approved")}
                        className={cn(
                          "ui-pill inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold whitespace-nowrap",
                          step.hasExceptions
                            ? "bg-[#c2740c] text-white hover:bg-[#a8640a]"
                            : "bg-surface-deep text-ink-inverse hover:bg-accent-green",
                        )}
                      >
                        {step.hasExceptions ? <AlertTriangle size={14} /> : <ThumbsUp size={14} />}{" "}
                        {decided
                          ? t("run.approveAnyway")
                          : step.hasExceptions
                            ? isLast
                              ? t("run.approveFlagsProceed")
                              : t("run.approveFlagsHandOff")
                            : isLast
                              ? t("run.approveProceed")
                              : t("run.approveHandOff")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDecision("pending")}
                      className="ui-pill inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium bg-white text-ink border border-ink/30 hover:bg-surface-fog"
                    >
                      <PauseCircle size={14} /> Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecision("escalated")}
                      className="ui-pill inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium bg-white text-ink border border-ink/30 hover:bg-surface-fog"
                    >
                      <ArrowUpRight size={14} /> Escalate
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecision("rejected")}
                      className="ui-pill inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium bg-white text-mark-red border border-mark-red/40 hover:bg-surface-rose"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                )}
              </SpringIn>
            )}
          </div>
        )}
      </div>

      {emailOpen && step.email && (
        <EmailReplyModal email={step.email} onClose={() => setEmailOpen(false)} />
      )}
    </section>
  );
}
