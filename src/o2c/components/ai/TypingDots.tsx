/**
 * 3-dot "agent is typing" indicator. Used between chat bubbles to signal
 * the agent is working before its next message appears.
 */
export function TypingDots({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      aria-label="agent typing"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-mute"
          style={{
            animation: "hr-typing 1100ms ease-in-out infinite",
            animationDelay: `${i * 150}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes hr-typing {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </span>
  );
}
