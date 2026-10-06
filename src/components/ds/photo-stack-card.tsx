import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, ExternalLink } from "lucide-react";

/**
 * PhotoStackCard — photo on top, title BELOW (sentence case, 32px), arrow link below.
 * Captured §18 from Careers page ("Manufacturing / Marketing & Sales / Supply Chain").
 *
 * Different from <PhotoCard> which overlays title on top of photo. PhotoStack separates them.
 */
export function PhotoStackCard({
  title,
  href = "#",
  image,
  linkLabel = "View roles",
  external = false,
  ratio = "landscape",
  className,
}: {
  title: React.ReactNode;
  href?: string;
  image?: string;
  linkLabel?: React.ReactNode;
  external?: boolean;
  ratio?: "square" | "portrait" | "landscape";
  className?: string;
}) {
  const ratioClass =
    ratio === "portrait"
      ? "aspect-[3/4]"
      : ratio === "square"
        ? "aspect-square"
        : "aspect-[4/3]";
  return (
    <a href={href} className={cn("group block", className)}>
      <div
        className={cn("w-full", ratioClass, "bg-[color:var(--surface-fog)]")}
        style={{
          backgroundImage: image ? `url(${image})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <h3 className="mt-5 text-[32px] font-bold tracking-[-0.02em] leading-[1.1]">
        {title}
      </h3>
      <span className="mt-3 inline-flex items-center gap-2 text-[14px] font-bold">
        {linkLabel}
        {external ? (
          <ExternalLink className="w-4 h-4" />
        ) : (
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        )}
      </span>
    </a>
  );
}
