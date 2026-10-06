import * as React from "react";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "./breadcrumbs";
import { Display, Lead } from "./typography";

/**
 * SubPageHero — sub-page hero variant (captured §18 our-company, careers,
 * sustainability, share-performance). H1 stays at 72px display per evidence,
 * but layout supports breadcrumbs + offset lead + optional CTA.
 *
 * Layout variants:
 *   centered — title left, lead below (default)
 *   split    — title left, lead offset right (our-company pattern)
 *   stacked  — title only above breadcrumbs (careers pattern)
 */
type Layout = "centered" | "split" | "stacked";

export function SubPageHero({
  breadcrumbs,
  title,
  lead,
  cta,
  image,
  layout = "centered",
  minHeight = 600,
  className,
}: {
  breadcrumbs?: { label: string; href?: string }[];
  title: React.ReactNode;
  lead?: React.ReactNode;
  cta?: React.ReactNode;
  image?: string;
  layout?: Layout;
  minHeight?: number;
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
        minHeight,
      }}
    >
      <div
        className="mx-auto max-w-[1456px] px-6 md:px-12 flex flex-col justify-center"
        style={{ minHeight }}
      >
        {breadcrumbs && (
          <Breadcrumbs tone="inverse" trail={breadcrumbs} className="mb-8" />
        )}
        {layout === "split" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <Display tone="inverse" className="max-w-[600px]">
              {title}
            </Display>
            {lead && (
              <Lead tone="inverse" className="md:pl-6 max-w-[420px]">
                {lead}
              </Lead>
            )}
          </div>
        ) : (
          <>
            <Display tone="inverse" className="max-w-[900px]">
              {title}
            </Display>
            {lead && (
              <Lead tone="inverse" className="mt-6 max-w-[600px]">
                {lead}
              </Lead>
            )}
          </>
        )}
        {cta && <div className="mt-10 flex flex-wrap gap-4">{cta}</div>}
      </div>
    </section>
  );
}
