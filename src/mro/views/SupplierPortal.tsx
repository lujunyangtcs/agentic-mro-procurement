/**
 * The supplier's portal — one component, two modes, so the jump between them
 * animates instead of remounting.
 *
 * "Overview" is the landing: the four position tiles, then what is being
 * processed — invoices, purchase requests from the buyer's own store, and the
 * money in flight. The AI button bottom-right slides the panels to the right
 * and brings the assistant in from the left ("Ask & my payments"); the tiles
 * never move. Suggested questions live inside the conversation itself.
 *
 * The language switch top-right re-renders the whole page — labels, tables,
 * pills AND the conversation. The supplier writes in whichever language they
 * are viewing; the questions, the assistant's answers and the specialist's
 * replies all render in that language, from the same computed records the
 * buyer reads in English.
 */

import * as React from "react";
import { Send, Clock, User, Bot, Mail, X } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { useApp } from "@/mro/state";
import { useProcurement } from "@/mro/data/store";
import { useT } from "@/mro/lib/i18n";
import {
  supplier,
  supplierQuestions,
  answerFor,
  supplierPosition,
  holdReasonFor,
  PENDING_TEXT,
  ACK_TEXT,
  GREETING_TEXT,
  type SupplierQuestion,
} from "@/mro/data/supplier";
import {
  usd,
  lineValue,
  tieoutAgrees,
  tieoutGap,
  invoiceAmount,
  receivedAmount,
  LANGUAGES,
  type Lang,
  type Requisition,
  type InvoiceTieout,
} from "@/mro/data/procurement";
import { ConsolePage, StatTiles, Panel, Th, Td } from "@/mro/components/console/kit";
import { icons, TileIcon } from "@/mro/components/console/icons";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { TypingDots } from "@/mro/components/ai/TypingDots";
import { AIDot } from "@/mro/components/ai/AIDot";

/* ── Conversation bubbles ───────────────────────────────────────────────── */

type Turn =
  | { who: "supplier"; text: string }
  | { who: "agent"; text: string; fresh: boolean }
  | { who: "agent-pending"; reason: string; caseId: string; fresh: boolean }
  | { who: "specialist"; text: string; channel: "portal" | "email" };

function Bubble({
  turn,
  supplierName,
  t,
}: {
  turn: Turn;
  supplierName: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  if (turn.who === "supplier") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-surface-deep px-4 py-3">
          <p className="text-[13px] leading-[19px] text-ink-inverse">{turn.text}</p>
        </div>
      </div>
    );
  }

  if (turn.who === "specialist") {
    return (
      <SpringIn className="flex gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-navy">
          <User size={15} className="text-ink-inverse" />
        </span>
        <div className="min-w-0 max-w-[80%]">
          <div className="flex items-center gap-2 pb-1">
            <span className="text-[12px] font-semibold text-ink">{t("sp.chat.specialist")}</span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap bg-surface-fog px-2 py-0.5 text-[12px] text-mute">
              {turn.channel === "email" ? <Mail size={11} /> : null}
              {turn.channel === "email" ? t("sp.chat.byEmail") : t("sp.chat.inPortal")}
            </span>
          </div>
          <div className="rounded-2xl rounded-tl-sm border border-divider bg-white px-4 py-3">
            <p className="text-[13px] leading-[19px] text-ink">{turn.text}</p>
          </div>
        </div>
      </SpringIn>
    );
  }

  const pending = turn.who === "agent-pending";
  return (
    <SpringIn className="flex gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-mint">
        <Bot size={15} className="text-surface-deep" />
      </span>
      <div className="min-w-0 max-w-[80%]">
        <div className="flex items-center gap-2 pb-1">
          <span className="text-[12px] font-semibold text-ink">{t("sp.chat.assistant")}</span>
          {pending && (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap bg-surface-rose px-2.5 py-0.5 text-[12px] font-medium text-mark-red">
              <Clock size={11} />
              {t("sp.chat.withSpecialist")}
            </span>
          )}
        </div>
        <div
          className={cn(
            "rounded-2xl rounded-tl-sm border px-4 py-3",
            pending ? "border-mark-red/25 bg-surface-rose/35" : "border-divider bg-white",
          )}
        >
          {pending ? (
            <>
              <p className="text-[13px] leading-[19px] text-ink">
                {turn.fresh ? (
                  <StreamingText text={turn.reason} cps={150} caret={false} />
                ) : (
                  turn.reason
                )}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-mark-red/15 pt-2.5">
                <span className="bg-white px-2.5 py-1 text-[12px] font-medium text-ink whitespace-nowrap">
                  {turn.caseId}
                </span>
              </div>
            </>
          ) : (
            <p className="text-[13px] leading-[19px] text-ink">
              {turn.fresh ? <StreamingText text={turn.text} cps={165} caret={false} /> : turn.text}
            </p>
          )}
        </div>
        {!pending && (
          <p className="pt-1.5 text-[12px] text-mute">
            {t("sp.chat.answeredFrom", { name: supplierName })}
          </p>
        )}
      </div>
    </SpringIn>
  );
}

/* ── Overview panels ────────────────────────────────────────────────────── */

function InvoicesPanel({ tieouts, className }: { tieouts: InvoiceTieout[]; className?: string }) {
  const { t } = useT();
  return (
    <Panel
      className={cn("min-w-0", className)}
      title={t("sp.panel.invoices")}
      sub={t("sp.panel.invoicesSub")}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="border-y border-divider bg-surface-fog/60">
            <tr>
              <Th>{t("sp.col.invoice")}</Th>
              <Th align="right">{t("sp.col.billed")}</Th>
              <Th align="right">{t("sp.col.paying")}</Th>
              <Th>{t("sp.col.onHold")}</Th>
              <Th align="right">{t("sp.col.status")}</Th>
            </tr>
          </thead>
          <tbody>
            {tieouts.map((ti) => {
              const ok = tieoutAgrees(ti);
              return (
                <tr key={ti.id} className="border-b border-divider last:border-0">
                  <Td>
                    <span className="font-medium text-ink">{ti.id}</span>
                    <span className="ml-2 text-[12px] text-ink">{ti.receivedOn}</span>
                  </Td>
                  <Td align="right">{usd(invoiceAmount(ti))}</Td>
                  <Td align="right">
                    <span className={cn(!ok && "text-mark-red")}>{usd(receivedAmount(ti))}</span>
                  </Td>
                  <Td>
                    {ok ? (
                      <span className="text-ink">—</span>
                    ) : (
                      <span className="font-medium text-mark-red tabular-nums">
                        {t("sp.held", { amt: usd(tieoutGap(ti), 0) })}
                      </span>
                    )}
                  </Td>
                  <Td align="right">
                    <span
                      className={cn(
                        "inline-block whitespace-nowrap px-2.5 py-1 text-[13px] font-medium",
                        ok ? "bg-surface-mint text-surface-deep" : "bg-surface-rose text-mark-red",
                      )}
                    >
                      {ok ? t("sp.pill.beingPaid") : t("sp.pill.query")}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/** How a buyer-side status reads from the supplier's chair — as DICT keys. */
function supplierStatus(r: Requisition): {
  labelKey: string;
  reasonKey: string;
  tone: "hold" | "ok" | "run";
} {
  if (r.status === "released")
    return { labelKey: "sp.status.released", reasonKey: "sp.reason.released", tone: "ok" };
  if (r.status === "held") {
    const first = r.exceptions[0];
    const reasonKey: Record<string, string> = {
      "spec-incomplete": "sp.reason.spec",
      "duplicate-demand": "sp.reason.dup",
      "stock-available": "sp.reason.stock",
      "warranty-covered": "sp.reason.warranty",
      "off-contract": "sp.reason.contract",
      "over-threshold": "sp.reason.threshold",
    };
    return {
      labelKey: "sp.status.onHold",
      reasonKey: reasonKey[first] ?? "sp.reason.review",
      tone: "hold",
    };
  }
  return { labelKey: "sp.status.processing", reasonKey: "sp.reason.review", tone: "run" };
}

function PurchaseRequestsPanel({ requisitions }: { requisitions: Requisition[] }) {
  const { t } = useT();
  const mine = requisitions
    .filter((r) => r.vendor === supplier.name)
    .filter((r) => r.status !== "released" || (r.resolutions?.length ?? 0) > 0)
    .sort((a, b) => (a.status === "held" ? -1 : 1) - (b.status === "held" ? -1 : 1));

  return (
    <Panel className="min-w-0" title={t("sp.panel.prs")} sub={t("sp.panel.prsSub")}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="border-y border-divider bg-surface-fog/60">
            <tr>
              <Th>{t("sp.col.item")}</Th>
              <Th align="right">{t("sp.col.value")}</Th>
              <Th>{t("sp.col.reason")}</Th>
              <Th align="right">{t("sp.col.status")}</Th>
            </tr>
          </thead>
          <tbody>
            {mine.map((r) => {
              const st = supplierStatus(r);
              return (
                <tr key={r.id} className="border-b border-divider last:border-0">
                  <Td className="max-w-[340px] truncate" title={r.description}>
                    {r.description}
                  </Td>
                  <Td align="right">{usd(lineValue(r))}</Td>
                  <Td>
                    <span className={cn(st.tone === "hold" ? "text-mark-red" : "text-ink")}>
                      {t(st.reasonKey)}
                    </span>
                  </Td>
                  <Td align="right">
                    <span
                      className={cn(
                        "inline-block whitespace-nowrap px-2.5 py-1 text-[13px] font-medium",
                        st.tone === "ok" && "bg-surface-mint text-surface-deep",
                        st.tone === "hold" && "bg-surface-rose text-mark-red",
                        st.tone === "run" && "bg-surface-fog text-ink",
                      )}
                    >
                      {t(st.labelKey)}
                    </span>
                  </Td>
                </tr>
              );
            })}
            {mine.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-5 text-center text-[13px] text-ink">
                  {t("sp.nothingInFlight")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function PaymentsPanel({ tieouts }: { tieouts: InvoiceTieout[] }) {
  const { t, lang } = useT();
  const position = supplierPosition(tieouts);
  const held = tieouts.filter((ti) => !tieoutAgrees(ti));
  const share = position.billed === 0 ? 0 : position.releasing / position.billed;

  return (
    <Panel className="min-w-0" title={t("sp.panel.money")} sub={t("sp.panel.moneySub")}>
      <div className="px-4 pb-4 pt-1">
        <div className="flex items-baseline justify-between gap-3 pb-1.5">
          <span className="text-[13px] text-ink">
            <span className="font-bold tabular-nums text-surface-deep">{usd(position.releasing, 0)}</span>{" "}
            {t("sp.beingPaidLine")}
          </span>
          <span className="text-[13px] text-mark-red tabular-nums whitespace-nowrap">
            {t("sp.held", { amt: usd(position.onHold, 0) })}
          </span>
        </div>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-rose/60">
          <span className="h-full bg-surface-deep" style={{ width: `${share * 100}%` }} />
        </div>
        <ul className="mt-3 space-y-1.5">
          {held.map((ti) => (
            <li key={ti.id} className="flex items-center gap-2.5 text-[13px]">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mark-red" />
              <span className="font-medium text-ink">{ti.id}</span>
              <span className="min-w-0 flex-1 truncate text-mute">{holdReasonFor(ti, lang)}</span>
              <span className="shrink-0 font-medium text-mark-red tabular-nums">
                {usd(tieoutGap(ti))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

/* ── The portal ─────────────────────────────────────────────────────────── */

export function SupplierPortal({ mode }: { mode: "overview" | "ask" }) {
  const { go } = useApp();
  const { cases, tieouts, requisitions, notes, askQuestion, addNote } = useProcurement();
  const { t, lang } = useT();
  const ask = mode === "ask";

  const [thinking, setThinking] = React.useState<SupplierQuestion | null>(null);
  const [typed, setTyped] = React.useState("");
  const [freshIds, setFreshIds] = React.useState<Set<string>>(new Set());
  const feed = React.useRef<HTMLDivElement>(null);

  const position = supplierPosition(tieouts);
  const waiting = cases.filter((c) => c.status === "pending-review").length;
  /* The supplier writes in the language they are viewing — that IS the demo. */
  const askIn: Lang = lang;
  const langName = LANGUAGES.find((l) => l.code === lang)!.native;

  const asked = new Set(cases.map((c) => c.questionId));
  /**
 * The two invoice questions are the ones a supplier types for themselves —
 * they are the natural opening move, and the assistant recognises them from
 * the invoice number alone. Everything else stays a suggestion.
 */
const TYPED_QUESTIONS = ["Q-PAY-5581", "Q-PAY-5588"];

  const open = supplierQuestions.filter((q) => !asked.has(q.id));
  /* Suggestions exclude the two the supplier is expected to type. */
  const suggested = open.filter((q) => !TYPED_QUESTIONS.includes(q.id));

  const fire = (q: SupplierQuestion) => {
    setThinking(q);
    window.setTimeout(() => {
      const id = askQuestion({
        questionId: q.id,
        asked: q.asked[askIn],
        askedLang: askIn,
        kind: q.kind,
        answer: q.kind === "direct" ? (answerFor(q, askIn) ?? undefined) : undefined,
        reason: q.strategicReason,
      });
      setFreshIds((s) => new Set(s).add(id));
      setThinking(null);
    }, 1500);
  };

  React.useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: "smooth" });
  }, [cases.length, notes.length, thinking]);

  /*
   * The transcript, rendered in the viewing language. Structured turns come
   * from the question book, so switching language re-renders the whole
   * conversation; free-typed lines stay exactly as they were written.
   */
  const turns: { key: string; turn: Turn }[] = [];
  for (const c of cases) {
    const spec = supplierQuestions.find((q) => q.id === c.questionId);
    turns.push({
      key: `${c.id}-q`,
      turn: { who: "supplier", text: spec ? spec.asked[lang] : c.asked },
    });
    if (c.kind === "direct") {
      const localized = spec ? answerFor(spec, lang) : null;
      if (localized || c.answer) {
        turns.push({
          key: `${c.id}-a`,
          turn: { who: "agent", text: localized ?? c.answer!, fresh: freshIds.has(c.id) },
        });
      }
    } else {
      turns.push({
        key: `${c.id}-p`,
        turn: {
          who: "agent-pending",
          reason: PENDING_TEXT[lang],
          caseId: c.id,
          fresh: freshIds.has(c.id),
        },
      });
    }
    if (c.status === "responded" && c.response) {
      const localizedReply = c.responseRef
        ? supplierQuestions
            .find((q) => q.id === c.responseRef!.questionId)
            ?.recommended?.[c.responseRef.index]?.body[lang]
        : undefined;
      turns.push({
        key: `${c.id}-r`,
        turn: {
          who: "specialist",
          text: localizedReply ?? c.response,
          channel: c.channel ?? "portal",
        },
      });
    }
  }
  for (const n of notes) {
    turns.push({
      key: n.id,
      turn:
        n.who === "supplier"
          ? { who: "supplier", text: n.text }
          : n.who === "specialist"
            ? { who: "specialist", text: n.text, channel: "portal" }
            : { who: "agent", text: n.text, fresh: false },
    });
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = typed.trim();
    if (!text) return;
    /*
     * A typed invoice number is a real question, not a note. The supplier
     * writes "BPI-5581" in whatever words they like; the assistant reads the
     * number, finds the invoice and answers from the records — the same
     * answer the suggestion would have given.
     */
    const digits = text.match(/\b5\d{3}\b/)?.[0];
    const matched = digits
      ? open.find((q) => TYPED_QUESTIONS.includes(q.id) && q.id.endsWith(digits))
      : undefined;
    setTyped("");
    if (matched) {
      fire({ ...matched, asked: { ...matched.asked, [askIn]: text } });
      return;
    }
    addNote("supplier", text, lang);
    const ackLang = lang;
    window.setTimeout(() => addNote("assistant", ACK_TEXT[ackLang], ackLang), 1200);
  };

  return (
    <ConsolePage
      title={ask ? t("sp.askTitle") : t("sp.overviewTitle")}
      lead={ask ? t("sp.askLead") : t("sp.overviewLead")}
    >
      {/* The four tiles hold still while everything below slides. */}
      <StatTiles
        items={[
          {
            label: t("sp.tile.invoices"),
            value: tieouts.length,
            sub: t("sp.tile.invoicesSub", { amt: usd(position.billed, 0) }),
            icon: <TileIcon icon={icons.invoice} />,
          },
          {
            label: t("sp.tile.beingPaid"),
            value: position.releasing,
            prefix: "$",
            tone: "deep",
            sub: t("sp.tile.beingPaidSub", { terms: supplier.terms }),
            icon: <TileIcon icon={icons.beingPaid} />,
          },
          {
            label: t("sp.tile.onHold"),
            value: position.onHold,
            prefix: "$",
            tone: "red",
            sub: t("sp.tile.onHoldSub"),
            icon: <TileIcon icon={icons.onHold} />,
          },
          {
            label: t("sp.tile.waiting"),
            value: waiting,
            sub: waiting > 0 ? t("sp.tile.waitingSome") : t("sp.tile.waitingNone"),
            working: waiting > 0,
            icon: <TileIcon icon={icons.waiting} />,
          },
        ]}
      />

      {/* The sliding stage: chat grows in from the left, panels compress right. */}
      <div className="flex items-stretch gap-0">
        <aside
          className={cn(
            "shrink-0 overflow-hidden transition-[width] duration-[450ms] ease-out",
            ask ? "w-[46%]" : "w-0",
          )}
        >
          <div
            className={cn(
              "flex h-full w-full min-w-[420px] flex-col pr-3 transition-opacity duration-300",
              ask ? "opacity-100 delay-150" : "opacity-0",
            )}
          >
            <Panel
              /* A fixed height, so the composer and the suggestions stay put
                 and only the transcript scrolls as the conversation grows. */
              className="flex h-[640px] max-h-[calc(100vh-260px)] min-h-[480px] flex-col"
              title={t("sp.chat.title")}
              sub={t("sp.chat.sub", { lang: langName })}
              right={
                <span className="inline-flex items-center gap-2 whitespace-nowrap bg-surface-mint px-3 py-1.5 text-[13px] font-medium text-surface-deep">
                  <AIDot size={7} tone="deep" pulse />
                  {t("sp.chat.online")}
                </span>
              }
            >
              <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-1">
                <div className="flex min-h-0 flex-1 flex-col rounded-md bg-surface-fog/60">
                <div
                  ref={feed}
                  className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
                >
                  {turns.length === 0 && !thinking && (
                    <div className="flex gap-3">
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-mint">
                        <Bot size={15} className="text-surface-deep" />
                      </span>
                      <div className="rounded-2xl rounded-tl-sm border border-divider bg-white px-4 py-3">
                        <p className="text-[13px] leading-[19px] text-ink">
                          <StreamingText text={GREETING_TEXT[lang]} cps={130} caret={false} />
                        </p>
                      </div>
                    </div>
                  )}
                  {turns.map(({ key, turn }) => (
                    <Bubble key={key} turn={turn} supplierName={supplier.name} t={t} />
                  ))}

                  {thinking && (
                    <>
                      <div className="flex justify-end">
                        <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-surface-deep px-4 py-3">
                          <p className="text-[13px] leading-[19px] text-ink-inverse">
                            {thinking.asked[askIn]}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-mint">
                          <Bot size={15} className="text-surface-deep" />
                        </span>
                        <div className="rounded-2xl rounded-tl-sm border border-divider bg-white px-4 py-3.5">
                          <TypingDots />
                        </div>
                      </div>
                    </>
                  )}

                </div>

                {/* Suggested questions — pinned to the bottom of the box. */}
                <div className="px-4 pb-4 pt-1">
                  {!thinking && suggested.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {suggested.slice(0, 3).map((q) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => fire(q)}
                          className="ui-pill inline-flex items-center gap-1.5 whitespace-nowrap border border-surface-deep/35 bg-white px-3 py-1.5 text-[12.5px] text-ink transition-colors hover:bg-surface-mint/40"
                        >
                          {q.chip[lang]}
                          <Send size={11} className="shrink-0 text-ink" />
                        </button>
                      ))}
                    </div>
                  )}
                  {!thinking && suggested.length === 0 && (
                    <p className="text-center text-[12px] text-ink">{t("sp.chat.allAsked")}</p>
                  )}
                </div>

                {/* The composer — write anything, in your own words. */}
                <form onSubmit={submit} className="flex items-center gap-2 border-t border-divider p-3">
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder={t("sp.chat.placeholder")}
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
          </div>
        </aside>

        {/* The panels — full width on the landing, right column beside the chat. */}
        <div className="min-w-0 flex-1 space-y-3">
          <InvoicesPanel tieouts={tieouts} className={ask ? "h-full" : undefined} />
          <div
            className={cn(
              "space-y-3 overflow-hidden transition-all duration-[450ms] ease-out",
              ask ? "max-h-0 opacity-0" : "max-h-[1200px] opacity-100",
            )}
          >
            <PurchaseRequestsPanel requisitions={requisitions} />
            <PaymentsPanel tieouts={tieouts} />
          </div>
        </div>
      </div>

      {/* The assistant button — the door between the two modes. */}
      <button
        type="button"
        onClick={() => go({ kind: ask ? "supplier-overview" : "supplier-center" })}
        aria-label={ask ? "Back to the overview" : "Ask the assistant"}
        className={cn(
          "ui-pill fixed bottom-6 right-6 z-[60] grid h-14 w-14 place-items-center rounded-full",
          "bg-surface-deep text-ink-inverse shadow-lg shadow-surface-deep/25 hover:bg-accent-green",
        )}
      >
        {ask ? <X size={22} /> : <Bot size={24} />}
        {!ask && (
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-surface-mint ring-2 ring-white" />
        )}
      </button>
    </ConsolePage>
  );
}
