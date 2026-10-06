/**
 * Stage blueprint — the enterprise process-map dossier for one P2P stage.
 *
 * Renders the five lanes of the source process map (key process steps · AI
 * intervention points · value delivered · key controls · systems & tools) so
 * each run step carries the full end-to-end depth, not just the worked artifact.
 * It sits above the produced SAP document, framed by the swimlane the stage
 * belongs to (Procurement Operations upstream · Accounts Payable downstream).
 * Deliberately lighter-weight than the SAP doc so the artifact stays the hero.
 */

import * as React from "react";
import { ListChecks, Sparkles, TrendingUp, ShieldCheck, Boxes, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StageDossier as StageDossierData, DossierRow } from "@/data/runSteps";

const LANE_META: Record<DossierRow["lane"], { icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>; tint: string }> = {
  "Key process steps": { icon: ListChecks, tint: "text-mute" },
  "AI intervention points": { icon: Sparkles, tint: "text-surface-deep" },
  "Value delivered": { icon: TrendingUp, tint: "text-[#107e3e]" },
  "Key controls": { icon: ShieldCheck, tint: "text-mute" },
  "Systems / tools": { icon: Boxes, tint: "text-mute" },
};

function LanePoints({ lane, points }: { lane: DossierRow["lane"]; points: string[] }) {
  // Tool names read best as chips; the value lane gets a single emphasised line;
  // the phrase lanes render as a compact "·"-separated run to avoid a text swarm.
  if (lane === "Systems / tools") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {points.map((p) => (
          <span
            key={p}
            className="text-[11px] rounded border border-divider bg-surface-fog/60 text-ink px-2 py-0.5 whitespace-nowrap"
          >
            {p}
          </span>
        ))}
      </div>
    );
  }
  if (lane === "Value delivered") {
    return (
      <div className="inline-flex items-center rounded-md bg-surface-mint/50 border border-surface-mint px-2.5 py-1">
        <span className="text-[12.5px] font-bold text-[#0a5c2b] leading-snug">{points.join(" · ")}</span>
      </div>
    );
  }
  return (
    <p className="text-[12px] text-ink leading-snug">
      {points.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && <span className="text-divider"> · </span>}
          {p}
        </React.Fragment>
      ))}
    </p>
  );
}

export function StageDossier({ dossier }: { dossier: StageDossierData }) {
  return (
    <div className="rounded-md border border-divider bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-divider bg-surface-fog/40">
        <Layers size={13} className="text-surface-deep shrink-0" />
        <span className="text-[11px] uppercase tracking-[0.08em] text-surface-deep font-bold">
          Stage blueprint
        </span>
        <span className="ml-auto text-[10px] uppercase tracking-[0.06em] font-bold text-mute bg-white border border-divider rounded-full px-2 py-0.5 whitespace-nowrap">
          {dossier.swimlane}
        </span>
      </div>

      <div className="divide-y divide-divider">
        {dossier.rows.map((row) => {
          const meta = LANE_META[row.lane];
          const Icon = meta.icon;
          return (
            <div key={row.lane} className="grid grid-cols-[170px_minmax(0,1fr)] gap-3 px-4 py-2.5 items-start">
              <div className="flex items-center gap-1.5">
                <Icon size={13} className={cn("shrink-0", meta.tint)} strokeWidth={2} />
                <span className="text-[11px] uppercase tracking-[0.04em] font-bold text-mute leading-tight">
                  {row.lane}
                </span>
              </div>
              <LanePoints lane={row.lane} points={row.points} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
