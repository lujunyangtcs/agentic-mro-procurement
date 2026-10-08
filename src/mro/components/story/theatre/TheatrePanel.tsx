/**
 * The agent panel during guided playback. An agent first fetches its
 * sources line by line. Its work then plays as beats on a stage: the
 * presenter asks for each piece, a popup shows the agent reasoning, and one
 * card lands in place of the last. Confidence and guardrails run as the last
 * AI check and land as a pair, the lane follows, a person decides in a popup
 * where the lane needs one, then the baton can pass.
 */

import * as React from "react";
import { ArrowRight, Bot, Check, ChevronDown, Inbox, Sparkles } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import type { RunStep } from "@/mro/data/stories/runModel";
import type { UseCaseKey } from "@/mro/data/stories/io";
import { IoBody } from "@/mro/components/story/IoBody";
import { ConfidenceCard, GuardrailCard, LaneCard } from "@/mro/components/story/Envelope";
import { HumanTaskCard } from "@/mro/components/story/HumanTaskCard";
import { useStoryCopy } from "@/mro/components/story/copy";
import { StoryEvidence, hasEvidence } from "@/mro/components/story/StoryEvidence";
import { humanKey } from "@/mro/components/story/format";
import { Spinner } from "@/mro/components/ai/Spinner";
import { useTheatreCopy } from "@/mro/components/story/theatre/copy";
import { AiAnalysisModal, type AnalysisItem } from "@/mro/components/story/theatre/overlays";
import { FETCH_LINE_MS, type TheatreStep } from "@/mro/components/story/theatre/script";
import { DocChip, DocIcon, type SourceDoc } from "@/mro/components/story/theatre/pdf";
import { TaskModal } from "@/mro/components/story/theatre/hitl";
import { taskNote } from "@/mro/components/story/theatre/hitlNote";
import type { TaskInput } from "@/mro/services/demoLedger";

type CheckStage = "confidence" | "guardrails";
type Stage = CheckStage | "lane" | `beat:${number}`;

function stagesOf(step: RunStep, script?: TheatreStep): Stage[] {
  const r = step.run;
  return [
    ...(script?.beats ?? []).map((_, i) => `beat:${i}` as const),
    ...(r.confidence ? (["confidence"] as const) : []),
    ...(r.guardrails.length ? (["guardrails"] as const) : []),
    ...(r.lane ? (["lane"] as const) : []),
  ];
}

/** Brings the next thing to press into view once the card above it has landed. */
function useBringIntoView<T extends HTMLElement>(enabled = true) {
  const ref = React.useRef<T>(null);
  React.useEffect(() => {
    if (!enabled) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const tm = window.setTimeout(() => ref.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" }), 120);
    return () => window.clearTimeout(tm);
  }, [enabled]);
  return ref;
}

/** A beat's short CTA without its "AI ·" prefix, used as its name on the stage rail. */
const stageName = (short: string) => short.replace(/^(AI|KI)\s·\s/, "");

/**
 * Where the agent is in its own work, so a card can leave the page once the
 * next one lands. Finished agents can be stepped back through from here.
 */
function StageRail({
  stages,
  reached,
  view,
  live,
  onPick,
  railRef,
}: {
  stages: { key: string; label: string }[];
  reached: number;
  view: number;
  live: boolean;
  onPick: (i: number) => void;
  railRef: React.Ref<HTMLElement>;
}) {
  const { t } = useTheatreCopy();
  return (
    <nav ref={railRef} aria-label={t.stagesLabel} className="aap-fade-up scroll-mt-20 border border-divider bg-white px-5 pb-2.5 pt-3">
      <ol className="flex gap-1.5">
        {stages.map((s, i) => {
          const current = i === view;
          const done = i < reached || (!live && i <= reached);
          const body = (
            <>
              <span aria-hidden className={cn("block h-[3px] w-full transition-colors", current ? "bg-ink" : done ? "bg-surface-deep" : "bg-surface-fog")} />
              <span
                className={cn(
                  "mt-1.5 truncate text-[11.5px] leading-[16px]",
                  current ? "block font-bold text-ink" : done ? "hidden text-surface-deep @lg/agent:block" : "hidden text-mute @lg/agent:block",
                )}
              >
                {s.label}
                {done && !current && <span className="sr-only">{` · ${t.done}`}</span>}
              </span>
            </>
          );
          return (
            <li key={s.key} className="min-w-0 flex-1">
              {!live && i <= reached ? (
                <button type="button" onClick={() => onPick(i)} aria-current={current ? "step" : undefined} className="block w-full text-left hover:opacity-80">
                  {body}
                </button>
              ) : (
                <div aria-current={current ? "step" : undefined}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ── Fetching ───────────────────────────────────────────────────────────── */

function Fetching({ script, docs, onOpen }: { script: TheatreStep; docs: Record<string, SourceDoc>; onOpen: (d: SourceDoc) => void }) {
  const { t, lang } = useTheatreCopy();
  const [shown, setShown] = React.useState(0);
  React.useEffect(() => {
    const iv = window.setInterval(() => setShown((n) => Math.min(script.fetch.length, n + 1)), FETCH_LINE_MS);
    return () => window.clearInterval(iv);
  }, [script.fetch.length]);

  return (
    <section className="aap-scan flex flex-col gap-1 border border-divider bg-white px-5 py-4" role="status" aria-live="polite">
      <p className="aap-eyebrow mb-2 flex items-center gap-2 text-[10.5px] text-steel">
        <Sparkles size={13} aria-hidden className="text-surface-deep" /> {t.fetching}
      </p>
      <ul className="flex flex-col">
        {script.fetch.map((f, i) => {
          const done = i < shown;
          const active = i === shown;
          if (i > shown) return null;
          const doc = f.doc ? docs[f.doc] : undefined;
          return (
            <li key={f.label.en} className="ai-stream flex min-h-10 items-center gap-3 border-b border-divider py-2 last:border-b-0">
              <span className="grid h-4 w-4 shrink-0 place-items-center">
                {done ? <Check size={15} strokeWidth={2.6} className="text-surface-deep" aria-hidden /> : <Spinner size={13} />}
              </span>
              <span className={cn("min-w-0 flex-1 truncate text-[13.5px]", active ? "text-ink" : "text-mute")}>
                {f.label[lang]}
                {active && "…"}
              </span>
              {done && doc && <DocChip doc={doc} onOpen={onOpen} className="ai-stream" />}
            </li>
          );
        })}
        {shown >= script.fetch.length && (
          <li className="ai-stream flex min-h-10 items-center gap-3 py-2">
            <Spinner size={13} />
            <span className="text-[13.5px] text-ink">{t.working}…</span>
          </li>
        )}
      </ul>
    </section>
  );
}

/* ── The next AI action, offered as a button ────────────────────────────── */

function AiAction({
  label,
  short,
  note,
  counter,
  scroll = true,
  onClick,
}: {
  label: string;
  short: string;
  note: string;
  counter?: string;
  scroll?: boolean;
  onClick: () => void;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const box = useBringIntoView<HTMLDivElement>(scroll);
  React.useEffect(() => ref.current?.focus({ preventScroll: true }), []);
  return (
    <div ref={box} className="aap-fade-up flex scroll-mb-6 items-center gap-3 border border-dashed border-ink/30 bg-white px-5 py-3.5">
      <span className="h-2 w-2 shrink-0 rounded-full bg-surface-deep ai-pulse" aria-hidden />
      {counter && <span className="shrink-0 whitespace-nowrap text-[12px] tabular-nums text-steel">{counter}</span>}
      <span className="hidden min-w-0 flex-1 truncate text-[13px] text-mute @md/agent:block">{note}</span>
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={label}
        className="ui-pill aap-cta group ml-auto inline-flex shrink-0 items-center gap-2 whitespace-nowrap bg-ink px-5 py-2.5 text-[12.5px] text-ink-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <Sparkles size={15} aria-hidden /> <Fit full={label} short={short} />
        <ArrowRight size={15} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

/** A button label that drops to its short form when the agent panel is narrow. */
function Fit({ full, short }: { full: string; short: string }) {
  return (
    <>
      <span className="hidden @xl/agent:inline">{full}</span>
      <span className="@xl/agent:hidden">{short}</span>
    </>
  );
}

/* ── Panel ──────────────────────────────────────────────────────────────── */

export function TheatrePanel({
  uc,
  step,
  script,
  docs,
  held,
  paused,
  running,
  isFrontier,
  finished,
  beat,
  decisions,
  inputs,
  pendingCount,
  nextAgent,
  onStart,
  onBeat,
  onOpenDoc,
  onDecide,
  onHandOff,
}: {
  uc: UseCaseKey;
  step: RunStep;
  script: TheatreStep;
  docs: Record<string, SourceDoc>;
  held: boolean;
  paused?: boolean;
  running: boolean;
  isFrontier: boolean;
  finished: boolean;
  beat: number;
  decisions: Record<string, string>;
  inputs: Record<string, TaskInput>;
  pendingCount: number;
  nextAgent?: string;
  onStart: () => void;
  onBeat: (to: number) => void;
  onOpenDoc: (d: SourceDoc) => void;
  onDecide: (taskId: string, optionId: string, input?: TaskInput) => void;
  onHandOff: () => void;
}) {
  const { c } = useStoryCopy();
  const { t, lang } = useTheatreCopy();
  const [showInput, setShowInput] = React.useState(false);
  const [analysing, setAnalysing] = React.useState(false);
  const [openTask, setOpenTask] = React.useState<number | null>(null);
  const [beatOpen, setBeatOpen] = React.useState<number | null>(null);
  const r = step.run;
  const seconds = Math.max(1, Math.round((Date.parse(r.finishedAt) - Date.parse(r.startedAt)) / 1000));
  const beats = script.beats ?? [];
  const stages = stagesOf(step, script);
  /* Confidence and guardrails run as one AI check, so both cards land together. */
  const checks = stages.filter((s): s is CheckStage => s === "confidence" || s === "guardrails");
  const checksEnd = beats.length + checks.length;
  const live = isFrontier && !finished;
  const shownBeat = live ? beat : stages.length;
  const shown = (s: Stage) => stages.indexOf(s) < shownBeat;
  const fresh = (s: Stage) => live && (s === "confidence" || s === "guardrails" ? shownBeat === checksEnd : stages.indexOf(s) === shownBeat - 1);
  const next = live ? stages[beat] : undefined;
  const checking = next === "confidence" || next === "guardrails";
  const nextBeatAt = next?.startsWith("beat:") ? Number(next.slice(5)) : -1;
  const openBeat = beatOpen !== null ? beats[beatOpen] : undefined;
  const firstOpen = step.tasks.findIndex((x) => !decisions[x.id]);
  const canHandOff = live && !running && shownBeat >= stages.length && pendingCount === 0;

  /*
   * An agent with beats plays as a stage: one card at a time (confidence and
   * guardrails land as a pair), and each new card replaces the one before.
   */
  const staged = beats.length > 0;
  const stageList = staged
    ? [
        ...beats.map((b, i) => ({ key: `beat:${i}`, label: stageName(b.short[lang]) })),
        ...(checks.length ? [{ key: "checks", label: t.stageChecks }] : []),
        ...(r.lane || step.tasks.length ? [{ key: "decision", label: step.tasks.length ? t.stageDecision : t.stageRoute }] : []),
      ]
    : [];
  const checksAt = stageList.findIndex((s) => s.key === "checks");
  const decisionAt = stageList.findIndex((s) => s.key === "decision");
  const reached =
    shownBeat >= stages.length && decisionAt >= 0 ? decisionAt : shownBeat > beats.length && checksAt >= 0 ? checksAt : Math.min(shownBeat, beats.length) - 1;
  const [peek, setPeek] = React.useState<number | null>(null);
  const view = !live && peek !== null && peek <= reached ? peek : reached;
  const viewKey = stageList[view]?.key ?? "intro";
  const [routing, setRouting] = React.useState(false);
  const railRef = React.useRef<HTMLElement>(null);

  /* The lane is a consequence of the two checks, so it lands on its own. */
  const onBeatRef = React.useRef(onBeat);
  React.useEffect(() => {
    onBeatRef.current = onBeat;
  });
  React.useEffect(() => {
    if (staged || next !== "lane" || running) return;
    const tm = window.setTimeout(() => onBeatRef.current(beat + 1), 1100);
    return () => window.clearTimeout(tm);
  }, [staged, next, running, beat]);

  /* On a stage the presenter asks for the lane, so the checks stay up while they are discussed. */
  React.useEffect(() => {
    if (!routing) return;
    const tm = window.setTimeout(() => {
      setRouting(false);
      onBeatRef.current(beat + 1);
    }, 1100);
    return () => window.clearTimeout(tm);
  }, [routing, beat]);

  /* When a card replaces a taller one, bring the top of the new card back into view. */
  React.useEffect(() => {
    if (!staged || !live) return;
    const el = railRef.current;
    if (!el || el.getBoundingClientRect().top >= 64) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }, [viewKey, staged, live]);

  const fetchedDocs = script.fetch.map((f) => (f.doc ? docs[f.doc] : undefined)).filter((d, i, a): d is SourceDoc => !!d && a.indexOf(d) === i);
  const decidedDocs = step.tasks.flatMap((x, n) => (decisions[x.id] ? (script.tasks?.[n]?.produces ?? []) : []));
  const producedDocs = [...new Set([...(script.produces ?? []), ...decidedDocs])].map((id) => docs[id]).filter((d): d is SourceDoc => !!d);

  const analysisOf = (kind: "confidence" | "guardrails"): AnalysisItem[] =>
    kind === "confidence"
      ? (r.confidence?.signals ?? []).map((s) => ({
          key: `signal-${s.key}`,
          label: humanKey(s.key),
          detail: s.evidence,
          value: s.score === null ? "—" : s.score.toFixed(2),
          doc: script.signalDocs?.[s.key] ? docs[script.signalDocs[s.key]] : undefined,
          ok: (s.score ?? 0) >= 0.9,
        }))
      : r.guardrails.map((g) => ({
          key: `guard-${g.rule}`,
          label: g.rule,
          detail: g.detail,
          value: g.status,
          doc: script.guardDocs?.[g.rule] ? docs[script.guardDocs[g.rule]] : undefined,
          ok: g.status !== "TRIPPED",
        }));

  const bandLabel = (score: number) => (score >= 0.9 ? t.bands.touchless : score >= 0.7 ? t.bands.review : t.bands.client);
  const passCount = r.guardrails.filter((g) => g.status !== "TRIPPED").length;
  const both = checks.length === 2;
  const checkLabel = both ? t.analyseChecks : checks[0] === "confidence" ? t.analyseConfidence : t.analyseGuardrails;
  const checkTitle = both ? t.checksTitle : checks[0] === "confidence" ? t.scoringTitle : t.guardTitle;
  const checkDoc = both ? t.checksDoc : checks[0] === "confidence" ? t.scoringDoc : t.guardDoc;
  const checkResult = checks
    .map((k) => (k === "confidence" && r.confidence ? t.confidenceResult(r.confidence.score.toFixed(2), bandLabel(r.confidence.score)) : t.guardResult(passCount, r.guardrails.length)))
    .join(" · ");

  const arrive = (on: boolean) => cn("aap-fade-up", on && "theatre-arrive");
  const atEnd = shownBeat >= stages.length;

  const checksCards = (shown("confidence") || shown("guardrails")) && (
    <div className="grid grid-cols-1 items-start gap-3 2xl:grid-cols-2">
      {r.confidence && shown("confidence") && (
        <div className={arrive(fresh("confidence"))}>
          <ConfidenceCard confidence={r.confidence} animate={fresh("confidence")} />
        </div>
      )}
      {shown("guardrails") && (
        <div className={arrive(fresh("guardrails"))}>
          <GuardrailCard guardrails={r.guardrails} />
        </div>
      )}
    </div>
  );

  const checksAction = checking && (
    <AiAction
      label={checkLabel}
      short={t.analyseShort}
      note={t.checkScope(checks.includes("confidence") ? (r.confidence?.signals.length ?? 0) : 0, checks.includes("guardrails") ? r.guardrails.length : 0)}
      scroll={!staged}
      onClick={() => setAnalysing(true)}
    />
  );

  const routeAction =
    next === "lane" &&
    (staged && !routing ? (
      <AiAction label={t.route} short={t.routeShort} note={t.routeNote} scroll={false} onClick={() => setRouting(true)} />
    ) : (
      <p role="status" className="aap-fade-up flex items-center gap-3 border border-divider bg-white px-5 py-3.5 text-[13px] text-ink">
        <Spinner size={13} /> {t.deciding}
      </p>
    ));

  const laneCard = r.lane && shown("lane") && (
    <div className={arrive(fresh("lane"))}>
      <LaneCard lane={r.lane} />
    </div>
  );

  const taskCards =
    atEnd &&
    step.tasks.map((x, i) => {
      const ui = script.tasks?.[i];
      const chosen = decisions[x.id];
      return (
        <HumanTaskCard
          key={x.id}
          task={x}
          decided={chosen}
          active={live && i === firstOpen}
          onDecide={(o) => onDecide(x.id, o)}
          action={ui ? { label: ui.cta[lang], onOpen: () => setOpenTask(i) } : undefined}
          note={ui && chosen ? taskNote(ui, chosen, inputs[x.id], lang, t) : undefined}
        />
      );
    });

  const handOffBar = canHandOff && (
    <div className="aap-fade-up flex flex-wrap items-center gap-4 border border-ink bg-white px-5 py-4" style={{ animationDelay: "160ms" }}>
      <p className="min-w-0 flex-1 text-[13px] leading-[19px] text-mute">
        {step.tasks.length === 0 ? c.policyHandoff : c.decidedBy(step.tasks.map((x) => x.persona).join(", "))}
      </p>
      <button
        type="button"
        onClick={onHandOff}
        aria-label={nextAgent ? c.handTo(nextAgent) : c.closeCase}
        className="ui-pill aap-cta ml-auto inline-flex items-center gap-3 whitespace-nowrap bg-ink px-6 py-3 text-[12.5px] text-ink-inverse"
      >
        {nextAgent ? <Fit full={c.handTo(nextAgent)} short={t.handShort} /> : c.closeCase}
        <ArrowRight size={16} aria-hidden />
      </button>
    </div>
  );

  const onStage = viewKey.startsWith("beat:") ? beats[Number(viewKey.slice(5))] : undefined;

  return (
    <article className="@container/agent flex min-w-0 flex-col gap-3" aria-labelledby={`agent-${step.index}`}>
      <header className="aap-fade-up relative flex flex-wrap items-center gap-x-4 gap-y-1 bg-accent-navy px-5 py-4 text-ink-inverse">
        <span aria-hidden className="aap-rule absolute inset-x-0 bottom-0 block h-[2px] bg-sand" />
        <span className="grid h-10 w-10 shrink-0 place-items-center border border-sand/60 text-sand" aria-hidden>
          <Bot size={19} className={running ? "ai-pulse" : undefined} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="aap-eyebrow truncate text-[10.5px] text-sand">
            {String(step.index + 1).padStart(2, "0")} · {r.flowStep}
          </p>
          <h2 id={`agent-${step.index}`} className="aap-title mt-1 truncate text-[17px] leading-[22px] text-ink-inverse">
            {r.agent}
          </h2>
        </div>
        {!running && !held && (
          <p className="w-full pl-14 text-[12px] font-light leading-[17px] text-ink-inverse/75 @lg/agent:w-auto @lg/agent:shrink-0 @lg/agent:pl-0 @lg/agent:text-right">
            {r.caseId}
            <br />
            {r.model && `${c.model} ${r.model} · `}
            {c.ran(seconds)}
          </p>
        )}
      </header>

      {held && isFrontier ? (
        <div className="aap-fade-up flex flex-wrap items-center gap-4 border border-ink bg-white px-5 py-4">
          <Inbox size={18} aria-hidden className="shrink-0 text-steel" />
          <p className="min-w-0 flex-1 text-[13.5px] text-ink">{t.awaiting}</p>
          <button
            type="button"
            onClick={onStart}
            aria-label={t.start(r.agent)}
            className="ui-pill aap-cta ml-auto inline-flex items-center gap-3 whitespace-nowrap bg-ink px-6 py-3 text-[12.5px] text-ink-inverse"
          >
            <Bot size={15} aria-hidden /> <Fit full={t.start(r.agent)} short={t.startShort} />
            <ArrowRight size={16} aria-hidden />
          </button>
        </div>
      ) : paused && isFrontier && !finished ? (
        <p role="status" className="border-t-[3px] border-mark-amber bg-surface-amber px-5 py-4 text-[13.5px] leading-[20px] text-ink">
          {c.pausedNotice}
        </p>
      ) : running ? (
        <Fetching script={script} docs={docs} onOpen={onOpenDoc} />
      ) : (
        staged ? (
          <>
            <StageRail stages={stageList} reached={reached} view={view} live={live} onPick={setPeek} railRef={railRef} />
            <div key={viewKey} className="flex flex-col gap-3">
              {viewKey === "intro" && fetchedDocs.length > 0 && (
                <section className={cn("aap-fade-up flex flex-wrap items-center gap-1.5 border border-divider bg-white px-5 py-3", live && "theatre-arrive")}>
                  <span className="mr-1 inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] text-mute">
                    <Check size={14} strokeWidth={2.6} className="text-surface-deep" aria-hidden /> {t.readSources(fetchedDocs.length)}
                  </span>
                  {fetchedDocs.map((d) => (
                    <DocChip key={d.id} doc={d} onOpen={onOpenDoc} />
                  ))}
                </section>
              )}
              {onStage && <div className={arrive(live)}>{onStage.card({ lang, docs, onOpenDoc })}</div>}
              {viewKey === "checks" && checksCards}
              {viewKey === "decision" && (
                <>
                  {laneCard}
                  {taskCards}
                  {atEnd && producedDocs.length > 0 && (
                    <section className="aap-fade-up flex flex-wrap items-center gap-1.5 border border-divider bg-white px-5 py-3">
                      <span className="mr-1 whitespace-nowrap text-[12px] text-mute">{t.written}</span>
                      {producedDocs.map((d) => (
                        <DocChip key={d.id} doc={d} onOpen={onOpenDoc} />
                      ))}
                    </section>
                  )}
                </>
              )}
            </div>
            {nextBeatAt >= 0 && beats[nextBeatAt] && (
              <AiAction
                key={nextBeatAt}
                label={beats[nextBeatAt].cta[lang]}
                short={beats[nextBeatAt].short[lang]}
                note={beats[nextBeatAt].note[lang]}
                scroll={false}
                onClick={() => setBeatOpen(nextBeatAt)}
              />
            )}
            {checksAction}
            {routeAction}
            {handOffBar}
          </>
        ) : (
        <>
          <section className={cn("aap-fade-up flex flex-col gap-4 border border-divider bg-white p-5", live && shownBeat === 0 && "theatre-arrive")}>
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-2">
                <h3 className="aap-title text-[13px] leading-[18px] text-ink">{c.produced}</h3>
                <span aria-hidden className="aap-rule block h-px w-8 bg-ink" />
              </div>
              <button
                type="button"
                onClick={() => setShowInput((v) => !v)}
                aria-expanded={showInput}
                className="aap-link ml-auto inline-flex items-center gap-1 whitespace-nowrap py-1 text-[12.5px] text-surface-deep"
              >
                {showInput ? c.hideInput : c.showInput}
                <ChevronDown size={14} className={cn("transition-transform", showInput && "rotate-180")} aria-hidden />
              </button>
            </div>
            {showInput && (
              <div className="flex flex-col gap-2 rounded-md border border-dashed border-divider bg-surface-fog/50 p-3">
                <h4 className="text-[12px] font-bold uppercase tracking-[0.05em] text-mute">{c.read}</h4>
                <IoBody body={step.input} />
              </div>
            )}
            {hasEvidence(uc, step.index) ? (
              <>
                <StoryEvidence uc={uc} index={step.index} />
                <details className="group rounded-md border border-divider">
                  <summary className="flex cursor-pointer list-none items-center gap-1 px-3 py-2 text-[12.5px] font-medium text-surface-deep">
                    {c.rawOutput}
                    <ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="border-t border-divider p-3">
                    <IoBody body={step.output} />
                  </div>
                </details>
              </>
            ) : (
              <IoBody body={step.output} />
            )}
            {(fetchedDocs.length > 0 || producedDocs.length > 0) && (
              <div className="flex flex-col gap-2 border-t border-divider pt-3">
                {fetchedDocs.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[12px] text-mute">{c.read}</span>
                    {fetchedDocs.map((d) => (
                      <DocChip key={d.id} doc={d} onOpen={onOpenDoc} />
                    ))}
                  </div>
                )}
                {producedDocs.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[12px] text-mute">{c.produced}</span>
                    {producedDocs.map((d) => (
                      <DocChip key={d.id} doc={d} onOpen={onOpenDoc} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
          {checksCards}
          {checksAction}
          {routeAction}
          {laneCard}
          {taskCards}
          {handOffBar}
        </>
        )
      )}

      {openTask !== null && step.tasks[openTask] && script.tasks?.[openTask] && !decisions[step.tasks[openTask].id] && (
        <TaskModal
          task={step.tasks[openTask]}
          ui={script.tasks[openTask]}
          docs={docs}
          onOpenDoc={onOpenDoc}
          onCancel={() => setOpenTask(null)}
          onDecide={(optionId, input) => {
            const id = step.tasks[openTask].id;
            setOpenTask(null);
            onDecide(id, optionId, input);
          }}
        />
      )}

      {analysing && (
        <AiAnalysisModal
          caseId={r.caseId}
          title={checkTitle}
          docLabel={checkDoc}
          agent={r.agent}
          model={r.model}
          items={checks.flatMap(analysisOf)}
          result={checkResult}
          onDone={() => {
            setAnalysing(false);
            onBeat(checksEnd);
          }}
        />
      )}

      {openBeat && beatOpen !== null && (
        <AiAnalysisModal
          caseId={r.caseId}
          title={openBeat.title[lang]}
          docLabel={openBeat.docLabel[lang]}
          agent={r.agent}
          model={r.model}
          items={openBeat.lines.map((l, n) => ({
            key: `${openBeat.key}-${n}`,
            label: l.label[lang],
            detail: l.detail[lang],
            value: l.value[lang],
            doc: l.doc ? docs[l.doc] : undefined,
            ok: !l.flag,
          }))}
          result={openBeat.result[lang]}
          onDone={() => {
            setBeatOpen(null);
            onBeat(beatOpen + 1);
          }}
        />
      )}
    </article>
  );
}

/* ── Source files gathered so far ─────────────────────────────────��─────── */

export function SourceFiles({ docs, onOpen }: { docs: SourceDoc[]; onOpen: (d: SourceDoc) => void }) {
  const { t } = useTheatreCopy();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12.5px] leading-[18px] text-mute">{docs.length ? t.sourceLead : t.noneYet}</p>
      <ul className="flex flex-col divide-y divide-divider border-y border-divider">
        {docs.map((d) => (
          <li key={d.id} className="ai-stream">
            <button type="button" onClick={() => onOpen(d)} className="group flex w-full items-center gap-3 py-2.5 text-left hover:bg-surface-fog/60">
              <span className="grid h-8 w-7 shrink-0 place-items-center border border-divider bg-white text-steel">
                <DocIcon kind={d.kind} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-ink">{d.title}</span>
                <span className="block truncate text-[11.5px] text-mute">
                  {d.id} · {d.system}
                </span>
              </span>
              <span className="shrink-0 text-[12px] text-surface-deep opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{t.open}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
