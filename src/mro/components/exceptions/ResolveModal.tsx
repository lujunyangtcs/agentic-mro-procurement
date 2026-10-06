/**
 * "Analyze with AI" — the centred ceremony that closes an exception.
 *
 * Three beats: the agent visibly reads the source files, presents a resolution
 * grounded in them, and applies it only when the person confirms. The $4,180
 * mechanical-seal case gets its own fully worked card (shaft-size decision with
 * evidence and a drafted confirmation back to the engineer, in German); the
 * other five reasons share one structured template fed by the same
 * recommendation data the detail rail shows.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { X, Check, FileText, Languages, ChevronDown } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import {
  usd,
  lineValue,
  exceptionMeta,
  type ExceptionType,
  type Requisition,
} from "@/mro/data/procurement";
import type { ExceptionSource } from "@/mro/data/exceptionSources";
import { StepProgress } from "@/mro/components/ai/StepProgress";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { Spinner } from "@/mro/components/ai/Spinner";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { PillButton } from "@/mro/components/blocks/PillButton";

export type ResolutionPlan = {
  /** What the card recommends, in plain language. */
  action: string;
  /** The rows of evidence behind it. */
  evidence: { label: string; detail: string }[];
  /** Money this action protects, when it protects any. */
  protects?: number;
  /** The primary button label. */
  applyLabel: string;
  /** The status recorded on the exception once applied. */
  resolutionLabel: string;
};

type Phase = "analyzing" | "decide" | "applying" | "done";

/* ── The hero card — confirm the shaft size ─────────────────────────────── */

function SealSizeCard({ picked, onPick }: { picked: "45" | "50"; onPick: (v: "45" | "50") => void }) {
  const options = [
    {
      id: "45" as const,
      title: "45 mm shaft",
      lines: ["No matching material in the master", "Not stocked anywhere in the network", "Would need a new material record"],
      ok: false,
    },
    {
      id: "50" as const,
      title: "50 mm shaft",
      lines: ["Matches the installed Assembly Line 2 agitator", "Active material · MRO-SEAL-MECH-50MM-SIC", "On the Apex agreement at $4,180"],
      ok: true,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((o) => {
        const on = picked === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onPick(o.id)}
            className={cn(
              "ui-pill rounded-md border-2 px-4 py-3.5 text-left transition-colors",
              on ? "border-surface-deep bg-surface-mint/45" : "border-divider bg-white hover:bg-surface-fog",
            )}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "grid h-4 w-4 shrink-0 place-items-center rounded-full border-2",
                  on ? "border-surface-deep bg-surface-deep" : "border-divider",
                )}
              >
                {on && <Check size={10} strokeWidth={3} className="text-ink-inverse" />}
              </span>
              <span className="text-[14px] font-bold text-ink">{o.title}</span>
              {o.ok && (
                <span className="ml-auto whitespace-nowrap rounded-full bg-surface-deep px-2.5 py-0.5 text-[12px] font-medium text-ink-inverse">
                  Recommended
                </span>
              )}
            </div>
            <ul className="mt-2.5 space-y-1 pl-6.5">
              {o.lines.map((l) => (
                <li key={l} className={cn("text-[13px] leading-[18px]", o.ok ? "text-ink" : "text-mute")}>
                  {l}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

function DraftToEngineer() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="rounded-md border border-divider bg-surface-fog/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ui-pill flex w-full items-center gap-2.5 px-4 py-3 text-left"
      >
        <Languages size={15} className="shrink-0 text-surface-deep" />
        <span className="text-[13px] font-semibold text-ink">Confirmation drafted for the engineer</span>
        <span className="whitespace-nowrap rounded-full bg-surface-mint px-2.5 py-0.5 text-[12px] font-medium text-surface-deep">
          Written in Deutsch
        </span>
        <ChevronDown size={15} className={cn("ml-auto shrink-0 text-mute transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-divider bg-white px-4 py-3">
          <p className="text-[13px] leading-[19px] text-ink">
            <StreamingText
              text="Kurze Bestätigung: für Mischlinie 2 wird die Gleitringdichtung mit 50 mm Wellendurchmesser bestellt — passend zum eingebauten Rührwerk. Falls das nicht stimmt, bitte heute melden."
              cps={140}
              caret={false}
            />
          </p>
          <p className="mt-2 border-t border-divider pt-2 text-[12px] leading-[17px] text-mute">
            Quick confirmation: the 50 mm shaft seal is being ordered for Assembly Line 2 — matching
            the installed agitator. If that is wrong, please say so today.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── The modal ──────────────────────────────────────────────────────────── */

export function ResolveModal({
  r,
  type,
  plan,
  sources,
  onApply,
  onClose,
}: {
  r: Requisition;
  type: ExceptionType;
  plan: ResolutionPlan;
  sources: ExceptionSource[];
  onApply: () => void;
  onClose: () => void;
}) {
  const meta = exceptionMeta[type];
  const hero = type === "spec-incomplete" && r.id === "PR-48630";
  const [phase, setPhase] = React.useState<Phase>("analyzing");
  const [picked, setPicked] = React.useState<"45" | "50">("50");
  const [readCount, setReadCount] = React.useState(0);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "applying" && phase !== "done") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, phase]);

  /* Source files tick off one by one while the agent works. */
  React.useEffect(() => {
    if (phase !== "analyzing") return;
    const timer = setInterval(
      () => setReadCount((n) => Math.min(sources.length, n + 1)),
      Math.max(350, 1700 / Math.max(1, sources.length)),
    );
    return () => clearInterval(timer);
  }, [phase, sources.length]);

  const apply = () => {
    setPhase("applying");
    window.setTimeout(() => {
      onApply();
      setPhase("done");
      window.setTimeout(onClose, 1400);
    }, 950);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/45 px-6 py-10"
      onClick={(e) => e.target === e.currentTarget && phase === "decide" && onClose()}
    >
      <SpringIn className="w-full max-w-[680px]">
        <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
          <header className="flex items-center gap-2.5 border-b border-divider px-5 py-3.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: meta.accent }} />
            <span className="text-[15px] font-bold text-ink">{r.id}</span>
            <span className="text-[13px] text-mute">{meta.label}</span>
            <span className="ml-auto text-[13px] font-medium text-ink tabular-nums">
              {usd(lineValue(r))}
            </span>
            {phase === "decide" && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="ui-pill rounded-md p-1.5 text-mute hover:bg-surface-fog hover:text-ink"
              >
                <X size={15} />
              </button>
            )}
          </header>

          <div className="px-5 py-4">
            {phase === "analyzing" && (
              <div className="space-y-4 py-2">
                <StepProgress
                  agentName="The workforce"
                  docLabel="a resolution"
                  durationMs={2300}
                  onDone={() => setPhase("decide")}
                />
                <ul className="space-y-1.5">
                  {sources.map((s, i) => (
                    <li key={s.id} className="flex items-center gap-2.5 text-[13px]">
                      {i < readCount ? (
                        <Check size={14} strokeWidth={2.6} className="shrink-0 text-accent-green" />
                      ) : (
                        <Spinner size={13} />
                      )}
                      <FileText size={13} className="shrink-0 text-mute" />
                      <span className={cn(i < readCount ? "text-ink" : "text-mute")}>{s.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {phase === "decide" && (
              <SpringIn className="space-y-4">
                {hero ? (
                  <>
                    <div>
                      <h3 className="text-[17px] font-bold text-ink">Confirm the shaft size</h3>
                      <p className="text-[13px] text-mute leading-snug mt-0.5">
                        The request said 45–50 mm. The installed equipment settles it.
                      </p>
                    </div>
                    <SealSizeCard picked={picked} onPick={setPicked} />
                    <div className="space-y-1.5">
                      {[
                        { label: "Equipment register", detail: "Assembly Line 2 agitator · shaft measured 50 mm" },
                        { label: "Material master", detail: "50 mm seal active and stocked · no 45 mm variant exists" },
                        { label: "Original request", detail: "“Welle etwa 45–50 mm” — a range, no part number" },
                      ].map((e) => (
                        <div key={e.label} className="flex gap-2 text-[13px]">
                          <span className="w-[136px] shrink-0 text-mute">{e.label}</span>
                          <span className="min-w-0 text-ink">{e.detail}</span>
                        </div>
                      ))}
                    </div>
                    <DraftToEngineer />
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="text-[17px] font-bold text-ink">{plan.action}</h3>
                      <p className="text-[13px] text-mute leading-snug mt-0.5">
                        Grounded in the source files the workforce just read.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {plan.evidence.map((e) => (
                        <div key={e.label} className="flex gap-2 text-[13px]">
                          <span className="w-[136px] shrink-0 text-mute">{e.label}</span>
                          <span className="min-w-0 text-ink">{e.detail}</span>
                        </div>
                      ))}
                    </div>
                    {plan.protects ? (
                      <div className="rounded-md border border-surface-deep/25 bg-surface-mint/35 px-3.5 py-2.5 text-[13px] text-ink">
                        Applying this protects{" "}
                        <span className="font-bold tabular-nums text-surface-deep">
                          {usd(plan.protects)}
                        </span>{" "}
                        of spend.
                      </div>
                    ) : null}
                  </>
                )}

                <div className="flex items-center justify-end gap-2.5 border-t border-divider pt-3.5">
                  <PillButton variant="secondary" onClick={onClose} className="whitespace-nowrap">
                    Cancel
                  </PillButton>
                  <PillButton
                    variant="deep"
                    onClick={apply}
                    disabled={hero && picked !== "50"}
                    className="whitespace-nowrap"
                  >
                    {hero ? "Confirm 50 mm · release PR-48630" : plan.applyLabel}
                  </PillButton>
                </div>
                {hero && picked !== "50" && (
                  <p className="text-right text-[12px] text-mark-red">
                    45 mm has no matching material — the workforce cannot order it.
                  </p>
                )}
              </SpringIn>
            )}

            {phase === "applying" && (
              <div className="flex items-center justify-center gap-3 py-10">
                <Spinner size={18} />
                <span className="text-[14px] text-ink">Applying and writing the audit trail…</span>
              </div>
            )}

            {phase === "done" && (
              <SpringIn className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-mint">
                  <Check size={24} strokeWidth={2.6} className="text-surface-deep" />
                </span>
                <div>
                  <div className="text-[16px] font-bold text-ink">{plan.resolutionLabel}</div>
                  <p className="text-[13px] text-mute mt-1">
                    Written to the audit trail against {r.id}.
                  </p>
                </div>
              </SpringIn>
            )}
          </div>
        </div>
      </SpringIn>
    </div>,
    document.body,
  );
}
