import {
  Mail,
  FileText,
  ScrollText,
  Wallet,
  Building2,
  Globe,
  FileCode2,
  BookOpen,
  ReceiptText,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SourceLogo } from "@/components/brand/SourceLogo";
import type { SourceArtifact, SourceKind } from "@/data/runSteps";

const kindIcon: Record<SourceKind, LucideIcon> = {
  sap: FileText,
  email: Mail,
  contract: ScrollText,
  policy: ScrollText,
  budget: Wallet,
  master: Building2,
  external: Globe,
  edi: FileCode2,
  kb: BookOpen,
  invoice: ReceiptText,
};

export function SourceFilesPanel({
  sources,
  onOpen,
  newSourceId,
}: {
  sources: SourceArtifact[];
  onOpen: (s: SourceArtifact) => void;
  /** Id of a source that just landed (e.g. a supplier reply) — highlighted. */
  newSourceId?: string;
}) {
  return (
    <aside className="bg-white border border-divider rounded-md overflow-hidden flex flex-col shrink-0">
      <div className="px-4 pt-4 pb-3 border-b border-divider">
        <div className="text-[11px] uppercase tracking-[0.08em] text-mute font-medium">
          Source files
        </div>
        <div className="text-[15px] font-bold text-ink mt-0.5">
          {sources.length} inputs · click to inspect
        </div>
        {newSourceId && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-surface-deep">
            <span className="w-1.5 h-1.5 rounded-full bg-surface-deep ai-pulse" />
            Reply just landed from the agent&apos;s email
          </div>
        )}
      </div>

      <ul className="p-2 space-y-1.5">
        {sources.map((s) => {
          const Icon = kindIcon[s.kind];
          const isNew = s.id === newSourceId;
          return (
            <li key={s.id} className={cn(isNew && "ai-spring")}>
              <button
                type="button"
                onClick={() => onOpen(s)}
                className={cn(
                  "ui-pill group w-full text-left rounded-md border px-3 py-2.5",
                  "flex items-start gap-3 hover:border-surface-deep hover:bg-surface-fog",
                  isNew
                    ? "border-surface-deep/50 bg-surface-mint/45 ring-1 ring-surface-deep/30"
                    : "border-divider",
                )}
              >
                <span
                  className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                    isNew ? "bg-surface-deep text-ink-inverse" : "bg-surface-mint/60 text-surface-deep",
                  )}
                >
                  <Icon size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-ink leading-tight truncate">
                      {s.label}
                    </span>
                    {isNew ? (
                      <span className="text-[9px] uppercase tracking-[0.06em] bg-surface-deep text-ink-inverse px-1 py-0.5 rounded shrink-0">
                        new
                      </span>
                    ) : (
                      s.handoff && (
                        <span className="text-[9px] uppercase tracking-[0.06em] bg-surface-deep text-ink-inverse px-1 py-0.5 rounded shrink-0">
                          handoff
                        </span>
                      )
                    )}
                  </span>
                  <span className="block text-[11px] text-mute leading-snug mt-0.5 truncate">
                    {s.meta}
                  </span>
                </span>
                <span className="shrink-0 mt-0.5">
                  <SourceLogo kind={s.kind} />
                </span>
                <ArrowRight
                  size={14}
                  className="text-mute opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1.5 -ml-1"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
