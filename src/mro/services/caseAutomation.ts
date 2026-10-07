/**
 * What the orchestrator does after a person or a request moves a catalogue
 * case: run the gate under the standing mandate, and once approval covers the
 * current revision, release the PO. Every step is a domain command, so the
 * gate decides — this file never approves anything on its own authority.
 */

import type { Command, CommandResult, RequestDraft } from "@/mro/domain/commands";
import { idemKey } from "@/mro/domain/commands";
import type { DomainState, Role } from "@/mro/domain/types";
import { STANDING_MANDATE } from "@/mro/data/seedDomain";

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
