/**
 * Dashboard — the buyer's landing, restored to the original console layout:
 * header tools, the dark "today" banner with the position inline and New
 * request, four live tiles with sparklines, Requisitions beside New tickets
 * (the client use cases), Invoice matching beside the two charts.
 *
 * Every figure is read from the canonical domain record and the shared work
 * queue (useDashboardModel), so closing a case anywhere moves this page.
 */

import * as React from "react";
import { Sparkles, Plus } from "lucide-react";
import { useApp } from "@/mro/state";
import { useProcurement } from "@/mro/data/store";
import { LanguageSwitch } from "@/mro/lib/i18n";
import { gbp } from "@/mro/domain/money";
import { londonDateTime } from "@/mro/domain/clock";
import { KPIStrip, type KPI } from "@/mro/components/blocks/KPIStrip";
import { HeaderTools } from "@/mro/components/console/kit";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { useDashCopy } from "@/mro/components/dashboard/copy";
import { useDashboardModel } from "@/mro/components/dashboard/model";
import { UseCasesCard } from "@/mro/components/dashboard/UseCasesCard";
import {
  HeldByReasonCard,
  InvoicesCard,
  NotificationsBell,
  RequisitionsCard,
  StatusDonutCard,
} from "@/mro/components/dashboard/cards";

const initials = (label: string) =>
  label
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

export function Dashboard() {
  const { go } = useApp();
  const { session, lang } = useProcurement();
  const { role } = useDeskCopy();
  const k = useDashCopy();
  const [search, setSearch] = React.useState("");
  const m = useDashboardModel(search);

  /* Arriving from a long case page must land on the header, not mid-page. */
  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const first = m.approvals.find((a) => a.role === session.reviewAs) ?? m.approvals[0];
  const read1 = k.read1(m.inFlight.length, m.approvals.length, gbp(m.waitingValue), m.heldInvoices.length, gbp(m.heldInvoiceValue));
  const read2 = first ? k.priority(role(first.role), first.ref, first.task) : k.nothingWaiting(m.closed.length);
  const touchlessPct = m.touch.eligible ? Math.round((m.touch.fullyTouchless / m.touch.eligible) * 100) : 0;

  const kpis: KPI[] = [
    { label: k.kpiInFlight, value: m.inFlight.length, sub: k.kpiInFlightSub(m.sites, gbp(m.inFlightValue)), spark: m.spark.submitted, target: { kind: "requisitions" } },
    { label: k.kpiWaiting, value: m.approvals.length, sub: k.kpiWaitingSub(gbp(m.waitingValue)), spark: m.spark.approvals, target: { kind: "desk" } },
    { label: k.kpiClosed, value: m.closed.length, sub: k.kpiClosedSub(m.touch.fullyTouchless, m.touch.eligible), spark: m.spark.closed, target: { kind: "requisitions" } },
    { label: k.kpiInvoice, value: Math.round(m.heldInvoiceValue / 100), prefix: "£", sub: k.kpiInvoiceSub(m.heldInvoices.length, m.invoices.length), spark: m.spark.invoices, target: { kind: "invoice-matching" } },
  ];

  return (
    <div className="flex min-h-screen flex-col gap-3 bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))] pb-8 pl-5 pr-6 pt-4">
      {/* z-40: the bell's dropdown must paint over the banner below it. */}
      <SpringIn className="relative z-40 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[24px] font-bold leading-[29px] tracking-[-0.02em] text-ink">{k.title}</h1>
          <p className="whitespace-nowrap text-[12.5px] text-mute">{`${londonDateTime(m.now, lang)} · ${role(session.reviewAs)}`}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <HeaderTools search={search} onSearch={setSearch} placeholder={k.search} />
          <LanguageSwitch />
          <NotificationsBell m={m} />
          <span
            title={role(session.reviewAs)}
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-surface-deep text-[13px] font-bold text-ink-inverse"
          >
            {initials(role(session.reviewAs))}
          </span>
        </div>
      </SpringIn>

      <SpringIn>
        <section className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md bg-surface-deep px-5 py-4" aria-label={k.title}>
          <span className="shrink-0 self-start pt-0.5 text-surface-mint ai-pulse" aria-hidden>
            <Sparkles size={20} strokeWidth={1.75} />
          </span>
          <div className="min-w-[280px] max-w-[600px] flex-1">
            <p className="text-[14px] font-semibold leading-[20px] text-ink-inverse">
              <StreamingText key={read1} text={read1} cps={120} caret={false} />
            </p>
            <p className="mt-1 text-[13px] leading-[19px] text-ink-inverse">
              <StreamingText key={read2} text={read2} cps={160} startDelay={900} caret={false} />
            </p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-6">
            {[
              { n: String(m.approvals.length), l: k.statNeedYou },
              { n: gbp(m.heldInvoiceValue), l: k.statHeld },
              { n: `${touchlessPct}%`, l: k.statTouchless },
            ].map((s) => (
              <div key={s.l} className="text-right">
                <div className="text-[22px] font-bold leading-none text-surface-mint tabular-nums">{s.n}</div>
                <div className="mt-1 whitespace-nowrap text-[12px] text-ink-inverse">{s.l}</div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => go({ kind: "agent", id: "intake" })}
              className="ui-pill inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-surface-mint px-4 py-2.5 text-[14px] font-bold text-surface-deep transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-surface-mint active:translate-y-px"
            >
              <Plus size={16} aria-hidden /> {k.newRequest}
            </button>
          </div>
        </section>
      </SpringIn>

      <KPIStrip items={kpis} className="grid-cols-2 xl:grid-cols-4" />

      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1.55fr_1fr]">
        <RequisitionsCard m={m} />
        <UseCasesCard />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1.55fr_1fr]">
        <InvoicesCard m={m} />
        <div className="flex h-full min-w-0 flex-col gap-3">
          <HeldByReasonCard m={m} />
          <StatusDonutCard m={m} />
        </div>
      </div>
    </div>
  );
}
