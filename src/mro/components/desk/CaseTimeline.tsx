import type { Actor, AuditEvent } from "@/mro/domain/types";
import { londonDateTime } from "@/mro/domain/clock";
import { useProcurement } from "@/mro/data/store";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { Card } from "@/mro/components/desk/ui";
import { cn } from "@/mro/lib/utils";

function actorLabel(a: Actor, t: (k: string, v?: Record<string, string | number>) => string, role: (r: string) => string) {
  if (a.kind === "policy") return t("actor.policy", { version: a.policyVersion });
  if (a.kind === "agent") return t("actor.agent", { id: a.agentId });
  return `${a.name} · ${role(a.role)}`;
}

export function CaseTimeline({ events }: { events: AuditEvent[] }) {
  const { lang } = useProcurement();
  const { d, t, role } = useDeskCopy();
  return (
    <Card title={d.timeline}>
      <ol className="flex flex-col px-4 pb-4">
        {[...events].reverse().map((e, i) => (
          <li key={e.id} className="relative flex gap-3 pb-3 last:pb-0">
            <span className="flex flex-col items-center" aria-hidden>
              <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", e.substantive ? "bg-mark-amber" : e.actor.kind === "human" ? "bg-surface-navy" : "bg-surface-deep")} />
              {i < events.length - 1 && <span className="mt-1 w-px flex-1 bg-divider" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold leading-[18px] text-ink">{t(`event.${e.type}`)}</p>
              <p className="text-[12.5px] leading-[17px] text-ink text-pretty">{e.summary}</p>
              <p className="truncate text-[12px] leading-[16px] text-mute">
                {londonDateTime(e.at, lang)} · {actorLabel(e.actor, t, role)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
