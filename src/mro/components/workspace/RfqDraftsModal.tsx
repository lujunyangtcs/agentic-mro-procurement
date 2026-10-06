/**
 * The four requests, written in front of you.
 *
 * When the agent has finished searching it does not just list the suppliers —
 * it writes to all of them at once, and this is that moment: the screen dims,
 * the four emails lay out side by side, and each one drafts itself in turn.
 *
 * Each card is a real email, not a summary: who it is going to, the subject,
 * the body, and the attached request for quotation — written in the language
 * that supplier actually reads, because that is the message that leaves the
 * building. The English underneath is the agent's translation, there so the
 * buyer can check what they are approving.
 *
 * Each request sends on its own. Four suppliers is four decisions — you might
 * hold one back, or send the local three and think about the overseas one — so
 * the button lives on the card, not under all of them.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { Mail, Paperclip, Sparkles, X, Send, Check } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { Spinner } from "@/mro/components/ai/Spinner";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import type { RfqVendor } from "@/mro/data/runSteps";
import { retranslate, fullyKnown, type Lang, type Piece } from "@/mro/lib/retranslate";

/** Each draft lands a beat after the one before it. */
const STAGGER = 700;
const WRITE_MS = 1100;

/** The outgoing message, re-rendered from whatever the English now says. */
function Body({
  vendor,
  english,
  working,
}: {
  vendor: RfqVendor;
  english?: string;
  working: boolean;
}) {
  const raw = vendor.local?.lang ?? "";
  const lang: Lang = raw.includes("中文")
    ? "zh"
    : /espa/i.test(raw)
      ? "es"
      : /fran/i.test(raw)
        ? "fr"
        : "de";
  const pieces: Piece[] | null = React.useMemo(() => {
    if (english === undefined) return null;
    return retranslate(english.split(/\n+/).filter(Boolean), lang);
  }, [english, lang]);

  if (working) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-6 text-[12px] text-mute">
        <Spinner size={12} className="shrink-0" /> Re-translating…
      </div>
    );
  }

  const lines = pieces ?? (vendor.local?.lines ?? vendor.draft.lines).map((t) => ({ text: t, known: true }));

  return (
    <div className="space-y-2 px-3.5 py-3">
      {lines.map((p, li) => (
        <p
          key={li}
          className={cn(
            "text-[12px] leading-[17px]",
            p.known ? "text-ink" : "rounded bg-surface-rose/40 px-1.5 py-1 text-ink",
          )}
        >
          {pieces ? p.text : <StreamingText text={p.text} cps={200} startDelay={200 + li * 260} caret={false} />}
          {!p.known && (
            <span className="ml-1.5 whitespace-nowrap text-[10px] font-bold uppercase text-mark-red">
              not translated
            </span>
          )}
        </p>
      ))}
      {pieces && !fullyKnown(pieces) && (
        <p className="text-[10.5px] leading-snug text-mark-red">
          Some of what you wrote is outside the phrases this desk knows — it is left in English
          rather than guessed at.
        </p>
      )}
    </div>
  );
}

export function RfqDraftsModal({
  vendors,
  rfqLabel,
  onSend,
  onClose,
  onOpenPdf,
}: {
  vendors: RfqVendor[];
  rfqLabel: string;
  onSend: () => void;
  onClose: () => void;
  onOpenPdf?: (v: RfqVendor) => void;
}) {
  /* How many have finished writing. Each button waits for its own draft. */
  const [written, setWritten] = React.useState(0);
  /* Sent one at a time — the run moves on once they have all gone. */
  const [sent, setSent] = React.useState<Set<string>>(new Set());
  /* Edits to the English, keyed by vendor. Absent means "as drafted". */
  const [edited, setEdited] = React.useState<Record<string, string>>({});
  /* Which card is mid re-translation — the beat you watch. */
  const [working, setWorking] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const timers = vendors.map((_, i) =>
      window.setTimeout(() => setWritten((n) => Math.max(n, i + 1)), WRITE_MS + i * STAGGER),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [vendors]);

  const allWritten = written >= vendors.length;
  const allSent = sent.size >= vendors.length;

  React.useEffect(() => {
    if (allSent) onSend();
  }, [allSent, onSend]);

  /* Editing the English re-renders the message the supplier gets. */
  const onEdit = React.useCallback((id: string, text: string) => {
    setEdited((prev) => ({ ...prev, [id]: text }));
    setWorking((prev) => new Set(prev).add(id));
    window.setTimeout(
      () =>
        setWorking((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        }),
      900,
    );
  }, []);

  React.useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-5">
      <div className="ai-spring flex max-h-[90vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center gap-3 border-b border-divider px-6 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-deep text-ink-inverse">
            <Sparkles size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-mute">
              Assistant · request for quotation
            </p>
            <h2 className="text-[16px] font-bold text-ink">
              {!allWritten
                ? `Writing ${vendors.length} requests…`
                : sent.size === 0
                  ? `${vendors.length} requests ready to send`
                  : `${sent.size} of ${vendors.length} sent`}
            </h2>
          </div>
          <span className="hidden shrink-0 text-[12px] text-mute sm:block">
            Written in each supplier's language · translated back for you
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ui-pill grid h-8 w-8 shrink-0 place-items-center rounded-full text-mute hover:bg-surface-fog hover:text-ink"
          >
            <X size={17} />
          </button>
        </header>

        {/* Four emails, across the screen. */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-surface-fog/50 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {vendors.map((v, i) => {
              const done = written > i;
              return (
                <article
                  key={v.id}
                  className={cn(
                    "flex min-w-0 flex-col overflow-hidden rounded-xl border bg-white transition-colors",
                    done ? "border-divider" : "border-dashed border-divider",
                  )}
                >
                  <div className="flex items-center gap-2 border-b border-divider bg-surface-fog/70 px-3.5 py-2.5">
                    <Mail size={13} className="shrink-0 text-surface-deep" />
                    <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-ink">
                      {v.name}
                    </span>
                    <span className="shrink-0 text-[10.5px] text-mute">{v.country ?? v.via}</span>
                  </div>

                  {!done ? (
                    <div className="flex flex-1 items-center gap-2 px-3.5 py-8 text-[12px] text-mute">
                      <Spinner size={12} className="shrink-0" /> Drafting…
                    </div>
                  ) : (
                    <div className="flex flex-1 flex-col">
                      <div className="space-y-1 border-b border-divider px-3.5 py-2.5 text-[11.5px]">
                        <div className="flex gap-2">
                          <span className="w-12 shrink-0 text-mute">To</span>
                          <span className="min-w-0 truncate text-ink">{v.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="w-12 shrink-0 text-mute">Subject</span>
                          <span className="min-w-0 font-medium text-ink">
                            <StreamingText
                              text={v.local?.subject ?? v.draft.subject}
                              cps={150}
                              caret={false}
                            />
                          </span>
                        </div>
                      </div>

                      {/* The message itself, in the language it sends in. When
                          the English below is edited this is what re-renders. */}
                      <Body vendor={v} english={edited[v.id]} working={working.has(v.id)} />

                      {v.local && (
                        /* The agent's translation — and the one thing you edit.
                           You are changing the request, not the translation. */
                        <div className="mx-3.5 mb-3 rounded-md border border-surface-mint bg-surface-mint/30 px-3 py-2.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.05em] text-surface-deep">
                            <Sparkles size={10} /> Translated for you · edit to change the email
                          </div>
                          <div className="mt-1 text-[11.5px] font-medium leading-snug text-ink">
                            {v.draft.subject}
                          </div>
                          <textarea
                            value={edited[v.id] ?? v.draft.lines.join("\n\n")}
                            onChange={(e) => onEdit(v.id, e.target.value)}
                            rows={4}
                            className="mt-1 w-full resize-y rounded border border-transparent bg-transparent text-[11px] leading-[16px] text-ink/85 outline-none focus:border-surface-deep/40 focus:bg-white"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenPdf?.(v)}
                        disabled={!onOpenPdf}
                        className={cn(
                          "mt-auto flex items-center gap-2.5 border-t border-divider px-3.5 py-2.5 text-left",
                          onOpenPdf ? "hover:bg-surface-fog" : "cursor-default",
                        )}
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-mark-red/10 text-mark-red">
                          <Paperclip size={13} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11.5px] font-medium text-ink">
                            {rfqLabel}.pdf
                          </span>
                          <span className="block text-[10.5px] text-mute">
                            {onOpenPdf ? "PDF · click to preview" : "PDF attached"}
                          </span>
                        </span>
                      </button>

                      {/* This one request, sent on its own. */}
                      <div className="border-t border-divider p-2.5">
                        {sent.has(v.id) ? (
                          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-surface-mint/50 py-2 text-[12px] font-bold text-surface-deep">
                            <Check size={14} strokeWidth={2.5} /> Sent
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSent((prev) => new Set(prev).add(v.id))}
                            className="ui-pill flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface-deep py-2 text-[12px] font-bold text-ink-inverse hover:brightness-110"
                          >
                            <Send size={13} /> Send this request
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <footer className="flex items-center gap-4 border-t border-divider px-6 py-4">
          <p className="min-w-0 flex-1 text-[12.5px] leading-[17px] text-ink">
            {sent.size === 0
              ? "Nothing has been sent. Each request goes on its own — send them when you are happy with them."
              : `${sent.size} sent, ${vendors.length - sent.size} still to go. The run moves on once they have all gone.`}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="ui-pill shrink-0 rounded-full border border-divider px-4 py-2.5 text-[13px] font-bold text-ink hover:border-surface-deep"
          >
            Close
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
