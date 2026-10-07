/**
 * New tickets: the five client use cases as rows on the dashboard. Each row
 * shows where its case stands in the shared ledger, so a story run elsewhere
 * reads the same here. Stories with a guided playback are marked.
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
    title: "New tickets",
    right: (n: number, done: number) => `${done} of ${n} closed`,
    guided: "Guided",
    cols: { ticket: "Ticket", request: "Request", status: "Status" },
    status: { new: "Not started", running: "Agent running", waiting: "Waiting on a person", ready: "Ready to hand off", done: "Closed", ended: "Ended by decision" } as Record<StoryStatus, string>,
    open: (uc: string) => `Open ${uc}`,
  },
  de: {
    title: "Neue Tickets",
    right: (n: number, done: number) => `${done} von ${n} abgeschlossen`,
    guided: "Geführt",
    cols: { ticket: "Ticket", request: "Anfrage", status: "Status" },
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
      <div
        aria-hidden
        className="flex items-center gap-3 border-b border-divider px-4 pb-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-mute"
      >
        <span className="w-[92px] shrink-0">{t.cols.ticket}</span>
        <span className="min-w-0 flex-1">{t.cols.request}</span>
        <span className="w-[132px] shrink-0">{t.cols.status}</span>
        <span className="w-[15px] shrink-0" />
      </div>
      <ul className="divide-y divide-divider">
        {rows.map(({ run, status, guided }) => (
          <li key={run.story.id}>
            <button
              type="button"
              onClick={() => go({ kind: "story", storyId: run.story.id })}
              aria-label={`${t.open(run.story.ucLabel)} · ${run.story.title[lang]} · ${t.status[status]}`}
              className="ui-pill group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-fog"
            >
              <span className="flex w-[92px] shrink-0 flex-col">
                <span className="whitespace-nowrap text-[13px] font-bold leading-[17px] text-ink">{run.story.ucLabel}</span>
                <span className="whitespace-nowrap text-[11.5px] leading-4 text-mute tabular-nums">{run.story.caseId}</span>
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="min-w-0 truncate text-[13px] text-ink" title={run.story.title[lang]}>
                  {run.story.title[lang]}
                </span>
                {guided && (
                  <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-sm border border-divider px-1.5 py-px text-[11px] font-medium text-surface-deep">
                    <PlayCircle size={11} aria-hidden /> {t.guided}
                  </span>
                )}
              </span>
              <span className="w-[132px] shrink-0">
                <span className={cn("inline-block max-w-full truncate whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[11.5px] font-medium", tone[status])}>
                  {t.status[status]}
                </span>
              </span>
              <ChevronRight size={15} aria-hidden className="shrink-0 text-ink transition-transform group-hover:translate-x-0.5" />
            </button>
          </li>
        ))}
      </ul>
    </DashCard>
  );
}
