import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/mro/lib/utils";

/**
 * Button — captured from the source enterprise design system (§5–§7).
 *
 *   primary   : white fill / black text / pill 9999px / 16px / 700 / sentence-case
 *   secondary : transparent / current-color text / 1.5px outline / pill / 14px / 700
 *   inline    : text-link with arrow, 14px / 700, transparent bg
 *
 * NO uppercase, NO wide tracking. Sentence case is brand.
 */
const buttonVariants = cva(
  "ui-pill inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent-green)]",
  {
    variants: {
      variant: {
        primary:
          "bg-white text-black border-[1.5px] border-transparent hover:bg-[color:var(--surface-fog)]",
        secondary:
          "bg-transparent text-current border-[1.5px] border-current hover:bg-white/10",
        outline:
          "bg-transparent text-black border-[1.5px] border-black hover:bg-black hover:text-white",
        dark: "bg-black text-white border-[1.5px] border-transparent hover:bg-[color:var(--accent-green-deep)]",
        deep:
          "bg-[color:var(--accent-green-deep)] text-white border-[1.5px] border-transparent hover:bg-[color:var(--accent-green)]",
        green:
          "bg-[color:var(--accent-green)] text-white border-[1.5px] border-transparent hover:bg-[color:var(--accent-green-deep)]",
        sage:
          "bg-[color:var(--surface-sage)] text-black border-[1.5px] border-transparent hover:bg-[color:var(--accent-green)] hover:text-white",
        inline:
          "ui-pill-none text-current bg-transparent border-0 p-0 hover:underline underline-offset-4",
      },
      size: {
        primary: "text-[16px] py-[9px] pl-[15px] pr-[21px] rounded-[9999px]",
        secondary: "text-[14px] py-[9px] px-[15px] rounded-[9999px]",
        none: "text-[14px] p-0 rounded-none",
      },
    },
    compoundVariants: [
      { variant: "inline", size: ["primary", "secondary"], class: "p-0 bg-transparent border-0 rounded-none" },
    ],
    defaultVariants: { variant: "primary", size: "primary" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
