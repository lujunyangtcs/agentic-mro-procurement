/**
 * The use-case agent I/O samples are the source of truth for every story
 * figure. The JSON under `./io` is the supplied set with the client's name
 * neutralised to "Client"; nothing else is edited. Story builds read values
 * from here rather than restating them, so the demo cannot drift from the I/O.
 */

import type { ConfidenceSignal } from "@/mro/domain/types";

import uc06Manifest from "./io/uc06/manifest.json";
import uc06IntakeIn from "./io/uc06/01.input.json";
import uc06IntakeOut from "./io/uc06/01.output.json";
import uc06SpendIn from "./io/uc06/02.input.json";
import uc06SpendOut from "./io/uc06/02.output.json";
import uc06ChannelIn from "./io/uc06/03.input.json";
import uc06ChannelOut from "./io/uc06/03.output.json";

import uc09Manifest from "./io/uc09/manifest.json";
import uc09SourcingIn from "./io/uc09/01.input.json";
import uc09SourcingOut from "./io/uc09/01.output.json";
import uc09BidIn from "./io/uc09/02.input.json";
import uc09BidOut from "./io/uc09/02.output.json";

import uc04Manifest from "./io/uc04/manifest.json";
import uc04MatchIn from "./io/uc04/01.input.json";
import uc04MatchOut from "./io/uc04/01.output.json";
import uc04OnboardIn from "./io/uc04/02.input.json";
import uc04OnboardOut from "./io/uc04/02.output.json";
import uc04RiskIn from "./io/uc04/03.input.json";
import uc04RiskOut from "./io/uc04/03.output.json";

import uc10Manifest from "./io/uc10/manifest.json";
import uc10ContractIn from "./io/uc10/01.input.json";
import uc10ContractOut from "./io/uc10/01.output.json";
import uc10ClauseIn from "./io/uc10/02.input.json";
import uc10ClauseOut from "./io/uc10/02.output.json";

import uc02Manifest from "./io/uc02/manifest.json";
import uc02IntakeIn from "./io/uc02/01.input.json";
import uc02IntakeOut from "./io/uc02/01.output.json";
import uc02SourcingIn from "./io/uc02/02.input.json";
import uc02SourcingOut from "./io/uc02/02.output.json";

export const IO = {
  uc06: {
    manifest: uc06Manifest,
    intake: { input: uc06IntakeIn, output: uc06IntakeOut },
    spendIntelligence: { input: uc06SpendIn, output: uc06SpendOut },
    channelDecision: { input: uc06ChannelIn, output: uc06ChannelOut },
  },
  uc09: {
    manifest: uc09Manifest,
    sourcing: { input: uc09SourcingIn, output: uc09SourcingOut },
    bidScoring: { input: uc09BidIn, output: uc09BidOut },
  },
  uc04: {
    manifest: uc04Manifest,
    supplierMatch: { input: uc04MatchIn, output: uc04MatchOut },
    onboarding: { input: uc04OnboardIn, output: uc04OnboardOut },
    riskScreening: { input: uc04RiskIn, output: uc04RiskOut },
  },
  uc10: {
    manifest: uc10Manifest,
    contract: { input: uc10ContractIn, output: uc10ContractOut },
    clauseCompare: { input: uc10ClauseIn, output: uc10ClauseOut },
  },
  uc02: {
    manifest: uc02Manifest,
    intake: { input: uc02IntakeIn, output: uc02IntakeOut },
    sourcing: { input: uc02SourcingIn, output: uc02SourcingOut },
  },
} as const;

export type UseCaseKey = keyof typeof IO;

/* ── Common envelope (README: meta • confidence • guardrail_checks • lane_decision • audit) ── */

type RawSignal = { score: number; weight: number; evidence: string };
type RawGuardrail = { rule: string; status: string; detail: string };
type RawOutput = {
  meta: { case_id: string; agent: string; flow_step: string; timestamp: string };
  confidence?: { score: number; signals: Record<string, RawSignal> };
  guardrail_checks?: RawGuardrail[];
  lane_decision?: { lane: string; band: string; reason: string; route_to: Record<string, unknown>; post_audit?: string };
  audit?: { model_version?: string; evidence_ids?: string[] };
};
type RawInput = { meta: { timestamp: string } };

export type GuardrailStatus = "PASS" | "WARN" | "INFO" | "PENDING" | "TRIPPED" | "N/A";

export type AgentRun = {
  caseId: string;
  agent: string;
  flowStep: string;
  startedAt: string;
  finishedAt: string;
  model?: string;
  confidence?: { score: number; signals: ConfidenceSignal[] };
  guardrails: { rule: string; status: GuardrailStatus; detail: string }[];
  lane?: { lane: "TOUCHLESS" | "HiTL"; band: string; reason: string; routeTo: Record<string, unknown>; postAudit?: string };
  evidenceIds: string[];
};

export function agentRun(pair: { input: unknown; output: unknown }): AgentRun {
  const out = pair.output as RawOutput;
  const inp = pair.input as RawInput;
  return {
    caseId: out.meta.case_id,
    agent: out.meta.agent,
    flowStep: out.meta.flow_step,
    startedAt: inp.meta.timestamp,
    finishedAt: out.meta.timestamp,
    model: out.audit?.model_version,
    confidence: out.confidence && {
      score: out.confidence.score,
      signals: Object.entries(out.confidence.signals).map(([key, s]) => ({ key, score: s.score, weight: s.weight, evidence: s.evidence })),
    },
    guardrails: (out.guardrail_checks ?? []).map((g) => ({ ...g, status: g.status as GuardrailStatus })),
    lane: out.lane_decision && {
      lane: out.lane_decision.lane as "TOUCHLESS" | "HiTL",
      band: out.lane_decision.band,
      reason: out.lane_decision.reason,
      routeTo: out.lane_decision.route_to,
      postAudit: out.lane_decision.post_audit,
    },
    evidenceIds: out.audit?.evidence_ids ?? [],
  };
}

/** Every agent step of a use case, in chain order. */
export function agentRuns(uc: UseCaseKey): AgentRun[] {
  const { manifest: _m, ...steps } = IO[uc];
  void _m;
  return Object.values(steps).map((p) => agentRun(p as { input: unknown; output: unknown }));
}
