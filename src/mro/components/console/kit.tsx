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
    <div className="pl-5 pr-6 pt-4 pb-10 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      {/* z-40: the language menu must drop OVER the tiles below, never under. */}
      {(title || lead || actions) && (
        <SpringIn className="relative z-40 mt-3.5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h1 className="text-[24px] leading-[29px] font-bold tracking-[-0.02em] text-ink">
                {title}
              </h1>
            )}
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
      <div className="rounded-md bg-surface-deep px-4 py-3.5">
        {(title || right) && (
          <div className="flex items-center justify-between gap-4 pb-2">
            {title && (
              <h1 className="text-[24px] leading-[29px] font-bold tracking-[-0.02em] text-ink-inverse">
                {title}
              </h1>
            )}
            {right && <div className="flex shrink-0 items-center gap-2.5">{right}</div>}
          </div>
        )}
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-surface-mint ai-pulse">
            <Sparkles size={17} strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold leading-[20px] text-ink-inverse">
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
            <article className="flex h-full items-center gap-3.5 rounded-md border border-divider bg-white px-4 py-3.5">
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                  statChip[tone],
                )}
              >
                {s.working ? <Spinner size={15} /> : s.icon}
              </span>
              <div className="min-w-0">
                <div
                  className={cn(
                    "text-[26px] leading-[30px] font-bold tracking-[-0.02em] tabular-nums",
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
    <div className="flex items-center gap-2">
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "ui-pill inline-flex items-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-[13px] font-medium transition-colors",
              on
                ? "bg-surface-deep border-surface-deep text-ink-inverse"
                : "bg-white border-divider text-ink hover:bg-surface-mint/40",
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[12px] font-bold tabular-nums",
                  on ? "bg-white/20 text-ink-inverse" : "bg-surface-fog text-mute",
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
      <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-surface-mint px-3 py-1.5 text-[13px] font-medium text-surface-deep">
        <Spinner size={13} />
        <StreamingText text={label} cps={26} caret={false} />
      </span>
    );
  }
  if (state === "complete") {
    return (
      <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-surface-fog px-3 py-1.5 text-[13px] font-medium text-ink">
        <Check size={13} strokeWidth={2.6} className="text-accent-green" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-surface-rose px-3 py-1.5 text-[13px] font-medium text-mark-red">
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
    <section className={cn("bg-white border border-divider rounded-md", className)}>
      <header className="flex items-center justify-between gap-4 px-4 pt-3.5 pb-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-ink leading-tight">{title}</h2>
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
