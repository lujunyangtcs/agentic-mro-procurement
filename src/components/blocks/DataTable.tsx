import * as React from "react";
import { ChevronRight, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One calm, readable table used across every agent console so the structured
 * evidence each agent reads (supplier pools, contracts, policy, match history,
 * fraud checks…) renders as a real table — column headers + aligned rows — not
 * a stack of cards with tiny grey subtitles. Body cells stay at a legible size;
 * the only small type is the column header chrome.
 */
export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right";
  /** Optional Tailwind width / sizing class, e.g. "w-[120px]" or "w-1/2". */
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  highlight,
  className,
  openDoc,
  openTitle,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Rows that match the live request get a soft mint band. */
  highlight?: (row: T) => boolean;
  className?: string;
  /** Return the source document a row opens, or null if the row isn't openable. */
  openDoc?: (row: T, idx: number) => React.ReactNode | null;
  /** Short title shown in the source-document modal header. */
  openTitle?: (row: T, idx: number) => string;
}) {
  const [open, setOpen] = React.useState<{ node: React.ReactNode; title: string } | null>(null);

  return (
    <div className={cn("overflow-hidden rounded-lg border border-divider", className)}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-surface-fog border-b border-divider">
            {columns.map((c, i) => (
              <th
                key={i}
                className={cn(
                  "py-2 px-3 text-[11px] tracking-[0.06em] uppercase text-surface-deep font-semibold whitespace-nowrap",
                  c.align === "right" && "text-right",
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const doc = openDoc?.(row, ri) ?? null;
            const clickable = !!doc;
            return (
              <tr
                key={rowKey(row)}
                onClick={clickable ? () => setOpen({ node: doc, title: openTitle?.(row, ri) ?? "" }) : undefined}
                className={cn(
                  highlight?.(row) ? "bg-surface-mint/40" : ri % 2 ? "bg-surface-fog/40" : "bg-white",
                  clickable && "cursor-pointer transition-colors hover:bg-surface-mint/60",
                )}
              >
                {columns.map((c, i) => (
                  <td
                    key={i}
                    className={cn(
                      "py-2 px-3 align-top text-[13px] text-ink leading-tight",
                      i === 0 && "whitespace-nowrap",
                      c.align === "right" && "text-right tabular-nums",
                      c.className,
                    )}
                  >
                    {i === 0 && clickable ? (
                      <span className="inline-flex items-center gap-1.5">
                        {c.cell(row)}
                        <ChevronRight size={13} className="text-surface-deep/60 shrink-0" />
                      </span>
                    ) : (
                      c.cell(row)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {open && (
        <DocPreviewModal title={open.title} onClose={() => setOpen(null)}>
          {open.node}
        </DocPreviewModal>
      )}
    </div>
  );
}

/** Centre modal that frames a source document opened from a table row. */
export function DocPreviewModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="ai-spring w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-3.5 border-b border-divider flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={15} className="text-surface-deep shrink-0" />
            <h2 className="text-[14px] font-bold text-ink truncate">{title || "Source document"}</h2>
            <span className="text-[10px] tracking-[0.05em] uppercase text-mute font-medium shrink-0 hidden sm:inline">
              Source document
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-pill w-8 h-8 rounded-full text-mute hover:text-ink flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5 bg-surface-fog/40">{children}</div>
      </div>
    </div>
  );
}

/** A compact status chip for a table cell (Contracted / Preferred / On hold…). */
export function CellTag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "deep" | "sage" | "neutral" | "amber" | "red";
}) {
  const tones: Record<string, string> = {
    deep: "bg-surface-deep text-ink-inverse",
    sage: "bg-surface-sage/25 text-surface-deep",
    neutral: "bg-surface-fog text-mute border border-divider",
    amber: "bg-[#fef0e6] text-[#a25b00]",
    red: "bg-mark-red/10 text-mark-red",
  };
  return (
    <span
      className={cn(
        "inline-block text-[11px] tracking-[0.04em] uppercase font-bold px-2 py-0.5 rounded",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
