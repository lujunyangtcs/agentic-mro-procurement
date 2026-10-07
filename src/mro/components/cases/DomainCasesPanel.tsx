/**
 * Cases from the canonical domain. Read-only in Phase 1: every row was
 * produced by commands (submit → gate → approval → PO), and the audit trail
 * shows who or what acted — a policy approval is labelled as policy, never
 * as a person.
 */

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { useProcurement } from "@/mro/data/store";
import { caseSummaries, type CaseSummary } from "@/mro/domain/selectors";
import { gbp } from "@/mro/domain/money";
import { londonDateTime } from "@/mro/domain/clock";
import type { Actor, AuditEvent, Lane, ProcurementCase } from "@/mro/domain/types";
import { Panel, Th, Td } from "@/mro/components/console/kit";
import { useT } from "@/mro/lib/i18n";
import { cn } from "@/mro/lib/utils";

const laneTone: Record<Lane, string> = {
  touchless: "bg-surface-mint text-surface-deep",
  "tcs-review": "bg-surface-fog text-ink",
  "client-decision": "bg-surface-rose text-mark-red",
};

const statusTone: Record<ProcurementCase["status"], string> = {
  open: "bg-surface-fog text-ink",
  held: "bg-surface-rose text-mark-red",
  "po-dispatched": "bg-surface-mint text-surface-deep",
  closed: "bg-surface-fog text-mute",
};

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-medium", className)}>
      {children}
    </span>
  );
}

function ActorLabel({ actor }: { actor: Actor }) {
  const { t } = useT();
  if (actor.kind === "policy") {
    return (
      <span className="whitespace-nowrap">
        {t("actor.policy", { version: actor.policyVersion })}
        <span className="text-mute"> · {actor.mandateId}</span>
      </span>
    );
  }
  if (actor.kind === "agent") return <span className="whitespace-nowrap">{t("actor.agent", { id: actor.agentId })}</span>;
  return (
    <span className="whitespace-nowrap">
      {actor.name}
      <span className="text-mute"> · {actor.role}</span>
    </span>
  );
}

function AuditTrail({ events }: { events: AuditEvent[] }) {
  const { t } = useT();
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-divider">
          <Th>{t("col.when")}</Th>
          <Th>{t("col.event")}</Th>
          <Th>{t("col.actor")}</Th>
          <Th>{t("col.refs")}</Th>
        </tr>
      </thead>
      <tbody>
        {events.map((e) => (
          <tr key={e.id} className="border-b border-divider last:border-0">
            <Td className="whitespace-nowrap tabular-nums text-mute">{londonDateTime(e.at)}</Td>
            <Td className="whitespace-nowrap font-medium text-ink">{t(`event.${e.type}`)}</Td>
            <Td>
              <ActorLabel actor={e.actor} />
            </Td>
            <Td className="max-w-[320px] truncate text-mute" title={e.summary}>
              {e.sources.join(" · ")}
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function quantity(c: CaseSummary, t: (k: string) => string): string {
  const l = c.line;
  if (!l) return "";
  const priced = `${l.quantity} ${t(`uom.${l.uom}`)}`;
  return l.entered ? `${l.entered.quantity} ${t(`uom.${l.entered.uom}`)} · ${priced}` : priced;
}

export function DomainCasesPanel() {
  const { domain } = useProcurement();
  const { t } = useT();
  const cases = React.useMemo(() => caseSummaries(domain), [domain]);
  const [openId, setOpenId] = React.useState<string | null>(cases.length === 1 ? cases[0].id : null);

  return (
    <Panel className="min-w-0" title={t("cases.title")} sub={t("cases.sub")}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="border-y border-divider bg-surface-fog/60">
            <tr>
              <Th>{t("col.case")}</Th>
              <Th>{t("col.item")}</Th>
              <Th>{t("col.site")}</Th>
              <Th>{t("col.qty")}</Th>
              <Th>{t("col.lane")}</Th>
              <Th>{t("col.status")}</Th>
              <Th>{t("col.po")}</Th>
              <Th align="right">{t("col.value")}</Th>
              <Th>
                <span className="sr-only">{t("cases.showAudit")}</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const open = openId === c.id;
              return (
                <React.Fragment key={c.id}>
                  <tr className="border-b border-divider">
                    <Td>
                      <div className="whitespace-nowrap font-medium text-ink">{c.id}</div>
                      <div className="whitespace-nowrap text-[12px] text-mute">
                        {c.prId} · r{c.revision}
                      </div>
                    </Td>
                    <Td className="max-w-[260px] truncate" title={c.item}>
                      {c.item}
                    </Td>
                    <Td className="whitespace-nowrap">{c.siteName}</Td>
                    <Td className="whitespace-nowrap tabular-nums">{quantity(c, t)}</Td>
                    <Td>{c.lane ? <Pill className={laneTone[c.lane]}>{t(`lane.${c.lane}`)}</Pill> : <span className="text-mute">—</span>}</Td>
                    <Td>
                      <Pill className={statusTone[c.status]}>{t(`caseStatus.${c.status}`)}</Pill>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {c.po ? <span className="font-medium text-ink">{c.po.id}</span> : <span className="text-mute">—</span>}
                    </Td>
                    <Td align="right" className="whitespace-nowrap tabular-nums font-medium text-ink">
                      {gbp(c.total)}
                    </Td>
                    <Td align="right">
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-label={open ? t("cases.hideAudit") : t("cases.showAudit")}
                        onClick={() => setOpenId(open ? null : c.id)}
                        className="ui-pill rounded-md p-1.5 text-mute hover:bg-surface-fog hover:text-ink"
                      >
                        <ChevronDown size={16} className={cn("transition-transform", open && "rotate-180")} />
                      </button>
                    </Td>
                  </tr>
                  {open && (
                    <tr className="border-b border-divider bg-surface-fog/40">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="mb-2 text-[13px] font-semibold text-ink">{t("cases.audit", { id: c.id })}</div>
                        <div className="overflow-x-auto rounded-md border border-divider bg-white">
                          <AuditTrail events={c.audit} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {cases.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-[13px] text-mute">
                  {t("cases.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
