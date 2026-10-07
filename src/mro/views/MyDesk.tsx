/**
 * The buyer's landing: New Request first, then three queues — requests in
 * flight, approvals waiting (marked when the current reviewer can decide),
 * and holds. Every row opens its case; nothing here commits a decision.
 */

import * as React from "react";
import { Plus, ArrowRight, Inbox, UserCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { useApp, type View } from "@/mro/state";
import { useProcurement } from "@/mro/data/store";
import { ConsolePage } from "@/mro/components/console/kit";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { gbp } from "@/mro/domain/money";
import { londonDateTime } from "@/mro/domain/clock";
import { touchMetrics } from "@/mro/domain/selectors";
import { siteById } from "@/mro/data/masterData";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { useWorkQueue } from "@/mro/components/desk/workQueue";
import { Chip, EqualHeightCardRow, OneLineText } from "@/mro/components/desk/ui";
import { useStoryCopy } from "@/mro/components/story/copy";

function Queue({
  title,
  icon,
  count,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-md border border-divider bg-white">
      <header className="flex items-center gap-2 px-4 pb-2.5 pt-3.5">
        <span className="text-surface-deep" aria-hidden>
          {icon}
        </span>
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">{title}</h2>
        <span className="rounded-full bg-surface-fog px-2 py-0.5 text-[12px] font-bold tabular-nums text-ink">{count}</span>
      </header>
      {count === 0 ? <p className="border-t border-divider px-4 py-6 text-center text-[13px] text-mute">{empty}</p> : <ul className="divide-y divide-divider border-t border-divider">{children}</ul>}
    </section>
  );
}

function Row({ open, children }: { open: View; children: React.ReactNode }) {
  const { go } = useApp();
  return (
    <li>
      <button type="button" onClick={() => go(open)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-fog">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">{children}</span>
        <ArrowRight size={14} className="shrink-0 text-mute" aria-hidden />
      </button>
    </li>
  );
}

export function MyDesk() {
  const { go } = useApp();
  const { domain, session, lang } = useProcurement();
  const { d, role } = useDeskCopy();
  const { c } = useStoryCopy();
  const { requests, approvals, exceptions } = useWorkQueue();
  const m = touchMetrics(domain);
  const mine = approvals.filter((a) => a.role === session.reviewAs);

  const statusLabel = (s: string) =>
    (({ done: c.status.done, ended: c.status.ended, waiting: c.status.waiting, running: c.status.running, ready: c.status.ready, "po-dispatched": d.dispatched, confirmed: d.acked, open: d.stepState.current, held: d.holdOpen }) as Record<string, string>)[s] ?? s;

  return (
    <ConsolePage title={d.deskTitle} lead={d.deskLead}>
      <SpringIn>
        <section className="flex flex-wrap items-center gap-4 rounded-md bg-surface-deep px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-bold leading-[24px] text-ink-inverse">{d.newRequest}</p>
            <p className="text-[13px] leading-[19px] text-ink-inverse/80">{d.newRequestHint}</p>
          </div>
          <div className="flex shrink-0 items-center gap-4 text-ink-inverse">
            <span className="text-[12.5px]">{`${d.reviewingAs(role(session.reviewAs))} · ${londonDateTime(domain.clock.now, lang)}`}</span>
            <button
              type="button"
              onClick={() => go({ kind: "agent", id: "intake" })}
              className="ui-pill inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-surface-mint px-4 py-2.5 text-[14px] font-bold text-surface-deep hover:brightness-105 active:translate-y-px"
            >
              <Plus size={16} aria-hidden /> {d.newRequest}
            </button>
          </div>
        </section>
      </SpringIn>

      <EqualHeightCardRow className="grid-cols-1 lg:grid-cols-3">
        <Queue title={d.qRequests} icon={<Inbox size={17} />} count={requests.length} empty={d.qEmptyRequests}>
          {requests.map((r) => (
            <Row key={r.key} open={r.open}>
              <span className="flex items-center gap-2">
                <OneLineText className="flex-1 text-[13.5px] font-bold text-ink">{r.title}</OneLineText>
                <span className="shrink-0 text-[13px] font-bold tabular-nums text-ink">{gbp(r.amount)}</span>
              </span>
              <span className="flex items-center gap-2">
                <OneLineText className="flex-1 text-[12px] text-mute">{[r.ref, r.site && siteById[r.site]?.name, r.source === "story" ? d.story : d.catalogue].filter(Boolean).join(" · ")}</OneLineText>
                <Chip tone={r.tone}>{statusLabel(r.status)}</Chip>
              </span>
            </Row>
          ))}
        </Queue>

        <Queue title={d.qApprovals} icon={<UserCheck size={17} />} count={approvals.length} empty={d.qEmptyApprovals}>
          {[...mine, ...approvals.filter((a) => !mine.includes(a))].map((a) => (
            <Row key={a.key} open={a.open}>
              <span className="flex items-center gap-2">
                <OneLineText className="flex-1 text-[13.5px] font-bold text-ink">{role(a.role)}</OneLineText>
                {a.amount !== undefined && <span className="shrink-0 text-[13px] font-bold tabular-nums text-ink">{gbp(a.amount)}</span>}
              </span>
              <OneLineText className="text-[12.5px] text-ink" title={a.task}>
                {a.task}
              </OneLineText>
              <span className="flex items-center gap-2">
                <OneLineText className="flex-1 text-[12px] text-mute">{`${a.ref}${a.slaHours ? ` · SLA ${a.slaHours}h` : ""}`}</OneLineText>
                {a.role === session.reviewAs && <Chip tone="ok">{d.youCanDecide}</Chip>}
              </span>
            </Row>
          ))}
        </Queue>

        <Queue title={d.qExceptions} icon={<ShieldAlert size={17} />} count={exceptions.length} empty={d.qEmptyExceptions}>
          {exceptions.map((e) => (
            <Row key={e.key} open={e.open}>
              <span className="flex items-center gap-2">
                <OneLineText className="flex-1 text-[13.5px] font-bold text-ink">{e.ref}</OneLineText>
                <Chip tone="warn">{role(e.role)}</Chip>
              </span>
              <OneLineText className="text-[12.5px] text-ink" title={e.reason}>
                {e.reason}
              </OneLineText>
            </Row>
          ))}
        </Queue>
      </EqualHeightCardRow>

      <section className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-divider bg-white px-4 py-3">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink">{d.touchMetrics}</h2>
        {[
          [d.completed, m.eligible],
          [d.noBuyerTouch, m.noBuyerTouch],
          [d.fullyTouchless, m.fullyTouchless],
        ].map(([label, n]) => (
          <span key={String(label)} className={cn("inline-flex items-baseline gap-1.5 text-[13px] text-mute")}>
            <span className="text-[18px] font-bold tabular-nums text-ink">{n}</span>
            {label}
          </span>
        ))}
        <span className="ml-auto text-[12px] text-mute">Flow 1 · {domain.policies.active}</span>
      </section>
    </ConsolePage>
  );
}
