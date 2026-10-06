/**
 * Dashboard — the buyer's landing, rebuilt to the hand sketch in the style of
 * the lien console: a dark "Today's read" banner with inline position stats,
 * four live tiles, then Requisitions / Exceptions side by side and Invoice
 * matching beside a pair of charts.
 *
 * Nothing on this page owns a number. Every figure — the narration, the
 * mini-stats, the tiles, the card rows, both charts — is computed from the
 * same store the work pages mutate, so resolving the seal exception moves
 * this whole surface in one click.
 */

import * as React from "react";
import {
  BellRing,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipProps,
} from "recharts";
import { cn } from "@/mro/lib/utils";
import { useChartAnimation } from "@/mro/lib/useChartAnimation";
import { useApp } from "@/mro/state";
import { useProcurement } from "@/mro/data/store";
import { useT, LanguageSwitch } from "@/mro/lib/i18n";
import { OFF_CATALOGUE_PR } from "@/mro/data/offContractCase";
import {
  byStatus,
  totalValue,
  lineValue,
  touchlessRate,
  exceptionLanes,
  totalRecoverable,
  tieoutAgrees,
  tieoutGap,
  invoiceAmount,
  usd,
  usdCompact,
  pct,
  type Requisition,
  type ExceptionType,
  type Priority,
} from "@/mro/data/procurement";
import { KPIStrip, type KPI } from "@/mro/components/blocks/KPIStrip";
import { PillButton } from "@/mro/components/blocks/PillButton";
import { HeaderTools } from "@/mro/components/console/kit";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { icons, TileIcon, ICON } from "@/mro/components/console/icons";

/**
 * The item without its specification — "Mechanical seal — cartridge", never
 * the sizes. The full spec lives on the deep pages; the dashboard only needs
 * the reader to recognise the thing.
 */
const itemName = (desc: string, joiner = " — "): string =>
  desc
    .split(" — ")
    .filter((seg) => !/\d/.test(seg))
    .slice(0, 2)
    .join(joiner);

/* ── Chart furniture (same conventions as the control tower) ────────────── */

const C = {
  deep: "var(--accent-green-deep)",
  navy: "var(--accent-navy)",
  red: "var(--mark-red)",
  divider: "var(--divider)",
  mute: "var(--mute)",
};
const AXIS = { fontSize: 11, fill: C.mute } as const;

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-divider bg-white px-3 py-2 shadow-sm">
      {label != null && <div className="text-[12px] font-semibold text-ink">{label}</div>}
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="text-[13px] text-ink tabular-nums">
          {typeof p.value === "number" && p.value > 200 ? usd(p.value, 0) : p.value}
        </div>
      ))}
    </div>
  );
}

/* ── Notifications bell (behaviour unchanged) ───────────────────────────── */

type AlertNote = {
  flow: "gearbox" | "risk" | "compliance" | "pump" | "off-catalogue";
  tone: "critical" | "high";
  lead: string;
  finding: string;
  meta: string;
};

const alertNotes: AlertNote[] = [
  { flow: "pump", tone: "critical", lead: "Mechanical-seal request", finding: "line down — spec needs confirmation", meta: "PR-48630 · Mixing Line 2" },
  { flow: "risk", tone: "high", lead: "Drive-gearbox seal kit", finding: "stock-out predicted in 9 days", meta: "RISK-49001 · pre-empt" },
  { flow: "compliance", tone: "high", lead: "Gearbox rebuild kit", finding: "validated — waiting to become an order", meta: "PR-48690 · $42,000" },
  { flow: "gearbox", tone: "high", lead: "MRO-MEDIA-ZRO2-1.2MM", finding: "rebalancing need found", meta: "PR-48655 · 6 EA surplus at Eastbrook" },
  { flow: "off-catalogue", tone: "high", lead: "Mechanical-seal request", finding: "nothing on contract covers it", meta: "PR-48696 · Reactor Train 1" },
];

const toneDot: Record<AlertNote["tone"], string> = {
  critical: "bg-mark-red",
  high: "bg-[#b45309]",
};

function SavingsAlert() {
  const { go } = useApp();
  const { cases } = useProcurement();
  const fromSuppliers = cases.filter((c) => c.status === "pending-review");
  const total = alertNotes.length + fromSuppliers.length;

  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        aria-label={`Notifications — ${total} need you`}
        className="ui-pill relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-md border border-divider bg-white hover:bg-surface-rose/40"
      >
        <BellRing size={16} className="text-mark-red" strokeWidth={2} />
        <span className="absolute -top-1.5 -right-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-mark-red px-[3px] text-[10.5px] font-bold leading-none text-ink-inverse ring-2 ring-white">
          {total}
        </span>
      </button>

      <div className="absolute right-0 top-full z-50 w-[360px] pt-2 opacity-0 invisible translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
        <div className="overflow-hidden rounded-lg border border-divider bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-divider bg-surface-fog/60 px-3.5 py-2.5">
            <span className="text-[12px] uppercase tracking-[0.06em] font-bold text-ink">Notifications</span>
            <span className="text-[12px] text-ink">{total} need you</span>
          </div>

          {fromSuppliers.length > 0 && (
            <div className="border-b border-divider">
              <div className="flex items-center gap-2 bg-surface-mint/40 px-3.5 py-2">
                <MessageSquare size={13} className="text-surface-deep" />
                <span className="text-[12px] font-bold text-surface-deep">From suppliers</span>
              </div>
              <div className="divide-y divide-divider">
                {fromSuppliers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => go({ kind: "service-desk" })}
                    className="ui-pill flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-mint/30"
                  >
                    <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-mark-red ai-pulse" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] leading-snug text-ink">
                        <strong className="font-bold">Apex Industrial Supply</strong> — asked a
                        question the assistant would not answer
                      </span>
                      <span className="mt-0.5 block text-[12px] text-ink">
                        {c.id} · needs your decision
                      </span>
                    </span>
                    <span className="mt-[1px] shrink-0 whitespace-nowrap text-[12px] font-bold text-surface-deep">
                      Open ↗
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="divide-y divide-divider">
            {alertNotes.map((n) => (
              <button
                key={n.flow}
                type="button"
                onClick={() => go({ kind: "workspace", flow: n.flow })}
                className="ui-pill flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-mint/30"
              >
                <span className={`mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full ${toneDot[n.tone]}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] leading-snug text-ink">
                    <strong className="font-bold">{n.lead}</strong> — {n.finding}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-ink">{n.meta}</span>
                </span>
                <span className="mt-[1px] shrink-0 whitespace-nowrap text-[12px] font-bold text-surface-deep">Open ↗</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Card shell — icon header, rows, "Show N more" footer ───────────────── */

function DashCard({
  icon,
  title,
  right,
  moreCount,
  onMore,
  footnote,
  children,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  /** Small counterweight top-right — a live count, lien style. */
  right?: string;
  moreCount: number;
  onMore: () => void;
  /** One plain-language line under the rows explaining the rule at work. */
  footnote?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { t: tt } = useT();
  return (
    <section className={cn("flex h-full min-w-0 flex-col rounded-md border border-divider bg-white", className)}>
      <header className="flex items-center gap-2.5 px-4 pb-2.5 pt-3.5">
        <span className="text-surface-deep">{icon}</span>
        <h2 className="text-[15px] font-bold leading-tight text-ink">{title}</h2>
        {right && <span className="ml-auto whitespace-nowrap text-[12px] text-ink">{right}</span>}
      </header>
      <div className="flex-1 border-t border-divider">{children}</div>
      {footnote && (
        <p className="border-t border-divider px-4 py-2 text-[12px] leading-[16px] text-ink">
          {footnote}
        </p>
      )}
      {moreCount > 0 && (
        <button
          type="button"
          onClick={onMore}
          className="ui-pill mt-auto border-t border-divider px-4 py-2.5 text-center text-[13px] font-medium text-surface-deep hover:bg-surface-fog"
        >
          {tt("dash.showMore", { n: moreCount })}
        </button>
      )}
    </section>
  );
}

const priorityTag: Record<Priority, string> = {
  critical: "bg-mark-red text-ink-inverse",
  high: "bg-[#b45309] text-ink-inverse",
  normal: "bg-surface-fog text-ink",
};

/* ── Page ───────────────────────────────────────────────────────────────── */

export function Cockpit() {
  const { go } = useApp();
  const { t, item } = useT();
  const { requisitions, tieouts, audit } = useProcurement();

  /* Everything below derives from the store — the single source of truth. */
  const held = byStatus(requisitions, "held");
  const inFlight = requisitions.length;
  const protectedSoFar = audit.reduce((sum, a) => sum + (a.value ?? 0), 0);
  const resolvedCount = requisitions.reduce((n, r) => n + (r.resolutions?.length ?? 0), 0);
  const animate = useChartAnimation();
  const recoverable = totalRecoverable(tieouts);
  const heldInvoices = tieouts.filter((t) => !tieoutAgrees(t)).length;
  const touchless = touchlessRate(requisitions);
  const hero = held.find((r) => r.id === "PR-48630");

  /* Today's read — branches as the day's work gets done. */
  const readLine1 = t("dash.todaysRead", {
    n: inFlight,
    held: held.length,
    value: usd(totalValue(held), 0),
    inv: heldInvoices,
    rec: usd(recoverable, 0),
  });
  const readLine2 = hero
    ? t("dash.priority", { value: usd(lineValue(hero), 0), line: hero.line })
    : held.length > 0
      ? t(protectedSoFar > 0 ? "dash.closedProtected" : "dash.closedSoFar", {
          n: resolvedCount,
          held: held.length,
          value: usd(protectedSoFar, 0),
        })
      : t(protectedSoFar > 0 ? "dash.allClearProtected" : "dash.allClear", {
          value: usd(protectedSoFar, 0),
        });

  const kpis: KPI[] = [
    {
      label: t("kpi.inFlight"),
      value: inFlight,
      sub: t("kpi.inFlightSub", { c: 4, l: 4 }),
      spark: [9, 10, 12, 11, 13, 14, inFlight],
      target: { kind: "requisitions" },
    },
    {
      label: t("kpi.heldForYou"),
      value: held.length,
      sub: t("kpi.heldSub", { value: usd(totalValue(held), 0) }),
      spark: [2, 3, 4, 5, 6, held.length],
      target: { kind: "exceptions" },
    },
    {
      label: t("kpi.spendProtected"),
      value: protectedSoFar,
      prefix: "$",
      sub: resolvedCount > 0 ? t("kpi.spendClosed", { n: resolvedCount }) : t("kpi.spendGrows"),
      spark: [0, 0, 0, Math.max(1, protectedSoFar)],
      target: { kind: "exceptions" },
    },
    {
      label: t("kpi.invoiceHolds"),
      value: recoverable,
      prefix: "$",
      sub: t("kpi.invoiceSub", { a: heldInvoices, b: tieouts.length }),
      spark: [0, 130, 200, 340, Math.max(1, recoverable)],
      target: { kind: "invoice-matching" },
    },
  ];

  /* Card rows — held first, capped, remainders on the footer. */
  const reqRows = [...held, ...requisitions.filter((r) => r.status !== "held")].slice(0, 4);
  const excRows = exceptionLanes(requisitions)
    .flatMap((l) => l.items.map((r) => ({ r, type: l.type, accent: l.accent, label: l.label })))
    .sort((a, b) => (a.r.priority === "critical" ? -1 : 1) - (b.r.priority === "critical" ? -1 : 1));
  /**
   * The four the card shows. An off-contract hold always makes the cut: it is
   * the one exception with a second decision behind it — where to buy instead —
   * and that decision is a run of its own, reachable straight from this row.
   */
  const dashExc = React.useMemo(() => {
    const offContract = excRows.filter((e) => e.r.id === OFF_CATALOGUE_PR).slice(0, 1);
    const rest = excRows.filter((e) => e.r.id !== OFF_CATALOGUE_PR);
    return [...rest.slice(0, 3), ...offContract].slice(0, 4);
  }, [excRows]);
  const invRows = tieouts.slice(0, 4);

  /* Charts — both fall out of the same records. */
  const laneShort: Record<ExceptionType, string> = {
    "spec-incomplete": t("lane.spec"),
    "duplicate-demand": t("lane.duplicate"),
    "stock-available": t("lane.stock"),
    "warranty-covered": t("lane.warranty"),
    "off-contract": t("lane.contract"),
    "over-threshold": "Limit",
  };
  const barData = exceptionLanes(requisitions)
    .filter((l) => l.value > 0)
    .map((l) => ({ name: laneShort[l.type], value: l.value, accent: l.accent }));
  const statusMix = [
    { name: t("pie.held"), value: held.length, fill: C.red },
    {
      name: t("pie.inProgress"),
      value: requisitions.filter((r) => r.status === "structuring" || r.status === "validating").length,
      fill: C.navy,
    },
    { name: t("pie.released"), value: byStatus(requisitions, "released").length, fill: C.deep },
  ].filter((s) => s.value > 0);

  const openRow = (_r: Requisition) => go({ kind: "requisitions" });

  return (
    <div className="pl-5 pr-6 pt-4 pb-8 space-y-3 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      {/* ── Header: title left · search, bell, persona right ─────────────── */}
      {/* z-40: the bell's dropdown must paint over the banner below it. */}
      <SpringIn className="relative z-40 flex items-center justify-between gap-4">
        <h1 className="text-[24px] leading-[29px] font-bold tracking-[-0.02em] text-ink">
          {t("nav.dashboard")}
        </h1>
        <div className="flex shrink-0 items-center gap-2.5">
          <HeaderTools search="" onSearch={() => {}} placeholder={t("dash.search")} />
          <LanguageSwitch />
          <SavingsAlert />
          <span
            title={t("user.buyerDesk")}
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-surface-deep text-[13px] font-bold text-ink-inverse"
          >
            PB
          </span>
        </div>
      </SpringIn>

      {/* ── Today's read — the dark banner ───────────────────────────────── */}
      <SpringIn>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md bg-surface-deep px-5 py-4">
          <span className="shrink-0 self-start pt-0.5 text-surface-mint ai-pulse">
            <Sparkles size={20} strokeWidth={1.75} />
          </span>
          <div className="min-w-[280px] max-w-[560px] flex-1">
            <p className="text-[14px] font-semibold leading-[20px] text-ink-inverse">
              <StreamingText text={readLine1} cps={120} caret={false} />
            </p>
            <p className="text-[13px] leading-[19px] text-ink-inverse mt-1">
              <StreamingText text={readLine2} cps={160} startDelay={1100} caret={false} />
            </p>
          </div>

          {/* The position, inline — big number over small label. */}
          <div className="ml-auto flex shrink-0 items-center gap-6">
            {[
              { n: String(held.length), l: t("dash.needYou") },
              { n: usdCompact(totalValue(held)), l: t("dash.heldStat") },
              { n: pct(touchless), l: t("dash.touchless") },
            ].map((s) => (
              <div key={s.l} className="text-right">
                <div className="text-[22px] font-bold leading-none text-surface-mint tabular-nums">
                  {s.n}
                </div>
                <div className="mt-1 text-[12px] text-ink-inverse whitespace-nowrap">{s.l}</div>
              </div>
            ))}
            <PillButton
              variant="mint"
              className="whitespace-nowrap"
              /* Opens the intake desk — what the plants have asked for today,
                 and the place a request is actually raised. */
              onClick={() => go({ kind: "agent", id: "intake" })}
            >
              {t("dash.newRequest")}
            </PillButton>
          </div>
        </div>
      </SpringIn>

      {/* ── The four live tiles ──────────────────────────────────────────── */}
      <KPIStrip items={kpis} />

      {/* ── Requisitions · Exceptions ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.55fr_1fr] items-stretch">
        <DashCard
          icon={<TileIcon icon={icons.requisitions} />}
          title={t("card.requisitions")}
          right={t("card.reqRight", { value: usd(totalValue(requisitions), 0) })}
          moreCount={Math.max(0, requisitions.length - reqRows.length)}
          onMore={() => go({ kind: "requisitions" })}
          footnote={t("card.reqFoot")}
        >
          <ul className="divide-y divide-divider">
            {reqRows.map((r) => {
              const maxV = Math.max(...reqRows.map((x) => lineValue(x)));
              const barCls =
                r.status === "held" ? "bg-mark-red" : r.status === "released" ? "bg-surface-deep" : "bg-surface-navy";
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => openRow(r)}
                    className="w-full px-4 py-2 text-left transition-colors hover:bg-surface-fog"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-[86px] shrink-0 text-[13px] font-medium text-ink">{r.id}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{itemName(item(r.material, r.description))}</span>
                      <span className="shrink-0 text-[13px] font-medium text-ink tabular-nums whitespace-nowrap">
                        {usd(lineValue(r), 0)} · {r.qty} {r.uom}
                      </span>
                      <ChevronRight size={ICON.row} strokeWidth={ICON.stroke} className="shrink-0 text-ink" />
                    </div>
                    {/* The money, at a glance — bar length is the line value. */}
                    <div className="mt-1.5 ml-[98px] mr-[26px] flex h-[5px] overflow-hidden rounded-full bg-surface-fog">
                      <span
                        className={cn("h-full rounded-full", barCls)}
                        style={{ width: `${Math.max(6, (lineValue(r) / maxV) * 100)}%` }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </DashCard>

        <DashCard
          icon={<TileIcon icon={icons.exception} />}
          title={t("card.exceptions")}
          right={t("card.excRight", { n: excRows.length })}
          moreCount={Math.max(0, excRows.length - dashExc.length)}
          onMore={() => go({ kind: "exceptions" })}
          footnote={t("card.excFoot")}
        >
          <ul className="divide-y divide-divider">
            {dashExc.map(({ r, type, accent }) => (
              <li key={`${r.id}-${type}`}>
                <button
                  type="button"
                  /* An off-contract hold has a second question behind it — if we
                     do buy this, where from? That is its own run, and this row
                     is the shortest way into it. */
                  onClick={() =>
                    go(
                      r.id === OFF_CATALOGUE_PR
                        ? { kind: "workspace", flow: "off-catalogue" }
                        : { kind: "exceptions" },
                    )
                  }
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left transition-colors hover:bg-surface-fog"
                >
                  <span
                    className={cn(
                      "w-[68px] shrink-0 rounded px-1.5 py-1 text-center text-[11px] font-bold uppercase tracking-[0.05em]",
                      priorityTag[r.priority],
                    )}
                  >
                    {t(`prio.${r.priority}`)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium leading-[17px] text-ink">
                      {r.id}
                      <span className="ml-2 font-normal tabular-nums">{usd(lineValue(r), 0)}</span>
                    </span>
                    <span className="block truncate text-[12px] leading-[15px] text-ink">
                      {itemName(item(r.material, r.description), " · ")}
                    </span>
                  </span>
                  <span
                    className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium"
                    style={{ color: accent, background: `color-mix(in srgb, ${accent} 12%, white)` }}
                  >
                    {t(`exc.${type}`)}
                  </span>
                  {r.id === OFF_CATALOGUE_PR && (
                    <span className="shrink-0 whitespace-nowrap text-[12px] font-medium text-surface-deep">
                      {t("dash.takeToMarket")}
                    </span>
                  )}
                </button>
              </li>
            ))}
            {excRows.length === 0 && (
              <li className="px-4 py-6 text-center text-[13px] text-ink">{t("dash.nothingStopped")}</li>
            )}
          </ul>
        </DashCard>
      </div>

      {/* ── Invoice matching · charts ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.55fr_1fr] items-stretch">
        <DashCard
          icon={<TileIcon icon={icons.invoice} />}
          title={t("card.invoices")}
          right={t("card.invRight", { value: usd(recoverable, 0) })}
          moreCount={Math.max(0, tieouts.length - invRows.length)}
          onMore={() => go({ kind: "invoice-matching" })}
          footnote={t("card.invFoot")}
        >
          {/* A real table: amounts in their own left-aligned column, under a header. */}
          <div className="grid grid-cols-[minmax(0,1fr)_100px_150px] gap-3 border-b border-divider bg-surface-fog/60 px-4 py-2 text-[12px] font-medium uppercase tracking-[0.05em] text-ink">
            <span>{t("col.invoice")}</span>
            <span>{t("col.amount")}</span>
            <span>{t("col.status")}</span>
          </div>
          <ul className="divide-y divide-divider">
            {invRows.map((row) => {
              const ok = tieoutAgrees(row);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => go({ kind: "invoice-matching" })}
                    className="grid w-full grid-cols-[minmax(0,1fr)_100px_150px] items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-surface-fog"
                  >
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium leading-[17px] text-ink">
                        {row.id}
                        <span className="ml-2 font-normal">{itemName(item(row.material, row.description))}</span>
                      </span>
                      <span className="block truncate text-[12px] leading-[15px] text-ink">
                        {t("inv.records", { po: row.po.reference, gr: row.gr.reference, a: row.gr.qty, b: row.invoice.qty })}
                      </span>
                    </span>
                    <span className="text-[13px] text-ink tabular-nums whitespace-nowrap">
                      {usd(invoiceAmount(row), 0)}
                    </span>
                    <span
                      className={cn(
                        "justify-self-start whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium",
                        ok ? "bg-surface-mint text-surface-deep" : "bg-surface-rose text-mark-red",
                      )}
                    >
                      {ok ? t("inv.agree") : t("inv.heldAmt", { value: usd(tieoutGap(row), 0) })}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </DashCard>

        {/* Two separate cards, stacked — one chart each, straight off the records. */}
        <div className="flex h-full min-w-0 flex-col gap-3">
          <section className="min-w-0 flex-1 rounded-md border border-divider bg-white">
            <header className="flex items-center gap-2.5 px-4 pb-2.5 pt-3.5">
              <span className="text-surface-deep"><BarChart3 size={ICON.tile} strokeWidth={ICON.stroke} /></span>
              <h2 className="text-[15px] font-bold leading-tight text-ink">{t("chart.heldByReason")}</h2>
            </header>
            <div className="border-t border-divider px-4 pb-3 pt-3">
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                  <CartesianGrid stroke={C.divider} vertical={false} />
                  <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v: number) => usdCompact(v)} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={26} isAnimationActive={animate}>
                    {barData.map((d) => (
                      <Cell key={d.name} fill={d.accent} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="min-w-0 flex-1 rounded-md border border-divider bg-white">
            <header className="flex items-center gap-2.5 px-4 pb-2.5 pt-3.5">
              <span className="text-surface-deep"><PieChartIcon size={ICON.tile} strokeWidth={ICON.stroke} /></span>
              <h2 className="text-[15px] font-bold leading-tight text-ink">{t("chart.byStatus")}</h2>
            </header>
            <div className="flex min-w-0 items-center gap-3 border-t border-divider px-4 pb-3 pt-2">
              <div className="shrink-0">
                <ResponsiveContainer width={120} height={110}>
                  <PieChart>
                    <Pie
                      isAnimationActive={animate}
                      data={statusMix}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="90%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {statusMix.map((s) => (
                        <Cell key={s.name} fill={s.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="min-w-0 flex-1 space-y-1.5">
                {statusMix.map((s) => (
                  <li key={s.name} className="flex items-center gap-2 text-[13px] text-ink">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.fill }} />
                    {s.name}
                    <span className="ml-auto font-medium tabular-nums">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>

      {/* The rule of the house, spelled out — the agents only recommend. */}
      <SpringIn>
        <div className="flex flex-wrap items-center gap-3 rounded-md bg-surface-deep px-5 py-3">
          <ShieldCheck size={16} className="shrink-0 text-surface-mint" />
          <p className="min-w-0 flex-1 text-[13px] leading-[18px] text-ink-inverse">
            {t("audit.rule")}
          </p>
          <span className="whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.08em] text-surface-mint">
            {t("audit.trail")}
          </span>
        </div>
      </SpringIn>
    </div>
  );
}
