import * as React from "react";
import { X } from "lucide-react";
import { SpringIn } from "@/components/ai/SpringIn";
import { SourceLogo } from "@/components/brand/SourceLogo";
import type { SourceArtifact } from "@/data/runSteps";

/**
 * Opens a clickable source file as a centered modal — the same evidence card
 * the agent read, rendered full-size. Mirrors the OTM RawArtifactModal: a slim
 * header (label · meta · close) over a scrollable body holding the real doc.
 */
export function SourceArtifactModal({
  source,
  onClose,
}: {
  source: SourceArtifact | null;
  onClose: () => void;
}) {
  React.useEffect(() => {
    if (!source) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [source, onClose]);

  if (!source) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-[6vh]"
      onClick={onClose}
    >
      <SpringIn
        className="w-full max-w-[640px] max-h-[88vh] flex flex-col bg-surface-fog rounded-lg shadow-xl overflow-hidden"
      >
        <div onClick={(e) => e.stopPropagation()} className="flex flex-col min-h-0">
          <header className="flex items-center justify-between gap-4 px-5 py-3 bg-white border-b border-divider shrink-0">
            <div className="min-w-0">
              <div className="text-[14px] font-bold text-ink truncate">{source.label}</div>
              <div className="text-[11px] uppercase tracking-[0.06em] text-mute mt-0.5">
                {source.meta}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <SourceLogo kind={source.kind} />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="ui-pill w-8 h-8 rounded-full bg-surface-fog text-ink hover:bg-[#e3e8ef] flex items-center justify-center shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </header>
          <div className="overflow-y-auto p-4">{source.body}</div>
        </div>
      </SpringIn>
    </div>
  );
}
