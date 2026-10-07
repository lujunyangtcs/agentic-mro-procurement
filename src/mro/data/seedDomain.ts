/**
 * The demo opens on a believable working day. History is replayed through
 * the same commands the UI dispatches, starting 25 Sep so receipts and
 * invoices land before 07 Oct 09:00:
 *
 * - CASE-AP-1100 · 3M 6055, Solihull — completed touchless, invoice matched
 * - CASE-AP-1101 · nitrile gloves, Halewood — completed touchless
 * - CASE-AP-1102 · EP2 grease, Wolverhampton — PO sent, no confirmation for 48h (chase open)
 * - CASE-AP-1103 · LED panels, Gaydon — invoice billed above PO, held for a credit note
 * - CASE-AP-1104 · 3M 6055 × 80 packs, Halewood — waiting on the Budget Holder
 *
 * The five story arrivals are captured but not yet submitted; New Request
 * submits them live. No human decision is seeded.
 */

import type { RequestDraft } from "@/mro/domain/commands";
import { initialDomainState } from "@/mro/domain/reducer";
import { dispatchCommand, runAgentsUntilStop } from "@/mro/domain/engine";
import type { DomainState, FlowKey } from "@/mro/domain/types";
import { CLOCK_START } from "@/mro/domain/clock";
import { arrivalById, catalogueFixture, catalogueSignals, INTAKE_MODEL } from "@/mro/data/storyFixtures";

const SEED_START = "2026-09-25T07:00:00.000Z";

const orchestrator = (s: DomainState) => ({ kind: "agent" as const, agentId: "orchestrator" as const, policyVersion: s.policies.active });

function catalogueDraft(p: { material: string; qty: number; uom: RequestDraft["lines"][number]["uom"]; site: RequestDraft["site"]; cc: string; requester: string; text: string; title: string; purpose: string; glCode?: string; capture?: string; channel?: RequestDraft["channel"] }): RequestDraft {
  return {
    requester: p.requester,
    channel: p.channel ?? "form",
    captureId: p.capture,
    originalText: p.text,
    site: p.site,
    costCentre: p.cc,
    glCode: p.glCode ?? "GL-MRO",
    purpose: p.purpose,
    urgency: "normal",
    agreementId: "CAT-AP-2026-01",
    supplierId: "SUP-AP-001",
    lines: [{ material: p.material, quantity: p.qty, uom: p.uom, neededBy: "2026-10-09T16:00:00.000Z" }],
    pattern: "catalogue-call-off",
    signals: catalogueSignals(),
    model: INTAKE_MODEL,
    title: p.title,
  };
}

/** Submit a draft and start its flow; returns the new state and case id. */
export function submitAndStart(state: DomainState, draft: RequestDraft, flow: FlowKey, key: string, variant?: Record<string, boolean>): { state: DomainState; caseId?: string; duplicate?: boolean } {
  const submitted = dispatchCommand(state, {
    type: "request.submit",
    actor: { kind: "human", role: "requester", name: draft.requester },
    draft,
    idempotencyKey: `submit:${key}`,
  });
  if (!submitted.ok || !submitted.caseId) return { state: submitted.state };
  if (submitted.duplicate) return { state: submitted.state, caseId: submitted.caseId, duplicate: true };
  const started = dispatchCommand(submitted.state, { type: "flow.start", actor: orchestrator(submitted.state), caseId: submitted.caseId, flow, variant, idempotencyKey: `start:${submitted.caseId}` });
  return { state: started.state, caseId: submitted.caseId };
}

function advanceTo(s: DomainState, iso: string): DomainState {
  const minutes = Math.max(0, Math.round((Date.parse(iso) - Date.parse(s.clock.now)) / 60_000));
  if (minutes === 0) return s;
  return dispatchCommand(s, { type: "clock.advance", actor: orchestrator(s), minutes, idempotencyKey: `seed:clock:${iso}` }).state;
}

export function seedDomain(): DomainState {
  let s = initialDomainState();
  s.clock.now = SEED_START;

  /* 1 · completed touchless call-off. */
  let r = submitAndStart(s, catalogueDraft({ material: "MAT-PPE-3M-6055", qty: 12, uom: "PACK", site: "UK-SOL-01", cc: "CC-SOL-MAINT", requester: "Solihull paint shop", text: "12 packs 3M 6055 A2 for the paint shop, usual line.", title: "3M 6055 A2 filters · Solihull", purpose: "Paint-shop PPE replenishment" }), "catalogue", "seed:1100");
  s = runAgentsUntilStop(r.state, r.caseId!, "seed");

  /* 2 · completed touchless call-off. */
  r = submitAndStart(s, catalogueDraft({ material: "MAT-PPE-NITRILE-L", qty: 30, uom: "PACK", site: "UK-HAL-01", cc: "CC-HAL-MAINT", requester: "Halewood stores controller", text: "30 boxes nitrile gloves size L for Halewood stores.", title: "Nitrile gloves · Halewood", purpose: "Stores replenishment" }), "catalogue", "seed:1101");
  s = runAgentsUntilStop(r.state, r.caseId!, "seed");

  /* 3 · PO dispatched, supplier never confirms. */
  r = submitAndStart(s, catalogueDraft({ material: "MAT-LUB-EP2-400", qty: 60, uom: "EA", site: "UK-WOL-01", cc: "CC-WOL-ENG", requester: "Wolverhampton maintenance stores", text: "60 EP2 grease cartridges for the e-drive line PM.", title: "EP2 grease · Wolverhampton", purpose: "Planned maintenance consumables" }), "catalogue", "seed:1102");
  const greaseId = r.caseId!;
  s = r.state;
  for (const step of ["intake", "policy", "po"]) {
    s = dispatchCommand(s, { type: "step.run", actor: orchestrator(s), runId: greaseId, stepId: step, idempotencyKey: `seed:${greaseId}:${step}` }).state;
  }
  for (const po of Object.values(s.pos)) if (po.caseId === greaseId) po.withheldAck = true;

  /* 4 · invoice billed £3 per panel above the PO. */
  r = submitAndStart(s, catalogueDraft({ material: "MAT-FAC-LED-600", qty: 24, uom: "EA", site: "UK-GAY-01", cc: "CC-GAY-IT", glCode: "GL-FACILITIES", requester: "Gaydon facilities", text: "24 LED panels 600×600 for the design studio refit.", title: "LED panels · Gaydon", purpose: "Design studio lighting refit" }), "catalogue", "seed:1103", { priceVariance: true });
  s = runAgentsUntilStop(r.state, r.caseId!, "seed");

  /* The grease PO is now well past its 48h confirmation window. */
  s = runAgentsUntilStop(s, greaseId, "seed");

  /* 5 · this morning's 80-pack restock, above the standing limit. */
  s = advanceTo(s, "2026-10-07T07:02:00.000Z");
  const wo = arrivalById["CAP-WO-0711"];
  r = submitAndStart(s, { ...wo.draft!(), captureId: wo.id }, "catalogue", "seed:1104");
  s = runAgentsUntilStop(r.state, r.caseId!, "seed");

  s = advanceTo(s, CLOCK_START);
  return s;
}

export { catalogueFixture };
