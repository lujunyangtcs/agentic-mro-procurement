/**
 * Shared furniture for the work-menu pages (Requisitions · Exceptions ·
 * Invoice matching). Everything here is presentational and prop-driven — the
 * numbers arrive already computed from data/procurement.ts.
 *
 * House rules honoured throughout: plain business language, nothing smaller
 * than 12px, buttons never wrap, and cards in a row are equal height.
 */

import * as React from "react";
import { Check, AlertTriangle, Search, Sparkles } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { Spinner } from "@/mro/components/ai/Spinner";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { CountUp } from "@/mro/components/ai/CountUp";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { LanguageSwitch } from "@/mro/lib/i18n";

/* ── Page shell ─────────────────────────────────────────────────────────── */

export function ConsolePage({
  title,
  lead,
  actions,
  children,
}: {
  title?: string;
  lead?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="pl-6 pr-7 pt-5 pb-12 min-h-screen bg-surface-fog">
      {/* z-40: the language menu must drop OVER the tiles below, never under. */}
      {(title || lead || actions) && (
        <SpringIn className="relative z-40 mt-3.5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h1 className="jlr-title text-[22px] leading-[30px] text-ink">
                <span className="jlr-line">
                  <span>{title}</span>
                </span>
              </h1>
            )}
            <span aria-hidden className="jlr-rule mb-2.5 mt-2 block h-px w-12 bg-ink" style={{ animationDelay: "200ms" }} />
            {/* One line. If it needs two, the page is explaining too much. */}
            {lead && <p className="truncate text-[14px] leading-[20px] text-mute mt-0.5">{lead}</p>}
          </div>
          {/* The reader picks the language for the whole workspace here. */}
          <div className="shrink-0 flex items-center gap-3">
            <LanguageSwitch />
            {actions}
          </div>
        </SpringIn>
      )}
      <div className="mt-3.5 space-y-3 first:mt-0">{children}</div>
    </div>
  );
}

/* ── Header tools — search + settings, per the sketches ─────────────────── */

export function HeaderTools({
  search,
  onSearch,
  placeholder = "Search…",
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="flex h-[38px] w-[190px] items-center gap-2 rounded-md border border-divider bg-white px-3 focus-within:border-surface-deep/50">
        <Search size={14} className="shrink-0 text-mute" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-mute"
        />
      </label>
    </div>
  );
}

/* ── AI summary — the tiered, typed line under a page title ─────────────── */

/**
 * Two layers, typed in sequence: the headline states the position, the detail
 * names the one thing to do first. Both are computed from the store, so the
 * words can never drift from the numbers on the page below them.
 */
export function AiSummaryCard({
  title,
  headline,
  detail,
  right,
}: {
  /** The page title, when it lives inside this card. */
  title?: string;
  headline: string;
  detail: string;
  /** Controls pinned to the card's top-right — language, search. */
  right?: React.ReactNode;
}) {
  return (
    /* z-40: the language menu in `right` must drop over whatever sits below. */
    <SpringIn className="relative z-40">
      <div className="relative bg-accent-navy px-5 py-4">
        <span aria-hidden className="jlr-rule absolute inset-x-0 top-0 block h-[2px] bg-sand" />
        {(title || right) && (
          <div className="flex items-center justify-between gap-4 pb-2.5">
            {title && (
              <h1 className="jlr-title text-[22px] leading-[30px] text-ink-inverse">
                <span className="jlr-line">
                  <span>{title}</span>
                </span>
              </h1>
            )}
            {right && <div className="flex shrink-0 items-center gap-2.5">{right}</div>}
          </div>
        )}
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-sand ai-pulse">
            <Sparkles size={17} />
          </span>
          <div className="min-w-0">
            <p className="text-[14.5px] font-normal leading-[21px] text-ink-inverse">
              <StreamingText text={headline} cps={110} caret={false} />
            </p>
            <p className="text-[13px] leading-[19px] text-ink-inverse mt-0.5">
              <StreamingText
                text={detail}
                cps={150}
                startDelay={Math.min(2400, headline.length * 10 + 300)}
                caret={false}
              />
            </p>
          </div>
        </div>
      </div>
    </SpringIn>
  );
}

/* ── Stat tiles ─────────────────────────────────────────────────────────── */

export type Stat = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  sub: string;
  tone?: "ink" | "deep" | "red";
  icon?: React.ReactNode;
  /** Shows a live spinner in the corner — used for "being worked on now". */
  working?: boolean;
};

const statTone = {
  ink: "text-ink",
  deep: "text-surface-deep",
  red: "text-mark-red",
};

/** The tinted square the icon sits in, matched to the figure's tone. */
const statChip = {
  ink: "bg-surface-fog text-mute",
  deep: "bg-surface-mint text-surface-deep",
  red: "bg-surface-rose text-mark-red",
};

/* Written out in full so Tailwind can see the class names at build time. */
const tileCols: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

/**
 * One figure per tile: an icon, the number, and a single line naming it.
 * Deliberately short — a tile that needs three lines of explanation is a tile
 * carrying more than one idea.
 */
export function StatTiles({ items, className }: { items: Stat[]; className?: string }) {
  return (
    <div className={cn("grid gap-3", tileCols[items.length] ?? "grid-cols-4", className)}>
      {items.map((s, i) => {
        const tone = s.tone ?? "ink";
        return (
          <SpringIn key={s.label} delay={i * 70} className="h-full">
            <article className="group relative flex h-full items-center gap-4 border border-divider bg-white px-5 py-4 transition-colors duration-150 ease-out hover:border-ink/40">
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-ink transition-transform duration-300 ease-out group-hover:scale-x-100"
              />
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center",
                  statChip[tone],
                )}
              >
                {s.working ? <Spinner size={15} /> : s.icon}
              </span>
              <div className="min-w-0">
                <div
                  className={cn(
                    "text-[28px] leading-[32px] font-extralight tracking-[-0.01em] tabular-nums",
                    statTone[tone],
                  )}
                >
                  <CountUp
                    to={s.value}
                    duration={1000}
                    delay={i * 80}
                    decimals={s.decimals ?? 0}
                    prefix={s.prefix}
                    suffix={s.suffix}
                    grouped
                  />
                </div>
                {/* Label and provenance on their own lines — never truncated
                    into "In the su…". Two short lines read; one clipped does not. */}
                <p className="text-[13px] leading-[17px] text-ink">{s.label}</p>
                {s.sub && <p className="text-[12px] leading-[16px] text-ink">{s.sub}</p>}
              </div>
            </article>
          </SpringIn>
        );
      })}
    </div>
  );
}

/* ── Tab switch ─────────────────────────────────────────────────────────── */

export function TabSwitch<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex items-center gap-6 border-b border-divider" role="tablist">
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              "group relative -mb-px inline-flex items-center gap-2 whitespace-nowrap pb-2.5 pt-1 text-[13.5px] transition-colors duration-150 ease-out",
              on ? "text-ink" : "text-mute hover:text-ink",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 bottom-0 bg-ink transition-[height,background-color] duration-150 ease-in-out",
                on ? "h-[3px]" : "h-0 bg-steel group-hover:h-[3px]",
              )}
            />
            {t.label}
            {typeof t.count === "number" && (
              <span
                className={cn(
                  "px-1.5 py-0.5 text-[11.5px] leading-[14px] tabular-nums",
                  on ? "bg-ink text-ink-inverse" : "bg-white text-mute border border-divider",
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Agent status chip ──────────────────────────────────────────────────── */

export type AgentState = "processing" | "waiting" | "complete";

/**
 * What the workforce is doing to a row, right now. The processing state types
 * its label out character by character so an agent at work always reads as an
 * agent at work rather than as a static badge.
 */
export function AgentStatusChip({
  state,
  label,
}: {
  state: AgentState;
  label: string;
}) {
  if (state === "processing") {
    return (
      <span className="jlr-scan inline-flex items-center gap-2 whitespace-nowrap bg-sand px-3 py-1.5 text-[13px] text-ink">
        <Spinner size={13} />
        <StreamingText text={label} cps={26} caret={false} />
      </span>
    );
  }
  if (state === "complete") {
    return (
      <span className="inline-flex items-center gap-2 whitespace-nowrap border border-divider bg-white px-3 py-1.5 text-[13px] text-ink">
        <Check size={13} className="text-accent-green" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap bg-surface-red px-3 py-1.5 text-[13px] text-mark-red">
      <AlertTriangle size={13} strokeWidth={2.2} />
      {label}
    </span>
  );
}

/* ── AI reading gate ────────────────────────────────────────────────────── */

/**
 * The house AI beat: a short spinner while the agent reads, then the finding
 * types itself out. Used wherever a page presents an agent's conclusion, so
 * the reasoning never just appears fully formed.
 */
export function AiFinding({
  text,
  gateMs = 900,
  className,
}: {
  text: string;
  gateMs?: number;
  className?: string;
}) {
  const [reading, setReading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setReading(false), gateMs);
    return () => clearTimeout(t);
  }, [gateMs, text]);

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-md bg-surface-mint/45 border border-surface-deep/15 px-4 py-3",
        className,
      )}
    >
      {reading ? (
        <Spinner size={14} className="mt-0.5 shrink-0" />
      ) : (
        <span className="mt-0.5 shrink-0 text-surface-deep ai-pulse">
          <Sparkles size={15} strokeWidth={1.75} />
        </span>
      )}
      <p className="text-[13px] leading-[19px] text-ink min-w-0">
        {reading ? (
          <span className="text-mute">Reading the evidence…</span>
        ) : (
          <StreamingText text={text} cps={92} caret={false} />
        )}
      </p>
    </div>
  );
}

/* ── Section frame ──────────────────────────────────────────────────────── */

export function Panel({
  title,
  sub,
  right,
  children,
  className,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("bg-white border border-divider", className)}>
      <header className="flex items-center justify-between gap-4 px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h2 className="jlr-title text-[14px] leading-[20px] text-ink">{title}</h2>
          {sub && <p className="truncate text-[13px] text-mute leading-snug mt-0.5">{sub}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </header>
      {children}
    </section>
  );
}

/* ── Table primitives ───────────────────────────────────────────────────── */

export function Th({
  children,
  align = "left",
  className,
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-mute whitespace-nowrap",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className,
  title,
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  /** Hover text, for cells whose content is truncated. */
  title?: string;
}) {
  return (
    <td
      title={title}
      className={cn(
        "px-4 py-2.5 text-[13px] text-ink align-middle whitespace-nowrap",
        align === "right" ? "text-right tabular-nums" : "text-left",
        className,
      )}
    >
      {children}
    </td>
  );
}
