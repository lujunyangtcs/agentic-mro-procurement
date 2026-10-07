/**
 * Flow 5 value records for the five stories (PRD §16). Baselines, values and
 * measurement rules come from each story's I/O value record. A record is
 * validated only when the gate passes HC08: evidence posted AND a Finance
 * business partner's signature — never on the run finishing alone.
 */

import type { Policy, Role, StoryId } from "@/mro/domain/types";
import { evaluateGate, type GateResult } from "@/mro/domain/evaluateGate";
import { IO } from "@/mro/data/stories/io";
import { pence } from "@/mro/domain/money";
import type { LedgerState } from "@/mro/services/demoLedger";

export type ValueCat = "sourcing-saving" | "cost-avoidance" | "non-cash";
export type ValueLineState = "pending" | "awaiting-invoice" | "awaiting-finance" | "validated" | "not-claimed";

export type ValueLine = {
  id: string;
  storyId: StoryId;
  caseId: string;
  title: string;
  category: ValueCat;
  baseline: number;
  value: number;
  measurement: string;
  evidenceKind: "invoice" | "usage" | "none";
  state: ValueLineState;
  evidenceRef?: string;
  signedBy?: string;
};

type Def = Omit<ValueLine, "state" | "evidenceRef" | "signedBy"> & { claimWhen?: (endedWith?: string) => boolean };

const uc06 = IO.uc06.channelDecision.output.value_record;
const uc09 = IO.uc09.bidScoring.output;
const uc04 = IO.uc04.supplierMatch.output;
const uc02 = IO.uc02.sourcing.output.value_record;

const DEFS: Def[] = [
  {
    id: uc06.value_record_id,
    storyId: "ST01",
    caseId: IO.uc06.manifest.case_id,
    title: "CAD viewer pro licences reassigned",
    category: "cost-avoidance",
    baseline: pence(uc06.baseline_gbp),
    value: pence(uc06.avoided_gbp),
    measurement: uc06.measurement,
    evidenceKind: "usage",
  },
  {
    id: "VR-26-55241",
    storyId: "ST02",
    caseId: IO.uc09.manifest.case_id,
    title: "HP-400 annual service negotiated",
    category: "sourcing-saving",
    baseline: pence(uc09.value_record.baseline_gbp),
    value: pence(uc09.value_record.baseline_gbp - uc09.negotiation_position.target_gbp),
    measurement: uc09.value_record.measurement,
    evidenceKind: "invoice",
  },
  {
    id: "VR-26-55307",
    storyId: "ST03",
    caseId: IO.uc04.manifest.case_id,
    title: "Consultant redirected to panel supplier",
    category: "sourcing-saving",
    baseline: pence(uc04.value_record.baseline_gbp),
    value: pence(uc04.recommendation.saving_vs_named_gbp),
    measurement: uc04.value_record.measurement,
    evidenceKind: "invoice",
    claimWhen: (endedWith) => endedWith === "redirect",
  },
  {
    id: "VR-26-55360",
    storyId: "ST04",
    caseId: IO.uc10.manifest.case_id,
    title: "Payment terms and warranty held",
    category: "non-cash",
    baseline: 0,
    value: 0,
    measurement: IO.uc10.clauseCompare.output.summary.commercial_value_protected,
    evidenceKind: "none",
  },
  {
    id: uc02.value_record_id,
    storyId: "ST05",
    caseId: IO.uc02.manifest.case_id,
    title: "Approved equivalent sensors awarded",
    category: "sourcing-saving",
    baseline: pence(uc02.baseline_gbp),
    value: pence(uc02.baseline_gbp - uc02.award_gbp),
    measurement: uc02.measurement,
    evidenceKind: "invoice",
  },
];

export function valueLines(ledger: LedgerState): ValueLine[] {
  return DEFS.map(({ claimWhen, ...d }) => {
    const run = ledger.runs[d.storyId];
    const sign = ledger.signoffs[d.id];
    const evidenceRef = d.evidenceKind === "usage" ? "SAM-2026-10-06" : ledger.evidenced[d.id];
    let state: ValueLineState;
    if (!run?.finished) state = "pending";
    else if (d.category === "non-cash" || (claimWhen && !claimWhen(run.endedWith))) state = "not-claimed";
    else if (sign) state = "validated";
    else if (!evidenceRef) state = "awaiting-invoice";
    else state = "awaiting-finance";
    return { ...d, state, evidenceRef, signedBy: sign?.by };
  });
}

/** The gate for a Finance sign-off — HC08 decides, not the button. */
export function valueGate(policy: Policy, line: ValueLine, role: Role): GateResult {
  return evaluateGate({
    action: "value.validate",
    policy,
    actorKind: "human",
    actorRole: role,
    amount: line.value,
    caseRevision: 1,
    approvals: [],
    value: { invoiceEvidence: !!line.evidenceRef, financeSignedBy: role },
    evidenceRefs: [line.id, ...(line.evidenceRef ? [line.evidenceRef] : [])],
    confidence: {
      pattern: "value-validation",
      signals: [
        { key: "evidence_match", score: line.evidenceRef ? 1 : 0, weight: 0.6, evidence: line.evidenceRef ?? "No evidence posted" },
        { key: "baseline_method", score: 0.95, weight: 0.4, evidence: line.measurement },
      ],
    },
  });
}

export function valueTotals(lines: ValueLine[]) {
  const sum = (f: (l: ValueLine) => boolean) => lines.filter(f).reduce((t, l) => t + l.value, 0);
  return {
    cashValidated: sum((l) => l.category === "sourcing-saving" && l.state === "validated"),
    avoidanceValidated: sum((l) => l.category === "cost-avoidance" && l.state === "validated"),
    expected: sum((l) => l.state === "awaiting-invoice" || l.state === "awaiting-finance"),
  };
}
