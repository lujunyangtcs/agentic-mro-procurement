import { useApp, type DocId } from "@/state";
import { AIDot } from "@/components/ai/AIDot";
import { FileText } from "lucide-react";

export type Artifact = { id: DocId; label: string; ref: string };

/* Every artifact the run produced, deep-linking to the document preview. */
export function ArtifactsRail({ items }: { items: Artifact[] }) {
  const { go } = useApp();
  return (
    <section className="bg-white border border-divider rounded-md overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-divider">
        <div className="flex items-center gap-2">
          <AIDot size={6} tone="deep" pulse />
          <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Audit artifacts
          </span>
        </div>
        <span className="text-[11px] text-mute">{items.length}</span>
      </header>
      <ul className="divide-y divide-divider">
        {items.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => go({ kind: "doc", id: d.id })}
              className="ui-pill w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-surface-mint/35"
            >
              <span className="w-7 h-7 rounded-md bg-surface-fog flex items-center justify-center shrink-0">
                <FileText size={14} strokeWidth={1.9} color="var(--accent-green-deep)" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-ink truncate">{d.label}</span>
                <span className="block text-[11px] text-mute">{d.ref}</span>
              </span>
              <span aria-hidden className="text-mute text-[13px]">
                ↗
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
