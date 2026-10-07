import { describe, expect, it } from "vitest";
import { handleCommand, initialDomainState } from "@/mro/domain/reducer";
import { idemKey } from "@/mro/domain/commands";
import { isFullyTouchless, isNoBuyerTouch, touchMetrics } from "@/mro/domain/selectors";
import { runCatalogue, seedDomain, REQUESTER, STANDING_MANDATE } from "@/mro/data/seedDomain";
import { catalogueFixture } from "@/mro/data/storyFixtures";
import { londonDateTime } from "@/mro/domain/clock";
import type { Actor } from "@/mro/domain/types";

const budgetHolder: Actor = { kind: "human", role: "budget-holder", name: "Halewood budget holder" };

describe("catalogue fixture (touchless path)", () => {
  const s = seedDomain();
  const c = s.cases["CASE-CAT-001"];
  const po = Object.values(s.pos)[0];

  it("creates CASE-CAT-001 / PR-AP-1000 with a £480 PO", () => {
    expect(c.requestId).toBe("PR-AP-1000");
    expect(c.status).toBe("po-dispatched");
    expect(po.total).toBe(48_000);
    expect(po.lines[0]).toMatchObject({ quantity: 40, uom: "PAIR", entered: { quantity: 10, uom: "PACK" } });
  });

  it("records the approval as policy, never a person", () => {
    const approved = s.audit.find((e) => e.type === "request.approved")!;
    expect(approved.actor).toEqual(STANDING_MANDATE);
    expect(approved.ruleVersion).toBe("POL-DEMO-1");
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
});

describe("80 packs crosses the standing ceiling", () => {
  const { state, caseId } = runCatalogue(initialDomainState(), 80);
  const id = caseId!;

  it("holds with a Budget Holder task and no PO", () => {
    expect(Object.keys(state.pos)).toHaveLength(0);
    const task = Object.values(state.tasks)[0];
    expect(task).toMatchObject({ role: "budget-holder", amount: 384_000, caseRevision: 1 });
    expect(state.cases[id].status).toBe("held");
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
    expect(Object.values(twice.state.pos)[0].total).toBe(384_000);
    expect(isFullyTouchless(twice.state, id)).toBe(false);
    expect(isNoBuyerTouch(twice.state, id)).toBe(true);
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

  it("double-submitting the same key creates one case; a new key creates a second with the next IDs", () => {
    let s = initialDomainState();
    s = handleCommand(s, { type: "request.submit", actor: REQUESTER, draft: catalogueFixture(10), idempotencyKey: "k1" }).state;
    s = handleCommand(s, { type: "request.submit", actor: REQUESTER, draft: catalogueFixture(10), idempotencyKey: "k1" }).state;
    expect(Object.keys(s.cases)).toEqual(["CASE-CAT-001"]);
    s = handleCommand(s, { type: "request.submit", actor: REQUESTER, draft: catalogueFixture(10), idempotencyKey: "k2" }).state;
    expect(Object.keys(s.cases)).toEqual(["CASE-CAT-001", "CASE-CAT-002"]);
    expect(s.cases["CASE-CAT-002"].requestId).toBe("PR-AP-1100");
  });

  it("reopening the same captured message returns the existing case", () => {
    let s = initialDomainState();
    const draft = { ...catalogueFixture(10), captureId: "CAP-EMAIL-01" };
    s = handleCommand(s, { type: "request.submit", actor: REQUESTER, draft, idempotencyKey: "c1" }).state;
    const again = handleCommand(s, { type: "request.submit", actor: REQUESTER, draft, idempotencyKey: "c2" });
    expect(again.ok && again.duplicate && again.caseId).toBe("CASE-CAT-001");
    expect(Object.keys(again.state.cases)).toHaveLength(1);
  });
});

describe("ERP connector failure", () => {
  it("retries three times on the same key, parks the case and opens a 4h task", () => {
    let s = initialDomainState();
    s.failures.erpPo = 3;
    const id = "CASE-CAT-001";
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
