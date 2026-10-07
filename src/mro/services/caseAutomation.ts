/**
 * What the orchestrator does after a person or a request moves a catalogue
 * case: run the gate under the standing mandate, and once approval covers the
 * current revision, release the PO. Every step is a domain command, so the
 * gate decides — this file never approves anything on its own authority.
 */

import type { Command, CommandResult, RequestDraft } from "@/mro/domain/commands";
import { idemKey } from "@/mro/domain/commands";
import type { Actor, DomainState, Role } from "@/mro/domain/types";
import { STANDING_MANDATE_ID } from "@/mro/domain/reducer";
import { stepDef } from "@/mro/domain/flows";

export const STANDING_MANDATE: Actor = { kind: "policy", policyVersion: "POL-DEMO-1", mandateId: STANDING_MANDATE_ID };

type Dispatch = (cmd: Command) => CommandResult;

export function releasePo(dispatch: Dispatch, state: DomainState, caseId: string): CommandResult {
  const rev = state.cases[caseId].revision;
  dispatch({ type: "clock.advance", actor: STANDING_MANDATE, minutes: 1, idempotencyKey: `clock:${caseId}:po:r${rev}` });
  return dispatch({ type: "po.release", actor: STANDING_MANDATE, caseId, expectedRevision: rev, idempotencyKey: idemKey(caseId, "F1", "po", rev) });
}

/** Gate the current revision; release the PO when the gate passes on its own. */
export function routeCase(dispatch: Dispatch, state: DomainState, caseId: string): CommandResult {
  const rev = state.cases[caseId].revision;
  const approved = dispatch({
    type: "request.approve",
    actor: STANDING_MANDATE,
    caseId,
    expectedRevision: rev,
    idempotencyKey: idemKey(caseId, "F1", "approve", rev),
  });
  if (!approved.ok) return approved;
  return releasePo(dispatch, approved.state, caseId);
}

/** Let the orchestrator run each queued agent step until the run reaches a person, a block or its end. */
function runQueuedSteps(dispatch: Dispatch, state: DomainState, runId: string): CommandResult | undefined {
  let s = state;
  let last: CommandResult | undefined;
  for (let guard = 0; guard < 40; guard++) {
    const run = s.runs[runId];
    if (!run || run.closedAt || !run.current || run.steps[run.current].status !== "queued") break;
    last = dispatch({ type: "step.run", actor: { kind: "agent", agentId: "orchestrator", policyVersion: s.policies.active }, runId, stepId: run.current, idempotencyKey: `auto:${runId}:${run.current}` });
    if (!last.ok) break;
    s = last.state;
  }
  return last;
}

let submitSeq = 0;

export function submitRequest(dispatch: Dispatch, draft: RequestDraft, requester: Role = "requester"): CommandResult {
  submitSeq += 1;
  const submitted = dispatch({
    type: "request.submit",
    actor: { kind: "human", role: requester, name: draft.requester },
    draft,
    idempotencyKey: `submit:${draft.originalText}:${Date.now()}:${submitSeq}`,
  });
  if (!submitted.ok || !submitted.caseId || submitted.duplicate) return submitted;
  routeCase(dispatch, submitted.state, submitted.caseId);
  return submitted;
}

/** A named person decides an approval task; an approval then releases the PO. */
export function decideTask(
  dispatch: Dispatch,
  state: DomainState,
  taskId: string,
  outcome: "approved" | "rejected",
  role: Role,
  name: string,
  reason?: string,
): CommandResult {
  const task = state.tasks[taskId];
  const rev = state.cases[task.caseId].revision;

  /* A task a workflow step opened is decided on that step, so the run moves on and can close. */
  const run = Object.values(state.runs).find((r) => !r.closedAt && r.current && r.steps[r.current].taskId === taskId && r.steps[r.current].status === "waiting");
  if (run) {
    const def = stepDef(run.flow, run.current!);
    const option = def?.options?.find((o) => (outcome === "approved" ? o.tone === "approve" : o.tone === "reject"));
    if (!option) return { ok: false, state, error: "invalid-draft", message: `No ${outcome} option on ${run.current}` };
    const decided = dispatch({ type: "step.decide", actor: { kind: "human", role, name }, runId: run.id, stepId: run.current!, optionId: option.id, note: reason, idempotencyKey: `decide:${run.id}:${run.current}:${taskId}` });
    if (!decided.ok) return decided;
    return runQueuedSteps(dispatch, decided.state, run.id) ?? decided;
  }

  const decided = dispatch({
    type: "approval.decide",
    actor: { kind: "human", role, name },
    taskId,
    expectedRevision: rev,
    outcome,
    reason,
    idempotencyKey: `${idemKey(task.caseId, "F1", `decide:${taskId}`, rev)}`,
  });
  if (!decided.ok || outcome === "rejected") return decided;
  const released = releasePo(dispatch, decided.state, task.caseId);
  return released.ok ? { ...released, eventIds: [...decided.eventIds, ...released.eventIds] } : released;
}
