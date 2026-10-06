import * as React from "react";
import { cn } from "@/lib/utils";
import { Display, Lead } from "./typography";

/**
 * Hero — captured anatomy (§3, §5).
 * Full-bleed dark hero with H1 + lead + pill CTAs anchored low-left.
 */
export function Hero({
  eyebrow,
  title,
  lead,
  cta,
  image,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  cta?: React.ReactNode;
  image?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden text-white bg-black",
        className
      )}
      style={{
        backgroundImage: image
          ? `linear-gradient(0deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2)), url(${image})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto max-w-[1456px] px-6 md:px-12 min-h-[600px] flex flex-col justify-center">
        {eyebrow && (
          <div className="text-[14px] font-bold mb-4 opacity-90">{eyebrow}</div>
        )}
        <Display tone="inverse" className="max-w-[800px]">
          {title}
        </Display>
        {lead && (
          <Lead tone="inverse" className="mt-8 max-w-[600px]">
            {lead}
          </Lead>
        )}
        {cta && <div className="mt-12 flex flex-wrap gap-4">{cta}</div>}
      </div>
    </section>
  );
}
