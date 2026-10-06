import { Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIDot } from "@/components/ai/AIDot";
import type { DunningTier } from "@/data/dunning";

/**
 * The contract-based dunning ladder — five escalation tiers from a soft courtesy
 * nudge to a hard pre-legal demand. The agent's pick is surfaced as an "AI
 * recommends" tag on the FRAME (not a badge inside a tier), and every tier is
 * clickable: selecting one loads its drafted notice into the editable compose
 * card below. The selected tier is highlighted; the recommended tier carries a
 * small sparkle when it isn't the current selection. Presentational.
 */

/** Soft (green) → hard (red) colour ramp across the five tiers. */
const RAMP = ["#107e3e", "#6a8b22", "#a07a12", "#b5560f", "#bb0000"];

export function DunningLadder({
  tiers,
  recommended,
  selected,
  contract,
  onSelect,
}: {
  tiers: DunningTier[];
  recommended: number;
  selected: number;
  contract: string;
  onSelect: (n: number) => void;
}) {
  const rec = tiers.find((t) => t.n === recommended);
  return (
    <article className="bg-white border border-divider rounded-md overflow-hidden">
      <header className="flex items-center gap-2 px-4 py-2.5 border-b border-divider bg-surface-fog">
        <AIDot size={6} tone="deep" pulse />
        <span className="text-[11px] uppercase tracking-[0.07em] font-bold text-surface-deep">
          Dunning ladder · contract-based escalation
        </span>
        {rec && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-surface-mint/70 border border-surface-deep/20 px-2.5 py-1 text-[10.5px] font-bold text-surface-deep">
            <Sparkles size={11} /> AI recommends · Tier {rec.n} · {rec.name}
          </span>
        )}
      </header>

      <div className="p-4">
        <div className="flex items-center justify-between text-[9.5px] uppercase tracking-[0.1em] text-mute font-bold mb-2 px-0.5">
          <span>Soft</span>
          <span className="text-[8.5px] tracking-[0.06em]">escalation as days past due grow →</span>
          <span>Hard</span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {tiers.map((t, i) => {
            const c = RAMP[i] ?? RAMP[RAMP.length - 1];
            const isSelected = t.n === selected;
            const isRec = t.n === recommended;
            return (
              <button
                key={t.n}
                type="button"
                onClick={() => onSelect(t.n)}
                title={`Open the Tier ${t.n} draft`}
                className={cn(
                  "ui-pill relative rounded-md p-2.5 flex flex-col gap-1 text-left transition-all",
                  isSelected ? "border-2 shadow-sm" : "border hover:border-surface-deep/40",
                )}
                style={{
                  borderColor: isSelected ? c : "#e2e7ec",
                  background: isSelected ? `color-mix(in srgb, ${c} 9%, white)` : "white",
                }}
              >
                {isSelected && (
                  <span
                    className="absolute -top-2 right-2 inline-flex items-center gap-0.5 text-[7.5px] font-bold uppercase tracking-[0.06em] text-white px-1.5 py-0.5 rounded shadow-sm"
                    style={{ background: c }}
                  >
                    <Check size={8} strokeWidth={3} /> Selected
                  </span>
                )}
                {isRec && !isSelected && (
                  <Sparkles size={11} className="absolute top-2 right-2 text-surface-deep/70" />
                )}
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                    style={{ background: c }}
                  >
                    {t.n}
                  </span>
                  <span className="text-[11px] font-bold text-ink leading-tight">{t.name}</span>
                </div>
                <span className="text-[9.5px] text-mute tabular-nums">{t.band}</span>
                <span className="text-[10px] text-ink leading-snug">{t.gist}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2.5 text-[11px] text-mute">
          Contract {contract} · click any tier to load and edit its notice.
        </div>
      </div>
    </article>
  );
}
