import * as React from "react";
import { ArrowRight, Check, Send } from "lucide-react";
import { cn } from "@/freight/lib/utils";
import { SpringIn } from "@/freight/components/ai/SpringIn";
import { ExceptionCard, type ExceptionItem } from "@/freight/components/workspace/ExceptionCard";
import { PreviewModal } from "@/freight/components/docs/freight/FreightDocs";

/**
 * The settlement-automation centerpiece — UC4 made visible. Four lanes, one per
 * exception type, each holding the flagged-invoice cards and docked to the team
 * that owns the fix. "Route all" sends every exception down its lane into the
 * owning team's dock, staggered, flipping each card + dock to routed. The agent
 * triages; the human clicks route once. Only exceptions move — the rest already
 * settled touchless.
 */

export type ExceptionType =
  | "missing-po"
  | "wrong-company-code"
  | "insufficient-po"
  | "rate-mismatch";

export type RouterLane = {
  type: ExceptionType;
  label: string;
  accent: string;
  team: string;
  sla: string;
  count: number;
  atRisk: string;
  cards: ExceptionItem[];
};

export type ExceptionRouterBoardProps = {
  lanes: RouterLane[];
  /** Drives the route animation from the parent (e.g. on Approve). Defaults to an internal button. */
  routed?: boolean;
};

export function ExceptionRouterBoard({ lanes, routed: routedProp }: ExceptionRouterBoardProps) {
  const [routedState, setRoutedState] = React.useState(false);
  const [preview, setPreview] = React.useState<React.ReactNode>(null);
  const routed = routedProp ?? routedState;
  const total = lanes.reduce((n, l) => n + l.count, 0);

  return (
    <div className="bg-white border border-divider rounded-md overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#eef1f5] border-b border-divider border-l-[3px] border-l-surface-deep">
        <span className="text-[10.5px] uppercase tracking-[0.07em] font-bold text-surface-deep">
          Exception router · only the {total} breaches move
        </span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold transition-colors",
            routed ? "bg-surface-deep/10 text-surface-deep" : "bg-surface-fog text-mute",
          )}
        >
          {routed ? (
            <>
              <Check size={11} strokeWidth={3} /> {total} routed to 4 teams
            </>
          ) : (
            `${total} queued`
          )}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3">
        {lanes.map((lane, li) => (
          <Lane key={lane.type} lane={lane} routed={routed} laneIndex={li} onPreview={setPreview} />
        ))}
      </div>

      {preview && <PreviewModal node={preview} onClose={() => setPreview(null)} />}

      {routedProp === undefined && (
        <div className="px-4 pb-4 pt-0">
          <button
            type="button"
            onClick={() => setRoutedState(true)}
            disabled={routed}
            className={cn(
              "ui-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-bold transition-colors",
              routed
                ? "bg-surface-mint/50 text-surface-deep cursor-default"
                : "bg-surface-deep text-ink-inverse hover:bg-accent-green",
            )}
          >
            {routed ? (
              <>
                <Check size={14} /> Routed
              </>
            ) : (
              <>
                <Send size={14} /> Route all {total} exceptions
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function Lane({
  lane,
  routed,
  laneIndex,
  onPreview,
}: {
  lane: RouterLane;
  routed: boolean;
  laneIndex: number;
  onPreview: (node: React.ReactNode) => void;
}) {
  return (
    <SpringIn delay={laneIndex * 90} className="flex flex-col">
      {/* lane header chip */}
      <div
        className="rounded-md px-2.5 py-1.5 mb-2 border"
        style={{ background: `${lane.accent}14`, borderColor: `${lane.accent}55` }}
      >
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: lane.accent }} />
          <span className="text-[11px] font-bold text-ink leading-tight">{lane.label}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-mute">
          <span className="font-bold tabular-nums" style={{ color: lane.accent }}>
            {lane.count}
          </span>
          <span>·</span>
          <span className="tabular-nums">{lane.atRisk} at risk</span>
        </div>
      </div>

      {/* cards */}
      <div
        className="flex-1 space-y-1.5 transition-all duration-500"
        style={{ transitionDelay: `${laneIndex * 120}ms`, transform: routed ? "translateY(4px)" : "none" }}
      >
        {lane.cards.map((card) => (
          <ExceptionCard
            key={card.id}
            item={card.preview ? { ...card, open: () => onPreview(card.preview) } : card}
            accent={lane.accent}
            routed={routed}
          />
        ))}
        {lane.count > lane.cards.length && (
          <div className="text-[10px] text-mute text-center pt-0.5">
            + {lane.count - lane.cards.length} more
          </div>
        )}
      </div>

      {/* connector + dock */}
      <div className="flex flex-col items-center pt-1.5">
        <span
          className={cn(
            "h-4 w-[2px] rounded transition-colors duration-300",
            routed ? "" : "bg-divider",
          )}
          style={routed ? { background: lane.accent } : undefined}
        />
        <ArrowRight
          size={13}
          className={cn("rotate-90 -my-0.5 transition-colors duration-300", routed ? "" : "text-divider")}
          style={routed ? { color: lane.accent } : undefined}
        />
      </div>
      <div
        className={cn(
          "rounded-md px-2.5 py-1.5 mt-0.5 border text-center transition-all duration-300",
          routed ? "" : "border-divider bg-surface-fog",
        )}
        style={routed ? { background: `${lane.accent}1f`, borderColor: `${lane.accent}66` } : undefined}
      >
        <div className="text-[11px] font-bold text-ink leading-tight">{lane.team}</div>
        <div className="flex items-center justify-center gap-1 mt-0.5 text-[10px]">
          {routed ? (
            <span className="inline-flex items-center gap-0.5 font-bold" style={{ color: lane.accent }}>
              <Check size={10} strokeWidth={3} /> {lane.count} received
            </span>
          ) : (
            <span className="text-mute">awaiting · SLA {lane.sla}</span>
          )}
        </div>
      </div>
    </SpringIn>
  );
}
