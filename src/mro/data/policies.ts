/**
 * Demo policy, versioned with the references the use-case I/O samples cite:
 * DoA matrix DOA-2026.2, channel rules CHR-v4.1 and confidence policy
 * CONF-v1.0. Values are illustrative build settings, not a statement of any
 * client's actual delegation.
 *
 * - Auto-approve limit £5,000 (`auto_approve_limit_gbp` in the UC6 Channel
 *   Decision input).
 * - Lanes: touchless ≥0.90, buy-desk review 0.70–0.89, client decides <0.70;
 *   a tripped guardrail always routes to a person.
 */

import type { Policy } from "@/mro/domain/types";
import { pence } from "@/mro/domain/money";

export const DEMO_POLICY: Policy = {
  version: "DOA-2026.2",
  channelRules: "CHR-v4.1",
  confidencePolicy: "CONF-v1.0",
  effectiveFrom: "2026-10-01T00:00:00.000Z",
  autoApproveLimit: pence(5_000),
  doa: [
    { role: "budget-holder", maxInclusive: pence(30_000) },
    { role: "category-lead", maxInclusive: pence(100_000) },
    { role: "procurement-head", maxInclusive: pence(249_999.99) },
  ],
  strategicHandoffFrom: pence(250_000),
  lanes: { touchless: 0.9, tcsReview: 0.7 },
  allowedStandingCategories: ["ppe-consumables"],
};

export const POLICIES: Record<string, Policy> = { [DEMO_POLICY.version]: DEMO_POLICY };
