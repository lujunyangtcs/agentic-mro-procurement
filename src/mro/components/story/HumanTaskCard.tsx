/**
 * A task a HiTL lane decision created for a named persona. The only way past
 * it is one of its own decisions — there is no generic "approve anyway".
 */

import { UserRound, Clock, Check } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import type { HumanTask } from "@/mro/data/stories/runModel";
import { useStoryCopy } from "@/mro/components/story/copy";
import { useDeskCopy } from "@/mro/components/desk/copy";
import { personaRole } from "@/mro/components/desk/personas";
import { useProcurement } from "@/mro/data/store";

export function HumanTaskCard({
  task,
  decided,
  active,
  onDecide,
}: {
  task: HumanTask;
  /** Id of the option chosen, once decided. */
  decided?: string;
  /** Earlier tasks in the same lane must be decided first. */
  active: boolean;
  onDecide: (optionId: string) => void;
}) {
  const { c, lang } = useStoryCopy();
  const { role } = useDeskCopy();
  const { session, setSession } = useProcurement();
  const needed = personaRole(task.persona);
  const mayDecide = session.reviewAs === needed;
  const chosen = task.options.find((o) => o.id === decided);

  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-md border p-4 transition-colors",
        chosen
          ? "border-divider bg-white"
          : active
            ? "border-[color-mix(in_srgb,var(--mark-amber)_40%,white)] bg-white shadow-[0_0_0_3px_color-mix(in_srgb,var(--mark-amber)_12%,transparent)]"
            : "border-divider bg-white opacity-60",
      )}
      aria-label={`${task.persona} · ${task.task}`}
    >
      <header className="flex items-start gap-3">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full",
            chosen ? "bg-surface-deep text-ink-inverse" : "bg-surface-amber text-mark-amber",
          )}
        >
          {chosen ? <Check size={17} strokeWidth={2.25} /> : <UserRound size={17} strokeWidth={1.75} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[14px] font-bold leading-[19px] text-ink">{task.persona}</p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.05em]",
                task.org === "Client" ? "bg-surface-fog text-surface-navy" : "bg-surface-mint text-surface-deep",
              )}
            >
              {task.org}
            </span>
            {task.slaHours && (
              <span className="inline-flex items-center gap-1 text-[12px] text-mute">
                <Clock size={12} aria-hidden /> {c.sla(task.slaHours)}
              </span>
            )}
          </div>
          <p className="mt-1 text-[13.5px] leading-[19px] text-ink text-pretty">{task.task}</p>
        </div>
      </header>

      {(task.prefilled || task.escalateIf || task.then) && (
        <ul className="flex flex-col gap-1 pl-12 text-[12.5px] leading-[18px] text-mute">
          {task.prefilled && <li>{c.prefilled}</li>}
          {task.escalateIf && (
            <li>
              {c.escalateIf}: {task.escalateIf}
            </li>
          )}
          {task.then && (
            <li>
              {c.then}: {task.then}
            </li>
          )}
        </ul>
      )}

      {chosen ? (
        <div className="ml-12 flex flex-col gap-1 rounded-md bg-surface-mint/50 px-3 py-2">
          <p className="text-[13px] font-medium leading-[18px] text-surface-deep">
            {c.decidedBy(task.persona)} · {chosen.label[lang]}
          </p>
          {task.recorded && decided !== "redirect" && (
            <p className="text-[12.5px] leading-[18px] text-ink text-pretty">
              {c.recordedReason}: {task.recorded.reason}
            </p>
          )}
        </div>
      ) : active && !mayDecide ? (
        <div className="ml-12 flex flex-col items-start gap-2">
          <p className="text-[12.5px] leading-[18px] text-mute">{c.reviewAsHint(role(session.reviewAs), role(needed))}</p>
          <button
            type="button"
            onClick={() => setSession({ reviewAs: needed })}
            className="ui-pill inline-flex items-center whitespace-nowrap rounded-md border border-divider bg-white px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-fog"
          >
            {c.switchTo(role(needed))}
          </button>
        </div>
      ) : (
        <div className="ml-12 flex flex-wrap gap-2">
          {task.options.map((o) => (
            <button
              key={o.id}
              type="button"
              disabled={!active}
              onClick={() => onDecide(o.id)}
              className={cn(
                "ui-pill inline-flex items-center whitespace-nowrap rounded-md px-3.5 py-2 text-[13px] font-medium transition-[filter,background-color] disabled:cursor-not-allowed active:translate-y-px",
                o.primary
                  ? "bg-surface-deep text-ink-inverse hover:brightness-110"
                  : "border border-divider bg-white text-ink hover:bg-surface-fog",
              )}
            >
              {o.label[lang]}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
