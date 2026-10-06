import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

/**
 * Breadcrumbs — captured pattern from share-performance page.
 * 14px / 400 / current-color, '>' chevron separator.
 */
export function Breadcrumbs({
  trail,
  tone = "default",
  className,
}: {
  trail: { label: string; href?: string }[];
  tone?: "default" | "inverse";
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "flex items-center gap-2 text-[14px] font-normal",
        tone === "inverse" ? "text-white" : "text-black",
        className
      )}
      aria-label="Breadcrumb"
    >
      {trail.map((c, i) => {
        const last = i === trail.length - 1;
        return (
          <React.Fragment key={i}>
            {c.href && !last ? (
              <a href={c.href} className="hover:underline underline-offset-4">
                {c.label}
              </a>
            ) : (
              <span className={cn(last && "font-bold")}>{c.label}</span>
            )}
            {!last && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
