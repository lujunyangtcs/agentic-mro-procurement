import { Sparkles, Check, Mail, CornerUpRight } from "lucide-react";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { Spinner } from "@/mro/components/ai/Spinner";

/** Minimal shape the card renders — EmailAction satisfies it structurally. */
export type DraftEmailLike = {
  to: string;
  subject: string;
  lines: string[];
  /** English alongside, when the message itself goes out in another language. */
  review?: { subject: string; body: string[]; sendingIn: string };
};

/**
 * A preview of an agent-drafted outbound email. Two modes:
 *  · PASSIVE (default) — the email auto-pops & sends from the Approve action, so
 *    the card just shows "sends on approve" then "sent" (see Workspace.onDecision).
 *  · ACTIVE — pass `onSend` to render a manual Send button (used by the exception
 *    payoff, which sends its notice inline rather than on approve).
 * A one-way email shows a plain "Sent"; a reply-gated one shows "Sent · reply
 * received" with a View thread affordance.
 */
export function AiDraftEmailCard({
  email,
  sent,
  replied = false,
  awaiting = false,
  hasReply = false,
  onSend,
  onViewThread,
  sendLabel = "Review & send",
  sentLabel,
}: {
  email: DraftEmailLike;
  sent: boolean;
  /** True once the reply has landed (reply-gated emails only). */
  replied?: boolean;
  /** True after send while the reply is still in flight (reply-gated only). */
  awaiting?: boolean;
  /** Whether this email expects a reply round-trip (vs a one-way send). */
  hasReply?: boolean;
  /** Provide to render a manual Send button (ACTIVE mode); omit for passive. */
  onSend?: () => void;
  onViewThread?: () => void;
  sendLabel?: string;
  sentLabel?: string;
}) {
  return (
    <SpringIn>
      <article className="bg-white border border-divider rounded-md overflow-hidden">
        <header className="flex items-center gap-2 px-4 py-2.5 border-b border-divider border-l-[3px] border-l-surface-deep bg-surface-mint/40">
          <Sparkles size={13} className="text-surface-deep shrink-0" />
          <span className="text-[11px] uppercase tracking-[0.07em] font-bold text-surface-deep">
            {sent ? "Email sent by the agent" : onSend ? "AI-drafted email · ready to review" : "AI-drafted email · sends on approve"}
          </span>
        </header>

        <div className="px-4 py-3 grid grid-cols-[54px_minmax(0,1fr)] gap-x-2 gap-y-1 text-[12.5px]">
          <span className="text-mute">To</span>
          <span className="text-ink font-medium truncate">{email.to}</span>
          <span className="text-mute">Subject</span>
          <span className="text-ink font-medium truncate">{email.subject}</span>
        </div>

        <div className="px-4 py-3 border-t border-divider flex items-center gap-2">
          {awaiting && !replied ? (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-surface-deep">
              <Spinner size={13} /> Sent · waiting for reply…
            </span>
          ) : sent ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#2f6b4f]">
                <Check size={14} strokeWidth={3} /> {sentLabel ?? (hasReply ? "Sent · reply received" : "Sent")}
              </span>
              {hasReply && onViewThread && (
                <button
                  type="button"
                  onClick={onViewThread}
                  className="ui-pill ml-auto inline-flex items-center gap-1.5 rounded-md border border-divider bg-white px-3 py-1.5 text-[12.5px] font-medium text-ink hover:bg-surface-fog"
                >
                  <Mail size={14} className="text-surface-deep" /> View thread
                </button>
              )}
            </>
          ) : onSend ? (
            <button
              type="button"
              onClick={onSend}
              className="ui-pill inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold bg-surface-deep text-white hover:brightness-110"
            >
              <CornerUpRight size={14} /> {sendLabel}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-mute">
              <CornerUpRight size={13} className="text-surface-deep shrink-0" />
              Sends to {email.to} when you approve &amp; hand off this step.
            </span>
          )}
        </div>
      </article>
    </SpringIn>
  );
}
