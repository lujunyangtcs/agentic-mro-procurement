/**
 * Demo policy POL-DEMO-1 (PRD §5, §25.3). Illustrative build settings, not a
 * statement of any client's actual delegation.
 *
 * - Standing approval below £3,000 for allowed categories on a live agreement.
 * - Budget Holder up to £30,000; Category Lead up to £100,000; Procurement
 *   Head below £250,000; £250,000 or more leaves the desk.
 * - Lanes: touchless ≥0.90, TCS review ≥0.70, otherwise client decision.
 */

import type { Policy } from "@/mro/domain/types";
import { pence } from "@/mro/domain/money";

export const DEMO_POLICY: Policy = {
  version: "POL-DEMO-1",
  channelRules: "CHR-DEMO-1",
  confidencePolicy: "W-DEMO-1",
  effectiveFrom: "2026-10-01T00:00:00.000Z",
  autoApproveLimit: pence(3_000),
  doa: [
    { role: "budget-holder", maxInclusive: pence(30_000) },
    { role: "category-lead", maxInclusive: pence(100_000) },
    { role: "procurement-head", maxInclusive: pence(249_999.99) },
  ],
  strategicHandoffFrom: pence(250_000),
  lanes: { touchless: 0.9, tcsReview: 0.7 },
  allowedStandingCategories: ["ppe-consumables", "mro-consumables", "facilities-consumables", "software-licences"],
};

export const POLICIES: Record<string, Policy> = { [DEMO_POLICY.version]: DEMO_POLICY };
