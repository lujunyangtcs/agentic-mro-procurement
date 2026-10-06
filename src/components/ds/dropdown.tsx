import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

/**
 * Dropdown — pill-shaped select trigger (§17). Used for chart-type / data-mode
 * pickers next to charts. Visual only — wire to a real menu primitive if needed.
 */
export function Dropdown({
  label,
  className,
}: {
  label: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-3 px-4 py-2 rounded-[9999px] bg-[color:var(--surface-fog)] hover:bg-[color:var(--divider)] text-[14px] font-bold transition-colors",
        className
      )}
    >
      {label}
      <ChevronDown className="w-4 h-4" />
    </button>
  );
}
