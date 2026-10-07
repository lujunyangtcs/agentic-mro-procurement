/**
 * The shared command handler (PRD §17.3). Pure: (state, command) → result.
 *
 * Order inside every command: validate references and revision → check the
 * idempotency key → evaluate the gate → update records and audit together.
 * Nothing here knows about React.
 */

import type { Command, CommandResult, DraftLine, RequestDraft } from "@/mro/domain/commands";
import { evaluateGate, type GateResult } from "@/mro/domain/evaluateGate";
import type {
  Actor,
  ApprovalTask,
  AuditEvent,
  DomainState,
  Hold,
  ProcurementCase,
  RequestLine,
  RequestRevision,
  Role,
  WorkPackage,
} from "@/mro/domain/types";
import { addHours, addMinutes, CLOCK_START } from "@/mro/domain/clock";
import { activePolicy, currentRevision, gateInputFor, policyForCase, revisionTotal } from "@/mro/domain/selectors";
import { doaRoleFor } from "@/mro/domain/evaluateGate";
import { AGREEMENTS, SUPPLIERS, materialByCode } from "@/mro/data/masterData";
import { POLICIES, POL_DEMO_1 } from "@/mro/data/policies";
import { ERP_MAX_ATTEMPTS, erpDispatchPo } from "@/mro/services/mockConnectors";
import { gbp } from "@/mro/domain/money";

export const F1_STEPS = [
  "F1.intake",
  "F1.classify-policy",
  "F1.review",
  "F1.channel",
  "F1.approval",
  "F1.po",
  "F1.follow-up",
] as const;

export function initialDomainState(): DomainState {
  return {
    schemaVersion: 1,
    clock: { now: CLOCK_START },
    seq: { case: 0, storyCase: {}, pr: 1099, po: 7000, task: 0, audit: 0, exception: 0, hold: 0, value: 0 },
    policies: { active: POL_DEMO_1.version, versions: structuredClone(POLICIES) },
    cases: {},
    requests: {},
    workPackages: {},
    tasks: {},
    exceptions: {},
    pos: {},
    valueRecords: {},
    suppliers: Object.fromEntries(SUPPLIERS.map((s) => [s.id, { ...s }])),
    agreements: Object.fromEntries(AGREEMENTS.map((a) => [a.id, structuredClone(a)])),
    captures: {},
    audit: [],
    processedKeys: {},
    failures: { erpPo: 0 },
  };
}

/* ── Small helpers ──────────────────────────────────────────────────────── */

const pad = (n: number, w = 3) => String(n).padStart(w, "0");

function audit(
  s: DomainState,
  e: Omit<AuditEvent, "id" | "at">,
): AuditEvent {
  s.seq.audit += 1;
  const ev: AuditEvent = { id: `AUD-${pad(s.seq.audit, 5)}`, at: s.clock.now, ...e };
  s.audit.push(ev);
  return ev;
}

function ruleVersion(actor: Actor, fallback: string): string {
  return actor.kind === "human" ? fallback : actor.policyVersion;
}

function openHold(s: DomainState, c: ProcurementCase, blockedAction: string, requiredRole: Role, reason: string, controlId?: string): Hold {
  const existing = c.holds.find((h) => !h.closedAt && h.blockedAction === blockedAction && h.requiredRole === requiredRole);
  if (existing) return existing;
  s.seq.hold += 1;
  const h: Hold = { id: `HOLD-${pad(s.seq.hold, 4)}`, blockedAction, requiredRole, reason, controlId, openedAt: s.clock.now };
  c.holds.push(h);
  c.status = "held";
  return h;
}

function closeHolds(s: DomainState, c: ProcurementCase, blockedAction: string) {
  for (const h of c.holds) if (!h.closedAt && h.blockedAction === blockedAction) h.closedAt = s.clock.now;
  if (!c.holds.some((h) => !h.closedAt) && c.status === "held") c.status = "open";
}

function f1(s: DomainState, c: ProcurementCase): WorkPackage {
  return c.workPackageIds.map((id) => s.workPackages[id]).find((w) => w.tomFlow === "F1")!;
}

function fail(state: DomainState, error: Extract<CommandResult, { ok: false }>["error"], message: string, extra: { gate?: GateResult; taskId?: string } = {}): CommandResult {
  return { ok: false, state, error, message, ...extra };
}

function resolveLines(draftLines: DraftLine[], site: RequestDraft["site"], agreementId: string | undefined, s: DomainState): RequestLine[] | string {
  const agreement = agreementId ? s.agreements[agreementId] : undefined;
  const out: RequestLine[] = [];
  for (const [i, l] of draftLines.entries()) {
    const m = materialByCode[l.material];
    if (!m) return `Unknown material ${l.material}`;
    if (!Number.isInteger(l.quantity) || l.quantity <= 0 || l.quantity > 100_000) return `Invalid quantity ${l.quantity}`;
    let quantity = l.quantity;
    let entered: RequestLine["entered"];
    if (l.uom !== m.uom) {
      if (m.pack && l.uom === m.pack.uom) {
        quantity = l.quantity * m.pack.unitsPerPack;
        entered = { quantity: l.quantity, uom: l.uom };
      } else return `UoM ${l.uom} does not convert to ${m.uom}`;
    }
    const price = agreement?.lines.find((al) => al.material === m.code && al.sites.includes(site))?.unitPrice ?? 0;
    out.push({ lineNo: (i + 1) * 10, material: m.code, description: m.description, quantity, uom: m.uom, entered, unitPrice: price, site, neededBy: l.neededBy });
  }
  return out;
}

/* ── Command handlers ───────────────────────────────────────────────────── */

function submit(state: DomainState, cmd: Extract<Command, { type: "request.submit" }>): CommandResult {
  const d = cmd.draft;

  /* Reopening the same captured message returns its existing case. */
  if (d.captureId && state.captures[d.captureId]) {
    return { ok: true, state, eventIds: [], duplicate: true, caseId: state.captures[d.captureId] };
  }
  if (state.processedKeys[cmd.idempotencyKey]) {
    const ev = state.audit.find((e) => e.id === state.processedKeys[cmd.idempotencyKey]);
    return { ok: true, state, eventIds: [], duplicate: true, caseId: ev?.caseId };
  }

  const s = structuredClone(state);
  const lines = resolveLines(d.lines, d.site, d.agreementId, s);
  if (typeof lines === "string") return fail(state, "invalid-draft", lines);

  /* IDs: the first instance of a fixture uses its PRD ID; later ones count on. */
  let caseId: string;
  if (d.preferredCaseId && !s.cases[d.preferredCaseId]) {
    caseId = d.preferredCaseId;
    const prefix = d.preferredCaseId.replace(/-\d+$/, "");
    s.seq.storyCase[prefix] = Math.max(s.seq.storyCase[prefix] ?? 0, Number(d.preferredCaseId.match(/(\d+)$/)?.[1] ?? 1));
  } else if (d.preferredCaseId) {
    const prefix = d.preferredCaseId.replace(/-\d+$/, "");
    s.seq.storyCase[prefix] = (s.seq.storyCase[prefix] ?? 1) + 1;
    caseId = `${prefix}-${pad(s.seq.storyCase[prefix])}`;
  } else {
    s.seq.case += 1;
    caseId = `CASE-AP-${pad(s.seq.case)}`;
  }
  let prId: string;
  if (d.preferredPrId && !s.requests[d.preferredPrId]) prId = d.preferredPrId;
  else {
    s.seq.pr += 1;
    prId = `PR-AP-${s.seq.pr}`;
  }

  const policy = activePolicy(s);
  const rev: RequestRevision = {
    revision: 1,
    submittedAt: s.clock.now,
    lines,
    costCentre: d.costCentre,
    glCode: d.glCode,
    purpose: d.purpose,
    urgency: d.urgency,
    supplierPreference: d.supplierPreference,
    agreementId: d.agreementId,
    supplierId: d.supplierId,
    confidence: d.confidence,
    pattern: d.pattern,
  };
  const wpId = `WP-${caseId.replace(/^CASE-/, "")}-F1`;
  s.requests[prId] = {
    id: prId,
    caseId,
    requester: d.requester,
    source: { channel: d.channel, captureId: d.captureId, originalText: d.originalText },
    revisions: [rev],
  };
  s.workPackages[wpId] = {
    id: wpId,
    caseId,
    tomFlow: "F1",
    stepIds: [...F1_STEPS],
    currentStepId: "F1.classify-policy",
    owner: "intake-classify",
    state: "running",
    dependsOn: [],
    nextAction: "request.approve",
  };
  s.cases[caseId] = {
    id: caseId,
    storyId: d.storyId,
    fixtureId: d.fixtureId,
    revision: 1,
    requestId: prId,
    requester: d.requester,
    site: d.site,
    status: "open",
    policyVersion: policy.version,
    workPackageIds: [wpId],
    holds: [],
    createdAt: s.clock.now,
  };
  if (d.captureId) s.captures[d.captureId] = caseId;

  const ev = audit(s, {
    type: "request.submitted",
    actor: cmd.actor,
    caseId,
    caseRevision: 1,
    ruleVersion: policy.version,
    sources: [prId, ...(d.captureId ? [d.captureId] : [])],
    summary: `${prId} submitted · ${gbp(revisionTotal(rev))}`,
    substantive: false,
    idempotencyKey: cmd.idempotencyKey,
  });
  s.processedKeys[cmd.idempotencyKey] = ev.id;
  return { ok: true, state: s, eventIds: [ev.id], caseId };
}

function revise(state: DomainState, cmd: Extract<Command, { type: "request.revise" }>): CommandResult {
  const c = state.cases[cmd.caseId];
  if (!c) return fail(state, "unknown-case", `No case ${cmd.caseId}`);
  if (cmd.expectedRevision !== c.revision) return fail(state, "stale-revision", `Case is at revision ${c.revision}`);
  if (state.processedKeys[cmd.idempotencyKey]) return { ok: true, state, eventIds: [], duplicate: true, caseId: c.id };

  const s = structuredClone(state);
  const sc = s.cases[c.id];
  const prev = currentRevision(s, c.id)!;
  const lines = resolveLines(cmd.lines, sc.site, prev.agreementId, s);
  if (typeof lines === "string") return fail(state, "invalid-draft", lines);

  const next: RequestRevision = { ...structuredClone(prev), revision: prev.revision + 1, submittedAt: s.clock.now, lines };
  s.requests[sc.requestId].revisions.push(next);
  sc.revision = next.revision;
  /* Material change: earlier approvals no longer cover this revision. */
  for (const h of sc.holds) if (!h.closedAt) h.closedAt = s.clock.now;
  sc.status = "open";
  const wp = f1(s, sc);
  wp.currentStepId = "F1.classify-policy";
  wp.nextAction = "request.approve";

  const ev = audit(s, {
    type: "request.revised",
    actor: cmd.actor,
    caseId: sc.id,
    caseRevision: next.revision,
    ruleVersion: sc.policyVersion,
    sources: [sc.requestId],
    summary: `Revision ${next.revision} · ${gbp(revisionTotal(next))}; prior approvals superseded`,
    substantive: false,
    idempotencyKey: cmd.idempotencyKey,
  });
  s.processedKeys[cmd.idempotencyKey] = ev.id;
  return { ok: true, state: s, eventIds: [ev.id], caseId: sc.id };
}

function approve(state: DomainState, cmd: Extract<Command, { type: "request.approve" }>): CommandResult {
  const c = state.cases[cmd.caseId];
  if (!c) return fail(state, "unknown-case", `No case ${cmd.caseId}`);
  if (cmd.expectedRevision !== c.revision) return fail(state, "stale-revision", `Case is at revision ${c.revision}`);
  if (state.processedKeys[cmd.idempotencyKey]) return { ok: true, state, eventIds: [], duplicate: true, caseId: c.id };

  const s = structuredClone(state);
  const sc = s.cases[c.id];
  const request = s.requests[sc.requestId];
  const policy = policyForCase(s, sc);
  const gate = evaluateGate(gateInputFor(s, sc.id, "request.approve", cmd.actor));
  const wp = f1(s, sc);
  wp.lane = gate.lane;
  const amount = revisionTotal(currentRevision(s, sc.id)!);

  const gateEv = audit(s, {
    type: "gate.evaluated",
    actor: { kind: "agent", agentId: "orchestrator", policyVersion: policy.version },
    caseId: sc.id,
    caseRevision: sc.revision,
    ruleVersion: `${policy.version} / ${gate.confidence.weightVersion}`,
    sources: [sc.requestId],
    summary: gate.allowed
      ? `Gate passed · lane ${gate.lane} · confidence ${gate.confidence.score.toFixed(2)}`
      : `Gate held at ${gate.failedStage} · ${gate.reason}`,
    substantive: false,
  });

  if (!gate.allowed) {
    const role = gate.requiredRole ?? "buy-desk-lead";
    openHold(s, sc, "request.approve", role, gate.reason ?? "Gate held");
    wp.currentStepId = gate.failedStage === "lane" ? "F1.review" : "F1.approval";
    wp.state = "waiting";
    let taskId: string | undefined;
    const isSpendAuthority = (gate.failedStage === "authority" || gate.controls.some((x) => x.id === "HC02" && x.result === "fail")) && !!doaRoleFor(policy, amount);
    if (isSpendAuthority) {
      const open = Object.values(s.tasks).find((t) => t.caseId === sc.id && t.caseRevision === sc.revision && t.role === role && !t.outcome);
      if (open) taskId = open.id;
      else {
        s.seq.task += 1;
        const task: ApprovalTask = {
          id: `TASK-AP-${pad(s.seq.task, 4)}`,
          caseId: sc.id,
          role,
          decision: "Approve spend commitment",
          caseRevision: sc.revision,
          amount,
          evidenceRefs: [sc.requestId, ...(currentRevision(s, sc.id)!.agreementId ? [currentRevision(s, sc.id)!.agreementId!] : [])],
          dueAt: addHours(s.clock.now, 48),
        };
        s.tasks[task.id] = task;
        taskId = task.id;
        audit(s, {
          type: "approval.requested",
          actor: { kind: "agent", agentId: "orchestrator", policyVersion: policy.version },
          caseId: sc.id,
          caseRevision: sc.revision,
          ruleVersion: policy.version,
          sources: [task.id],
          summary: `${task.id} · ${role} to approve ${gbp(amount)}`,
          substantive: false,
        });
      }
    }
    return { ...fail(s, "gate-blocked", gate.reason ?? "Gate held", { gate, taskId }) };
  }

  request.approvedRevision = sc.revision;
  request.approvedBy = cmd.actor;
  closeHolds(s, sc, "request.approve");
  wp.currentStepId = "F1.po";
  wp.state = "running";
  wp.nextAction = "po.release";
  const ev = audit(s, {
    type: "request.approved",
    actor: cmd.actor,
    caseId: sc.id,
    caseRevision: sc.revision,
    ruleVersion: ruleVersion(cmd.actor, policy.version),
    sources: [sc.requestId, ...(gate.authority.standing ? ["SM-CATALOGUE-01"] : [])],
    summary: gate.authority.standing
      ? `Approved under standing mandate SM-CATALOGUE-01 · ${gbp(amount)} below ${gbp(policy.autoApproveLimit)}`
      : `Approved · ${gbp(amount)}`,
    substantive: cmd.actor.kind === "human",
    idempotencyKey: cmd.idempotencyKey,
  });
  s.processedKeys[cmd.idempotencyKey] = ev.id;
  return { ok: true, state: s, eventIds: [gateEv.id, ev.id], caseId: sc.id, gate };
}

function decide(state: DomainState, cmd: Extract<Command, { type: "approval.decide" }>): CommandResult {
  const t = state.tasks[cmd.taskId];
  if (!t) return fail(state, "unknown-task", `No task ${cmd.taskId}`);
  if (state.processedKeys[cmd.idempotencyKey]) return { ok: true, state, eventIds: [], duplicate: true, caseId: t.caseId };
  if (t.outcome) return fail(state, "already-decided", `${t.id} was already ${t.outcome}`);
  const c = state.cases[t.caseId];
  if (cmd.expectedRevision !== c.revision || t.caseRevision !== c.revision) return fail(state, "stale-revision", `Case is at revision ${c.revision}; task covers ${t.caseRevision}`);
  if (cmd.actor.kind !== "human") return fail(state, "role-mismatch", "Only a person can decide an approval task");
  const policy = policyForCase(state, c);
  const actorRole = cmd.actor.role;
  /* A higher spend tier may decide a lower tier's task; nobody else may. */
  const tier = policy.doa.find((x) => x.role === actorRole);
  const coversByDoa = !!tier && t.amount <= tier.maxInclusive;
  if (cmd.actor.role !== t.role && !coversByDoa) return fail(state, "role-mismatch", `${cmd.actor.role} cannot decide a ${t.role} task`);

  const s = structuredClone(state);
  const st = s.tasks[t.id];
  const sc = s.cases[c.id];
  st.outcome = cmd.outcome;
  st.decidedBy = cmd.actor;
  st.decidedAt = s.clock.now;
  st.reason = cmd.reason;
  const ev = audit(s, {
    type: "approval.decided",
    actor: cmd.actor,
    caseId: sc.id,
    caseRevision: sc.revision,
    ruleVersion: policy.version,
    sources: [st.id],
    summary: `${st.id} ${cmd.outcome} by ${cmd.actor.name} (${cmd.actor.role}) · ${gbp(st.amount)}`,
    substantive: true,
    idempotencyKey: cmd.idempotencyKey,
  });
  s.processedKeys[cmd.idempotencyKey] = ev.id;

  if (cmd.outcome === "rejected") {
    closeHolds(s, sc, "request.approve");
    openHold(s, sc, "request.approve", "requester", cmd.reason ?? "Rejected; revise and resubmit");
    return { ok: true, state: s, eventIds: [ev.id], caseId: sc.id };
  }

  /* Re-run the gate with the recorded approval: it must now pass on its own. */
  const followUp = approve(s, {
    type: "request.approve",
    actor: cmd.actor,
    caseId: sc.id,
    expectedRevision: sc.revision,
    idempotencyKey: `${cmd.idempotencyKey}:approve`,
  });
  return followUp.ok
    ? { ...followUp, eventIds: [ev.id, ...followUp.eventIds] }
    : followUp;
}

function release(state: DomainState, cmd: Extract<Command, { type: "po.release" }>): CommandResult {
  const c = state.cases[cmd.caseId];
  if (!c) return fail(state, "unknown-case", `No case ${cmd.caseId}`);
  if (cmd.expectedRevision !== c.revision) return fail(state, "stale-revision", `Case is at revision ${c.revision}`);
  const existing = Object.values(state.pos).find((p) => p.caseId === c.id && p.requestRevision === c.revision && p.dispatch.state === "dispatched");
  if (state.processedKeys[cmd.idempotencyKey] || existing) {
    return { ok: true, state, eventIds: [], duplicate: true, caseId: c.id, poId: existing?.id };
  }

  const s = structuredClone(state);
  const sc = s.cases[c.id];
  const policy = policyForCase(s, sc);
  const gate = evaluateGate(gateInputFor(s, sc.id, "po.release", cmd.actor));
  const wp = f1(s, sc);
  if (!gate.allowed) {
    openHold(s, sc, "po.release", gate.requiredRole ?? "buy-desk-lead", gate.reason ?? "Gate held", gate.controls.find((x) => x.result === "fail")?.id);
    wp.state = "waiting";
    audit(s, {
      type: "gate.evaluated",
      actor: { kind: "agent", agentId: "po-value-assurance", policyVersion: policy.version },
      caseId: sc.id,
      caseRevision: sc.revision,
      ruleVersion: policy.version,
      sources: [sc.requestId],
      summary: `PO release held · ${gate.reason}`,
      substantive: false,
    });
    return fail(s, "gate-blocked", gate.reason ?? "Gate held", { gate });
  }

  const rev = currentRevision(s, sc.id)!;
  s.seq.po += 1;
  const poId = `PO-AP-${s.seq.po}`;
  let attempts = 0;
  let reply: ReturnType<typeof erpDispatchPo> = { ok: false, error: "not attempted" };
  while (attempts < ERP_MAX_ATTEMPTS) {
    attempts += 1;
    reply = erpDispatchPo(poId, s.failures.erpPo);
    if (reply.ok) break;
    s.failures.erpPo = Math.max(0, s.failures.erpPo - 1);
  }

  if (!reply.ok) {
    s.seq.po -= 1;
    s.seq.exception += 1;
    const excId = `EXC-AP-${pad(s.seq.exception, 4)}`;
    s.exceptions[excId] = {
      id: excId,
      caseId: sc.id,
      reason: `ERP dispatch failed after ${attempts} attempts`,
      blockedAction: "po.release",
      owner: "buy-desk-lead",
      dueAt: addHours(s.clock.now, 4),
      openedAt: s.clock.now,
    };
    openHold(s, sc, "po.release", "buy-desk-lead", `ERP dispatch failed after ${attempts} attempts; manual fallback due in 4h`);
    wp.state = "blocked";
    audit(s, {
      type: "po.dispatch-failed",
      actor: cmd.actor,
      caseId: sc.id,
      caseRevision: sc.revision,
      ruleVersion: policy.version,
      sources: [sc.requestId, excId],
      summary: `ERP dispatch failed ${attempts}× with key ${cmd.idempotencyKey}; ${excId} opened`,
      substantive: false,
    });
    return fail(s, "connector-failed", `ERP dispatch failed after ${attempts} attempts`, { gate });
  }

  const request = s.requests[sc.requestId];
  s.pos[poId] = {
    id: poId,
    caseId: sc.id,
    requestId: sc.requestId,
    requestRevision: sc.revision,
    supplierId: rev.supplierId!,
    agreementId: rev.agreementId,
    lines: structuredClone(rev.lines),
    total: revisionTotal(rev),
    approvedBy: request.approvedBy!,
    dispatch: { state: "dispatched", erpRef: reply.erpRef, attempts, at: s.clock.now },
  };
  closeHolds(s, sc, "po.release");
  sc.status = "po-dispatched";
  wp.currentStepId = "F1.follow-up";
  wp.state = "running";
  wp.nextAction = "supplier.acknowledge";
  const ev = audit(s, {
    type: "po.dispatched",
    actor: cmd.actor,
    caseId: sc.id,
    caseRevision: sc.revision,
    ruleVersion: ruleVersion(cmd.actor, policy.version),
    sources: [poId, reply.erpRef, sc.requestId],
    summary: `${poId} dispatched to ${s.suppliers[rev.supplierId!]?.name} · ${gbp(revisionTotal(rev))} · ${reply.erpRef}`,
    substantive: false,
    idempotencyKey: cmd.idempotencyKey,
  });
  s.processedKeys[cmd.idempotencyKey] = ev.id;
  return { ok: true, state: s, eventIds: [ev.id], caseId: sc.id, poId, gate };
}

function advance(state: DomainState, cmd: Extract<Command, { type: "clock.advance" }>): CommandResult {
  if (state.processedKeys[cmd.idempotencyKey]) return { ok: true, state, eventIds: [], duplicate: true };
  const s = structuredClone(state);
  s.clock.now = addMinutes(s.clock.now, cmd.minutes);
  s.processedKeys[cmd.idempotencyKey] = `CLOCK-${s.clock.now}`;
  return { ok: true, state: s, eventIds: [] };
}

export function handleCommand(state: DomainState, cmd: Command): CommandResult {
  switch (cmd.type) {
    case "request.submit":
      return submit(state, cmd);
    case "request.revise":
      return revise(state, cmd);
    case "request.approve":
      return approve(state, cmd);
    case "approval.decide":
      return decide(state, cmd);
    case "po.release":
      return release(state, cmd);
    case "clock.advance":
      return advance(state, cmd);
  }
}
