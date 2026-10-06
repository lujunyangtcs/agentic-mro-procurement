import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * EditorialPair — 2-col image/text block, common across our-company page (§18).
 * Photo on one side, H2 + body + arrow-link on the other.
 */
export function EditorialPair({
  image,
  imageSide = "left",
  eyebrow,
  title,
  body,
  cta,
  className,
}: {
  image: React.ReactNode;     // <img> or a styled <div>
  imageSide?: "left" | "right";
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  body: React.ReactNode;
  cta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center",
        className
      )}
    >
      <div className={cn(imageSide === "right" && "md:order-2")}>{image}</div>
      <div>
        {eyebrow && (
          <div className="text-[12px] uppercase tracking-[0.08em] font-bold text-[color:var(--accent-green)] mb-4">
            {eyebrow}
          </div>
        )}
        <h2 className="text-[48px] leading-[1.05] tracking-[-0.02em] font-bold mb-6">
          {title}
        </h2>
        <div className="text-[16px] leading-[26px] text-current/90">{body}</div>
        {cta && <div className="mt-6">{cta}</div>}
      </div>
    </div>
  );
}
