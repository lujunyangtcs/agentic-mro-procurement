/**
 * Requisitions, read entirely from the domain and the story ledger: every
 * case created from New Request, and every story case that has started.
 * Rows open the case; the audit trail below shows who or what acted.
 */

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/mro/state";
import { ConsolePage, HeaderTools, Th, Td } from "@/mro/components/console/kit";
import { DomainCasesPanel } from "@/mro/components/cases/DomainCasesPanel";
import { gbp } from "@/mro/domain/money";
import { siteById } from "@/mro/data/masterData";
import { useT } from "@/mro/lib/i18n";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { useStoryCopy } from "@/mro/components/story/copy";
import { useWorkQueue } from "@/mro/components/desk/workQueue";
import { Chip } from "@/mro/components/desk/ui";

export function Requisitions() {
  const { go } = useApp();
  const { t } = useT();
  const { d } = useDeskCopy();
  const { c } = useStoryCopy();
  const { requests } = useWorkQueue();
  const [search, setSearch] = React.useState("");
  const q = search.trim().toLowerCase();
  const rows = requests.filter((r) => !q || `${r.ref} ${r.title} ${r.site ? siteById[r.site]?.name : ""}`.toLowerCase().includes(q));

  const label = (s: string) =>
    (({ done: c.status.done, ended: c.status.ended, waiting: c.status.waiting, running: c.status.running, ready: c.status.ready, "po-dispatched": d.dispatched, confirmed: d.acked, open: d.stepState.current, held: d.holdOpen }) as Record<string, string>)[s] ?? s;

  return (
    <ConsolePage title={t("req.title")} lead={d.deskLead} actions={<HeaderTools search={search} onSearch={setSearch} placeholder="Search…" />}>
      <section className="overflow-hidden rounded-md border border-divider bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-b border-divider bg-surface-fog/60">
              <tr>
                <Th>{t("col.case")}</Th>
                <Th>{d.request}</Th>
                <Th>{d.site}</Th>
                <Th>{d.category}</Th>
                <Th align="right">{t("col.value")}</Th>
                <Th>{d.status}</Th>
                <Th>
                  <span className="sr-only">{d.open}</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-divider last:border-0 hover:bg-surface-fog/50">
                  <Td className="font-medium">{r.ref}</Td>
                  <Td className="max-w-[340px] truncate" title={r.title}>
                    {r.title}
                  </Td>
                  <Td>{r.site ? siteById[r.site]?.name : "—"}</Td>
                  <Td>{r.source === "story" ? d.story : d.catalogue}</Td>
                  <Td align="right" className="font-bold">
                    {gbp(r.amount)}
                  </Td>
                  <Td>
                    <Chip tone={r.tone}>{label(r.status)}</Chip>
                  </Td>
                  <Td align="right">
                    <button type="button" onClick={() => go(r.open)} className="inline-flex items-center gap-1 whitespace-nowrap text-[12.5px] font-medium text-surface-deep hover:underline">
                      {d.open} <ArrowRight size={12} aria-hidden />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <p className="border-t border-divider px-4 py-6 text-center text-[13px] text-mute">{d.qEmptyRequests}</p>}
      </section>
      <DomainCasesPanel />
    </ConsolePage>
  );
}
