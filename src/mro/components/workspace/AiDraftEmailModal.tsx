import * as React from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, CornerUpRight, Check } from "lucide-react";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import type { DraftEmailLike } from "@/mro/components/workspace/AiDraftEmailCard";

/**
 * The centered-modal view of an agent's drafted email. Opened from the inline
 * AiDraftEmailCard's expand control — same draft, full-screen focus, with the
 * send action inline. Sending here flows through the same onSend as the card,
 * so the inline card and the run's source panel stay in lockstep.
 */
export function AiDraftEmailModal({
  email,
  sent,
  onSend,
  sendLabel = "Send",
  sentLabel = "Sent",
  onClose,
}: {
  email: DraftEmailLike;
  sent: boolean;
  onSend: () => void;
  sendLabel?: string;
  sentLabel?: string;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const send = () => {
    onSend();
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <SpringIn className="w-full max-w-[600px] max-h-[88vh]">
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col min-h-0 max-h-[88vh] bg-white rounded-xl shadow-xl overflow-hidden"
        >
          <header className="flex items-center gap-2 px-5 py-3 border-b border-divider border-l-[3px] border-l-surface-deep bg-surface-mint/40 shrink-0">
            <Sparkles size={14} className="text-surface-deep shrink-0" />
            <span className="text-[11px] uppercase tracking-[0.07em] font-bold text-surface-deep">
              {sent ? "Email sent by the agent" : "AI-drafted email · review before send"}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ui-pill ml-auto w-8 h-8 rounded-full bg-surface-fog text-ink hover:bg-surface-mint flex items-center justify-center shrink-0"
            >
              <X size={16} />
            </button>
          </header>

          <div className="overflow-y-auto px-5 py-4 space-y-3">
            <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
              <span className="text-mute">To</span>
              <span className="text-ink font-medium">{email.to}</span>
              <span className="text-mute">Subject</span>
              <span className="text-ink font-medium">{email.subject}</span>
            </div>
            <div className="border-t border-divider pt-3 space-y-3">
              {email.lines.map((l, i) => (
                <p key={i} className="text-[13px] text-ink leading-relaxed">
                  {l}
                </p>
              ))}
            </div>
            {email.review && (
              /* The message goes out in the supplier's language; this is the
                 same thing in English, so nobody approves what they can't read. */
              <div className="mt-3 rounded-lg border border-surface-mint bg-surface-mint/25 px-3.5 py-3">
                <p className="flex items-center gap-1.5 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-surface-deep">
                  <Sparkles size={12} /> In English, for you to check
                </p>
                <p className="pb-1 text-[12.5px] font-bold text-ink">{email.review.subject}</p>
                <div className="space-y-1.5 text-[12.5px] leading-relaxed text-ink">
                  {email.review.body.map((l, i) => (
                    <p key={i}>{l}</p>
                  ))}
                </div>
                <p className="pt-2 text-[11.5px] text-ink">
                  Sending in {email.review.sendingIn} — the version above.
                </p>
              </div>
            )}
          </div>

          <div className="px-5 py-3.5 border-t border-divider flex items-center gap-3 shrink-0">
            {!sent ? (
              <>
                <button
                  type="button"
                  onClick={send}
                  className="ui-pill inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-bold bg-surface-deep text-white hover:brightness-110"
                >
                  <CornerUpRight size={15} /> {sendLabel}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="ui-pill rounded-full border border-ink/25 bg-white px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-surface-fog"
                >
                  Close
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#107e3e]">
                <Check size={15} strokeWidth={3} /> {sentLabel}
              </span>
            )}
          </div>
        </div>
      </SpringIn>
    </div>,
    document.body,
  );
}
