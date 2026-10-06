import { cn } from "@/lib/utils";

/**
 * Tiny CSS spinner for the active step circle. The spec is: 2px stroke,
 * 270° visible arc, ~900ms rotation. Matches the Predictive-Risk-Agent's
 * active-step look.
 */
export function Spinner({
  size = 16,
  className,
  tone = "deep",
}: {
  size?: number;
  className?: string;
  tone?: "deep" | "ink-inverse" | "mint";
}) {
  const colour =
    tone === "ink-inverse"
      ? "var(--ink-inverse)"
      : tone === "mint"
        ? "var(--surface-mint)"
        : "var(--accent-green-deep)";
  const faint = `color-mix(in srgb, ${colour} 20%, transparent)`;
  return (
    <span
      className={cn("inline-block", className)}
      style={{
        width: size,
        height: size,
        borderWidth: "2px",
        borderStyle: "solid",
        borderTopColor: colour,
        borderRightColor: faint,
        borderBottomColor: faint,
        borderLeftColor: faint,
        borderRadius: "9999px",
        animation: "hr-spin 900ms linear infinite",
      }}
      aria-hidden
    >
      <style>{`
        @keyframes hr-spin { to { transform: rotate(360deg); } }
      `}</style>
    </span>
  );
}
