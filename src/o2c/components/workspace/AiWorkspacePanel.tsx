import * as React from "react";
import { Check, ThumbsUp, PauseCircle, ArrowUpRight, X, Sparkles } from "lucide-react";
import { cn } from "@/o2c/lib/utils";
import { AIDot } from "@/o2c/components/ai/AIDot";
import { Spinner } from "@/o2c/components/ai/Spinner";
import { SpringIn } from "@/o2c/components/ai/SpringIn";
import { StreamingText } from "@/o2c/components/ai/StreamingText";
import { EmailReplyModal } from "@/o2c/components/workspace/EmailReplyModal";
import { AiDraftEmailCard } from "@/o2c/components/workspace/AiDraftEmailCard";
import { ExceptionResolutionCard } from "@/o2c/components/workspace/ExceptionResolutionCard";
import { ExtractionWizard } from "@/o2c/components/workspace/ExtractionWizard";
import { StepProgress } from "@/o2c/components/ai/StepProgress";
import { agentsById } from "@/o2c/data/agents";
import type { AgentOutputStatus } from "@/o2c/state";
import type { RunStep } from "@/o2c/data/runSteps";

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

const noteFor: Record<Decision, { label: string; cls: string }> = {
  approved: { label: "Approved · output handed to the next agent", cls: "text-surface-deep" },
  pending: { label: "On hold · parked for review, run can still continue", cls: "text-mute" },
  escalated: { label: "Escalated · routed to a human reviewer · run halted", cls: "text-mark-red" },
  rejected: { label: "Rejected · sent back with a flag · run halted", cls: "text-mark-red" },
};

export function AiWorkspacePanel({
  step,
  status,
  replied,
  isLast,
  completeNote = "Run complete · invoice released to AP, audit envelope closed",
  onReplyReceived,
  onDecision,
  onWizardActive,
  staged = false,
}: {
  step: RunStep;
  status: AgentOutputStatus;
  replied: boolean;
  isLast: boolean;
  /** Note shown when the final step is approved (happy-path close). */
  completeNote?: string;
  onReplyReceived: () => void;
  onDecision: (status: Decision) => void;
  /** Tells the workspace whether the staged wizard is running (to hide the rail). */
  onWizardActive?: (active: boolean) => void;
  /** True when this step plays the staged wizard (L2/L3); false reveals directly (L4). */
  staged?: boolean;
}) {
  const agent = agentsById[step.id];
  const hasWizard = staged && Boolean(step.stages);

  const [phase, setPhase] = React.useState<Phase>(hasWizard ? "loading" : "revealed");
  const [recTyped, setRecTyped] = React.useState(false);
  const [detailsShown, setDetailsShown] = React.useState(false);
  // 0 → 1 over the recommendation's typing duration; drives the reasoning checks.
  const [reasonClock, setReasonClock] = React.useState(0);
  const [emailOpen, setEmailOpen] = React.useState(false);

  const revealed = phase === "revealed";
  const decided = status !== "none";

  // Reasoning checklist — for wizard steps it mirrors the stages; otherwise the
  // step's own reasoning lines.
  const reasoningLines = hasWizard ? step.stages!.map((s) => s.reasoning) : step.reasoning;

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

  // Keep the rail hidden for the staged lead-in + wizard, so the spinner shares
  // the wizard's wide layout rather than sitting on a separate rail'd page.
  React.useEffect(() => {
    onWizardActive?.(hasWizard && (phase === "loading" || phase === "working"));
    return () => onWizardActive?.(false);
  }, [phase, hasWizard, onWizardActive]);

  const sendEmail = () => {
    if (!replied) onReplyReceived();
  };
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
              Step {step.n} · Process run
            </div>
            <div className="text-[15px] font-bold text-ink leading-tight mt-0.5 truncate">
              {step.agentName ?? agent.name}
            </div>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-[12px] text-mute shrink-0">
            {revealed ? (
              <>
                <AIDot size={7} tone="green" /> Ready
              </>
            ) : (
              <>
                <Spinner size={13} /> Working
              </>
            )}
          </span>
        </div>
      </header>

      <div className="p-5 space-y-4">
        {phase === "loading" ? (
          /* Lead-in spinner — fills to 100%, then hands off to the wizard. */
          <StepProgress
            key="lead"
            agentName={step.agentName ?? agent.name}
            docLabel={step.docLabel}
            durationMs={LEAD_MS}
            onDone={() => setPhase("working")}
          />
        ) : phase === "working" && step.stages ? (
          /* The extraction wizard — validate each stage, then straight to reveal. */
          <ExtractionWizard
            stages={step.stages}
            sources={step.sources}
            onComplete={() => setPhase("revealed")}
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
                AI recommendation
              </div>
              <p className="text-[13px] text-ink leading-snug mt-1">
                <StreamingText text={step.recommendation} cps={REC_CPS} onDone={handleRecTyped} />
              </p>
            </div>

            {/* The produced artifact + decision land after the recommendation */}
            {detailsShown && (
              <SpringIn className="space-y-4">
                {/* Produced document */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={13} className="text-surface-deep" />
                    <span className="text-[11px] uppercase tracking-[0.08em] text-surface-deep font-bold">
                      Produced · {step.docLabel}
                    </span>
                  </div>
                  {step.document}
                </div>

                {/* Email round-trip — the agent drafts it, the buyer reviews and sends */}
                {step.email && (
                  <AiDraftEmailCard
                    email={step.email}
                    sent={replied}
                    onSend={sendEmail}
                    onViewThread={viewThread}
                    sendLabel={step.email.cta}
                  />
                )}

                {decided && (
                  <div className={cn("flex items-center gap-2 text-[12.5px] font-medium", noteFor[status as Decision].cls)}>
                    <AIDot size={7} tone={status === "approved" ? "green" : status === "pending" ? "mute" : "red"} />
                    {isLast && status === "approved"
                      ? completeNote
                      : noteFor[status as Decision].label}
                  </div>
                )}

                {/* Exception payoff — the halt resolves into an audit-grade envelope */}
                {decided && (status === "escalated" || status === "rejected") && step.exception && (
                  <ExceptionResolutionCard ex={step.exception} />
                )}

                {!(decided && status === "approved") && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onDecision("approved")}
                      className="ui-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold bg-surface-deep text-ink-inverse hover:bg-accent-green"
                    >
                      <ThumbsUp size={14} /> {decided ? "Approve anyway" : "Approve & hand off"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecision("pending")}
                      className="ui-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium bg-white text-ink border border-ink/30 hover:bg-surface-fog"
                    >
                      <PauseCircle size={14} /> Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecision("escalated")}
                      className="ui-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium bg-white text-ink border border-ink/30 hover:bg-surface-fog"
                    >
                      <ArrowUpRight size={14} /> Escalate
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecision("rejected")}
                      className="ui-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium bg-white text-mark-red border border-mark-red/40 hover:bg-surface-rose"
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
