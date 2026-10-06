import * as React from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/freight/lib/utils";
import { SpringIn } from "@/freight/components/ai/SpringIn";
import { Spinner } from "@/freight/components/ai/Spinner";

/**
 * The 3-way "reality lens" — the centerpiece of the freight reconciliation.
 * Not a flat grid: each cost line is a track with three station-nodes —
 * Contract (entitlement) · Shipment-reality (ground truth, the ringed ANCHOR) ·
 * Invoice (the claim). The rail between Reality↔Invoice thickens red when they
 * disagree. A flagged track opens an inline evidence drawer (gauge / clock /
 * scope) anchored directly under the line. Lines reveal one-by-one on mount.
 */

export type ReconLine = {
  id: string;
  label: string;
  contract: { display: string; basis?: string };
  reality: { display: string; source: string };
  invoice: { display: string };
  status: "clears" | "flag";
  delta?: { amount: string; sign: "over" | "not-owed" };
  /** Mounted in the inline drawer when a flagged line is expanded. */
  evidenceNode?: React.ReactNode;
};

export type ReconciliationBoardProps = {
  lines: ReconLine[];
  /** Summary line shown under the board once every line has landed. */
  verdict?: string;
};

const REVEAL_DELAY = 420; // before the first line
const LINE_STAGGER = 600; // gap between lines landing

export function ReconciliationBoard({ lines, verdict }: ReconciliationBoardProps) {
  const [shown, setShown] = React.useState(0);
  const [open, setOpen] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timers = lines.map((_, i) =>
      window.setTimeout(
        () => setShown((n) => Math.max(n, i + 1)),
        REVEAL_DELAY + i * LINE_STAGGER,
      ),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [lines]);

  const allShown = shown >= lines.length;
  const flags = lines.filter((l) => l.status === "flag").length;

  return (
    <div className="bg-white border border-divider rounded-md overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#eef1f5] border-b border-divider border-l-[3px] border-l-surface-deep">
        <span className="text-[10.5px] uppercase tracking-[0.07em] font-bold text-surface-deep">
          Three-way reality lens · Contract × Shipment × Invoice
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-[10.5px] text-mute whitespace-nowrap">
          {allShown ? (
            `${flags} line${flags === 1 ? "" : "s"} flagged`
          ) : (
            <>
              <Spinner size={10} /> matching…
            </>
          )}
        </span>
      </div>

      <div className="px-3 py-3 space-y-1.5">
        {lines.map((line, i) => (
          <LineTrack
            key={line.id}
            line={line}
            shown={i < shown}
            open={open === line.id}
            onToggle={() => setOpen((o) => (o === line.id ? null : line.id))}
          />
        ))}
      </div>

      {allShown && verdict && (
        <div className="px-4 pb-4 pt-0">
          <SpringIn className="rounded-md bg-surface-mint/40 border border-surface-mint px-3 py-2.5 text-[12px] text-ink leading-snug">
            {verdict}
          </SpringIn>
        </div>
      )}
    </div>
  );
}

function Node({
  tag,
  value,
  basis,
  anchor,
  flag,
}: {
  tag: string;
  value: string;
  basis?: string;
  anchor?: boolean;
  flag?: boolean;
}) {
  return (
    <div className="min-w-0 flex flex-col">
      <span className="text-[8.5px] uppercase tracking-[0.07em] text-mute font-semibold mb-0.5 text-center">
        {tag}
      </span>
      <span
        className={cn(
          "rounded-md px-2 py-1 text-[11.5px] text-center leading-tight border min-w-0",
          anchor
            ? "bg-surface-mint border-surface-deep ring-1 ring-surface-deep/30 font-bold text-surface-deep"
            : flag
              ? "bg-surface-rose/50 border-mark-red/40 text-ink"
              : "bg-surface-fog border-divider text-ink",
        )}
      >
        <span className="block truncate">{value}</span>
        {basis && <span className="block text-[9px] text-mute font-normal truncate">{basis}</span>}
      </span>
    </div>
  );
}

function LineTrack({
  line,
  shown,
  open,
  onToggle,
}: {
  line: ReconLine;
  shown: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const flag = line.status === "flag";
  const hasDrawer = flag && Boolean(line.evidenceNode);

  if (!shown) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-divider bg-surface-fog/40 px-3 py-[18px] opacity-40">
        <span className="w-24 shrink-0 text-[11px] text-mute">
          <Spinner size={12} />
        </span>
      </div>
    );
  }

  return (
    <SpringIn>
      <div
        className={cn(
          "rounded-md border transition-colors",
          flag ? "border-mark-red/30 bg-surface-rose/10" : "border-divider bg-white",
        )}
      >
        <div className="flex items-center gap-2.5 px-3 py-2">
          <span className="w-[88px] shrink-0 text-[12px] font-semibold text-ink leading-tight">
            {line.label}
          </span>
          <div className="flex-1 grid grid-cols-[1fr_18px_1fr_18px_1fr] items-end gap-1 min-w-0">
            <Node tag="Contract" value={line.contract.display} basis={line.contract.basis} />
            <span className="mb-3 h-[2px] w-full rounded bg-divider" />
            <Node tag="Reality" value={line.reality.display} basis={line.reality.source} anchor />
            <span
              className={cn("mb-3 w-full rounded", flag ? "h-[3px] bg-mark-red" : "h-[2px] bg-divider")}
            />
            <Node tag="Invoice" value={line.invoice.display} flag={flag} />
          </div>
          <div className="w-[112px] shrink-0 flex items-center justify-end gap-1.5">
            {flag ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-mark-red/10 text-mark-red px-2 py-0.5 text-[11px] font-bold whitespace-nowrap tabular-nums">
                <X size={11} strokeWidth={3} /> {line.delta?.amount}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-deep/10 text-surface-deep px-2 py-0.5 text-[11px] font-bold">
                <Check size={11} strokeWidth={3} /> clears
              </span>
            )}
            {hasDrawer && (
              <button
                type="button"
                onClick={onToggle}
                aria-label="Open evidence"
                className="ui-pill grid place-items-center h-6 w-6 rounded-full text-surface-deep hover:bg-surface-mint/50"
              >
                <ChevronDown size={15} className={cn("transition-transform", open && "rotate-180")} />
              </button>
            )}
          </div>
        </div>
        {hasDrawer && open && (
          <div className="px-3 pb-3 pt-1 border-t border-divider/60">{line.evidenceNode}</div>
        )}
      </div>
    </SpringIn>
  );
}
