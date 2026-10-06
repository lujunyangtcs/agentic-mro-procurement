import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

/**
 * PhotoCard — captured business-unit card primitive (§12).
 * Flat (0 radius, no border, no shadow). Photo as bg; H3 + link overlay bottom-left.
 */
export function PhotoCard({
  title,
  href = "#",
  image,
  ratio = "portrait",
  className,
}: {
  title: React.ReactNode;
  href?: string;
  image?: string;
  ratio?: "portrait" | "square" | "landscape";
  className?: string;
}) {
  const ratioClass =
    ratio === "portrait"
      ? "aspect-[3/4]"
      : ratio === "square"
        ? "aspect-square"
        : "aspect-[4/3]";
  return (
    <a
      href={href}
      className={cn(
        "relative block overflow-hidden text-white rounded-[0px] group",
        ratioClass,
        className
      )}
      style={{
        backgroundImage: image
          ? `linear-gradient(0deg, rgba(0,0,0,0.45), rgba(0,0,0,0.05)), url(${image})`
          : undefined,
        backgroundColor: "#084337",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
        <h3 className="font-bold text-[32px] md:text-[48px] leading-[1.05] tracking-[-0.02em]">
          {title}
        </h3>
        <span className="mt-4 inline-flex items-center gap-2 text-[14px] font-bold">
          Discover more
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </a>
  );
}

/**
 * FlatCard — light-surface text-only card (no photo).
 */
export function FlatCard({
  title,
  body,
  href = "#",
  className,
}: {
  title: React.ReactNode;
  body: React.ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "block p-8 bg-white border border-[color:var(--divider)] hover:border-black transition-colors",
        className
      )}
    >
      <h3 className="font-bold text-[24px] leading-[1.2] tracking-[-0.01em] mb-4">
        {title}
      </h3>
      <p className="text-[14px] leading-[24px] text-[color:var(--mute)]">{body}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-[14px] font-bold">
        Discover more
        <ArrowRight className="w-4 h-4" />
      </span>
    </a>
  );
}
