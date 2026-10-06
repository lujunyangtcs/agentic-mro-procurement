import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * IconButton — round 50% icon button (§17, chart top-right cluster).
 * Variants:
 *   deep — accent-green-deep filled, white icon (default)
 *   dark — black filled, white icon
 *   fog  — fog filled, black icon
 *   ghost— transparent / current color
 */
type IconButtonVariant = "deep" | "dark" | "fog" | "green" | "ghost";
const variantClass: Record<IconButtonVariant, string> = {
  deep: "bg-[color:var(--accent-green-deep)] text-white hover:bg-[color:var(--accent-green)]",
  dark: "bg-black text-white hover:bg-[color:var(--accent-green-deep)]",
  fog: "bg-[color:var(--surface-fog)] text-black hover:bg-[color:var(--divider)]",
  green: "bg-[color:var(--accent-green)] text-white hover:bg-[color:var(--accent-green-deep)]",
  ghost: "bg-transparent text-current hover:bg-[color:var(--surface-fog)]",
};

export function IconButton({
  children,
  variant = "deep",
  size = 36,
  className,
  ...rest
}: {
  children: React.ReactNode;
  variant?: IconButtonVariant;
  size?: number;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      style={{ width: size, height: size }}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors",
        variantClass[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
