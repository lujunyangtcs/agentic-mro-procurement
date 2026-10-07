import { describe, expect, it } from "vitest";
import { handleCommand, initialDomainState } from "@/mro/domain/reducer";
import { idemKey } from "@/mro/domain/commands";
import { isFullyTouchless, isNoBuyerTouch, touchMetrics } from "@/mro/domain/selectors";
import { runCatalogue, REQUESTER, STANDING_MANDATE } from "@/mro/data/seedDomain";
import { BUDGET_HOLDER_PACKS, catalogueFixture } from "@/mro/data/storyFixtures";
import { londonDateTime } from "@/mro/domain/clock";
import type { Actor, DomainState } from "@/mro/domain/types";

const budgetHolder: Actor = { kind: "human", role: "budget-holder", name: "Halewood budget holder" };
const tick = (s: DomainState, minutes: number, key: string) => handleCommand(s, { type: "clock.advance", actor: STANDING_MANDATE, minutes, idempotencyKey: key }).state;

describe("catalogue fixture (touchless path)", () => {
  const { state: s, caseId } = runCatalogue(initialDomainState());
  const c = s.cases[caseId!];
  const po = Object.values(s.pos)[0];

  it("creates TSM-2026-104701 / REQ-118801 with a £480 PO", () => {
    expect(c.id).toBe("TSM-2026-104701");
    expect(c.requestId).toBe("REQ-118801");
    expect(c.status).toBe("po-dispatched");
    expect(po.id).toBe("PO-7790001");
    expect(po.total).toBe(48_000);
    expect(po.lines[0]).toMatchObject({ quantity: 40, uom: "PAIR", entered: { quantity: 10, uom: "PACK" } });
  });

  it("records the approval as policy DOA-2026.2, never a person", () => {
    const approved = s.audit.find((e) => e.type === "request.approved")!;
    expect(approved.actor).toEqual(STANDING_MANDATE);
    expect(approved.ruleVersion).toBe("DOA-2026.2");
    expect(s.audit.every((e) => !(e.actor.kind === "human" && e.substantive))).toBe(true);
  });

  it("counts as fully touchless and no buyer touch", () => {
    expect(isFullyTouchless(s, c.id)).toBe(true);
    expect(isNoBuyerTouch(s, c.id)).toBe(true);
    expect(touchMetrics(s)).toEqual({ eligible: 1, noBuyerTouch: 1, fullyTouchless: 1 });
  });

  it("is stamped on 07 Oct 2026 London time", () => {
    expect(londonDateTime(c.createdAt)).toBe("07 Oct 2026, 09:00");
  });

  it("supplier confirms 2h after dispatch", () => {
    const later = tick(s, 120, "t2h");
    expect(later.pos[po.id].acknowledgedAt).toBeDefined();
    expect(later.audit.at(-1)?.type).toBe("po.acknowledged");
    expect(isFullyTouchless(later, c.id)).toBe(true);
  });

  it("a silent supplier triggers one chaser at 48h", () => {
    const silent = handleCommand(s, { type: "failures.set", actor: STANDING_MANDATE, supplierSilent: true, idempotencyKey: "f" }).state;
    const at47 = tick(silent, 47 * 60, "t47");
    expect(Object.values(at47.followUps)).toHaveLength(0);
    const at49 = tick(at47, 2 * 60, "t49");
    const chasers = Object.values(at49.followUps);
    expect(chasers).toHaveLength(1);
    expect(chasers[0]).toMatchObject({ kind: "supplier-chase", owner: "buy-desk-analyst", refId: po.id });
    const confirmed = handleCommand(at49, { type: "po.acknowledge", actor: { kind: "human", role: "supplier", name: "Midlands Industrial Supply" }, poId: po.id, idempotencyKey: "ack" }).state;
    expect(confirmed.followUps[chasers[0].id].closedAt).toBeDefined();
  });
});

describe(`${BUDGET_HOLDER_PACKS} packs crosses the £5,000 auto-approve limit`, () => {
  const { state, caseId } = runCatalogue(initialDomainState(), BUDGET_HOLDER_PACKS);
  const id = caseId!;

  it("holds with a Budget Holder task and no PO", () => {
    expect(Object.keys(state.pos)).toHaveLength(0);
    const task = Object.values(state.tasks)[0];
    expect(task).toMatchObject({ id: "TSK-26-0001", role: "budget-holder", amount: 576_000, caseRevision: 1 });
    expect(state.cases[id].status).toBe("held");
  });

  it("80 packs (£3,840) stays inside the standing envelope", () => {
    const r = runCatalogue(initialDomainState(), 80);
    expect(Object.values(r.state.pos)[0].total).toBe(384_000);
  });

  it("a requester cannot decide it", () => {
    const task = Object.values(state.tasks)[0];
    const r = handleCommand(state, { type: "approval.decide", actor: REQUESTER, taskId: task.id, expectedRevision: 1, outcome: "approved", idempotencyKey: "x" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("role-mismatch");
  });

  it("Budget Holder approval releases exactly one PO and the case is no longer fully touchless", () => {
    const task = Object.values(state.tasks)[0];
    const decided = handleCommand(state, { type: "approval.decide", actor: budgetHolder, taskId: task.id, expectedRevision: 1, outcome: "approved", idempotencyKey: idemKey(id, "F1", "decide", 1) });
    expect(decided.ok).toBe(true);
    const key = idemKey(id, "F1", "po", 1);
    const once = handleCommand(decided.state, { type: "po.release", actor: STANDING_MANDATE, caseId: id, expectedRevision: 1, idempotencyKey: key });
    const twice = handleCommand(once.state, { type: "po.release", actor: STANDING_MANDATE, caseId: id, expectedRevision: 1, idempotencyKey: key });
    expect(once.ok && twice.ok).toBe(true);
    expect(twice.ok && twice.duplicate).toBe(true);
    expect(Object.keys(twice.state.pos)).toHaveLength(1);
    expect(Object.values(twice.state.pos)[0].total).toBe(576_000);
    expect(isFullyTouchless(twice.state, id)).toBe(false);
    expect(isNoBuyerTouch(twice.state, id)).toBe(true);
  });

  it("an undecided task is reassigned at 48h and escalated to Category Lead at 72h", () => {
    const t = Object.values(state.tasks)[0];
    const at48 = tick(state, 48 * 60, "a48");
    expect(at48.tasks[t.id].reassignedAt).toBeDefined();
    expect(at48.tasks[t.id].escalatedAt).toBeUndefined();
    const at72 = tick(at48, 24 * 60, "a72");
    expect(at72.tasks[t.id]).toMatchObject({ escalatedTo: "category-lead" });
    expect(Object.values(at72.followUps).map((f) => f.kind)).toEqual(["task-reassigned", "task-escalated"]);
  });

  it("revising the quantity supersedes the open task", () => {
    const t = Object.values(state.tasks)[0];
    const rev = handleCommand(state, { type: "request.revise", actor: REQUESTER, caseId: id, expectedRevision: 1, lines: catalogueFixture(10).lines, idempotencyKey: "rv" }).state;
    expect(rev.tasks[t.id].supersededAt).toBeDefined();
    const late = handleCommand(rev, { type: "approval.decide", actor: budgetHolder, taskId: t.id, expectedRevision: 2, outcome: "approved", idempotencyKey: "late" });
    expect(late.ok).toBe(false);
  });
});

describe("revisions and idempotency", () => {
  it("rejects a command against a stale revision", () => {
    const sub = handleCommand(initialDomainState(), { type: "request.submit", actor: REQUESTER, draft: catalogueFixture(10), idempotencyKey: "s1" });
    const id = sub.ok ? sub.caseId! : "";
    const rev = handleCommand(sub.state, { type: "request.revise", actor: REQUESTER, caseId: id, expectedRevision: 1, lines: catalogueFixture(12).lines, idempotencyKey: "r1" });
    expect(rev.ok).toBe(true);
    const stale = handleCommand(rev.state, { type: "request.approve", actor: STANDING_MANDATE, caseId: id, expectedRevision: 1, idempotencyKey: "a1" });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error).toBe("stale-revision");
  });

  it("same key creates one case; a new key creates a second, flagged as a possible duplicate", () => {
    let s = initialDomainState();
    s = handleCommand(s, { type: "request.submit", actor: REQUESTER, draft: catalogueFixture(10), idempotencyKey: "k1" }).state;
    s = handleCommand(s, { type: "request.submit", actor: REQUESTER, draft: catalogueFixture(10), idempotencyKey: "k1" }).state;
    expect(Object.keys(s.cases)).toEqual(["TSM-2026-104701"]);
    s = handleCommand(s, { type: "request.submit", actor: REQUESTER, draft: catalogueFixture(10), idempotencyKey: "k2" }).state;
    expect(Object.keys(s.cases)).toEqual(["TSM-2026-104701", "TSM-2026-104702"]);
    expect(s.cases["TSM-2026-104702"]).toMatchObject({ requestId: "REQ-118802", possibleDuplicateOf: "TSM-2026-104701" });
    expect(s.audit.some((e) => e.type === "duplicate.flagged")).toBe(true);
  });

  it("reopening the same captured message returns the existing case", () => {
    let s = initialDomainState();
    const draft = { ...catalogueFixture(10), captureId: "CAP-EMAIL-01" };
    s = handleCommand(s, { type: "request.submit", actor: REQUESTER, draft, idempotencyKey: "c1" }).state;
    const again = handleCommand(s, { type: "request.submit", actor: REQUESTER, draft, idempotencyKey: "c2" });
    expect(again.ok && again.duplicate && again.caseId).toBe("TSM-2026-104701");
    expect(Object.keys(again.state.cases)).toHaveLength(1);
  });
});

describe("ERP connector failure", () => {
  it("retries three times on the same key, parks the case and opens a 4h task", () => {
    let s = initialDomainState();
    s.failures.erpPo = 3;
    const id = "TSM-2026-104701";
    s = handleCommand(s, { type: "request.submit", actor: REQUESTER, draft: catalogueFixture(10), idempotencyKey: "s" }).state;
    s = handleCommand(s, { type: "request.approve", actor: STANDING_MANDATE, caseId: id, expectedRevision: 1, idempotencyKey: "a" }).state;
    const failed = handleCommand(s, { type: "po.release", actor: STANDING_MANDATE, caseId: id, expectedRevision: 1, idempotencyKey: "p" });
    expect(failed.ok).toBe(false);
    expect(Object.keys(failed.state.pos)).toHaveLength(0);
    const exc = Object.values(failed.state.exceptions)[0];
    expect(Date.parse(exc.dueAt) - Date.parse(exc.openedAt)).toBe(4 * 3600_000);
    const retry = handleCommand(failed.state, { type: "po.release", actor: STANDING_MANDATE, caseId: id, expectedRevision: 1, idempotencyKey: "p" });
    expect(retry.ok).toBe(true);
    expect(Object.keys(retry.state.pos)).toHaveLength(1);
  });
});
