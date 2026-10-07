/**
 * The common I/O envelope every agent returns: confidence with its weighted
 * signals, guardrail checks, and the lane decision. The 0.70 / 0.90 bands on
 * the scale are the confidence policy from the I/O (CONF-v1.0).
 */

import { ShieldCheck, ShieldAlert, Route, Gauge } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import type { AgentRun } from "@/mro/data/stories/io";
import { ToneChip } from "@/mro/components/story/IoBody";
import { humanKey, formatValue } from "@/mro/components/story/format";
import { useStoryCopy } from "@/mro/components/story/copy";

function Card({ icon: Icon, title, aside, children }: { icon: typeof Gauge; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-md border border-divider bg-white p-4">
      <header className="flex items-center gap-2">
        <Icon size={16} strokeWidth={1.75} className="text-surface-deep" aria-hidden />
        <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink">{title}</h3>
        {aside && <span className="ml-auto">{aside}</span>}
      </header>
      {children}
    </section>
  );
}

const bandTone = (score: number) => (score >= 0.9 ? "ok" : score >= 0.7 ? "warn" : "bad");

export function ConfidenceCard({ confidence, animate }: { confidence: NonNullable<AgentRun["confidence"]>; animate?: boolean }) {
  const { c } = useStoryCopy();
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const tone = bandTone(confidence.score);
  return (
    <Card icon={Gauge} title={c.confidence} aside={<ToneChip value={confidence.score.toFixed(2)} tone={tone} />}>
      {/* The policy scale: below 0.70 the client decides, 0.70–0.89 TCS reviews, 0.90+ touchless. */}
      <div className="flex flex-col gap-1.5">
        <div className="relative h-2.5 overflow-hidden rounded-full bg-surface-fog">
          <div className="absolute inset-y-0 left-[70%] w-[20%] bg-surface-amber" />
          <div className="absolute inset-y-0 left-[90%] right-0 bg-surface-mint" />
          <div
            className={cn(
              "absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full",
              tone === "ok" ? "bg-surface-deep" : tone === "warn" ? "bg-mark-amber" : "bg-mark-red",
              animate && "theatre-slide",
            )}
            style={{ left: `calc(${pct(confidence.score)} - 2px)` }}
            aria-hidden
          />
        </div>
        <div className="relative h-4 text-[11px] leading-4 text-mute">
          <span className="absolute left-0">0</span>
          <span className="absolute left-[70%] -translate-x-1/2">0.70</span>
          <span className="absolute left-[90%] -translate-x-1/2">0.90</span>
        </div>
      </div>
      <ul className="flex flex-col divide-y divide-divider">
        {confidence.signals.map((s) => (
          <li key={s.key} className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{humanKey(s.key)}</span>
              <span className="shrink-0 text-[12px] text-mute">
                {c.weight} {pct(s.weight)}
              </span>
              <span className="w-24 shrink-0">
                <span className="block h-1.5 overflow-hidden rounded-full bg-surface-fog">
                  <span
                    className={cn("block h-full rounded-full", (s.score ?? 0) >= 0.9 ? "bg-surface-deep" : "bg-mark-amber", animate && "theatre-grow")}
                    style={{ width: pct(s.score ?? 0), animationDelay: animate ? `${confidence.signals.indexOf(s) * 120}ms` : undefined }}
                  />
                </span>
              </span>
              <span className="w-9 shrink-0 text-right text-[13px] font-bold tabular-nums text-ink">
                {s.score === null ? "—" : s.score.toFixed(2)}
              </span>
            </div>
            <p className="text-[12.5px] leading-[18px] text-mute text-pretty">{s.evidence}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function GuardrailCard({ guardrails }: { guardrails: AgentRun["guardrails"] }) {
  const { c } = useStoryCopy();
  const tripped = guardrails.some((g) => g.status === "TRIPPED");
  return (
    <Card icon={tripped ? ShieldAlert : ShieldCheck} title={c.guardrails}>
      <ul className="flex flex-col divide-y divide-divider">
        {guardrails.map((g) => (
          <li key={g.rule} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
            <ToneChip value={g.status} className="mt-0.5 w-[76px] justify-center" />
            <div className="min-w-0">
              <p className="text-[13px] font-medium leading-[18px] text-ink">{g.rule}</p>
              <p className="text-[12.5px] leading-[18px] text-mute text-pretty">{g.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function LaneCard({ lane }: { lane: NonNullable<AgentRun["lane"]> }) {
  const { c } = useStoryCopy();
  const human = lane.lane === "HiTL";
  /* For HiTL lanes the task cards below carry the routing, so it is not repeated here. */
  const route = human ? [] : Object.entries(lane.routeTo).filter(([k]) => k !== "steps");
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-md border p-4",
        human ? "border-[color-mix(in_srgb,var(--mark-amber)_30%,white)] bg-surface-amber/60" : "border-divider bg-surface-mint/40",
      )}
    >
      <header className="flex flex-wrap items-center gap-2">
        <Route size={16} strokeWidth={1.75} className={human ? "text-mark-amber" : "text-surface-deep"} aria-hidden />
        <h3 className="text-[13px] font-bold uppercase tracking-[0.06em] text-ink">{c.lane}</h3>
        <span className="ml-auto flex items-center gap-1.5">
          <ToneChip value={lane.lane} />
          <ToneChip value={lane.band.replace(/_/g, " ")} tone={lane.band === "HARD_CONSTRAINT" ? "bad" : human ? "warn" : "ok"} />
        </span>
      </header>
      <p className="text-[14px] font-medium leading-[20px] text-ink text-pretty">{lane.reason}</p>
      {route.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {route.map(([k, v]) => (
            <div key={k} className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-[12px] leading-[16px] text-mute">{humanKey(k)}</dt>
              <dd className="text-[13px] leading-[19px] text-ink">{formatValue(k, v)}</dd>
            </div>
          ))}
        </dl>
      )}
      {lane.postAudit && (
        <p className="text-[12.5px] leading-[18px] text-mute">
          {c.postAudit}: {lane.postAudit}
        </p>
      )}
    </section>
  );
}
