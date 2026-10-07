import { describe, expect, it } from "vitest";
import { handleCommand, initialDomainState } from "@/mro/domain/reducer";
import type { Command, CommandResult } from "@/mro/domain/commands";
import type { DomainState } from "@/mro/domain/types";
import { draftFromParse, parseIntake } from "@/mro/domain/intakeParser";
import { decideTask, submitRequest } from "@/mro/services/caseAutomation";
import { CLOCK_START } from "@/mro/domain/clock";

function harness() {
  let state: DomainState = initialDomainState();
  const dispatch = (cmd: Command): CommandResult => {
    const r = handleCommand(state, cmd);
    state = r.state;
    return r;
  };
  return { dispatch, get: () => state };
}

function ok(r: CommandResult) {
  if (!r.ok) throw new Error(r.message);
  return r;
}

const TEN = "Need 10 packs of 3M 6055 A2 filters for Halewood stores by 12 Oct.";
const HUNDRED_TWENTY = "Need 120 packs of 3M 6055 A2 filters for Halewood stores by 12 Oct.";

describe("intake parser", () => {
  it("recognises the catalogue item, quantity, site and date", () => {
    const p = parseIntake(TEN, CLOCK_START);
    expect(p.missing).toEqual([]);
    expect(p.material?.code).toBe("MAT-PPE-3M-6055");
    expect(p.quantity).toEqual({ value: 10, uom: "PACK" });
    expect(p.site).toBe("UK-HAL-01");
    expect(p.neededBy).toBe("2026-10-12T16:00:00.000Z");
  });

  it("refuses to guess a SKU from vague text", () => {
    const p = parseIntake("need some stuff for line 3", CLOCK_START);
    expect(p.missing).toEqual(["material", "quantity", "site"]);
    expect(draftFromParse("need some stuff for line 3", p)).toBeUndefined();
  });
});

describe("catalogue path from New Request", () => {
  it("10 packs runs touchless and dispatches the PO under policy", () => {
    const h = harness();
    const r = ok(submitRequest(h.dispatch, draftFromParse(TEN, parseIntake(TEN, CLOCK_START))!));
    const s = h.get();
    const po = Object.values(s.pos).find((p) => p.caseId === r.caseId)!;
    expect(po.total).toBe(48_000);
    expect(po.dispatch.state).toBe("dispatched");
    expect(po.approvedBy.kind).toBe("policy");
  });

  it("120 packs holds for a Budget Holder, then releases on approval", () => {
    const h = harness();
    const r = ok(submitRequest(h.dispatch, draftFromParse(HUNDRED_TWENTY, parseIntake(HUNDRED_TWENTY, CLOCK_START))!));
    let s = h.get();
    expect(Object.values(s.pos).some((p) => p.caseId === r.caseId)).toBe(false);
    const task = Object.values(s.tasks).find((t) => t.caseId === r.caseId)!;
    expect(task.role).toBe("budget-holder");
    expect(task.amount).toBe(576_000);

    const wrong = decideTask(h.dispatch, s, task.id, "approved", "buy-desk-analyst", "Analyst");
    expect(wrong.ok).toBe(false);

    decideTask(h.dispatch, h.get(), task.id, "approved", "budget-holder", "Budget holder");
    s = h.get();
    const po = Object.values(s.pos).find((p) => p.caseId === r.caseId)!;
    expect(po.dispatch.state).toBe("dispatched");
  });

  it("submitting the same request twice gives two cases and flags the duplicate", () => {
    const h = harness();
    const draft = draftFromParse(TEN, parseIntake(TEN, CLOCK_START))!;
    const a = ok(submitRequest(h.dispatch, draft));
    const b = ok(submitRequest(h.dispatch, draft));
    expect(a.caseId).not.toBe(b.caseId);
    expect(h.get().cases[b.caseId!].possibleDuplicateOf).toBe(a.caseId);
  });
});
