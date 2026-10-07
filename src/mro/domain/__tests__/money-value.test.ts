import { describe, expect, it } from "vitest";
import { gbp, gbpCompact, lineTotal, pence, roundPence } from "@/mro/domain/money";
import { isFinanceValidated, validatedTotal } from "@/mro/domain/value";
import { initialDomainState } from "@/mro/domain/reducer";
import type { ValueRecord } from "@/mro/domain/types";

describe("pence arithmetic", () => {
  it("stores pounds as integer pence without float drift", () => {
    expect(pence(0.1 + 0.2)).toBe(30);
    expect(pence(48)).toBe(4_800);
    expect(roundPence(1_000 * 0.125)).toBe(125);
    expect(lineTotal(1_200, 40)).toBe(48_000);
  });

  it("formats one way in every UI language", () => {
    expect(gbp(48_000)).toBe("£480.00");
    expect(gbp(384_000)).toBe("£3,840.00");
    expect(gbpCompact(384_000)).toBe("£3.8K");
  });
});

describe("validated savings need invoice evidence and a Finance signature", () => {
  const base: ValueRecord = {
    id: "VAL-1",
    caseId: "CASE-ST02-001",
    awardKey: "AWD-1",
    category: "sourcing-saving",
    baseline: pence(50_000),
    expected: pence(4_000),
    evidenced: pence(4_000),
    invoiceEvidenceRefs: ["INV-1"],
    state: "validated",
  };

  it("an unsigned record marked validated is excluded", () => {
    const s = initialDomainState();
    s.valueRecords[base.id] = base;
    expect(isFinanceValidated(base)).toBe(false);
    expect(validatedTotal(s, "sourcing-saving")).toBe(0);
  });

  it("a value-analyst signature does not count; Finance BP does", () => {
    const s = initialDomainState();
    s.valueRecords.a = { ...base, id: "a", financeSignedBy: { kind: "human", role: "value-analyst", name: "VA" } };
    s.valueRecords.b = { ...base, id: "b", financeSignedBy: { kind: "human", role: "finance-bp", name: "FBP" } };
    expect(validatedTotal(s, "sourcing-saving")).toBe(pence(4_000));
  });
});
