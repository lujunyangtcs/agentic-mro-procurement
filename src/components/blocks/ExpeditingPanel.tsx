import { cn } from "@/lib/utils";
import { useApp } from "@/state";
import { expediting, type ChaseRow } from "@/data/cockpit";
import { AIDot } from "@/components/ai/AIDot";

const lateColor: Record<ChaseRow["tone"], string> = {
  critical: "text-mark-red",
  high: "text-[#a25b00]",
  medium: "text-mute",
};

function ChaseItem({ row }: { row: ChaseRow }) {
  const { go } = useApp();
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[12px] text-mute mb-0.5">
          <span className="font-medium text-ink">{row.id}</span>
          <span aria-hidden>·</span>
          <span className="truncate">{row.subject}</span>
        </div>
        <div className="text-[13px] text-ink leading-snug">{row.action}</div>
      </div>
      <div className="text-right shrink-0">
        <div className={cn("text-[12px] font-bold", lateColor[row.tone])}>{row.lateLabel}</div>
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
      className="ui-pill w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-surface-mint/35"
    >
      {body}
    </button>
  );
}

export function ExpeditingPanel({ className }: { className?: string }) {
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
            Expediting
          </span>
        </div>
        <span className="text-[11px] text-mute">$216K at risk</span>
      </header>

      <div className="flex-1 divide-y divide-divider">
        {expediting.rows.map((r) => (
          <ChaseItem key={r.id} row={r} />
        ))}
      </div>

      <div className="mt-auto border-t border-divider px-4 py-2.5">
        <span className="text-[12px] text-mute">{expediting.footer}</span>
      </div>
    </section>
  );
}
