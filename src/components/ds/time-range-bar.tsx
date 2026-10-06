import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * TimeRangeBar — uppercase pill row (§17, share-perf chart header).
 * Pattern: TODAY · 1 WK · 1 MO · 3 MO · 6 MO · 1 YR · 3 YR · CUSTOM.
 */
export function TimeRangeBar({
  options,
  value,
  onChange,
  className,
}: {
  options: string[];
  value?: string;
  onChange?: (v: string) => void;
  className?: string;
}) {
  const [internal, setInternal] = React.useState(value ?? options[0]);
  const selected = value ?? internal;
  return (
    <div className={cn("inline-flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const active = o === selected;
        return (
          <button
            key={o}
            type="button"
            onClick={() => {
              setInternal(o);
              onChange?.(o);
            }}
            className={cn(
              "px-3 py-1.5 rounded-[9999px] text-[13px] font-bold uppercase tracking-[0.04em] transition-colors",
              active
                ? "bg-black text-white"
                : "bg-[color:var(--surface-fog)] text-black hover:bg-[color:var(--divider)]"
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
