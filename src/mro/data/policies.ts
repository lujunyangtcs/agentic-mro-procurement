/**
 * POL-DEMO-1 — illustrative demo settings (PRD §4, §5). These are build
 * parameters, not a statement of any client's actual delegation.
 */

import type { Policy } from "@/mro/domain/types";
import { pence } from "@/mro/domain/money";

export const POL_DEMO_1: Policy = {
  version: "POL-DEMO-1",
  effectiveFrom: "2026-10-01T00:00:00.000Z",
  autoApproveLimit: pence(3_000),
  doa: [
    { role: "budget-holder", maxInclusive: pence(30_000) },
    { role: "category-lead", maxInclusive: pence(100_000) },
    { role: "procurement-head", maxInclusive: pence(249_999.99) },
  ],
  strategicHandoffFrom: pence(250_000),
  lanes: { touchless: 0.9, tcsReview: 0.7 },
  weights: {
    version: "W-DEMO-1",
    values: {
      completeness: 0.2,
      classification: 0.15,
      matchStrength: 0.25,
      priceBenchmark: 0.15,
      supplierStatus: 0.15,
      patternHistory: 0.1,
    },
  },
  patternRules: {
    "catalogue-call-off": { inapplicable: {} },
    /* A first-time service scope has no history to learn from; its weight is
       spread over the other five dimensions rather than scored as perfect. */
    "new-service-scope": { inapplicable: { patternHistory: "No prior instances of this scope" } },
  },
  allowedStandingCategories: ["ppe-consumables", "bearings"],
};

export const POLICIES: Record<string, Policy> = { [POL_DEMO_1.version]: POL_DEMO_1 };
