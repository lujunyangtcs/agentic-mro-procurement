/**
 * Workflow engine. One entry point for every command: run commands are
 * handled here, everything else goes to the reducer. After any change the
 * engine re-checks blocked steps, so storing a contract on one run releases
 * the PO held on another.
 *
 * Agent steps run only when they are current and queued; human steps are
 * decided only by a person in the step's role (or a DoA tier that covers the
 * amount). Animation state never reaches this file.
 */

import type { Command, CommandResult } from "@/mro/domain/commands";
import { handleCommand, appendAudit, openHold, closeHolds, pad } from "@/mro/domain/reducer";
import type { Actor, ApprovalTask, CaseRun, DomainState, Role } from "@/mro/domain/types";
import { addHours } from "@/mro/domain/clock";
import { activePolicy } from "@/mro/domain/selectors";
import { FLOWS, stepDef } from "@/mro/domain/flows";
import { agentActor, caseTotal, type StepCtx, type StepDef } from "@/mro/domain/workflowKit";
import { gbp } from "@/mro/domain/money";

type Fail = Extract<CommandResult, { ok: false }>;

const fail = (state: DomainState, error: Fail["error"], message: string): CommandResult => ({ ok: false, state, error, message });

function ctxFor(s: DomainState, run: CaseRun, actor?: Actor): StepCtx {
  return { s, run, caseId: run.caseId, c: s.cases[run.caseId], actor };
}

function stepAudit(ctx: StepCtx, type: "step.completed" | "step.blocked" | "step.skipped" | "approval.requested" | "approval.decided" | "case.closed" | "run.started", actor: Actor, summary: string, sources: string[], substantive = false) {
  appendAudit(ctx.s, { type, actor, caseId: ctx.caseId, caseRevision: ctx.c.revision, ruleVersion: ctx.s.policies.active, sources, summary, substantive });
}

/* ── Advancing a run ────────────────────────────────────────────────────── */

function openTask(ctx: StepCtx, def: StepDef): string {
  const s = ctx.s;
  if (def.reuseTask) {
    const existing = Object.values(s.tasks).find((t) => t.caseId === ctx.caseId && !t.outcome && !t.supersededAt);
    if (existing) return existing.id;
  }
  s.seq.task += 1;
  const task: ApprovalTask = {
    id: `TSK-AP-${pad(s.seq.task, 4)}`,
    caseId: ctx.caseId,
    role: def.role!,
    decision: def.decision?.en ?? def.title.en,
    caseRevision: ctx.c.revision,
    amount: def.amount ? def.amount(ctx) : caseTotal(ctx),
    evidenceRefs: [ctx.c.requestId],
    openedAt: s.clock.now,
    dueAt: addHours(s.clock.now, 48),
  };
  s.tasks[task.id] = task;
  stepAudit(ctx, "approval.requested", agentActor(s, "orchestrator"), `${task.id} · ${def.role} · ${def.decision?.en ?? def.title.en}`, [task.id]);
  return task.id;
}

function finishRun(ctx: StepCtx, outcome: string) {
  const { run, s } = ctx;
  for (const id of run.order) if (run.steps[id].status === "locked" || run.steps[id].status === "queued" || run.steps[id].status === "blocked") run.steps[id].status = "skipped";
  run.current = undefined;
  run.closedAt = s.clock.now;
  run.outcome = outcome;
  const c = s.cases[run.caseId];
  for (const h of c.holds) if (!h.closedAt && h.blockedAction.startsWith(`step:${run.id}:`)) h.closedAt = s.clock.now;
  const open = Object.values(s.runs).some((r) => r.caseId === run.caseId && !r.closedAt);
  if (!open) {
    c.status = "closed";
    c.closedAt = s.clock.now;
    for (const h of c.holds) if (!h.closedAt) h.closedAt = s.clock.now;
  }
  stepAudit(ctx, "case.closed", agentActor(s, "orchestrator"), outcome === "completed" ? `${FLOWS[run.flow].title.en} completed` : outcome, [run.id]);
}

function advance(ctx: StepCtx) {
  const { run, s } = ctx;
  const flow = FLOWS[run.flow];
  for (const id of run.order) {
    const st = run.steps[id];
    if (st.status === "done" || st.status === "skipped") continue;
    if (st.status !== "locked") return;
    const def = flow.steps.find((x) => x.id === id)!;
    ctx.c = s.cases[run.caseId];
    if (def.applies && !def.applies(ctx)) {
      st.status = "skipped";
      continue;
    }
    run.current = id;
    st.startedAt = s.clock.now;
    if (def.kind === "human") {
      st.status = "waiting";
      st.taskId = openTask(ctx, def);
      openHold(s, s.cases[run.caseId], `step:${run.id}:${id}`, def.role!, def.decision?.en ?? def.title.en);
      return;
    }
    const reason = def.waitsFor?.(ctx);
    if (reason) {
      st.status = "blocked";
      st.blockedReason = reason;
      openHold(s, s.cases[run.caseId], `step:${run.id}:${id}`, def.blockedOwner ?? "buy-desk-lead", reason);
      stepAudit(ctx, "step.blocked", agentActor(s, def.group), `${def.title.en} held · ${reason}`, [run.id]);
      return;
    }
    st.status = "queued";
    return;
  }
  finishRun(ctx, "completed");
}

/** Re-queue blocked steps whose dependency has cleared. */
function unblockAll(s: DomainState): DomainState {
  for (const run of Object.values(s.runs)) {
    if (run.closedAt || !run.current) continue;
    const st = run.steps[run.current];
    if (st.status !== "blocked") continue;
    const def = stepDef(run.flow, run.current)!;
    const ctx = ctxFor(s, run);
    if (def.waitsFor && !def.waitsFor(ctx)) {
      st.status = "queued";
      st.blockedReason = undefined;
      closeHolds(s, s.cases[run.caseId], `step:${run.id}:${run.current}`);
    }
  }
  return s;
}

/* ── Commands ───────────────────────────────────────────────────────────── */

function startRun(state: DomainState, cmd: Extract<Command, { type: "flow.start" }>): CommandResult {
  const runId = cmd.runId ?? cmd.caseId;
  if (state.runs[runId]) return { ok: true, state, eventIds: [], duplicate: true, caseId: cmd.caseId };
  if (!state.cases[cmd.caseId]) return fail(state, "unknown-case", `No case ${cmd.caseId}`);
  const s = structuredClone(state);
  const flow = FLOWS[cmd.flow];
  const run: CaseRun = {
    id: runId,
    caseId: cmd.caseId,
    flow: cmd.flow,
    variant: { ...(cmd.variant ?? {}) },
    order: flow.steps.map((x) => x.id),
    steps: Object.fromEntries(flow.steps.map((x) => [x.id, { status: "locked" as const }])),
    startedAt: s.clock.now,
  };
  s.runs[runId] = run;
  const ctx = ctxFor(s, run, cmd.actor);
  stepAudit(ctx, "run.started", agentActor(s, "orchestrator"), `${flow.title.en} started on ${cmd.caseId}`, [runId]);
  advance(ctx);
  return { ok: true, state: ctx.s, eventIds: [], caseId: cmd.caseId };
}

function spawnRuns(ctx: StepCtx) {
  for (const flow of ctx.spawn ?? []) {
    const runId = `${ctx.caseId}/${flow}`;
    if (ctx.s.runs[runId]) continue;
    const r = startRun(ctx.s, { type: "flow.start", actor: agentActor(ctx.s, "orchestrator"), caseId: ctx.caseId, flow, runId, idempotencyKey: `spawn:${runId}` });
    ctx.s = r.state;
  }
  ctx.spawn = undefined;
}

function runStep(state: DomainState, cmd: Extract<Command, { type: "step.run" }>): CommandResult {
  const run0 = state.runs[cmd.runId];
  if (!run0) return fail(state, "unknown-case", `No run ${cmd.runId}`);
  if (state.processedKeys[cmd.idempotencyKey]) return { ok: true, state, eventIds: [], duplicate: true, caseId: run0.caseId };
  if (run0.current !== cmd.stepId) return fail(state, "not-current", `${cmd.stepId} is not the current step`);
  const def = stepDef(run0.flow, cmd.stepId)!;
  const st0 = run0.steps[cmd.stepId];
  if (def.kind !== "agent") return fail(state, "role-mismatch", "A person decides this step");
  if (st0.status === "blocked" && def.waitsFor?.(ctxFor(state, run0))) return fail(state, "blocked", st0.blockedReason ?? "Blocked");
  if (st0.status !== "queued" && st0.status !== "blocked") return fail(state, "not-current", `${cmd.stepId} is ${st0.status}`);
  if (state.governance.paused.includes(def.agent)) return fail(state, "blocked", "Agent paused by AI Ops steward");

  const s = structuredClone(state);
  const run = s.runs[cmd.runId];
  const st = run.steps[cmd.stepId];
  const started = s.clock.now;
  let ctx = ctxFor(s, run);
  if (def.minutes > 0) {
    const r = handleCommand(ctx.s, { type: "clock.advance", actor: agentActor(s, def.group), minutes: def.minutes, idempotencyKey: `${cmd.idempotencyKey}:clock` });
    ctx = { ...ctx, s: r.state, run: r.state.runs[cmd.runId], c: r.state.cases[run.caseId] };
  }
  const result = def.effect ? def.effect(ctx) : ctx.s;
  if ("error" in result) {
    const keep = ctx.s;
    const kr = keep.runs[cmd.runId];
    kr.steps[cmd.stepId].status = "blocked";
    kr.steps[cmd.stepId].blockedReason = result.error;
    return { ok: false, state: keep, error: "blocked", message: result.error };
  }
  ctx.s = result;
  ctx.run = ctx.s.runs[cmd.runId];
  ctx.c = ctx.s.cases[run.caseId];
  const fst = ctx.run.steps[cmd.stepId];
  fst.status = "done";
  fst.blockedReason = undefined;
  fst.startedAt = started;
  fst.finishedAt = ctx.s.clock.now;
  fst.minutes = Math.round((Date.parse(ctx.s.clock.now) - Date.parse(started)) / 60_000);
  closeHolds(ctx.s, ctx.c, `step:${run.id}:${cmd.stepId}`);
  stepAudit(ctx, "step.completed", agentActor(ctx.s, def.group), `${def.title.en} · ${def.output.en}`, [ctx.c.requestId]);
  ctx.s.processedKeys[cmd.idempotencyKey] = `STEP-${run.id}-${cmd.stepId}`;
  spawnRuns(ctx);
  ctx.run = ctx.s.runs[cmd.runId];
  advance(ctx);
  return { ok: true, state: ctx.s, eventIds: [], caseId: run.caseId };
}

function mayDecide(state: DomainState, def: StepDef, role: Role, amount: number): boolean {
  if (role === def.role) return true;
  const policy = activePolicy(state);
  const spendRoles = policy.doa.map((t) => t.role);
  if (!def.role || !spendRoles.includes(def.role) || !spendRoles.includes(role)) return false;
  const tier = policy.doa.find((t) => t.role === role)!;
  return spendRoles.indexOf(role) > spendRoles.indexOf(def.role) && amount <= tier.maxInclusive;
}

function decideStep(state: DomainState, cmd: Extract<Command, { type: "step.decide" }>): CommandResult {
  const run0 = state.runs[cmd.runId];
  if (!run0) return fail(state, "unknown-case", `No run ${cmd.runId}`);
  if (state.processedKeys[cmd.idempotencyKey]) return { ok: true, state, eventIds: [], duplicate: true, caseId: run0.caseId };
  if (run0.current !== cmd.stepId || run0.steps[cmd.stepId].status !== "waiting") return fail(state, "already-decided", "This decision is no longer open");
  const def = stepDef(run0.flow, cmd.stepId)!;
  if (cmd.actor.kind !== "human") return fail(state, "role-mismatch", "Only a person can decide this step");
  const option = def.options?.find((o) => o.id === cmd.optionId);
  if (!option) return fail(state, "invalid-draft", `Unknown option ${cmd.optionId}`);
  const task0 = run0.steps[cmd.stepId].taskId ? state.tasks[run0.steps[cmd.stepId].taskId!] : undefined;
  if (!mayDecide(state, def, cmd.actor.role, task0?.amount ?? 0)) return fail(state, "role-mismatch", `Only the ${def.role} can decide this step`);
  const blocked = option.unavailable?.(ctxFor(state, run0));
  if (blocked) return fail(state, "gate-blocked", blocked.en);

  const s = structuredClone(state);
  const run = s.runs[cmd.runId];
  const st = run.steps[cmd.stepId];
  let ctx = ctxFor(s, run, cmd.actor);
  st.decision = { optionId: option.id, by: cmd.actor, at: s.clock.now, note: cmd.note };
  if (option.variant) Object.assign(run.variant, option.variant);
  if (task0 && !def.reuseTask) {
    const t = s.tasks[task0.id];
    Object.assign(t, { outcome: option.tone === "reject" ? "rejected" : "approved", decidedBy: cmd.actor, decidedAt: s.clock.now, reason: cmd.note });
  }
  stepAudit(ctx, "approval.decided", cmd.actor, `${def.title.en} · ${option.label.en} · ${cmd.actor.name}${task0 ? ` · ${gbp(task0.amount)}` : ""}`, task0 ? [task0.id] : [run.id], true);

  const result = def.effect ? def.effect(ctx, option.id) : ctx.s;
  if ("error" in result) return fail(state, "gate-blocked", result.error);
  ctx = { ...ctx, s: result, run: result.runs[cmd.runId], c: result.cases[run.caseId] };
  const fst = ctx.run.steps[cmd.stepId];
  fst.status = "done";
  fst.finishedAt = ctx.s.clock.now;
  fst.minutes = 0;
  closeHolds(ctx.s, ctx.c, `step:${run.id}:${cmd.stepId}`);
  ctx.s.processedKeys[cmd.idempotencyKey] = `DECIDE-${run.id}-${cmd.stepId}`;
  if (option.endsRun) finishRun(ctx, option.endsRun.en);
  else advance(ctx);
  return { ok: true, state: ctx.s, eventIds: [], caseId: run.caseId };
}

function setVariant(state: DomainState, cmd: Extract<Command, { type: "flow.variant" }>): CommandResult {
  const run = state.runs[cmd.runId];
  if (!run) return fail(state, "unknown-case", `No run ${cmd.runId}`);
  const s = structuredClone(state);
  s.runs[cmd.runId].variant[cmd.key] = cmd.value;
  return { ok: true, state: s, eventIds: [] };
}

function governance(state: DomainState, cmd: Extract<Command, { type: "agent.pause" | "rule.decide" | "opportunity.decide" }>): CommandResult {
  if (cmd.actor.kind !== "human") return fail(state, "role-mismatch", "Governance decisions are made by people");
  const s = structuredClone(state);
  const g = s.governance;
  const at = s.clock.now;
  if (cmd.type === "agent.pause") {
    if (cmd.actor.role !== "ai-ops-steward" && cmd.actor.role !== "buy-desk-lead") return fail(state, "role-mismatch", "Only the AI Ops steward or Buy Desk lead can pause an agent");
    g.paused = cmd.paused ? Array.from(new Set([...g.paused, cmd.agent])) : g.paused.filter((a) => a !== cmd.agent);
    appendAudit(s, { type: "agent.paused", actor: cmd.actor, ruleVersion: s.policies.active, sources: [cmd.agent], summary: `${cmd.agent} ${cmd.paused ? "paused" : "resumed"}`, substantive: false });
  } else if (cmd.type === "rule.decide") {
    if (cmd.actor.role !== "value-council") return fail(state, "role-mismatch", "Only the Value Council decides rule changes (HC09)");
    g.ruleChanges[cmd.changeId] = { state: cmd.outcome, by: cmd.actor.name, at };
    appendAudit(s, { type: "rule.decided", actor: cmd.actor, ruleVersion: s.policies.active, sources: [cmd.changeId], summary: `${cmd.changeId} ${cmd.outcome}`, substantive: false });
  } else {
    if (cmd.actor.role !== "category-lead") return fail(state, "role-mismatch", "Only the Category Lead accepts pipeline opportunities");
    g.opportunities[cmd.opportunityId] = { state: cmd.outcome, by: cmd.actor.name, at };
  }
  return { ok: true, state: s, eventIds: [] };
}

export function dispatchCommand(state: DomainState, cmd: Command): CommandResult {
  let r: CommandResult;
  switch (cmd.type) {
    case "flow.start":
      r = startRun(state, cmd);
      break;
    case "step.run":
      r = runStep(state, cmd);
      break;
    case "step.decide":
      r = decideStep(state, cmd);
      break;
    case "flow.variant":
      r = setVariant(state, cmd);
      break;
    case "agent.pause":
    case "rule.decide":
    case "opportunity.decide":
      r = governance(state, cmd);
      break;
    default:
      r = handleCommand(state, cmd);
  }
  if (r.state !== state) r = { ...r, state: unblockAll(r.state) } as CommandResult;
  return r;
}

/** Run every queued agent step of a run until it reaches a person, a block or the end. */
export function runAgentsUntilStop(state: DomainState, runId: string, keyPrefix = "auto"): DomainState {
  let s = state;
  for (let guard = 0; guard < 40; guard++) {
    const run = s.runs[runId];
    if (!run || run.closedAt || !run.current) break;
    if (run.steps[run.current].status !== "queued") break;
    const r = dispatchCommand(s, { type: "step.run", actor: agentActor(s, "orchestrator"), runId, stepId: run.current, idempotencyKey: `${keyPrefix}:${runId}:${run.current}` });
    s = r.state;
    if (!r.ok) break;
  }
  return s;
}
