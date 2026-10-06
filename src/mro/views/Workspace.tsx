/**
 * The agent run workspace — generalized across the three transactions.
 *
 * Reads the active flow's run definition from `flowRuns` and plays the same
 * gated, two-column interaction for any of them: the agent-step rail + source
 * files (left), and the AI workspace (right, wide: streamed reasoning · the
 * produced SAP artifact · the supplier email round-trip · the decision).
 *
 * Email choreography (the "automation" feel): a step's outbound email fires the
 * moment the human clicks Approve — the draft auto-pops, they send, and the run
 * continues. A ONE-WAY email (no `reply`) just sends and hands off immediately;
 * only an email that carries a `reply` (a signed approval) waits for the round-
 * trip. An inbound email (the vendor's invoice) pops on the step it arrives at,
 * previewable, before that step's work runs.
 *
 * Approving hands the output to the next agent and advances the run; on the
 * final step it closes the run on its happy path. A non-approve decision
 * (escalate / reject) halts the run on an exception — the flow's terminal pill
 * reflects whether the run was paid, released or blocked.
 */

import * as React from "react";
import { flowRuns } from "@/mro/data/flowRuns";
import { useApp, type FlowId, type Decision } from "@/mro/state";
import { agentsById, type AgentId } from "@/mro/data/agents";
import { type SourceArtifact } from "@/mro/data/runSteps";
import { WorkspaceTopbar } from "@/mro/components/workspace/WorkspaceTopbar";
import { RunStepsRail } from "@/mro/components/workspace/RunStepsRail";
import { SourceFilesPanel } from "@/mro/components/workspace/SourceFilesPanel";
import { AiWorkspacePanel } from "@/mro/components/workspace/AiWorkspacePanel";
import { HandoffOverlay } from "@/mro/components/workspace/HandoffOverlay";
import { FlowCompleteModal } from "@/mro/components/workspace/FlowCompleteModal";
import { SourceArtifactModal } from "@/mro/components/workspace/SourceArtifactModal";
import { Toast } from "@/mro/components/workspace/Toast";
import { EmailReceivedModal } from "@/mro/components/workspace/EmailReceivedModal";
import { BudgetApprovalSignableModal } from "@/mro/components/workspace/BudgetApprovalSignable";
import { EmailDraftModal } from "@/mro/components/workspace/EmailDraftModal";
import { InboundEmailModal } from "@/mro/components/workspace/InboundEmailModal";
import { useFlowText } from "@/mro/lib/i18n";

type ToastState = { id: number; title: string; body: string } | null;

export function Workspace({ flow }: { flow: FlowId }) {
  const ft = useFlowText(flow);
  const { flowProgress, setFlowProgress, go, agentConfig } = useApp();
  const run = flowRuns[flow];
  // A sourcing decision in the PR step reshapes the run: choosing the on-contract
  // vendor skips the competitive RFQ step, so the run drops from 7 steps to 6.
  // The PR-step choice cards set this — but a run can also be entered past that
  // step (the intake desk hands off at step 2), in which case the decision
  // arrives on the progress record instead.
  const [dropRfq, setDropRfq] = React.useState(
    () => (flowProgress[flow]?.sourcing ?? "rfq") === "contract",
  );
  const steps = React.useMemo(() => {
    if (!dropRfq) return run.steps;
    return run.steps.filter((s) => !s.rfq).map((s, i) => ({ ...s, n: i + 1 }));
  }, [run.steps, dropRfq]);
  const LAST = steps.length - 1;

  // Fallback guards a newly-added FlowId whose progress entry isn't in an
  // already-initialised state yet (e.g. across an HMR reload before remount).
  const prog = flowProgress[flow] ?? { activeStep: 0, approved: false, decisions: {}, settled: false };
  const { activeStep, decisions, settled } = prog;

  const [selectedStep, setSelectedStep] = React.useState(Math.min(activeStep, LAST));
  const [openSource, setOpenSource] = React.useState<SourceArtifact | null>(null);
  const [replies, setReplies] = React.useState<Record<number, boolean>>({});
  // Per-step "the outbound email has been sent" (one-way: done; reply: round-trip in flight).
  const [sent, setSent] = React.useState<Record<number, boolean>>({});
  const [toast, setToast] = React.useState<ToastState>(null);
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [resolved, setResolved] = React.useState<Record<number, boolean>>({});
  // Per-step "sent, reply in flight" — set on send, cleared when the receipt lands.
  const [awaiting, setAwaiting] = React.useState<Record<number, boolean>>({});
  // Open state for the signable budget-approval modal (signable emails only).
  const [signOpen, setSignOpen] = React.useState(false);
  // Open state for the pop-up email draft (normal emails — review then send).
  const [draftOpen, setDraftOpen] = React.useState(false);
  // Open state for an inbound email (the vendor's invoice) with a previewable PDF.
  const [inboundEmailOpen, setInboundEmailOpen] = React.useState(false);
  // Which steps have already popped their inbound email/source (so it fires once on open).
  const [inboundShown, setInboundShown] = React.useState<Record<number, boolean>>({});
  // A decision deferred until the step's email completes (fire-on-approve).
  const pendingCommitRef = React.useRef<null | (() => void)>(null);
  const [handoff, setHandoff] = React.useState<
    { from: AgentId; to?: AgentId; toName?: string; toLabel?: string; docLabel?: string } | null
  >(null);
  const [showComplete, setShowComplete] = React.useState(false);
  // True while the active step plays its staged wizard — the rail hides so the
  // form + source pane get the full width; restored once the document lands.
  const [wizardActive, setWizardActive] = React.useState(false);

  const step = steps[selectedStep];
  const replied = !!replies[selectedStep];
  const emailSent = !!sent[selectedStep];
  // Autonomy level drives the run experience: L2/L3 supervise via the staged
  // wizard; L4 (Autonomous) skips it and reveals the finished document directly.
  const staged =
    (Boolean(step.stages) || Boolean(step.rfq) || Boolean(step.quotes) || Boolean(step.signals)) &&
    agentConfig[step.id].level !== 4;

  const sources =
    step.email?.reply && replied ? [...step.sources, step.email.reply.source] : step.sources;

  const fireToast = (title: string, body: string) =>
    setToast((t) => ({ id: (t?.id ?? 0) + 1, title, body }));

  // The actual handoff/settle for a decision (called directly, or deferred until
  // a fire-on-approve email completes).
  const commitDecision = (status: Decision) => {
    const nextDecisions = { ...decisions, [selectedStep]: status };
    const isLast = selectedStep === LAST;

    // Approve an intermediate step → visible baton-pass to the next agent.
    if (status === "approved" && !isLast) {
      const next = selectedStep + 1;
      setHandoff({ from: step.id, to: steps[next].id, docLabel: step.docLabel });
      window.setTimeout(() => {
        setFlowProgress(flow, { decisions: nextDecisions, activeStep: Math.max(activeStep, next) });
        setSelectedStep(next);
        setHandoff(null);
        const fromName = step.agentName ?? agentsById[step.id].name;
        const toName = steps[next].agentName ?? agentsById[steps[next].id].menuLabel;
        fireToast(
          "Output approved",
          fromName === toName
            ? `${fromName} advanced to the next step.`
            : `${fromName} handed off to ${toName}.`,
        );
      }, 1300);
      return;
    }

    if (status === "pending") {
      setFlowProgress(flow, { decisions: nextDecisions });
      return;
    }

    // Terminal decision: approve the final step (happy close) or escalate/reject (halt).
    const approvedClose = status === "approved";
    const settle = () => {
      setFlowProgress(flow, {
        decisions: nextDecisions,
        activeStep: steps.length,
        approved: approvedClose,
        settled: true,
      });
      fireToast(approvedClose ? "Run complete" : "Run halted", run.terminal(nextDecisions).label);
    };

    // The last step hands its output to the run's final owner, then the close
    // ceremony lands. An escalate/reject on an earlier step just settles.
    if (isLast && run.completion) {
      setHandoff({
        from: step.id,
        toName: run.completion.routedTo,
        toLabel: run.completion.routedSub,
        docLabel: step.docLabel,
      });
      window.setTimeout(() => {
        settle();
        setHandoff(null);
        setShowComplete(true);
      }, 1300);
    } else {
      settle();
    }
  };

  // Opens the step's outbound email (signable → the approval pad; otherwise the
  // draft pop-up). The reviewer sends it; the deferred decision commits after.
  const fireEmail = () => {
    if (!step.email) return;
    if (step.email.signable) setSignOpen(true);
    else setDraftOpen(true);
  };

  // Decision entry point. Approving a step whose email hasn't been sent yet pops
  // the email FIRST (auto, on the Approve click) and defers the handoff until it
  // is sent — no separate "send" button to hunt for.
  const onDecision = (status: Decision) => {
    // A reply is still in flight (email sent, receipt not yet landed) — ignore any
    // further decision so a stray click can't skip the reply and close early.
    if (awaiting[selectedStep]) return;
    if (status === "approved" && step.email && !emailSent) {
      pendingCommitRef.current = () => commitDecision("approved");
      fireEmail();
      return;
    }
    commitDecision(status);
  };

  const runPendingCommit = () => {
    const commit = pendingCommitRef.current;
    pendingCommitRef.current = null;
    commit?.();
  };

  // A choice-stage pick in the PR step reshapes the run: the on-contract vendor
  // skips the RFQ, sourcing off-contract keeps it. Frozen once the run has
  // advanced past the PR step, so downstream step indices stay stable.
  const onSourcingChoice = (optionId: string) => {
    if (activeStep > 0) return;
    if (optionId === "on-contract") {
      setDropRfq(true);
      setFlowProgress(flow, { sourcing: "contract" });
    } else if (optionId === "off-contract") {
      setDropRfq(false);
      setFlowProgress(flow, { sourcing: "rfq" });
    }
  };

  // "Continue the run" on a flagged step — advance past it but keep it parked
  // (the step stays on hold / flagged in the rail), and surface the flow's note.
  const commitHoldContinue = () => {
    if (!run.holdContinue) return commitDecision("approved");
    const { toastTitle, toastBody } = run.holdContinue;
    if (selectedStep === LAST) {
      commitDecision("approved");
      fireToast(toastTitle, toastBody);
      return;
    }
    const next = selectedStep + 1;
    const nextDecisions = { ...decisions, [selectedStep]: "pending" as Decision };
    setHandoff({ from: step.id, to: steps[next].id, docLabel: step.docLabel });
    window.setTimeout(() => {
      setFlowProgress(flow, { decisions: nextDecisions, activeStep: Math.max(activeStep, next) });
      setSelectedStep(next);
      setHandoff(null);
      fireToast(toastTitle, toastBody);
    }, 1300);
  };

  // A flagged step's amber "continue" also fires its email first (the renewal /
  // notification the agent drafted) before parking and advancing.
  const onHoldContinue = () => {
    if (step.email && !emailSent) {
      pendingCommitRef.current = commitHoldContinue;
      fireEmail();
      return;
    }
    commitHoldContinue();
  };

  // Both pop-ups run the same reply round-trip on send/sign: wait a beat, then the receipt lands.
  const runReplyRoundtrip = () => {
    const at = selectedStep;
    setAwaiting((a) => ({ ...a, [at]: true }));
    window.setTimeout(() => setReceiptOpen(true), 3000);
  };

  const onSigned = () => {
    setSignOpen(false);
    setSent((s) => ({ ...s, [selectedStep]: true }));
    runReplyRoundtrip();
  };

  const onEmailSent = () => {
    setDraftOpen(false);
    setSent((s) => ({ ...s, [selectedStep]: true }));
    if (step.email?.reply) {
      // A reply-gated email (a signed approval) waits for the round-trip.
      runReplyRoundtrip();
    } else {
      // One-way email: it just sent — resolve the open item, toast, and let the
      // deferred Approve hand off immediately. No 3s wait, no receipt.
      if (step.email?.resolvedDocument) setResolved((r) => ({ ...r, [selectedStep]: true }));
      if (step.email?.toastTitle) fireToast(step.email.toastTitle, step.email.toastBody ?? "");
      runPendingCommit();
    }
  };

  // "View reply" lands the reply in the sources AND opens it as a real email.
  const onViewReply = () => {
    if (!step.email?.reply) return;
    setReplies((r) => ({ ...r, [selectedStep]: true }));
    setAwaiting((a) => ({ ...a, [selectedStep]: false }));
    if (step.email.toastTitle) fireToast(step.email.toastTitle, step.email.toastBody ?? "");
    setReceiptOpen(false);
    setOpenSource(step.email.reply.source);
  };

  // Closing the reply email resolves the step's open item — the produced doc
  // updates — and lets the deferred Approve hand off.
  const closeSource = () => {
    if (step.email?.reply && openSource && openSource.id === step.email.reply.source.id) {
      setResolved((r) => ({ ...r, [selectedStep]: true }));
      setOpenSource(null);
      runPendingCommit();
      return;
    }
    setOpenSource(null);
  };

  // An inbound event attached to a step pops the moment the step opens (once):
  // a plain source modal, or — when it carries a previewable attachment — the
  // received-email pop-up (the vendor's invoice arriving before the match).
  React.useEffect(() => {
    if (inboundShown[selectedStep]) return;
    if (!step.inbound && !step.inboundEmail) return;
    const t = window.setTimeout(() => {
      if (step.inboundEmail) setInboundEmailOpen(true);
      else if (step.inbound) setOpenSource(step.inbound.source);
      setInboundShown((m) => ({ ...m, [selectedStep]: true }));
    }, 900);
    return () => window.clearTimeout(t);
  }, [selectedStep, step, inboundShown]);

  const pill = settled
    ? run.terminal(decisions)
    : { label: ft("reviewPill", run.reviewPill), kind: "progress" as const };

  return (
    <div className="h-screen flex flex-col bg-[color-mix(in_srgb,var(--surface-mint)_14%,var(--surface-fog))]">
      <WorkspaceTopbar
        title={ft("contextTitle", run.contextTitle)}
        sub={ft("contextSub", run.contextSub)}
        statusPill={pill.label}
        statusKind={pill.kind}
      />

      <div className="flex-1 min-h-0 px-5 py-4">
        <div
          className={
            "h-full grid gap-3 " +
            (wizardActive ? "grid-cols-[minmax(0,1fr)]" : "grid-cols-[300px_minmax(0,1fr)]")
          }
        >
          {!wizardActive && (
            <div className="min-h-0 overflow-y-auto flex flex-col gap-3">
              <RunStepsRail
                flow={flow}
                steps={steps}
                activeStep={activeStep}
                selectedStep={selectedStep}
                decisions={decisions}
                onSelect={setSelectedStep}
              />
              <SourceFilesPanel
                sources={sources}
                onOpen={setOpenSource}
                newSourceId={step.email?.reply && replied ? step.email.reply.source.id : undefined}
              />
            </div>
          )}

          <div className="relative min-h-0 overflow-y-auto">
            <AiWorkspacePanel
              key={selectedStep}
              step={step}
              flow={flow}
              status={decisions[selectedStep] ?? "none"}
              replied={replied}
              sent={emailSent}
              awaiting={!!awaiting[selectedStep]}
              resolved={!!resolved[selectedStep]}
              isLast={selectedStep === LAST}
              completeNote={run.completeNote}
              holdContinue={run.holdContinue}
              onDecision={onDecision}
              onHoldContinue={onHoldContinue}
              onWizardActive={setWizardActive}
              onChoice={onSourcingChoice}
              useAltDoc={!dropRfq}
              staged={staged}
            />
            {handoff && (
              <HandoffOverlay
                from={handoff.from}
                to={handoff.to}
                toName={handoff.toName}
                toLabel={handoff.toLabel}
                docLabel={handoff.docLabel}
              />
            )}
          </div>
        </div>
      </div>

      {showComplete && run.completion && (
        <FlowCompleteModal
          run={run}
          onOpenArtifact={setOpenSource}
          onBackToCockpit={() => go({ kind: "cockpit" })}
          onClose={() => setShowComplete(false)}
        />
      )}

      <SourceArtifactModal source={openSource} onClose={closeSource} />

      {inboundEmailOpen && step.inboundEmail && (
        <InboundEmailModal email={step.inboundEmail} onClose={() => setInboundEmailOpen(false)} />
      )}

      {receiptOpen && step.email?.reply && (
        <EmailReceivedModal
          from={step.email.reply.from}
          subject={step.email.reply.subject}
          onView={onViewReply}
        />
      )}

      {step.email?.signable && (
        <BudgetApprovalSignableModal
          open={signOpen}
          onClose={() => setSignOpen(false)}
          onSigned={onSigned}
          approval={step.email.signable.approval}
        />
      )}

      {draftOpen && step.email && !step.email.signable && (
        <EmailDraftModal
          draft={{
            to: step.email.to,
            subject: step.email.subject,
            body: step.email.lines,
            /* When the message goes out in the supplier's language, the
               English travels with it so it can be checked before sending. */
            review: step.email.review,
            attachment: step.email.attachment,
            attachmentLabel: step.email.attachmentLabel,
          }}
          onClose={() => setDraftOpen(false)}
          onSent={onEmailSent}
        />
      )}

      {toast && (
        <Toast
          key={toast.id}
          show
          title={toast.title}
          body={toast.body}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
