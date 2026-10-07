import { describe, expect, it } from "vitest";
import { doaRoleFor, evaluateGate, scoreConfidence, type GateInput } from "@/mro/domain/evaluateGate";
import { DEMO_POLICY } from "@/mro/data/policies";
import { pence } from "@/mro/domain/money";
import type { ConfidenceSignal } from "@/mro/domain/types";

const sig = (key: string, score: number | null, weight: number, inapplicable?: string): ConfidenceSignal => ({ key, score, weight, evidence: key, inapplicable });
const uniform = (v: number): ConfidenceSignal[] => [sig("a", v, 0.25), sig("b", v, 0.3), sig("c", v, 0.25), sig("d", v, 0.2)];
const perfect = uniform(1);
const activeSupplier = { status: "active" as const, cleared: true, sanctionsOpen: false, bankVerified: true };

function input(over: Partial<GateInput> = {}): GateInput {
  return {
    action: "request.approve",
    policy: DEMO_POLICY,
    actorKind: "policy",
    amount: pence(480),
    site: "UK-HAL-01",
    allowedSites: ["UK-HAL-01"],
    caseRevision: 1,
    request: {},
    standing: { budgetApproved: true, standingPolicy: true, category: "ppe-consumables", liveAgreement: true },
    approvals: [],
    supplier: activeSupplier,
    evidenceRefs: ["REQ-118801"],
    confidence: { signals: perfect, pattern: "catalogue-call-off" },
    ...over,
  };
}

describe("gate order", () => {
  it("reports scope before any control", () => {
    const r = evaluateGate(input({ amount: pence(250_000), supplier: { ...activeSupplier, cleared: false } }));
    expect(r.failedStage).toBe("scope");
    expect(r.band).toBe("hard-constraint");
  });

  it("reports a failed control before authority", () => {
    const r = evaluateGate(input({ action: "po.release", amount: pence(5_000), request: {} }));
    expect(r.failedStage).toBe("controls");
    expect(r.reason).toMatch(/^HC01/);
  });

  it("HC02 names the DoA role when the standing envelope is exceeded", () => {
    const r = evaluateGate(input({ amount: pence(5_760), approvals: [] }));
    expect(r.failedStage).toBe("controls");
    expect(r.controls.find((c) => c.id === "HC02")?.result).toBe("fail");
    expect(r.requiredRole).toBe("budget-holder");
    expect(r.authority.requiredRole).toBe("budget-holder");
    expect(r.band).toBe("hard-constraint");
  });

  it("passes the catalogue case touchless", () => {
    const r = evaluateGate(input());
    expect(r.allowed).toBe(true);
    expect(r.lane).toBe("touchless");
    expect(r.band).toBe("touchless");
    expect(r.authority.standing).toBe(true);
  });
});

describe("DoA boundaries (DOA-2026.2)", () => {
  const cases: [number, string | undefined][] = [
    [4_999.99, "budget-holder"],
    [5_000, "budget-holder"],
    [30_000, "budget-holder"],
    [30_000.01, "category-lead"],
    [100_000, "category-lead"],
    [100_000.01, "procurement-head"],
    [249_999.99, "procurement-head"],
    [250_000, undefined],
  ];
  it.each(cases)("£%s → %s", (pounds, role) => {
    expect(doaRoleFor(DEMO_POLICY, pence(pounds))).toBe(role);
  });

  it("£4,999.99 is standing-eligible; exactly £5,000 is not", () => {
    expect(evaluateGate(input({ amount: pence(4_999.99) })).authority.standing).toBe(true);
    const at = evaluateGate(input({ amount: pence(5_000) }));
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
    const amount = pence(5_760);
    const r = evaluateGate(input({ amount, caseRevision: 2, approvals: [{ role: "budget-holder", revision: 1, amount, outcome: "approved" }] }));
    expect(r.allowed).toBe(false);
  });
});

describe("confidence never repairs a hard constraint", () => {
  it("sanctions hit blocks activation at perfect confidence", () => {
    const r = evaluateGate(input({ action: "supplier.activate", supplier: { ...activeSupplier, sanctionsOpen: true } }));
    expect(r.confidence.score).toBe(1);
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/^HC06/);
    expect(r.band).toBe("hard-constraint");
  });

  it("unsigned savings cannot validate at perfect confidence", () => {
    const r = evaluateGate(input({ action: "value.validate", value: { invoiceEvidence: true } }));
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/^HC08/);
  });

  it("Red clause without Legal blocks contract signature", () => {
    const r = evaluateGate(input({ action: "contract.sign", clauses: [{ id: "9.2", band: "red", inLibrary: true, decidedBy: "delegated-approver" }] }));
    expect(r.requiredRole).toBe("legal");
  });
});

describe("confidence signals (CONF-v1.0)", () => {
  it("scores the weighted sum to two decimals, as the agents report it", () => {
    /* UC9 Bid Scoring: .9×.3 + .82×.3 + .88×.25 + 1×.15 = 0.886 → 0.89 */
    const c = scoreConfidence(DEMO_POLICY, { signals: [sig("comparability", 0.9, 0.3), sig("benchmark_depth", 0.82, 0.3), sig("anomaly_confidence", 0.88, 0.25), sig("supplier_status", 1, 0.15)], pattern: "quote" });
    expect(c.score).toBe(0.89);
    expect(evaluateGate(input({ confidence: { signals: c.components.map((x) => sig(x.key, x.score, x.weight)), pattern: "quote" } })).lane).toBe("tcs-review");
  });

  it("blocks when a signal is missing and no rule covers it", () => {
    const r = evaluateGate(input({ confidence: { signals: [...perfect.slice(0, 3), sig("d", null, 0.2)], pattern: "catalogue-call-off" } }));
    expect(r.allowed).toBe(false);
    expect(r.failedStage).toBe("confidence");
  });

  it("redistributes weight when a signal is declared inapplicable", () => {
    const c = scoreConfidence(DEMO_POLICY, { signals: [sig("a", 1, 0.25), sig("b", 0.8, 0.3), sig("c", 1, 0.25), sig("d", null, 0.2, "No prior instances")], pattern: "new-scope" });
    expect(c.blocks).toEqual([]);
    const applied = c.components.filter((x) => x.score !== null).reduce((a, x) => a + x.weight, 0);
    expect(applied).toBeCloseTo(1, 2);
    /* 0.8 at weight .30/.80 → below 1, never padded to perfect. */
    expect(c.score).toBe(0.93);
  });

  it("blocks when declared weights do not sum to 1", () => {
    const c = scoreConfidence(DEMO_POLICY, { signals: [sig("a", 1, 0.5), sig("b", 1, 0.3)], pattern: "x" });
    expect(c.blocks[0]).toMatch(/sum to 0.80/);
  });

  it("missing mandatory data blocks regardless of score", () => {
    const r = evaluateGate(input({ confidence: { signals: perfect, pattern: "catalogue-call-off", missingMandatory: ["cost centre"] } }));
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/cost centre/);
  });

  it("lane thresholds: 0.90 touchless, 0.70 review, below client decision", () => {
    const at = (v: number) => evaluateGate(input({ confidence: { signals: uniform(v), pattern: "catalogue-call-off" } })).lane;
    expect(at(0.9)).toBe("touchless");
    expect(at(0.89)).toBe("tcs-review");
    expect(at(0.7)).toBe("tcs-review");
    expect(at(0.69)).toBe("client-decision");
  });
});
