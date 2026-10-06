import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * BigQuote — editorial pull quote, used in big-statement sections.
 * Captured pattern: oversized sentence-case bold black text on mint/sage/rose surface,
 * editorial cadence (periods between words: "People. Planet. Progress.").
 */
export function BigQuote({
  children,
  attribution,
  size = "lg",
  className,
}: {
  children: React.ReactNode;
  attribution?: React.ReactNode;
  size?: "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClass = {
    md: "text-[48px] leading-[1.05] tracking-[-0.02em]",
    lg: "text-[64px] leading-[1.05] tracking-[-0.02em]",
    xl: "text-[80px] leading-[1.02] tracking-[-0.02em]",
  }[size];
  return (
    <figure className={cn(className)}>
      <blockquote className={cn("font-bold", sizeClass)}>
        {children}
      </blockquote>
      {attribution && (
        <figcaption className="mt-6 text-[14px] font-bold opacity-80">
          {attribution}
        </figcaption>
      )}
    </figure>
  );
}
