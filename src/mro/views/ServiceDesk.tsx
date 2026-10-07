/**
 * Service desk — the buyer's end of the supplier conversation, as a
 * conversation.
 *
 * Left: the same transcript the supplier sees, from the buyer's chair. Every
 * bubble shows the conversation in the language it actually happened in —
 * the supplier's original words, the assistant's reply in that language —
 * and under each one sits a small AI summary box in English, so the buyer
 * never has to guess. Right: the questions the assistant refused to answer,
 * each with its drafted replies. Clicking a reply answers in the portal and
 * lands in the chat; the envelope drafts the same reply as an email — the
 * agent visibly writes it, you send it, and the chat records it.
 */

import * as React from "react";
import { Send, Clock, Mail, Bot, ShieldAlert, Truck, Sparkles } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { useProcurement, type SupplierCase } from "@/mro/data/store";
import {
  supplier,
  supplierQuestions,
  answerFor,
  answerSummaryFor,
  PENDING_TEXT,
} from "@/mro/data/supplier";
import { LANGUAGES, type Lang } from "@/mro/data/procurement";
import { ConsolePage, StatTiles, Panel } from "@/mro/components/console/kit";
import { icons, TileIcon } from "@/mro/components/console/icons";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { AIDot } from "@/mro/components/ai/AIDot";
import { EmailDraftModal } from "@/mro/components/workspace/EmailDraftModal";

const toneStyle = {
  hold: { label: "Holds the agreement", cls: "bg-surface-fog text-ink" },
  offer: { label: "Offers a trade", cls: "bg-surface-mint text-surface-deep" },
  concede: { label: "Gives ground", cls: "bg-surface-rose text-mark-red" },
};

const langOf = (code: Lang) => LANGUAGES.find((l) => l.code === code)!;

/** A reply reads better as two paragraphs than as one wall of sentences. */
const fold = (text: string): string[] =>
  text.split(". ").reduce<string[]>((acc, sentence, i, all) => {
    const half = Math.ceil(all.length / 2);
    const idx = i < half ? 0 : 1;
    acc[idx] = acc[idx] ? `${acc[idx]}. ${sentence}` : sentence;
    return acc;
  }, []);

/* ── The transcript, from the buyer's chair ─────────────────────────────── */

type Turn =
  | { who: "supplier"; text: string; lang: Lang; summary?: string }
  | { who: "assistant"; text: string; lang: Lang; summary?: string }
  | { who: "pending"; caseId: string; reason: string }
  | { who: "us"; text: string; channel: "portal" | "email"; summary?: string };

/** The small English box under a bubble — what the line says, at a glance. */
function SummaryBox({ text, alignEnd }: { text: string; alignEnd?: boolean }) {
  return (
    <div
      className={cn(
        "mt-1.5 flex max-w-[80%] items-start gap-1.5 rounded-md border border-surface-mint bg-surface-mint/35 px-2.5 py-1.5",
        alignEnd && "self-end",
      )}
    >
      <span className="mt-[1px] shrink-0 text-surface-deep ai-pulse">
        <Sparkles size={12} strokeWidth={1.75} />
      </span>
      <p className="text-[12px] leading-[16px] text-ink">
        <strong className="font-bold">Summary</strong> — {text}
      </p>
    </div>
  );
}

function Bubble({ turn }: { turn: Turn }) {
  if (turn.who === "us") {
    return (
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2 pb-1">
          <span className="inline-flex items-center gap-1 whitespace-nowrap bg-surface-fog px-2 py-0.5 text-[12px] text-ink">
            {turn.channel === "email" ? <Mail size={11} /> : null}
            {turn.channel === "email" ? "sent by email" : "sent in the portal"}
          </span>
          <span className="text-[12px] font-semibold text-ink">You</span>
        </div>
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-surface-deep px-4 py-3">
          <p className="text-[13px] leading-[19px] text-ink-inverse">{turn.text}</p>
        </div>
        {turn.summary && <SummaryBox text={turn.summary} alignEnd />}
      </div>
    );
  }

  if (turn.who === "supplier") {
    const src = langOf(turn.lang);
    return (
      <SpringIn className="flex gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-navy">
          <Truck size={15} className="text-ink-inverse" />
        </span>
        <div className="flex min-w-0 max-w-[80%] flex-col">
          <div className="flex items-center gap-2 pb-1">
            <span className="text-[12px] font-semibold text-ink">{supplier.name}</span>
            <span className="whitespace-nowrap bg-surface-mint px-2 py-0.5 text-[12px] font-medium text-surface-deep">
              {src.emoji} wrote in {src.native}
            </span>
          </div>
          <div className="rounded-2xl rounded-tl-sm border border-divider bg-white px-4 py-3">
            <p className="text-[13px] leading-[19px] text-ink">{turn.text}</p>
          </div>
          {turn.summary && <SummaryBox text={turn.summary} />}
        </div>
      </SpringIn>
    );
  }

  if (turn.who === "pending") {
    return (
      <SpringIn className="flex gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-mint">
          <Bot size={15} className="text-surface-deep" />
        </span>
        <div className="min-w-0 max-w-[80%]">
          <div className="flex items-center gap-2 pb-1">
            <span className="text-[12px] font-semibold text-ink">Assistant</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-surface-rose px-2.5 py-0.5 text-[12px] font-medium text-mark-red">
              <Clock size={11} />
              Waiting on you
            </span>
          </div>
          <div className="rounded-2xl rounded-tl-sm border border-mark-red/25 bg-surface-rose/35 px-4 py-3">
            <p className="text-[13px] leading-[19px] text-ink">
              I did not answer {turn.caseId} — {turn.reason} Pick a drafted reply on the right, or
              write your own below.
            </p>
          </div>
        </div>
      </SpringIn>
    );
  }

  const src = langOf(turn.lang);
  return (
    <SpringIn className="flex gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-mint">
        <Bot size={15} className="text-surface-deep" />
      </span>
      <div className="flex min-w-0 max-w-[80%] flex-col">
        <div className="flex items-center gap-2 pb-1">
          <span className="text-[12px] font-semibold text-ink">Assistant</span>
          {turn.lang !== "en" && (
            <span className="whitespace-nowrap bg-surface-mint px-2 py-0.5 text-[12px] font-medium text-surface-deep">
              {src.emoji} replied in {src.native}
            </span>
          )}
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-divider bg-white px-4 py-3">
          <p className="text-[13px] leading-[19px] text-ink">{turn.text}</p>
        </div>
        {turn.summary && <SummaryBox text={turn.summary} />}
      </div>
    </SpringIn>
  );
}

/* ── One pending case on the rail — its drafted replies ─────────────────── */

function SuggestionCard({
  c,
  arrowTop = 24,
  open,
  onToggle,
  onPortal,
  onEmail,
}: {
  c: SupplierCase;
  /** Where the pointer sits — level with the bubble this card answers. */
  arrowTop?: number;
  /**
   * Only one card shows its drafted replies at a time. Three open cards are
   * taller than the stretch of conversation they answer, which pushes each
   * one below its own bubble — so the rest collapse to a header the buyer
   * can click when they get to it.
   */
  open: boolean;
  onToggle: () => void;
  onPortal: (body: string, index: number) => void;
  onEmail: (body: string, label: string, index: number) => void;
}) {
  const spec = supplierQuestions.find((q) => q.id === c.questionId);
  const options = spec?.recommended ?? [];

  return (
    <SpringIn>
      <section className="relative rounded-md border border-divider bg-white shadow-sm">
        {/* The pointer — this card answers THAT bubble, and the reply lands there. */}
        <span
          aria-hidden
          style={{ top: arrowTop }}
          className="absolute -left-[7px] z-10 h-3.5 w-3.5 rotate-45 border-b border-l border-divider bg-white transition-[top] duration-200 ease-out"
        />
        <header className="flex items-center gap-2 border-b border-divider px-4 py-2.5">
          <span className="text-[14px] font-bold text-ink">{c.id}</span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-surface-rose px-2.5 py-0.5 text-[12px] font-medium text-mark-red">
            <ShieldAlert size={11} />
            Strategic
          </span>
          <span className="ml-auto whitespace-nowrap text-[12px] text-ink">{c.raisedAt}</span>
        </header>

        {!open && (
          <button
            type="button"
            onClick={onToggle}
            className="ui-pill flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-surface-mint/25"
          >
            <Sparkles size={13} className="shrink-0 text-surface-deep" />
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
              {options.length} drafted replies · {options[0]?.label}
            </span>
            <span className="shrink-0 text-[12px] font-bold text-surface-deep">Open</span>
          </button>
        )}

        <div className={cn("space-y-2 px-4 py-2.5", !open && "hidden")}>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-surface-deep ai-pulse">
              <Sparkles size={13} strokeWidth={1.75} />
            </span>
            <p className="text-[12.5px] leading-[17px] font-medium text-ink">
              Drafted replies — click to answer in the portal, or ✉ to email it.
            </p>
          </div>

          {options.map((o, i) => {
            const tone = toneStyle[o.tone];
            return (
              <div
                key={o.label}
                className="group rounded-md border border-divider transition-colors hover:border-surface-deep/45 hover:bg-surface-mint/25"
              >
                <button
                  type="button"
                  onClick={() => onPortal(o.body.en, i)}
                  className="ui-pill w-full px-3.5 pb-0.5 pt-1.5 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-ink">{o.label}</span>
                    {i === 0 && (
                      <span className="whitespace-nowrap bg-surface-deep px-2 py-0.5 text-[11px] font-medium text-ink-inverse">
                        Suggested
                      </span>
                    )}
                    <span
                      className={cn(
                        "ml-auto whitespace-nowrap px-2 py-0.5 text-[11px] font-medium",
                        tone.cls,
                      )}
                    >
                      {tone.label}
                    </span>
                  </div>
                  {i === 0 && (
                    <p className="mt-0.5 text-[12px] leading-[16px] text-ink line-clamp-2">
                      {o.body.en}
                    </p>
                  )}
                </button>
                <div className="flex justify-end px-2 pb-1">
                  <button
                    type="button"
                    onClick={() => onEmail(o.body.en, o.label, i)}
                    title="Draft this as an email"
                    className="ui-pill inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-medium text-surface-deep hover:bg-surface-mint/50"
                  >
                    <Mail size={11} />
                    By email
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </SpringIn>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export function ServiceDesk() {
  const { cases, notes, respondToCase, addNote } = useProcurement();
  const [draft, setDraft] = React.useState<{
    caseId: string;
    questionId: string;
    index: number;
    body: string;
    label: string;
  } | null>(null);
  const [typed, setTyped] = React.useState("");
  const feed = React.useRef<HTMLDivElement>(null);
  const rail = React.useRef<HTMLDivElement>(null);

  const pending = cases.filter((c) => c.status === "pending-review");
  /*
   * Which card is showing its replies — none, until one is clicked.
   *
   * A card only lines up with its bubble if it is shorter than the distance it
   * has to travel. Collapsed it is a header and one line, which fits anywhere
   * in the conversation; opened it is most of the panel's height and can only
   * sit at the top. So they rest closed and pointing at their own turn, and
   * open where the buyer chooses to work.
   */
  const [openCard, setOpenCard] = React.useState<string | null>(null);

  /*
   * Each suggestion card sits level with its own pending bubble in the
   * conversation, and follows it as the feed scrolls — the arrow on the card
   * always points at the turn the reply will land under.
   */
  const [cardPos, setCardPos] = React.useState<Record<string, { top: number; arrow: number }>>({});
  /* True only when the rail is a column beside the conversation (xl and up). */
  const [aligned, setAligned] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const read = () => setAligned(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  /* Absolutely-positioned cards give the rail no height of its own. */
  const [railHeight, setRailHeight] = React.useState(0);
  const pendingIds = pending.map((c) => c.id).join(",");
  const recompute = React.useCallback(() => {
    const railEl = rail.current;
    const feedEl = feed.current;
    if (!railEl || !feedEl || !aligned) return;
    const railRect = railEl.getBoundingClientRect();
    /* Measure against the conversation's height, not the rail's own — the
       rail collapses to nothing once its cards are taken out of flow. */
    const box = feedEl.getBoundingClientRect().height;
    const next: Record<string, { top: number; arrow: number }> = {};
    let prevBottom = 0;
    for (const id of pendingIds.split(",").filter(Boolean)) {
      const anchor = feedEl.querySelector(`[data-case-anchor="${CSS.escape(id)}"]`);
      const card = railEl.querySelector(`[data-case-card="${CSS.escape(id)}"]`);
      const h = card ? card.getBoundingClientRect().height : 0;
      const anchorTop = anchor ? anchor.getBoundingClientRect().top - railRect.top : prevBottom;
      /* Stay inside the rail, and never overlap the card above. */
      let top = anchorTop;
      top = Math.min(top, Math.max(box - h, 0));
      top = Math.max(top, prevBottom);
      top = Math.max(top, 0);
      /* Even when the card is clamped, the arrow keeps pointing at the bubble. */
      const arrow = Math.max(16, Math.min(anchorTop - top + 16, Math.max(h - 30, 16)));
      /* Stored as the gap above the card, not an absolute offset: the cards
         stay in normal flow, where nothing can override a margin. Absolute
         positioning lost to the entrance animation, which owns `transform`. */
      next[id] = { top: Math.round(Math.max(top - prevBottom, 0)), arrow: Math.round(arrow) };
      prevBottom = top + h + 12;
    }
    setRailHeight(Math.max(prevBottom, box));
    setCardPos((old) => {
      const keys = Object.keys(next);
      if (
        keys.length === Object.keys(old).length &&
        keys.every((k) => old[k]?.top === next[k].top && old[k]?.arrow === next[k].arrow)
      ) {
        return old;
      }
      return next;
    });
  }, [pendingIds, aligned]);

  React.useLayoutEffect(() => {
    /*
     * Positions keep moving for a while after a turn lands — the grid stretches,
     * the feed smooth-scrolls, the entrance animations play — and nothing fires
     * when the last of that stops. So measure every frame until it is all over.
     * recompute only sets state when a number actually changed, so the frames
     * that land on a settled layout cost a few getBoundingClientRect calls.
     */
    let raf = 0;
    let until = performance.now() + 1200;
    const tick = () => {
      recompute();
      if (performance.now() < until) raf = requestAnimationFrame(tick);
    };
    const restart = () => {
      /* Something moved. Measure every frame again until it settles. */
      until = performance.now() + 1200;
      cancelAnimationFrame(raf);
      tick();
    };
    tick();
    const ro = new ResizeObserver(restart);
    if (rail.current) ro.observe(rail.current);
    if (feed.current) ro.observe(feed.current);
    /*
     * The transcript streams in character by character and each finished line
     * changes every position below it. A resize observer alone misses that —
     * a bubble growing taller inside the feed does not resize the feed once it
     * scrolls — so watch the content itself.
     */
    const mo = new MutationObserver(restart);
    if (feed.current) {
      mo.observe(feed.current, { childList: true, subtree: true, characterData: true });
    }
    window.addEventListener("resize", restart);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", restart);
    };
  }, [recompute, cases, notes.length]);
  const answeredByAgent = cases.filter((c) => c.status === "answered");
  const responded = cases.filter((c) => c.status === "responded");

  /* The language the conversation is happening in — the supplier's choice. */
  const convoLang: Lang = cases.length > 0 ? cases[cases.length - 1].askedLang : supplier.lang;

  /* The transcript: the structured question flow, then the free chatter. */
  const turns: { key: string; turn: Turn }[] = [];
  for (const c of cases) {
    const spec = supplierQuestions.find((q) => q.id === c.questionId);
    const cl = c.askedLang;
    turns.push({
      key: `${c.id}-q`,
      turn: {
        who: "supplier",
        text: spec ? spec.asked[cl] : c.asked,
        lang: cl,
        summary: cl !== "en" && spec ? spec.asked.en : undefined,
      },
    });
    if (c.kind === "direct") {
      const text = spec ? (answerFor(spec, cl) ?? c.answer ?? "") : (c.answer ?? "");
      turns.push({
        key: `${c.id}-a`,
        turn: {
          who: "assistant",
          text,
          lang: cl,
          summary: cl !== "en" && spec ? (answerSummaryFor(spec) ?? undefined) : undefined,
        },
      });
    } else if (c.status === "pending-review") {
      turns.push({
        key: `${c.id}-p`,
        turn: { who: "pending", caseId: c.id, reason: c.reason ?? "" },
      });
      /* What the supplier was told while they wait — in their language. */
      if (cl !== "en") {
        turns.push({
          key: `${c.id}-pt`,
          turn: {
            who: "assistant",
            text: PENDING_TEXT[cl],
            lang: cl,
            summary: "The assistant told the supplier a specialist is reviewing this.",
          },
        });
      }
    }
    if (c.status === "responded" && c.response) {
      turns.push({
        key: `${c.id}-r`,
        turn: {
          who: "us",
          text: c.response,
          channel: c.channel ?? "portal",
          summary:
            cl !== "en"
              ? `Delivered to the supplier in ${langOf(cl).native} — ${
                  c.channel === "email" ? "by email" : "in the portal"
                }.`
              : undefined,
        },
      });
    }
  }
  for (const n of notes) {
    turns.push({
      key: n.id,
      turn:
        n.who === "supplier"
          ? {
              who: "supplier",
              text: n.text,
              lang: n.lang,
              summary:
                n.lang !== "en"
                  ? `Free-typed message from the supplier, written in ${langOf(n.lang).label}.`
                  : undefined,
            }
          : n.who === "specialist"
            ? {
                who: "us",
                text: n.text,
                channel: "portal",
                summary:
                  convoLang !== "en"
                    ? `Delivered to the supplier in ${langOf(convoLang).native}.`
                    : undefined,
              }
            : {
                who: "assistant",
                text: n.text,
                lang: n.lang,
                summary:
                  n.lang !== "en"
                    ? "The assistant acknowledged the supplier's message."
                    : undefined,
              },
    });
  }

  React.useEffect(() => {
    const el = feed.current;
    if (!el) return;
    /*
     * Scroll to the question that needs answering, not to the end.
     *
     * Scrolling to the bottom puts the pending bubble at the foot of the
     * panel, which is the one place a card beside it cannot reach — the card
     * would have to hang below the rail. Putting that bubble near the top
     * instead gives the card the whole panel to line up within, which is what
     * makes the pointer mean anything.
     */
    const first = pending[0]?.id;
    const anchor = first
      ? el.querySelector<HTMLElement>(`[data-case-anchor="${CSS.escape(first)}"]`)
      : null;
    if (anchor) {
      const to = anchor.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
      el.scrollTo({ top: Math.max(to - 24, 0), behavior: "smooth" });
      return;
    }
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [cases, notes.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = typed.trim();
    if (!text) return;
    addNote("specialist", text, "en");
    setTyped("");
  };

  return (
    <ConsolePage
      title="Service desk"
      lead="The supplier conversation, from your chair — the assistant answers the factual, you decide the commercial."
    >
      <StatTiles
        items={[
          {
            label: "Questions received",
            value: cases.length,
            sub: "In the supplier's own language",
            icon: <TileIcon icon={icons.question} />,
          },
          {
            label: "Answered by the assistant",
            value: answeredByAgent.length,
            tone: "deep",
            sub: "Straight from the records",
            icon: <TileIcon icon={icons.assistant} />,
          },
          {
            label: "Waiting for you",
            value: pending.length,
            tone: "red",
            sub: "Nothing sends without you",
            working: pending.length > 0,
            icon: <TileIcon icon={icons.waiting} />,
          },
          {
            label: "Answered by you",
            value: responded.length,
            sub: "Portal and email",
            icon: <TileIcon icon={icons.answered} />,
          },
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_430px] gap-3 items-stretch">
        {/* ── The conversation ─────────────────────────────────────────── */}
        <Panel
          className="flex min-h-[560px] min-w-0 flex-col"
          title="Conversation with the supplier"
          sub={`${supplier.name} · shown in their language, with an AI summary in English under every line.`}
          right={
            <span className="inline-flex items-center gap-2 whitespace-nowrap bg-surface-mint px-3 py-1.5 text-[13px] font-medium text-surface-deep">
              <AIDot size={7} tone="deep" pulse />
              Assistant online
            </span>
          }
        >
          <div className="flex flex-1 flex-col px-4 pb-4 pt-1">
            <div className="flex flex-1 flex-col rounded-md bg-surface-fog/60">
              <div ref={feed} onScroll={recompute} className="flex-1 space-y-4 overflow-y-auto p-4">
                {turns.length === 0 && (
                  <p className="py-8 text-center text-[13px] text-ink">
                    Nothing asked yet — when the supplier writes, it lands here.
                  </p>
                )}
                {turns.map(({ key, turn }) =>
                  turn.who === "pending" ? (
                    /* Anchored: the suggestion card on the right sits level with this. */
                    <div key={key} data-case-anchor={turn.caseId}>
                      <Bubble turn={turn} />
                    </div>
                  ) : (
                    <Bubble key={key} turn={turn} />
                  ),
                )}
              </div>

              {/* The composer — free replies go to the supplier in the portal. */}
              <form onSubmit={submit} className="flex items-center gap-2 border-t border-divider p-3">
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="Write to the supplier…"
                  className="h-[40px] min-w-0 flex-1 rounded-md border border-divider bg-white px-3.5 text-[13px] text-ink outline-none placeholder:text-ink/50 focus:border-surface-deep/50"
                />
                <button
                  type="submit"
                  aria-label="Send"
                  className="ui-pill grid h-[40px] w-[44px] shrink-0 place-items-center rounded-md bg-surface-deep text-ink-inverse hover:brightness-110"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        </Panel>

        {/* ── The AI's drafted replies — each level with its own bubble ── */}
        {/*
          * Below the two-column breakpoint the rail sits under the conversation
          * rather than beside it, and there is no bubble to line up with — so
          * the cards fall back to ordinary flow. `aligned` is the one switch
          * both the layout and the measurement read.
          */}
        <div
          ref={rail}
          className={cn("min-w-0", !aligned && "space-y-3")}
          style={aligned ? { minHeight: railHeight } : undefined}
        >
          {pending.length > 0 ? (
            pending.map((c) => (
              <div
                key={c.id}
                data-case-card={c.id}
                style={aligned ? { marginTop: cardPos[c.id]?.top ?? 0 } : undefined}
              >
                <SuggestionCard
                  c={c}
                  arrowTop={aligned ? (cardPos[c.id]?.arrow ?? 24) : 24}
                  open={openCard === c.id}
                  onToggle={() => setOpenCard(openCard === c.id ? null : c.id)}
                  onPortal={(body, index) =>
                    respondToCase(c.id, body, "portal", { questionId: c.questionId, index })
                  }
                  onEmail={(body, label, index) =>
                    setDraft({ caseId: c.id, questionId: c.questionId, index, body, label })
                  }
                />
              </div>
            ))
          ) : (
            <SpringIn className="h-full">
              <section className="flex h-full min-h-[200px] items-center justify-center rounded-md border border-dashed border-divider bg-white px-5 py-8 text-center">
                <div>
                  <p className="text-[14px] font-bold text-ink">Nothing waiting</p>
                  <p className="text-[13px] leading-snug text-ink mt-1">
                    When the assistant will not answer something alone, its drafted replies appear
                    here for you to choose from.
                  </p>
                </div>
              </section>
            </SpringIn>
          )}
        </div>
      </div>

      {/* The agent writes the email in front of you; the chat records the send. */}
      {draft && (
        <EmailDraftModal
          draft={{
            to: `${supplier.contact} · ${supplier.email}`,
            subject: `Re: your question — ${draft.caseId} · ${draft.label}`,
            /* The wire version goes out in the language they wrote in. */
            body: fold(
              supplierQuestions
                .find((q) => q.id === draft.questionId)
                ?.recommended?.[draft.index]?.body[convoLang] ?? draft.body,
            ),
            review: {
              subject: `Re: your question — ${draft.caseId} · ${draft.label}`,
              body: fold(draft.body),
              sendingIn: langOf(convoLang).native,
            },
          }}
          onClose={() => setDraft(null)}
          onSent={() => {
            respondToCase(draft.caseId, draft.body, "email", {
              questionId: draft.questionId,
              index: draft.index,
            });
            addNote("assistant", `Email sent to ${supplier.email} — the reply is on the case record.`, "en");
            setDraft(null);
          }}
        />
      )}
    </ConsolePage>
  );
}
