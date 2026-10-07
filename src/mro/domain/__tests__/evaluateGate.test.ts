import { describe, expect, it } from "vitest";
import { doaRoleFor, evaluateGate, scoreConfidence, type GateInput } from "@/mro/domain/evaluateGate";
import { POL_DEMO_1 } from "@/mro/data/policies";
import { pence } from "@/mro/domain/money";

const perfect = { completeness: 1, classification: 1, matchStrength: 1, priceBenchmark: 1, supplierStatus: 1, patternHistory: 1 };
const activeSupplier = { status: "active" as const, cleared: true, sanctionsOpen: false, bankVerified: true };

function input(over: Partial<GateInput> = {}): GateInput {
  return {
    action: "request.approve",
    policy: POL_DEMO_1,
    actorKind: "policy",
    amount: pence(480),
    site: "UK-HAL-01",
    allowedSites: ["UK-HAL-01"],
    caseRevision: 1,
    request: {},
    standing: { budgetApproved: true, standingPolicy: true, category: "ppe-consumables", liveAgreement: true },
    approvals: [],
    supplier: activeSupplier,
    evidenceRefs: ["PR-AP-1000"],
    confidence: { components: perfect, pattern: "catalogue-call-off" },
    ...over,
  };
}

describe("gate order", () => {
  it("reports scope before any control", () => {
    const r = evaluateGate(input({ amount: pence(250_000), supplier: { ...activeSupplier, cleared: false } }));
    expect(r.failedStage).toBe("scope");
  });

  it("reports a failed control before authority", () => {
    const r = evaluateGate(input({ action: "po.release", amount: pence(5_000), request: {} }));
    expect(r.failedStage).toBe("controls");
    expect(r.reason).toMatch(/^HC01/);
  });

  it("HC02 names the DoA role when the standing envelope is exceeded", () => {
    const r = evaluateGate(input({ amount: pence(3_840), approvals: [] }));
    expect(r.failedStage).toBe("controls");
    expect(r.controls.find((c) => c.id === "HC02")?.result).toBe("fail");
    expect(r.requiredRole).toBe("budget-holder");
    expect(r.authority.requiredRole).toBe("budget-holder");
  });

  it("passes the catalogue case touchless", () => {
    const r = evaluateGate(input());
    expect(r.allowed).toBe(true);
    expect(r.lane).toBe("touchless");
    expect(r.authority.standing).toBe(true);
  });
});

describe("DoA boundaries", () => {
  const cases: [number, string | undefined][] = [
    [2_999.99, "budget-holder"],
    [3_000, "budget-holder"],
    [30_000, "budget-holder"],
    [30_000.01, "category-lead"],
    [100_000, "category-lead"],
    [100_000.01, "procurement-head"],
    [249_999.99, "procurement-head"],
    [250_000, undefined],
  ];
  it.each(cases)("£%s → %s", (pounds, role) => {
    expect(doaRoleFor(POL_DEMO_1, pence(pounds))).toBe(role);
  });

  it("£2,999.99 is standing-eligible; exactly £3,000 is not", () => {
    expect(evaluateGate(input({ amount: pence(2_999.99) })).authority.standing).toBe(true);
    const at = evaluateGate(input({ amount: pence(3_000) }));
    expect(at.allowed).toBe(false);
    expect(at.requiredRole).toBe("budget-holder");
  });

  it("exactly £250,000 leaves the desk", () => {
    const r = evaluateGate(input({ amount: pence(250_000) }));
    expect(r.failedStage).toBe("scope");
    expect(r.allowed).toBe(false);
  });

  it("a Budget Holder approval does not cover £30,000.01", () => {
    const amount = pence(30_000.01);
    const r = evaluateGate(input({ amount, approvals: [{ role: "budget-holder", revision: 1, amount, outcome: "approved" }] }));
    expect(r.allowed).toBe(false);
    expect(r.requiredRole).toBe("category-lead");
  });

  it("an approval on an older revision does not count", () => {
    const amount = pence(3_840);
    const r = evaluateGate(input({ amount, caseRevision: 2, approvals: [{ role: "budget-holder", revision: 1, amount, outcome: "approved" }] }));
    expect(r.allowed).toBe(false);
  });
});

describe("confidence never repairs a hard constraint", () => {
  it("sanctions hit blocks activation at perfect confidence", () => {
    const r = evaluateGate(input({ action: "supplier.activate", supplier: { ...activeSupplier, sanctionsOpen: true }, confidence: { components: perfect, pattern: "catalogue-call-off" } }));
    expect(r.confidence.score).toBe(1);
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/^HC06/);
  });

  it("unsigned savings cannot validate at perfect confidence", () => {
    const r = evaluateGate(input({ action: "value.validate", value: { invoiceEvidence: true } }));
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/^HC08/);
  });

  it("Red clause without Legal blocks contract signature", () => {
    const r = evaluateGate(input({ action: "contract.sign", clauses: [{ id: "liability", band: "red", inLibrary: true, decidedBy: "delegated-approver" }] }));
    expect(r.requiredRole).toBe("legal");
  });
});

describe("missing confidence dimensions", () => {
  it("blocks when a dimension is missing and no pattern rule covers it", () => {
    const { patternHistory: _omit, ...rest } = perfect;
    void _omit;
    const r = evaluateGate(input({ confidence: { components: rest, pattern: "catalogue-call-off" } }));
    expect(r.allowed).toBe(false);
    expect(r.failedStage).toBe("confidence");
  });

  it("redistributes weight when the pattern rule declares it inapplicable", () => {
    const { patternHistory: _omit, ...rest } = perfect;
    void _omit;
    const c = scoreConfidence(POL_DEMO_1, { components: { ...rest, matchStrength: 0.8 }, pattern: "new-service-scope" });
    expect(c.blocks).toEqual([]);
    const applied = c.components.filter((x) => x.score !== null).reduce((a, x) => a + x.weight, 0);
    expect(applied).toBeCloseTo(1, 2);
    /* 0.8 at weight .25/.90 → score below 1, never padded to perfect. */
    expect(c.score).toBeCloseTo(1 - 0.2 * (0.25 / 0.9), 3);
  });

  it("missing mandatory data blocks regardless of score", () => {
    const r = evaluateGate(input({ confidence: { components: perfect, pattern: "catalogue-call-off", missingMandatory: ["cost centre"] } }));
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/cost centre/);
  });

  it("lane thresholds: 0.90 touchless, 0.70 review, below client decision", () => {
    const at = (v: number) => evaluateGate(input({ confidence: { components: { completeness: v, classification: v, matchStrength: v, priceBenchmark: v, supplierStatus: v, patternHistory: v }, pattern: "catalogue-call-off" } })).lane;
    expect(at(0.9)).toBe("touchless");
    expect(at(0.89)).toBe("tcs-review");
    expect(at(0.7)).toBe("tcs-review");
    expect(at(0.69)).toBe("client-decision");
  });
});
