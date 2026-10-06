import * as React from "react";
import { CountUp } from "@/freight/components/ai/CountUp";
import { SpringIn } from "@/freight/components/ai/SpringIn";
import { AIDot } from "@/freight/components/ai/AIDot";
import { Lock, PackageCheck, FileCheck2 } from "lucide-react";
import { cn } from "@/freight/lib/utils";

export type PostingEnvelopeCeremonyProps = {
  runId: string;
  postedCount: number;
  postedAmount: string;
  heldCount: number;
  routedAmount: string;
  touchlessPct: string;
};

/** Mini-cards that fly into the AP envelope (count is decorative). */
const CLEARED_CARDS = 7;
/** Held lines shown stacked in the exception drawer. */
const HELD_CARDS = 4;

export function PostingEnvelopeCeremony({
  runId,
  postedCount,
  postedAmount,
  heldCount,
  routedAmount,
  touchlessPct,
}: PostingEnvelopeCeremonyProps): React.ReactElement {
  return (
    <article className="bg-white border border-divider rounded-md p-5 overflow-hidden">
      <style>{`
        @keyframes pe-fly { from { opacity: 0; transform: translateY(-14px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pe-drawer { from { opacity: 0; transform: translateX(22px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pe-seal { 0% { opacity: 0; transform: scale(0); } 70% { opacity: 1; transform: scale(1.12); } 100% { transform: scale(1); } }
      `}</style>

      <header className="flex items-center gap-2 mb-4">
        <AIDot size={6} tone="deep" pulse />
        <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
          Close ceremony · {runId} · touchless posting
        </span>
      </header>

      <div className="grid grid-cols-[1fr_auto] gap-4">
        {/* Cleared lines flying into the sealed AP envelope */}
        <div className="rounded-md bg-surface-fog/70 border border-divider p-4">
          <div className="text-[11px] uppercase tracking-[0.06em] text-mute mb-3">
            <CountUp to={postedCount} duration={1000} /> cleared lines → AP envelope
          </div>

          <div className="relative">
            <div className="absolute inset-x-6 top-0 flex justify-center gap-1.5">
              {Array.from({ length: CLEARED_CARDS }).map((_, i) => (
                <span
                  key={i}
                  className="block w-7 h-9 rounded-sm bg-white border border-surface-sage/60 shadow-sm"
                  style={{ animation: `pe-fly 460ms ${120 + i * 90}ms cubic-bezier(.22,1,.36,1) both` }}
                />
              ))}
            </div>

            {/* AP envelope / seal panel */}
            <div
              className="mt-14 rounded-lg bg-surface-deep text-ink-inverse px-4 py-4 flex items-center gap-3"
              style={{ animation: "pe-fly 520ms 700ms cubic-bezier(.22,1,.36,1) both" }}
            >
              <span className="w-9 h-9 rounded-full bg-ink-inverse/15 flex items-center justify-center shrink-0">
                <Lock size={18} strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold leading-tight">Posted to SAP AP · net terms</div>
                <div className="text-[11px] text-ink-inverse/75 tabular-nums">
                  {postedAmount} · {postedCount.toLocaleString("en-US")} lines
                </div>
              </div>
              <PackageCheck size={18} strokeWidth={2.2} className="ml-auto opacity-80 shrink-0" />
            </div>
          </div>
        </div>

        {/* Exception drawer — held out of the payment run */}
        <div
          className="w-44 rounded-md bg-surface-rose/50 border border-mark-red/25 p-3"
          style={{ animation: "pe-drawer 520ms 560ms cubic-bezier(.22,1,.36,1) both" }}
        >
          <div className="text-[10px] uppercase tracking-[0.06em] text-mark-red font-semibold mb-2">
            Exception drawer · held
          </div>
          <div className="space-y-1.5">
            {Array.from({ length: HELD_CARDS }).map((_, i) => (
              <div
                key={i}
                className="h-5 rounded-sm bg-white border border-mark-red/20 flex items-center px-1.5"
                style={{ animation: `pe-fly 380ms ${640 + i * 80}ms ease-out both` }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-mark-red mr-1.5 shrink-0" />
                <span className="h-1 flex-1 rounded bg-surface-rose" />
              </div>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-mark-red tabular-nums font-medium">
            {routedAmount} · {heldCount} held
          </div>
        </div>
      </div>

      {/* Audit seal stamps in last */}
      <SpringIn delay={1080} className="mt-4">
        <div className="flex items-center gap-2.5 rounded-md bg-surface-mint px-3 py-2.5">
          <span
            className="w-7 h-7 rounded-full bg-surface-deep text-ink-inverse flex items-center justify-center shrink-0"
            style={{ animation: "pe-seal 620ms 1080ms cubic-bezier(.34,1.56,.64,1) both" }}
          >
            <FileCheck2 size={15} strokeWidth={2.4} />
          </span>
          <span className="text-[12px] font-semibold text-surface-deep">
            {runId} · audit envelope closed
          </span>
        </div>
      </SpringIn>

      {/* Three stat tiles */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { label: "Posted", val: postedAmount, sub: `${postedCount.toLocaleString("en-US")} lines`, tone: "deep" as const },
          { label: "Routed", val: routedAmount, sub: `${heldCount} held`, tone: "red" as const },
          { label: "Touchless", val: touchlessPct, sub: "of all lines", tone: "green" as const },
        ].map((t, i) => (
          <SpringIn key={t.label} delay={1180 + i * 90}>
            <div className="rounded-md bg-white border border-divider px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.06em] text-mute">{t.label}</div>
              <div
                className={cn(
                  "text-[18px] font-bold tabular-nums leading-tight",
                  t.tone === "red" ? "text-mark-red" : t.tone === "green" ? "text-accent-green" : "text-surface-deep",
                )}
              >
                {t.val}
              </div>
              <div className="text-[11px] text-mute">{t.sub}</div>
            </div>
          </SpringIn>
        ))}
      </div>
    </article>
  );
}
