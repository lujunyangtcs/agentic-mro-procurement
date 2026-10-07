import { CircleCheck, CircleAlert } from "lucide-react";
import type { StoryRun } from "@/mro/data/stories/runModel";
import { IoBody } from "@/mro/components/story/IoBody";
import { useStoryCopy } from "@/mro/components/story/copy";

/** What the case closed with — the manifest outcome, or the decision that ended it. */
export function OutcomeCard({
  run,
  endedBy,
  humanDecisions,
}: {
  run: StoryRun;
  endedBy?: { en: string; de: string };
  humanDecisions: number;
}) {
  const { c, lang } = useStoryCopy();
  const valueRecord = endedBy
    ? undefined
    : [...run.steps].reverse().map((s) => s.output.value_record).find(Boolean) as Record<string, unknown> | undefined;
  const touchless = humanDecisions === 0;

  return (
    <section className="flex flex-col gap-4 rounded-md border border-surface-deep bg-white p-5" aria-label={c.outcome}>
      <header className="flex items-start gap-3">
        <span className={touchless ? "text-surface-deep" : "text-mark-amber"}>
          {touchless ? <CircleCheck size={22} aria-hidden /> : <CircleAlert size={22} aria-hidden />}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-mute">
            {touchless ? c.outcomeTouchless : c.outcomeHuman(humanDecisions)}
          </p>
          <p className="mt-1 text-[17px] font-bold leading-[24px] text-ink text-pretty">{endedBy ? endedBy[lang] : run.manifest.outcome}</p>
        </div>
      </header>

      {valueRecord && (
        <div className="flex flex-col gap-2 rounded-md bg-surface-mint/40 p-3">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.05em] text-surface-deep">{c.valueRecord}</h3>
          <IoBody body={valueRecord} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.05em] text-mute">{c.stillOpen}</h3>
          <ul className="flex flex-col gap-1">
            {run.manifest.human_touchpoints.map((h) => (
              <li key={h} className="text-[13px] leading-[19px] text-ink">
                {h}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.05em] text-mute">{c.interventions}</h3>
          <p className="flex flex-wrap gap-1.5">
            {run.manifest.tail_spend_interventions.map((t) => (
              <span key={t} className="rounded-md bg-surface-fog px-2 py-0.5 text-[12.5px] font-bold text-ink">
                {t}
              </span>
            ))}
          </p>
          <p className="text-[12.5px] leading-[18px] text-mute">
            {c.flowPath}: {run.manifest.flow_path}
          </p>
        </div>
      </div>
    </section>
  );
}
