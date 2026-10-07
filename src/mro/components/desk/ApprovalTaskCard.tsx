/**
 * The only way to decide a spend approval. Enabled for the role the task
 * names (or a DoA tier that covers the amount), for whoever the presenter is
 * reviewing as. There is no generic "approve anyway".
 */

import { UserRound, Clock, Check, X } from "lucide-react";
import type { ApprovalTask } from "@/mro/domain/types";
import { useProcurement } from "@/mro/data/store";
import { gbp } from "@/mro/domain/money";
import { londonDateTime } from "@/mro/domain/clock";
import { canDecide } from "@/mro/domain/caseView";
import { siteById } from "@/mro/data/masterData";
import { decideTask } from "@/mro/services/caseAutomation";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { ActionButton, Chip, KeyValue } from "@/mro/components/desk/ui";

export function ApprovalTaskCard({ task }: { task: ApprovalTask }) {
  const { domain, dispatch, session, setSession, lang } = useProcurement();
  const { d, role } = useDeskCopy();
  const allowed = canDecide(domain, task, session.reviewAs);
  const decided = !!task.outcome;
  const siteName = siteById[domain.cases[task.caseId]?.site]?.name ?? "UK";
  const name = (r: string) => `${siteName} ${role(r).toLowerCase()}`;

  const act = (outcome: "approved" | "rejected") => () => {
    const r = decideTask(dispatch, domain, task.id, outcome, session.reviewAs, name(session.reviewAs), outcome === "rejected" ? d.rejectReason : undefined);
    return r.ok ? { ok: true } : { ok: false, message: r.message };
  };

  return (
    <section
      aria-label={`${d.approvalTask} ${task.id}`}
      className={
        decided
          ? "flex flex-col gap-3 rounded-md border border-divider bg-white p-4"
          : "flex flex-col gap-3 rounded-md border border-[color-mix(in_srgb,var(--mark-amber)_40%,white)] bg-white p-4 shadow-[0_0_0_3px_color-mix(in_srgb,var(--mark-amber)_12%,transparent)]"
      }
    >
      <header className="flex items-start gap-3">
        <span className={decided ? "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-deep text-ink-inverse" : "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-amber text-mark-amber"}>
          {decided ? <Check size={17} strokeWidth={2.25} /> : <UserRound size={17} strokeWidth={1.75} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-bold leading-[19px] text-ink">{role(task.role)}</p>
            <Chip tone="info">Client</Chip>
            <span className="text-[12px] text-mute">{task.id}</span>
            {task.escalatedTo && <Chip tone="bad">{`→ ${role(task.escalatedTo)}`}</Chip>}
          </div>
          <p className="mt-1 text-[13.5px] leading-[19px] text-ink">{task.decision}</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 pl-12">
        <KeyValue label={d.amount} value={gbp(task.amount)} strong />
        <KeyValue label={d.due} value={<span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden />{londonDateTime(task.dueAt, lang)}</span>} />
        <KeyValue label="Evidence" value={task.evidenceRefs.join(" · ")} />
      </div>

      {decided ? (
        <p className="ml-12 rounded-md bg-surface-mint/50 px-3 py-2 text-[13px] font-medium text-surface-deep">
          {d.decided(task.outcome === "approved" ? d.approved : d.rejected, task.decidedBy?.kind === "human" ? task.decidedBy.name : "—")}
          {task.reason ? ` · ${task.reason}` : ""}
        </p>
      ) : (
        <div className="ml-12 flex flex-col gap-2">
          {!allowed && (
            <p className="text-[12.5px] leading-[18px] text-mute">
              {d.reviewingAs(role(session.reviewAs))} {d.onlyRole(role(task.role))}
            </p>
          )}
          <div className="flex flex-wrap items-start gap-2">
            {allowed ? (
              <>
                <ActionButton onAction={act("approved")} icon={<Check size={14} aria-hidden />}>
                  {d.approve}
                </ActionButton>
                <ActionButton tone="danger" onAction={act("rejected")} icon={<X size={14} aria-hidden />}>
                  {d.reject}
                </ActionButton>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setSession({ reviewAs: task.role })}
                className="ui-pill inline-flex items-center whitespace-nowrap rounded-md border border-divider bg-white px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-fog"
              >
                {d.switchTo(role(task.role))}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
