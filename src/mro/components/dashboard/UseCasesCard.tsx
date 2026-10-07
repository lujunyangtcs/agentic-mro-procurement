/**
 * The client use cases, opened from the dashboard. Each tile shows where its
 * case stands in the shared ledger, so a story run elsewhere reads the same
 * here. Stories with a guided playback are marked.
 */

import { ChevronRight, Layers, PlayCircle } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { useApp } from "@/mro/state";
import { useProcurement } from "@/mro/data/store";
import { STORY_RUNS } from "@/mro/data/stories/runModel";
import { useLedger } from "@/mro/services/demoLedger";
import { storyStatus, type StoryStatus } from "@/mro/components/story/useStoryRun";
import { THEATRE } from "@/mro/components/story/theatre/script";
import { DashCard } from "@/mro/components/dashboard/cards";

const COPY = {
  en: {
    title: "Client use cases",
    right: (n: number, done: number) => `${done} of ${n} closed`,
    guided: "Guided",
    status: { new: "Not started", running: "Agent running", waiting: "Waiting on a person", ready: "Ready to hand off", done: "Closed", ended: "Ended by decision" } as Record<StoryStatus, string>,
    open: (uc: string) => `Open ${uc}`,
  },
  de: {
    title: "Kunden-Use-Cases",
    right: (n: number, done: number) => `${done} von ${n} abgeschlossen`,
    guided: "Geführt",
    status: { new: "Nicht gestartet", running: "Agent läuft", waiting: "Wartet auf Person", ready: "Bereit zur Übergabe", done: "Abgeschlossen", ended: "Durch Entscheidung beendet" } as Record<StoryStatus, string>,
    open: (uc: string) => `${uc} öffnen`,
  },
};

const tone: Record<StoryStatus, string> = {
  new: "bg-surface-fog text-mute",
  running: "bg-surface-mint text-surface-deep",
  ready: "bg-surface-mint text-surface-deep",
  waiting: "bg-surface-amber text-mark-amber",
  done: "bg-surface-deep text-ink-inverse",
  ended: "bg-surface-amber text-mark-amber",
};

export function UseCasesCard() {
  const { go } = useApp();
  const { lang } = useProcurement();
  const ledger = useLedger();
  const t = lang === "de" ? COPY.de : COPY.en;
  const rows = STORY_RUNS.map((run) => ({ run, status: storyStatus(run, ledger.runs[run.story.id]).status, guided: !!THEATRE[run.story.uc] }));
  const closed = rows.filter((r) => r.status === "done" || r.status === "ended").length;

  return (
    <DashCard icon={<Layers size={18} strokeWidth={1.75} />} title={t.title} right={t.right(rows.length, closed)}>
      <ul className="grid grid-cols-1 gap-px bg-divider sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {rows.map(({ run, status, guided }) => (
          <li key={run.story.id} className="bg-white">
            <button
              type="button"
              onClick={() => go({ kind: "story", storyId: run.story.id })}
              aria-label={`${t.open(run.story.ucLabel)} · ${run.story.title[lang]}`}
              className="ui-pill group flex h-full w-full flex-col text-left transition-colors hover:bg-surface-fog"
            >
              <span className="relative block h-[92px] w-full overflow-hidden bg-accent-navy">
                <img
                  src={`/media/story-${run.story.id.toLowerCase()}.png`}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />
                {guided && (
                  <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 whitespace-nowrap rounded-sm bg-ink/80 px-1.5 py-0.5 text-[11px] font-medium text-ink-inverse">
                    <PlayCircle size={12} aria-hidden /> {t.guided}
                  </span>
                )}
              </span>
              <span className="flex flex-1 flex-col gap-1.5 px-3.5 pb-3 pt-2.5">
                <span className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.08em] text-steel">
                  {run.story.ucLabel}
                  <span className="font-normal normal-case tracking-normal text-mute">{run.story.caseId}</span>
                </span>
                <span className="line-clamp-2 min-h-10 text-pretty text-[14px] font-medium leading-5 text-ink">{run.story.title[lang]}</span>
                <span className="mt-auto flex items-center gap-2 pt-1">
                  <span className={cn("truncate whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[11.5px] font-medium", tone[status])}>{t.status[status]}</span>
                  <ChevronRight size={15} aria-hidden className="ml-auto shrink-0 text-ink transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </DashCard>
  );
}
