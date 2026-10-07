/**
 * The two live halves of the intake desk.
 *
 * `AiConversation` is the agent working in the open: it reads for a beat, then
 * says what it found one line at a time, then draws a conclusion. It is keyed
 * on a run number by its parent, so starting a second request unmounts the
 * first — which is what cancels its timers. There is no manual guard, and
 * there shouldn't be one.
 *
 * `PrFormPanel` is the request itself. The agent fills it cell by cell at the
 * same pace the guided run uses, so the two feel like one product. It stays a
 * real form throughout: every cell is editable, anything you have typed is
 * never overwritten, and the whole thing can be filled by hand with no agent
 * involved at all.
 */

import * as React from "react";
import { Sparkles, Send } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { Spinner } from "@/mro/components/ai/Spinner";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { EditableField } from "@/mro/components/workspace/ExtractionWizard";
import type { FillField, IntakeSpec } from "@/mro/data/intakeChannels";

/* Kept identical to the guided run's extraction, so the fill has one feel.
   The per-field gap travels with each request (a fast channel fills at once). */
const FILL_DELAY = 1000;
const HOT_MS = 450;

/* ── The agent, thinking out loud ───────────────────────────────────────── */

export function AiConversation({
  spec,
  onConclude,
  onAsk,
  chips,
}: {
  spec: IntakeSpec | null;
  /** Fired once the conclusion has been reached — the parent fills the form. */
  onConclude: () => void;
  onAsk: (text: string) => void;
  chips: { label: string; onPick: () => void }[];
}) {
  const [phase, setPhase] = React.useState<"reading" | "talking">("reading");
  const [typed, setTyped] = React.useState("");
  const feed = React.useRef<HTMLDivElement>(null);

  /* One timer set, cleared on unmount. The parent's key does the cancelling. */
  React.useEffect(() => {
    if (!spec) return;
    setPhase("reading");
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setPhase("talking"), spec.think));
    /* Every line is rendered at once with its own delay — chaining onDone
       restarts the typing on each parent render. */
    const spoken = spec.think + spec.lines.length * 900 + 900;
    timers.push(window.setTimeout(onConclude, spoken));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [spec, onConclude]);

  React.useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: "smooth" });
  }, [phase]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = typed.trim();
    if (!text) return;
    onAsk(text);
    setTyped("");
  };

  return (
    <section className="flex h-full min-w-0 flex-col rounded-md border border-divider bg-white">
      <header className="flex items-start gap-2.5 px-4 pb-2.5 pt-3.5">
        <span className="mt-0.5 shrink-0 text-surface-deep ai-pulse">
          <Sparkles size={17} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold leading-tight text-ink">Tell me what you need</h2>
          <p className="mt-0.5 text-[12px] leading-[16px] text-ink">
            Describe it in plain words — I'll fill the request in.
          </p>
        </div>
      </header>

      <div ref={feed} className="min-h-0 flex-1 space-y-3 overflow-y-auto border-t border-divider px-4 py-3">
        {!spec && (
          <p className="py-10 text-center text-[13px] leading-[19px] text-ink">
            Open something on the left, or just tell me below.
          </p>
        )}

        {spec && (
          <>
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-surface-deep px-3.5 py-2.5 text-[13px] leading-[18px] text-ink-inverse">
                {spec.asked}
              </p>
            </div>

            {phase === "reading" ? (
              <div className="flex items-center gap-2.5 text-[13px] text-ink">
                <Spinner size={14} />
                {spec.original ? "Reading what came in…" : "Thinking it through…"}
              </div>
            ) : (
              <SpringIn>
                <ul className="space-y-1.5">
                  {spec.lines.map((line, i) => (
                    <li key={line} className="flex items-start gap-2 text-[13px] leading-[18px] text-ink">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-surface-deep" />
                      <StreamingText text={line} cps={170} startDelay={i * 900} caret={false} />
                    </li>
                  ))}
                </ul>
                <p className="mt-3 rounded-md border border-surface-mint bg-surface-mint/35 px-3 py-2.5 text-[13px] leading-[18px] text-ink">
                  <StreamingText
                    text={spec.conclusion}
                    cps={150}
                    startDelay={spec.lines.length * 900}
                    caret={false}
                  />
                </p>
              </SpringIn>
            )}
          </>
        )}
      </div>

      <div className="border-t border-divider px-4 py-3">
        <div className="flex flex-wrap gap-1.5 pb-2.5">
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={c.onPick}
              className="ui-pill whitespace-nowrap border border-surface-deep/35 bg-white px-3 py-1.5 text-[12.5px] text-ink transition-colors hover:bg-surface-mint/40"
            >
              {c.label}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Assembly Line 2 needs a new seal…"
            className="h-[38px] min-w-0 flex-1 rounded-md border border-divider bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink/50 focus:border-surface-deep/50"
          />
          <button
            type="submit"
            aria-label="Ask"
            className="ui-pill grid h-[38px] w-[42px] shrink-0 place-items-center rounded-md bg-surface-deep text-ink-inverse hover:brightness-110"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </section>
  );
}

/* ── The request ────────────────────────────────────────────────────────── */

/** The six things a requisition needs, in the order a person would say them. */
export const FORM_LABELS = [
  "What to buy",
  "How many",
  "Plant & line",
  "Needed by",
  "Why",
  "Supplier & agreement",
] as const;

export function PrFormPanel({
  fill,
  onRaise,
}: {
  /** A request to fill. `key` changing is what re-runs the animation. */
  fill: { key: number; fields: FillField[]; stagger: number } | null;
  onRaise: () => void;
}) {
  const [vals, setVals] = React.useState<string[]>(() => FORM_LABELS.map(() => ""));
  const [hot, setHot] = React.useState(-1);
  /* Cells the person typed into. The agent never writes over these. */
  const dirty = React.useRef<Set<number>>(new Set());

  React.useEffect(() => {
    if (!fill) return;
    dirty.current = new Set();
    setVals(FORM_LABELS.map(() => ""));
    setHot(-1);
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        fill.fields.slice(0, FORM_LABELS.length).forEach((f, i) => {
          timers.push(
            window.setTimeout(() => {
              setVals((prev) => prev.map((v, j) => (j === i && !dirty.current.has(j) ? f.value : v)));
              setHot(i);
              timers.push(window.setTimeout(() => setHot((h) => (h === i ? -1 : h)), HOT_MS));
            }, i * fill.stagger),
          );
        });
      }, FILL_DELAY),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [fill]);

  const edit = (i: number, v: string) => {
    dirty.current.add(i);
    setVals((prev) => prev.map((x, j) => (j === i ? v : x)));
  };

  /* Nothing derived is stored — a hand-filled form raises exactly like a
     filled-in one, with no extra state to keep in step. */
  const canRaise = vals[0].trim() !== "" && vals[1].trim() !== "";

  return (
    <section className="flex h-full min-w-0 flex-col rounded-md border border-divider bg-white">
      <header className="flex items-baseline justify-between gap-3 px-4 pb-2.5 pt-3.5">
        <h2 className="text-[15px] font-bold leading-tight text-ink">Purchase request</h2>
        <span className="whitespace-nowrap text-[12px] text-ink">or fill it in yourself</span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-divider px-4 py-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {FORM_LABELS.map((label, i) => (
            <EditableField
              key={label}
              label={label}
              value={vals[i]}
              hot={hot === i}
              onChange={(v) => edit(i, v)}
            />
          ))}
        </div>
      </div>

      <footer className="border-t border-divider px-4 py-3">
        <button
          type="button"
          disabled={!canRaise}
          onClick={onRaise}
          className={cn(
            "ui-pill w-full rounded-md px-4 py-2.5 text-[13px] font-medium transition-colors",
            canRaise
              ? "bg-surface-deep text-ink-inverse hover:brightness-110"
              : "cursor-default border border-divider bg-surface-fog text-ink/45",
          )}
        >
          Review &amp; raise
        </button>
        <p className="mt-2 text-[12px] leading-[16px] text-ink">
          Checked against the agreement, stock and your approval limit.
        </p>
      </footer>
    </section>
  );
}
