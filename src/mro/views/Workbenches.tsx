/**
 * The four workbenches read the same story runs and domain records as the
 * case workspaces: an item appears once the agent that raises it has run,
 * and its state follows the case. Opening a row lands on the step that
 * produced it.
 */

import * as React from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { useApp, type View } from "@/mro/state";
import { useProcurement } from "@/mro/data/store";
import { useLedger, updateLedger, type LedgerState } from "@/mro/services/demoLedger";
import { IO } from "@/mro/data/stories/io";
import { storyRunById } from "@/mro/data/stories/runModel";
import { storyStatus } from "@/mro/components/story/useStoryRun";
import type { StoryId } from "@/mro/domain/types";
import { ConsolePage, Th, Td } from "@/mro/components/console/kit";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { useStoryCopy } from "@/mro/components/story/copy";
import { ActionButton, Chip, type ChipTone } from "@/mro/components/desk/ui";

const money = (n: number) => `£${n.toLocaleString("en-GB")}`;

function revealed(ledger: LedgerState, id: StoryId, step: number) {
  const r = ledger.runs[id];
  return !!r && (r.revealed.includes(step) || r.finished);
}

function useStoryChip(id: StoryId): { label: string; tone: ChipTone } {
  const ledger = useLedger();
  const { c } = useStoryCopy();
  const { d } = useDeskCopy();
  const st = storyStatus(storyRunById[id], ledger.runs[id]);
  const map: Record<string, { label: string; tone: ChipTone }> = {
    new: { label: d.notRun, tone: "mute" },
    running: { label: c.status.running, tone: "info" },
    ready: { label: c.status.ready, tone: "info" },
    waiting: { label: st.waitingOn ? c.waitingOn(st.waitingOn) : c.status.waiting, tone: "warn" },
    done: { label: c.status.done, tone: "ok" },
    ended: { label: c.status.ended, tone: "mute" },
  };
  return map[st.status];
}

function StoryChip({ id }: { id: StoryId }) {
  const chip = useStoryChip(id);
  return (
    <Chip tone={chip.tone} className="max-w-[240px] truncate">
      {chip.label}
    </Chip>
  );
}

function OpenLink({ to, label }: { to: View; label: string }) {
  const { go } = useApp();
  return (
    <button type="button" onClick={() => go(to)} className="inline-flex items-center gap-1 whitespace-nowrap text-[12.5px] font-medium text-surface-deep hover:underline">
      {label} <ArrowRight size={12} aria-hidden />
    </button>
  );
}

function Bench({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: string }) {
  return (
    <section className="overflow-hidden rounded-md border border-divider bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="border-b border-divider bg-surface-fog/60">
            <tr>
              {head.map((h, i) => (
                <Th key={h + i}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {empty && <p className="border-t border-divider px-4 py-5 text-center text-[13px] text-mute">{empty}</p>}
    </section>
  );
}

/* ── Opportunities (Flow 0) ─────────────────────────────────────────────── */

export function OpportunitiesBench() {
  const ledger = useLedger();
  const { domain, session } = useProcurement();
  const { d, role } = useDeskCopy();
  const sig = IO.uc06.spendIntelligence.output.pipeline_signal;
  const dev = IO.uc10.clauseCompare.output.deviation_log;
  const items = [
    { id: sig.pipeline_item, title: sig.lever, value: money(sig.est_value_gbp), owner: sig.to, story: "ST01" as StoryId, step: 1, case: IO.uc06.manifest.case_id },
    { id: "PIPE-CL-0031", title: "Quarterly clause library refresh · payment terms", value: "—", owner: dev.to, story: "ST04" as StoryId, step: 1, case: IO.uc10.manifest.case_id },
  ].filter((o) => revealed(ledger, o.story, o.step));
  const isCategory = session.reviewAs === "category-lead";

  const decide = (id: string, state: "live" | "declined") => () => {
    if (!isCategory) return { ok: false, message: d.onlyRole(role("category-lead")) };
    updateLedger((s) => ({ ...s, opportunities: { ...s.opportunities, [id]: { state, by: role("category-lead"), at: domain.clock.now } } }));
    return { ok: true };
  };

  return (
    <ConsolePage title={d.oppTitle} lead={d.oppLead}>
      <Bench head={["ID", d.lever, d.est, d.owner, d.status, ""]} empty={items.length === 0 ? `${d.notRun} · ST01 / ST04` : undefined}>
        {items.map((o) => {
          const dec = ledger.opportunities[o.id];
          return (
            <tr key={o.id} className="border-b border-divider last:border-0">
              <Td className="font-bold">{o.id}</Td>
              <Td className="max-w-[320px] whitespace-normal">
                <span className="block font-medium text-ink">{o.title}</span>
                <span className="block text-[12px] text-mute">{d.surfacedBy(o.case)}</span>
              </Td>
              <Td align="right">{o.value}</Td>
              <Td className="max-w-[240px] truncate text-mute" title={o.owner}>
                {o.owner}
              </Td>
              <Td>
                <Chip tone={dec?.state === "live" ? "ok" : dec?.state === "declined" ? "mute" : "warn"}>
                  {dec?.state === "live" ? d.live : dec?.state === "declined" ? d.declined : d.awaitingCategory}
                </Chip>
              </Td>
              <Td align="right">
                <span className="inline-flex items-center gap-2">
                  {!dec && isCategory && (
                    <>
                      <ActionButton onAction={decide(o.id, "live")} icon={<Check size={13} aria-hidden />}>
                        {d.accept}
                      </ActionButton>
                      <ActionButton tone="ghost" onAction={decide(o.id, "declined")} icon={<X size={13} aria-hidden />}>
                        {d.decline}
                      </ActionButton>
                    </>
                  )}
                  {!dec && !isCategory && <span className="text-[12.5px] text-mute">{d.onlyRole(role("category-lead"))}</span>}
                  <OpenLink to={{ kind: "story", storyId: o.story, step: o.step }} label={d.openCase} />
                </span>
              </Td>
            </tr>
          );
        })}
      </Bench>
    </ConsolePage>
  );
}

/* ── Sourcing (Flow 2) ──────────────────────────────────────────────────── */

export function SourcingBench() {
  const ledger = useLedger();
  const { d } = useDeskCopy();
  const r9 = IO.uc09.sourcing.output.rfq;
  const b9 = IO.uc09.bidScoring.output;
  const r2 = IO.uc02.sourcing.output;
  const rows = [
    {
      id: r9.rfq_id,
      story: "ST02" as StoryId,
      step: revealed(ledger, "ST02", 1) ? 1 : 0,
      title: IO.uc09.sourcing.input.request.spec_ref,
      issued: r9.issued_to.length,
      quotes: revealed(ledger, "ST02", 1) ? String(b9.ranking.length) : "—",
      best: revealed(ledger, "ST02", 1) ? `${b9.ranking[0].supplier} · ${money(b9.ranking[0].total)}` : "—",
      award: revealed(ledger, "ST02", 1) ? `${d.target} ${money(b9.negotiation_position.target_gbp)}` : "—",
      shown: revealed(ledger, "ST02", 0),
    },
    {
      id: r2.rfq_id,
      story: "ST05" as StoryId,
      step: 1,
      title: IO.uc02.intake.output.structured_request.category,
      issued: r2.bids.length,
      quotes: String(r2.bids.length),
      best: `${r2.award.supplier} · ${money(r2.award.total_gbp)}`,
      award: `${r2.award.part} · −${r2.award.saving_pct}%`,
      shown: revealed(ledger, "ST05", 1),
    },
  ].filter((r) => r.shown);

  return (
    <ConsolePage title={d.srcTitle} lead={d.srcLead}>
      <Bench head={[d.rfqCol, d.cases, d.issuedTo, d.quotes, d.best, d.award, d.status, ""]} empty={rows.length === 0 ? `${d.notRun} · ST02 / ST05` : undefined}>
        {rows.map((r) => (
          <tr key={r.id} className="border-b border-divider last:border-0">
            <Td className="font-bold">{r.id}</Td>
            <Td>
              <span className="block text-ink">{r.title}</span>
              <span className="block text-[12px] text-mute">{storyRunById[r.story].story.caseId}</span>
            </Td>
            <Td align="right">{r.issued}</Td>
            <Td align="right">{r.quotes}</Td>
            <Td>{r.best}</Td>
            <Td>{r.award}</Td>
            <Td>
              <StoryChip id={r.story} />
            </Td>
            <Td align="right">
              <OpenLink to={{ kind: "story", storyId: r.story, step: r.step }} label={d.openCase} />
            </Td>
          </tr>
        ))}
      </Bench>
    </ConsolePage>
  );
}

/* ── Suppliers (Flow 4) ─────────────────────────────────────────────────── */

export function SuppliersBench() {
  const ledger = useLedger();
  const { domain } = useProcurement();
  const { d } = useDeskCopy();
  const run = ledger.runs.ST03;
  const redirected = run?.endedWith === "redirect";
  const onboardingShown = revealed(ledger, "ST03", 1);
  const riskShown = revealed(ledger, "ST03", 2);
  const risk = IO.uc04.riskScreening.output;
  const onb = IO.uc04.onboarding.output;

  return (
    <ConsolePage title={d.supTitle} lead={d.supLead}>
      {revealed(ledger, "ST03", 0) && (
        <section className="flex flex-col gap-2 rounded-md border border-divider bg-white px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 flex-1 text-[15px] font-bold text-ink">{`${d.onboarding} · ${IO.uc04.supplierMatch.input.named_supplier_profile ? "NovaOps Consulting Ltd" : ""}`}</h2>
            <StoryChip id="ST03" />
            <OpenLink to={{ kind: "story", storyId: "ST03", step: riskShown ? 2 : onboardingShown ? 1 : 0 }} label={d.openCase} />
          </div>
          <p className="text-[13px] leading-[19px] text-ink">
            {redirected
              ? `${IO.uc04.supplierMatch.output.recommendation.decision} · ${IO.uc04.supplierMatch.output.recommendation.supplier}`
              : onboardingShown
                ? `${onb.invitation.portal_ref} · ${onb.document_validation.filter((x) => x.status === "GAP").map((x) => `${x.doc}: ${(x as { detail?: string }).detail}`).join(" · ")}`
                : IO.uc04.supplierMatch.output.recommendation.decision}
          </p>
          {riskShown && !redirected && (
            <p className="flex flex-wrap items-center gap-2 text-[13px] text-ink">
              <Chip tone="warn">{`${d.risk} ${risk.proposed_risk_tier}`}</Chip>
              {risk.proposed_conditions.join(" · ")}
            </p>
          )}
        </section>
      )}
      <Bench head={["ID", d.supplier, d.status, d.panel, "Bank", "Email"]}>
        {Object.values(domain.suppliers).map((s) => (
          <tr key={s.id} className="border-b border-divider last:border-0">
            <Td className="font-bold">{s.id}</Td>
            <Td>{s.name}</Td>
            <Td>
              <Chip tone={s.status === "active" ? "ok" : s.status === "pending" ? "warn" : "mute"}>{s.status}</Chip>
            </Td>
            <Td className="text-mute">{s.panelScope.join(" · ") || "—"}</Td>
            <Td className="text-mute">{s.bankVerified ? s.bankMasked : "not verified"}</Td>
            <Td className="text-mute">{s.email}</Td>
          </tr>
        ))}
      </Bench>
    </ConsolePage>
  );
}

/* ── Contracts (Flow 3) ─────────────────────────────────────────────────── */

export function ContractsBench() {
  const ledger = useLedger();
  const { d } = useDeskCopy();
  const ct = IO.uc10.contract.output;
  const cl = IO.uc10.clauseCompare.output;
  const award = IO.uc10.contract.input.award;
  const shown = revealed(ledger, "ST04", 0);
  const clauses = revealed(ledger, "ST04", 1);
  const done = ledger.runs.ST04?.finished;

  return (
    <ConsolePage title={d.conTitle} lead={d.conLead}>
      <Bench head={[d.draftCol, d.supplier, d.value, d.clauses, d.status, ""]} empty={shown ? undefined : `${d.notRun} · ST04`}>
        {shown && (
          <tr className="border-b border-divider last:border-0">
            <Td className="font-bold">{ct.draft.doc_id}</Td>
            <Td>
              <span className="block text-ink">{award.supplier}</span>
              <span className="block text-[12px] text-mute">{`${award.award_id} · ${ct.triage.template}`}</span>
            </Td>
            <Td align="right">{money(award.value_gbp)}</Td>
            <Td>
              {clauses ? (
                <span className="inline-flex gap-1.5">
                  <Chip tone="ok">{`G ${cl.summary.green}`}</Chip>
                  <Chip tone="warn">{`A ${cl.summary.amber}`}</Chip>
                  <Chip tone="bad">{`R ${cl.summary.red}`}</Chip>
                </span>
              ) : (
                "—"
              )}
            </Td>
            <Td>{done ? <Chip tone="ok">{d.stored}</Chip> : <Chip tone="warn">{d.blocked}</Chip>}</Td>
            <Td align="right">
              <OpenLink to={{ kind: "story", storyId: "ST04", step: clauses ? 1 : 0 }} label={d.openCase} />
            </Td>
          </tr>
        )}
      </Bench>
    </ConsolePage>
  );
}
