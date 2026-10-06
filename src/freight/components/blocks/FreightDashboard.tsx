import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipProps,
} from "recharts";
import { CardHeader } from "@/freight/components/agents/ConsoleKit";

/* ──────────────────────────────────────────────────────────────────────────
 * FreightDashboard — the CFO / COO "see-the-picture" analytics surface.
 *
 * Five enterprise panels that visualise what the freight-settlement workforce
 * has delivered for Northgate Paper Co.: overcharge recovered, demurrage avoided
 * by lane, the exception mix, the climbing touchless-settlement rate and a
 * carrier scorecard. Numbers tie out to the demo headline figures —
 * $1.18M recovered · $214K demurrage avoided · 71% touchless.
 *
 * Restrained, enterprise styling (Linear / Ramp / Tremor): thin axes, no heavy
 * gridlines, 11–12px labels, no drop shadows. Series colours come straight from
 * the design-system tokens via CSS variables.
 * ────────────────────────────────────────────────────────────────────────── */

/* ── Palette (design-system tokens) ──────────────────────────────────────── */
const C = {
  deep: "var(--accent-green-deep)", // #084337 — primary series
  green: "var(--accent-green)", // #277e6e — secondary primary
  mint: "var(--surface-mint)", // #c3e6e1 — light secondary
  sage: "var(--surface-sage)", // #44b4a1 — tertiary
  red: "var(--mark-red)", // #a6192e — exceptions
  rose: "var(--surface-rose)", // #ccbcb8 — muted exception
  divider: "var(--divider)", // #f0f0f0 — gridlines / axes
  mute: "var(--mute)", // #676767 — axis text
};

const AXIS_TICK = { fontSize: 11, fill: C.mute } as const;
const GRID_STROKE = C.divider;

/* ── Shared tooltip (calm card, tabular numbers) ─────────────────────────── */
function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: TooltipProps<number, string> & { formatter?: (v: number) => string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-divider bg-white px-3 py-2 shadow-sm">
      {label != null && (
        <div className="text-[11px] font-medium text-ink mb-0.5">{label}</div>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px] text-mute">
          <span
            className="inline-block h-2 w-2 rounded-sm shrink-0"
            style={{ background: (p.color as string) ?? C.deep }}
          />
          <span className="text-ink tabular-nums font-medium">
            {formatter ? formatter(Number(p.value)) : p.value}
          </span>
          {p.name && <span className="text-mute">{p.name}</span>}
        </div>
      ))}
    </div>
  );
}

/* ── Panel shell ─────────────────────────────────────────────────────────── */
function Panel({
  label,
  right,
  className,
  children,
}: {
  label: string;
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`bg-white border border-divider rounded-md p-4 flex flex-col ${className ?? ""}`}
    >
      <CardHeader label={label} right={right} />
      <div className="mt-3 flex-1">{children}</div>
    </article>
  );
}

/* ── Money helpers ───────────────────────────────────────────────────────── */
const fmtMoneyK = (v: number) =>
  v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(2)}M`
    : `$${Math.round(v / 1000)}K`;
const fmtPct = (v: number) => `${v}%`;

/* ── 1 · Overcharge recovered — trend ────────────────────────────────────── */
// 8 points climbing to a cumulative ~$1.18M recovered this quarter.
const recoveredTrend: { month: string; recovered: number }[] = [
  { month: "Nov", recovered: 412_000 },
  { month: "Dec", recovered: 506_000 },
  { month: "Jan", recovered: 583_000 },
  { month: "Feb", recovered: 671_000 },
  { month: "Mar", recovered: 798_000 },
  { month: "Apr", recovered: 902_000 },
  { month: "May", recovered: 1_041_000 },
  { month: "Jun", recovered: 1_180_000 },
];

function RecoveredTrendPanel() {
  return (
    <Panel
      label="Overcharge recovered · trend"
      right={
        <span className="text-[13px] font-bold text-surface-deep tabular-nums">
          $1.18M
        </span>
      }
    >
      <ResponsiveContainer width="100%" height={172}>
        <AreaChart
          data={recoveredTrend}
          margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="fd-recovered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.green} stopOpacity={0.28} />
              <stop offset="100%" stopColor={C.green} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="month"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: GRID_STROKE }}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={42}
            tickFormatter={(v) => fmtMoneyK(Number(v))}
          />
          <Tooltip
            cursor={{ stroke: C.divider }}
            content={<ChartTooltip formatter={fmtMoneyK} />}
          />
          <Area
            type="monotone"
            dataKey="recovered"
            name="recovered"
            stroke={C.deep}
            strokeWidth={2}
            fill="url(#fd-recovered)"
            dot={false}
            activeDot={{ r: 3.5, fill: C.deep }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}

/* ── 2 · Demurrage avoided by lane ───────────────────────────────────────── */
// Five managed lanes; values sum to ~$214K.
const demurrageByLane: { lane: string; avoided: number }[] = [
  { lane: "CHI→RIV", avoided: 61_400 },
  { lane: "ATL→NGT", avoided: 48_900 },
  { lane: "DAL→RIV", avoided: 41_200 },
  { lane: "SEA→NGT", avoided: 35_700 },
  { lane: "KC→RIV", avoided: 26_800 },
];

function DemurrageByLanePanel() {
  return (
    <Panel
      label="Demurrage avoided by lane"
      right={
        <span className="text-[13px] font-bold text-surface-deep tabular-nums">
          $214K
        </span>
      }
    >
      <ResponsiveContainer width="100%" height={172}>
        <BarChart
          data={demurrageByLane}
          margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
          barCategoryGap="32%"
        >
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="lane"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: GRID_STROKE }}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={42}
            tickFormatter={(v) => fmtMoneyK(Number(v))}
          />
          <Tooltip
            cursor={{ fill: "color-mix(in srgb, var(--surface-mint) 30%, transparent)" }}
            content={<ChartTooltip formatter={fmtMoneyK} />}
          />
          <Bar
            dataKey="avoided"
            name="avoided"
            fill={C.green}
            radius={[3, 3, 0, 0]}
            maxBarSize={38}
          />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

/* ── 3 · Exceptions by type (donut) ──────────────────────────────────────── */
const exceptionMix: { name: string; value: number; color: string }[] = [
  { name: "Fuel-surcharge mismatch", value: 34, color: C.deep },
  { name: "Un-owed demurrage", value: 26, color: C.green },
  { name: "Cube-out weight", value: 18, color: C.sage },
  { name: "Duplicate booking", value: 13, color: C.mint },
  { name: "Missing PO / shipment", value: 9, color: C.red },
];

function ExceptionsByTypePanel() {
  return (
    <Panel label="Exceptions by type">
      <div className="flex items-center gap-3">
        <div className="shrink-0" style={{ width: 132 }}>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={exceptionMix}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={62}
                paddingAngle={2}
                stroke="var(--background)"
                strokeWidth={2}
              >
                {exceptionMix.map((e) => (
                  <Cell key={e.name} fill={e.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex-1 min-w-0 space-y-1.5">
          {exceptionMix.map((e) => (
            <li key={e.name} className="flex items-center gap-2 text-[12px]">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ background: e.color }}
              />
              <span className="text-ink truncate flex-1 min-w-0">{e.name}</span>
              <span className="text-mute tabular-nums font-medium shrink-0">
                {e.value}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

/* ── 4 · Touchless settlement rate — trend ───────────────────────────────── */
// Climbs to 71% touchless.
const touchlessTrend: { month: string; rate: number }[] = [
  { month: "Nov", rate: 38 },
  { month: "Dec", rate: 44 },
  { month: "Jan", rate: 49 },
  { month: "Feb", rate: 55 },
  { month: "Mar", rate: 60 },
  { month: "Apr", rate: 64 },
  { month: "May", rate: 68 },
  { month: "Jun", rate: 71 },
];

function TouchlessTrendPanel() {
  return (
    <Panel
      label="Touchless settlement rate · trend"
      right={
        <span className="text-[13px] font-bold text-surface-deep tabular-nums">
          71%
        </span>
      }
    >
      <ResponsiveContainer width="100%" height={172}>
        <LineChart
          data={touchlessTrend}
          margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="month"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: GRID_STROKE }}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={34}
            domain={[0, 80]}
            tickFormatter={(v) => fmtPct(Number(v))}
          />
          <Tooltip
            cursor={{ stroke: C.divider }}
            content={<ChartTooltip formatter={fmtPct} />}
          />
          <Line
            type="monotone"
            dataKey="rate"
            name="touchless"
            stroke={C.deep}
            strokeWidth={2}
            dot={{ r: 2.5, fill: C.deep, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: C.deep }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Panel>
  );
}

/* ── 5 · Carrier scorecard (compact table) ───────────────────────────────── */
type CarrierRow = {
  carrier: string;
  onTime: number; // %
  defect: number; // %
  disputes: number;
  onContract: number; // %
};
const carriers: CarrierRow[] = [
  { carrier: "Summit Carriers", onTime: 96, defect: 1.4, disputes: 3, onContract: 98 },
  { carrier: "Ironwood Freight Lines", onTime: 93, defect: 2.1, disputes: 6, onContract: 95 },
  { carrier: "Cedar Haul Logistics", onTime: 89, defect: 3.6, disputes: 11, onContract: 91 },
  { carrier: "Apex Owner-Operators", onTime: 84, defect: 4.8, disputes: 14, onContract: 86 },
];

// Tone the on-time figure green→amber→red so the eye lands on weak carriers.
function onTimeTone(v: number): string {
  if (v >= 92) return "text-surface-deep";
  if (v >= 87) return "text-[#a25b00]";
  return "text-mark-red";
}

function CarrierScorecardPanel() {
  return (
    <Panel
      label="Carrier scorecard"
      right={<span className="text-[11px] text-mute">4 carriers</span>}
    >
      <div className="overflow-hidden rounded-md border border-divider">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-fog border-b border-divider">
              <th className="py-2 px-3 text-[11px] tracking-[0.06em] uppercase text-surface-deep font-semibold whitespace-nowrap">
                Carrier
              </th>
              <th className="py-2 px-3 text-[11px] tracking-[0.06em] uppercase text-surface-deep font-semibold text-right whitespace-nowrap">
                On-time
              </th>
              <th className="py-2 px-3 text-[11px] tracking-[0.06em] uppercase text-surface-deep font-semibold text-right whitespace-nowrap">
                Defect
              </th>
              <th className="py-2 px-3 text-[11px] tracking-[0.06em] uppercase text-surface-deep font-semibold text-right whitespace-nowrap">
                Disputes
              </th>
              <th className="py-2 px-3 text-[11px] tracking-[0.06em] uppercase text-surface-deep font-semibold text-right whitespace-nowrap">
                On-contract
              </th>
            </tr>
          </thead>
          <tbody>
            {carriers.map((c, ri) => (
              <tr
                key={c.carrier}
                className={ri % 2 ? "bg-surface-fog/40" : "bg-white"}
              >
                <td className="py-2 px-3 text-[13px] text-ink font-medium leading-tight whitespace-nowrap">
                  {c.carrier}
                </td>
                <td
                  className={`py-2 px-3 text-[13px] text-right tabular-nums font-bold leading-tight ${onTimeTone(
                    c.onTime,
                  )}`}
                >
                  {c.onTime}%
                </td>
                <td className="py-2 px-3 text-[13px] text-right tabular-nums text-ink leading-tight">
                  {c.defect.toFixed(1)}%
                </td>
                <td className="py-2 px-3 text-[13px] text-right tabular-nums text-ink leading-tight">
                  {c.disputes}
                </td>
                <td className="py-2 px-3 text-[13px] text-right tabular-nums text-ink leading-tight">
                  {c.onContract}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-mute leading-snug mt-2">
        On-time, defect and dispute rates roll up from settled loads across the
        Riverside and Eastbrook mills this quarter.
      </p>
    </Panel>
  );
}

/* ── Dashboard ───────────────────────────────────────────────────────────── */
export function FreightDashboard() {
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
        <RecoveredTrendPanel />
        <DemurrageByLanePanel />
        <ExceptionsByTypePanel />
        <TouchlessTrendPanel />
      </div>
      <CarrierScorecardPanel />
    </section>
  );
}
