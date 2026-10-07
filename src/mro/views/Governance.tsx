/**
 * Governance: the active policy, rule-change proposals raised by the agents'
 * own signals, and agent pause controls. A proposal becomes a policy version
 * only when its tests pass AND the gate passes HC09 for a Value Council
 * reviewer. Cases opened earlier keep their policy snapshot; pausing an
 * agent returns its pending step to people and replays nothing.
 */

import { Pause, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { useProcurement } from "@/mro/data/store";
import { useLedger, updateLedger } from "@/mro/services/demoLedger";
import { evaluateGate } from "@/mro/domain/evaluateGate";
import { activePolicy } from "@/mro/domain/selectors";
import { gbp, pence } from "@/mro/domain/money";
import { londonDateTime } from "@/mro/domain/clock";
import { STORY_RUNS } from "@/mro/data/stories/runModel";
import { IO } from "@/mro/data/stories/io";
import { agentKey } from "@/mro/components/story/useStoryRun";
import { ConsolePage } from "@/mro/components/console/kit";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { ActionButton, Card, Chip, KeyValue } from "@/mro/components/desk/ui";

type Proposal = {
  id: string;
  title: string;
  source: string;
  from: string;
  to: string;
  tests: { passed: boolean; detail: string };
  activate?: { version: string; patch: { autoApproveLimit: number } };
};

const PROPOSALS: Proposal[] = [
  {
    id: "RC-26-001",
    title: "Raise the catalogue auto-approve limit",
    source: "Flow 1 · catalogue call-offs at Halewood",
    from: "£5,000",
    to: "£7,500",
    tests: { passed: true, detail: "Replay of catalogue cases: no HC01–HC10 breach; budget holder still required above £7,500" },
    activate: { version: "DOA-2026.3", patch: { autoApproveLimit: pence(7_500) } },
  },
  {
    id: "RC-26-002",
    title: `Add ${IO.uc02.sourcing.output.learning_signal.equivalent_accepted} to the approved equivalents list`,
    source: `${IO.uc02.manifest.case_id} · learning signal`,
    from: "EQV-SENSORS-v7",
    to: "EQV-SENSORS-v8",
    tests: { passed: true, detail: "Five essential attributes matched; Technical Owner evidence attached" },
  },
  {
    id: "RC-26-003",
    title: "Accept 30-day payment terms for MRO suppliers",
    source: `${IO.uc10.manifest.case_id} · ${IO.uc10.clauseCompare.output.deviation_log.pattern_note}`,
    from: "≥45 days",
    to: "30 days",
    tests: { passed: false, detail: "Conflicts with the payment terms policy; no fallback below 45 days" },
  },
];

export function Governance() {
  const { domain, dispatch, session, lang } = useProcurement();
  const ledger = useLedger();
  const { d, role } = useDeskCopy();
  const policy = activePolicy(domain);
  const council = session.reviewAs === "value-council";

  const agents = Array.from(new Set(STORY_RUNS.flatMap((r) => r.steps.map((s) => s.run.agent))));

  const approve = (p: Proposal) => () => {
    if (!p.tests.passed) return { ok: false, message: d.testsFailed };
    const gate = evaluateGate({
      action: "rule.apply",
      policy,
      actorKind: "human",
      actorRole: session.reviewAs,
      amount: 0,
      caseRevision: 1,
      approvals: [],
      ruleChange: { councilApproved: council },
      evidenceRefs: [p.id],
      confidence: { pattern: "rule-change", signals: [{ key: "tests", score: 1, weight: 1, evidence: p.tests.detail }] },
    });
    if (!gate.allowed) return { ok: false, message: gate.reason ?? d.onlyCouncil };
    if (p.activate) {
      const r = dispatch({
        type: "policy.activate",
        actor: { kind: "human", role: "value-council", name: "Value Council" },
        changeId: p.id,
        version: p.activate.version,
        patch: p.activate.patch,
        idempotencyKey: `rule:${p.id}:apply`,
      });
      if (!r.ok) return { ok: false, message: r.message };
    }
    updateLedger((s) => ({ ...s, ruleChanges: { ...s.ruleChanges, [p.id]: { state: "approved", by: "Value Council", at: domain.clock.now } } }));
    return { ok: true };
  };

  const rollback = (p: Proposal) => () => {
    const r = dispatch({ type: "policy.rollback", actor: { kind: "human", role: "value-council", name: "Value Council" }, to: "DOA-2026.2", idempotencyKey: `rule:${p.id}:rollback:${domain.audit.length}` });
    if (!r.ok) return { ok: false, message: r.message };
    updateLedger((s) => {
      const rc = { ...s.ruleChanges };
      delete rc[p.id];
      return { ...s, ruleChanges: rc };
    });
    return { ok: true };
  };

  const togglePause = (key: string) =>
    updateLedger((s) => ({ ...s, paused: s.paused.includes(key) ? s.paused.filter((k) => k !== key) : [...s.paused, key] }));

  return (
    <ConsolePage title={d.govTitle} lead={d.govLead}>
      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-3">
          <Card title={d.activePolicy} right={<Chip tone="ok">{policy.version}</Chip>}>
            <div className="grid grid-cols-2 gap-3 px-4 pb-3 md:grid-cols-4">
              <KeyValue label={d.autoLimit} value={gbp(policy.autoApproveLimit)} strong />
              <KeyValue label={d.lanes} value={`≥${policy.lanes.touchless} · ${policy.lanes.tcsReview}–${policy.lanes.touchless} · <${policy.lanes.tcsReview}`} />
              <KeyValue label={d.effective} value={londonDateTime(policy.effectiveFrom, lang)} />
              <KeyValue label="Rules" value={`${policy.channelRules} · ${policy.confidencePolicy}`} />
            </div>
            <div className="border-t border-divider px-4 py-3">
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-mute">{d.doa}</p>
              <ul className="flex flex-wrap gap-2">
                {policy.doa.map((t) => (
                  <li key={t.role} className="rounded-md bg-surface-fog px-2.5 py-1 text-[12.5px] text-ink">{`${role(t.role)} ≤ ${gbp(t.maxInclusive)}`}</li>
                ))}
                <li className="rounded-md bg-surface-rose px-2.5 py-1 text-[12.5px] text-mark-red">{`≥ ${gbp(policy.strategicHandoffFrom)} · strategic`}</li>
              </ul>
            </div>
            <p className="border-t border-divider px-4 py-2.5 text-[12.5px] text-mute">{`${d.versions}: ${Object.keys(domain.policies.versions).join(" · ")} · ${d.casesKeepPolicy}`}</p>
          </Card>

          <Card title={d.ruleChanges} right={<span className="text-[12.5px] text-mute">{d.reviewingAs(role(session.reviewAs))}</span>}>
            <ul className="flex flex-col divide-y divide-divider border-t border-divider">
              {PROPOSALS.map((p) => {
                const decided = ledger.ruleChanges[p.id];
                return (
                  <li key={p.id} className="flex flex-col gap-2 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-bold text-mute">{p.id}</span>
                      <span className="min-w-0 flex-1 text-[14px] font-bold text-ink">{p.title}</span>
                      {decided ? <Chip tone="ok">{d.approved}</Chip> : <Chip tone={p.tests.passed ? "info" : "bad"}>{`${d.tests} ${p.tests.passed ? "PASS" : "FAIL"}`}</Chip>}
                    </div>
                    <p className="text-[12.5px] leading-[18px] text-mute">{p.source}</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-ink">
                      <span>{`${d.from} ${p.from}`}</span>
                      <span>{`${d.to} ${p.to}`}</span>
                      {p.activate && <span>{`${p.activate.version} · ${d.rollback} DOA-2026.2`}</span>}
                    </div>
                    <p className="text-[12.5px] leading-[18px] text-ink">{p.tests.detail}</p>
                    <div className="flex flex-wrap items-start gap-2">
                      {decided ? (
                        p.activate &&
                        domain.policies.active === p.activate.version &&
                        council && (
                          <ActionButton tone="ghost" onAction={rollback(p)} icon={<RotateCcw size={14} aria-hidden />}>
                            {`${d.rollback} DOA-2026.2`}
                          </ActionButton>
                        )
                      ) : council ? (
                        <ActionButton onAction={approve(p)} disabled={!p.tests.passed} icon={<ShieldCheck size={14} aria-hidden />}>
                          {d.approveChange}
                        </ActionButton>
                      ) : (
                        <span className="text-[12.5px] text-mute">{d.onlyCouncil}</span>
                      )}
                      {!p.tests.passed && <span className="text-[12.5px] text-mark-red">{d.testsFailed}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <Card title={d.agents}>
          <p className="px-4 pb-2 text-[12.5px] leading-[18px] text-mute">{d.pauseHint}</p>
          <ul className="flex flex-col divide-y divide-divider border-t border-divider">
            {agents.map((a) => {
              const key = agentKey(a);
              const paused = ledger.paused.includes(key);
              return (
                <li key={a} className="flex items-center gap-2 px-4 py-2">
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{a}</span>
                  <Chip tone={paused ? "warn" : "ok"}>{paused ? d.paused : d.activeAgent}</Chip>
                  <button
                    type="button"
                    onClick={() => togglePause(key)}
                    aria-label={`${paused ? d.resume : d.pause} ${a}`}
                    className="ui-pill grid h-7 w-7 shrink-0 place-items-center rounded-md border border-divider text-ink hover:bg-surface-fog"
                  >
                    {paused ? <Play size={13} /> : <Pause size={13} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </ConsolePage>
  );
}
