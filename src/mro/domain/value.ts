/**
 * Value measures (PRD §16). A saving is "validated" only when invoice evidence
 * exists and Finance BP has signed it (HC08). A record that merely claims the
 * validated state without both is excluded from every validated total.
 */

import type { DomainState, Pence, ValueCategory, ValueRecord } from "@/mro/domain/types";
import { sumPence } from "@/mro/domain/money";

export function isFinanceValidated(r: ValueRecord): boolean {
  return (
    r.state === "validated" &&
    r.invoiceEvidenceRefs.length > 0 &&
    r.financeSignedBy?.kind === "human" &&
    r.financeSignedBy.role === "finance-bp" &&
    r.evidenced !== undefined
  );
}

export function validatedTotal(state: DomainState, category: ValueCategory): Pence {
  return sumPence(
    Object.values(state.valueRecords)
      .filter((r) => r.category === category && isFinanceValidated(r))
      .map((r) => r.evidenced ?? 0),
  );
}

export function expectedTotal(state: DomainState, category: ValueCategory): Pence {
  return sumPence(
    Object.values(state.valueRecords)
      .filter((r) => r.category === category && r.state !== "not-claimed" && r.state !== "lapsed")
      .map((r) => r.expected),
  );
}
