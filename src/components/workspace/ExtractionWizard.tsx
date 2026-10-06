import * as React from "react";
import { Check, CornerUpRight, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ai/Spinner";
import { SpringIn } from "@/components/ai/SpringIn";
import { StreamingText } from "@/components/ai/StreamingText";
import { SourceLogo } from "@/components/brand/SourceLogo";
import { FourWayMatchGrid } from "@/components/workspace/FourWayMatchGrid";
import type { ExtractStage, SourceArtifact } from "@/data/runSteps";

/**
 * The staged-extraction wizard for agent steps 1–4. The agent reads its source
 * files one at a time: the current source shows on the right; on the left the
 * form box appears immediately with EMPTY cells, the active reasoning line
 * spins, and after a beat the agent auto-fills the fields one by one (each with
 * a brief highlight). Once filled, the fields are editable. Validate & Proceed
 * advances to the next source; after the last one the parent reveals the doc.
 */

const FILL_DELAY = 1000; // empty for ~1s, then auto-fill
const FIELD_STAGGER = 120; // gap between fields filling in

function EditableField({
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
    "w-full rounded px-2.5 py-1.5 text-[12.5px] text-ink transition-all duration-300 focus:outline-none focus:border-[#0a6ed1] focus:bg-white",
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

export function ExtractionWizard({
  stages,
  sources,
  onComplete,
}: {
  stages: ExtractStage[];
  sources: SourceArtifact[];
  onComplete: () => void;
}) {
  const [stageIdx, setStageIdx] = React.useState(0);
  const [vals, setVals] = React.useState<string[]>(() => (stages[0].fields ?? []).map(() => ""));
  const [filled, setFilled] = React.useState(false);
  const [hot, setHot] = React.useState(-1);
  // Bumping this re-runs the empty → auto-fill animation (used by Discard).
  const [fillKey, setFillKey] = React.useState(0);

  const stage = stages[stageIdx];
  const source = sources.find((s) => s.id === stage.sourceId);
  const isMatch = !!stage.matchGrid;

  // On each stage (or re-extract): blank the box, wait a beat, then fill field
  // by field. The active reasoning line keeps spinning throughout. Match-grid
  // stages are driven by the grid itself (it reports back via onReady), so we
  // just reset `filled` and let the grid take over.
  React.useEffect(() => {
    if (stages[stageIdx].matchGrid) {
      setFilled(false);
      return;
    }
    const fields = stages[stageIdx].fields ?? [];
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
  }, [stageIdx, fillKey, stages]);

  const proceed = () => {
    if (!filled) return;
    if (stageIdx < stages.length - 1) setStageIdx((i) => i + 1);
    else onComplete();
  };

  // Discard = re-extract: blank and auto-fill again.
  const discard = () => setFillKey((k) => k + 1);

  return (
    <div className="grid grid-cols-[minmax(0,560px)_minmax(0,1fr)] gap-4 items-start">
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
                <span className={active ? "text-ink font-medium" : "text-ink"}>{s.reasoning}</span>
              </div>
            );
          })}
        </div>

        {/* The match-grid box keeps a stable key so it persists across the three
            match stages — previous columns stay, the new one fills in. */}
        <SpringIn key={isMatch ? "match-box" : stageIdx}>
          <div className="bg-white border border-divider rounded-md overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-[#eef1f5] border-b border-divider border-l-[3px] border-l-[#354a5f]">
              <Sparkles size={12} className="text-[#354a5f] shrink-0" />
              <span className="text-[10.5px] uppercase tracking-[0.06em] text-[#354a5f] font-bold">
                {stage.title}
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] text-mute whitespace-nowrap">
                {filled ? (
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
            {isMatch && stage.matchGrid ? (
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
              <div className="p-4 grid grid-cols-2 gap-x-3 gap-y-3">
                {(stage.fields ?? []).map((f, i) => (
                  <EditableField
                    key={f.label}
                    label={f.label}
                    value={vals[i] ?? ""}
                    hot={hot === i}
                    options={f.options}
                    type={f.type}
                    onChange={(v) => setVals((arr) => arr.map((x, j) => (j === i ? v : x)))}
                  />
                ))}
              </div>
            )}
            <div className="px-4 py-3 border-t border-divider flex items-center gap-2">
              <button
                type="button"
                onClick={proceed}
                disabled={!filled}
                className="ui-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold bg-surface-deep text-ink-inverse hover:bg-accent-green disabled:opacity-45"
              >
                <CornerUpRight size={14} /> Validate &amp; proceed
              </button>
              <button
                type="button"
                onClick={discard}
                className="ui-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium bg-white text-ink border border-ink/30 hover:bg-surface-fog"
              >
                <RotateCcw size={14} /> Discard
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
