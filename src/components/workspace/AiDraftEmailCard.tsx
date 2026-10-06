import * as React from "react";
import { Sparkles, CornerUpRight, Check, Mail, Maximize2 } from "lucide-react";
import { SpringIn } from "@/components/ai/SpringIn";
import { AiDraftEmailModal } from "@/components/workspace/AiDraftEmailModal";

/** Minimal shape the card renders — EmailAction satisfies it structurally. */
export type DraftEmailLike = { to: string; subject: string; lines: string[] };

/**
 * An agent-drafted outbound email, shown inline for the human to review before
 * it sends. This is the "the agent doesn't just decide — it writes the message"
 * moment: the draft is composed from the step's evidence, the buyer reviews the
 * To / Subject / body, and one click sends it.
 *
 * Two modes: a round-trip email (pass `onViewThread` — once sent, the supplier
 * reply lands as a source and the full thread opens from here) or a one-way
 * controlled response on an exception (omit `onViewThread` — sends and logs,
 * no reply expected). SAP-blue, no green except the sent tick.
 */
export function AiDraftEmailCard({
  email,
  sent,
  onSend,
  onViewThread,
  sendLabel = "Send to supplier",
  sentLabel = "Sent · reply received",
}: {
  email: DraftEmailLike;
  sent: boolean;
  onSend: () => void;
  onViewThread?: () => void;
  sendLabel?: string;
  sentLabel?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <SpringIn>
      <article className="bg-white border border-divider rounded-md overflow-hidden">
        <header className="flex items-center gap-2 px-4 py-2.5 border-b border-divider border-l-[3px] border-l-[#0a6ed1] bg-[#0a6ed1]/[0.05]">
          <Sparkles size={13} className="text-[#0a6ed1] shrink-0" />
          <span className="text-[11px] uppercase tracking-[0.07em] font-bold text-[#0a6ed1]">
            {sent ? "Email sent by the agent" : "AI-drafted email · review before send"}
          </span>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="ui-pill ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-[#0a6ed1] hover:underline shrink-0"
          >
            <Maximize2 size={12} /> Open
          </button>
        </header>

        <div className="px-4 py-3 space-y-2">
          <div className="grid grid-cols-[54px_minmax(0,1fr)] gap-x-2 gap-y-1 text-[12.5px]">
            <span className="text-mute">To</span>
            <span className="text-ink font-medium">{email.to}</span>
            <span className="text-mute">Subject</span>
            <span className="text-ink font-medium">{email.subject}</span>
          </div>
          <div className="border-t border-divider pt-2 space-y-2">
            {email.lines.map((l, i) => (
              <p key={i} className="text-[12.5px] text-ink leading-relaxed">
                {l}
              </p>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-divider flex items-center gap-2">
          {!sent ? (
            <button
              type="button"
              onClick={onSend}
              className="ui-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold bg-[#0a6ed1] text-white hover:bg-[#085bb0]"
            >
              <CornerUpRight size={14} /> {sendLabel}
            </button>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#107e3e]">
                <Check size={14} strokeWidth={3} /> {sentLabel}
              </span>
              {onViewThread && (
                <button
                  type="button"
                  onClick={onViewThread}
                  className="ui-pill ml-auto inline-flex items-center gap-1.5 rounded-md border border-divider bg-white px-3 py-1.5 text-[12.5px] font-medium text-ink hover:bg-surface-fog"
                >
                  <Mail size={14} className="text-[#0a6ed1]" /> View thread
                </button>
              )}
            </>
          )}
        </div>
      </article>

      {expanded && (
        <AiDraftEmailModal
          email={email}
          sent={sent}
          onSend={onSend}
          sendLabel={sendLabel}
          sentLabel={sentLabel}
          onClose={() => setExpanded(false)}
        />
      )}
    </SpringIn>
  );
}
