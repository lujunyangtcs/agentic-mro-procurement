import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Typography primitives — DM Sans single-family stack (§2).
 * Tracking values come from §3 (-1.44px on H1) — scaled per heading.
 */

type Tone = "default" | "inverse" | "mute";
const toneClass: Record<Tone, string> = {
  default: "text-black",
  inverse: "text-white",
  mute: "text-[color:var(--mute)]",
};

export function Display({
  children,
  className,
  tone = "default",
  as: As = "h1",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
  as?: "h1" | "h2" | "div";
}) {
  return (
    <As
      className={cn(
        "font-bold text-[72px] leading-[80px] tracking-[-0.02em]",
        toneClass[tone],
        className
      )}
    >
      {children}
    </As>
  );
}

export function SectionHeading({
  children,
  className,
  tone = "default",
  as: As = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
  as?: "h2" | "h3" | "div";
}) {
  return (
    <As
      className={cn(
        "font-bold text-[48px] leading-[1.1] tracking-[-0.02em]",
        toneClass[tone],
        className
      )}
    >
      {children}
    </As>
  );
}

export function SubHeading({
  children,
  className,
  tone = "default",
  as: As = "h3",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
  as?: "h3" | "h4" | "div";
}) {
  return (
    <As
      className={cn(
        "font-bold text-[32px] leading-[1.2] tracking-[-0.01em]",
        toneClass[tone],
        className
      )}
    >
      {children}
    </As>
  );
}

export function Lead({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <p className={cn("text-[20px] leading-[28px] font-normal", toneClass[tone], className)}>
      {children}
    </p>
  );
}

export function Body({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <p className={cn("text-[14px] leading-[24px] font-normal", toneClass[tone], className)}>
      {children}
    </p>
  );
}

export function Eyebrow({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <span
      className={cn("text-[14px] leading-[20px] font-bold", toneClass[tone], className)}
    >
      {children}
    </span>
  );
}
