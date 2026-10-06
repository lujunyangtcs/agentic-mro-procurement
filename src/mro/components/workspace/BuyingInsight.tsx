/**
 * What a catalogue buy looks like when you can see past the single order.
 *
 * A requisition on its own answers whether the purchase is permitted. These
 * four panels answer what a category manager would ask next: how much of this
 * category reaches us through the catalogue, which sites consume it, where the
 * order sits in the published price breaks, and whether it should be placed as
 * one order or several. Each lands at the end of the step whose work makes it
 * answerable, and every figure opens the record it came from.
 *
 * Every figure is a prop. Nothing here computes a number the case file has
 * not already stated, and nothing is written twice.
 */

import * as React from "react";
import { Layers, PieChart, Tags, GitMerge, Star, Sparkles, X, FileText } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/mro/lib/utils";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { usePhrase, useT } from "@/mro/lib/i18n";

/**
 * The evidence behind a figure. Every number on these panels comes from a
 * document — the agreement, the consumption record, the arithmetic — and the
 * figure is a way in rather than an assertion to be taken on trust.
 */
function DetailModal({
  title,
  caption,
  children,
  onClose,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-5" onClick={onClose}>
      <div
        className="ai-spring flex max-h-[88vh] w-full max-w-[840px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-divider px-6 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-deep text-ink-inverse">
            <FileText size={16} />
          </span>
          <div className="min-w-0 flex-1">
            {caption && (
              <p className="text-[11px] font-bold uppercase tracking-wide text-mute">{caption}</p>
            )}
            <h2 className="truncate text-[16px] font-bold text-ink">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ui-pill grid h-8 w-8 shrink-0 place-items-center rounded-full text-mute hover:bg-surface-fog hover:text-ink"
          >
            <X size={17} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto bg-surface-fog/40 p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/* ── Shared shell ───────────────────────────────────────────────────────── */

function Panel({
  icon,
  title,
  caption,
  onOpen,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  caption?: string;
  /** Present when the panel has a record behind it. */
  onOpen?: () => void;
  children: React.ReactNode;
}) {
  const { t } = useT();
  return (
    <SpringIn>
      <section className="overflow-hidden rounded-md border border-divider bg-white">
        <header className="flex items-center gap-2 border-b border-divider bg-surface-fog/60 px-4 py-2.5">
          <span className="shrink-0 text-surface-deep">{icon}</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink">{title}</span>
          {caption && <span className="ml-auto text-[11px] text-mute">{caption}</span>}
          {onOpen && (
            <button
              type="button"
              onClick={onOpen}
              className="ui-pill shrink-0 whitespace-nowrap text-[11px] font-bold text-surface-deep hover:underline"
            >
              {t("insight.openRecord")}
            </button>
          )}
        </header>
        {children}
      </section>
    </SpringIn>
  );
}

/** A big number over a small label — the unit of all four panels. */
function Figure({
  n,
  l,
  tone,
  onOpen,
}: {
  n: string;
  l: string;
  tone?: "green";
  onOpen?: () => void;
}) {
  const Tag = onOpen ? "button" : "div";
  return (
    <Tag
      type={onOpen ? "button" : undefined}
      onClick={onOpen}
      className={cn("min-w-0 text-left", onOpen && "ui-pill rounded hover:opacity-70")}
    >
      <div
        className={cn(
          "text-[19px] font-bold leading-none tabular-nums",
          tone === "green" ? "text-surface-deep" : "text-ink",
        )}
      >
        {n}
      </div>
      <div className="mt-1 text-[11px] leading-tight text-ink">{l}</div>
    </Tag>
  );
}

/* ── 1 · Is this demand even coming through the catalogue? ──────────────── */

export type AdoptionSpec = {
  category: string;
  /** The record behind the figures — opened when one of them is clicked. */
  detail?: React.ReactNode;
  detailTitle?: string;
  /** Share of this category's demand that arrives as a catalogue line today. */
  current: number;
  target: number;
  /** Free-text requests found that map to a catalogue item after all. */
  identified: number;
  worth: string;
  note: string;
};

export function CatalogueAdoption({ spec }: { spec: AdoptionSpec }) {
  const { t } = useT();
  const ph = usePhrase();
  const [open, setOpen] = React.useState(false);
  const show = spec.detail ? () => setOpen(true) : undefined;
  return (
    <Panel
      icon={<Layers size={13} />}
      title={t("insight.adoption")}
      caption={ph(spec.category)}
      onOpen={show}
    >
      <div className="px-4 pb-3.5 pt-3">
        {/* The bar is the point: how far the category has come, and to where. */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-fog">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-surface-deep transition-[width] duration-700"
            style={{ width: `${spec.current}%` }}
          />
          <div
            className="absolute inset-y-0 w-[2px] bg-ink/45"
            style={{ left: `${spec.target}%` }}
            aria-hidden
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Figure n={`${spec.current}%`} l={t("insight.throughCatalogue")} onOpen={show} />
          <Figure n={`${spec.target}%`} l={t("insight.target")} onOpen={show} />
          <Figure n={spec.worth} l={t("insight.worthMoving")} tone="green" onOpen={show} />
          <Figure n={String(spec.identified)} l={t("insight.requestsFound")} onOpen={show} />
        </div>
        <p className="mt-3 border-t border-divider pt-2.5 text-[12.5px] leading-[18px] text-ink">
          {ph(spec.note)}
        </p>
      </div>
      {open && spec.detail && (
        <DetailModal
          caption={ph(spec.category)}
          title={ph(spec.detailTitle ?? spec.category)}
          onClose={() => setOpen(false)}
        >
          {spec.detail}
        </DetailModal>
      )}
    </Panel>
  );
}

/* ── 2 · Who else consumes it ───────────────────────────────────────────── */

export type DemandSpec = {
  totalLabel: string;
  detail?: React.ReactNode;
  detailTitle?: string;
  rows: { site: string; qty: string; share: number }[];
  note: string;
};

export function DemandSpread({ spec }: { spec: DemandSpec }) {
  const { t } = useT();
  const ph = usePhrase();
  const [open, setOpen] = React.useState(false);
  const show = spec.detail ? () => setOpen(true) : undefined;
  return (
    <Panel
      icon={<PieChart size={13} />}
      title={t("insight.whoElse")}
      caption={ph(spec.totalLabel)}
      onOpen={show}
    >
      <ul className="divide-y divide-divider">
        {spec.rows.map((r) => (
          <li
            key={r.site}
            onClick={show}
            className={cn("flex items-center gap-3 px-4 py-2", show && "cursor-pointer hover:bg-surface-fog")}
          >
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{ph(r.site)}</span>
            <span className="h-1.5 w-[110px] shrink-0 overflow-hidden rounded-full bg-surface-fog">
              <span
                className="block h-full rounded-full bg-surface-deep"
                style={{ width: `${r.share}%` }}
              />
            </span>
            <span className="w-[74px] shrink-0 text-right text-[12.5px] font-medium tabular-nums text-ink">
              {r.qty}
            </span>
            <span className="w-[42px] shrink-0 text-right text-[12px] tabular-nums text-mute">
              {r.share}%
            </span>
          </li>
        ))}
      </ul>
      <p className="border-t border-divider px-4 py-2.5 text-[12.5px] leading-[18px] text-ink">
        {ph(spec.note)}
      </p>
      {open && spec.detail && (
        <DetailModal
          caption={ph(spec.totalLabel)}
          title={ph(spec.detailTitle ?? spec.totalLabel)}
          onClose={() => setOpen(false)}
        >
          {spec.detail}
        </DetailModal>
      )}
    </Panel>
  );
}

/* ── 3 · Are we buying at the right break? ──────────────────────────────── */

export type PricingSpec = {
  detail?: React.ReactNode;
  detailTitle?: string;
  /** Every break the supplier publishes, cheapest last. */
  tiers: { band: string; unit: string; note?: string; state?: "current" | "best" }[];
  /** What the numbers mean once this year's volume is put against them. */
  calc: { label: string; value: string; strong?: boolean }[];
  note: string;
};

export function VolumePricing({ spec }: { spec: PricingSpec }) {
  const { t } = useT();
  const ph = usePhrase();
  const [open, setOpen] = React.useState(false);
  const show = spec.detail ? () => setOpen(true) : undefined;
  return (
    <Panel icon={<Tags size={13} />} title={t("insight.priceBreaks")} onOpen={show}>
      <ul className="space-y-1.5 p-3.5">
        {spec.tiers.map((tier) => (
          <li
            key={tier.band}
            className={cn(
              "flex items-center gap-3 rounded-md border px-3 py-2",
              tier.state === "best"
                ? "border-surface-mint bg-surface-mint/35"
                : tier.state === "current"
                  ? "border-[#e8d9a8] bg-[#fbf6e6]"
                  : "border-divider bg-white",
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-ink">
                {ph(tier.band)}
                {tier.state === "best" && <Star size={11} className="shrink-0 text-surface-deep" />}
              </span>
              {tier.note && <span className="block text-[11px] text-ink">{ph(tier.note)}</span>}
            </span>
            <span className="shrink-0 text-right">
              <span
                className={cn(
                  "block text-[14px] font-bold tabular-nums",
                  tier.state === "best" ? "text-surface-deep" : "text-ink",
                )}
              >
                {tier.unit}
              </span>
              <span className="block text-[10.5px] text-mute">{t("insight.perUnit")}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t border-divider bg-surface-mint/20 px-4 py-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-surface-deep">
          {t("insight.atOurVolume")}
        </div>
        <dl className="mt-1.5 space-y-1">
          {spec.calc.map((c) => (
            <div key={c.label} className="flex items-baseline justify-between gap-3">
              <dt className={cn("text-[12.5px]", c.strong ? "font-bold text-ink" : "text-ink")}>
                {ph(c.label)}
              </dt>
              <dd
                className={cn(
                  "shrink-0 text-[12.5px] tabular-nums",
                  c.strong ? "font-bold text-surface-deep" : "text-ink",
                )}
              >
                {c.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="border-t border-divider px-4 py-2.5 text-[12.5px] leading-[18px] text-ink">
        {ph(spec.note)}
      </p>
      {open && spec.detail && (
        <DetailModal
          caption={t("insight.priceBreaks")}
          title={ph(spec.detailTitle ?? "")}
          onClose={() => setOpen(false)}
        >
          {spec.detail}
        </DetailModal>
      )}
    </Panel>
  );
}

/* ── 4 · One order, or three? ───────────────────────────────────────────── */

export type ConsolidationSpec = {
  split: { title: string; total: string; sub: string; caption: string; detail?: React.ReactNode };
  joined: { title: string; total: string; sub: string; caption: string; detail?: React.ReactNode };
  /** Which option the agent puts forward. The human still places the order. */
  recommend: "split" | "joined";
  rows: { label: string; value: string; tone?: "good" }[];
  note: string;
};

export function SplitVsConsolidated({ spec }: { spec: ConsolidationSpec }) {
  const { t } = useT();
  const ph = usePhrase();
  const [open, setOpen] = React.useState<"split" | "joined" | null>(null);
  const side = open ? spec[open] : null;

  /* Each option is a button: the figure opens the arithmetic behind it. */
  const Option = ({ which }: { which: "split" | "joined" }) => {
    const o = spec[which];
    const picked = spec.recommend === which;
    return (
      <button
        type="button"
        onClick={o.detail ? () => setOpen(which) : undefined}
        className={cn(
          "ui-pill rounded-md border px-3.5 py-3 text-left transition-colors",
          picked
            ? "border-surface-mint bg-surface-mint/35"
            : "border-surface-rose bg-surface-rose/25",
          o.detail && "hover:brightness-[0.97]",
        )}
      >
        <div className="flex items-start gap-2">
          <span className="min-w-0 flex-1 text-[12px] font-bold text-ink">{ph(o.title)}</span>
          {picked && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-deep px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-ink-inverse">
              <Sparkles size={9} /> {t("insight.recommended")}
            </span>
          )}
        </div>
        <div
          className={cn(
            "mt-1 text-[20px] font-bold leading-none tabular-nums",
            picked ? "text-surface-deep" : "text-ink",
          )}
        >
          {o.total}
        </div>
        <div className="mt-1.5 text-[11.5px] text-ink">{ph(o.sub)}</div>
        <div className={cn("text-[11.5px]", picked ? "font-medium text-surface-deep" : "text-mark-red")}>
          {ph(o.caption)}
        </div>
        {o.detail && (
          <div className="mt-1.5 text-[10.5px] font-bold text-surface-deep">
            {t("insight.showWorking")}
          </div>
        )}
      </button>
    );
  };

  return (
    <Panel icon={<GitMerge size={13} />} title={t("insight.oneOrThree")}>
      <div className="grid grid-cols-1 gap-2.5 p-3.5 sm:grid-cols-2">
        <Option which="split" />
        <Option which="joined" />
      </div>
      <dl className="divide-y divide-divider border-t border-divider">
        {spec.rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3 px-4 py-2">
            <dt className="text-[12.5px] text-ink">{ph(r.label)}</dt>
            <dd
              className={cn(
                "shrink-0 text-[12.5px] tabular-nums",
                r.tone === "good" ? "font-medium text-surface-deep" : "text-ink",
              )}
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-divider px-4 py-2.5 text-[12.5px] leading-[18px] text-ink">
        {ph(spec.note)}
      </p>
      {side?.detail && (
        <DetailModal
          caption={t("insight.oneOrThree")}
          title={ph(side.title)}
          onClose={() => setOpen(null)}
        >
          {side.detail}
        </DetailModal>
      )}
    </Panel>
  );
}
