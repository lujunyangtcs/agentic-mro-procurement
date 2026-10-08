/**
 * The card a beat lands on the page once its popup closes: a titled frame,
 * the result in the corner, and the source files it read along the foot so
 * every figure on the card is one click from its original.
 */

import type * as React from "react";
import { Check, Minus, X, type LucideIcon } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { DocChip, type SourceDoc } from "@/mro/components/story/theatre/pdf";

export type Tone = "ok" | "warn" | "bad" | "info" | "mute";

const TONE: Record<Tone, string> = {
  ok: "bg-surface-mint text-surface-deep",
  warn: "bg-surface-amber text-mark-amber",
  bad: "bg-surface-rose text-mark-red",
  info: "bg-surface-fog text-surface-navy",
  mute: "bg-surface-fog text-mute",
};

export function Pill({ tone = "mute", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex shrink-0 items-center whitespace-nowrap px-2 py-0.5 text-[11.5px] font-bold tabular-nums", TONE[tone], className)}>{children}</span>;
}

export function Tick({ v, label }: { v: boolean | undefined; label: string }) {
  return (
    <span
      className={cn(
        "inline-grid h-5 w-5 shrink-0 place-items-center rounded-full",
        v === true ? "bg-surface-mint text-surface-deep" : v === false ? "bg-surface-rose text-mark-red" : "bg-surface-fog text-mute",
      )}
      role="img"
      aria-label={label}
    >
      {v === true ? <Check size={12} strokeWidth={3} aria-hidden /> : v === false ? <X size={12} strokeWidth={3} aria-hidden /> : <Minus size={12} aria-hidden />}
    </span>
  );
}

export function BeatFrame({
  icon: Icon,
  eyebrow,
  title,
  aside,
  files,
  onOpenDoc,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  aside?: React.ReactNode;
  files?: (SourceDoc | undefined)[];
  onOpenDoc: (d: SourceDoc) => void;
  children: React.ReactNode;
}) {
  const shown = (files ?? []).filter((d, i, a): d is SourceDoc => !!d && a.indexOf(d) === i);
  return (
    <section className="flex flex-col border border-divider bg-white">
      <header className="flex items-start gap-3 border-b border-divider px-5 py-3.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center border border-divider text-surface-deep" aria-hidden>
          <Icon size={16} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="aap-eyebrow truncate text-[10px] text-steel">{eyebrow}</p>
          <h3 className="mt-0.5 text-pretty text-[14.5px] font-bold leading-[20px] text-ink">{title}</h3>
        </div>
        {aside && <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 pt-0.5">{aside}</div>}
      </header>
      <div className="flex flex-col gap-4 px-5 py-4">{children}</div>
      {shown.length > 0 && (
        <footer className="flex flex-wrap items-center gap-1.5 border-t border-divider px-5 py-2.5">
          {shown.map((d) => (
            <DocChip key={d.id} doc={d} onOpen={onOpenDoc} />
          ))}
        </footer>
      )}
    </section>
  );
}

/** A figure with its label, the unit every beat card is built from. */
export function Figure({ label, value, note, tone }: { label: string; value: React.ReactNode; note?: string; tone?: Tone }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5 px-3 py-2.5", tone ? TONE[tone].split(" ")[0] : "bg-surface-fog/60")}>
      <span className="truncate text-[11.5px] text-mute">{label}</span>
      <span className="text-[18px] font-bold leading-[24px] tabular-nums text-ink">{value}</span>
      {note && <span className="text-pretty text-[11.5px] leading-[16px] text-mute">{note}</span>}
    </div>
  );
}
