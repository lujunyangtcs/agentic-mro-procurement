/**
 * The agent-drafted outbound email — shown as a centered pop-up (not inline):
 * a brief "drafting" beat → the draft (To / Subject / body, optional attachment)
 * → the human reviews and clicks Send. `onSent` hands control back to the run
 * (the reply round-trip) instead of a built-in "sent" confirmation.
 *
 * Ported from the Verdano helpdesk EmailDraftModal and recoloured to the MRO
 * palette (the house deep green). Presentational only.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, CalendarPlus, CalendarCheck, FileText, Eye } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { retranslate, type Lang } from "@/mro/lib/retranslate";

export type EmailDraft = {
  to: string;
  subject: string;
  /** What actually goes on the wire — the supplier's own language. */
  body: string[];
  /**
   * The same message in English, and the language the wire version is in.
   * The buyer approves what they can read; the supplier receives what they
   * can read. Both are shown before anything sends.
   */
  review?: { subject: string; body: string[]; sendingIn: string };
  /** Optional attachment rendered under the body (e.g. a renewed contract). */
  attachment?: React.ReactNode;
  attachmentLabel?: string;
};

const DOW = ["S", "M", "T", "W", "T", "F", "S"];
const JUNE_CELLS: (number | null)[] = [null, ...Array.from({ length: 30 }, (_, i) => i + 1)];
const TODAY = 23;

function CalendarPopover({ onPick, onClose }: { onPick: (d: number) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-full right-6 z-10 mb-2 w-[266px] rounded-xl border border-divider bg-white p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-bold text-ink">June 2026</span>
        <button type="button" onClick={onClose} aria-label="Close" className="ui-pill flex h-6 w-6 items-center justify-center rounded-full text-mute hover:bg-surface-fog hover:text-ink"><X size={13} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-mute">{DOW.map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {JUNE_CELLS.map((d, i) => d === null ? <span key={i} /> : (
          <button key={i} type="button" disabled={d < TODAY} onClick={() => onPick(d)} className={cn("flex h-7 items-center justify-center rounded-md text-[12px]", d < TODAY ? "cursor-default text-divider" : "text-ink hover:bg-surface-mint", d === TODAY && "font-bold text-surface-deep ring-1 ring-surface-deep/40")}>{d}</button>
        ))}
      </div>
      <p className="mt-2 text-[10.5px] text-mute">Pick a day to schedule a follow-up reminder.</p>
    </div>
  );
}

export function EmailDraftModal({ draft, onClose, onSent }: { draft: EmailDraft; onClose: () => void; onSent: () => void }) {
  const [phase, setPhase] = React.useState<"drafting" | "ready">("drafting");
  const [showCal, setShowCal] = React.useState(false);
  const [scheduled, setScheduled] = React.useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const fileName = `${(draft.attachmentLabel ?? "attachment").replace(/\s·\s/g, "_").replace(/\s+/g, "-")}.pdf`;

  React.useEffect(() => {
    const t = window.setTimeout(() => setPhase("ready"), 1100);
    return () => window.clearTimeout(t);
  }, []);

  /* The English is the thing you edit; the message above re-renders from it. */
  const [english, setEnglish] = React.useState(() => (draft.review?.body ?? draft.body).join("\n\n"));
  const [working, setWorking] = React.useState(false);
  const lang: Lang = "de";
  const outgoing = React.useMemo(() => {
    if (!draft.review) return draft.body.map((t) => ({ text: t, known: true }));
    return retranslate(english.split(/\n+/).filter(Boolean), lang);
  }, [english, lang, draft.review, draft.body]);
  const edit = (v: string) => {
    setEnglish(v);
    setWorking(true);
    window.setTimeout(() => setWorking(false), 900);
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-black/30" onClick={onClose} aria-hidden />
      <div className="ai-spring fixed left-1/2 top-1/2 z-[70] flex max-h-[88vh] w-full max-w-[540px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-divider bg-white shadow-2xl">
        <header className="flex items-center gap-3 border-b border-divider px-6 py-4 shrink-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-deep text-white"><Sparkles size={17} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-mute">Assistant · email draft</p>
            <h2 className="text-[16px] font-bold text-ink">{phase === "drafting" ? "Drafting…" : "Draft ready"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="ui-pill flex h-8 w-8 items-center justify-center rounded-full text-mute hover:bg-surface-fog hover:text-ink"><X size={17} /></button>
        </header>

        <div className="overflow-y-auto p-6">
          {phase === "drafting" ? (
            <div className="flex items-center gap-3 py-12 text-[14px] text-mute">
              <span className="ai-pulse h-3 w-3 rounded-full bg-surface-deep" /> Drafting an email to {draft.to}…
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-divider">
                <div className="space-y-1.5 border-b border-divider bg-surface-fog px-4 py-3 text-[13px]">
                  <div className="flex gap-3"><span className="w-16 shrink-0 text-mute">To</span><span className="font-bold text-ink">{draft.to}</span></div>
                  <div className="flex gap-3"><span className="w-16 shrink-0 text-mute">Subject</span><span className="font-bold text-ink">{draft.subject}</span></div>
                </div>
                <div className="space-y-2 px-4 py-4 text-[13.5px] leading-relaxed text-ink">
                  {outgoing.map((l, i) => (
                    <p
                      key={i}
                      className={cn("ai-stream", !l.known && "rounded bg-surface-rose/40 px-1.5 py-1")}
                      style={{ animationDelay: `${i * 90}ms` }}
                    >
                      {l.text || " "}
                      {!l.known && (
                        <span className="ml-1.5 whitespace-nowrap text-[10px] font-bold uppercase text-mark-red">
                          not translated
                        </span>
                      )}
                    </p>
                  ))}
                </div>
                {draft.review && (
                  /* What you are approving, in English. The supplier never sees
                     this panel — it is here so nobody signs off on a language
                     they don't read. */
                  <div className="border-t border-divider bg-surface-mint/25 px-4 py-3">
                    <p className="flex items-center gap-1.5 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-surface-deep">
                      <Sparkles size={12} /> In English, for you to check
                    </p>
                    <p className="pb-1 text-[12.5px] font-bold text-ink">{draft.review.subject}</p>
                    <textarea
                      value={english}
                      onChange={(e) => edit(e.target.value)}
                      rows={4}
                      className="w-full resize-y rounded border border-transparent bg-transparent text-[12.5px] leading-relaxed text-ink outline-none focus:border-surface-deep/40 focus:bg-white"
                    />
                    <p className="pt-2 text-[11.5px] text-ink">
                      {working
                        ? "Re-translating…"
                        : `Sending in ${draft.review.sendingIn} — the version above. Edit this to change it.`}
                    </p>
                  </div>
                )}
              </div>
              {draft.attachment && (
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="flex w-full items-center gap-3 rounded-xl border border-divider bg-surface-fog px-3.5 py-3 text-left hover:border-surface-deep"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#a1232b]/10 text-[#a1232b]"><FileText size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-ink truncate">{fileName}</span>
                    <span className="block text-[11px] text-mute">PDF · click to preview</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-surface-deep shrink-0"><Eye size={14} /> Preview</span>
                </button>
              )}
            </div>
          )}
        </div>

        {phase === "ready" && (
          <footer className="relative border-t border-divider px-6 py-4 shrink-0">
            {showCal && <CalendarPopover onPick={(d) => { setScheduled(d); setShowCal(false); }} onClose={() => setShowCal(false)} />}
            {scheduled !== null && (
              <p className="mb-3 flex items-center justify-center gap-1.5 text-[12.5px] font-bold text-surface-deep"><CalendarCheck size={14} /> Follow-up reminder set for Jun {scheduled}, 2026 · logged</p>
            )}
            <div className="flex items-stretch gap-3">
              <button type="button" onClick={onSent} className="ui-pill flex flex-1 items-center justify-center bg-surface-deep px-4 py-2.5 text-[13.5px] font-bold text-white hover:brightness-110">Send</button>
              <button type="button" onClick={onClose} className="ui-pill flex flex-1 items-center justify-center border border-divider px-4 py-2.5 text-[13.5px] font-bold text-ink hover:border-surface-deep">Discard</button>
              <button type="button" onClick={() => setShowCal((v) => !v)} className={cn("ui-pill flex flex-1 items-center justify-center gap-1.5 border px-4 py-2.5 text-[13.5px] font-bold", showCal ? "border-surface-deep bg-surface-mint text-surface-deep" : "border-divider text-ink hover:border-surface-deep")}><CalendarPlus size={15} /> Follow-up</button>
            </div>
          </footer>
        )}
      </div>

      {previewOpen && draft.attachment && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 py-6" onClick={() => setPreviewOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="ai-spring flex max-h-[90vh] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center gap-2 border-b border-divider px-5 py-3 shrink-0">
              <FileText size={15} className="text-[#a1232b]" />
              <span className="truncate text-[13px] font-bold text-ink">{fileName}</span>
              <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Close preview" className="ui-pill ml-auto flex h-7 w-7 items-center justify-center rounded-full text-mute hover:bg-surface-fog hover:text-ink"><X size={16} /></button>
            </header>
            <div className="overflow-y-auto p-4">{draft.attachment}</div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
