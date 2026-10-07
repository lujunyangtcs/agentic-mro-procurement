/**
 * Command contract (PRD §17.3). Every business change is one of these, carries
 * its actor, the case revision it was decided against and an idempotency key.
 */

import type { GateResult } from "@/mro/domain/evaluateGate";
import type {
  Actor,
  ConfidenceSignal,
  DomainState,
  FlowKey,
  IsoTime,
  Policy,
  Request,
  SiteId,
  StoryId,
  Uom,
} from "@/mro/domain/types";

/**
 * `unitPrice` is the starting-cost reference (a quote or last-paid price) for
 * lines with no live agreement, or an awarded price on revision, in pence.
 * A live agreement price always wins over it.
 */
export type DraftLine = { material: string; quantity: number; uom: Uom; neededBy: IsoTime; unitPrice?: number };

export type RequestDraft = {
  fixtureId?: string;
  storyId?: StoryId;
  preferredCaseId?: string;
  preferredPrId?: string;
  requester: string;
  channel: Request["source"]["channel"];
  captureId?: string;
  originalText: string;
  site: SiteId;
  costCentre: string;
  glCode: string;
  purpose: string;
  urgency: "normal" | "urgent";
  supplierPreference?: string;
  agreementId?: string;
  supplierId?: string;
  lines: DraftLine[];
  pattern: string;
  signals: ConfidenceSignal[];
  model: string;
  budgetRef?: string;
  /** Short business title for queues. */
  title?: string;
};

type Base = { actor: Actor; idempotencyKey: string; attemptId?: string };

export type Command =
  | (Base & { type: "request.submit"; draft: RequestDraft })
  | (Base & { type: "request.revise"; caseId: string; expectedRevision: number; lines: DraftLine[]; supplierId?: string; agreementId?: string | null })
  | (Base & { type: "flow.start"; caseId: string; flow: FlowKey; runId?: string; variant?: Record<string, boolean> })
  | (Base & { type: "step.run"; runId: string; stepId: string })
  | (Base & { type: "step.decide"; runId: string; stepId: string; optionId: string; note?: string })
  | (Base & { type: "flow.variant"; runId: string; key: string; value: boolean })
  | (Base & { type: "agent.pause"; agent: string; paused: boolean })
  | (Base & { type: "rule.decide"; changeId: string; outcome: "approved" | "rejected" })
  | (Base & { type: "opportunity.decide"; opportunityId: string; outcome: "live" | "parked" })
  | (Base & { type: "request.approve"; caseId: string; expectedRevision: number })
  | (Base & { type: "approval.decide"; taskId: string; expectedRevision: number; outcome: "approved" | "rejected"; reason?: string })
  | (Base & { type: "po.release"; caseId: string; expectedRevision: number })
  | (Base & { type: "po.acknowledge"; poId: string })
  | (Base & { type: "clock.advance"; minutes: number })
  | (Base & { type: "failures.set"; erpPo?: number; supplierSilent?: boolean })
  | (Base & { type: "policy.activate"; changeId: string; version: string; patch: Partial<Pick<Policy, "autoApproveLimit" | "lanes">> })
  | (Base & { type: "policy.rollback"; to: string });

export type CommandError =
  | "stale-revision"
  | "unknown-case"
  | "unknown-task"
  | "gate-blocked"
  | "role-mismatch"
  | "invalid-draft"
  | "connector-failed"
  | "already-decided"
  | "not-current"
  | "blocked";

export type CommandResult =
  | { ok: true; state: DomainState; eventIds: string[]; duplicate?: boolean; caseId?: string; poId?: string; gate?: GateResult }
  | { ok: false; state: DomainState; error: CommandError; message: string; gate?: GateResult; taskId?: string };

/** Stable key: case + work package + action + revision (PRD §17.3). */
export function idemKey(caseId: string, wp: string, action: string, revision: number): string {
  return `${caseId}:${wp}:${action}:r${revision}`;
}
