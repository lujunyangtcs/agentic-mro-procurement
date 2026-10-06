import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type AutoAction = { label: string };

export function AutoActions({
  items,
  /** Once executing=true, items tick through to ✓ one by one. */
  executing,
  title = "Tasks ready to run",
  subIdle = "Will run when you approve",
  subExecuting = "Executing…",
  subDone = "All done · audit logged",
}: {
  items: AutoAction[];
  executing: boolean;
  title?: string;
  subIdle?: string;
  subExecuting?: string;
  subDone?: string;
}) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (!executing) {
      setDone(0);
      return;
    }
    if (done >= items.length) return;
    const t = window.setTimeout(() => setDone((d) => d + 1), 600);
    return () => window.clearTimeout(t);
  }, [executing, done, items.length]);

  const allDone = executing && done >= items.length;
  return (
    <section className="bg-white border border-divider rounded-md p-5">
      <header className="mb-3 leading-tight">
        <div className="text-[14px] font-bold text-ink">{title}</div>
        <div className="text-[12px] text-mute">
          {allDone ? subDone : executing ? subExecuting : subIdle}
        </div>
      </header>
      <ul className="space-y-2.5">
        {items.map((it, i) => {
          const isDone = i < done;
          return (
            <li key={it.label} className="flex items-center gap-2.5">
              <span
                className={cn(
                  "w-4 h-4 rounded-sm border-[1.5px] flex items-center justify-center text-[11px]",
                  isDone
                    ? "bg-surface-deep border-surface-deep text-ink-inverse"
                    : "bg-white border-ink",
                )}
              >
                {isDone ? "✓" : ""}
              </span>
              <span className={cn("text-[13px]", isDone ? "text-mute line-through" : "text-ink")}>
                {it.label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
