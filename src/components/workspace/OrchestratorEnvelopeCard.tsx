import { AIDot } from "@/components/ai/AIDot";
import { SpringIn } from "@/components/ai/SpringIn";
import { cn } from "@/lib/utils";

type Gate = {
  name: string;
  result: string;
  /** "clear" = green check · "routed" = intentionally sent to a human. */
  state: "clear" | "routed";
};

const gates: Gate[] = [
  { name: "Policy", result: "Within maintenance spot-buy policy · production-critical exemption applies", state: "clear" },
  { name: "Contract", result: "On-contract supplier · framework price honored", state: "clear" },
  { name: "Budget", result: "Maintenance budget has $214K open · this draws $48.2K", state: "clear" },
  { name: "Duplicate supplier", result: "Supplier verified in vendor master · not a duplicate", state: "clear" },
  { name: "Approval limit", result: "Above the touchless limit → routed to you, never auto-issued", state: "routed" },
];

export function OrchestratorEnvelopeCard() {
  return (
    <SpringIn>
      <article className="bg-white border border-divider rounded-md p-6 space-y-4">
        <header className="flex items-center gap-2">
          <AIDot size={6} tone="deep" pulse />
          <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Do-not-execute envelope · nothing executes until all clear
          </span>
        </header>

        <div className="space-y-2.5">
          {gates.map((g) => (
            <div key={g.name} className="flex items-start gap-3">
              <span
                className={cn(
                  "w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5",
                  g.state === "clear"
                    ? "bg-surface-deep text-ink-inverse"
                    : "bg-surface-mint text-surface-deep border border-surface-deep",
                )}
              >
                {g.state === "clear" ? "✓" : "→"}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-ink">{g.name}</span>
                  <span
                    className={cn(
                      "text-[10px] tracking-[0.06em] uppercase font-medium px-1.5 py-0.5 rounded",
                      g.state === "clear"
                        ? "bg-surface-mint text-surface-deep"
                        : "bg-surface-fog text-surface-deep",
                    )}
                  >
                    {g.state === "clear" ? "Clear" : "Routed to you"}
                  </span>
                </div>
                <div className="text-[12px] text-mute leading-snug mt-0.5">{g.result}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-md bg-surface-fog px-3 py-2.5 text-[12px] text-ink">
          The orchestrator's do-not-execute envelope lets the agents draft and check everything, but
          they never issue an order on their own. It only executes once the checks are clear and you
          approve.
        </div>
      </article>
    </SpringIn>
  );
}
