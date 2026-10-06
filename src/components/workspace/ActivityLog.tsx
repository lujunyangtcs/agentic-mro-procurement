import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AIDot } from "@/components/ai/AIDot";

export type ActivityEntry = { time: string; text: string };

/**
 * Activity log that streams entries in one at a time. When `live` is true,
 * each entry appears with a small delay. Newest entry is on top.
 */
export function ActivityLog({
  entries,
  live = true,
}: {
  entries: ActivityEntry[];
  live?: boolean;
}) {
  const [revealed, setRevealed] = useState(live ? 1 : entries.length);

  useEffect(() => {
    if (!live) return;
    setRevealed(1);
    if (entries.length <= 1) return;
    const ids: number[] = [];
    for (let i = 1; i < entries.length; i++) {
      ids.push(window.setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), i * 700));
    }
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [entries, live]);

  return (
    <section className="bg-white border border-divider rounded-md p-5">
      <header className="mb-3 flex items-center gap-2 leading-tight">
        <AIDot size={6} tone="green" pulse />
        <div className="text-[14px] font-bold text-ink">Recent activity</div>
        <span className="ml-auto text-[12px] text-mute">Live</span>
      </header>
      <ol className="space-y-2.5">
        {entries.slice(0, revealed).map((e, i) => (
          <li
            key={e.text}
            className="flex items-start gap-3 ai-stream"
            style={{ animationDelay: i === revealed - 1 ? "0ms" : "0ms" }}
          >
            <span className="text-[11px] text-mute w-12 shrink-0 pt-0.5">{e.time}</span>
            <span className={cn("text-[13px] text-ink leading-[18px]")}>{e.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
