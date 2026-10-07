/**
 * Read models over DomainState. Cards, documents and charts all read through
 * these, so a figure is computed once and shown the same everywhere.
 */

import type { GateAction, GateInput } from "@/mro/domain/evaluateGate";
import type {
  Actor,
  AuditEvent,
  DomainState,
  Lane,
  Pence,
  Policy,
  ProcurementCase,
  PurchaseOrder,
  RequestLine,
  RequestRevision,
  Role,
} from "@/mro/domain/types";
import { lineTotal, sumPence } from "@/mro/domain/money";
import { materialByCode, siteById } from "@/mro/data/masterData";
import { clientProfile } from "@/mro/data/clientProfile";

export function activePolicy(state: DomainState): Policy {
  return state.policies.versions[state.policies.active];
}

export function policyForCase(state: DomainState, c: ProcurementCase): Policy {
  return state.policies.versions[c.policyVersion] ?? activePolicy(state);
}

export function currentRevision(state: DomainState, caseId: string): RequestRevision | undefined {
  const c = state.cases[caseId];
  if (!c) return undefined;
  return state.requests[c.requestId]?.revisions.find((r) => r.revision === c.revision);
}

export function revisionTotal(rev: RequestRevision): Pence {
  return sumPence(rev.lines.map((l) => lineTotal(l.unitPrice, l.quantity)));
}

function agreementLive(state: DomainState, rev: RequestRevision): boolean {
  if (!rev.agreementId) return false;
  const a = state.agreements[rev.agreementId];
  if (!a) return false;
  const now = Date.parse(state.clock.now);
  if (now < Date.parse(a.validFrom) || now > Date.parse(a.validTo)) return false;
  return rev.lines.every((l) => a.lines.some((al) => al.material === l.material && al.sites.includes(l.site)));
}

function missingMandatory(rev: RequestRevision): string[] {
  const out: string[] = [];
  if (!rev.costCentre) out.push("cost centre");
  if (!rev.purpose) out.push("purpose");
  if (rev.lines.length === 0) out.push("lines");
  if (rev.lines.some((l) => l.unitPrice <= 0)) out.push("starting cost");
  return out;
}

/** Facts for one gate evaluation on one case, at its current revision. */
export function gateInputFor(state: DomainState, caseId: string, action: GateAction, actor: Actor): GateInput {
  const c = state.cases[caseId];
  const request = state.requests[c.requestId];
  const rev = currentRevision(state, caseId)!;
  const policy = policyForCase(state, c);
  const supplier = rev.supplierId ? state.suppliers[rev.supplierId] : undefined;
  const category = materialByCode[rev.lines[0]?.material]?.category ?? "unknown";

  return {
    action,
    policy,
    actorKind: actor.kind,
    actorRole: actor.kind === "human" ? actor.role : undefined,
    amount: revisionTotal(rev),
    site: c.site,
    allowedSites: clientProfile.allowedSites,
    caseRevision: c.revision,
    request: { approvedRevision: request.approvedRevision },
    standing: {
      budgetApproved: true,
      standingPolicy: !!rev.agreementId,
      category,
      liveAgreement: agreementLive(state, rev),
    },
    approvals: Object.values(state.tasks)
      .filter((t) => t.caseId === caseId && t.outcome && t.decidedBy?.kind === "human")
      .map((t) => ({ role: (t.decidedBy as { role: Role }).role, revision: t.caseRevision, amount: t.amount, outcome: t.outcome! })),
    supplier: supplier && {
      status: supplier.status,
      cleared: supplier.cleared,
      sanctionsOpen: supplier.sanctionsOpen,
      bankVerified: supplier.bankVerified,
    },
    evidenceRefs: [request.id, rev.agreementId, rev.supplierId].filter((x): x is string => !!x),
    confidence: {
      signals: rev.signals,
      pattern: rev.pattern,
      missingMandatory: missingMandatory(rev),
    },
  };
}

/* ── Case read model ────────────────────────────────────────────────────── */

export type CaseSummary = {
  id: string;
  prId: string;
  revision: number;
  siteName: string;
  item: string;
  line: RequestLine;
  total: Pence;
  lane?: Lane;
  status: ProcurementCase["status"];
  po?: PurchaseOrder;
  openHolds: ProcurementCase["holds"];
  audit: AuditEvent[];
  createdAt: string;
};

export function caseSummaries(state: DomainState): CaseSummary[] {
  return Object.values(state.cases)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
    .map((c) => {
      const rev = currentRevision(state, c.id)!;
      const line = rev.lines[0];
      const wp = c.workPackageIds.map((id) => state.workPackages[id]).find((w) => w?.tomFlow === "F1");
      return {
        id: c.id,
        prId: c.requestId,
        revision: c.revision,
        siteName: siteById[c.site]?.name ?? c.site,
        item: materialByCode[line?.material]?.description ?? line?.description ?? "",
        line,
        total: revisionTotal(rev),
        lane: wp?.lane,
        status: c.status,
        po: Object.values(state.pos).find((p) => p.caseId === c.id && p.requestRevision === c.revision),
        openHolds: c.holds.filter((h) => !h.closedAt),
        audit: state.audit.filter((e) => e.caseId === c.id),
        createdAt: c.createdAt,
      };
    });
}

/* ── Human-action ledger and touch metrics (PRD §16) ────────────────────── */

const BUYER_ROLES: Role[] = ["buy-desk-analyst", "buy-desk-lead", "contract-analyst", "value-analyst"];

export function humanLedger(state: DomainState, caseId: string): AuditEvent[] {
  return state.audit.filter((e) => e.caseId === caseId && e.substantive && e.actor.kind === "human");
}

function completed(state: DomainState, caseId: string): boolean {
  return Object.values(state.pos).some((p) => p.caseId === caseId && p.dispatch.state === "dispatched");
}

/** No substantive buyer review or override. Requester submission is not a touch. */
export function isNoBuyerTouch(state: DomainState, caseId: string): boolean {
  if (!completed(state, caseId)) return false;
  return !humanLedger(state, caseId).some((e) => e.actor.kind === "human" && BUYER_ROLES.includes(e.actor.role));
}

/** No substantive human decision at any role. */
export function isFullyTouchless(state: DomainState, caseId: string): boolean {
  if (!completed(state, caseId)) return false;
  return humanLedger(state, caseId).length === 0;
}

export function touchMetrics(state: DomainState) {
  const eligible = Object.keys(state.cases).filter((id) => completed(state, id));
  return {
    eligible: eligible.length,
    noBuyerTouch: eligible.filter((id) => isNoBuyerTouch(state, id)).length,
    fullyTouchless: eligible.filter((id) => isFullyTouchless(state, id)).length,
  };
}
