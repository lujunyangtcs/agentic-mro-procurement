/**
 * A signable over-DOA budget-approval document — the L2 sign-off the compliance
 * orchestrator routes to the Procurement Manager. The agent drafts the email and
 * attaches this approval; the human reviews it and signs on a pointer/touch
 * signature pad (ported from the HR-concierge offboarding-letter pattern). On
 * sign, the email sends and the reply comes back with the SIGNED approval.
 *
 *   · BudgetApprovalDoc          — read-only doc (signed=true for the reply attachment)
 *   · BudgetApprovalSignableModal — the doc + interactive signature pad + sign & send
 *
 * Presentational only. Operating entity is Orvantec
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, FileSignature, Eraser, X } from "lucide-react";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { cn } from "@/mro/lib/utils";

export type BudgetApproval = {
  /** Workflow / approval reference. */
  number: string;
  title: string;
  sub: string;
  /** Summary grid — amount, DOA, vendor, cost center, etc. */
  rows: { label: string; value: string }[];
  body: string[];
  /** Who signs (the L2 approver). */
  signer: string;
  witness: string;
  date: string;
};

/** Shared content — the summary grid + the narrative body. */
function ApprovalContent({ a }: { a: BudgetApproval }) {
  return (
    <>
      <div className="px-6 py-4 grid grid-cols-2 gap-x-6 gap-y-3 border-b border-divider">
        {a.rows.map((r) => (
          <div key={r.label}>
            <div className="text-[10px] uppercase tracking-[0.06em] text-mute font-medium">{r.label}</div>
            <div className="text-[13px] text-ink font-medium mt-0.5">{r.value}</div>
          </div>
        ))}
      </div>
      <div className="px-6 py-4 space-y-2">
        {a.body.map((p, i) => (
          <p key={i} className="text-[12.5px] text-ink leading-relaxed">{p}</p>
        ))}
      </div>
    </>
  );
}

/** The budget approval as a read-only document — `signed` renders the filed signature. */
export function BudgetApprovalDoc({ a, signed = false }: { a: BudgetApproval; signed?: boolean }) {
  return (
    <div className="rounded-md border border-divider overflow-hidden bg-white">
      <div className="bg-surface-deep text-ink-inverse px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.08em] font-bold opacity-80">Budget approval</span>
          <span className="ml-auto text-[11px] font-mono opacity-80">{a.number}</span>
        </div>
        <div className="text-[17px] font-bold mt-1 leading-tight">{a.title}</div>
        <div className="text-[12.5px] opacity-85 mt-0.5">{a.sub}</div>
      </div>
      <ApprovalContent a={a} />
      <div className="px-6 pb-5 pt-1">
        <div className="text-[10px] uppercase tracking-[0.08em] text-mute font-bold mb-2">
          Signature · {a.signer}
        </div>
        <div className={cn(
          "relative rounded-md border h-[88px] flex items-center px-5",
          signed ? "border-surface-deep bg-surface-mint/25" : "border-dashed border-divider",
        )}>
          {signed ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-[26px] text-surface-deep" style={{ fontFamily: "'Snell Roundhand','Segoe Script',cursive" }}>
                {a.signer.split(" · ")[0]}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-surface-deep">
                <Check size={14} strokeWidth={2.6} /> Signed electronically
              </span>
            </div>
          ) : (
            <span className="text-[12px] text-mute">Unsigned</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3 text-[11px]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-mute font-medium">Witness</div>
            <div className="text-ink">{a.witness}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-mute font-medium">Date</div>
            <div className="text-ink">{a.date}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The interactive signing modal — the doc + a pointer/touch signature pad. */
export function BudgetApprovalSignableModal({
  open,
  onClose,
  onSigned,
  approval,
}: {
  open: boolean;
  onClose: () => void;
  /** Fired once the signature is captured — the parent then sends the email. */
  onSigned: () => void;
  approval: BudgetApproval;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [hasInk, setHasInk] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [ack, setAck] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setHasInk(false);
      setSubmitted(false);
      setAck(false);
    }
  }, [open]);

  // Pointer-drawn signature on the canvas.
  React.useEffect(() => {
    if (!open || submitted) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const ratio = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    const h = c.clientHeight;
    c.width = w * ratio;
    c.height = h * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#084337";

    let drawing = false;
    let last: { x: number; y: number } | null = null;
    const pos = (ev: PointerEvent) => {
      const rect = c.getBoundingClientRect();
      return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
    };
    const down = (ev: PointerEvent) => {
      drawing = true;
      last = pos(ev);
      c.setPointerCapture(ev.pointerId);
    };
    const move = (ev: PointerEvent) => {
      if (!drawing) return;
      const p = pos(ev);
      if (last) {
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        setHasInk(true);
      }
      last = p;
    };
    const up = () => {
      drawing = false;
      last = null;
    };
    c.addEventListener("pointerdown", down);
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerup", up);
    c.addEventListener("pointercancel", up);
    return () => {
      c.removeEventListener("pointerdown", down);
      c.removeEventListener("pointermove", move);
      c.removeEventListener("pointerup", up);
      c.removeEventListener("pointercancel", up);
    };
  }, [open, submitted]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const clearSig = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };

  const sign = () => {
    if (!hasInk || !ack) return;
    setSubmitted(true);
    window.setTimeout(() => onSigned(), 900);
  };

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6" onClick={onClose}>
      <SpringIn className="w-full max-w-[720px]">
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[88vh]"
        >
          <header className="flex items-start gap-3 px-6 py-4 border-b border-divider shrink-0">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.08em] text-surface-deep font-bold">
                {approval.number} · review &amp; sign
              </div>
              <div className="text-[15px] font-bold text-ink mt-0.5 truncate">{approval.title}</div>
              <div className="text-[12px] text-mute mt-0.5">{approval.sub}</div>
            </div>
            <button type="button" onClick={onClose} className="ui-pill ml-auto shrink-0 text-mute hover:text-ink">
              <X size={18} />
            </button>
          </header>

          <div className="overflow-y-auto">
            <ApprovalContent a={approval} />

            {/* Signature pad */}
            <section className="px-6 pb-5 pt-3 border-t border-divider">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-[0.08em] text-mute font-bold">
                  Signature · {approval.signer}
                </div>
                {!submitted && (
                  <button
                    type="button"
                    onClick={clearSig}
                    disabled={!hasInk}
                    className={cn(
                      "ui-pill inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded",
                      hasInk ? "text-mute hover:text-ink" : "text-divider cursor-not-allowed",
                    )}
                  >
                    <Eraser size={12} strokeWidth={1.8} /> Clear
                  </button>
                )}
              </div>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className={cn(
                    "block w-full h-[120px] rounded-md bg-white border border-dashed touch-none",
                    submitted || hasInk ? "border-surface-deep" : "border-divider",
                  )}
                  style={{ cursor: submitted ? "default" : "crosshair" }}
                />
                {!hasInk && !submitted && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[12px] text-mute">
                    Sign with mouse or finger
                  </div>
                )}
                {submitted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-mint/40 rounded-md">
                    <div className="flex items-center gap-2 text-surface-deep font-bold text-[13px]">
                      <Check size={14} strokeWidth={2.4} /> Capturing signature · sending to the orchestrator…
                    </div>
                  </div>
                )}
                <div aria-hidden className="absolute left-3 right-3 bottom-3 border-t border-divider" />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3 text-[11px] text-mute">
                <div>
                  <div className="text-[10px] tracking-[0.08em] uppercase font-medium">Witness</div>
                  <div className="text-ink">{approval.witness}</div>
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.08em] uppercase font-medium">Date</div>
                  <div className="text-ink">{approval.date}</div>
                </div>
              </div>
            </section>
          </div>

          <footer className="px-6 py-4 border-t border-divider shrink-0">
            {submitted ? (
              <div className="flex items-center justify-end gap-2 text-[12.5px] text-surface-deep font-bold">
                <Check size={14} strokeWidth={2.4} /> Signed · returning to the orchestrator.
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-[12px] text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ack}
                    onChange={(e) => setAck(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#084337]"
                  />
                  I authorise the over-DOA spend and the PO release.
                </label>
                <button
                  type="button"
                  onClick={sign}
                  disabled={!hasInk || !ack}
                  className={cn(
                    "ui-pill inline-flex items-center gap-2 rounded-full font-bold text-[13px] px-5 py-2.5 transition-colors",
                    hasInk && ack ? "bg-surface-deep text-ink-inverse hover:bg-accent-green" : "bg-divider text-mute cursor-not-allowed",
                  )}
                >
                  <FileSignature size={15} strokeWidth={2} /> Sign &amp; send
                </button>
              </div>
            )}
          </footer>
        </div>
      </SpringIn>
    </div>,
    document.body,
  );
}
