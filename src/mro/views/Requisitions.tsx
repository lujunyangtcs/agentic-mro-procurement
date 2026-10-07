/**
 * Requisitions — laid out per the sketch: a typed AI summary directly under
 * the title, one card per country acting as the filter, and a single flat
 * worklist whose columns follow the handwritten header. Search and settings
 * sit top-right; the language switch stays because the translation layer is
 * the demo's spine.
 *
 * Every figure is computed from the live store, so resolving the seal
 * exception on the board flips this page's rows in the same click.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { X, Clock, Hand, Check, CircleCheck } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { useProcurement } from "@/mro/data/store";
import {
  lineValue,
  totalValue,
  usd,
  invoiceFor,
  COUNTRIES,
  LANGUAGES,
  type Requisition,
  type PrStatus,
  type Priority,
  type Country,
} from "@/mro/data/procurement";
import {
  ConsolePage,
  Panel,
  HeaderTools,
  AiSummaryCard,
  Th,
  Td,
} from "@/mro/components/console/kit";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { StructuredPrDoc } from "@/mro/components/docs/pr/PrDocs";
import { requisitionDoc } from "@/mro/lib/prDoc";
import { useT, TranslatedBadge, LanguageSwitch } from "@/mro/lib/i18n";
import { DomainCasesPanel } from "@/mro/components/cases/DomainCasesPanel";

/* ── Pills ──────────────────────────────────────────────────────────────── */

const statusTone: Record<PrStatus, string> = {
  structuring: "bg-surface-fog text-ink",
  validating: "bg-surface-fog text-ink",
  held: "bg-surface-rose text-mark-red",
  released: "bg-surface-mint text-surface-deep",
};

const priorityTone: Record<Priority, string> = {
  critical: "bg-surface-rose text-mark-red",
  high: "bg-[#fff3c4] text-[#8a5a00]",
  normal: "bg-surface-fog text-mute",
};

/* ── The requisition as its real ERP document ───────────────────────────── */

function DocumentModal({ r, onClose }: { r: Requisition; onClose: () => void }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/45 px-6 py-10"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <SpringIn className="w-full max-w-[860px]">
        <div className="rounded-lg bg-white shadow-2xl overflow-hidden">
          <header className="flex items-center justify-between gap-4 border-b border-divider px-5 py-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="text-[15px] font-bold text-ink">{r.id}</span>
                {r.sourceLang !== "en" && <TranslatedBadge from={r.sourceLang} />}
              </div>
              <p className="text-[13px] text-mute leading-snug mt-0.5 truncate">{r.description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ui-pill shrink-0 rounded-md p-2 text-mute hover:bg-surface-fog hover:text-ink"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </header>
          <div className="max-h-[72vh] overflow-y-auto p-5 bg-surface-fog">
            <StructuredPrDoc pr={requisitionDoc(r)} />
          </div>
        </div>
      </SpringIn>
    </div>,
    document.body,
  );
}

/* ── Country cards — the filter, per the sketch ─────────────────────────── */

type StatusFilter = "in-progress" | "held" | "released";

export type WorklistFilter = { country: Country | "all"; status: StatusFilter | null };

const statusChipSpec: Record<
  StatusFilter,
  { label: string; icon: typeof Clock; activeCls: string }
> = {
  "in-progress": { label: "In progress", icon: Clock, activeCls: "border-surface-navy bg-surface-navy text-ink-inverse" },
  held: { label: "Held", icon: Hand, activeCls: "border-mark-red bg-mark-red text-ink-inverse" },
  released: { label: "Released", icon: Check, activeCls: "border-surface-deep bg-surface-deep text-ink-inverse" },
};

/** One clickable rectangle per status — the icon flips to a check when active. */
function StatusChip({
  status,
  count,
  on,
  onClick,
}: {
  status: StatusFilter;
  count: number;
  on: boolean;
  onClick: () => void;
}) {
  const spec = statusChipSpec[status];
  const Icon = on ? CircleCheck : spec.icon;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "ui-pill flex w-full items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-[3px] text-[12px] font-medium transition-colors",
        on ? spec.activeCls : "border-divider bg-white text-ink hover:bg-surface-fog",
      )}
    >
      <Icon size={12} strokeWidth={2} className="shrink-0" />
      {spec.label}
      <span className="ml-auto tabular-nums">{count}</span>
    </button>
  );
}

function CountryCards({
  requisitions,
  filter,
  onChange,
}: {
  requisitions: Requisition[];
  filter: WorklistFilter;
  onChange: (f: WorklistFilter) => void;
}) {
  const cards = COUNTRIES.map((c) => {
    const mine = requisitions.filter((r) => r.country === c);
    return {
      country: c,
      total: mine.length,
      held: mine.filter((r) => r.status === "held").length,
      counts: {
        "in-progress": mine.filter((r) => r.status === "structuring" || r.status === "validating").length,
        held: mine.filter((r) => r.status === "held").length,
        released: mine.filter((r) => r.status === "released").length,
      } as Record<StatusFilter, number>,
      emoji: LANGUAGES.find((l) => l.code === mine[0]?.sourceLang)?.emoji ?? "",
    };
  }).filter((c) => c.total > 0);

  const toggle = (country: Country, status: StatusFilter | null) => {
    const same = filter.country === country && filter.status === status;
    onChange(same ? { country: "all", status: null } : { country, status });
  };

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c, i) => {
        const onCountry = filter.country === c.country;
        return (
          <SpringIn key={c.country} delay={i * 60} className="h-full">
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggle(c.country, null)}
              onKeyDown={(e) => e.key === "Enter" && toggle(c.country, null)}
              className={cn(
                "ui-pill flex h-full w-full cursor-pointer items-center justify-between gap-3 rounded-md border bg-white px-3.5 py-2.5 text-left transition-colors",
                onCountry && filter.status === null
                  ? "border-surface-deep bg-surface-mint/30"
                  : "border-divider hover:bg-surface-fog",
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] leading-none">{c.emoji}</span>
                  <span className="text-[14px] font-bold text-ink">{c.country}</span>
                </div>
                <div className="mt-1 text-[13px] text-mute whitespace-nowrap">
                  {c.total} raised · {c.held > 0 ? `${c.held} held` : "none held"}
                </div>
              </div>
              <div className="w-[132px] shrink-0 space-y-1">
                {(Object.keys(statusChipSpec) as StatusFilter[]).map((st) => (
                  <StatusChip
                    key={st}
                    status={st}
                    count={c.counts[st]}
                    on={onCountry && filter.status === st}
                    onClick={() => toggle(c.country, st)}
                  />
                ))}
              </div>
            </div>
          </SpringIn>
        );
      })}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export function Requisitions() {
  const { requisitions } = useProcurement();
  const { t } = useT();
  const [filter, setFilter] = React.useState<WorklistFilter>({ country: "all", status: null });
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState<Requisition | null>(null);

  const held = requisitions.filter((r) => r.status === "held");
  const q = search.trim().toLowerCase();
  const matchesStatus = (r: Requisition) =>
    filter.status === null ||
    (filter.status === "held" && r.status === "held") ||
    (filter.status === "released" && r.status === "released") ||
    (filter.status === "in-progress" && (r.status === "structuring" || r.status === "validating"));
  const rows = requisitions.filter(
    (r) =>
      (filter.country === "all" || r.country === filter.country) &&
      matchesStatus(r) &&
      (!q ||
        r.id.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.plant.toLowerCase().includes(q)),
  );

  /* The AI's position — computed, so the words match the rows below. */
  const critical = held.find((r) => r.priority === "critical");
  const headline =
    held.length === 0
      ? `All ${requisitions.length} requests are moving — nothing is waiting on you.`
      : `${requisitions.length} requests in flight · ${held.length} held for you at ${usd(totalValue(held), 0)}.`;
  const detail = critical
    ? `${critical.id} is the critical one — the ${usd(lineValue(critical), 0)} mechanical seal for ${critical.line}. The line is down; one specification holds release.`
    : held.length > 0
      ? `Four countries are raising requests in four languages; the workforce reads them all. Pick any row to see the requisition as the system records it.`
      : `Released requests carry their supplier invoice reference in the worklist below.`;

  return (
    <ConsolePage>
      <AiSummaryCard
        title={t("req.title")}
        headline={headline}
        detail={detail}
        right={
          <>
            <LanguageSwitch />
            <HeaderTools search={search} onSearch={setSearch} placeholder="Search requisitions…" />
          </>
        }
      />

      <DomainCasesPanel />

      <CountryCards requisitions={requisitions} filter={filter} onChange={setFilter} />

      <Panel
        className="min-w-0"
        title={filter.country === "all" ? t("req.worklist") : `${t("req.worklist")} · ${filter.country}`}
        right={
          filter.country !== "all" || filter.status !== null ? (
            <button
              type="button"
              onClick={() => setFilter({ country: "all", status: null })}
              className="ui-pill whitespace-nowrap rounded-md border border-divider px-3 py-1.5 text-[13px] text-ink hover:bg-surface-fog"
            >
              Show everything
            </button>
          ) : undefined
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-y border-divider bg-surface-fog/60">
              <tr>
                <Th>{t("col.request")}</Th>
                <Th>{t("col.item")}</Th>
                <Th>{t("col.raisedBy")}</Th>
                <Th>Priority</Th>
                <Th>Country</Th>
                <Th>Invoice no.</Th>
                <Th align="right">{t("col.value")}</Th>
                <Th>{t("col.status")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const lang = LANGUAGES.find((l) => l.code === r.sourceLang)!;
                const inv = invoiceFor(r);
                return (
                  <tr
                    key={r.id}
                    onClick={() => setOpen(r)}
                    className={cn(
                      "cursor-pointer border-b border-divider last:border-0 transition-colors hover:bg-surface-mint/30",
                      i % 2 === 1 && "bg-surface-fog/30",
                    )}
                  >
                    <Td>
                      <span className="font-medium text-ink">{r.id}</span>
                    </Td>
                    <Td className="max-w-[280px] truncate" title={r.description}>
                      {r.description}
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-[20px] text-[15px] leading-none"
                          title={`Written in ${lang.label}${r.sourceLang !== "en" ? ", translated by the workforce" : ""}`}
                        >
                          {lang.emoji}
                        </span>
                        {r.line}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-[12px] font-medium",
                          priorityTone[r.priority],
                        )}
                      >
                        {r.priority === "critical" ? "Critical" : r.priority === "high" ? "High" : "Normal"}
                      </span>
                    </Td>
                    <Td className="text-mute">{r.country}</Td>
                    <Td>
                      {inv ? (
                        <span className="font-medium text-ink">{inv.id}</span>
                      ) : (
                        <span className="text-mute">—</span>
                      )}
                    </Td>
                    <Td align="right">{usd(lineValue(r))}</Td>
                    <Td>
                      <span
                        className={cn(
                          "inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-medium",
                          statusTone[r.status],
                        )}
                      >
                        {t(`status.${r.status}`)}
                      </span>
                    </Td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-[13px] text-mute">
                    Nothing matches.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {open && <DocumentModal r={open} onClose={() => setOpen(null)} />}
    </ConsolePage>
  );
}
