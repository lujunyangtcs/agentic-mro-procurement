/**
 * Exceptions — the page the demo is built around, laid out per the sketch:
 * the title and the typed AI summary share one card, the reason filters sit on
 * their own row inside the list card, and the detail rail reads top-to-bottom
 * exactly as drawn — facts, source files, the AI's recommendation, then the
 * three actions.
 *
 * Closing an exception never deletes it — the row changes status, and when a
 * requisition's last exception closes it is released, which moves the
 * requisition worklist and the supplier's own portal in the same click.
 */

import * as React from "react";
import { Check, ChevronRight, FileText, User } from "lucide-react";
import { exceptionIcon, ICON } from "@/mro/components/console/icons";
import { cn } from "@/mro/lib/utils";
import { useApp } from "@/mro/state";
import { useProcurement } from "@/mro/data/store";
import {
  exceptionLanes,
  lineValue,
  totalValue,
  usd,
  approvalRules,
  routeFor,
  exceptionMeta,
  type Requisition,
  type ExceptionType,
} from "@/mro/data/procurement";
import {
  ConsolePage,
  HeaderTools,
  AiSummaryCard,
} from "@/mro/components/console/kit";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { LanguageSwitch } from "@/mro/lib/i18n";
import { PillButton } from "@/mro/components/blocks/PillButton";
import { sourcesFor, type ExceptionSource } from "@/mro/data/exceptionSources";
import { SourcePreviewModal } from "@/mro/components/exceptions/SourcePreviewModal";
import { ResolveModal, type ResolutionPlan } from "@/mro/components/exceptions/ResolveModal";

/* ── What the workforce recommends, per reason ──────────────────────────── */

type Recommendation = {
  finding: string;
  action: string;
  evidence: { label: string; detail: string }[];
  protects?: number;
};

function recommendationFor(r: Requisition, type: ExceptionType): Recommendation {
  const value = lineValue(r);
  switch (type) {
    case "spec-incomplete":
      return {
        finding:
          "The request gave a size range rather than a single size, and carried no part number.",
        action: "Confirm the shaft size with the engineer",
        evidence: [
          { label: "Requested", detail: "A range of 45 to 50 mm, no part number" },
          { label: "Matched to", detail: r.material },
          { label: "Why it matters", detail: "A wrong-fit part stops the line a second time" },
        ],
      };
    case "duplicate-demand":
      return {
        finding: "A request for this same item is already open for this plant.",
        action: "Merge into the open request",
        evidence: [
          { label: "This request", detail: `${r.id} · ${r.qty} ${r.uom}` },
          { label: "Already open", detail: "An earlier request for the same item and line" },
          { label: "Why it matters", detail: "Duplicate orders tie up cash and storeroom space" },
        ],
        /* Money is counted once per requisition — on its principal lane. */
        protects: r.exceptions.length > 1 ? undefined : r.avoidedSpend,
      };
    case "stock-available":
      return {
        finding: "A sister plant already holds this item in its store.",
        action: "Transfer from the sister plant",
        evidence: [
          { label: "Held at", detail: "Erlangen · maintenance store" },
          { label: "Needed at", detail: `${r.plant} · ${r.line}` },
          { label: "Why it matters", detail: "Buying what the network already owns is pure waste" },
        ],
        protects: r.avoidedSpend,
      };
    case "warranty-covered":
      return {
        finding: "The equipment is inside warranty and the failure reads as a defect.",
        action: "Raise a warranty claim instead of buying",
        evidence: [
          { label: "Coverage", detail: "Inside the twelve-month parts warranty" },
          { label: "Failure", detail: "Early failure, consistent with a defect" },
          { label: "Why it matters", detail: "Paying for what the supplier owes is money given away" },
        ],
      };
    case "off-contract":
      return {
        finding: "The named supplier is not on the approved list.",
        action: "Move the order to the approved supplier",
        evidence: [
          { label: "Requested supplier", detail: `${r.vendor} · not approved` },
          { label: "We already hold", detail: "An approved supplier covering this item" },
          { label: "Why it matters", detail: "Off-contract buying is where savings leak away" },
        ],
        protects: r.avoidedSpend,
      };
    case "over-threshold":
      return {
        finding: `At ${usd(value)} this request is past the plant's approval limit.`,
        action: `Route to the ${routeFor(r).routesTo.toLowerCase()}`,
        evidence: [
          { label: "Value", detail: usd(value) },
          { label: "Plant limit", detail: usd(approvalRules[0].limit, 0) },
          { label: "Why it matters", detail: "Spending authority has to be respected and evidenced" },
        ],
      };
  }
}

/** What "Analyze with AI" applies, per reason. */
function planFor(r: Requisition, type: ExceptionType): ResolutionPlan {
  const rec = recommendationFor(r, type);
  const map: Record<ExceptionType, { apply: string; done: string }> = {
    "spec-incomplete": { apply: "Confirm and release", done: "Spec confirmed · 50 mm shaft" },
    "duplicate-demand": { apply: "Merge into the open request", done: "Merged into the open request" },
    "stock-available": { apply: "Route the interplant transfer", done: "Transfer routed from Erlangen" },
    "warranty-covered": { apply: "Raise the warranty claim", done: "Warranty claim raised" },
    "off-contract": { apply: "Move to the approved supplier", done: "Moved to the approved supplier" },
    "over-threshold": { apply: "Route for sign-off", done: "Signed off one level up" },
  };
  return {
    action: rec.action,
    evidence: rec.evidence,
    protects: rec.protects,
    applyLabel: map[type].apply,
    resolutionLabel: map[type].done,
  };
}

/* ── Rows: open + resolved, one per requisition-and-reason ──────────────── */

type RowState = "open" | "assigned" | "resolved";
type Row = {
  r: Requisition;
  type: ExceptionType;
  state: RowState;
  /** What was done, for resolved rows. */
  action?: string;
  /** Who has it, for assigned rows. */
  to?: string;
};

function buildRows(requisitions: Requisition[], only: ExceptionType | "all"): Row[] {
  const open: Row[] = exceptionLanes(requisitions)
    .filter((l) => only === "all" || l.type === only)
    .flatMap((l) =>
      l.items.map((r) => {
        const a = r.assigned?.find((x) => x.type === l.type);
        return a
          ? { r, type: l.type, state: "assigned" as const, to: a.to }
          : { r, type: l.type, state: "open" as const };
      }),
    );
  const resolved: Row[] = requisitions
    .flatMap((r) => (r.resolutions ?? []).map((res) => ({ r, res })))
    .filter(({ res }) => only === "all" || res.type === only)
    .map(({ r, res }) => ({ r, type: res.type, state: "resolved" as const, action: res.action }));
  return [...open, ...resolved];
}

/* ── Filler history — keeps the board full so the two cards stand equal ─── */

type FillerRow = { id: string; desc: string; type: ExceptionType; action: string; value: number };

const FILLERS: FillerRow[] = [
  { id: "PR-48602", desc: "Pump seal kit — 40 mm — agitator", type: "duplicate-demand", action: "Merged", value: 612 },
  { id: "PR-48598", desc: "Shaft sleeve — silicon carbide — 50 mm", type: "stock-available", action: "Transferred", value: 184 },
  { id: "PR-48588", desc: "Level transmitter — guided wave", type: "off-contract", action: "Moved to agreement", value: 2450 },
  { id: "PR-48579", desc: "Gasket set — DN50 — PTFE", type: "warranty-covered", action: "Claim settled", value: 96 },
  { id: "PR-48571", desc: "V-belt set — SPB — matched pair", type: "over-threshold", action: "Signed off", value: 143 },
  { id: "PR-48566", desc: "Sight glass — DN25 — borosilicate", type: "spec-incomplete", action: "Spec confirmed", value: 210 },
];

/* ── Detail rail — strictly the sketch: facts · sources · AI · actions ──── */

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="shrink-0 text-[13px] font-bold text-ink">{label}</span>
      <span className="min-w-0 truncate text-right text-[13px] text-ink" title={value}>
        {value}
      </span>
    </div>
  );
}

function ExceptionDetail({
  row,
  onPreview,
  onAnalyze,
  onAssign,
  onMarkResolved,
  onOpenRun,
  onOpenSourcing,
}: {
  row: Row;
  onPreview: (s: ExceptionSource) => void;
  onAnalyze: () => void;
  onAssign: () => void;
  onMarkResolved: () => void;
  onOpenRun?: () => void;
  /** Off-contract only — take it to market instead. */
  onOpenSourcing?: () => void;
}) {
  const { r, type } = row;
  const meta = exceptionMeta[type];
  const rec = recommendationFor(r, type);
  const sources = sourcesFor(r, type);
  /* The item, in a few words — the full text lives in the document itself. */
  const itemShort = r.description.split(" — ").slice(0, 2).join(" · ");

  return (
    <SpringIn key={`${r.id}-${type}-${row.state}`} className="h-full">
      <section className="flex h-full flex-col rounded-md border border-divider bg-white">
        <header className="flex items-center gap-2.5 border-b border-divider px-4 py-3">
          <span className="shrink-0" style={{ color: meta.accent }}>
            {React.createElement(exceptionIcon[type], { size: ICON.row, strokeWidth: ICON.stroke })}
          </span>
          <span className="text-[15px] font-bold text-ink">{r.id}</span>
          <span className="ml-auto text-[15px] font-bold text-ink tabular-nums">
            {usd(lineValue(r))}
          </span>
        </header>

        <div className="flex flex-1 flex-col gap-3.5 px-4 py-3.5">
          {/* The facts — label bold left, short value right, everything black. */}
          <div className="space-y-2">
            <FactRow label="Reason" value={meta.label} />
            <FactRow label="Item" value={itemShort} />
            <FactRow label="Owner" value={row.state === "assigned" ? `${row.to}` : meta.owner} />
          </div>

          {/* Source files — one line each, a couple of words. */}
          <div>
            <div className="pb-1.5 text-[13px] font-bold text-ink">Source files</div>
            <ul className="space-y-1.5">
              {sources.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onPreview(s)}
                    className="ui-pill flex w-full items-center gap-2.5 rounded-md border border-divider px-3 py-2 text-left transition-colors hover:border-surface-deep/40 hover:bg-surface-mint/30"
                  >
                    <FileText size={ICON.row} strokeWidth={ICON.stroke} className="shrink-0 text-ink" />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                      {s.short}
                    </span>
                    <ChevronRight size={14} className="shrink-0 text-ink" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {row.state === "resolved" ? (
            <div className="rounded-md border border-surface-deep/25 bg-surface-mint/40 px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.04em] text-surface-deep">
                <Check size={13} strokeWidth={2.6} />
                Resolved
              </div>
              <p className="text-[13px] font-medium text-ink leading-snug mt-0.5">{row.action}</p>
              <p className="text-[12px] text-ink mt-1">Written to the audit trail against {r.id}.</p>
            </div>
          ) : (
            <>
              {/* The AI's position. */}
              <div className="rounded-md border border-surface-deep/25 bg-surface-mint/35 px-3.5 py-2.5">
                <div className="text-[12px] font-bold uppercase tracking-[0.04em] text-surface-deep">
                  AI recommendation
                </div>
                <p className="text-[13px] font-medium text-ink leading-snug mt-0.5">{rec.action}</p>
                {rec.protects ? (
                  <p className="text-[13px] text-surface-deep mt-1">
                    Protects <span className="font-bold tabular-nums">{usd(rec.protects)}</span>
                  </p>
                ) : null}
              </div>

              {/* The three actions, stacked exactly as sketched. */}
              <div className="mt-auto flex flex-col gap-2">
                <PillButton
                  variant="secondary"
                  onClick={onMarkResolved}
                  className="justify-center whitespace-nowrap"
                >
                  Mark resolved
                </PillButton>
                <PillButton
                  variant="secondary"
                  onClick={onAssign}
                  disabled={row.state === "assigned"}
                  className="justify-center whitespace-nowrap"
                >
                  <User size={13} />
                  Assign to human
                </PillButton>
                <PillButton variant="deep" onClick={onAnalyze} className="justify-center whitespace-nowrap">
                  Analyze with AI
                </PillButton>
                {onOpenSourcing && (
                  <PillButton
                    variant="secondary"
                    onClick={onOpenSourcing}
                    className="justify-center whitespace-nowrap"
                  >
                    Take it to market
                  </PillButton>
                )}
                {onOpenRun && (
                  <button
                    type="button"
                    onClick={onOpenRun}
                    className="ui-pill text-center text-[13px] font-medium text-surface-deep hover:underline"
                  >
                    See the full run →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </SpringIn>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export function Exceptions() {
  const { go } = useApp();
  const { requisitions, audit, resolveException, assignException } = useProcurement();
  const [only, setOnly] = React.useState<ExceptionType | "all">("all");
  const [search, setSearch] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);
  const [sel, setSel] = React.useState<{ id: string; type: ExceptionType } | null>({
    id: "PR-48630",
    type: "spec-incomplete",
  });
  const [preview, setPreview] = React.useState<ExceptionSource | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);

  const lanes = exceptionLanes(requisitions);
  const open = requisitions.filter((r) => r.exceptions.length > 0);
  const resolvedCount = requisitions.reduce((n, r) => n + (r.resolutions?.length ?? 0), 0);
  const protectedSoFar = audit.reduce((sum, a) => sum + (a.value ?? 0), 0);

  const q = search.trim().toLowerCase();
  const rows = buildRows(requisitions, only).filter(
    (row) =>
      !q ||
      row.r.id.toLowerCase().includes(q) ||
      row.r.description.toLowerCase().includes(q) ||
      row.r.plant.toLowerCase().includes(q),
  );

  /* Older, already-closed history pads the board so the two cards stand equal. */
  const fillersAvailable = FILLERS.filter(
    (f) =>
      (only === "all" || f.type === only) &&
      (!q || f.id.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q)),
  );
  const padTo = 8;
  const baseFill = Math.max(0, Math.min(fillersAvailable.length, padTo - rows.length));
  const fillers = fillersAvailable.slice(0, showAll ? fillersAvailable.length : baseFill);
  const moreLeft = fillersAvailable.length - fillers.length;

  const selRow = sel ? rows.find((x) => x.r.id === sel.id && x.type === sel.type) ?? null : null;

  const hero = open.find((r) => r.id === "PR-48630");
  const headline =
    open.length === 0
      ? `Nothing is stopped — every request is released. ${usd(protectedSoFar, 0)} protected along the way.`
      : `${open.length} ${open.length === 1 ? "request" : "requests"} stopped · ${usd(totalValue(open), 0)} held.`;
  const detail =
    open.length === 0
      ? `${resolvedCount} exceptions closed, each with its action on the record below.`
      : hero
        ? `Start with PR-48630 — the ${usd(4180, 0)} mechanical seal for Assembly Line 2. The line is down and one specification holds release.`
        : `${protectedSoFar > 0 ? usd(protectedSoFar, 0) + " already protected. " : ""}Pick any row for the evidence and one recommended action.`;

  const doResolve = (row: Row, action: string, avoided?: number) =>
    resolveException(row.r.id, row.type, action, avoided);

  return (
    <ConsolePage>
      <AiSummaryCard
        title="Exceptions"
        headline={headline}
        detail={detail}
        right={
          <>
            <LanguageSwitch />
            <HeaderTools search={search} onSearch={setSearch} placeholder="Search exceptions…" />
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-3 items-stretch">
        {/* ── The board ──────────────────────────────────────────────────── */}
        <section className="flex h-full min-w-0 flex-col rounded-md border border-divider bg-white">
          <header className="px-4 pb-2.5 pt-3.5">
            <h2 className="text-[15px] font-bold leading-tight text-ink">All exceptions</h2>
          </header>

          {/* The reason filters — their own full-width row, nothing overlaps. */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-divider px-4 pb-2.5">
            <button
              type="button"
              onClick={() => setOnly("all")}
              className={cn(
                "ui-pill whitespace-nowrap rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors",
                only === "all"
                  ? "border-surface-deep bg-surface-deep text-ink-inverse"
                  : "border-divider bg-white text-ink hover:bg-surface-fog",
              )}
            >
              All
            </button>
            {lanes.map((l) => {
              const on = only === l.type;
              return (
                <button
                  key={l.type}
                  type="button"
                  onClick={() => setOnly(on ? "all" : l.type)}
                  className={cn(
                    "ui-pill whitespace-nowrap rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors",
                    on ? "border-transparent text-white" : "border-divider bg-white hover:bg-surface-fog",
                  )}
                  style={on ? { background: l.accent } : { color: l.accent }}
                >
                  {l.label}
                  {l.count > 0 ? ` · ${l.count}` : ""}
                </button>
              );
            })}
          </div>

          <ul className="flex-1 divide-y divide-divider">
            {rows.map((row) => {
              const { r, type } = row;
              const meta = exceptionMeta[type];
              const on = selRow === row;
              const resolved = row.state === "resolved";
              return (
                <li key={`${r.id}-${type}-${row.state}`}>
                  <button
                    type="button"
                    onClick={() => setSel({ id: r.id, type })}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      on ? "bg-surface-mint/40" : "hover:bg-surface-fog",
                    )}
                  >
                    <span className="shrink-0" style={{ color: meta.accent }}>
                      {React.createElement(exceptionIcon[type], {
                        size: ICON.row,
                        strokeWidth: ICON.stroke,
                      })}
                    </span>
                    <span className="w-[86px] shrink-0 text-[13px] font-medium text-ink">{r.id}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                      {r.description}
                    </span>
                    {resolved ? (
                      <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-surface-mint px-2.5 py-1 text-[12px] font-medium text-surface-deep lg:inline-flex">
                        <Check size={11} strokeWidth={2.6} />
                        Resolved
                      </span>
                    ) : row.state === "assigned" ? (
                      <span className="hidden shrink-0 rounded-full bg-[#fff3c4] px-2.5 py-1 text-[12px] font-medium text-[#8a5a00] lg:inline">
                        With {row.to}
                      </span>
                    ) : (
                      <span
                        className="hidden shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium lg:inline"
                        style={{
                          color: meta.accent,
                          background: `color-mix(in srgb, ${meta.accent} 12%, white)`,
                        }}
                      >
                        {meta.label}
                      </span>
                    )}
                    <span className="w-[84px] shrink-0 text-right text-[13px] font-medium text-ink tabular-nums">
                      {usd(lineValue(r), 0)}
                    </span>
                    <ChevronRight size={ICON.row} strokeWidth={ICON.stroke} className="shrink-0 text-ink" />
                  </button>
                </li>
              );
            })}

            {/* Closed history from earlier weeks. */}
            {fillers.map((f) => {
              const meta = exceptionMeta[f.type];
              return (
                <li key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="shrink-0" style={{ color: meta.accent }}>
                    {React.createElement(exceptionIcon[f.type], {
                      size: ICON.row,
                      strokeWidth: ICON.stroke,
                    })}
                  </span>
                  <span className="w-[86px] shrink-0 text-[13px] font-medium text-ink">{f.id}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{f.desc}</span>
                  <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-surface-mint px-2.5 py-1 text-[12px] font-medium text-surface-deep lg:inline-flex">
                    <Check size={11} strokeWidth={2.6} />
                    {f.action}
                  </span>
                  <span className="w-[84px] shrink-0 text-right text-[13px] font-medium text-ink tabular-nums">
                    {usd(f.value, 0)}
                  </span>
                  <span className="w-[15px] shrink-0" />
                </li>
              );
            })}

            {rows.length === 0 && fillers.length === 0 && (
              <li className="px-4 py-6 text-center text-[13px] text-ink">Nothing waiting here.</li>
            )}
          </ul>

          {moreLeft > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="ui-pill border-t border-divider px-4 py-2.5 text-center text-[13px] font-medium text-surface-deep hover:bg-surface-fog"
            >
              Show {moreLeft} more from earlier weeks
            </button>
          )}
        </section>

        {/* ── The detail rail ────────────────────────────────────────────── */}
        {selRow ? (
          <ExceptionDetail
            row={selRow}
            onPreview={setPreview}
            onAnalyze={() => setAnalyzing(true)}
            onAssign={() => assignException(selRow.r.id, selRow.type, exceptionMeta[selRow.type].owner)}
            onMarkResolved={() =>
              doResolve(selRow, "Marked resolved by the buyer", recommendationFor(selRow.r, selRow.type).protects)
            }
            onOpenRun={selRow.r.flow ? () => go({ kind: "workspace", flow: selRow.r.flow! }) : undefined}
            /* An off-contract hold has a second question behind it: if we do
               buy this, where from? That is its own run. */
            onOpenSourcing={
              selRow.type === "off-contract"
                ? () => go({ kind: "workspace", flow: "off-catalogue" })
                : undefined
            }
          />
        ) : (
          <SpringIn className="h-full">
            <section className="flex h-full items-center justify-center rounded-md border border-dashed border-divider bg-white px-5 py-8 text-center">
              <div>
                <p className="text-[14px] font-bold text-ink">Pick a request</p>
                <p className="text-[13px] text-ink leading-snug mt-1">
                  Choose a row to see the evidence and the recommended action.
                </p>
              </div>
            </section>
          </SpringIn>
        )}
      </div>

      {preview && <SourcePreviewModal source={preview} onClose={() => setPreview(null)} />}

      {analyzing && selRow && selRow.state !== "resolved" && (
        <ResolveModal
          r={selRow.r}
          type={selRow.type}
          plan={planFor(selRow.r, selRow.type)}
          sources={sourcesFor(selRow.r, selRow.type)}
          onApply={() => {
            const plan = planFor(selRow.r, selRow.type);
            doResolve(selRow, plan.resolutionLabel, plan.protects);
          }}
          onClose={() => setAnalyzing(false)}
        />
      )}
    </ConsolePage>
  );
}
