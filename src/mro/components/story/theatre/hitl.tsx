/**
 * How a person decides a task during guided playback. The agent has already
 * done the preparation — a side-by-side fork, a drafted e-mail, or proposed
 * figures — and the person confirms, edits or overrules it. Whatever they
 * type or change travels with the decision and is printed on the record.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, Clock, Paperclip, Send, Sparkles, UserRound, X } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { Spinner } from "@/mro/components/ai/Spinner";
import type { HumanTask } from "@/mro/data/stories/runModel";
import type { TaskInput } from "@/mro/services/demoLedger";
import type { ChoiceOption, FormField, TaskUi } from "@/mro/components/story/theatre/script";
import { DocChip, type SourceDoc } from "@/mro/components/story/theatre/pdf";
import { useTheatreCopy } from "@/mro/components/story/theatre/copy";
import { useStoryCopy } from "@/mro/components/story/copy";

type Lang = "en" | "de";
type Copy = ReturnType<typeof useTheatreCopy>["t"];

const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

/** Reveals `total` items one at a time; reduced motion shows them all at once. */
function useStream(total: number, ms: number) {
  const [n, setN] = React.useState(() => (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? total : 0));
  React.useEffect(() => {
    if (n >= total) return;
    const tm = window.setTimeout(() => setN((x) => x + 1), ms);
    return () => window.clearTimeout(tm);
  }, [n, total, ms]);
  return n;
}

type ModalProps<U extends TaskUi = TaskUi> = {
  task: HumanTask;
  ui: U;
  docs: Record<string, SourceDoc>;
  onOpenDoc: (d: SourceDoc) => void;
  onCancel: () => void;
  onDecide: (optionId: string, input?: TaskInput) => void;
};

export function TaskModal({ ui, ...rest }: ModalProps) {
  switch (ui.kind) {
    case "choice":
      return <ChoiceModal {...rest} ui={ui} />;
    case "email":
      return <EmailModal {...rest} ui={ui} />;
    case "form":
      return <FormModal {...rest} ui={ui} />;
    case "approve":
      return <ApproveModal {...rest} ui={ui} />;
  }
}

/* ── Shell ──────────────────────────────────────────────────────────────── */

function Shell({ task, onCancel, children, footer }: { task: HumanTask; onCancel: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  const { t } = useTheatreCopy();
  const { c } = useStoryCopy();
  const titleId = React.useId();
  const onCancelRef = React.useRef(onCancel);
  React.useEffect(() => {
    onCancelRef.current = onCancel;
  });
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      /* Escape closes an open source file first. */
      if (e.key !== "Escape" || document.querySelector("[data-pdf-viewer]")) return;
      onCancelRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 px-4 py-6 backdrop-blur-[2px]">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="ai-spring flex max-h-full w-full max-w-[780px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <header className="flex shrink-0 items-start gap-4 border-b border-divider px-6 py-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center border border-mark-amber/60 bg-surface-amber text-mark-amber">
            <UserRound size={17} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-mute">
              <span className="text-ink">{task.persona}</span>
              <span className={cn("aap-eyebrow px-2 py-0.5 text-[10px]", task.org === "Client" ? "border border-divider text-surface-navy" : "bg-sand text-ink")}>{task.org}</span>
              {task.slaHours && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} aria-hidden /> {c.sla(task.slaHours)}
                </span>
              )}
            </div>
            <h2 id={titleId} className="mt-1.5 text-pretty text-[17px] font-bold leading-[23px] text-ink">
              {task.task}
            </h2>
          </div>
          <button type="button" onClick={onCancel} aria-label={t.cancel} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-mute hover:bg-surface-fog">
            <X size={17} aria-hidden />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-divider bg-surface-fog/60 px-6 py-4">{footer}</footer>
      </div>
    </div>,
    document.body,
  );
}

function CancelButton({ onClick }: { onClick: () => void }) {
  const { t } = useTheatreCopy();
  return (
    <button type="button" onClick={onClick} className="ui-pill whitespace-nowrap rounded-md px-4 py-2.5 text-[13.5px] text-ink hover:bg-surface-fog">
      {t.cancel}
    </button>
  );
}

function PrimaryButton({ children, disabled, onClick, autoFocus }: { children: React.ReactNode; disabled?: boolean; onClick: () => void; autoFocus?: boolean }) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (autoFocus && !disabled) ref.current?.focus({ preventScroll: true });
  }, [autoFocus, disabled]);
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="ui-pill inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-ink px-5 py-2.5 text-[13.5px] font-bold text-ink-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/** What the agent did before handing the task over, streamed line by line. */
function AgentPrep({ title, lines, shown }: { title: string; lines: string[]; shown: number }) {
  const done = shown >= lines.length;
  return (
    <section className="flex flex-col gap-1 rounded-md border border-divider bg-surface-fog/50 px-4 py-3" aria-live="polite">
      <p className="aap-eyebrow mb-1 flex items-center gap-2 text-[10.5px] text-steel">
        {done ? <Sparkles size={13} aria-hidden className="text-surface-deep" /> : <Spinner size={12} />}
        {title}
      </p>
      <ul className="flex flex-col">
        {lines.slice(0, shown + 1).map((l, i) => (
          <li key={l} className="ai-stream flex items-start gap-2.5 py-1 text-[13.5px] leading-[20px] text-ink">
            <span className="mt-[3px] grid h-4 w-4 shrink-0 place-items-center">
              {i < shown ? <Check size={14} strokeWidth={2.6} className="text-surface-deep" aria-hidden /> : <Spinner size={12} />}
            </span>
            <span className={cn("text-pretty", i >= shown && "text-mute")}>{l}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Fork: pick one of the prepared options ─────────────────────────────── */

function ChoiceModal({ task, ui, docs, onOpenDoc, onCancel, onDecide }: ModalProps<Extract<TaskUi, { kind: "choice" }>>) {
  const { t, lang } = useTheatreCopy();
  const shown = useStream(ui.prep.length, 560);
  const ready = shown >= ui.prep.length;
  const [picked, setPicked] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");
  const reasonId = React.useId();
  const option = ui.options.find((o) => o.id === picked);
  const needsReason = Boolean(option?.reason);
  const canConfirm = Boolean(option) && (!needsReason || reason.trim().length >= 12);
  const label = task.options.find((o) => o.id === picked)?.label[lang];

  return (
    <Shell
      task={task}
      onCancel={onCancel}
      footer={
        <>
          {needsReason && reason.trim().length < 12 && <span className="mr-auto text-[12.5px] text-mute">{t.reasonNeeded}</span>}
          <CancelButton onClick={onCancel} />
          <PrimaryButton disabled={!canConfirm} onClick={() => picked && onDecide(picked, needsReason ? { reason: reason.trim() } : undefined)}>
            {label ?? t.pickOne}
          </PrimaryButton>
        </>
      }
    >
      <AgentPrep title={ready ? t.prepared : t.preparing} lines={ui.prep.map((l) => l[lang])} shown={shown} />

      {ready && (
        <div role="radiogroup" aria-label={task.task} className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
          {ui.options.map((o, i) => (
            <OptionCard key={o.id} option={o} index={i} selected={picked === o.id} onPick={() => setPicked(o.id)} docs={docs} onOpenDoc={onOpenDoc} lang={lang} />
          ))}
        </div>
      )}

      {option?.reason && (
        <div className="aap-fade-up flex flex-col gap-2">
          <label htmlFor={reasonId} className="text-[13.5px] font-bold text-ink">
            {option.reason.label[lang]}
          </label>
          <textarea
            id={reasonId}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t.reasonPlaceholder}
            className="w-full resize-y border border-divider px-3 py-2.5 text-[14px] leading-[21px] text-ink placeholder:text-mute focus:border-ink focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setReason(option.reason!.suggestion[lang])}
              className="ui-pill inline-flex items-center gap-1.5 whitespace-nowrap border border-dashed border-ink/35 bg-white px-3 py-1.5 text-[12.5px] text-ink hover:bg-surface-fog"
            >
              <Sparkles size={13} aria-hidden className="text-surface-deep" /> {option.reason.suggestionLabel[lang]}
            </button>
            <span className="text-[12px] text-mute">{t.savedToCase}</span>
          </div>
        </div>
      )}
    </Shell>
  );
}

/** One prepared option. With `onPick` it is a radio; without, a read-only card, highlighted when `selected`. */
function OptionCard({
  option: o,
  index,
  selected,
  onPick,
  badge,
  docs,
  onOpenDoc,
  lang,
}: {
  option: ChoiceOption;
  index: number;
  selected: boolean;
  onPick?: () => void;
  badge?: string;
  docs: Record<string, SourceDoc>;
  onOpenDoc: (d: SourceDoc) => void;
  lang: Lang;
}) {
  const files = (o.docs ?? []).map((id) => docs[id]).filter((d): d is SourceDoc => !!d);
  const body = (
    <>
      <span className="flex items-center gap-2">
        <span className={cn("flex min-w-0 flex-1 items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em]", o.recommended ? "text-surface-deep" : "text-mute")}>
          {o.recommended ? <Sparkles size={13} aria-hidden /> : <UserRound size={13} aria-hidden />}
          <span className="truncate">{o.tag[lang]}</span>
        </span>
        {onPick ? (
          <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border", selected ? "border-ink bg-ink text-ink-inverse" : "border-ink/30")} aria-hidden>
            {selected && <Check size={12} strokeWidth={3} />}
          </span>
        ) : (
          badge && <span className="shrink-0 whitespace-nowrap bg-ink px-2 py-0.5 text-[11px] font-bold text-ink-inverse">{badge}</span>
        )}
      </span>
      <span className="text-[15px] font-bold leading-[20px] text-ink">{o.title}</span>
      <span className="flex items-baseline gap-2">
        <span className="text-[26px] font-bold leading-none tabular-nums text-ink">{o.figure}</span>
        <span className="text-[12.5px] text-mute">{o.figureNote[lang]}</span>
      </span>
      <dl className="flex flex-col divide-y divide-divider border-t border-divider text-[12.5px] leading-[18px]">
        {o.facts.map((f) => (
          <div key={f.label.en} className="flex items-start justify-between gap-3 py-1.5">
            <dt className="shrink-0 text-mute">{f.label[lang]}</dt>
            <dd className={cn("text-right", f.flag ? "text-mark-amber" : "text-ink")}>{f.value[lang]}</dd>
          </div>
        ))}
      </dl>
    </>
  );
  return (
    <div className={cn("aap-fade-up flex flex-col border bg-white transition-colors", selected ? "border-ink ring-1 ring-ink" : "border-divider")} style={{ animationDelay: `${index * 140}ms` }}>
      {onPick ? (
        <button type="button" role="radio" aria-checked={selected} onClick={onPick} className="group flex flex-1 flex-col gap-3 p-4 text-left hover:bg-surface-fog/40">
          {body}
        </button>
      ) : (
        <div className="flex flex-1 flex-col gap-3 p-4">{body}</div>
      )}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-divider px-4 py-2.5">
          {files.map((d) => (
            <DocChip key={d.id} doc={d} onOpen={onOpenDoc} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Approve the path the person owns, with the reason the agent drafted ── */

function ApproveModal({ task, ui, docs, onOpenDoc, onCancel, onDecide }: ModalProps<Extract<TaskUi, { kind: "approve" }>>) {
  const { t, lang } = useTheatreCopy();
  const shown = useStream(ui.prep.length, 560);
  const ready = shown >= ui.prep.length;
  const draft = ui.reason.draft[lang];
  const [reason, setReason] = React.useState(draft);
  const reasonId = React.useId();
  const edited = reason.trim() !== draft.trim();
  const ok = reason.trim().length >= 12;

  return (
    <Shell
      task={task}
      onCancel={onCancel}
      footer={
        <>
          <span className="mr-auto text-[12.5px] text-mute">{!ready ? t.preparing : !ok ? t.reasonNeeded : edited ? t.reasonEdited : t.reasonDrafted}</span>
          <CancelButton onClick={onCancel} />
          <PrimaryButton disabled={!ready || !ok} autoFocus onClick={() => onDecide(ui.option, { reason: reason.trim(), edited })}>
            <Check size={15} aria-hidden /> {ui.approve[lang]}
          </PrimaryButton>
        </>
      }
    >
      <AgentPrep title={ready ? t.prepared : t.preparing} lines={ui.prep.map((l) => l[lang])} shown={shown} />

      {ready && (
        <>
          <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
            {ui.compare.map((o, i) => (
              <OptionCard key={o.id} option={o} index={i} selected={o.id === ui.option} badge={o.id === ui.option ? t.youApprove : undefined} docs={docs} onOpenDoc={onOpenDoc} lang={lang} />
            ))}
          </div>
          <div className="aap-fade-up flex flex-col gap-2" style={{ animationDelay: "280ms" }}>
            <label htmlFor={reasonId} className="text-[13.5px] font-bold text-ink">
              {ui.reason.label[lang]}
            </label>
            <textarea
              id={reasonId}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t.reasonPlaceholder}
              className="w-full resize-y border border-divider px-3 py-2.5 text-[14px] leading-[21px] text-ink placeholder:text-mute focus:border-ink focus:outline-none"
            />
            <p className="flex items-center gap-1.5 text-[12px] text-mute">
              <Sparkles size={13} aria-hidden className="shrink-0 text-surface-deep" /> {t.savedToCase}
            </p>
          </div>
        </>
      )}
    </Shell>
  );
}

/* ── Drafted e-mail: review, edit, send ─────────────────────────────────── */

function EmailModal({ task, ui, docs, onOpenDoc, onCancel, onDecide }: ModalProps<Extract<TaskUi, { kind: "email" }>>) {
  const { t, lang } = useTheatreCopy();
  const draft = ui.body.join("\n\n");
  const shown = useStream(ui.body.length, 420);
  const drafted = shown >= ui.body.length;
  const [body, setBody] = React.useState(draft);
  const edited = body.trim() !== draft.trim();
  const files = (ui.attach ?? []).map((id) => docs[id]).filter((d): d is SourceDoc => !!d);

  return (
    <Shell
      task={task}
      onCancel={onCancel}
      footer={
        <>
          <span className="mr-auto inline-flex items-center gap-1.5 text-[12.5px] text-mute">
            {drafted ? (edited ? t.editedByYou : t.draftedByAgent) : <><Spinner size={12} /> {t.drafting}</>}
          </span>
          <CancelButton onClick={onCancel} />
          <PrimaryButton disabled={!drafted || !body.trim()} autoFocus onClick={() => onDecide(ui.option, { body: body.trim(), edited })}>
            <Send size={15} aria-hidden /> {ui.send[lang]}
          </PrimaryButton>
        </>
      }
    >
      <div className="overflow-hidden rounded-md border border-divider">
        <dl className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-2 border-b border-divider bg-surface-fog/50 px-4 py-3 text-[13px]">
          <dt className="text-mute">{t.from}</dt>
          <dd className="truncate text-ink">{ui.from}</dd>
          <dt className="text-mute">{t.to}</dt>
          <dd className="truncate text-ink">{ui.to}</dd>
          <dt className="text-mute">{t.subject}</dt>
          <dd className="font-bold text-ink">{ui.subject}</dd>
        </dl>
        {drafted ? (
          <textarea
            aria-label={t.body}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            className="block w-full resize-y px-4 py-3 text-[14px] leading-[21px] text-ink focus:outline-none"
          />
        ) : (
          <div className="h-[316px] overflow-hidden px-4 py-3 text-[14px] leading-[21px] text-ink" aria-live="polite">
            {ui.body.slice(0, shown).map((p) => (
              <p key={p} className="ai-stream mb-[21px] whitespace-pre-line text-pretty">
                {p}
              </p>
            ))}
            <span className="inline-block h-4 w-[2px] animate-pulse bg-ink align-middle" aria-hidden />
          </div>
        )}
        {files.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-divider px-4 py-2.5">
            <Paperclip size={14} aria-hidden className="text-steel" />
            {files.map((d) => (
              <DocChip key={d.id} doc={d} onOpen={onOpenDoc} />
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

/* ── Proposed figures and conditions: confirm or edit ────────────��──────── */

function FormModal({ task, ui, docs, onOpenDoc, onCancel, onDecide }: ModalProps<Extract<TaskUi, { kind: "form" }>>) {
  const { t, lang } = useTheatreCopy();
  const shown = useStream(ui.fields.length, 650);
  const ready = shown >= ui.fields.length;
  const [vals, setVals] = React.useState<TaskInput>(() => Object.fromEntries(ui.fields.map((f) => [f.key, f.proposed])));
  const errorOf = (f: FormField) => f.kind !== "check" && f.min !== undefined && Number(vals[f.key]) < f.min;
  const invalid = ui.fields.some(errorOf);
  const changed = ui.fields.filter((f) => vals[f.key] !== f.proposed).length;
  const accept = task.options.find((o) => o.id === ui.accept);
  const reject = ui.reject ? task.options.find((o) => o.id === ui.reject) : undefined;

  return (
    <Shell
      task={task}
      onCancel={onCancel}
      footer={
        <>
          <span className="mr-auto text-[12.5px] text-mute">{changed ? t.changedCount(changed) : t.asProposed}</span>
          <CancelButton onClick={onCancel} />
          {reject && (
            <button
              type="button"
              disabled={!ready}
              onClick={() => onDecide(reject.id)}
              className="ui-pill whitespace-nowrap rounded-md border border-mark-red/50 bg-white px-4 py-2.5 text-[13.5px] text-mark-red hover:bg-mark-red/5 disabled:opacity-40"
            >
              {reject.label[lang]}
            </button>
          )}
          <PrimaryButton disabled={!ready || invalid} onClick={() => onDecide(ui.accept, { ...vals, changed })}>
            {accept?.label[lang] ?? t.confirm}
          </PrimaryButton>
        </>
      }
    >
      <AgentPrep title={ready ? t.proposed : t.proposing} lines={[ui.lead[lang]]} shown={ready ? 1 : 0} />
      <ul className="flex flex-col border-t border-divider">
        {ui.fields.slice(0, shown).map((f) => (
          <FieldRow key={f.key} field={f} value={vals[f.key]} error={errorOf(f)} onChange={(v) => setVals((s) => ({ ...s, [f.key]: v }))} docs={docs} onOpenDoc={onOpenDoc} lang={lang} t={t} />
        ))}
      </ul>
    </Shell>
  );
}

function FieldRow({
  field: f,
  value,
  error,
  onChange,
  docs,
  onOpenDoc,
  lang,
  t,
}: {
  field: FormField;
  value: string | number | boolean;
  error: boolean;
  onChange: (v: number | boolean) => void;
  docs: Record<string, SourceDoc>;
  onOpenDoc: (d: SourceDoc) => void;
  lang: Lang;
  t: Copy;
}) {
  const id = React.useId();
  const doc = f.doc ? docs[f.doc] : undefined;
  const changed = value !== f.proposed;
  const proposed = f.kind === "money" ? gbp(f.proposed) : f.kind === "number" ? `${f.proposed} ${f.suffix[lang]}` : f.proposed ? t.required : t.notRequired;

  return (
    <li className="ai-stream grid grid-cols-1 gap-3 border-b border-divider py-4 sm:grid-cols-[minmax(0,1fr)_230px]">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[14px] font-bold leading-[20px] text-ink">
          {f.label[lang]}
        </label>
        <p className="mt-1 flex items-start gap-1.5 text-pretty text-[12.5px] leading-[18px] text-mute">
          <Sparkles size={13} aria-hidden className="mt-[2px] shrink-0 text-surface-deep" />
          {f.why[lang]}
        </p>
        {doc && (
          <div className="mt-2">
            <DocChip doc={doc} onOpen={onOpenDoc} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {f.kind === "check" ? (
          <label htmlFor={id} className={cn("flex cursor-pointer items-center gap-2.5 border px-3 py-2.5 text-[13.5px] text-ink", value ? "border-ink" : "border-divider")}>
            <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-ink" />
            {value ? t.required : t.notRequired}
          </label>
        ) : (
          <div className={cn("flex items-center border bg-white focus-within:border-ink", error ? "border-mark-red" : "border-divider")}>
            {f.kind === "money" && <span className="pl-3 text-[15px] text-mute">£</span>}
            <input
              id={id}
              type="text"
              inputMode="numeric"
              aria-invalid={error}
              value={Number(value).toLocaleString("en-GB")}
              onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
              className="w-full min-w-0 bg-transparent px-3 py-2 text-right text-[17px] font-bold tabular-nums text-ink focus:outline-none"
            />
            {f.kind === "number" && <span className="whitespace-nowrap pr-3 text-[12.5px] text-mute">{f.suffix[lang]}</span>}
          </div>
        )}
        <span className={cn("text-[11.5px]", changed ? "text-mark-amber" : "text-mute")}>
          {t.agentProposed}: {proposed}
          {changed && ` · ${t.changed}`}
        </span>
        {error && f.kind !== "check" && f.minError && (
          <span role="alert" className="text-[12px] leading-[17px] text-mark-red">
            {f.minError[lang]}
          </span>
        )}
      </div>
    </li>
  );
}
