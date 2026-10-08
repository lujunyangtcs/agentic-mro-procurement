/**
 * The three moments that interrupt the page during guided playback: the
 * request arriving, an agent reasoning over its sources (confidence or
 * guardrails), and the baton passing to the next agent.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { Inbox, ArrowRight, Bot, Check, FileText, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { StepProgress } from "@/mro/components/ai/StepProgress";
import { Spinner } from "@/mro/components/ai/Spinner";
import { AIDot } from "@/mro/components/ai/AIDot";
import { useTheatreCopy } from "@/mro/components/story/theatre/copy";
import type { RequestCard } from "@/mro/data/stories/runModel";
import type { SourceDoc } from "@/mro/components/story/theatre/pdf";

const gbp = (n: number) => `£${n.toLocaleString("en-GB")}`;
const when = (iso: string, lang: string) =>
  new Date(iso).toLocaleString(lang === "de" ? "de-DE" : "en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });

function useEscape(fn: (() => void) | undefined) {
  React.useEffect(() => {
    if (!fn) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && fn();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fn]);
}

/* ── The request arrives ────────────────────────────────────────────────── */

export function ArrivalModal({
  title,
  request,
  caseId,
  firstAgent,
  fileName,
  onOpenForm,
  onStart,
  onLater,
}: {
  title: string;
  request: RequestCard;
  caseId: string;
  firstAgent: string;
  fileName?: string;
  onOpenForm: () => void;
  onStart: () => void;
  onLater: () => void;
}) {
  const { t, lang } = useTheatreCopy();
  const startRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();
  React.useEffect(() => startRef.current?.focus(), []);
  const r = request.requester;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex overflow-y-auto bg-ink/50 px-4 py-6 backdrop-blur-[2px]">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="ai-spring m-auto w-full max-w-[540px] overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center gap-4 bg-accent-navy px-6 py-5 text-ink-inverse">
          <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink-inverse/10">
            <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-ink-inverse/15" />
            <Inbox size={22} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sand">
              {t.newRequest} · {request.channel}
            </p>
            <h2 id={titleId} className="mt-1 text-balance text-[20px] font-bold leading-[26px]">
              {title}
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="flex items-center justify-between gap-3 text-[12.5px] text-mute">
            <span className="font-bold text-ink">{request.requestId}</span>
            <span>{caseId}</span>
          </div>
          <p className="text-pretty text-[16px] font-medium leading-[23px] text-ink">{request.headline}</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
            {r && (
              <div className="col-span-2 flex flex-col gap-0.5">
                <dt className="text-[12px] text-mute">{t.requester}</dt>
                <dd className="text-ink">{[r.name, r.role, r.function, r.site, r.costCentre].filter(Boolean).join(" · ")}</dd>
              </div>
            )}
            <div className="col-span-2 flex flex-col gap-0.5">
              <dt className="text-[12px] text-mute">{t.item}</dt>
              <dd className="text-ink">{request.detail}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-[12px] text-mute">{t.startingCost}</dt>
              <dd className="text-[18px] font-bold tabular-nums text-ink">{gbp(request.startingCostGBP)}</dd>
            </div>
            {request.needBy && (
              <div className="flex flex-col gap-0.5">
                <dt className="text-[12px] text-mute">{t.needBy}</dt>
                <dd className="text-ink">{when(`${request.needBy}T12:00:00Z`, lang).slice(0, 11)}</dd>
              </div>
            )}
            <div className="col-span-2 flex flex-col gap-0.5">
              <dt className="text-[12px] text-mute">{t.received}</dt>
              <dd className="text-ink">{when(request.receivedAt, lang)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={onOpenForm}
            className="ui-pill group flex items-center gap-3 rounded-md border border-divider px-3.5 py-2.5 text-left hover:bg-surface-fog"
          >
            <span className="grid h-9 w-8 shrink-0 place-items-center rounded-sm border border-divider bg-white text-[9px] font-bold text-mark-red">PDF</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-ink">{t.openForm}</span>
              <span className="block truncate text-[12px] text-mute">{fileName ?? `${request.requestId}_purchase-request.pdf`}</span>
            </span>
            <ArrowRight size={15} aria-hidden className="text-mute transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-divider bg-surface-fog/60 px-6 py-4">
          <button type="button" onClick={onLater} className="ui-pill whitespace-nowrap rounded-md px-4 py-2.5 text-[13.5px] text-ink hover:bg-surface-fog">
            {t.notNow}
          </button>
          <button
            ref={startRef}
            type="button"
            onClick={onStart}
            className="ui-pill group inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-ink px-5 py-2.5 text-[13.5px] font-bold text-ink-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-px"
          >
            <Bot size={16} aria-hidden /> {t.start(firstAgent)}
            <ArrowRight size={15} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── An agent reasoning over its sources ────────────────────────────────── */

export type AnalysisItem = { key: string; label: string; detail: string; value: string; doc?: SourceDoc; ok: boolean };

export function AiAnalysisModal({
  caseId,
  title,
  docLabel,
  agent,
  model,
  items,
  result,
  onDone,
}: {
  caseId: string;
  title: string;
  docLabel: string;
  agent: string;
  model?: string;
  items: AnalysisItem[];
  result: string;
  onDone: () => void;
}) {
  const { t } = useTheatreCopy();
  const duration = 900 + items.length * 650;
  const [read, setRead] = React.useState(0);
  const [complete, setComplete] = React.useState(false);
  const titleId = React.useId();
  const onDoneRef = React.useRef(onDone);
  React.useEffect(() => {
    onDoneRef.current = onDone;
  });

  React.useEffect(() => {
    const step = duration / (items.length + 1);
    const iv = window.setInterval(() => setRead((n) => Math.min(items.length, n + 1)), step);
    return () => window.clearInterval(iv);
  }, [duration, items.length]);

  React.useEffect(() => {
    if (!complete) return;
    const tm = window.setTimeout(() => onDoneRef.current(), 1300);
    return () => window.clearTimeout(tm);
  }, [complete]);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex overflow-y-auto bg-ink/45 px-4 py-6">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="ai-spring m-auto w-full max-w-[680px] overflow-hidden rounded-lg bg-white shadow-2xl">
        <header className="flex items-center gap-2.5 border-b border-divider px-5 py-3.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent-navy ai-pulse" aria-hidden />
          <span className="text-[15px] font-bold text-ink">{caseId}</span>
          <span id={titleId} className="min-w-0 truncate text-[13px] text-mute">
            {title}
          </span>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-[12px] text-mute">
            <Sparkles size={13} aria-hidden className="text-surface-deep" />
            {model ?? agent}
          </span>
        </header>
        <div className="flex flex-col gap-4 px-5 py-5">
          <StepProgress agentName={agent} docLabel={docLabel} durationMs={duration} onDone={() => setComplete(true)} />
          <ul className="flex flex-col divide-y divide-divider" aria-live="polite">
            {items.map((it, i) => {
              const done = i < read;
              return (
                <li key={it.key} className="flex items-start gap-3 py-2.5">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center">
                    {done ? <Check size={15} strokeWidth={2.6} className="text-surface-deep" aria-hidden /> : i === read ? <Spinner size={13} /> : <span className="h-1.5 w-1.5 rounded-full bg-divider" aria-hidden />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={cn("text-[13.5px] font-medium", done || i === read ? "text-ink" : "text-mute")}>{it.label}</span>
                      {it.doc && (
                        <span className="inline-flex items-center gap-1 rounded bg-surface-fog px-1.5 py-0.5 text-[11.5px] text-mute">
                          <FileText size={11} aria-hidden /> {it.doc.id}
                        </span>
                      )}
                    </div>
                    {done && <p className="ai-stream mt-0.5 text-pretty text-[12.5px] leading-[18px] text-mute">{it.detail}</p>}
                  </div>
                  {done && (
                    <span className={cn("ai-stream shrink-0 text-[13px] font-bold tabular-nums", it.ok ? "text-ink" : "text-mark-amber")}>{it.value}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {complete && (
            <div className="ai-spring flex items-center gap-3 rounded-md bg-surface-mint/70 px-4 py-3">
              <span className="case-complete-pop grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-deep text-ink-inverse">
                <Check size={15} strokeWidth={3} aria-hidden />
              </span>
              <p className="text-[14px] font-bold text-ink">{result}</p>
              <span className="ml-auto text-[12px] text-mute">{t.done}</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── The baton passes ───────────────────────────────────────────────────── */

const HANDOVER_MS = 3200;

export function HandoverOverlay({ from, to, final, payload, onDone }: { from: string; to: string; final?: boolean; payload: string[]; onDone: () => void }) {
  const { t } = useTheatreCopy();
  const onDoneRef = React.useRef(onDone);
  React.useEffect(() => {
    onDoneRef.current = onDone;
  });
  useEscape(undefined);

  React.useEffect(() => {
    const tm = window.setTimeout(() => onDoneRef.current(), HANDOVER_MS);
    return () => window.clearTimeout(tm);
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/55 px-4 backdrop-blur-[3px]" role="status" aria-live="assertive">
      <div className="ai-spring relative w-full max-w-[680px] overflow-hidden bg-accent-navy px-7 pb-7 pt-6 text-ink-inverse shadow-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sand">{final ? t.closing : t.handover}</p>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex w-[150px] shrink-0 flex-col items-center gap-2 text-center">
            <span className="relative grid h-14 w-14 place-items-center border border-sand/60 text-sand">
              <Bot size={24} aria-hidden />
              <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-sand text-accent-navy">
                <Check size={12} strokeWidth={3} aria-hidden />
              </span>
            </span>
            <span className="text-[13px] font-medium leading-[17px]">{from}</span>
            <span className="text-[11px] uppercase tracking-[0.1em] text-ink-inverse/60">{t.done}</span>
          </div>

          <div className="relative h-10 min-w-0 flex-1" aria-hidden>
            <svg className="absolute inset-x-0 top-1/2 h-[2px] w-full -translate-y-1/2 overflow-visible text-sand" preserveAspectRatio="none">
              <line x1="0" y1="1" x2="100%" y2="1" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
              <line x1="0" y1="1" x2="100%" y2="1" stroke="currentColor" strokeWidth="2" className="hr-flow" />
            </svg>
            <span className="theatre-packet absolute top-1/2 grid h-9 w-8 place-items-center border border-sand/70 bg-accent-navy text-sand">
              <FileText size={15} />
            </span>
          </div>

          <div className="flex w-[150px] shrink-0 flex-col items-center gap-2 text-center">
            <span className="relative grid h-14 w-14 place-items-center bg-sand text-accent-navy">
              {final ? <ShieldCheck size={24} aria-hidden /> : <Bot size={24} aria-hidden />}
              <span className="absolute -right-1.5 -top-1.5">
                <AIDot size={9} tone="deep" pulse />
              </span>
            </span>
            <span className="text-[13px] font-bold leading-[17px]">{to}</span>
            <span className="text-[11px] uppercase tracking-[0.1em] text-sand">{t.wakingUp}</span>
          </div>
        </div>

        <div className="mt-6 border-t border-ink-inverse/15 pt-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-ink-inverse/60">{t.passing}</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {payload.map((p, i) => (
              <li key={p} className="ai-stream flex items-center gap-2.5 text-[13.5px] leading-[19px]" style={{ animationDelay: `${300 + i * 380}ms` }}>
                <Check size={14} strokeWidth={2.6} className="shrink-0 text-sand" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <span aria-hidden className="theatre-grow absolute inset-x-0 bottom-0 block h-[3px] bg-sand" style={{ animationDuration: `${HANDOVER_MS}ms`, animationTimingFunction: "linear" }} />
      </div>
    </div>,
    document.body,
  );
}
