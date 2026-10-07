/**
 * The single decision service (PRD §5). Pure: facts in, verdict out.
 *
 * Stage order is fixed — scope, hard constraints HC01–HC10, delegated
 * authority, lane, confidence — and the first failing stage names the blocked
 * action and the role that can clear it. A high confidence score never repairs
 * a failed control; it only decides whether a person must review the data.
 */

import type {
  ConfidenceDimension,
  Lane,
  Pence,
  Policy,
  Role,
} from "@/mro/domain/types";

export type GateAction =
  | "request.approve"
  | "po.release"
  | "award.approve"
  | "contract.sign"
  | "supplier.activate"
  | "value.validate"
  | "rule.apply";

export type ClauseFact = { id: string; band: "green" | "amber" | "red" | "unknown"; inLibrary: boolean; decidedBy?: Role };

export type RecordedApproval = { role: Role; revision: number; amount: Pence; outcome: "approved" | "rejected" };

export type GateInput = {
  action: GateAction;
  policy: Policy;
  /** Who is attempting the action: an agent/policy, or a named person. */
  actorKind: "policy" | "agent" | "human";
  actorRole?: Role;
  amount: Pence;
  site?: string;
  allowedSites?: string[];
  caseRevision: number;
  request?: { approvedRevision?: number };
  standing?: {
    budgetApproved: boolean;
    standingPolicy: boolean;
    category: string;
    liveAgreement: boolean;
  };
  approvals: RecordedApproval[];
  reviews?: { role: Role; revision: number }[];
  supplier?: { status: "active" | "pending" | "inactive"; cleared: boolean; sanctionsOpen: boolean; bankVerified: boolean; bankVerifiedBy?: Role };
  competition?: { competitive: boolean; validQuotes: number; soleSourceSignedBy?: Role };
  clauses?: ClauseFact[];
  contract?: { required: boolean; stored: boolean };
  value?: { invoiceEvidence: boolean; financeSignedBy?: Role };
  ruleChange?: { councilApproved: boolean };
  evidenceRefs: string[];
  confidence: {
    components: Partial<Record<ConfidenceDimension, number>>;
    pattern: string;
    pausedPattern?: boolean;
    missingMandatory?: string[];
    expiredEvidence?: string[];
    ambiguousIdentity?: boolean;
  };
};

export type ControlId = "HC01" | "HC02" | "HC03" | "HC04" | "HC05" | "HC06" | "HC07" | "HC08" | "HC09" | "HC10" | "TOM-CONTRACT-STORED";
export type ControlResult = { id: ControlId; result: "pass" | "fail" | "na"; reason?: string; requiredRole?: Role };

export type StageName = "scope" | "controls" | "authority" | "lane" | "confidence";

export type ConfidenceResult = {
  score: number;
  weightVersion: string;
  components: { dimension: ConfidenceDimension; score: number | null; weight: number; note?: string }[];
  blocks: string[];
};

export type GateResult = {
  allowed: boolean;
  policyVersion: string;
  /** First stage that failed, if any. */
  failedStage?: StageName;
  blockedAction?: GateAction;
  requiredRole?: Role;
  reason?: string;
  scope: { result: "pass" | "fail"; reason?: string };
  controls: ControlResult[];
  authority: { result: "pass" | "fail" | "na"; standing: boolean; requiredRole?: Role; reason?: string };
  lane: Lane;
  laneSatisfied: boolean;
  confidence: ConfidenceResult;
};

const DIMENSIONS: ConfidenceDimension[] = [
  "completeness",
  "classification",
  "matchStrength",
  "priceBenchmark",
  "supplierStatus",
  "patternHistory",
];

const CLIENT_BANK_VERIFIERS: Role[] = ["finance-bp", "finance-controller"];

/* ── Confidence ─────────────────────────────────────────────────────────── */

export function scoreConfidence(policy: Policy, input: GateInput["confidence"]): ConfidenceResult {
  const rule = policy.patternRules[input.pattern];
  const blocks: string[] = [];
  const rows: ConfidenceResult["components"] = [];
  let weighted = 0;
  let applicableWeight = 0;

  for (const d of DIMENSIONS) {
    const weight = policy.weights.values[d];
    const value = input.components[d];
    const inapplicable = rule?.inapplicable[d];
    if (value === undefined) {
      if (inapplicable) {
        rows.push({ dimension: d, score: null, weight: 0, note: inapplicable });
      } else {
        rows.push({ dimension: d, score: null, weight, note: "missing, no pattern rule" });
        blocks.push(`Missing score for ${d} with no pattern rule`);
        applicableWeight += weight;
      }
      continue;
    }
    const bounded = Math.max(0, Math.min(1, value));
    rows.push({ dimension: d, score: bounded, weight });
    weighted += bounded * weight;
    applicableWeight += weight;
  }

  /* An inapplicable dimension's weight is redistributed over the rest, by the
     pattern's explicit rule — never filled with a perfect score. */
  const score = applicableWeight > 0 ? Math.round((weighted / applicableWeight) * 1000) / 1000 : 0;
  for (const r of rows) if (r.score !== null && applicableWeight > 0) r.weight = Math.round((r.weight / applicableWeight) * 1000) / 1000;

  if (input.missingMandatory?.length) blocks.push(`Missing mandatory: ${input.missingMandatory.join(", ")}`);
  if (input.expiredEvidence?.length) blocks.push(`Expired evidence: ${input.expiredEvidence.join(", ")}`);
  if (input.ambiguousIdentity) blocks.push("Ambiguous identity");
  if (input.pausedPattern) blocks.push(`Pattern ${input.pattern} is paused`);

  return { score, weightVersion: policy.weights.version, components: rows, blocks };
}

export function laneFor(policy: Policy, score: number): Lane {
  if (score >= policy.lanes.touchless) return "touchless";
  if (score >= policy.lanes.tcsReview) return "tcs-review";
  return "client-decision";
}

/* ── Authority ──────────────────────────────────────────────────────────── */

/** The lowest role whose spend authority covers the amount, or undefined above the desk. */
export function doaRoleFor(policy: Policy, amount: Pence): Role | undefined {
  if (amount >= policy.strategicHandoffFrom) return undefined;
  return policy.doa.find((t) => amount <= t.maxInclusive)?.role;
}

function roleCovers(policy: Policy, role: Role, amount: Pence): boolean {
  const tier = policy.doa.find((t) => t.role === role);
  return !!tier && amount <= tier.maxInclusive && amount < policy.strategicHandoffFrom;
}

function standingEligible(policy: Policy, input: GateInput): boolean {
  const s = input.standing;
  return (
    !!s &&
    input.amount < policy.autoApproveLimit &&
    s.budgetApproved &&
    s.standingPolicy &&
    s.liveAgreement &&
    policy.allowedStandingCategories.includes(s.category) &&
    !!input.supplier &&
    input.supplier.status === "active" &&
    input.supplier.cleared
  );
}

function validSpendApproval(policy: Policy, input: GateInput): boolean {
  return input.approvals.some(
    (a) =>
      a.outcome === "approved" &&
      a.revision === input.caseRevision &&
      a.amount >= input.amount &&
      roleCovers(policy, a.role, input.amount),
  );
}

const SPEND_ACTIONS: GateAction[] = ["request.approve", "po.release"];

/* ── Hard constraints ───────────────────────────────────────────────────── */

function controls(policy: Policy, input: GateInput): ControlResult[] {
  const out: ControlResult[] = [];
  const a = input.action;

  /* HC01 — no PO without an approved current request version. */
  if (a === "po.release") {
    const ok = input.request?.approvedRevision === input.caseRevision;
    out.push(ok ? { id: "HC01", result: "pass" } : { id: "HC01", result: "fail", reason: "Current request revision is not approved", requiredRole: doaRoleFor(policy, input.amount) ?? "procurement-head" });
  } else out.push({ id: "HC01", result: "na" });

  /* HC02 — no commitment above the standing envelope or human DoA. */
  if (SPEND_ACTIONS.includes(a)) {
    const ok = standingEligible(policy, input) || validSpendApproval(policy, input);
    const role = doaRoleFor(policy, input.amount);
    out.push(ok ? { id: "HC02", result: "pass" } : { id: "HC02", result: "fail", reason: role ? `Spend approval required from ${role}` : "Above desk authority", requiredRole: role ?? "procurement-head" });
  } else out.push({ id: "HC02", result: "na" });

  /* HC03 — no PO or award to an inactive or uncleared supplier. */
  if (a === "po.release" || a === "award.approve" || a === "request.approve") {
    const s = input.supplier;
    if (!s) out.push(a === "request.approve" ? { id: "HC03", result: "na" } : { id: "HC03", result: "fail", reason: "No supplier on record", requiredRole: "buy-desk-analyst" });
    else if (s.status !== "active" || !s.cleared) out.push({ id: "HC03", result: "fail", reason: "Supplier is not active and cleared", requiredRole: "risk-analyst" });
    else out.push({ id: "HC03", result: "pass" });
  } else out.push({ id: "HC03", result: "na" });

  /* HC04 — competitive award needs three valid quotes or sole-source sign-off. */
  if (a === "award.approve" && input.competition?.competitive) {
    const c = input.competition;
    const ok = c.validQuotes >= 3 || c.soleSourceSignedBy === "category-lead";
    out.push(ok ? { id: "HC04", result: "pass" } : { id: "HC04", result: "fail", reason: `${c.validQuotes} valid quotes; three or sole-source sign-off required`, requiredRole: "category-lead" });
  } else out.push({ id: "HC04", result: "na" });

  /* HC05 — no clause outside the library; Red (and unknown) always Legal. */
  if ((a === "contract.sign" || a === "po.release") && input.clauses?.length) {
    const bad = input.clauses.find((c) => {
      if (!c.inLibrary || c.band === "red" || c.band === "unknown") return c.decidedBy !== "legal";
      if (c.band === "amber") return c.decidedBy !== "delegated-approver" && c.decidedBy !== "legal";
      return false;
    });
    out.push(
      bad
        ? { id: "HC05", result: "fail", reason: `Clause ${bad.id} (${bad.band}) not decided by the required authority`, requiredRole: bad.band === "amber" && bad.inLibrary ? "delegated-approver" : "legal" }
        : { id: "HC05", result: "pass" },
    );
  } else out.push({ id: "HC05", result: "na" });

  /* HC06 — no activation with an open sanctions hit, whatever the score. */
  if (a === "supplier.activate") {
    out.push(input.supplier?.sanctionsOpen ? { id: "HC06", result: "fail", reason: "Open sanctions match", requiredRole: "risk-committee" } : { id: "HC06", result: "pass" });
  } else out.push({ id: "HC06", result: "na" });

  /* HC07 — bank details verified by a client finance person. */
  if (a === "supplier.activate") {
    const s = input.supplier;
    const ok = !!s?.bankVerified && !!s.bankVerifiedBy && CLIENT_BANK_VERIFIERS.includes(s.bankVerifiedBy);
    out.push(ok ? { id: "HC07", result: "pass" } : { id: "HC07", result: "fail", reason: "Bank callback not recorded by client Finance", requiredRole: "finance-bp" });
  } else out.push({ id: "HC07", result: "na" });

  /* HC08 — no validated saving without invoice evidence and Finance signature. */
  if (a === "value.validate") {
    const v = input.value;
    const ok = !!v?.invoiceEvidence && v.financeSignedBy === "finance-bp";
    out.push(ok ? { id: "HC08", result: "pass" } : { id: "HC08", result: "fail", reason: v?.invoiceEvidence ? "Finance signature missing" : "Invoice evidence missing", requiredRole: "finance-bp" });
  } else out.push({ id: "HC08", result: "na" });

  /* HC09 — rule and threshold changes need Value Council approval. */
  if (a === "rule.apply") {
    out.push(input.ruleChange?.councilApproved ? { id: "HC09", result: "pass" } : { id: "HC09", result: "fail", reason: "Value Council approval missing", requiredRole: "value-council" });
  } else out.push({ id: "HC09", result: "na" });

  /* HC10 — every agent or policy action carries evidence. */
  if (input.actorKind !== "human") {
    out.push(input.evidenceRefs.length > 0 ? { id: "HC10", result: "pass" } : { id: "HC10", result: "fail", reason: "No evidence references", requiredRole: "buy-desk-analyst" });
  } else out.push({ id: "HC10", result: "na" });

  /* TOM guard — no PO when a required contract is not stored. */
  if (a === "po.release" && input.contract?.required) {
    out.push(input.contract.stored ? { id: "TOM-CONTRACT-STORED", result: "pass" } : { id: "TOM-CONTRACT-STORED", result: "fail", reason: "Required contract is not stored", requiredRole: "contract-analyst" });
  }

  return out;
}

/* ── Lane review ────────────────────────────────────────────────────────── */

const LANE_REVIEWERS: Record<Exclude<Lane, "touchless">, Role[]> = {
  "tcs-review": ["buy-desk-analyst", "buy-desk-lead"],
  "client-decision": ["budget-holder", "category-lead", "technical-owner", "application-owner", "procurement-head", "requester"],
};

function laneSatisfied(lane: Lane, input: GateInput): boolean {
  if (lane === "touchless") return true;
  if (input.actorKind === "human" && input.actorRole && LANE_REVIEWERS[lane].includes(input.actorRole)) return true;
  return (input.reviews ?? []).some((r) => r.revision === input.caseRevision && LANE_REVIEWERS[lane].includes(r.role));
}

/* ── Entry point ────────────────────────────────────────────────────────── */

export function evaluateGate(input: GateInput): GateResult {
  const { policy } = input;
  const confidence = scoreConfidence(policy, input.confidence);
  const lane = confidence.blocks.length > 0 ? "client-decision" : laneFor(policy, confidence.score);

  const base = {
    policyVersion: policy.version,
    controls: [] as ControlResult[],
    lane,
    laneSatisfied: false,
    confidence,
  };

  /* 1. Scope */
  let scope: GateResult["scope"] = { result: "pass" };
  if (input.amount >= policy.strategicHandoffFrom && SPEND_ACTIONS.concat("award.approve").includes(input.action)) {
    scope = { result: "fail", reason: "At or above the strategic handoff threshold; the desk cannot commit" };
  } else if (input.site && input.allowedSites && !input.allowedSites.includes(input.site)) {
    scope = { result: "fail", reason: `Site ${input.site} is outside the desk's scope` };
  }
  const authorityNa = { result: "na" as const, standing: false };
  if (scope.result === "fail") {
    return { ...base, allowed: false, failedStage: "scope", blockedAction: input.action, requiredRole: "procurement-head", reason: scope.reason, scope, authority: authorityNa };
  }

  /* 2. Hard constraints */
  const ctl = controls(policy, input);
  const failed = ctl.find((c) => c.result === "fail");

  /* 3. Authority (computed for display even when a control fails) */
  let authority: GateResult["authority"] = authorityNa;
  if (SPEND_ACTIONS.includes(input.action)) {
    const standing = standingEligible(policy, input);
    const approved = validSpendApproval(policy, input);
    const role = doaRoleFor(policy, input.amount);
    authority = standing || approved
      ? { result: "pass", standing, requiredRole: standing ? undefined : role }
      : { result: "fail", standing: false, requiredRole: role, reason: `Spend of this value needs ${role}` };
  }

  if (failed) {
    return { ...base, controls: ctl, allowed: false, failedStage: "controls", blockedAction: input.action, requiredRole: failed.requiredRole, reason: `${failed.id}: ${failed.reason}`, scope, authority };
  }
  if (authority.result === "fail") {
    return { ...base, controls: ctl, allowed: false, failedStage: "authority", blockedAction: input.action, requiredRole: authority.requiredRole, reason: authority.reason, scope, authority };
  }

  /* 4. Lane, then 5. confidence. Missing mandatory data, expired evidence,
     ambiguous identity and paused patterns block until corrected — a review
     signature does not stand in for the missing fact. */
  const satisfied = laneSatisfied(lane, input);
  if (!satisfied && confidence.blocks.length === 0) {
    const role: Role = lane === "tcs-review" ? "buy-desk-analyst" : authority.requiredRole ?? "budget-holder";
    return { ...base, controls: ctl, laneSatisfied: false, allowed: false, failedStage: "lane", blockedAction: input.action, requiredRole: role, reason: `Lane ${lane} needs review`, scope, authority };
  }
  if (confidence.blocks.length > 0) {
    return { ...base, controls: ctl, laneSatisfied: satisfied, allowed: false, failedStage: "confidence", blockedAction: input.action, requiredRole: "buy-desk-analyst", reason: confidence.blocks[0], scope, authority };
  }

  return { ...base, controls: ctl, laneSatisfied: true, allowed: true, scope, authority };
}
