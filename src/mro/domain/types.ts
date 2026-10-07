/**
 * Canonical domain model for Automotive Procurement (PRD §17).
 *
 * Every record here is serialisable: no ReactNode, no Date objects, no
 * functions. Money is integer pence; time is ISO-8601 UTC. Renderers read
 * these records — they never hold business state of their own.
 */

/* ── Identifiers and enumerations ───────────────────────────────────────── */

export type Pence = number;
export type IsoTime = string;

export type TomFlow = "F0" | "F1" | "F2" | "F3" | "F4" | "F5";
export type StoryId = "ST01" | "ST02" | "ST03" | "ST04" | "ST05";

export type Role =
  | "requester"
  | "application-owner"
  | "it-security"
  | "technical-owner"
  | "buy-desk-analyst"
  | "contract-analyst"
  | "value-analyst"
  | "buy-desk-lead"
  | "ai-ops-steward"
  | "budget-holder"
  | "category-lead"
  | "delegated-approver"
  | "legal"
  | "finance-bp"
  | "finance-controller"
  | "risk-analyst"
  | "risk-committee"
  | "procurement-head"
  | "value-council"
  | "supplier";

/** The agents named in the use-case I/O samples, plus the orchestrator. */
export type AgentGroupId =
  | "orchestrator"
  | "intake"
  | "spend-intelligence"
  | "channel-decision"
  | "sourcing"
  | "bid-scoring"
  | "award"
  | "po"
  | "supplier-match"
  | "onboarding"
  | "risk-screening"
  | "master-data"
  | "contract"
  | "clause-compare"
  | "value";

export type Actor =
  | { kind: "human"; role: Role; name: string }
  | { kind: "policy"; policyVersion: string; mandateId: string }
  | { kind: "agent"; agentId: AgentGroupId; policyVersion: string };

export type SiteId = "UK-SOL-01" | "UK-HAL-01" | "UK-WOL-01" | "UK-GAY-01" | "UK-CAB-01";
export type Uom = "EA" | "PAIR" | "PACK" | "LOT" | "LICENCE_YEAR" | "DAY";

/* ── Reference and master data ──────────────────────────────────────────── */

export type ClientProfile = {
  displayName: string;
  environmentLabel: string;
  currency: "GBP";
  locale: "en-GB";
  timeZone: "Europe/London";
  clockStart: IsoTime;
  allowedSites: SiteId[];
  buyingOrg: string;
};

export type Site = {
  id: SiteId;
  name: string;
  country: "GB";
  function: string;
  costCentre: string;
};

export type Material = {
  code: string;
  description: string;
  manufacturer?: string;
  manufacturerPart?: string;
  uom: Uom;
  /** Pack conversion where the item is bought in packs but priced per unit. */
  pack?: { uom: Uom; unitsPerPack: number };
  group: "MRO" | "SERVICES" | "IT" | "FACILITIES";
  glCode: string;
  category: string;
  /** Free-text aliases the intake parser recognises. Only intake-enabled items are parsed in Flow 1. */
  aliases?: string[];
  intake?: boolean;
};

export type SupplierStatus = "active" | "pending" | "inactive";

export type Supplier = {
  id: string;
  name: string;
  status: SupplierStatus;
  cleared: boolean;
  sanctionsOpen: boolean;
  bankVerified: boolean;
  email: string;
  bankMasked: string;
  panelScope: string[];
};

export type AgreementLine = { material: string; unitPrice: Pence; sites: SiteId[] };

export type Agreement = {
  id: string;
  kind: "catalogue" | "rate-card" | "contract";
  supplierId: string;
  validFrom: IsoTime;
  validTo: IsoTime;
  lines: AgreementLine[];
};

/* ── Policy ─────────────────────────────────────────────────────────────── */

/**
 * One weighted confidence signal, as each agent reports it (CONF-v1.0). Each
 * agent carries its own signal set and weights; the score is their weighted
 * sum. A signal the pattern cannot score is null with a recorded reason —
 * never silently scored as perfect.
 */
export type ConfidenceSignal = {
  key: string;
  score: number | null;
  weight: number;
  evidence: string;
  inapplicable?: string;
};

export type DoaTier = { role: Role; maxInclusive: Pence };

export type Policy = {
  /** DoA matrix version; also the version stamped on policy actions. */
  version: string;
  channelRules: string;
  confidencePolicy: string;
  effectiveFrom: IsoTime;
  autoApproveLimit: Pence;
  /** Spend approval tiers, ascending. Commitments above the last tier leave the desk. */
  doa: DoaTier[];
  /** At or above this value the desk cannot commit (strategic handoff). */
  strategicHandoffFrom: Pence;
  lanes: { touchless: number; tcsReview: number };
  allowedStandingCategories: string[];
};

/* ── Transactions ───────────────────────────────────────────────────────── */

export type RequestLine = {
  lineNo: number;
  material: string;
  description: string;
  quantity: number;
  uom: Uom;
  /** Quantity as the requester entered it, when it differs from the priced UoM. */
  entered?: { quantity: number; uom: Uom };
  unitPrice: Pence;
  site: SiteId;
  neededBy: IsoTime;
};

export type RequestRevision = {
  revision: number;
  submittedAt: IsoTime;
  lines: RequestLine[];
  costCentre: string;
  glCode: string;
  purpose: string;
  urgency: "normal" | "urgent";
  supplierPreference?: string;
  agreementId?: string;
  supplierId?: string;
  signals: ConfidenceSignal[];
  /** Agent model that scored the request, e.g. intake-v2.3. */
  model: string;
  pattern: string;
};

export type Request = {
  id: string;
  caseId: string;
  requester: string;
  source: { channel: "form" | "email" | "teams" | "work-order"; captureId?: string; originalText: string };
  revisions: RequestRevision[];
  /** Revision the current approval covers, if any. */
  approvedRevision?: number;
  approvedBy?: Actor;
};

export type CaseStatus = "open" | "held" | "po-dispatched" | "closed";

export type Hold = {
  id: string;
  blockedAction: string;
  requiredRole: Role;
  reason: string;
  controlId?: string;
  openedAt: IsoTime;
  closedAt?: IsoTime;
};

export type ProcurementCase = {
  id: string;
  storyId?: StoryId;
  fixtureId?: string;
  revision: number;
  requestId: string;
  requester: string;
  site: SiteId;
  status: CaseStatus;
  policyVersion: string;
  workPackageIds: string[];
  holds: Hold[];
  createdAt: IsoTime;
  /** Earlier open case for the same need, when a second submission repeats it. */
  possibleDuplicateOf?: string;
};

export type WorkPackageState = "running" | "waiting" | "done" | "blocked";

export type Lane = "touchless" | "tcs-review" | "client-decision";

export type WorkPackage = {
  id: string;
  caseId: string;
  tomFlow: TomFlow;
  stepIds: string[];
  currentStepId: string;
  owner: Role | AgentGroupId;
  lane?: Lane;
  state: WorkPackageState;
  dependsOn: string[];
  nextAction?: string;
};

export type ApprovalTask = {
  id: string;
  caseId: string;
  role: Role;
  decision: string;
  caseRevision: number;
  amount: Pence;
  evidenceRefs: string[];
  openedAt: IsoTime;
  dueAt: IsoTime;
  /** Set when a later revision makes this task moot; it then leaves every queue. */
  supersededAt?: IsoTime;
  outcome?: "approved" | "rejected";
  decidedBy?: Actor;
  decidedAt?: IsoTime;
  reason?: string;
  /** Generic human-task timers: reassigned at 48h, escalated at 72h. */
  reassignedAt?: IsoTime;
  escalatedAt?: IsoTime;
  escalatedTo?: Role;
};

export type FollowUpKind = "supplier-chase" | "task-reassigned" | "task-escalated";

export type FollowUp = {
  id: string;
  caseId: string;
  kind: FollowUpKind;
  owner: Role;
  refId: string;
  summary: string;
  openedAt: IsoTime;
  closedAt?: IsoTime;
};

export type PurchaseOrder = {
  id: string;
  caseId: string;
  requestId: string;
  requestRevision: number;
  supplierId: string;
  agreementId?: string;
  lines: RequestLine[];
  total: Pence;
  approvedBy: Actor;
  dispatch: { state: "dispatched" | "failed"; erpRef?: string; attempts: number; at: IsoTime };
  /** Supplier order confirmation; a chaser opens when it is 48h late. */
  ackDueAt: IsoTime;
  acknowledgedAt?: IsoTime;
};

export type DomainException = {
  id: string;
  caseId: string;
  reason: string;
  blockedAction: string;
  owner: Role;
  dueAt: IsoTime;
  openedAt: IsoTime;
  resolvedAt?: IsoTime;
};

export type ValueCategory = "sourcing-saving" | "cost-avoidance" | "productivity";
export type ValueState =
  | "expected"
  | "awaiting-invoice"
  | "evidenced"
  | "leakage-open"
  | "awaiting-finance"
  | "validated"
  | "not-claimed"
  | "lapsed";

export type ValueRecord = {
  id: string;
  caseId: string;
  awardKey: string;
  category: ValueCategory;
  baseline: Pence;
  expected: Pence;
  evidenced?: Pence;
  invoiceEvidenceRefs: string[];
  financeSignedBy?: Actor;
  state: ValueState;
};

/* ── Audit ──────────────────────────────────────────────────────────────── */

export type AuditEventType =
  | "request.submitted"
  | "request.revised"
  | "gate.evaluated"
  | "approval.requested"
  | "approval.decided"
  | "request.approved"
  | "po.dispatched"
  | "po.dispatch-failed"
  | "exception.opened"
  | "clock.advanced"
  | "value.validated"
  | "po.acknowledged"
  | "followup.opened"
  | "task.reassigned"
  | "task.escalated"
  | "duplicate.flagged"
  | "policy.activated";

export type AuditEvent = {
  id: string;
  at: IsoTime;
  type: AuditEventType;
  actor: Actor;
  caseId?: string;
  caseRevision?: number;
  ruleVersion?: string;
  sources: string[];
  summary: string;
  /** True when a person made a purchase decision (affects touchless metrics). */
  substantive: boolean;
  idempotencyKey?: string;
};

/* ── Root state ─────────────────────────────────────────────────────────── */

export type DomainState = {
  schemaVersion: 2;
  clock: { now: IsoTime };
  seq: { case: number; storyCase: Record<string, number>; pr: number; po: number; task: number; audit: number; exception: number; hold: number; value: number; followUp: number };
  followUps: Record<string, FollowUp>;
  policies: { active: string; versions: Record<string, Policy> };
  cases: Record<string, ProcurementCase>;
  requests: Record<string, Request>;
  workPackages: Record<string, WorkPackage>;
  tasks: Record<string, ApprovalTask>;
  exceptions: Record<string, DomainException>;
  pos: Record<string, PurchaseOrder>;
  valueRecords: Record<string, ValueRecord>;
  suppliers: Record<string, Supplier>;
  agreements: Record<string, Agreement>;
  captures: Record<string, string>;
  audit: AuditEvent[];
  processedKeys: Record<string, string>;
  /** Presenter failure injection: remaining failing ERP attempts; whether suppliers withhold confirmation. */
  failures: { erpPo: number; supplierSilent: boolean };
};
