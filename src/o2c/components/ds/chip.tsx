import * as React from "react";
import { cn } from "@/o2c/lib/utils";

/**
 * Chip — fog-filled pill label (§17, share-perf page).
 * Used for status tags, region badges, company-name-style labels.
 *
 * Variants:
 *   fog  — light grey fill (default, company-name style)
 *   mint — soft mint fill
 *   green— filled brand green
 *   dark — black fill, white text
 *   outline — transparent + 1.5px current-color border
 *   ghost— transparent (just text, useful in tag groups)
 */
type ChipVariant = "fog" | "mint" | "sage" | "rose" | "green" | "deep" | "navy" | "dark" | "outline" | "ghost";

const variantClass: Record<ChipVariant, string> = {
  fog: "bg-[color:var(--surface-fog)] text-black",
  mint: "bg-[color:var(--surface-mint)] text-[color:var(--accent-green-deep)]",
  sage: "bg-[color:var(--surface-sage)] text-black",
  rose: "bg-[color:var(--surface-rose)] text-black",
  green: "bg-[color:var(--accent-green)] text-white",
  deep: "bg-[color:var(--accent-green-deep)] text-white",
  navy: "bg-[color:var(--accent-navy)] text-white",
  dark: "bg-black text-white",
  outline: "bg-transparent text-current border-[1.5px] border-current",
  ghost: "bg-transparent text-current",
};

export function Chip({
  children,
  variant = "fog",
  uppercase = false,
  className,
}: {
  children: React.ReactNode;
  variant?: ChipVariant;
  uppercase?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9999px] text-[14px] font-bold whitespace-nowrap",
        uppercase && "uppercase tracking-[0.04em]",
        variantClass[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
