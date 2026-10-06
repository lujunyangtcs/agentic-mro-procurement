/**
 * Procurement control tower — the group-level picture.
 *
 * Five sites, five languages, one reporting structure. Each site books spend in
 * its own words; the workforce maps those local descriptions onto a single set
 * of categories, which is the only reason a network view is possible at all.
 *
 * Cut by country and by role, with the leak, the exposure and the ranking all
 * computed from `spend.ts`. Ask it a question and the answer is worked out from
 * the same figures the charts are drawn from, so the two can never disagree.
 */

import * as React from "react";
import {
  ResponsiveContainer,
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
import { Globe, TriangleAlert, Languages as LanguagesIcon } from "lucide-react";
import { icons, TileIcon } from "@/mro/components/console/icons";
import { cn } from "@/mro/lib/utils";
import { useChartAnimation } from "@/mro/lib/useChartAnimation";
import {
  spendLines,
  sites,
  siteByCountry,
  personas,
  categories,
  applyFilter,
  total,
  offContract,
  offContractShare,
  byCountry,
  byCategory,
  byChannel,
  byPersona,
  bySupplier,
  riskFlags,
  towerQuestions,
  type Filter,
  type CountryCode,
  type PersonaId,
} from "@/mro/data/spend";
import { usd, usdCompact } from "@/mro/data/procurement";
import { ConsolePage, StatTiles, Panel, Th, Td } from "@/mro/components/console/kit";
import { AskAssistant } from "@/mro/components/console/AskAssistant";
import { SpringIn } from "@/mro/components/ai/SpringIn";

/* ── Palette, straight from the design-system tokens ────────────────────── */
const C = {
  deep: "var(--accent-green-deep)",
  green: "var(--accent-green)",
  sage: "var(--surface-sage)",
  mint: "var(--surface-mint)",
  red: "var(--mark-red)",
  rose: "var(--surface-rose)",
  divider: "var(--divider)",
  mute: "var(--mute)",
};

const AXIS = { fontSize: 12, fill: C.mute } as const;

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-divider bg-white px-3 py-2 shadow-sm">
      {label != null && <div className="text-[12px] font-semibold text-ink">{label}</div>}
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="text-[13px] text-ink tabular-nums">
          {usd(Number(p.value), 0)}
        </div>
      ))}
    </div>
  );
}

/* ── Filter bar ─────────────────────────────────────────────────────────── */

function FilterBar({ filter, onChange }: { filter: Filter; onChange: (f: Filter) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-divider bg-white px-4 py-2.5">
      <div className="flex items-center gap-2">
        <Globe size={15} className="text-mute" />
        <span className="text-[13px] font-medium text-mute whitespace-nowrap">Country</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip on={filter.country === "all"} onClick={() => onChange({ ...filter, country: "all" })}>
            All
          </Chip>
          {sites.map((s) => (
            <Chip
              key={s.country}
              on={filter.country === s.country}
              onClick={() => onChange({ ...filter, country: s.country as CountryCode })}
            >
              {s.countryName}
            </Chip>
          ))}
        </div>
      </div>

      <span className="hidden h-6 w-px bg-divider lg:block" />

      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium text-mute whitespace-nowrap">Role</span>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip on={filter.persona === "all"} onClick={() => onChange({ ...filter, persona: "all" })}>
            All
          </Chip>
          {personas.map((p) => (
            <Chip
              key={p.id}
              on={filter.persona === p.id}
              onClick={() => onChange({ ...filter, persona: p.id as PersonaId })}
            >
              {p.label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ui-pill whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
        on
          ? "border-surface-deep bg-surface-deep text-ink-inverse"
          : "border-divider bg-white text-ink hover:bg-surface-fog",
      )}
    >
      {children}
    </button>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export function ControlTower() {
  const [filter, setFilter] = React.useState<Filter>({ country: "all", persona: "all" });
  const lines = applyFilter(spendLines, filter);

  const spend = total(lines);
  const leak = offContract(lines);
  const leakShare = offContractShare(lines);
  const animate = useChartAnimation();
  const countryRows = byCountry(lines);
  const categoryRows = byCategory(lines);
  const channelRows = byChannel(lines);
  const personaRows = byPersona(lines);
  const supplierRows = bySupplier(lines);
  const flags = riskFlags(lines);

  const channelColour: Record<string, string> = {
    contract: C.deep,
    catalogue: C.sage,
    "off-contract": C.red,
  };

  return (
    <ConsolePage
      title="Control tower and spend analytics"
      lead="Every site's spend in one reporting structure, whatever language it was booked in."
    >
      <FilterBar filter={filter} onChange={setFilter} />

      <StatTiles
        items={[
          {
            label: "Spend in view",
            value: spend,
            prefix: "$",
            icon: <TileIcon icon={icons.money} />,
            sub: `${countryRows.length} countries · ${categoryRows.length} categories`,
          },
          {
            label: "Bought off contract",
            value: leak,
            prefix: "$",
            tone: "red",
            sub: `${Math.round(leakShare * 100)}% of the spend in view`,
            icon: <TileIcon icon={icons.disagree} />,
          },
          {
            label: "Suppliers",
            value: supplierRows.length,
            icon: <TileIcon icon={icons.supplier} />,
            sub: `${supplierRows.filter((s) => s.underAgreement).length} of them under an agreement`,
          },
          {
            label: "Risks flagged",
            value: flags.length,
            icon: <TileIcon icon={icons.risk} />,
            tone: flags.some((f) => f.severity === "high") ? "red" : "ink",
            sub: `${flags.filter((f) => f.severity === "high").length} need attention now`,
          },
        ]}
      />

      {/* ── Country and channel ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-4 items-stretch">
        <Panel
          title="Spend by country"
          sub="The red part of each bar is bought outside an agreement or the catalogue."
        >
          <div className="h-[232px] px-3 pb-4 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={countryRows.map((c) => ({
                  name: c.name,
                  onAgreement: c.spend - c.offContract,
                  offContract: c.offContract,
                }))}
                margin={{ top: 8, right: 8, left: 8, bottom: 4 }}
              >
                <CartesianGrid stroke={C.divider} vertical={false} />
                <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis
                  tick={AXIS}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                  tickFormatter={(v: number) => usdCompact(v)}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="onAgreement" stackId="a" fill={C.deep} radius={[0, 0, 0, 0]} isAnimationActive={animate} />
                <Bar dataKey="offContract" stackId="a" fill={C.red} radius={[3, 3, 0, 0]} isAnimationActive={animate} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="How it was bought" sub="Route to market across the spend in view.">
          <div className="flex h-[232px] flex-col items-center justify-center px-4 pb-4 pt-1">
            <ResponsiveContainer width="100%" height="65%">
              <PieChart>
                <Pie
                  isAnimationActive={animate}
                  data={channelRows.map((c) => ({ name: c.label, value: c.spend, key: c.channel }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="88%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {channelRows.map((c) => (
                    <Cell key={c.channel} fill={channelColour[c.channel]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="mt-3 w-full space-y-1.5">
              {channelRows.map((c) => (
                <li key={c.channel} className="flex items-center gap-2.5 text-[13px]">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: channelColour[c.channel] }}
                  />
                  <span className="text-ink">{c.label}</span>
                  <span className="ml-auto font-medium text-ink tabular-nums">
                    {Math.round((c.spend / spend) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      {/* ── Category and role ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch min-w-0">
        <Panel title="Spend by category" sub="Ranked across every site in view.">
          <div className="h-[232px] px-3 pb-4 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={categoryRows.map((c) => ({ name: c.label, spend: c.spend }))}
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid stroke={C.divider} horizontal={false} />
                <XAxis
                  type="number"
                  tick={AXIS}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => usdCompact(v)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={AXIS}
                  axisLine={false}
                  tickLine={false}
                  width={132}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="spend" fill={C.green} radius={[0, 3, 3, 0]} barSize={16} isAnimationActive={animate} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Who is buying"
          sub="Spend by role, with the share each one buys outside an agreement."
        >
          <div className="px-5 pb-5 pt-1">
            <ul className="space-y-2.5">
              {personaRows.map((p) => (
                <li key={p.id}>
                  <div className="flex items-baseline justify-between gap-3 pb-1">
                    <span className="text-[13px] text-ink">{p.label}</span>
                    <span className="text-[13px] font-medium text-ink tabular-nums whitespace-nowrap">
                      {usd(p.spend, 0)}
                    </span>
                  </div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-surface-fog">
                    <span
                      className="h-full"
                      style={{
                        width: `${(p.spend / (personaRows[0]?.spend || 1)) * 100}%`,
                        background: C.deep,
                      }}
                    />
                  </div>
                  <div className="pt-1 text-[12px] text-mute">
                    {Math.round(p.offShare * 100)}% of it bought off contract
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      {/* ── Suppliers ────────────────────────────────────────────────────── */}
      <Panel
        title="Supplier insights"
        sub="Ranked by spend in view, with how reliably each one delivers and bills."
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-y border-divider bg-surface-fog/60">
              <tr>
                <Th>Supplier</Th>
                <Th align="right">Spend</Th>
                <Th>Countries</Th>
                <Th align="right">Delivers on time</Th>
                <Th align="right">Bills correctly</Th>
                <Th>Standing</Th>
              </tr>
            </thead>
            <tbody>
              {supplierRows.map((s, i) => (
                <tr
                  key={s.name}
                  className={cn(
                    "border-b border-divider last:border-0",
                    i % 2 === 1 && "bg-surface-fog/30",
                  )}
                >
                  <Td>
                    <span className="font-medium text-ink">{s.name}</span>
                    {s.singleSource && (
                      <span className="ml-2 whitespace-nowrap rounded-full bg-surface-rose px-2.5 py-0.5 text-[12px] font-medium text-mark-red">
                        Only source
                      </span>
                    )}
                  </Td>
                  <Td align="right">{usd(s.spend, 0)}</Td>
                  <Td>
                    <span className="text-[13px] text-mute">{s.countries.join(" · ")}</span>
                  </Td>
                  <Td align="right">
                    <span className={cn(s.onTime < 0.85 && "text-mark-red")}>
                      {Math.round(s.onTime * 100)}%
                    </span>
                  </Td>
                  <Td align="right">
                    <span className={cn(s.invoiceAccuracy < 0.85 && "text-mark-red")}>
                      {Math.round(s.invoiceAccuracy * 100)}%
                    </span>
                  </Td>
                  <Td>
                    <span
                      className={cn(
                        "inline-block whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-medium",
                        s.underAgreement
                          ? "bg-surface-mint text-surface-deep"
                          : "bg-surface-rose text-mark-red",
                      )}
                    >
                      {s.underAgreement ? "Under agreement" : "No agreement"}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ── Risk ─────────────────────────────────────────────────────────── */}
      <Panel
        title="What needs attention"
        sub="Worked out from the spend above rather than asserted — each one names the money behind it."
      >
        <ul className="space-y-2.5 px-5 pb-5 pt-1">
          {flags.length === 0 && (
            <li className="text-[13px] text-mute">Nothing is flagged for this view.</li>
          )}
          {flags.map((f) => (
            <li
              key={f.id}
              className={cn(
                "flex items-start gap-3 rounded-md border px-4 py-3",
                f.severity === "high"
                  ? "border-mark-red/30 bg-surface-rose/30"
                  : "border-divider bg-white",
              )}
            >
              <TriangleAlert
                size={15}
                className={cn("mt-0.5 shrink-0", f.severity === "high" ? "text-mark-red" : "text-mute")}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-ink">{f.title}</div>
                <p className="text-[13px] leading-[19px] text-mute mt-0.5">{f.detail}</p>
              </div>
              <span className="shrink-0 text-[13px] font-medium text-ink tabular-nums whitespace-nowrap">
                {usd(f.value, 0)}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      {/* ── The translation layer, made visible ──────────────────────────── */}
      <SpringIn>
        <Panel
          title="One reporting structure, five languages"
          sub="What each site actually called the category, and the single name the group reports on. Without this mapping there is no network view."
          right={<LanguagesIcon size={16} className="text-mute" />}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-y border-divider bg-surface-fog/60">
                <tr>
                  <Th>Reported as</Th>
                  {sites
                    .filter((s) => s.lang !== "en")
                    .map((s) => (
                      <Th key={s.country}>{s.countryName}</Th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {categories.slice(0, 4).map((c, i) => (
                  <tr
                    key={c.id}
                    className={cn(
                      "border-b border-divider last:border-0",
                      i % 2 === 1 && "bg-surface-fog/30",
                    )}
                  >
                    <Td>
                      <span className="font-medium text-ink">{c.label}</span>
                    </Td>
                    {sites
                      .filter((s) => s.lang !== "en")
                      .map((s) => (
                        <Td key={s.country}>
                          <span className="text-mute">{c.local[s.country] ?? "—"}</span>
                        </Td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </SpringIn>

      {/* Sits over the page, and answers against whatever is filtered. */}
      <AskAssistant
        title="Procurement assistant"
        subtitle={`${filter.country === "all" ? "All countries" : siteByCountry[filter.country].countryName} · ${filter.persona === "all" ? "all roles" : personas.find((p) => p.id === filter.persona)!.label}`}
        contextKey={`${filter.country}-${filter.persona}`}
        suggestions={towerQuestions.map((q) => ({
          id: q.id,
          ask: q.ask,
          answer: () => q.answer(lines),
        }))}
      />
    </ConsolePage>
  );
}
