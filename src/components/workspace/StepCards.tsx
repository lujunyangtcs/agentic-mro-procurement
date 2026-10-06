import { AIDot } from "@/components/ai/AIDot";
import { CountUp } from "@/components/ai/CountUp";
import { SpringIn } from "@/components/ai/SpringIn";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────
 * STEP 1 — Detecting (any flow)
 * One small card that says "agent is reading the source" with a pulsing
 * dot + 2-line streaming text. Used while activeStep === 0 or 1.
 * ──────────────────────────────────────────────────────────────────────*/

export function FeedDetectorCard({
  source,
  detail,
}: {
  source: string;
  detail: string;
}) {
  return (
    <SpringIn>
      <article className="bg-white border border-divider rounded-md p-5 flex items-center gap-4">
        <div className="relative w-10 h-10 shrink-0">
          <div className="absolute inset-0 rounded-full bg-surface-mint ai-pulse" />
          <div className="absolute inset-[6px] rounded-full bg-surface-deep flex items-center justify-center text-ink-inverse text-[14px] font-bold">
            AI
          </div>
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-2 mb-0.5">
            <AIDot size={6} tone="green" pulse />
            <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
              {source}
            </span>
          </div>
          <div className="text-[14px] text-ink">{detail}</div>
        </div>
      </article>
    </SpringIn>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * STEP 2 — Calculating impact
 * 4 metrics that CountUp live, with horizontal bars growing under
 * them so the magnitudes are visible.
 * ──────────────────────────────────────────────────────────────────────*/

type ImpactRow = {
  label: string;
  value: number;
  suffix?: string;
  /** Bar fill 0..1 — relative to the largest value in the set. */
  weight?: number;
};

export function ImpactBarsCard({
  title,
  rows,
}: {
  title: string;
  rows: ImpactRow[];
}) {
  const maxValue = Math.max(...rows.map((r) => r.value));
  return (
    <SpringIn>
      <article className="bg-white border border-divider rounded-md p-6 space-y-4">
        <header className="flex items-center gap-2">
          <AIDot size={6} tone="deep" pulse />
          <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Calculating workforce impact
          </span>
        </header>
        <h3 className="text-[18px] font-bold text-ink leading-tight">{title}</h3>
        <div className="space-y-3">
          {rows.map((r, i) => (
            <BarRow key={r.label} row={r} maxValue={maxValue} delay={i * 160} />
          ))}
        </div>
      </article>
    </SpringIn>
  );
}

function BarRow({ row, maxValue, delay }: { row: ImpactRow; maxValue: number; delay: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setWidth((row.value / maxValue) * 100), delay + 80);
    return () => window.clearTimeout(t);
  }, [row.value, maxValue, delay]);

  return (
    <div className="grid grid-cols-[160px_1fr_120px] items-center gap-4">
      <div className="text-[12px] text-mute">{row.label}</div>
      <div className="h-2 rounded-full bg-divider/60 overflow-hidden">
        <div
          className="h-full bg-surface-deep transition-all duration-[900ms] ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="text-right text-[15px] font-bold text-ink">
        <CountUp to={row.value} duration={950} delay={delay} grouped />
        {row.suffix && <span className="text-[12px] text-mute ml-1">{row.suffix}</span>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * STEP 3 — Drafting documents
 * 4 progress rows fill in sequence with their own titles, showing
 * "agent writing X" in flight. Each row hits 100% over ~1000ms.
 * ──────────────────────────────────────────────────────────────────────*/

type DraftRow = {
  label: string;
  sub: string;
  /** Source-system chip shown on the right, e.g. "HRIS · Workday" */
  source?: string;
};

export function DraftingArtifactsCard({ rows }: { rows: DraftRow[] }) {
  const [progress, setProgress] = useState(rows.map(() => 0));
  useEffect(() => {
    const timers: number[] = [];
    rows.forEach((_, i) => {
      // Fill incrementally for smoother bar growth.
      for (let p = 8; p <= 100; p += 8) {
        timers.push(
          window.setTimeout(
            () => setProgress((arr) => arr.map((v, j) => (j === i ? Math.max(v, p) : v))),
            200 + i * 700 + (p / 8) * 60,
          ),
        );
      }
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [rows]);

  const done = progress.filter((p) => p === 100).length;

  return (
    <SpringIn>
      <article className="bg-white border border-divider rounded-md p-6 space-y-4">
        <header className="flex items-center gap-2">
          <AIDot size={6} tone="deep" pulse />
          <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Drafting all required documents
          </span>
          <span className="ml-auto text-[12px] text-mute">
            {done} of {rows.length} done
          </span>
        </header>
        <div className="space-y-3">
          {rows.map((r, i) => {
            const isDone = progress[i] === 100;
            return (
              <div key={r.label} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "w-4 h-4 rounded-sm flex items-center justify-center text-[10px] shrink-0",
                        isDone
                          ? "bg-surface-deep text-ink-inverse"
                          : "bg-surface-fog text-mute",
                      )}
                    >
                      {isDone ? "✓" : i + 1}
                    </span>
                    <span className="text-[14px] text-ink truncate">{r.label}</span>
                    {r.source && (
                      <span className="text-[10px] tracking-[0.06em] uppercase text-surface-deep font-medium px-1.5 py-0.5 bg-surface-mint rounded">
                        {r.source}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-mute shrink-0 tabular-nums">
                    {isDone ? r.sub : `${progress[i]}%`}
                  </span>
                </div>
                <div className="h-1 ml-6 rounded-full bg-divider/60 overflow-hidden">
                  <div
                    className="h-full bg-surface-deep transition-all duration-[300ms] ease-out"
                    style={{ width: `${progress[i]}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </article>
    </SpringIn>
  );
}
