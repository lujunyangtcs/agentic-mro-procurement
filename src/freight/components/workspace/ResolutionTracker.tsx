import * as React from "react";
import { AIDot } from "@/freight/components/ai/AIDot";
import { SpringIn } from "@/freight/components/ai/SpringIn";
import { Clock } from "lucide-react";
import { cn } from "@/freight/lib/utils";

export type ExceptionType =
  | "missing-po"
  | "wrong-company-code"
  | "insufficient-po"
  | "rate-mismatch";

export type ResolutionLane = {
  team: string;
  type: ExceptionType;
  count: number;
  sla: string;
  status: "queued" | "in-progress" | "cleared";
};

export type ResolutionTrackerProps = {
  lanes: ResolutionLane[];
  footer: string;
};

/** Per-type accent + label. Amber uses the inline #c2740c token. */
const ACCENT: Record<
  ExceptionType,
  { dot: "red" | "green" | "deep" | "mute"; bar: string; chip: string; label: string }
> = {
  "missing-po": { dot: "red", bar: "var(--mark-red, #a6192e)", chip: "bg-surface-rose text-mark-red", label: "Missing PO" },
  "wrong-company-code": { dot: "green", bar: "var(--surface-sage, #277e6e)", chip: "bg-surface-sage/40 text-surface-deep", label: "Wrong company code" },
  "insufficient-po": { dot: "mute", bar: "#c2740c", chip: "bg-[#c2740c]/12 text-[#c2740c]", label: "Insufficient PO value" },
  "rate-mismatch": { dot: "deep", bar: "var(--surface-deep, #084337)", chip: "bg-surface-mint text-surface-deep", label: "Rate mismatch" },
};

/** Rail fill fraction by lifecycle stage. */
const FILL: Record<ResolutionLane["status"], number> = {
  queued: 0.22,
  "in-progress": 0.64,
  cleared: 1,
};

export function ResolutionTracker({ lanes, footer }: ResolutionTrackerProps): React.ReactElement {
  // Shortest-SLA lane (by hours) gets the pulsing amber countdown chip.
  const hours = (s: string) => (s.includes("d") ? parseInt(s) * 24 : parseInt(s) || 999);
  const soonest = lanes.reduce((a, b) => (hours(b.sla) < hours(a.sla) ? b : a), lanes[0]);

  return (
    <SpringIn>
      <article className="bg-white border border-divider rounded-md p-5">
        <style>{`
          @keyframes rt-fill { from { width: 0%; } }
          @keyframes rt-amber { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        `}</style>
        <header className="flex items-center gap-2 mb-4">
          <AIDot size={6} tone="deep" pulse />
          <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Resolution SLAs · routed to the system of record
          </span>
        </header>

        <div className="space-y-3">
          {lanes.map((lane, i) => {
            const a = ACCENT[lane.type];
            const active = lane.status === "in-progress";
            const isSoonest = lane === soonest;
            return (
              <div key={lane.type} className="flex items-center gap-3">
                <AIDot size={9} tone={a.dot} pulse={active} className="shrink-0" />

                <div className="w-44 shrink-0 min-w-0">
                  <div className="text-[13px] font-semibold text-ink truncate">{lane.team}</div>
                  <div className="text-[11px] text-mute truncate">
                    {a.label} · {lane.count} open
                  </div>
                </div>

                <span
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                    isSoonest ? "bg-[#c2740c]/12 text-[#c2740c]" : a.chip,
                  )}
                  style={isSoonest ? { animation: "rt-amber 1.6s ease-in-out infinite" } : undefined}
                >
                  <Clock size={11} strokeWidth={2.4} />
                  {lane.sla}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="h-1.5 rounded-full bg-surface-fog overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${FILL[lane.status] * 100}%`,
                        background: a.bar,
                        animation: `rt-fill 900ms ${180 + i * 140}ms cubic-bezier(.22,1,.36,1) both`,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[9px] uppercase tracking-[0.06em] text-mute">
                    <span className={cn(lane.status !== "queued" && "text-surface-deep font-semibold")}>Queued</span>
                    <span className={cn(active && "text-surface-deep font-semibold")}>In progress</span>
                    <span className={cn(lane.status === "cleared" && "text-surface-deep font-semibold")}>Cleared</span>
                  </div>
                </div>

                <span
                  className={cn(
                    "shrink-0 text-[10px] tracking-[0.06em] uppercase font-medium px-1.5 py-0.5 rounded w-20 text-center",
                    lane.status === "cleared"
                      ? "bg-surface-mint text-surface-deep"
                      : active
                        ? "bg-surface-sage/30 text-surface-deep"
                        : "bg-surface-fog text-mute",
                  )}
                >
                  {lane.status === "in-progress" ? "Working" : lane.status === "cleared" ? "Cleared" : "Queued"}
                </span>
              </div>
            );
          })}
        </div>

        <footer className="mt-4 pt-3 border-t border-divider text-[11px] text-mute tabular-nums">
          {footer}
        </footer>
      </article>
    </SpringIn>
  );
}
