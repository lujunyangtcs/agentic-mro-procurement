import { describe, expect, it } from "vitest";
import { seedDomain, submitAndStart } from "@/mro/data/seedDomain";
import { dispatchCommand, runAgentsUntilStop } from "@/mro/domain/engine";
import { stepDef } from "@/mro/domain/flows";
import { ARRIVALS } from "@/mro/data/storyFixtures";
import type { DomainState, Role } from "@/mro/domain/types";

function drive(s0: DomainState, caseId: string, pick: (stepId: string) => string | undefined = () => undefined) {
  let s = s0;
  for (let i = 0; i < 60; i++) {
    const runs = Object.values(s.runs).filter((r) => r.caseId === caseId && !r.closedAt);
    if (runs.length === 0) break;
    let moved = false;
    for (const run of runs) {
      const before = s;
      s = runAgentsUntilStop(s, run.id, "t");
      const r = s.runs[run.id];
      if (r.current && r.steps[r.current].status === "waiting") {
        const def = stepDef(r.flow, r.current)!;
        const opt = pick(r.current) ?? def.options!.find((o) => o.tone !== "reject" && !o.unavailable?.({ s, run: r, caseId, c: s.cases[caseId] }))!.id;
        const res = dispatchCommand(s, { type: "step.decide", actor: { kind: "human", role: def.role as Role, name: "Test" }, runId: r.id, stepId: r.current, optionId: opt, idempotencyKey: `t:${r.id}:${r.current}:${i}` });
        if (!res.ok) throw new Error(`${r.id}/${r.current}: ${res.message}`);
        s = res.state;
      }
      if (s !== before) moved = true;
    }
    if (!moved) break;
  }
  return s;
}

describe("workflow engine", () => {
  it("seeds a believable day", () => {
    const s = seedDomain();
    const cases = Object.values(s.cases);
    expect(cases.length).toBe(5);
    expect(cases.filter((c) => c.status === "closed").length).toBeGreaterThanOrEqual(2);
    expect(Object.values(s.tasks).some((t) => !t.outcome)).toBe(true);
    expect(Object.values(s.exceptions).length + Object.values(s.followUps).length).toBeGreaterThan(0);
  });

  for (const a of ARRIVALS.filter((x) => x.draft && x.flow)) {
    it(`completes ${a.id} (${a.flow})`, () => {
      let s = seedDomain();
      const r = submitAndStart(s, { ...a.draft!(), captureId: a.id }, a.flow!, `test:${a.id}`);
      expect(r.caseId).toBeTruthy();
      s = drive(r.state, r.caseId!);
      const runs = Object.values(s.runs).filter((x) => x.caseId === r.caseId);
      for (const run of runs) {
        const pending = run.order.filter((id) => !["done", "skipped"].includes(run.steps[id].status));
        expect({ run: run.id, pending, outcome: run.outcome, current: run.current, reason: run.current && run.steps[run.current].blockedReason }).toEqual({ run: run.id, pending: [], outcome: "completed", current: undefined, reason: undefined });
      }
      expect(s.cases[r.caseId!].status).toBe("closed");
    });
  }
});

describe("branches", () => {
  it("ST03 onboarding branch completes", () => {
    const a = ARRIVALS.find((x) => x.flow === "ST03")!;
    const r = submitAndStart(seedDomain(), { ...a.draft!(), captureId: a.id }, "ST03", "b3");
    const s = drive(r.state, r.caseId!, (id) => (id === "route" ? "onboard" : undefined));
    const run = s.runs[r.caseId!];
    expect(run.outcome).toBe("completed");
    expect(run.order.filter((id) => run.steps[id].status === "skipped")).toEqual(["invoice-review", "finance"]);
    expect(s.suppliers["SUP-AP-010"]?.status).toBe("active");
  });
  it("ST02 spawns ST04 and value is not double counted", () => {
    const a = ARRIVALS.find((x) => x.flow === "ST02")!;
    const r = submitAndStart(seedDomain(), { ...a.draft!(), captureId: a.id }, "ST02", "b2");
    const s = drive(r.state, r.caseId!);
    const runs = Object.values(s.runs).filter((x) => x.caseId === r.caseId);
    expect(runs.map((x) => x.flow).sort()).toEqual(["ST02", "ST04"]);
    const vals = Object.values(s.valueRecords).filter((v) => v.caseId === r.caseId && v.category === "sourcing-saving");
    expect(vals.length).toBe(1);
    expect(vals[0].state).toBe("validated");
  });
});
