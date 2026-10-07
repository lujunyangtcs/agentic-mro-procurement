/**
 * Flow 5 value assurance. A story's value record moves expected → evidenced
 * → validated only through invoice (or usage) evidence and a Finance business
 * partner's signature checked by the gate (HC08). Totals are computed from
 * the records, never typed in.
 */

import { FileCheck2, PenLine, ArrowRight } from "lucide-react";
import { useApp } from "@/mro/state";
import { useProcurement } from "@/mro/data/store";
import { useLedger, updateLedger } from "@/mro/services/demoLedger";
import { valueGate, valueLines, valueTotals, type ValueLine, type ValueLineState } from "@/mro/domain/storyValue";
import { activePolicy } from "@/mro/domain/selectors";
import { gbp } from "@/mro/domain/money";
import { londonDateTime } from "@/mro/domain/clock";
import { ConsolePage, Th, Td } from "@/mro/components/console/kit";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { ActionButton, Chip, EqualHeightCardRow, type ChipTone } from "@/mro/components/desk/ui";

const stateTone: Record<ValueLineState, ChipTone> = {
  pending: "mute",
  "awaiting-invoice": "info",
  "awaiting-finance": "warn",
  validated: "ok",
  "not-claimed": "mute",
};

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <article className="flex flex-col gap-0.5 rounded-md border border-divider bg-white px-4 py-3.5">
      <span className="text-[12px] font-bold uppercase tracking-[0.05em] text-mute">{label}</span>
      <span className="text-[26px] font-bold tabular-nums leading-[32px] text-ink">{value}</span>
      <span className="truncate text-[12.5px] text-mute">{sub}</span>
    </article>
  );
}

export function ValueAssurance() {
  const { go } = useApp();
  const { domain, session, lang } = useProcurement();
  const ledger = useLedger();
  const { d, role } = useDeskCopy();
  const lines = valueLines(ledger);
  const totals = valueTotals(lines);
  const policy = activePolicy(domain);
  const isFinance = session.reviewAs === "finance-bp";

  const recordEvidence = (l: ValueLine) => () => {
    const ref = `INV-${l.caseId.replace(/^TSM-2026-/, "26-")}-01`;
    updateLedger((s) => ({ ...s, evidenced: { ...s.evidenced, [l.id]: ref } }));
    return { ok: true };
  };

  const signOff = (l: ValueLine) => () => {
    const gate = valueGate(policy, l, session.reviewAs);
    if (!gate.allowed) return { ok: false, message: gate.reason ?? "Gate held" };
    updateLedger((s) => ({
      ...s,
      signoffs: { ...s.signoffs, [l.id]: { by: `${role(session.reviewAs)} · Finance`, role: session.reviewAs, at: domain.clock.now } },
    }));
    return { ok: true };
  };

  return (
    <ConsolePage title={d.valTitle} lead={d.valLead}>
      <EqualHeightCardRow className="grid-cols-1 md:grid-cols-3">
        <Tile label={d.cashValidated} value={gbp(totals.cashValidated)} sub={d.cats["sourcing-saving"]} />
        <Tile label={d.avoidanceValidated} value={gbp(totals.avoidanceValidated)} sub={d.cats["cost-avoidance"]} />
        <Tile label={d.pipelineExpected} value={gbp(totals.expected)} sub={`${lines.filter((l) => l.state === "awaiting-invoice" || l.state === "awaiting-finance").length} ${d.cases}`} />
      </EqualHeightCardRow>

      <section className="overflow-hidden rounded-md border border-divider bg-white">
        <header className="flex items-center gap-3 px-4 pb-3 pt-3.5">
          <h2 className="min-w-0 flex-1 text-[15px] font-bold text-ink">{d.valTitle}</h2>
          <span className="text-[12.5px] text-mute">{d.reviewingAs(role(session.reviewAs))}</span>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-y border-divider bg-surface-fog/60">
              <tr>
                <Th>{d.cases}</Th>
                <Th>{d.category}</Th>
                <Th align="right">{d.baseline}</Th>
                <Th align="right">{d.value}</Th>
                <Th>{d.status}</Th>
                <Th>{d.evidenced}</Th>
                <Th>
                  <span className="sr-only">{d.signOff}</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="border-b border-divider last:border-0">
                  <Td>
                    <button type="button" onClick={() => go({ kind: "story", storyId: l.storyId })} className="flex flex-col items-start text-left hover:underline">
                      <span className="font-medium text-ink">{l.title}</span>
                      <span className="text-[12px] text-mute">{`${l.id} · ${l.caseId} · ${l.storyId}`}</span>
                    </button>
                  </Td>
                  <Td>{d.cats[l.category]}</Td>
                  <Td align="right">{l.category === "non-cash" ? "—" : gbp(l.baseline)}</Td>
                  <Td align="right" className="font-bold">
                    {l.category === "non-cash" ? "—" : gbp(l.value)}
                  </Td>
                  <Td>
                    <Chip tone={stateTone[l.state]}>{d.states[l.state]}</Chip>
                  </Td>
                  <Td className="max-w-[220px] truncate text-mute" title={l.measurement}>
                    {l.evidenceRef ?? (l.category === "non-cash" ? l.measurement : "—")}
                  </Td>
                  <Td align="right">
                    {l.state === "awaiting-invoice" && (
                      <ActionButton tone="ghost" onAction={recordEvidence(l)} icon={<FileCheck2 size={14} aria-hidden />}>
                        {d.recordEvidence}
                      </ActionButton>
                    )}
                    {l.state === "awaiting-finance" &&
                      (isFinance ? (
                        <ActionButton onAction={signOff(l)} icon={<PenLine size={14} aria-hidden />}>
                          {d.signOff}
                        </ActionButton>
                      ) : (
                        <span className="text-[12.5px] text-mute">{d.onlyRole(role("finance-bp"))}</span>
                      ))}
                    {l.state === "validated" && <span className="text-[12.5px] text-surface-deep">{d.signedBy(l.signedBy ?? "")}</span>}
                    {l.state === "pending" && (
                      <button type="button" onClick={() => go({ kind: "story", storyId: l.storyId })} className="inline-flex items-center gap-1 whitespace-nowrap text-[12.5px] text-surface-deep hover:underline">
                        {d.awaitingRun} <ArrowRight size={12} aria-hidden />
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-divider px-4 py-2.5 text-[12px] text-mute">{`HC08 · ${policy.version} · ${londonDateTime(domain.clock.now, lang)}`}</p>
      </section>
    </ConsolePage>
  );
}
