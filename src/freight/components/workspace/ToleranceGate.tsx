import * as React from "react";
import { cn } from "@/freight/lib/utils";
import { CountUp } from "@/freight/components/ai/CountUp";
import { AIDot } from "@/freight/components/ai/AIDot";
import { SpringIn } from "@/freight/components/ai/SpringIn";

export type ToleranceGateProps = {
  total: number;
  cleared: number;
  exceptions: { label: string; type: string }[];
};

type Lane = {
  label: string;
  held: boolean;
  type?: string;
  /** Vertical track the chip rides on (0..1). */
  y: number;
};

const STEP_MS = 80; // stagger between chip launches — fast, high-volume feel
const FLIGHT_MS = 620; // time a chip takes to cross the gate
const W = 460;
const H = 230;
const GATE_X = W / 2;
const START_X = 30;
const END_X = W - 56;

/**
 * Settlement agent running carrier-invoice lines through a ±2% tolerance gate
 * at speed. In-tolerance lines pass THROUGH and stack on the right as a growing
 * auto-cleared pile; the held lines stop AT the gate and are tagged with their
 * exception type. The whole stream launches on mount, one chip every ~80ms, so
 * it reads as touchless automation rather than a line-by-line review.
 */
export function ToleranceGate({ total, cleared, exceptions }: ToleranceGateProps) {
  const [launched, setLaunched] = React.useState(0); // how many chips have left the chute
  const heldByIndex = React.useMemo(() => {
    // Map exception labels (e.g. "L7") onto their 1-based line index.
    const m = new Map<number, string>();
    for (const e of exceptions) {
      const n = Number(e.label.replace(/[^0-9]/g, ""));
      if (n >= 1 && n <= total) m.set(n, e.type);
    }
    return m;
  }, [exceptions, total]);

  const lanes = React.useMemo<Lane[]>(() => {
    return Array.from({ length: total }, (_, i) => {
      const n = i + 1;
      const type = heldByIndex.get(n);
      return {
        label: `L${n}`,
        held: type !== undefined,
        type,
        // Spread chips across the vertical band; held ones cluster near centre.
        y: type !== undefined ? 0.5 : 0.12 + ((i * 0.618) % 1) * 0.76,
      };
    });
  }, [total, heldByIndex]);

  React.useEffect(() => {
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setLaunched(n);
      if (n >= total) window.clearInterval(id);
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [total]);

  // Cleared count for the centre counter — how many touchless chips have landed.
  const landedCleared = lanes
    .slice(0, launched)
    .filter((l) => !l.held).length;
  const allCleared = launched >= total ? cleared : landedCleared;

  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <header className="flex items-center gap-2 mb-3">
        <AIDot size={7} tone="deep" pulse />
        <span className="text-[11px] font-bold tracking-[0.09em] uppercase text-surface-deep">
          ±2% tolerance gate · line auto-clear
        </span>
        <span className="ml-auto text-[11px] text-mute tabular-nums">{total} invoice lines</span>
      </header>

      {/* GATE STAGE */}
      <div className="relative w-full" style={{ height: H }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden>
          {/* flow rail */}
          <line x1={START_X} y1={H / 2} x2={END_X} y2={H / 2} stroke="var(--divider)" strokeWidth={1} strokeDasharray="3 5" />
          {/* the gate — a vertical slot with a ±2% throat */}
          <rect x={GATE_X - 13} y={14} width={26} height={H - 28} rx={7} fill="var(--surface-mint)" stroke="var(--surface-deep)" strokeWidth={1.5} />
          <line x1={GATE_X} y1={20} x2={GATE_X} y2={H - 20} stroke="var(--surface-deep)" strokeWidth={1} strokeDasharray="2 4" opacity={0.55} />
          {/* auto-cleared catch pile on the right */}
          <rect x={END_X - 6} y={18} width={W - END_X - 4} height={H - 36} rx={6} fill="var(--accent-green)" opacity={0.1} />
        </svg>

        {/* gate labels */}
        <span className="absolute -translate-x-1/2 text-[9px] font-bold tracking-wide text-surface-deep" style={{ left: GATE_X, top: 0 }}>
          ±2%
        </span>
        <span className="absolute text-[9px] font-semibold uppercase tracking-wide text-accent-green" style={{ left: END_X - 2, top: 1 }}>
          auto-cleared
        </span>

        {/* centre counter */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ top: H / 2 - 26 }}>
          <div className="rounded-full bg-white border border-divider px-2.5 py-1 shadow-sm text-center">
            <div className="text-[15px] font-bold text-surface-deep leading-none tabular-nums">
              <CountUp to={allCleared} duration={launched >= total ? 500 : 0} key={allCleared} />
              <span className="text-mute font-medium"> / {total}</span>
            </div>
          </div>
          <div className="mt-1 text-[9px] text-mute">
            {launched >= total ? `${cleared} auto-cleared touchless` : "clearing…"}
          </div>
        </div>

        {/* flying line-chips */}
        {lanes.map((l, i) => {
          const isLaunched = i < launched;
          const top = 14 + l.y * (H - 44);
          const left = isLaunched ? (l.held ? GATE_X - 24 : END_X + (i % 4) * 3) : START_X - 8;
          return (
            <span
              key={l.label}
              className={cn(
                "absolute z-[1] inline-flex items-center justify-center rounded text-[9px] font-bold tabular-nums select-none",
                "h-[15px] min-w-[24px] px-1 border",
                l.held
                  ? "bg-surface-rose border-mark-red text-mark-red"
                  : "bg-surface-mint border-accent-green text-surface-deep",
              )}
              style={{
                left,
                top,
                opacity: isLaunched ? 1 : 0,
                transitionProperty: "left, top, opacity",
                transitionDuration: `${FLIGHT_MS}ms${l.held ? "" : ""}`,
                transitionTimingFunction: l.held ? "cubic-bezier(0.34,1.4,0.5,1)" : "cubic-bezier(0.4,0,0.2,1)",
                transitionDelay: `${i * 18}ms`,
              }}
            >
              {l.label}
            </span>
          );
        })}
      </div>

      {/* HELD CHIPS — exception triage list */}
      <div className="mt-4">
        <div className="flex items-center gap-1.5 mb-2">
          <AIDot size={6} tone="red" pulse />
          <span className="text-[11px] font-semibold text-mark-red">
            Held at gate · {exceptions.length} for triage
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {exceptions.map((e, i) => (
            <SpringIn key={e.label} delay={total * STEP_MS + 200 + i * 90}>
              <div className="flex items-center gap-2 rounded border border-mark-red/40 bg-surface-rose/50 px-2.5 py-1.5">
                <span className="inline-flex h-[18px] min-w-[26px] items-center justify-center rounded bg-mark-red px-1 text-[10px] font-bold text-ink-inverse tabular-nums">
                  {e.label}
                </span>
                <span className="text-[12px] text-ink leading-tight">{e.type}</span>
              </div>
            </SpringIn>
          ))}
        </div>
      </div>

      {/* END CAPTION */}
      <div className="mt-4 flex items-center justify-center gap-2 rounded border border-divider bg-surface-fog px-3 py-2 text-[12px]">
        <span className="font-bold text-accent-green tabular-nums">{cleared} cleared touchless</span>
        <span className="text-divider">·</span>
        <span className="font-bold text-mark-red tabular-nums">{exceptions.length} held for triage</span>
      </div>
    </article>
  );
}
