/**
 * Fixtures that seed requests. Phase 1 carries only the touchless catalogue
 * path: Halewood stores, 3M 6055 A2 filters under catalogue CAT-AP-2026-01.
 *
 * 10 packs × 4 pairs = 40 pairs at £12/pair (£48/pack) = £480 → standing
 * approval. The same fixture at 80 packs (£3,840) crosses the £3,000 ceiling
 * and needs a Budget Holder: a live agreement does not remove DoA.
 */

import type { RequestDraft } from "@/mro/domain/commands";

export const CATALOGUE_FIXTURE_ID = "FX-CAT-3M6055";

export function catalogueFixture(packs = 10): RequestDraft {
  return {
    fixtureId: CATALOGUE_FIXTURE_ID,
    preferredCaseId: "CASE-CAT-001",
    preferredPrId: "PR-AP-1000",
    requester: "Halewood stores controller",
    channel: "form",
    originalText: `Need ${packs} packs of 3M 6055 A2 filters for Halewood stores by 12 Oct.`,
    site: "UK-HAL-01",
    costCentre: "CC-HAL-MAINT",
    glCode: "GL-MRO",
    purpose: "Stores replenishment, respiratory filter cartridges",
    urgency: "normal",
    agreementId: "CAT-AP-2026-01",
    supplierId: "SUP-AP-001",
    lines: [{ material: "MAT-PPE-3M-6055", quantity: packs, uom: "PACK", neededBy: "2026-10-12T16:00:00.000Z" }],
    pattern: "catalogue-call-off",
    confidence: {
      completeness: 1,
      classification: 0.98,
      matchStrength: 1,
      priceBenchmark: 0.95,
      supplierStatus: 1,
      patternHistory: 0.9,
    },
    budgetRef: "BUD-CC-HAL-MAINT-FY26",
  };
}
