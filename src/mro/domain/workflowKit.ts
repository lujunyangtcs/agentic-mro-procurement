/**
 * Shared vocabulary for flow definitions: what a step is, the context its
 * effect receives, and helpers that write business records and audit events
 * on the (already cloned) state. Flow files describe steps; the engine
 * decides when a step may run and who may decide it.
 */

import type { Command, CommandResult } from "@/mro/domain/commands";
import { handleCommand, appendAudit, pad } from "@/mro/domain/reducer";
import type {
  Actor,
  AgentGroupId,
  AuditEventType,
  BizDoc,
  CaseRun,
  DocKind,
  DomainState,
  Pence,
  ProcurementCase,
  Role,
  ValueRecord,
} from "@/mro/domain/types";
import { currentRevision, revisionTotal } from "@/mro/domain/selectors";
import { addMinutes } from "@/mro/domain/clock";

export type Bi = { en: string; de: string };

/** Semantic agent identity shown in the rail; each has its own icon. */
export type AgentKey =
  | "intake"
  | "spend"
  | "licences"
  | "channel"
  | "suppliers"
  | "risk"
  | "sourcing"
  | "spec"
  | "contracts"
  | "approval"
  | "po"
  | "invoice"
  | "value";

export type StepCtx = {
  s: DomainState;
  run: CaseRun;
  caseId: string;
  c: ProcurementCase;
  /** The person deciding a human step. */
  actor?: Actor;
  /** Flows a step opens on the same case (ST02 opens ST04). */
  spawn?: CaseRun["flow"][];
};

export type StepOption = {
  id: string;
  label: Bi;
  tone: "approve" | "reject" | "alt";
  primary?: boolean;
  /** Branch switches this choice sets on the run. */
  variant?: Record<string, boolean>;
  /** Ends the run here with this outcome. */
  endsRun?: Bi;
  /** Why the option is unavailable right now, if it is. */
  unavailable?: (ctx: StepCtx) => Bi | undefined;
};

export type EffectResult = DomainState | { error: string };

export type StepDef = {
  id: string;
  agent: AgentKey;
  /** Agent group stamped on audit events. */
  group: AgentGroupId;
  kind: "agent" | "human";
  role?: Role;
  title: Bi;
  /** Business time the step takes on the demo clock. */
  minutes: number;
  /** At most three things the agent does, in order. */
  activities: Bi[];
  /** The file this step hands to the next owner. */
  output: Bi;
  /** Renderer key for the step's business artifact. */
  artifact: string;
  /** TOM reference, shown only in the evidence drawer. */
  tom: string;
  model?: string;
  confidence?: number;
  guardrails?: string[];
  /** Step is skipped (Not required) when this returns false. */
  applies?: (ctx: StepCtx) => boolean;
  /** An agent step stays blocked while this returns a reason. */
  waitsFor?: (ctx: StepCtx) => string | undefined;
  /** Who owns clearing that block. */
  blockedOwner?: Role;
  effect?: (ctx: StepCtx, optionId?: string) => EffectResult;
  /** Human steps: what is being decided, what it blocks, and the choices. */
  decision?: Bi;
  blocks?: Bi;
  options?: StepOption[];
  /** Money the decision commits, for the task card. */
  amount?: (ctx: StepCtx) => Pence;
  /** Reuse an approval task the reducer's gate opened instead of creating one. */
  reuseTask?: boolean;
};

export type FlowDef = {
  key: CaseRun["flow"];
  title: Bi;
  steps: StepDef[];
};

/* ── Actors ─────────────────────────────────────────────────────────────── */

export const agentActor = (s: DomainState, agentId: AgentGroupId): Actor => ({ kind: "agent", agentId, policyVersion: s.policies.active });
export const policyActor = (s: DomainState, mandateId = "SM-STANDING-01"): Actor => ({ kind: "policy", policyVersion: s.policies.active, mandateId });

/* ── Records ────────────────────────────────────────────────────────────── */

export function addDoc(ctx: StepCtx, d: { id?: string; kind: DocKind; title: string; status: string; amount?: Pence; supplierId?: string; refs?: string[]; fields?: BizDoc["fields"] }): BizDoc {
  const s = ctx.s;
  s.seq.doc += 1;
  const id = d.id ?? `DOC-AP-${pad(s.seq.doc, 4)}`;
  const doc: BizDoc = { id, kind: d.kind, caseId: ctx.caseId, runId: ctx.run.id, title: d.title, status: d.status, at: s.clock.now, amount: d.amount, supplierId: d.supplierId, refs: d.refs ?? [], fields: d.fields ?? {} };
  s.docs[id] = doc;
  return doc;
}

export function docOf(s: DomainState, caseId: string, kind: DocKind, pred?: (d: BizDoc) => boolean): BizDoc | undefined {
  return Object.values(s.docs).find((d) => d.caseId === caseId && d.kind === kind && (!pred || pred(d)));
}

export function docsOf(s: DomainState, caseId: string, kind: DocKind): BizDoc[] {
  return Object.values(s.docs).filter((d) => d.caseId === caseId && d.kind === kind);
}

export function log(ctx: StepCtx, type: AuditEventType, actor: Actor, summary: string, sources: string[] = [], substantive = false) {
  return appendAudit(ctx.s, {
    type,
    actor,
    caseId: ctx.caseId,
    caseRevision: ctx.c.revision,
    ruleVersion: ctx.s.policies.active,
    sources,
    summary,
    substantive,
  });
}

export function upsertValue(ctx: StepCtx, key: string, patch: Partial<ValueRecord> & Pick<ValueRecord, "category">): ValueRecord {
  const s = ctx.s;
  const existing = Object.values(s.valueRecords).find((v) => v.caseId === ctx.caseId && v.awardKey === key);
  if (existing) {
    Object.assign(existing, patch);
    return existing;
  }
  s.seq.value += 1;
  const rec: ValueRecord = {
    id: `VAL-AP-${pad(s.seq.value, 4)}`,
    caseId: ctx.caseId,
    awardKey: key,
    basis: "",
    baseline: 0,
    expected: 0,
    invoiceEvidenceRefs: [],
    state: "expected",
    ...patch,
  };
  s.valueRecords[rec.id] = rec;
  return rec;
}

export function valueOf(s: DomainState, caseId: string, key: string): ValueRecord | undefined {
  return Object.values(s.valueRecords).find((v) => v.caseId === caseId && v.awardKey === key);
}

/** Run a reducer command on the working state; a failure becomes the step's error. */
export function command(ctx: StepCtx, cmd: Command): CommandResult {
  const r = handleCommand(ctx.s, cmd);
  ctx.s = r.state;
  ctx.c = r.state.cases[ctx.caseId];
  return r;
}

export function tick(ctx: StepCtx, minutes: number) {
  const r = handleCommand(ctx.s, { type: "clock.advance", actor: agentActor(ctx.s, "orchestrator"), minutes, idempotencyKey: `tick:${ctx.run.id}:${ctx.s.seq.audit}:${minutes}` });
  ctx.s = r.state;
  ctx.c = r.state.cases[ctx.caseId];
}

export function caseTotal(ctx: StepCtx): Pence {
  const rev = currentRevision(ctx.s, ctx.caseId);
  return rev ? revisionTotal(rev) : 0;
}

export function rev(ctx: StepCtx) {
  return currentRevision(ctx.s, ctx.caseId)!;
}

/** Approve the current revision under policy, then release the PO — both through the gate. */
export function approveAndRelease(ctx: StepCtx, mandateId: string): EffectResult {
  const r0 = ctx.c.revision;
  if (ctx.s.requests[ctx.c.requestId].approvedRevision !== r0) {
    const approved = command(ctx, { type: "request.approve", actor: policyActor(ctx.s, mandateId), caseId: ctx.caseId, expectedRevision: r0, idempotencyKey: `${ctx.caseId}:approve:r${r0}` });
    if (!approved.ok) return { error: approved.message };
  }
  const released = command(ctx, { type: "po.release", actor: policyActor(ctx.s, mandateId), caseId: ctx.caseId, expectedRevision: r0, idempotencyKey: `${ctx.caseId}:po:r${r0}` });
  if (!released.ok) return { error: released.message };
  return ctx.s;
}

export function poOf(s: DomainState, caseId: string) {
  return Object.values(s.pos).find((p) => p.caseId === caseId && p.dispatch.state === "dispatched");
}

/** Receipt + invoice events for a dispatched PO; a variance holds the invoice. */
export function receiveAndInvoice(ctx: StepCtx, opts: { days: number; receiptLabel: string; variance?: Pence; lines?: string }): EffectResult {
  const po = poOf(ctx.s, ctx.caseId);
  if (!po) return { error: "No dispatched PO to receive against" };
  tick(ctx, opts.days * 24 * 60);
  const receipt = addDoc(ctx, { kind: "receipt", title: opts.receiptLabel, status: "posted", amount: po.total, supplierId: po.supplierId, refs: [po.id], fields: { poId: po.id, lines: opts.lines ?? "All lines received" } });
  tick(ctx, 24 * 60);
  const variance = opts.variance ?? 0;
  const invId = `INV-AP-${pad(Object.values(ctx.s.docs).filter((d) => d.kind === "invoice").length + 5101, 4)}`;
  const invoice = addDoc(ctx, {
    id: invId,
    kind: "invoice",
    title: `${invId} · ${ctx.s.suppliers[po.supplierId]?.name ?? po.supplierId}`,
    status: variance > 0 ? "held" : "matched",
    amount: po.total + variance,
    supplierId: po.supplierId,
    refs: [po.id, receipt.id],
    fields: { poId: po.id, receiptId: receipt.id, poAmount: po.total, variance, reason: variance > 0 ? "Price above PO" : "" },
  });
  log(
    ctx,
    variance > 0 ? "invoice.held" : "invoice.matched",
    agentActor(ctx.s, "value"),
    variance > 0 ? `${invoice.id} held · ${po.id} variance` : `${invoice.id} matched to ${po.id} and ${receipt.id}`,
    [invoice.id, po.id, receipt.id],
  );
  return ctx.s;
}

export const hours = (h: number) => h * 60;
export const days = (d: number) => d * 24 * 60;
export { addMinutes };
