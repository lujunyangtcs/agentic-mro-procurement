/**
 * Phase 2: the demo boots empty. Cases are created live from New Request.
 * `runCatalogue` remains as the scripted path for tests and the presenter's
 * "run end to end" control — it travels the same commands, never writes
 * state directly.
 */

import type { Command, CommandResult } from "@/mro/domain/commands";
import { idemKey } from "@/mro/domain/commands";
import { handleCommand, initialDomainState, STANDING_MANDATE_ID } from "@/mro/domain/reducer";
import type { Actor, DomainState } from "@/mro/domain/types";
import { DEMO_POLICY } from "@/mro/data/policies";
import { catalogueFixture } from "@/mro/data/storyFixtures";

export const STANDING_MANDATE: Actor = { kind: "policy", policyVersion: DEMO_POLICY.version, mandateId: STANDING_MANDATE_ID };
export const REQUESTER: Actor = { kind: "human", role: "requester", name: "Halewood stores controller" };

function run(state: DomainState, cmd: Command): DomainState {
  const r: CommandResult = handleCommand(state, cmd);
  return r.state;
}

/** Approve and release an already-submitted case under the standing mandate. */
export function runStanding(state: DomainState, caseId: string): DomainState {
  const rev = state.cases[caseId].revision;
  let s = run(state, { type: "request.approve", actor: STANDING_MANDATE, caseId, expectedRevision: rev, idempotencyKey: idemKey(caseId, "F1", "approve", rev) });
  if (s.requests[s.cases[caseId].requestId].approvedRevision !== rev) return s;
  s = run(s, { type: "clock.advance", actor: STANDING_MANDATE, minutes: 1, idempotencyKey: `clock:${caseId}:po:${rev}` });
  return run(s, { type: "po.release", actor: STANDING_MANDATE, caseId, expectedRevision: rev, idempotencyKey: idemKey(caseId, "F1", "po", rev) });
}

/** Submit, approve and release one catalogue request through the commands. */
export function runCatalogue(state: DomainState, packs = 10): { state: DomainState; caseId?: string } {
  const submitted = handleCommand(state, {
    type: "request.submit",
    actor: REQUESTER,
    draft: catalogueFixture(packs),
    idempotencyKey: `submit:catalogue:${packs}:${state.seq.audit}`,
  });
  if (!submitted.ok || !submitted.caseId) return { state: submitted.state };
  return { state: runStanding(submitted.state, submitted.caseId), caseId: submitted.caseId };
}

export function seedDomain(): DomainState {
  return initialDomainState();
}
