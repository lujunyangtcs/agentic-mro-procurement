import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Render-trigger key — when this changes from undefined → defined, toast shows. */
  show: boolean;
  title: string;
  body?: string;
  /** Optional secondary action. */
  cta?: { label: string; onClick: () => void };
  durationMs?: number;
  onDismiss?: () => void;
};

/**
 * Corner toast — slides in top-right with a checkmark, body line, and an
 * optional secondary CTA. Auto-dismisses after `durationMs` (default 4 s).
 */
export function Toast({ show, title, body, cta, durationMs = 4000, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const tIn = window.setTimeout(() => setOpacity(1), 30);
    const tOut = window.setTimeout(() => setOpacity(0), durationMs - 250);
    const tHide = window.setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, durationMs);
    return () => {
      window.clearTimeout(tIn);
      window.clearTimeout(tOut);
      window.clearTimeout(tHide);
    };
  }, [show, durationMs, onDismiss]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed top-6 right-6 z-40 bg-white border border-divider shadow-lg rounded-md px-4 py-3.5 min-w-[280px] max-w-[360px]",
        "transition-all duration-[250ms] ease-out",
      )}
      style={{ opacity, transform: `translateY(${opacity ? 0 : -8}px)` }}
    >
      <div className="flex items-start gap-3">
        <span className="w-5 h-5 rounded-full bg-surface-deep text-ink-inverse flex items-center justify-center text-[11px] shrink-0">
          ✓
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-ink leading-tight">{title}</div>
          {body && <div className="text-[12px] text-mute mt-0.5">{body}</div>}
          {cta && (
            <button
              type="button"
              onClick={cta.onClick}
              className="ui-pill mt-2 text-[13px] font-medium text-surface-deep hover:underline"
            >
              {cta.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
