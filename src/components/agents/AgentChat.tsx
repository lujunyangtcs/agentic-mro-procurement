import * as React from "react";
import { Bot, PanelRightClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIDot } from "@/components/ai/AIDot";
import { StreamingText } from "@/components/ai/StreamingText";
import { TypingDots } from "@/components/ai/TypingDots";

/* ──────────────────────────────────────────────────────────────────────────
 * AgentChat — the right-rail conversation panel on every agent console.
 *
 * Ported from hr-concierge's employee ChatPanel: bot-first greeting, chip-
 * driven turns, typewriter reveal on agent bubbles. Made self-contained and
 * script-driven — each agent passes its own `script`, so the same panel serves
 * Intake, Sourcing, PO, … without code changes. No global state dependency.
 * ────────────────────────────────────────────────────────────────────────── */

export type ChatBubble =
  | { kind: "user"; text: string }
  | {
      kind: "agent";
      text: string;
      tone?: "mint" | "fog";
      children?: React.ReactNode;
      /** Skip the typewriter and render immediately. */
      instant?: boolean;
    };

export type ChatTurn = {
  /** Agent bubbles fired for this turn. */
  reply: ChatBubble[];
  /** Chips offered after this reply; clicking one sends it and advances. */
  chips?: string[];
};

const AGENT_REPLY_MS = 1600;

function BubbleView({ bubble }: { bubble: ChatBubble }) {
  if (bubble.kind === "user") {
    return (
      <div className="flex justify-end">
        <div className="ai-spring max-w-[78%] bg-surface-deep text-ink-inverse rounded-2xl px-4 py-2.5 text-[13.5px]">
          {bubble.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "ai-spring max-w-[92%] rounded-2xl px-4 py-2.5 text-[13.5px] text-ink space-y-2.5",
          bubble.tone === "fog" ? "bg-surface-fog" : "bg-surface-mint",
        )}
      >
        <div>
          {bubble.instant ? bubble.text : <StreamingText text={bubble.text} cps={140} caret={false} />}
        </div>
        {bubble.children}
      </div>
    </div>
  );
}

export function AgentChat({
  agentName,
  script,
  replyTypical = "instant",
  onHide,
  onReachTurn,
}: {
  agentName: string;
  script: ChatTurn[];
  /** Footer subtext, e.g. "instant" or "3s typical reply". */
  replyTypical?: string;
  /** When set, a collapse icon appears top-right and calls this to hide the panel. */
  onHide?: () => void;
  /** Fires with the index of each turn as its reply lands — lets the host script side effects (e.g. a PR modal). */
  onReachTurn?: (turnIdx: number) => void;
}) {
  const [bubbles, setBubbles] = React.useState<ChatBubble[]>([]);
  const [draft, setDraft] = React.useState("");
  const [agentTyping, setAgentTyping] = React.useState(false);
  const [turnIdx, setTurnIdx] = React.useState(0);
  const [activeChips, setActiveChips] = React.useState<string[] | null>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  // Keep the latest onReachTurn without retriggering the greeting effect.
  const onReachTurnRef = React.useRef(onReachTurn);
  React.useEffect(() => {
    onReachTurnRef.current = onReachTurn;
  });

  // Greeting fires on mount — brief typing indicator, then turn 0's reply + chips.
  React.useEffect(() => {
    setBubbles([]);
    setActiveChips(null);
    setTurnIdx(0);
    setAgentTyping(true);
    const t = window.setTimeout(() => {
      setAgentTyping(false);
      setBubbles([...script[0].reply]);
      setActiveChips(script[0].chips ?? null);
      setTurnIdx(1);
      onReachTurnRef.current?.(0);
    }, 650);
    return () => window.clearTimeout(t);
  }, [script]);

  // Keep pinned to the bottom as content changes.
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [bubbles, agentTyping, activeChips]);

  const send = (overrideText?: string) => {
    const msg = (overrideText ?? draft).trim();
    if (!msg) return;
    const turn = script[turnIdx];
    if (!turn) return;
    setBubbles((b) => [...b, { kind: "user", text: msg }]);
    setDraft("");
    setActiveChips(null);
    setAgentTyping(true);
    const firedTurn = turnIdx;
    window.setTimeout(() => {
      setAgentTyping(false);
      setBubbles((b) => [...b, ...turn.reply]);
      setActiveChips(turn.chips ?? null);
      setTurnIdx((i) => i + 1);
      onReachTurnRef.current?.(firedTurn);
    }, AGENT_REPLY_MS);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const conversationDone = turnIdx >= script.length;

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-divider shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-surface-deep text-ink-inverse flex items-center justify-center">
            <Bot size={16} strokeWidth={1.8} />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <AIDot size={6} tone="green" pulse />
              <span className="text-[13px] font-bold text-ink">{agentName}</span>
            </div>
            <span className="text-[11px] text-mute">online · {replyTypical}</span>
          </div>
        </div>
        {onHide && (
          <button
            type="button"
            onClick={onHide}
            aria-label="Hide chat"
            title="Hide chat"
            className="ui-pill w-8 h-8 rounded-full text-mute hover:bg-surface-fog hover:text-ink flex items-center justify-center shrink-0"
          >
            <PanelRightClose size={16} />
          </button>
        )}
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 space-y-3.5">
          {bubbles.map((b, i) => (
            <BubbleView key={i} bubble={b} />
          ))}
          {agentTyping && (
            <div className="flex justify-start">
              <div className="bg-surface-mint rounded-2xl px-4 py-3">
                <TypingDots />
              </div>
            </div>
          )}
          {activeChips && !agentTyping && (
            <div className="flex flex-wrap gap-2 pl-1">
              {activeChips.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => send(label)}
                  className="ui-pill px-3 py-1.5 rounded-full text-[12.5px] font-medium border-[1.5px] border-ink bg-white text-ink hover:bg-surface-mint/60"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-divider px-3 py-3 shrink-0">
        <div className="flex items-end gap-2 bg-surface-fog rounded-2xl px-3 py-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            disabled={conversationDone || agentTyping}
            rows={1}
            placeholder={
              conversationDone
                ? "All done — ask anything else later."
                : activeChips
                  ? "Tap an option, or type a message…"
                  : "Send a message…"
            }
            className="flex-1 resize-none bg-transparent outline-none text-[13.5px] text-ink placeholder:text-mute leading-snug py-1.5 max-h-32"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={conversationDone || agentTyping || !draft.trim()}
            className="w-9 h-9 rounded-full bg-black text-ink-inverse flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send"
          >
            ↑
          </button>
        </div>
      </footer>
    </div>
  );
}
