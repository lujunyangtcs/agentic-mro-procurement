/**
 * Read model for one Flow 1 case: step states derived from the domain record
 * (never from a stored index), the open approval tasks and holds, the PO for
 * the current revision and its follow-ups.
 */

import type { ApprovalTask, DomainState, FollowUp, PurchaseOrder, Role } from "@/mro/domain/types";
import { currentRevision, revisionTotal } from "@/mro/domain/selectors";

export type StepKey = "intake" | "classify" | "approval" | "po" | "followUp";
export type StepState = "done" | "current" | "waiting" | "todo" | "failed";

export type CaseView = {
  steps: { key: StepKey; state: StepState }[];
  openTasks: ApprovalTask[];
  decidedTasks: ApprovalTask[];
  po?: PurchaseOrder;
  failedPo?: PurchaseOrder;
  followUps: FollowUp[];
  total: number;
  approved: boolean;
};

export function caseView(state: DomainState, caseId: string): CaseView | undefined {
  const c = state.cases[caseId];
  if (!c) return undefined;
  const rev = currentRevision(state, caseId)!;
  const req = state.requests[c.requestId];
  const tasks = Object.values(state.tasks).filter((t) => t.caseId === caseId && t.caseRevision === c.revision && !t.supersededAt);
  const openTasks = tasks.filter((t) => !t.outcome);
  const decidedTasks = Object.values(state.tasks).filter((t) => t.caseId === caseId && t.outcome);
  const pos = Object.values(state.pos).filter((p) => p.caseId === caseId && p.requestRevision === c.revision);
  const po = pos.find((p) => p.dispatch.state === "dispatched");
  const failedPo = po ? undefined : pos.find((p) => p.dispatch.state === "failed");
  const followUps = Object.values(state.followUps).filter((f) => f.caseId === caseId);
  const approved = req.approvedRevision === c.revision;
  const gated = state.audit.some((e) => e.caseId === caseId && e.type === "gate.evaluated" && e.caseRevision === c.revision);
  const rejected = decidedTasks.some((t) => t.caseRevision === c.revision && t.outcome === "rejected");

  const steps: CaseView["steps"] = [
    { key: "intake", state: "done" },
    { key: "classify", state: gated ? "done" : "current" },
    {
      key: "approval",
      state: approved ? "done" : rejected ? "failed" : openTasks.length > 0 ? "waiting" : gated ? "current" : "todo",
    },
    { key: "po", state: po ? "done" : failedPo ? "failed" : approved ? "current" : "todo" },
    {
      key: "followUp",
      state: po?.acknowledgedAt ? "done" : po ? (followUps.some((f) => !f.closedAt) ? "waiting" : "current") : "todo",
    },
  ];

  return { steps, openTasks, decidedTasks, po, failedPo, followUps, total: revisionTotal(rev), approved };
}

/** Whether this role may decide the task: its own role, or a higher DoA tier covering the amount. */
export function canDecide(state: DomainState, task: ApprovalTask, role: Role): boolean {
  if (task.role === role) return true;
  const c = state.cases[task.caseId];
  const policy = state.policies.versions[c.policyVersion];
  const tier = policy?.doa.find((x) => x.role === role);
  return !!tier && task.amount <= tier.maxInclusive;
}
