/**
 * Opens a source document exactly as it exists in the system of record, with
 * the place the exception hangs on marked in yellow and the agent's one-line
 * reason floating beside it.
 *
 * The document is the same component instance the rest of the demo renders —
 * nothing is redrawn for the preview, so it is 1:1 by construction. The bubble
 * finds the mark (`[data-ai-anchor]`) after mount and pins itself alongside;
 * documents with no mark get the bubble at the top instead.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { X, Bot } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import type { ExceptionSource } from "@/mro/data/exceptionSources";

export function SourcePreviewModal({
  source,
  onClose,
}: {
  source: ExceptionSource;
  onClose: () => void;
}) {
  const body = React.useRef<HTMLDivElement>(null);
  const [bubbleTop, setBubbleTop] = React.useState<number | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* Find the yellow mark once the document has painted, scroll it into view,
     and pin the bubble beside it. A doc without a mark gets the bubble up top. */
  React.useEffect(() => {
    const el = body.current;
    if (!el) return;
    const timer = setTimeout(() => {
      const anchor = el.querySelector<HTMLElement>("[data-ai-anchor]");
      if (!anchor) {
        setBubbleTop(16);
        return;
      }
      const wrap = el.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      setBubbleTop(Math.max(12, a.top - wrap.top + el.scrollTop - 10));
      anchor.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 350);
    return () => clearTimeout(timer);
  }, [source.id]);

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/45 px-6 py-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <SpringIn className="w-full max-w-[880px]">
        <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
          <header className="flex items-center justify-between gap-4 border-b border-divider px-5 py-3.5">
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-ink">{source.label}</div>
              <p className="truncate text-[13px] text-mute mt-0.5">{source.meta}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ui-pill shrink-0 rounded-md p-2 text-mute hover:bg-surface-fog hover:text-ink"
            >
              <X size={16} />
            </button>
          </header>

          {/* The document, with the bubble floating over it. */}
          <div ref={body} className="relative max-h-[74vh] overflow-y-auto bg-surface-fog p-5">
            <div className="pr-[236px]">{source.body}</div>

            {bubbleTop !== null && (
              <div
                className={cn(
                  "absolute right-4 z-10 w-[216px] rounded-lg border border-surface-deep/25",
                  "bg-surface-mint shadow-lg shadow-surface-deep/10",
                )}
                style={{ top: bubbleTop }}
              >
                {/* Pointer toward the document */}
                <span className="absolute -left-[7px] top-4 h-3.5 w-3.5 rotate-45 border-b border-l border-surface-deep/25 bg-surface-mint" />
                <div className="flex items-center gap-2 px-3 pt-2.5">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-deep">
                    <Bot size={13} className="text-ink-inverse" />
                  </span>
                  <span className="text-[12px] font-bold uppercase tracking-[0.05em] text-surface-deep">
                    Why it stopped
                  </span>
                </div>
                <p className="px-3 pb-3 pt-1.5 text-[13px] leading-[18px] text-ink">
                  <StreamingText text={source.note} cps={120} caret={false} />
                </p>
              </div>
            )}
          </div>
        </div>
      </SpringIn>
    </div>,
    document.body,
  );
}
