/**
 * A task a HiTL lane decision created for a named persona. The only way past
 * it is one of its own decisions — there is no generic "approve anyway".
 */

import { UserRound, Clock, Check, ChevronRight } from "lucide-react";
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
  const waiting = !chosen && active;

  return (
    <section
      className={cn(
        "aap-fade-up relative flex flex-col gap-4 border bg-white px-5 pb-5 pt-6 transition-colors duration-150",
        chosen ? "border-divider" : waiting ? "border-mark-amber/50" : "border-divider opacity-60",
      )}
      style={{ animationDelay: "120ms" }}
      aria-label={`${task.persona} · ${task.task}`}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-[3px] origin-left",
          chosen ? "bg-ink" : waiting ? "aap-rule bg-mark-amber" : "bg-divider",
        )}
      />

      {waiting && (
        <p className="aap-eyebrow -mt-1 flex items-center gap-2 text-[10.5px] text-mark-amber">
          <span className="h-1.5 w-1.5 rounded-full bg-mark-amber ai-pulse" aria-hidden />
          {c.status.waiting}
        </p>
      )}

      <header className="flex items-start gap-4">
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center border",
            chosen ? "border-ink bg-ink text-ink-inverse" : "border-mark-amber/60 bg-surface-amber text-mark-amber",
          )}
        >
          {chosen ? <Check size={17} aria-hidden /> : <UserRound size={17} aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[15px] leading-[20px] text-ink">{task.persona}</p>
            <span
              className={cn(
                "aap-eyebrow px-2 py-0.5 text-[10px]",
                task.org === "Client" ? "border border-divider text-surface-navy" : "bg-sand text-ink",
              )}
            >
              {task.org}
            </span>
            {task.slaHours && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-mute">
                <Clock size={13} aria-hidden /> {c.sla(task.slaHours)}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-pretty text-[14px] leading-[21px] text-ink">{task.task}</p>
        </div>
      </header>

      {(task.prefilled || task.escalateIf || task.then) && (
        <ul className="flex flex-col gap-1.5 pl-14 text-[12.5px] leading-[18px] text-mute">
          {task.prefilled && (
            <li className="flex items-start gap-2">
              <ChevronRight size={13} aria-hidden className="mt-[3px] shrink-0 text-steel" />
              {c.prefilled}
            </li>
          )}
          {task.escalateIf && (
            <li className="flex items-start gap-2">
              <ChevronRight size={13} aria-hidden className="mt-[3px] shrink-0 text-steel" />
              <span>
                {c.escalateIf}: {task.escalateIf}
              </span>
            </li>
          )}
          {task.then && (
            <li className="flex items-start gap-2">
              <ChevronRight size={13} aria-hidden className="mt-[3px] shrink-0 text-steel" />
              <span>
                {c.then}: {task.then}
              </span>
            </li>
          )}
        </ul>
      )}

      {chosen ? (
        <div className="aap-fade-up ml-14 flex flex-col gap-1 border-l-2 border-ink bg-surface-fog px-4 py-3">
          <p className="text-[13px] leading-[19px] text-ink">
            {c.decidedBy(task.persona)} · <span className="font-medium">{chosen.label[lang]}</span>
          </p>
          {task.recorded && decided !== "redirect" && (
            <p className="text-pretty text-[12.5px] leading-[18px] text-mute">
              {c.recordedReason}: {task.recorded.reason}
            </p>
          )}
        </div>
      ) : active && !mayDecide ? (
        <div className="ml-14 flex flex-col items-start gap-3">
          <p className="text-[12.5px] leading-[18px] text-mute">{c.reviewAsHint(role(session.reviewAs), role(needed))}</p>
          <button
            type="button"
            onClick={() => setSession({ reviewAs: needed })}
            className="ui-pill aap-cta inline-flex items-center gap-3 whitespace-nowrap border border-ink bg-white px-5 py-2.5 text-[12px] text-ink"
          >
            {c.switchTo(role(needed))}
            <ChevronRight size={15} aria-hidden />
          </button>
        </div>
      ) : (
        <div className="ml-14 flex flex-wrap gap-2">
          {task.options.map((o) => (
            <button
              key={o.id}
              type="button"
              disabled={!active}
              onClick={() => onDecide(o.id)}
              className={cn(
                "ui-pill inline-flex items-center gap-3 whitespace-nowrap px-5 py-2.5 text-[13px] disabled:cursor-not-allowed",
                o.primary ? "aap-cta bg-ink text-[12px] text-ink-inverse" : "border border-ink/30 bg-white text-ink",
              )}
            >
              {o.label[lang]}
              {o.primary && <ChevronRight size={15} aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
