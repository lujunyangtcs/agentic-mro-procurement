/**
 * The I/O names people in prose ("Buy Desk Analyst (TCS)", "Category Lead –
 * Manufacturing Services"). This maps each to the domain role that may decide
 * its task, so "Review as" governs story tasks and catalogue tasks alike.
 */

import type { Role } from "@/mro/domain/types";

const RULES: [RegExp, Role][] = [
  [/budget holder/i, "budget-holder"],
  [/category lead/i, "category-lead"],
  [/buy desk lead/i, "buy-desk-lead"],
  [/buy desk/i, "buy-desk-analyst"],
  [/contract analyst/i, "contract-analyst"],
  [/delegated approver/i, "delegated-approver"],
  [/legal/i, "legal"],
  [/risk analyst/i, "risk-analyst"],
  [/risk committee/i, "risk-committee"],
  [/finance controller/i, "finance-controller"],
  [/finance/i, "finance-bp"],
  [/technical owner/i, "technical-owner"],
  [/application owner/i, "application-owner"],
  [/value council/i, "value-council"],
  [/requester/i, "requester"],
];

export function personaRole(persona: string): Role {
  return RULES.find(([re]) => re.test(persona))?.[1] ?? "buy-desk-analyst";
}

/** Roles the presenter can review as, in the order they usually appear in a demo. */
export const REVIEW_ROLES: Role[] = [
  "requester",
  "buy-desk-analyst",
  "buy-desk-lead",
  "budget-holder",
  "category-lead",
  "contract-analyst",
  "delegated-approver",
  "legal",
  "risk-analyst",
  "finance-bp",
  "technical-owner",
  "procurement-head",
  "value-council",
];
