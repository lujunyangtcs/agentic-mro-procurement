/**
 * Control tower over the UK sites, in GBP. Every figure is computed from the
 * same queue, value records and opportunities the work pages use; picking a
 * site drills to its cases. Nothing here is a stored number.
 */

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { useApp } from "@/mro/state";
import { useLedger } from "@/mro/services/demoLedger";
import { SITES } from "@/mro/data/masterData";
import type { SiteId } from "@/mro/domain/types";
import { gbp } from "@/mro/domain/money";
import { valueLines, valueTotals } from "@/mro/domain/storyValue";
import { ConsolePage, Th, Td } from "@/mro/components/console/kit";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { useWorkQueue } from "@/mro/components/desk/workQueue";
import { Chip, EqualHeightCardRow } from "@/mro/components/desk/ui";

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <article className="flex flex-col gap-0.5 rounded-md border border-divider bg-white px-4 py-3.5">
      <span className="truncate text-[12px] font-bold uppercase tracking-[0.05em] text-mute">{label}</span>
      <span className="text-[26px] font-bold tabular-nums leading-[32px] text-ink">{value}</span>
      <span className="truncate text-[12.5px] text-mute">{sub}</span>
    </article>
  );
}

export function ControlTower() {
  const { go } = useApp();
  const ledger = useLedger();
  const { d, role } = useDeskCopy();
  const { requests, approvals, exceptions } = useWorkQueue();
  const [site, setSite] = React.useState<SiteId | null>(null);
  const lines = valueLines(ledger);
  const totals = valueTotals(lines);
  const live = Object.values(ledger.opportunities).filter((o) => o.state === "live").length;

  const perSite = SITES.map((s) => {
    const rs = requests.filter((r) => r.site === s.id);
    return {
      site: s,
      cases: rs.length,
      inFlight: rs.filter((r) => r.status !== "done" && r.status !== "ended" && r.status !== "confirmed").reduce((t, r) => t + r.amount, 0),
      tasks: approvals.filter((a) => rs.some((r) => r.ref === a.ref)).length,
    };
  });

  const byRole = Array.from(new Set(approvals.map((a) => a.role))).map((r) => ({ role: r, n: approvals.filter((a) => a.role === r).length }));
  const drill = site ? requests.filter((r) => r.site === site) : [];

  return (
    <ConsolePage title={d.ctTitle} lead={d.ctLead}>
      <EqualHeightCardRow className="grid-cols-2 xl:grid-cols-4">
        <Tile label={d.inFlight} value={gbp(perSite.reduce((t, s) => t + s.inFlight, 0))} sub={`${requests.length} ${d.cases}`} />
        <Tile label={d.pipelineExpected} value={gbp(totals.expected)} sub={d.valTitle} />
        <Tile label={d.cashValidated} value={gbp(totals.cashValidated + totals.avoidanceValidated)} sub={`${d.cats["sourcing-saving"]} + ${d.cats["cost-avoidance"]}`} />
        <Tile label={d.openTasks} value={String(approvals.length)} sub={`${exceptions.length} ${d.qExceptions.toLowerCase()} · ${live} ${d.live.toLowerCase()} ${d.oppTitle.toLowerCase()}`} />
      </EqualHeightCardRow>

      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-md border border-divider bg-white">
          <table className="w-full border-collapse">
            <thead className="border-b border-divider bg-surface-fog/60">
              <tr>
                <Th>{d.site}</Th>
                <Th align="right">{d.cases}</Th>
                <Th align="right">{d.inFlight}</Th>
                <Th align="right">{d.openTasks}</Th>
                <Th>
                  <span className="sr-only">{d.drill}</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {perSite.map((s) => (
                <tr key={s.site.id} className={cn("border-b border-divider last:border-0", site === s.site.id && "bg-surface-mint/40")}>
                  <Td>
                    <span className="block font-medium text-ink">{s.site.name}</span>
                    <span className="block text-[12px] text-mute">{`${s.site.id} · ${s.site.function}`}</span>
                  </Td>
                  <Td align="right">{s.cases}</Td>
                  <Td align="right" className="font-bold">
                    {gbp(s.inFlight)}
                  </Td>
                  <Td align="right">{s.tasks > 0 ? <Chip tone="warn">{s.tasks}</Chip> : "0"}</Td>
                  <Td align="right">
                    <button
                      type="button"
                      disabled={s.cases === 0}
                      onClick={() => setSite(site === s.site.id ? null : s.site.id)}
                      aria-pressed={site === s.site.id}
                      className="inline-flex items-center gap-1 whitespace-nowrap text-[12.5px] font-medium text-surface-deep hover:underline disabled:text-mute disabled:no-underline"
                    >
                      {d.drill} <ArrowRight size={12} aria-hidden />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
          {site && (
            <ul className="divide-y divide-divider border-t border-divider bg-surface-fog/40">
              {drill.map((r) => (
                <li key={r.key}>
                  <button type="button" onClick={() => go(r.open)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white">
                    <span className="w-[150px] shrink-0 text-[13px] font-medium text-ink">{r.ref}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{r.title}</span>
                    <span className="shrink-0 text-[13px] font-bold tabular-nums text-ink">{gbp(r.amount)}</span>
                    <ArrowRight size={13} className="shrink-0 text-mute" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col rounded-md border border-divider bg-white">
          <h2 className="px-4 pb-2 pt-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-ink">{`${d.openTasks} · SLA`}</h2>
          {byRole.length === 0 ? (
            <p className="border-t border-divider px-4 py-5 text-center text-[13px] text-mute">{d.qEmptyApprovals}</p>
          ) : (
            <ul className="divide-y divide-divider border-t border-divider">
              {byRole.map((r) => (
                <li key={r.role} className="flex items-center gap-2 px-4 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{role(r.role)}</span>
                  <Chip tone="warn">{r.n}</Chip>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ConsolePage>
  );
}
