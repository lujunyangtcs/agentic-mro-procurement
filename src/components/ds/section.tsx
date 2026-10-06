import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "white" | "mint" | "sage" | "rose" | "fog" | "deep" | "navy" | "dark";
const toneClass: Record<Tone, string> = {
  white: "bg-white text-black",
  mint: "bg-[color:var(--surface-mint)] text-black",
  sage: "bg-[color:var(--surface-sage)] text-black",
  rose: "bg-[color:var(--surface-rose)] text-black",
  fog: "bg-[color:var(--surface-fog)] text-black",
  deep: "bg-[color:var(--accent-green-deep)] text-white",
  navy: "bg-[color:var(--accent-navy)] text-white",
  dark: "bg-black text-white",
};

/**
 * Section — captured 80px section padding-top (§10).
 */
export function Section({
  children,
  tone = "white",
  className,
  id,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-[80px] px-6 md:px-12", toneClass[tone], className)}>
      <div className="mx-auto max-w-[1280px]">{children}</div>
    </section>
  );
}
