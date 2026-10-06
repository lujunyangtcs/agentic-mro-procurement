/**
 * The intake desk — where demand arrives, and where it becomes a requisition.
 *
 * Demand does not turn up as one tidy form. It arrives as an email in whatever
 * language the engineer works in, as a work order the maintenance system
 * raised, as a message through the supplier portal. The top of this page is
 * those channels, side by side, in plain words.
 *
 * Open one and the rest of the page goes to work: the document as it actually
 * arrived on the left, the agent reading and reasoning aloud in the middle,
 * and the request filling itself in on the right. You can also skip all of
 * that and type the six fields yourself — the form never stops being a form.
 *
 * What comes out is a purchase requisition, never an order. Everything this
 * demo checks — master data, duplicates, stock, warranty, contract price,
 * approval limits — happens while it is still a request. The order is what a
 * released requisition becomes, further down the line.
 *
 * The page reads from the guided runs and writes nothing back: these
 * requisitions already exist, and this is a replay of how they arrived.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { Mail, ClipboardList, MessageSquare, X, ArrowRight } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { useApp } from "@/mro/state";
import { LANGUAGES } from "@/mro/data/procurement";
import { channels, chips, type Channel, type IntakeSpec } from "@/mro/data/intakeChannels";
import { ConsolePage } from "@/mro/components/console/kit";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { AiConversation, PrFormPanel } from "@/mro/components/console/IntakeAi";

const CHANNEL_ICON = {
  mail: Mail,
  workOrder: ClipboardList,
  portal: MessageSquare,
} as const;

/* ── One channel, and what is sitting in it ─────────────────────────────── */

function ChannelCard({
  channel,
  active,
  onOpen,
}: {
  channel: Channel;
  active: boolean;
  onOpen: () => void;
}) {
  const Icon = CHANNEL_ICON[channel.icon];
  const lang = LANGUAGES.find((l) => l.code === channel.open.lang);

  return (
    <SpringIn className="h-full">
      <section className="flex h-full min-w-0 flex-col rounded-md border border-divider bg-white">
        <header className="flex items-center gap-2.5 px-4 pb-2 pt-3.5">
          <span className="text-surface-deep">
            <Icon size={17} strokeWidth={1.75} />
          </span>
          <h2 className="text-[15px] font-bold leading-tight text-ink">{channel.label}</h2>
        </header>
        <p className="px-4 pb-2.5 text-[12px] leading-[16px] text-ink">{channel.meta}</p>

        {/* The live one. Everything below it has already been dealt with. */}
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            "border-y border-divider px-4 py-2.5 text-left transition-colors",
            active ? "bg-surface-mint/45" : "hover:bg-surface-fog",
          )}
        >
          <span className="line-clamp-2 block text-[13px] font-medium leading-[18px] text-ink">
            {channel.open.text}
          </span>
          <span className="mt-1 block text-[12px] leading-[16px] text-ink">
            {lang?.emoji} {lang?.native} · {channel.open.lang === "de" ? "öffnen" : "open it"}
          </span>
        </button>

        <ul className="mt-auto divide-y divide-divider">
          {channel.history.map((h) => (
            <li key={h.text} className="px-4 py-2">
              <span className="line-clamp-2 block text-[13px] leading-[17px] text-ink/70">{h.text}</span>
              <span className="mt-0.5 block text-[12px] leading-[15px] text-ink/70">{h.note}</span>
            </li>
          ))}
        </ul>
      </section>
    </SpringIn>
  );
}

/* ── The requisition, once it exists ────────────────────────────────────── */

function ReceiptModal({
  spec,
  onClose,
  onEnter,
}: {
  spec: IntakeSpec;
  onClose: () => void;
  onEnter: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 p-6" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-[880px] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-divider px-5 py-3.5">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold leading-tight text-ink">{spec.receiptLabel}</h3>
            <p className="mt-0.5 text-[12px] leading-[16px] text-ink">{spec.receiptStatus}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ui-pill ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink hover:bg-surface-fog"
          >
            <X size={16} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-surface-fog/50 p-5">{spec.receipt}</div>

        <footer className="flex items-center gap-4 border-t border-divider px-5 py-3.5">
          <p className="min-w-0 flex-1 text-[12.5px] leading-[17px] text-ink">
            Raised, not ordered. The workforce validates it before anything is bought.
          </p>
          <button
            type="button"
            onClick={onEnter}
            className="ui-pill inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-surface-deep px-4 py-2.5 text-[13px] font-medium text-ink-inverse hover:brightness-110"
          >
            Watch it get validated
            <ArrowRight size={15} />
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export function IntakeConsole() {
  const { go, setFlowProgress } = useApp();

  const [spec, setSpec] = React.useState<IntakeSpec | null>(null);
  /* Bumped on every new request — the conversation is keyed on it, so the
     previous one unmounts and its timers go with it. */
  const [runKey, setRunKey] = React.useState(0);
  const [fill, setFill] = React.useState<{
    key: number;
    fields: IntakeSpec["fields"];
    stagger: number;
  } | null>(null);
  const [receiptOpen, setReceiptOpen] = React.useState(false);

  const play = React.useCallback((next: IntakeSpec) => {
    setSpec(next);
    setFill(null);
    setReceiptOpen(false);
    setRunKey((k) => k + 1);
  }, []);

  /* Stable identity — an inline arrow would restart the typing on every
     render of the parent, and there are several during a staggered fill. */
  const onConclude = React.useCallback(() => {
    setSpec((s) => {
      if (s) setFill({ key: runKey, fields: s.fields, stagger: s.stagger });
      return s;
    });
  }, [runKey]);

  /* Anything typed in is treated as the seal case — it is the one the demo
     tells, and the agent says what it had to assume. */
  const onAsk = React.useCallback(
    (text: string) => play({ ...chips[0].spec, id: "typed", asked: text, original: null }),
    [play],
  );

  const enterRun = () => {
    if (!spec) return;
    /* A complete record, not a merge: a second walkthrough must not inherit
       the settled state — or the decisions — of the first. */
    setFlowProgress(spec.flow, {
      activeStep: 1,
      approved: false,
      settled: false,
      decisions: { 0: "approved" },
      sourcing: spec.sourcing,
    });
    go({ kind: "workspace", flow: spec.flow });
  };

  return (
    <ConsolePage
      title="New request"
      lead="Everything the plants have asked for today — and what it takes to turn one into a requisition."
    >
      {/* ── What came in ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
        {channels.map((c) => (
          <ChannelCard
            key={c.id}
            channel={c}
            active={spec?.id === c.open.spec.id}
            onOpen={() => play(c.open.spec)}
          />
        ))}
      </div>

      {/* ── The original · the agent · the request ────────────────────────── */}
      <div className="grid min-h-[560px] grid-cols-1 items-stretch gap-3 xl:grid-cols-3">
        <SpringIn className="h-full">
          <section className="flex h-full min-w-0 flex-col rounded-md border border-divider bg-white">
            <header className="px-4 pb-2.5 pt-3.5">
              <h2 className="text-[15px] font-bold leading-tight text-ink">
                {spec?.original ? spec.originalLabel : "The original"}
              </h2>
              <p className="mt-0.5 text-[12px] leading-[16px] text-ink">
                {spec?.original ? spec.originalMeta : "Exactly what arrived, before anyone touched it."}
              </p>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto border-t border-divider bg-surface-fog/50 p-3">
              {spec?.original ?? (
                <p className="py-12 text-center text-[13px] leading-[19px] text-ink">
                  {spec
                    ? "Nothing to read — you told me directly."
                    : "Open something above to see it as it arrived."}
                </p>
              )}
            </div>
          </section>
        </SpringIn>

        <SpringIn className="h-full">
          <AiConversation
            key={runKey}
            spec={spec}
            onConclude={onConclude}
            onAsk={onAsk}
            chips={chips.map((c) => ({ label: c.label, onPick: () => play(c.spec) }))}
          />
        </SpringIn>

        <SpringIn className="h-full">
          <PrFormPanel fill={fill} onRaise={() => setReceiptOpen(true)} />
        </SpringIn>
      </div>

      {receiptOpen && spec && (
        <ReceiptModal spec={spec} onClose={() => setReceiptOpen(false)} onEnter={enterRun} />
      )}
    </ConsolePage>
  );
}
