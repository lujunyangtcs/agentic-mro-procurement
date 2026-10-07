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

export type SiteId = "UK-SOL-01" | "UK-HAL-01" | "UK-WOL-01" | "UK-GAY-01";
export type Uom = "EA" | "PAIR" | "PACK" | "LOT" | "SEAT_YEAR" | "DAY";

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
  source: { channel: "form" | "email" | "teams" | "work-order" | "portal"; captureId?: string; originalText: string };
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
  /** Short business title shown on queues ("Engineering Viewer seats · Gaydon"). */
  title?: string;
  closedAt?: IsoTime;
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
  /** Fixture: this supplier has not confirmed the order (drives the 48h chase). */
  withheldAck?: boolean;
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

/**
 * Cash sourcing savings, licence cost avoidance and noncash productivity are
 * separate categories; they are never added into one "savings" figure.
 */
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
  /** One-line basis, e.g. "6 seats × £120 − £20 admin". */
  basis: string;
  baseline: Pence;
  expected: Pence;
  evidenced?: Pence;
  invoiceEvidenceRefs: string[];
  financeSignedBy?: Actor;
  signedAt?: IsoTime;
  state: ValueState;
};

/* ── Workflow runs ──────────────────────────────────────────────────────── */

/** Which step chain a case runs: the catalogue path or one of the five stories. */
export type FlowKey = "catalogue" | StoryId;

/**
 * `queued` — an agent step that may run now. `waiting` — a person must decide.
 * `blocked` — an agent step held by an unmet dependency (e.g. a contract not
 * yet stored); it re-queues itself when the dependency clears.
 */
export type StepStatus = "locked" | "queued" | "waiting" | "blocked" | "done" | "skipped";

export type StepState = {
  status: StepStatus;
  startedAt?: IsoTime;
  finishedAt?: IsoTime;
  /** Business minutes this step took on the demo clock. */
  minutes?: number;
  taskId?: string;
  blockedReason?: string;
  decision?: { optionId: string; by: Actor; at: IsoTime; note?: string };
};

export type CaseRun = {
  id: string;
  caseId: string;
  flow: FlowKey;
  /** Branch switches set by decisions or the presenter (e.g. newSupplier). */
  variant: Record<string, boolean>;
  order: string[];
  steps: Record<string, StepState>;
  current?: string;
  startedAt: IsoTime;
  closedAt?: IsoTime;
  /** "completed" or the reason a decision ended the run early. */
  outcome?: string;
  /** Seeded upstream evidence (standalone ST04 launch), not live decisions. */
  seeded?: boolean;
};

/* ── Business documents ─────────────────────────────────────────────────── */

export type DocKind =
  | "rfq"
  | "quote"
  | "bafo"
  | "award"
  | "contract"
  | "receipt"
  | "invoice"
  | "credit"
  | "reservation"
  | "assignment"
  | "equivalence"
  | "onboarding"
  | "panel-match"
  | "protected-terms";

/**
 * One business record a step produced. Money is pence; `fields` carries the
 * short facts a renderer shows. Workbenches list these by kind, so a quote,
 * award or contract is the same record on every page.
 */
export type BizDoc = {
  id: string;
  kind: DocKind;
  caseId: string;
  runId: string;
  title: string;
  status: string;
  at: IsoTime;
  amount?: Pence;
  supplierId?: string;
  refs: string[];
  fields: Record<string, string | number | boolean>;
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
  | "policy.activated"
  | "run.started"
  | "step.completed"
  | "step.blocked"
  | "step.skipped"
  | "case.closed"
  | "invoice.matched"
  | "invoice.held"
  | "agent.paused"
  | "rule.decided";

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
  schemaVersion: 3;
  clock: { now: IsoTime };
  seq: { case: number; storyCase: Record<string, number>; pr: number; po: number; task: number; audit: number; exception: number; hold: number; value: number; followUp: number; doc: number };
  /** Workflow runs keyed by run id; a case can carry more than one (ST02 + ST04). */
  runs: Record<string, CaseRun>;
  docs: Record<string, BizDoc>;
  /** Agents paused by the AI Ops steward, and Value Council decisions on rule changes. */
  governance: {
    paused: string[];
    ruleChanges: Record<string, { state: "approved" | "rejected"; by: string; at: IsoTime }>;
    opportunities: Record<string, { state: "live" | "parked"; by: string; at: IsoTime }>;
  };
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
