/**
 * Dashboard cards, in the original console's furniture: icon header with a
 * live count, divided rows, a "Show N more" footer. Each row opens the case
 * or page that owns it.
 */

import * as React from "react";
import { BellRing, MessageSquare, ChevronRight, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { cn } from "@/mro/lib/utils";
import { useApp } from "@/mro/state";
import { useProcurement } from "@/mro/data/store";
import { useChartAnimation } from "@/mro/lib/useChartAnimation";
import { gbp, gbpCompact } from "@/mro/domain/money";
import { siteById } from "@/mro/data/masterData";
import type { Role } from "@/mro/domain/types";
import { icons, TileIcon, ICON } from "@/mro/components/console/icons";
import { Chip } from "@/mro/components/desk/ui";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { useDashCopy } from "@/mro/components/dashboard/copy";
import type { DashboardModel, HeldBar, RequestPhase } from "@/mro/components/dashboard/model";

const ROWS = 4;

const C = {
  deep: "var(--accent-green-deep)",
  green: "var(--accent-green)",
  navy: "var(--accent-navy)",
  red: "var(--mark-red)",
  amber: "var(--mark-amber)",
  divider: "var(--divider)",
  mute: "var(--mute)",
};
const AXIS = { fontSize: 11, fill: C.mute } as const;

export const phaseFill: Record<RequestPhase, string> = { running: C.navy, waiting: C.amber, ordered: C.green, closed: C.deep };
const barFill: Record<HeldBar["tone"], string> = { red: C.red, amber: C.amber, navy: C.navy, deep: C.deep };

/* ── Card shell ─────────────────────────────────────────────────────────── */

export function DashCard({
  icon,
  title,
  right,
  moreCount = 0,
  onMore,
  children,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  right?: string;
  moreCount?: number;
  onMore?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const k = useDashCopy();
  return (
    <section className={cn("flex h-full min-w-0 flex-col rounded-md border border-divider bg-white", className)}>
      <header className="flex items-center gap-2.5 px-4 pb-2.5 pt-3.5">
        <span className="text-surface-deep" aria-hidden>
          {icon}
        </span>
        <h2 className="whitespace-nowrap text-[15px] font-bold leading-tight text-ink">{title}</h2>
        {right && <span className="ml-auto whitespace-nowrap text-[12px] text-ink tabular-nums">{right}</span>}
      </header>
      <div className="flex-1 border-t border-divider">{children}</div>
      {moreCount > 0 && onMore && (
        <button
          type="button"
          onClick={onMore}
          className="ui-pill mt-auto border-t border-divider px-4 py-2.5 text-center text-[13px] font-medium text-surface-deep hover:bg-surface-fog"
        >
          {k.showMore(moreCount)}
        </button>
      )}
    </section>
  );
}

/* ── Notifications ──────────────────────────────────────────────────────── */

export function NotificationsBell({ m }: { m: DashboardModel }) {
  const { go } = useApp();
  const { cases } = useProcurement();
  const { role } = useDeskCopy();
  const k = useDashCopy();
  const fromSuppliers = cases.filter((c) => c.status === "pending-review");
  const items = m.attention.slice(0, 6);
  const total = m.attention.length + fromSuppliers.length;

  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        aria-label={`${k.notifications} — ${k.needYou(total)}`}
        className="ui-pill relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-md border border-divider bg-white hover:bg-surface-rose/40 focus-visible:outline-2 focus-visible:outline-surface-deep"
      >
        <BellRing size={16} className={total ? "text-mark-red" : "text-mute"} strokeWidth={2} aria-hidden />
        {total > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center bg-mark-red px-[3px] text-[10.5px] font-bold leading-none text-ink-inverse ring-2 ring-white">
            {total}
          </span>
        )}
      </button>

      <div className="invisible absolute right-0 top-full z-50 w-[380px] translate-y-1 pt-2 opacity-0 transition-all duration-150 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="overflow-hidden rounded-lg border border-divider bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-divider bg-surface-fog/60 px-3.5 py-2.5">
            <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink">{k.notifications}</span>
            <span className="text-[12px] text-ink">{k.needYou(total)}</span>
          </div>
          {total === 0 && <p className="px-3.5 py-4 text-[13px] text-mute">{k.allClear}</p>}
          {fromSuppliers.length > 0 && (
            <div className="border-b border-divider">
              <div className="flex items-center gap-2 bg-surface-mint/40 px-3.5 py-2">
                <MessageSquare size={13} className="text-surface-deep" aria-hidden />
                <span className="text-[12px] font-bold text-surface-deep">{k.fromSuppliers}</span>
              </div>
              {fromSuppliers.map((c) => (
                <NoteRow key={c.id} tone="red" lead={c.id} line={k.supplierAsked} onOpen={() => go({ kind: "service-desk" })} />
              ))}
            </div>
          )}
          <div className="divide-y divide-divider">
            {items.map((a) => (
              <NoteRow
                key={a.key}
                tone={a.kind === "hold" ? "red" : "amber"}
                lead={`${a.ref} · ${role(a.role)}`}
                line={a.line}
                onOpen={() => go(a.open)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteRow({ tone, lead, line, onOpen }: { tone: "red" | "amber"; lead: string; line: string; onOpen: () => void }) {
  const k = useDashCopy();
  return (
    <button type="button" onClick={onOpen} className="ui-pill flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-mint/30">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone === "red" ? "bg-mark-red" : "bg-mark-amber")} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold leading-[18px] text-ink">{lead}</span>
        <span className="block truncate text-[12px] leading-[16px] text-ink" title={line}>
          {line}
        </span>
      </span>
      <span className="shrink-0 whitespace-nowrap text-[12px] font-bold text-surface-deep">{k.open}</span>
    </button>
  );
}

/* ── Requisitions ───────────────────────────────────────────────────────── */

const phaseTone: Record<RequestPhase, "ok" | "warn" | "info" | "mute"> = { running: "info", waiting: "warn", ordered: "ok", closed: "mute" };
const phaseBar: Record<RequestPhase, string> = { running: "bg-surface-navy", waiting: "bg-mark-amber", ordered: "bg-accent-green", closed: "bg-surface-deep" };

export function RequisitionsCard({ m }: { m: DashboardModel }) {
  const { go } = useApp();
  const k = useDashCopy();
  const rows = m.rows.requests.slice(0, ROWS);
  const maxV = Math.max(1, ...rows.map((r) => r.amount));

  return (
    <DashCard
      icon={<TileIcon icon={icons.requisitions} />}
      title={k.requisitions}
      right={k.reqRight(m.inFlight.length)}
      moreCount={Math.max(0, m.rows.requests.length - rows.length)}
      onMore={() => go({ kind: "requisitions" })}
    >
      <ul className="divide-y divide-divider">
        {rows.map((r) => (
          <li key={r.key}>
            <button type="button" onClick={() => go(r.open)} className="ui-pill w-full px-4 py-2 text-left transition-colors hover:bg-surface-fog">
              <div className="flex items-center gap-3">
                <span className="w-[118px] shrink-0 whitespace-nowrap text-[13px] font-medium text-ink tabular-nums">{r.ref}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink" title={r.title}>
                  {r.title}
                </span>
                <span className="shrink-0 whitespace-nowrap text-[13px] font-medium text-ink tabular-nums">{gbp(r.amount)}</span>
                <Chip tone={phaseTone[r.phase]}>{k.phase[r.phase]}</Chip>
                <ChevronRight size={ICON.row} strokeWidth={ICON.stroke} className="shrink-0 text-ink" aria-hidden />
              </div>
              <div className="ml-[130px] mr-[26px] mt-1.5 flex items-center gap-2">
                <div className="flex h-[5px] flex-1 overflow-hidden rounded-full bg-surface-fog">
                  <span className={cn("h-full rounded-full transition-[width] duration-700", phaseBar[r.phase])} style={{ width: `${Math.max(6, (r.amount / maxV) * 100)}%` }} />
                </div>
                <span className="shrink-0 whitespace-nowrap text-[11.5px] text-mute">
                  {[r.site && siteById[r.site]?.name, r.source === "story" ? k.story : k.catalogue].filter(Boolean).join(" · ")}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </DashCard>
  );
}

/* ── Decisions and holds ────────────────────────────────────────────────── */

export function AttentionCard({ m }: { m: DashboardModel }) {
  const { go } = useApp();
  const { role } = useDeskCopy();
  const k = useDashCopy();
  const rows = m.rows.attention.slice(0, ROWS);

  return (
    <DashCard
      icon={<TileIcon icon={icons.exception} />}
      title={k.exceptions}
      right={k.excRight(m.attention.length)}
      moreCount={Math.max(0, m.rows.attention.length - rows.length)}
      onMore={() => go({ kind: "desk" })}
    >
      <ul className="divide-y divide-divider">
        {rows.map((a) => (
          <li key={a.key}>
            <button type="button" onClick={() => go(a.open)} className="ui-pill flex w-full items-center gap-2.5 px-4 py-2 text-left transition-colors hover:bg-surface-fog">
              <span
                className={cn(
                  "w-[84px] shrink-0 whitespace-nowrap rounded px-1.5 py-1 text-center text-[11px] font-bold uppercase tracking-[0.05em]",
                  a.kind === "hold" ? "bg-mark-red text-ink-inverse" : "bg-surface-amber text-mark-amber",
                )}
              >
                {a.kind === "hold" ? k.hold : k.decision}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block whitespace-nowrap text-[13px] font-medium leading-[17px] text-ink">
                  {a.ref}
                  {a.amount ? <span className="ml-2 font-normal tabular-nums">{gbp(a.amount)}</span> : null}
                </span>
                <span className="block truncate text-[12px] leading-[15px] text-ink" title={a.line}>
                  {a.line}
                </span>
              </span>
              <span className="shrink-0 whitespace-nowrap text-[12px] font-medium text-surface-deep">{role(a.role)}</span>
            </button>
          </li>
        ))}
        {rows.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-mute">{k.nothingStopped}</li>}
      </ul>
    </DashCard>
  );
}

/* ── Invoice matching ───────────────────────────────────────────────────── */

export function InvoicesCard({ m }: { m: DashboardModel }) {
  const { go } = useApp();
  const k = useDashCopy();
  const rows = m.rows.invoices.slice(0, ROWS);
  const grid = "grid grid-cols-[minmax(0,1fr)_96px_150px] gap-3";

  return (
    <DashCard
      icon={<TileIcon icon={icons.invoice} />}
      title={k.invoices}
      right={k.invRight(gbp(m.heldInvoiceValue))}
      moreCount={Math.max(0, m.rows.invoices.length - rows.length)}
      onMore={() => go({ kind: "invoice-matching" })}
    >
      <div className={cn(grid, "border-b border-divider bg-surface-fog/60 px-4 py-2 text-[12px] font-medium uppercase tracking-[0.05em] text-ink")}>
        <span>{k.colInvoice}</span>
        <span>{k.colAmount}</span>
        <span>{k.colStatus}</span>
      </div>
      <ul className="divide-y divide-divider">
        {rows.map((i) => (
          <li key={i.id}>
            <button type="button" onClick={() => go({ kind: "case", caseId: i.caseId })} className={cn(grid, "ui-pill w-full items-center px-4 py-2 text-left transition-colors hover:bg-surface-fog")}>
              <span className="min-w-0">
                <span className="flex items-baseline gap-2 text-[13px] leading-[17px] text-ink">
                  <span className="shrink-0 font-medium">{i.id}</span>
                  <span className="min-w-0 truncate" title={i.caseTitle}>
                    {i.caseTitle}
                  </span>
                </span>
                <span className="block truncate text-[12px] leading-[15px] text-mute">{`${i.supplier} · ${k.invRecords(i.poId, i.receiptId)}`}</span>
              </span>
              <span className="whitespace-nowrap text-[13px] text-ink tabular-nums">{gbp(i.amount)}</span>
              <span
                className={cn(
                  "justify-self-start whitespace-nowrap px-2.5 py-1 text-[12px] font-medium",
                  i.status === "held" ? "bg-surface-rose text-mark-red" : "bg-surface-mint text-surface-deep",
                )}
              >
                {i.status === "held" ? k.heldAmt(gbp(i.variance)) : i.status === "credited" ? k.credited : k.matched}
              </span>
            </button>
          </li>
        ))}
        {rows.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-mute">{k.noInvoices}</li>}
      </ul>
    </DashCard>
  );
}

/* ── Charts ─────────────────────────────────────────────────────────────── */

function ChartTip({ active, payload }: { active?: boolean; payload?: { name?: string; value?: number; payload?: { label?: string } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-md border border-divider bg-white px-3 py-2 shadow-sm">
      <div className="text-[12px] font-semibold text-ink">{p.payload?.label ?? p.name}</div>
      <div className="text-[13px] text-ink tabular-nums">{typeof p.value === "number" && p.value > 1000 ? gbp(p.value) : p.value}</div>
    </div>
  );
}

export function HeldByReasonCard({ m }: { m: DashboardModel }) {
  const k = useDashCopy();
  const { role } = useDeskCopy();
  const animate = useChartAnimation();
  const label = (b: HeldBar) => (b.label === "invoice" ? k.barInvoice : b.label === "chase" ? k.barChase : b.label === "erp" ? k.barErp : role(b.label as Role));
  const data = m.heldBars.map((b) => ({ ...b, label: label(b) }));

  return (
    <section className="min-w-0 flex-1 rounded-md border border-divider bg-white">
      <header className="flex items-center gap-2.5 px-4 pb-2.5 pt-3.5">
        <span className="text-surface-deep" aria-hidden>
          <BarChart3 size={ICON.tile} strokeWidth={ICON.stroke} />
        </span>
        <h2 className="whitespace-nowrap text-[15px] font-bold leading-tight text-ink">{k.heldByReason}</h2>
        <span className="ml-auto whitespace-nowrap text-[12px] text-ink tabular-nums">{gbp(data.reduce((t, b) => t + b.value, 0))}</span>
      </header>
      <div className="border-t border-divider px-4 pb-3 pt-3">
        {data.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-mute">{k.noHeld}</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(96, data.length * 30 + 16)}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={C.divider} horizontal={false} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v: number) => gbpCompact(v)} />
              <YAxis type="category" dataKey="label" tick={AXIS} axisLine={false} tickLine={false} width={118} interval={0} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={16} isAnimationActive={animate}>
                {data.map((d) => (
                  <Cell key={d.key} fill={barFill[d.tone]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

export function StatusDonutCard({ m }: { m: DashboardModel }) {
  const k = useDashCopy();
  const animate = useChartAnimation();
  const data = m.statusMix.map((s) => ({ name: k.phase[s.phase], value: s.value, fill: phaseFill[s.phase] }));
  const shown = data.filter((d) => d.value > 0);

  return (
    <section className="min-w-0 flex-1 rounded-md border border-divider bg-white">
      <header className="flex items-center gap-2.5 px-4 pb-2.5 pt-3.5">
        <span className="text-surface-deep" aria-hidden>
          <PieChartIcon size={ICON.tile} strokeWidth={ICON.stroke} />
        </span>
        <h2 className="whitespace-nowrap text-[15px] font-bold leading-tight text-ink">{k.byStatus}</h2>
        <span className="ml-auto whitespace-nowrap text-[12px] text-ink tabular-nums">{m.requests.length}</span>
      </header>
      <div className="flex min-w-0 items-center gap-4 border-t border-divider px-4 pb-3 pt-2">
        <div className="shrink-0">
          <ResponsiveContainer width={116} height={110}>
            <PieChart>
              <Pie isAnimationActive={animate} data={shown} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="90%" paddingAngle={2} stroke="none">
                {shown.map((s) => (
                  <Cell key={s.name} fill={s.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChartTip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
          {data.map((s) => (
            <li key={s.name} className="flex items-center gap-2 text-[13px] text-ink">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.fill }} aria-hidden />
              <span className="min-w-0 truncate">{s.name}</span>
              <span className="ml-auto font-medium tabular-nums">{s.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
