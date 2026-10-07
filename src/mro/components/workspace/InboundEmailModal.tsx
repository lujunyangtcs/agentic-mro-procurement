/**
 * A RECEIVED email shown as a centered pop-up — e.g. the vendor emailing their
 * invoice in, which arrives before the four-way match consumes it. Mirrors the
 * outbound EmailDraftModal's layout but reads as inbound: a "received" header, the
 * sender/subject, the body, and a previewable PDF attachment (click → preview).
 * One action — Continue — hands control back to the run (the match begins).
 * Presentational only.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { X, MailCheck, FileText, Eye, CornerUpRight } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import type { InboundEmail } from "@/mro/data/runSteps";

export function InboundEmailModal({ email, onClose }: { email: InboundEmail; onClose: () => void }) {
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const fileName = `${email.attachmentLabel.replace(/\s·\s/g, "_").replace(/\s+/g, "-")}.pdf`;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[90] bg-black/30" onClick={onClose} aria-hidden />
      <div className="ai-spring fixed left-1/2 top-1/2 z-[100] flex max-h-[88vh] w-full max-w-[540px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-divider bg-white shadow-2xl">
        <header className="flex items-center gap-3 border-b border-divider px-6 py-4 shrink-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-deep text-ink-inverse">
            <MailCheck size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-surface-deep">Email received</p>
            <h2 className="text-[16px] font-bold text-ink truncate">{email.headline ?? `${email.from} sent the invoice`}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="ui-pill flex h-8 w-8 items-center justify-center rounded-full text-mute hover:bg-surface-fog hover:text-ink"><X size={17} /></button>
        </header>

        <div className="overflow-y-auto p-6">
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-divider">
              <div className="space-y-1.5 border-b border-divider bg-surface-fog px-4 py-3 text-[13px]">
                <div className="flex gap-3"><span className="w-16 shrink-0 text-mute">From</span><span className="font-bold text-ink">{email.from}{email.fromAddr && <span className="ml-1 font-normal text-mute">· {email.fromAddr}</span>}</span></div>
                <div className="flex gap-3"><span className="w-16 shrink-0 text-mute">Subject</span><span className="font-bold text-ink">{email.subject}</span></div>
                <div className="flex gap-3"><span className="w-16 shrink-0 text-mute">Received</span><span className="text-mute">{email.receivedMeta}</span></div>
              </div>
              <div className="space-y-2 px-4 py-4 text-[13.5px] leading-relaxed text-ink">
                {email.lines.map((l, i) => (
                  <p key={i} className="ai-stream" style={{ animationDelay: `${i * 90}ms` }}>{l || " "}</p>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-divider bg-surface-fog px-3.5 py-3 text-left hover:border-surface-deep"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#a1232b]/10 text-[#a1232b]"><FileText size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-ink truncate">{fileName}</span>
                <span className="block text-[11px] text-mute">{email.previewNote ?? "PDF · click to preview the invoice"}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-surface-deep shrink-0"><Eye size={14} /> Preview</span>
            </button>
          </div>
        </div>

        <footer className="border-t border-divider px-6 py-4 shrink-0">
          <button type="button" onClick={onClose} className="ui-pill flex w-full items-center justify-center gap-1.5 bg-surface-deep px-4 py-2.5 text-[13.5px] font-bold text-ink-inverse hover:bg-accent-green">
            <CornerUpRight size={15} /> {email.cta ?? "Continue to the match"}
          </button>
        </footer>
      </div>

      {previewOpen && (
        <div className={cn("fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4 py-6")} onClick={() => setPreviewOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="ai-spring flex max-h-[90vh] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center gap-2 border-b border-divider px-5 py-3 shrink-0">
              <FileText size={15} className="text-[#a1232b]" />
              <span className="truncate text-[13px] font-bold text-ink">{fileName}</span>
              <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Close preview" className="ui-pill ml-auto flex h-7 w-7 items-center justify-center rounded-full text-mute hover:bg-surface-fog hover:text-ink"><X size={16} /></button>
            </header>
            <div className="overflow-y-auto p-4">{email.attachment}</div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
