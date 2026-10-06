import * as React from "react";
import { createPortal } from "react-dom";
import { Check, CornerUpRight, RotateCcw, Search, Sparkles } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { Spinner } from "@/mro/components/ai/Spinner";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { SourceLogo } from "@/mro/components/brand/SourceLogo";
import { FourWayMatchGrid } from "@/mro/components/workspace/FourWayMatchGrid";
import type { ChoiceStage, ExtractStage, SourceArtifact } from "@/mro/data/runSteps";
import { useT, useRunText } from "@/mro/lib/i18n";

/**
 * The staged-extraction wizard for agent steps 1–4. The agent reads its source
 * files one at a time: the current source shows on the right; on the left the
 * form box appears immediately with EMPTY cells, the active reasoning line
 * spins, and after a beat the agent auto-fills the fields one by one (each with
 * a brief highlight). Once filled, the fields are editable. Validate & Proceed
 * advances to the next source; after the last one the parent reveals the doc.
 *
 * A CHOICE stage is the exception: instead of auto-filling, the agent recommends
 * one option and shows option cards (e.g. three suppliers); the human picks one,
 * and only THEN do that option's fields auto-fill. Decisions stay with the human.
 */

const FILL_DELAY = 1000; // empty for ~1s, then auto-fill
const FIELD_STAGGER = 120; // gap between fields filling in
const SEARCH_MODAL_MS = 2200; // the "searching for a vendor" pop-up before a sourcing choice

/** A centered pop-up that spins while the agent looks for an existing on-contract
 *  source — shown before a sourcing choice (use the contract vs run an RFQ). */
function VendorSearchModal({ title, sub }: { title: string; sub: string }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <SpringIn className="w-full max-w-[400px]">
        <div className="bg-white rounded-2xl shadow-xl px-7 pt-7 pb-6 text-center">
          <div className="flex justify-center">
            <span className="relative w-[60px] h-[60px] rounded-full bg-surface-mint flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-surface-deep/20 animate-ping" />
              <span className="relative w-[46px] h-[46px] rounded-full bg-surface-deep text-ink-inverse flex items-center justify-center">
                <Search size={22} />
              </span>
            </span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-[0.1em] font-bold text-surface-deep">
            <Spinner size={11} /> Searching
          </div>
          <div className="text-[17px] font-bold text-ink mt-1 leading-tight">{title}</div>
          <p className="text-[12.5px] text-mute leading-snug mt-2">{sub}</p>
        </div>
      </SpringIn>
    </div>,
    document.body,
  );
}

export function EditableField({
  label,
  value,
  hot,
  options,
  type,
  onChange,
}: {
  label: string;
  value: string;
  hot: boolean;
  options?: string[];
  type?: "date";
  onChange: (v: string) => void;
}) {
  const fieldClass = cn(
    "w-full rounded px-2.5 py-1.5 text-[12.5px] text-ink transition-all duration-300 focus:outline-none focus:border-surface-deep focus:bg-white",
    hot
      ? "bg-surface-mint/50 border border-surface-deep/55 ring-2 ring-surface-deep/20"
      : "bg-[#f4f6f9] border border-[#dfe3e8]",
  );
  return (
    <label className="block min-w-0">
      <span className="block text-[10px] uppercase tracking-[0.06em] text-mute font-medium mb-1">
        {label}
      </span>
      {options ? (
        // Dropdown — the agent's pick is pre-selected; the reviewer can switch
        // it (e.g. Net 30 → Net 60). An empty value keeps the cell blank during
        // the auto-fill beat, matching the text fields.
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldClass, "appearance-none bg-no-repeat pr-7 cursor-pointer", value ? "" : "text-mute")}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundPosition: "right 0.55rem center",
          }}
        >
          {!value && <option value="" />}
          {[...new Set([value, ...options].filter(Boolean))].map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : type === "date" ? (
        // Date input — clicking opens the browser's native calendar so the
        // reviewer can pick a different baseline / due / run date. The value is
        // already ISO (YYYY-MM-DD); blank during the auto-fill beat.
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldClass, "cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer")}
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass} />
      )}
    </label>
  );
}

/** The option cards for a choice stage — the agent's recommendation + the picks. */
function ChoiceCards({ choice, onPick }: { choice: ChoiceStage; onPick: (id: string) => void }) {
  return (
    <div className="p-4 space-y-3">
      {/* AI recommendation summary — typed out before the cards, grounding the pick. */}
      <div className="rounded-md bg-surface-mint/40 border border-surface-mint px-3 py-2.5 flex gap-2">
        <Sparkles size={13} className="text-surface-deep mt-[2px] shrink-0" />
        <p className="text-[12.5px] text-ink leading-relaxed min-h-[1.2em]">
          <StreamingText text={choice.recommendation} cps={54} startDelay={250} />
        </p>
      </div>
      <div className={cn("grid gap-2.5", choice.options.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
        {choice.options.map((o) => {
          const rec = o.id === choice.recommendedId;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onPick(o.id)}
              className={cn(
                "ui-pill text-left rounded-md border p-3 flex flex-col gap-2 transition-colors hover:border-surface-deep min-w-0",
                rec
                  ? "border-surface-deep/60 bg-surface-mint/30 ring-1 ring-surface-deep/25"
                  : "border-divider bg-white",
              )}
            >
              <div className="flex items-start justify-between gap-1.5">
                <span className="text-[12.5px] font-bold text-ink leading-tight">{o.name}</span>
                {rec && (
                  <span className="shrink-0 text-[8.5px] uppercase tracking-[0.05em] font-bold bg-surface-deep text-ink-inverse px-1.5 py-0.5 rounded">
                    Pick
                  </span>
                )}
              </div>
              <span className="text-[10.5px] text-mute leading-tight">{o.meta}</span>
              {o.badges && o.badges.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {o.badges.map((b) => (
                    <span
                      key={b}
                      className="text-[9px] uppercase tracking-[0.03em] font-medium bg-surface-fog text-ink px-1.5 py-0.5 rounded whitespace-nowrap"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-auto space-y-1 pt-1.5 border-t border-divider">
                {o.stats.map((s) => (
                  <div key={s.label} className="flex items-center justify-between gap-2 text-[10.5px]">
                    <span className="text-mute whitespace-nowrap">{s.label}</span>
                    <span className="text-ink font-medium tabular-nums text-right">{s.value}</span>
                  </div>
                ))}
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-surface-deep pt-0.5">
                <CornerUpRight size={12} /> {rec ? "Accept" : "Select"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ExtractionWizard({
  flow,
  stepN,
  stages,
  sources,
  onComplete,
  onChoice,
}: {
  /** Which run and step these stages belong to — keys their translated labels. */
  flow: string;
  stepN: number;
  stages: ExtractStage[];
  sources: SourceArtifact[];
  onComplete: () => void;
  /** Fires when the reviewer picks an option in a choice stage (passes its id) —
   *  lets the run react to a sourcing decision (e.g. drop the RFQ step). */
  onChoice?: (optionId: string) => void;
}) {
  const { t } = useT();
  const wt = useRunText(flow, stepN);
  const [stageIdx, setStageIdx] = React.useState(0);
  const [vals, setVals] = React.useState<string[]>(() => (stages[0].fields ?? []).map(() => ""));
  const [filled, setFilled] = React.useState(false);
  const [hot, setHot] = React.useState(-1);
  // Bumping this re-runs the empty → auto-fill animation (used by Discard).
  const [fillKey, setFillKey] = React.useState(0);
  // For a choice stage: which option the reviewer picked (null = still choosing).
  const [choiceSel, setChoiceSel] = React.useState<string | null>(null);
  // True while the "searching for a vendor" pop-up spins, before a sourcing choice.
  const [searching, setSearching] = React.useState(false);
  // Tracks which (stage · re-extract) we've already searched, so "Change" doesn't
  // re-trigger the modal but Discard (a fresh extract) does.
  const searchedRef = React.useRef("");

  // On entering a choice stage that has a searchModal, spin the centered pop-up
  // for a beat before the option cards reveal.
  React.useEffect(() => {
    const s = stages[stageIdx];
    const key = `${stageIdx}:${fillKey}`;
    if (s.choice?.searchModal && searchedRef.current !== key) {
      searchedRef.current = key;
      setSearching(true);
      const t = window.setTimeout(() => setSearching(false), SEARCH_MODAL_MS);
      return () => window.clearTimeout(t);
    }
  }, [stageIdx, stages, fillKey]);

  const pick = (id: string) => {
    setChoiceSel(id);
    onChoice?.(id);
  };

  const stage = stages[stageIdx];
  const source = sources.find((s) => s.id === stage.sourceId);
  const isMatch = !!stage.matchGrid;
  const choice = stage.choice;
  const selectedOption = choice && choiceSel ? choice.options.find((o) => o.id === choiceSel) ?? null : null;
  // The fields rendered/auto-filled: a choice stage fills the PICKED option's fields.
  const activeFields: { label: string; value: string; options?: string[]; type?: "date" }[] = choice
    ? selectedOption?.fields ?? []
    : stage.fields ?? [];

  // On each stage (or re-extract / option pick): blank the box, wait a beat, then
  // fill field by field. Match-grid stages are driven by the grid itself. A choice
  // stage waits for a pick (no auto-fill) and then fills the chosen option's fields.
  React.useEffect(() => {
    const s = stages[stageIdx];
    if (s.matchGrid) {
      setFilled(false);
      // The grid flips `filled` via its onReady once its columns finish animating.
      // Safety net so the step can NEVER get stuck if that callback is ever dropped
      // (e.g. an HMR remount mid-animation): enable Proceed after the worst-case
      // animation duration regardless. onReady normally fires well before this.
      const g = s.matchGrid;
      const maxMs = 1400 + g.rows.length * g.columns.length * 110;
      const safety = window.setTimeout(() => setFilled(true), maxMs);
      return () => window.clearTimeout(safety);
    }
    if (s.choice && !choiceSel) {
      // Still on the cards — nothing to fill until the reviewer picks.
      setFilled(false);
      setHot(-1);
      setVals([]);
      return;
    }
    const fields = s.choice
      ? s.choice.options.find((o) => o.id === choiceSel)?.fields ?? []
      : s.fields ?? [];
    setFilled(false);
    setHot(-1);
    setVals(fields.map(() => ""));
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        fields.forEach((f, i) => {
          timers.push(
            window.setTimeout(() => {
              setVals((prev) => prev.map((v, j) => (j === i ? f.value : v)));
              setHot(i);
              timers.push(window.setTimeout(() => setHot((h) => (h === i ? -1 : h)), 450));
            }, i * FIELD_STAGGER),
          );
        });
        timers.push(
          window.setTimeout(() => setFilled(true), fields.length * FIELD_STAGGER + 150),
        );
      }, FILL_DELAY),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [stageIdx, fillKey, stages, choiceSel]);

  const proceed = () => {
    if (!filled) return;
    if (stageIdx < stages.length - 1) {
      setStageIdx((i) => i + 1);
      setChoiceSel(null);
    } else onComplete();
  };

  // Discard = re-extract: blank and auto-fill again (a choice stage returns to its cards).
  const discard = () => {
    setChoiceSel(null);
    setFillKey((k) => k + 1);
  };

  return (
    <div className="grid grid-cols-[minmax(0,560px)_minmax(0,1fr)] gap-4 items-start">
      {searching && stage.choice?.searchModal && (
        <VendorSearchModal title={stage.choice.searchModal.title} sub={stage.choice.searchModal.sub} />
      )}
      {/* Left — staged reasoning + the auto-fill form box */}
      <div className="space-y-3 min-w-0">
        <div className="space-y-1.5">
          {stages.slice(0, stageIdx + 1).map((s, i) => {
            const active = i === stageIdx;
            return (
              <div key={i} className="flex items-start gap-2 text-[12.5px] leading-snug">
                {active ? (
                  <Spinner size={13} className="mt-[2px] shrink-0" />
                ) : (
                  <Check size={13} className="text-surface-deep mt-[3px] shrink-0" strokeWidth={3} />
                )}
                <span className={active ? "text-ink font-medium" : "text-ink"}>{wt(`reasoning.${i}`, s.reasoning)}</span>
              </div>
            );
          })}
        </div>

        {/* The match-grid box keeps a stable key so it persists across the three
            match stages — previous columns stay, the new one fills in. */}
        <SpringIn key={isMatch ? "match-box" : stageIdx}>
          <div className="bg-white border border-divider rounded-md overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-[#eef1f5] border-b border-divider border-l-[3px] border-l-[#354a5f]">
              <Sparkles size={12} className="text-ink shrink-0" />
              <span className="text-[10.5px] uppercase tracking-[0.06em] text-ink font-bold">
                {wt(`stage.${stageIdx}.title`, stage.title)}
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] text-mute whitespace-nowrap">
                {searching ? (
                  <>
                    <Spinner size={9} className="shrink-0" /> searching…
                  </>
                ) : choice && !selectedOption ? (
                  <>
                    <Sparkles size={9} className="text-surface-deep shrink-0" /> AI recommendation · pick one
                  </>
                ) : filled ? (
                  isMatch ? "matched · editable" : "auto-filled · editable"
                ) : (
                  <>
                    <Spinner size={9} className="shrink-0" /> {isMatch ? "matching…" : "auto-filling…"}
                  </>
                )}
              </span>
            </div>
            {stage.narrative && (
              // The agent writes out its rationale in prose — typed character by
              // character — before (and above) the values it recommends.
              <div className="px-4 pt-3.5">
                <div className="rounded-md bg-surface-mint/40 border border-surface-mint px-3 py-2.5 flex gap-2">
                  <Sparkles size={13} className="text-surface-deep mt-[2px] shrink-0" />
                  <p className="text-[12.5px] text-ink leading-relaxed min-h-[1.2em]">
                    <StreamingText text={stage.narrative} cps={52} startDelay={350} />
                  </p>
                </div>
              </div>
            )}
            {choice && !selectedOption ? (
              searching ? (
                <div className="p-4 flex items-center gap-2 text-[12.5px] text-mute">
                  <Spinner size={13} className="shrink-0" /> Searching the supplier master and outline
                  agreements…
                </div>
              ) : (
                <ChoiceCards choice={choice} onPick={pick} />
              )
            ) : isMatch && stage.matchGrid ? (
              <div className="p-4">
                <FourWayMatchGrid
                  grid={stage.matchGrid}
                  reveal={stage.matchGrid.reveal}
                  verdict={stage.matchGrid.verdict}
                  replayKey={fillKey}
                  onReady={() => setFilled(true)}
                />
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {choice && selectedOption && (
                  <div className="flex items-center gap-2 text-[12px]">
                    <Check size={13} className="text-surface-deep shrink-0" strokeWidth={3} />
                    <span className="text-ink font-medium">{selectedOption.name}</span>
                    <span className="text-mute">selected</span>
                    <button
                      type="button"
                      onClick={() => setChoiceSel(null)}
                      className="ui-pill ml-auto text-[11px] font-medium text-surface-deep hover:underline"
                    >
                      Change
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                  {activeFields.map((f, i) => (
                    <EditableField
                      key={f.label}
                      label={wt(`stage.${stageIdx}.field.${i}`, f.label)}
                      value={vals[i] ?? ""}
                      hot={hot === i}
                      options={f.options}
                      type={f.type}
                      onChange={(v) => setVals((arr) => arr.map((x, j) => (j === i ? v : x)))}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="px-4 py-3 border-t border-divider flex items-center gap-2">
              <button
                type="button"
                onClick={proceed}
                disabled={!filled}
                className="ui-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold bg-surface-deep text-ink-inverse hover:bg-accent-green disabled:opacity-45"
              >
                <CornerUpRight size={14} /> {t("run.validateProceed")}
              </button>
              <button
                type="button"
                onClick={discard}
                className="ui-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium bg-white text-ink border border-ink/30 hover:bg-surface-fog"
              >
                <RotateCcw size={14} /> {t("run.discard")}
              </button>
              <span className="ml-auto text-[11px] text-mute tabular-nums">
                {stageIdx + 1} / {stages.length}
              </span>
            </div>
          </div>
        </SpringIn>
      </div>

      {/* Right — the source the agent is reading right now */}
      <div className="min-w-0">
        {source && (
          <SpringIn key={stage.sourceId}>
            <div className="bg-white border border-divider rounded-md overflow-hidden">
              <div className="px-3.5 py-2 border-b border-divider bg-surface-fog flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-ink truncate">{source.label}</div>
                  <div className="text-[10.5px] uppercase tracking-[0.06em] text-mute truncate">
                    {source.meta}
                  </div>
                </div>
                <SourceLogo kind={source.kind} />
              </div>
              <div className="p-3 overflow-x-auto">{source.body}</div>
            </div>
          </SpringIn>
        )}
      </div>
    </div>
  );
}
