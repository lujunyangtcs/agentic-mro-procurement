/**
 * The agent run workspace — generalized across the three transactions.
 *
 * Reads the active flow's run definition from `flowRuns` and plays the same
 * gated, two-column interaction for any of them: the agent-step rail + source
 * files (left), and the AI workspace (right, wide: streamed reasoning · the
 * produced SAP artifact · the inline supplier email round-trip · the decision).
 *
 * Approving hands the output to the next agent and advances the run; on the
 * final step it closes the run on its happy path. A non-approve decision
 * (escalate / reject) halts the run on an exception — the flow's terminal pill
 * reflects whether the run was paid, released or blocked.
 */

import * as React from "react";
import { flowRuns } from "@/freight/data/flowRuns";
import { useApp, type FlowId, type Decision } from "@/freight/state";
import { agentsById, type AgentId } from "@/freight/data/agents";
import { type SourceArtifact } from "@/freight/data/runSteps";
import { WorkspaceTopbar } from "@/freight/components/workspace/WorkspaceTopbar";
import { RunStepsRail } from "@/freight/components/workspace/RunStepsRail";
import { SourceFilesPanel } from "@/freight/components/workspace/SourceFilesPanel";
import { AiWorkspacePanel } from "@/freight/components/workspace/AiWorkspacePanel";
import { HandoffOverlay } from "@/freight/components/workspace/HandoffOverlay";
import { FlowCompleteModal } from "@/freight/components/workspace/FlowCompleteModal";
import { SourceArtifactModal } from "@/freight/components/workspace/SourceArtifactModal";
import { Toast } from "@/freight/components/workspace/Toast";

type ToastState = { id: number; title: string; body: string } | null;

export function Workspace({ flow }: { flow: FlowId }) {
  const { flowProgress, setFlowProgress, go, agentConfig } = useApp();
  const run = flowRuns[flow];
  const steps = run.steps;
  const LAST = steps.length - 1;

  const prog = flowProgress[flow];
  const { activeStep, decisions, settled } = prog;

  const [selectedStep, setSelectedStep] = React.useState(Math.min(activeStep, LAST));
  const [openSource, setOpenSource] = React.useState<SourceArtifact | null>(null);
  const [replies, setReplies] = React.useState<Record<number, boolean>>({});
  const [toast, setToast] = React.useState<ToastState>(null);
  const [handoff, setHandoff] = React.useState<
    { from: AgentId; to?: AgentId; toName?: string; toLabel?: string; docLabel?: string } | null
  >(null);
  // Approve fires a step's AI-drafted email, then the handoff waits for the reply
  // round-trip to land — never a separate "send" click. Guards re-entrancy.
  const emailFlightRef = React.useRef(false);
  const [showComplete, setShowComplete] = React.useState(false);
  // True while the active step plays its staged wizard — the rail hides so the
  // form + source pane get the full width; restored once the document lands.
  const [wizardActive, setWizardActive] = React.useState(false);

  const step = steps[selectedStep];
  const replied = !!replies[selectedStep];
  // Autonomy level drives the run experience: L2/L3 supervise via the staged
  // wizard; L4 (Autonomous) skips it and reveals the finished document directly.
  const staged = Boolean(step.stages) && agentConfig[step.id].level !== 4;

  const sources =
    step.email && replied ? [...step.sources, step.email.reply.source] : step.sources;

  const fireToast = (title: string, body: string) =>
    setToast((t) => ({ id: (t?.id ?? 0) + 1, title, body }));

  // The handoff / advance / settle once a step is committed (after any email round-trip).
  const advance = (status: Decision, isLast: boolean, nextDecisions: Record<number, Decision>) => {
    // Approve an intermediate step → visible baton-pass carrying the produced file.
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

  const onDecision = (status: Decision) => {
    const isLast = selectedStep === LAST;
    const nextDecisions = { ...decisions, [selectedStep]: status };

    // Approving a step whose AI-drafted email hasn't been sent → fire the email
    // first (no separate "send" click), then wait for the reply round-trip to land
    // before the handoff. One-shot: re-entrancy is guarded.
    if (status === "approved" && step.email && !replied && !emailFlightRef.current) {
      emailFlightRef.current = true;
      window.setTimeout(() => {
        onReplyReceived(); // the reply lands in the sources + toast
        window.setTimeout(() => {
          emailFlightRef.current = false;
          advance("approved", isLast, nextDecisions);
        }, 1100);
      }, 900);
      return;
    }

    advance(status, isLast, nextDecisions);
  };

  const onReplyReceived = () => {
    if (!step.email) return;
    setReplies((r) => ({ ...r, [selectedStep]: true }));
    fireToast(step.email.toastTitle, step.email.toastBody);
  };

  const pill = settled
    ? run.terminal(decisions)
    : { label: run.reviewPill, kind: "progress" as const };

  return (
    <div className="h-screen flex flex-col bg-[color-mix(in_srgb,var(--surface-mint)_14%,var(--surface-fog))]">
      <WorkspaceTopbar
        title={run.contextTitle}
        sub={run.contextSub}
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
                steps={steps}
                activeStep={activeStep}
                selectedStep={selectedStep}
                decisions={decisions}
                onSelect={setSelectedStep}
              />
              <SourceFilesPanel
                sources={sources}
                onOpen={setOpenSource}
                newSourceId={step.email && replied ? step.email.reply.source.id : undefined}
              />
            </div>
          )}

          <div className="relative min-h-0 overflow-y-auto">
            <AiWorkspacePanel
              key={selectedStep}
              step={step}
              status={decisions[selectedStep] ?? "none"}
              replied={replied}
              isLast={selectedStep === LAST}
              completeNote={run.completeNote}
              onDecision={onDecision}
              onWizardActive={setWizardActive}
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

      <SourceArtifactModal source={openSource} onClose={() => setOpenSource(null)} />

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
