import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

/**
 * Input — fog-filled, no border, no radius (§17 vendor inputs).
 */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full px-4 py-2.5 bg-[color:var(--surface-fog)] border-0 text-[14px] outline-none focus:bg-white focus:ring-2 focus:ring-black",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

/**
 * Select — fog-filled with chevron-down (§17).
 */
export function Select({
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full pl-4 pr-10 py-2.5 bg-[color:var(--surface-fog)] border-0 text-[14px] outline-none focus:bg-white focus:ring-2 focus:ring-black appearance-none cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
    </div>
  );
}

/**
 * Field — labeled wrapper.
 */
export function Field({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <div className="text-[12px] font-bold mb-1.5">{label}</div>
      {children}
    </label>
  );
}

/**
 * Checkbox — square 0px radius, no extra chrome.
 */
export function Checkbox({
  label,
  className,
  ...props
}: { label?: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("inline-flex items-center gap-2 text-[14px] cursor-pointer", className)}>
      <input
        type="checkbox"
        className="w-4 h-4 accent-black"
        {...props}
      />
      {label}
    </label>
  );
}
