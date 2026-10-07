/**
 * Shared UI contracts (UI01–UI04): one-line labels, equal-height card rows,
 * buttons that show press → working → result and refuse a second submit.
 * `data-one-line` and `data-equal-row` are what `window.__uiAudit()` checks.
 */

import * as React from "react";
import { Check, AlertTriangle } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { Spinner } from "@/mro/components/ai/Spinner";

export function OneLineText({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <span data-one-line="" title={title} className={cn("block min-w-0 truncate whitespace-nowrap", className)}>
      {children}
    </span>
  );
}

export function EqualHeightCardRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div data-equal-row="" className={cn("grid items-stretch gap-3 [&>*]:h-full", className)}>
      {children}
    </div>
  );
}

type Tone = "deep" | "ghost" | "danger";

const toneClass: Record<Tone, string> = {
  deep: "bg-surface-deep text-ink-inverse hover:brightness-110",
  ghost: "border border-divider bg-white text-ink hover:bg-surface-fog",
  danger: "border border-[color-mix(in_srgb,var(--mark-red)_35%,white)] bg-white text-mark-red hover:bg-surface-rose",
};

/**
 * A button whose action returns ok/error. While the action runs, and briefly
 * after, it cannot be pressed again — a double click never commits twice.
 */
export function ActionButton({
  onAction,
  children,
  tone = "deep",
  disabled,
  className,
  icon,
  ariaLabel,
}: {
  onAction: () => { ok: boolean; message?: string } | void;
  children: React.ReactNode;
  tone?: Tone;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
}) {
  const [phase, setPhase] = React.useState<"idle" | "working" | "ok" | "error">("idle");
  const [message, setMessage] = React.useState<string>();
  const busy = React.useRef(false);

  const run = () => {
    if (busy.current || disabled) return;
    busy.current = true;
    setPhase("working");
    window.setTimeout(() => {
      const r = onAction() ?? { ok: true };
      setPhase(r.ok ? "ok" : "error");
      setMessage(r.ok ? undefined : r.message);
      window.setTimeout(() => {
        busy.current = false;
        setPhase("idle");
      }, r.ok ? 900 : 2600);
    }, 420);
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-busy={phase === "working"}
        disabled={disabled || phase === "working"}
        onClick={run}
        className={cn(
          "ui-pill inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-2 text-[13px] font-medium transition-[filter,background-color] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50",
          toneClass[tone],
          className,
        )}
      >
        {phase === "working" ? <Spinner size={13} /> : phase === "ok" ? <Check size={14} strokeWidth={2.5} aria-hidden /> : phase === "error" ? <AlertTriangle size={14} aria-hidden /> : icon}
        <span data-one-line="">{children}</span>
      </button>
      {phase === "error" && message && (
        <span role="alert" className="max-w-[360px] text-[12px] leading-[16px] text-mark-red">
          {message}
        </span>
      )}
    </span>
  );
}

export type ChipTone = "ok" | "warn" | "bad" | "info" | "mute";

const chipTone: Record<ChipTone, string> = {
  ok: "bg-surface-mint text-surface-deep",
  warn: "bg-surface-amber text-mark-amber",
  bad: "bg-surface-rose text-mark-red",
  info: "bg-surface-fog text-surface-navy",
  mute: "bg-surface-fog text-mute",
};

export function Chip({ tone = "mute", children, className }: { tone?: ChipTone; children: React.ReactNode; className?: string }) {
  return (
    <span data-one-line="" className={cn("inline-flex shrink-0 items-center whitespace-nowrap px-2.5 py-0.5 text-[12px] font-bold", chipTone[tone], className)}>
      {children}
    </span>
  );
}

export function Card({ title, right, children, className }: { title?: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-md border border-divider bg-white", className)}>
      {(title || right) && (
        <header className="flex items-center gap-3 px-4 pb-2.5 pt-3.5">
          {title && <h2 className="min-w-0 flex-1 truncate text-[13px] font-bold uppercase tracking-[0.06em] text-ink">{title}</h2>}
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function KeyValue({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span data-one-line="" className="truncate text-[12px] leading-[16px] text-mute" title={label}>
        {label}
      </span>
      <span className={cn("min-w-0 truncate text-[14px] leading-[19px] text-ink", strong && "font-bold tabular-nums")}>{value}</span>
    </div>
  );
}
