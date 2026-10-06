import { cn } from "@/lib/utils";

/**
 * 3-dot bouncing loader — the same vibe as ChatGPT / Claude "thinking"
 * pip. Used inline in the "AI is analyzing…" banner that appears between
 * workspace steps to add a beat before the next card lands.
 */
export function BouncingDots({
  className,
  tone = "deep",
  size = 6,
}: {
  className?: string;
  tone?: "deep" | "mint" | "ink-inverse";
  size?: number;
}) {
  const dot = tone === "mint" ? "bg-surface-mint" : tone === "ink-inverse" ? "bg-ink-inverse" : "bg-surface-deep";
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn("rounded-full", dot)}
          style={{
            width: size,
            height: size,
            animation: "hr-bounce 1100ms ease-in-out infinite",
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes hr-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </span>
  );
}
