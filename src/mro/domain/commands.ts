/**
 * Command contract (PRD §17.3). Every business change is one of these, carries
 * its actor, the case revision it was decided against and an idempotency key.
 */

import type { GateResult } from "@/mro/domain/evaluateGate";
import type {
  Actor,
  ConfidenceDimension,
  DomainState,
  IsoTime,
  Request,
  SiteId,
  StoryId,
  Uom,
} from "@/mro/domain/types";

export type DraftLine = { material: string; quantity: number; uom: Uom; neededBy: IsoTime };

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
  confidence: Partial<Record<ConfidenceDimension, number>>;
  budgetRef?: string;
};

type Base = { actor: Actor; idempotencyKey: string; attemptId?: string };

export type Command =
  | (Base & { type: "request.submit"; draft: RequestDraft })
  | (Base & { type: "request.revise"; caseId: string; expectedRevision: number; lines: DraftLine[] })
  | (Base & { type: "request.approve"; caseId: string; expectedRevision: number })
  | (Base & { type: "approval.decide"; taskId: string; expectedRevision: number; outcome: "approved" | "rejected"; reason?: string })
  | (Base & { type: "po.release"; caseId: string; expectedRevision: number })
  | (Base & { type: "clock.advance"; minutes: number });

export type CommandError =
  | "stale-revision"
  | "unknown-case"
  | "unknown-task"
  | "gate-blocked"
  | "role-mismatch"
  | "invalid-draft"
  | "connector-failed"
  | "already-decided";

export type CommandResult =
  | { ok: true; state: DomainState; eventIds: string[]; duplicate?: boolean; caseId?: string; poId?: string; gate?: GateResult }
  | { ok: false; state: DomainState; error: CommandError; message: string; gate?: GateResult; taskId?: string };

/** Stable key: case + work package + action + revision (PRD §17.3). */
export function idemKey(caseId: string, wp: string, action: string, revision: number): string {
  return `${caseId}:${wp}:${action}:r${revision}`;
}
