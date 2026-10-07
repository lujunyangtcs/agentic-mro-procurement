/**
 * The assistant, as a thing that sits over the workspace rather than a panel
 * bolted into one page. A button in the bottom-right corner opens a drawer;
 * the drawer answers against whatever the page currently has in view, so the
 * reply always matches the charts the reader is looking at.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { Bot, X, Send } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { TypingDots } from "@/mro/components/ai/TypingDots";
import { AIDot } from "@/mro/components/ai/AIDot";

export type Suggestion = { id: string; ask: string; answer: () => string };

type Turn = { who: "user" | "bot"; text: string; fresh?: boolean };

export function AskAssistant({
  title,
  subtitle,
  suggestions,
  /** Changes whenever the page's filters change, so stale answers are cleared. */
  contextKey,
}: {
  title: string;
  subtitle: string;
  suggestions: Suggestion[];
  contextKey: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [thinking, setThinking] = React.useState(false);
  const feed = React.useRef<HTMLDivElement>(null);

  /* A new filter means the old answers describe a view that no longer exists. */
  React.useEffect(() => {
    setTurns([]);
    setThinking(false);
  }, [contextKey]);

  React.useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: "smooth" });
  }, [turns.length, thinking]);

  React.useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  const ask = (s: Suggestion) => {
    setTurns((t) => [...t, { who: "user", text: s.ask }]);
    setThinking(true);
    window.setTimeout(() => {
      setTurns((t) => [...t, { who: "bot", text: s.answer(), fresh: true }]);
      setThinking(false);
    }, 1100);
  };

  const unasked = suggestions.filter((s) => !turns.some((t) => t.text === s.ask));

  return createPortal(
    <>
      {/* The button is always there; the drawer is not. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close the assistant" : "Ask the assistant"}
        className={cn(
          "ui-pill fixed bottom-6 right-6 z-[60] grid h-14 w-14 place-items-center rounded-full",
          "bg-surface-deep text-ink-inverse shadow-lg shadow-surface-deep/25 hover:bg-accent-green",
        )}
      >
        {open ? <X size={22} /> : <Bot size={24} />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-surface-mint ring-2 ring-white" />
        )}
      </button>

      {open && (
        <aside className="fixed bottom-24 right-6 z-[60] flex max-h-[70vh] w-[400px] flex-col overflow-hidden rounded-lg border border-divider bg-white shadow-2xl">
          <header className="flex items-center gap-3 border-b border-divider px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-mint">
              <Bot size={17} className="text-surface-deep" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <AIDot size={7} tone="deep" pulse />
                <span className="text-[14px] font-bold text-ink">{title}</span>
              </div>
              <p className="truncate text-[12px] text-mute">{subtitle}</p>
            </div>
          </header>

          <div ref={feed} className="flex-1 space-y-3 overflow-y-auto bg-surface-fog/60 p-4">
            {turns.length === 0 && !thinking && (
              <p className="py-6 text-center text-[13px] text-mute">
                Ask about what is on screen. Answers are worked out from the same figures.
              </p>
            )}
            {turns.map((t, i) =>
              t.who === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-surface-deep px-3.5 py-2.5">
                    <p className="text-[13px] leading-[19px] text-ink-inverse">{t.text}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[92%] rounded-2xl rounded-tl-sm border border-divider bg-white px-3.5 py-2.5">
                    <p className="text-[13px] leading-[19px] text-ink">
                      {t.fresh ? (
                        <StreamingText text={t.text} cps={190} caret={false} />
                      ) : (
                        t.text
                      )}
                    </p>
                  </div>
                </div>
              ),
            )}
            {thinking && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm border border-divider bg-white px-3.5 py-3">
                  <TypingDots />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-divider p-3">
            {unasked.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {unasked.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={thinking}
                    onClick={() => ask(s)}
                    className={cn(
                      "ui-pill inline-flex items-center gap-1.5 border px-3 py-1.5 text-left text-[12.5px] transition-colors",
                      thinking
                        ? "cursor-not-allowed border-divider text-mute"
                        : "border-divider bg-white text-ink hover:border-surface-deep/40 hover:bg-surface-mint/40",
                    )}
                  >
                    {s.ask}
                    <Send size={11} className="shrink-0 text-mute" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-1 py-1 text-[12.5px] text-mute">
                That is everything for this view — change a filter to ask again.
              </p>
            )}
          </div>
        </aside>
      )}
    </>,
    document.body,
  );
}
