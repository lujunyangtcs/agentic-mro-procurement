import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchGrid } from "@/data/runSteps";

/**
 * The cumulative four-way-match grid. It does NOT remount between match stages —
 * each stage passes a longer `reveal` list, so the columns already on screen
 * stay put (with their green ticks) and only the newly-added column fills in,
 * cell by cell. The effect is a live side-by-side comparison: invoice → PO → GR
 * → contract line up column by column, and once the last column lands every
 * matched row gets its verdict tick.
 */

const CELL_STAGGER = 90; // gap between cells filling within a column
const COL_GAP = 150; // pause between columns

export function FourWayMatchGrid({
  grid,
  reveal,
  verdict,
  replayKey = 0,
  baseline = "invoice",
  onReady,
}: {
  grid: MatchGrid;
  reveal: string[];
  verdict?: string;
  /** Bumping this re-animates the revealed columns (Discard / re-match). */
  replayKey?: number;
  baseline?: string;
  onReady?: () => void;
}) {
  const seed = React.useCallback(() => {
    const init: Record<string, boolean> = {};
    grid.rows.forEach((_, ri) => (init[`${baseline}:${ri}`] = true));
    return init;
  }, [grid.rows, baseline]);

  const [visible, setVisible] = React.useState<Record<string, boolean>>(seed);
  const [hot, setHot] = React.useState<string | null>(null);
  const [showVerdict, setShowVerdict] = React.useState(false);
  const settledRef = React.useRef<string[]>([baseline]);
  const prevReplayRef = React.useRef(replayKey);
  const onReadyRef = React.useRef(onReady);
  onReadyRef.current = onReady;

  const revealKey = reveal.join(",");

  React.useEffect(() => {
    // Discard re-runs the match: only when replayKey actually changes (not just
    // because it's non-zero) reset to the baseline column, then re-animate.
    if (replayKey !== prevReplayRef.current) {
      prevReplayRef.current = replayKey;
      settledRef.current = [baseline];
      setVisible(seed());
      setShowVerdict(false);
    }

    const pending = reveal.filter((c) => !settledRef.current.includes(c));
    if (pending.length === 0) {
      onReadyRef.current?.();
      return;
    }

    const timers: number[] = [];
    let t = 0;
    pending.forEach((col) => {
      grid.rows.forEach((_, ri) => {
        const key = `${col}:${ri}`;
        timers.push(
          window.setTimeout(() => {
            setVisible((v) => ({ ...v, [key]: true }));
            setHot(key);
            timers.push(window.setTimeout(() => setHot((h) => (h === key ? null : h)), 380));
          }, t),
        );
        t += CELL_STAGGER;
      });
      t += COL_GAP;
    });
    timers.push(
      window.setTimeout(() => {
        settledRef.current = [...settledRef.current, ...pending];
        if (reveal.length >= grid.columns.length) setShowVerdict(true);
        onReadyRef.current?.();
      }, t),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealKey, replayKey]);

  const fullyRevealed = reveal.length >= grid.columns.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11.5px] border-collapse">
        <thead>
          <tr className="text-left">
            <th className="px-2 py-2 border-b border-divider" />
            {grid.columns.map((c) => {
              const on = reveal.includes(c.key);
              return (
                <th
                  key={c.key}
                  className={cn(
                    "px-2 py-2 text-[10px] uppercase tracking-[0.05em] font-bold border-b border-divider whitespace-nowrap transition-colors duration-300",
                    on ? "text-surface-deep" : "text-mute/30",
                  )}
                >
                  {c.label}
                </th>
              );
            })}
            <th className="px-2 py-2 border-b border-divider text-[10px] uppercase tracking-[0.05em] font-bold text-surface-deep text-center">
              {fullyRevealed ? "Match" : ""}
            </th>
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row, ri) => {
            // A row matches once every column that carries this dimension agrees.
            const matched = grid.columns.every((c) => {
              const cell = row.cells[c.key];
              if (!cell || cell.value === "—") return true;
              return cell.ok;
            });
            return (
              <tr key={row.dimension}>
                <td className="px-2 py-2 border-b border-divider text-mute whitespace-nowrap">
                  {row.dimension}
                </td>
                {grid.columns.map((c) => {
                  const cell = row.cells[c.key];
                  const key = `${c.key}:${ri}`;
                  const show = !!visible[key] && reveal.includes(c.key);
                  const dash = cell?.value === "—";
                  return (
                    <td
                      key={c.key}
                      className={cn(
                        "px-2 py-2 border-b border-divider tabular-nums transition-colors duration-300",
                        hot === key && "bg-surface-mint/60",
                      )}
                    >
                      {show ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1",
                            dash ? "text-mute/40" : "text-ink",
                          )}
                        >
                          {cell.value}
                          {!dash && cell.ok && (
                            <Check size={11} className="text-[#107e3e]" strokeWidth={3} />
                          )}
                        </span>
                      ) : (
                        <span className="text-mute/20">·</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-2 py-2 border-b border-divider text-center">
                  {showVerdict && (
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold",
                        matched ? "bg-[#107e3e]" : "bg-[#bb0000]",
                      )}
                    >
                      {matched ? "✓" : "✕"}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {verdict && showVerdict && (
        <div className="px-2.5 pt-3 flex items-center gap-2 text-[12px] text-ink">
          <span className="w-2.5 h-2.5 rounded-full bg-[#107e3e] shrink-0" />
          {verdict}
        </div>
      )}
    </div>
  );
}
