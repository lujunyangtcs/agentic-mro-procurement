import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/freight/lib/utils";

/**
 * One flagged carrier invoice in the exception router. Carrier + SCAC, invoice
 * id (mono), amount (red), the one-line reason. The whole card is a button —
 * clicking opens the offending invoice/PO doc in the source-artifact modal.
 * Reused by the ExceptionRouterBoard and by cockpit/source previews.
 */

export type ExceptionItem = {
  id: string;
  carrier: string;
  scac?: string;
  invoice: string;
  amount: string;
  reason: string;
  open?: () => void;
  /** The offending invoice/PO doc, opened in a modal when the card is clicked. */
  preview?: ReactNode;
};

export function ExceptionCard({
  item,
  accent,
  routed,
  className,
}: {
  item: ExceptionItem;
  accent: string;
  /** Once the human routes the batch, the card flips to a routed state. */
  routed?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={item.open}
      className={cn(
        "ui-pill group block w-full text-left rounded-md border bg-white px-2.5 py-2 transition-all",
        routed ? "border-surface-deep/40 bg-surface-mint/20" : "border-divider hover:border-surface-deep hover:shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: accent }} />
        <span className="text-[11.5px] font-semibold text-ink truncate">{item.carrier}</span>
        {item.scac && <span className="text-[9px] text-mute shrink-0">{item.scac}</span>}
        <ArrowUpRight
          size={12}
          className="ml-auto text-mute opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        />
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10.5px] font-mono text-mute truncate">{item.invoice}</span>
        <span className="ml-auto text-[12px] font-bold text-mark-red tabular-nums shrink-0">{item.amount}</span>
      </div>
      <p className="text-[10.5px] text-mute leading-snug mt-1">{item.reason}</p>
    </button>
  );
}
