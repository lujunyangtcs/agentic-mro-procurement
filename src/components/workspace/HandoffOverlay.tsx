import { createPortal } from "react-dom";
import { ShieldCheck } from "lucide-react";
import { SpringIn } from "@/components/ai/SpringIn";
import { AIDot } from "@/components/ai/AIDot";
import { agentsById, type AgentId } from "@/data/agents";

/**
 * The visible baton-pass. When a step is approved, this overlays the workspace
 * for a beat: the finishing agent (left, done) hands its output along an animated
 * conveyor to the receiver (right, waking up), then the run advances. The
 * receiver is the next agent on an intermediate step, or — on the final step —
 * the run's owner (the orchestrator, or a human reviewer like the category
 * manager / fraud desk), passed as toName/toLabel. Turns a silent state bump
 * into the "the agent just triggered the next owner" moment.
 */
export function HandoffOverlay({
  from,
  to,
  toName,
  toLabel,
}: {
  from: AgentId;
  to?: AgentId;
  toName?: string;
  toLabel?: string;
}) {
  const A = agentsById[from];
  const B = to ? agentsById[to] : null;
  const receiverName = B ? B.name : toName ?? "";
  const receiverLabel = B ? B.menuLabel : toLabel ?? toName ?? "";
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[2px] px-4">
      <SpringIn>
        <div className="bg-white border border-divider rounded-xl shadow-xl px-7 py-6 flex flex-col items-center gap-3 min-w-[340px]">
          <div className="text-[11px] uppercase tracking-[0.08em] text-surface-deep font-bold">
            Handing off
          </div>
          <div className="flex items-center gap-3">
            {/* finishing agent — done */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="w-12 h-12 rounded-xl bg-surface-deep text-ink-inverse flex items-center justify-center">
                <A.icon size={22} />
              </span>
              <span className="text-[11px] text-mute max-w-[92px] text-center leading-tight">
                {A.menuLabel}
              </span>
            </div>

            {/* animated conveyor */}
            <svg width="96" height="24" viewBox="0 0 96 24" className="shrink-0 text-surface-deep">
              <line x1="2" y1="12" x2="82" y2="12" stroke="#d6ded6" strokeWidth="2" />
              <line
                x1="2"
                y1="12"
                x2="82"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
                className="hr-flow"
              />
              <path d="M82 6 L94 12 L82 18 Z" fill="currentColor" />
            </svg>

            {/* receiver — next agent, or the run's final owner — waking up */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="relative w-12 h-12 rounded-xl bg-surface-mint text-surface-deep border-2 border-surface-deep flex items-center justify-center">
                {B ? <B.icon size={22} /> : <ShieldCheck size={22} />}
                <span className="absolute -top-1 -right-1">
                  <AIDot size={8} tone="deep" pulse />
                </span>
              </span>
              <span className="text-[11px] text-surface-deep font-medium max-w-[92px] text-center leading-tight">
                {receiverLabel}
              </span>
            </div>
          </div>
          <div className="text-[12.5px] text-ink text-center">
            Output handed off · <span className="font-bold">{receiverName}</span> is taking over
          </div>
        </div>
      </SpringIn>
    </div>,
    document.body,
  );
}
