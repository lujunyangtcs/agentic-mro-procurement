import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * FeatureList — 2-col "intro left + features stacked right" pattern.
 * Captured §18 from Sustainability page ("We drive progress for people…").
 * Left: small heading + body + optional CTA. Right: H3+body items vertically stacked.
 */
export function FeatureList({
  introTitle,
  introBody,
  introCta,
  features,
  className,
}: {
  introTitle: React.ReactNode;
  introBody?: React.ReactNode;
  introCta?: React.ReactNode;
  features: { title: React.ReactNode; body: React.ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20", className)}>
      <div>
        <h3 className="text-[32px] font-bold tracking-[-0.02em] leading-[1.15] mb-6">
          {introTitle}
        </h3>
        {introBody && (
          <p className="text-[16px] leading-[26px] mb-6">{introBody}</p>
        )}
        {introCta}
      </div>
      <div className="space-y-12">
        {features.map((f, i) => (
          <div key={i}>
            <h4 className="text-[20px] font-bold tracking-[-0.01em] mb-3">{f.title}</h4>
            <p className="text-[14px] leading-[24px]">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
