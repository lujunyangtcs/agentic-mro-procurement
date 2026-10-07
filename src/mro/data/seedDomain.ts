/**
 * Phase 1 boot seed: the catalogue fixture travels the real command path —
 * submit → gate → standing approval by policy → PO dispatch. Nothing is
 * written into state directly. Phase 2 replaces this with a live submission
 * from New Request.
 */

import type { Command, CommandResult } from "@/mro/domain/commands";
import { idemKey } from "@/mro/domain/commands";
import { handleCommand, initialDomainState } from "@/mro/domain/reducer";
import type { Actor, DomainState } from "@/mro/domain/types";
import { POL_DEMO_1 } from "@/mro/data/policies";
import { catalogueFixture } from "@/mro/data/storyFixtures";

export const STANDING_MANDATE: Actor = { kind: "policy", policyVersion: POL_DEMO_1.version, mandateId: "SM-CATALOGUE-01" };
export const REQUESTER: Actor = { kind: "human", role: "requester", name: "Halewood stores controller" };

function run(state: DomainState, cmd: Command): DomainState {
  const r: CommandResult = handleCommand(state, cmd);
  return r.state;
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
  const caseId = submitted.caseId;
  let s = submitted.state;
  s = run(s, { type: "request.approve", actor: STANDING_MANDATE, caseId, expectedRevision: 1, idempotencyKey: idemKey(caseId, "F1", "approve", 1) });
  if (s.requests[s.cases[caseId].requestId].approvedRevision !== 1) return { state: s, caseId };
  s = run(s, { type: "clock.advance", actor: STANDING_MANDATE, minutes: 1, idempotencyKey: `clock:${caseId}:po` });
  s = run(s, { type: "po.release", actor: STANDING_MANDATE, caseId, expectedRevision: 1, idempotencyKey: idemKey(caseId, "F1", "po", 1) });
  return { state: s, caseId };
}

export function seedDomain(): DomainState {
  return runCatalogue(initialDomainState()).state;
}
