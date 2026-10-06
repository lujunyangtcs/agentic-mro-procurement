import * as React from "react";
import { X, Mail, CornerUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpringIn } from "@/components/ai/SpringIn";
import type { EmailAction } from "@/data/runSteps";

/**
 * Centered modal showing one email round-trip — the agent's outbound draft and
 * the supplier's inbound reply, stacked. Opened from a single "View reply"
 * button in the AI workspace. Steel-blue / SAP-blue accents, no green.
 */

function EmailCard({
  tone,
  who,
  meta,
  subject,
  lines,
}: {
  tone: "outbound" | "inbound";
  who: string;
  meta: string;
  subject: string;
  lines: string[];
}) {
  const outbound = tone === "outbound";
  return (
    <div className="bg-white border border-divider rounded-md overflow-hidden">
      <div
        className={cn(
          "px-4 py-2.5 border-l-[3px] flex items-start justify-between gap-3",
          outbound ? "border-[#0a6ed1] bg-[#0a6ed1]/[0.05]" : "border-[#354a5f] bg-[#354a5f]/[0.05]",
        )}
      >
        <div className="min-w-0">
          <div
            className={cn(
              "flex items-center gap-1.5 text-[10px] uppercase tracking-[0.07em] font-bold",
              outbound ? "text-[#0a6ed1]" : "text-[#354a5f]",
            )}
          >
            {outbound ? <CornerUpRight size={12} /> : <Mail size={12} />}
            {outbound ? "Sent by the agent" : "Reply received"}
          </div>
          <div className="text-[12px] text-ink font-medium truncate mt-1">{who}</div>
        </div>
        <span className="text-[11px] text-mute shrink-0 whitespace-nowrap">{meta}</span>
      </div>
      <div className="px-4 py-3">
        <div className="text-[13px] font-bold text-ink mb-2">{subject}</div>
        <div className="space-y-2">
          {lines.map((l, i) => (
            <p key={i} className="text-[12.5px] text-ink leading-relaxed">
              {l}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EmailReplyModal({ email, onClose }: { email: EmailAction; onClose: () => void }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-[6vh]"
      onClick={onClose}
    >
      <SpringIn className="w-full max-w-[600px] max-h-[88vh] flex flex-col bg-surface-fog rounded-lg shadow-xl overflow-hidden">
        <div onClick={(e) => e.stopPropagation()} className="flex flex-col min-h-0">
          <header className="flex items-center justify-between gap-4 px-5 py-3 bg-white border-b border-divider shrink-0">
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-ink truncate">{email.subject}</div>
              <div className="text-[11px] uppercase tracking-[0.06em] text-mute mt-0.5">
                Email thread · Outlook
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ui-pill w-8 h-8 rounded-full bg-surface-fog text-ink hover:bg-surface-mint flex items-center justify-center shrink-0"
            >
              <X size={16} />
            </button>
          </header>
          <div className="overflow-y-auto p-4 space-y-3">
            <EmailCard
              tone="outbound"
              who={`To · ${email.to}`}
              meta="Outlook · sent"
              subject={email.subject}
              lines={email.lines}
            />
            <EmailCard
              tone="inbound"
              who={`From · ${email.reply.from}`}
              meta={email.reply.receivedMeta}
              subject={email.reply.subject}
              lines={email.reply.lines}
            />
          </div>
        </div>
      </SpringIn>
    </div>
  );
}
