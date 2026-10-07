/**
 * The Flow 1 catalogue fixture — the one request not drawn from the use-case
 * I/O. Halewood stores, 3M 6055 A2 filters under catalogue CAT-26-00418.
 *
 * 10 packs × 4 pairs = 40 pairs at £12/pair (£48/pack) = £480 → standing
 * approval. At 120 packs (£5,760) it crosses the £5,000 auto-approve limit
 * and needs a Budget Holder: a live agreement does not remove DoA.
 *
 * Confidence uses the Intake Agent's CONF-v1.0 signal set (intake-v2.3), the
 * same four signals and weights the UC6 Intake Agent reports.
 */

import type { RequestDraft } from "@/mro/domain/commands";
import type { ConfidenceSignal } from "@/mro/domain/types";

export const CATALOGUE_FIXTURE_ID = "FX-CAT-3M6055";
export const CATALOGUE_UNIT_PACK_GBP = 48;
export const BUDGET_HOLDER_PACKS = 120;

export const INTAKE_MODEL = "intake-v2.3";

export function catalogueSignals(): ConfidenceSignal[] {
  return [
    { key: "data_completeness", score: 1, weight: 0.25, evidence: "All mandatory fields present" },
    { key: "classification_certainty", score: 0.98, weight: 0.3, evidence: "Catalogue item MAT-PPE-3M-6055; GL 640440" },
    { key: "starting_cost", score: 0.95, weight: 0.25, evidence: "Catalogue price £48 / pack (CAT-26-00418)" },
    { key: "duplicate_check", score: 0.92, weight: 0.2, evidence: "No open request for same item in CC-3310-HAL" },
  ];
}

export function catalogueFixture(packs = 10): RequestDraft {
  return {
    fixtureId: CATALOGUE_FIXTURE_ID,
    requester: "Halewood stores controller",
    channel: "form",
    originalText: `Need ${packs} packs of 3M 6055 A2 filters for Halewood stores by 12 Oct.`,
    site: "UK-HAL-01",
    costCentre: "CC-3310-HAL",
    glCode: "640440",
    purpose: "Stores replenishment, respiratory filter cartridges",
    urgency: "normal",
    agreementId: "CAT-26-00418",
    supplierId: "SUP-10418",
    lines: [{ material: "MAT-PPE-3M-6055", quantity: packs, uom: "PACK", neededBy: "2026-10-12T16:00:00.000Z" }],
    pattern: "catalogue-call-off",
    signals: catalogueSignals(),
    model: INTAKE_MODEL,
    budgetRef: "BUD-CC3310-FY27",
  };
}
