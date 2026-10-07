import { CircleCheck, CircleAlert, ChevronRight } from "lucide-react";
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
    : ([...run.steps].reverse().map((s) => s.output.value_record).find(Boolean) as Record<string, unknown> | undefined);
  const touchless = humanDecisions === 0;

  return (
    <section className="aap-fade-up flex flex-col border border-ink bg-white" aria-label={c.outcome}>
      <header className="relative overflow-hidden bg-accent-navy px-6 py-6 text-ink-inverse">
        <img
          src={`/media/story-${run.story.id.toLowerCase()}.png`}
          alt=""
          className="aap-settle absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-40 [mask-image:linear-gradient(90deg,transparent,black_70%)]"
        />
        <span aria-hidden className="aap-rule absolute inset-x-0 bottom-0 block h-[2px] bg-sand" style={{ animationDelay: "200ms" }} />
        <div className="relative flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center border border-sand/60 text-sand">
            {touchless ? <CircleCheck size={22} aria-hidden /> : <CircleAlert size={22} aria-hidden />}
          </span>
          <div className="min-w-0 max-w-[640px]">
            <p className="aap-eyebrow text-[11px] text-sand">
              {touchless ? c.outcomeTouchless : c.outcomeHuman(humanDecisions)}
            </p>
            <p className="mt-2 text-pretty text-[19px] font-light leading-[28px] text-ink-inverse">
              <span className="aap-line">
                <span style={{ animationDelay: "160ms" }}>{endedBy ? endedBy[lang] : run.manifest.outcome}</span>
              </span>
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-5 p-6">
        {valueRecord && (
          <div className="flex flex-col gap-3 bg-sand/60 p-4">
            <h3 className="aap-title text-[12px] leading-[16px] text-ink">{c.valueRecord}</h3>
            <IoBody body={valueRecord} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2.5">
            <h3 className="aap-eyebrow text-[11px] text-steel">{c.stillOpen}</h3>
            <ul className="flex flex-col gap-1.5">
              {run.manifest.human_touchpoints.map((h) => (
                <li key={h} className="flex items-start gap-2 text-[13px] leading-[19px] text-ink">
                  <ChevronRight size={13} aria-hidden className="mt-[3px] shrink-0 text-steel" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2.5">
            <h3 className="aap-eyebrow text-[11px] text-steel">{c.interventions}</h3>
            <p className="flex flex-wrap gap-1.5">
              {run.manifest.tail_spend_interventions.map((t) => (
                <span key={t} className="border border-ink/25 px-2.5 py-1 text-[12.5px] text-ink">
                  {t}
                </span>
              ))}
            </p>
            <p className="text-[12.5px] leading-[18px] text-mute">
              {c.flowPath}: {run.manifest.flow_path}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
