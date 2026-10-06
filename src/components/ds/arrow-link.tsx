import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, ExternalLink } from "lucide-react";

/**
 * ArrowLink — text-link with trailing arrow icon, captured across multiple pages
 * ("Discover more →", "Read more on science & research →"). Bold 14px,
 * sentence case, no underline by default, hover translates arrow.
 */
export function ArrowLink({
  children,
  href = "#",
  external = false,
  className,
}: {
  children: React.ReactNode;
  href?: string;
  external?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-[14px] font-bold hover:underline underline-offset-4",
        className
      )}
    >
      {children}
      {external ? (
        <ExternalLink className="w-4 h-4" />
      ) : (
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      )}
    </a>
  );
}
