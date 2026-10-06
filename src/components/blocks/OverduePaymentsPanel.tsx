import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/state";
import { overduePayments, type OverdueRow } from "@/data/cockpit";
import { AIDot } from "@/components/ai/AIDot";

/** Rows shown before the "Show more" row — keeps the panel level with Pipeline. */
const INITIAL_ROWS = 5;

/**
 * Overdue receivables — the Payment & Collections agent's watchlist on the
 * cockpit. Each row shows the aged invoice, the dunning tier the agent has
 * auto-sent, and which one needs a person. Actionable rows deep-link into the
 * collections run. Replaces the Expediting panel.
 */

const lateColor: Record<OverdueRow["tone"], string> = {
  critical: "text-mark-red",
  high: "text-[#a25b00]",
  medium: "text-mute",
};

function OverdueItem({ row }: { row: OverdueRow }) {
  const { go } = useApp();
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[12px] text-mute mb-0.5">
          <span className="font-medium text-ink tabular-nums">{row.id}</span>
          <span aria-hidden>·</span>
          <span className="truncate">{row.customer}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[13px] leading-snug">
          <span className="text-ink">{row.tier}</span>
          <span
            className={cn(
              "text-[11px] font-medium px-1.5 py-0.5 rounded",
              row.actionable
                ? "bg-surface-mint text-surface-deep"
                : "bg-surface-fog text-mute",
            )}
          >
            {row.status}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={cn("text-[12px] font-bold", lateColor[row.tone])}>{row.aging}</div>
        <div className="text-[13px] font-medium text-ink mt-0.5">{row.amount}</div>
      </div>
      {row.target && (
        <span aria-hidden className="text-mute text-[13px] shrink-0 self-center">
          ↗
        </span>
      )}
    </>
  );

  if (!row.target) {
    return <div className="w-full flex items-start gap-3 px-4 py-3">{body}</div>;
  }
  return (
    <button
      type="button"
      onClick={() => go(row.target!)}
      className={cn(
        "ui-pill w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-surface-mint/35",
        row.actionable && "bg-surface-mint/15",
      )}
    >
      {body}
    </button>
  );
}

export function OverduePaymentsPanel({ className }: { className?: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const rows = overduePayments.rows;
  const visible = expanded ? rows : rows.slice(0, INITIAL_ROWS);
  const hidden = rows.length - INITIAL_ROWS;

  return (
    <section
      className={cn(
        "bg-white border border-divider rounded-md overflow-hidden flex flex-col",
        className,
      )}
    >
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-divider">
        <div className="flex items-center gap-3">
          <AIDot size={6} tone="deep" pulse />
          <span className="text-[12px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Overdue payments
          </span>
        </div>
        <span className="text-[11px] text-mute">auto-sending reminders</span>
      </header>

      <div className="flex-1 divide-y divide-divider">
        {visible.map((r) => (
          <OverdueItem key={r.id} row={r} />
        ))}
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="ui-pill w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-[12px] font-medium text-surface-deep hover:bg-surface-mint/30"
          >
            {expanded ? "Show less" : `Show ${hidden} more`}
            <ChevronDown
              size={14}
              className={cn("transition-transform", expanded && "rotate-180")}
            />
          </button>
        )}
      </div>

      <div className="mt-auto border-t border-divider px-4 py-2.5">
        <span className="text-[12px] text-mute">{overduePayments.footer}</span>
      </div>
    </section>
  );
}
