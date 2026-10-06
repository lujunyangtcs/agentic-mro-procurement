import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Tabs — uppercase pill tabs (§17, share-perf "SHARE PRICE LOOKUP / DOWNLOAD").
 * Visual only — wire content yourself.
 */
export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: { id: string; label: string }[];
  value?: string;
  onChange?: (v: string) => void;
  className?: string;
}) {
  const [internal, setInternal] = React.useState(value ?? items[0]?.id);
  const selected = value ?? internal;
  return (
    <div className={cn("inline-flex gap-2 border-b border-[color:var(--divider)]", className)}>
      {items.map((t) => {
        const active = t.id === selected;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setInternal(t.id);
              onChange?.(t.id);
            }}
            className={cn(
              "px-4 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition-colors -mb-px border-b-2",
              active
                ? "bg-[color:var(--surface-fog)] text-black border-black"
                : "bg-transparent text-[color:var(--mute)] border-transparent hover:text-black"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
