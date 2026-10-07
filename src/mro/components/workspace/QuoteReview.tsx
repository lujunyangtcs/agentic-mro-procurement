/**
 * Reading the quotes that came back.
 *
 * There is no document rail here on purpose: the replies *are* the evidence,
 * so they sit side by side across the full width and each one opens as the
 * email it arrived as. Then the agent takes a real beat — long enough that you
 * watch it work rather than see a result appear — and comes back with one
 * recommendation and the reason the runner-up lost.
 *
 * The cheapest quote is not always the recommendation, and that is the point.
 * A line that is down costs money every day it stays down, so lead time can
 * outweigh unit price. The agent says so out loud; a person still picks.
 */

import * as React from "react";
import { Mail, Paperclip, Sparkles, CornerUpRight, CircleSlash } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { Spinner } from "@/mro/components/ai/Spinner";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { InboundEmailModal } from "@/mro/components/workspace/InboundEmailModal";
import { useT, usePhrase } from "@/mro/lib/i18n";
import type { QuoteReview as Spec, InboundEmail } from "@/mro/data/runSteps";

const THINK_MS = 5000;
/** The reasoning lines pace themselves across the thinking beat. */
const lineDelay = (i: number, total: number, think: number) =>
  Math.round((think / (total + 1)) * (i + 1));

export function QuoteReview({ spec, onComplete }: { spec: Spec; onComplete: () => void }) {
  const { t } = useT();
  const ph = usePhrase();
  const think = spec.thinkMs ?? THINK_MS;
  const [phase, setPhase] = React.useState<"reading" | "thinking" | "verdict">("reading");
  const [open, setOpen] = React.useState<InboundEmail | null>(null);

  React.useEffect(() => {
    if (phase !== "thinking") return;
    const t = window.setTimeout(() => setPhase("verdict"), think);
    return () => window.clearTimeout(t);
  }, [phase, think]);

  const picked = spec.replies.find((r) => r.id === spec.verdict.pickId);

  return (
    <div className="space-y-3">
      <SpringIn>
        <div className="overflow-hidden rounded-md border border-divider bg-white">
          <header className="flex items-center gap-2 border-b border-divider bg-surface-fog/60 px-4 py-2.5">
            <Sparkles size={13} className="shrink-0 text-surface-deep" />
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink">
              {t("qr.quotesIn", { n: spec.replies.length })}
            </span>
            <span className="ml-auto text-[11px] text-mute">
              {t(phase === "verdict" ? "qr.compared" : phase === "thinking" ? "qr.comparing" : "qr.readyToCompare")}
            </span>
          </header>

          {/* The replies, across the full width — this is the evidence. */}
          <div className="grid grid-cols-1 gap-2.5 p-4 md:grid-cols-2 xl:grid-cols-4">
            {spec.replies.map((r) => {
              const isPick = phase === "verdict" && r.id === spec.verdict.pickId;
              return (
                <div
                  key={r.id}
                  className={cn(
                    "flex min-w-0 flex-col rounded-md border bg-white p-3 transition-colors",
                    isPick ? "border-surface-deep bg-surface-mint/25" : "border-divider",
                    r.declined && "opacity-70",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[12.5px] font-bold leading-tight text-ink">{r.vendor}</span>
                    {isPick && (
                      <span className="shrink-0 bg-surface-deep px-2 py-0.5 text-[10px] font-bold text-ink-inverse">
                        PICK
                      </span>
                    )}
                  </div>
                  <span className="mt-0.5 text-[10.5px] text-mute">{r.country}</span>

                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold">
                    {r.declined ? (
                      <>
                        <CircleSlash size={12} className="shrink-0 text-mark-red" />
                        <span className="text-mark-red">{t("qr.noQuote")}</span>
                      </>
                    ) : (
                      <>
                        <Mail size={12} className="shrink-0 text-[#2f6b4f]" />
                        <span className="text-[#2f6b4f]">{t("qr.emailReply")}</span>
                      </>
                    )}
                  </div>

                  <div className="mt-1 text-[13px] font-bold tabular-nums text-ink">{r.headline}</div>
                  <div className="text-[11px] text-mute">{ph(r.lead)}</div>
                  <p className="mt-1 text-[11px] leading-snug text-ink/80">{ph(r.note)}</p>

                  {/* What the number is actually a price for. A quoted figure
                      without its clauses is not comparable to another one. */}
                  {r.terms && (
                    <dl className="mt-2 space-y-[3px] border-t border-divider pt-2">
                      {r.terms.map((term) => (
                        <div key={term.label} className="flex items-baseline justify-between gap-2">
                          <dt className="shrink-0 text-[10.5px] text-mute">{ph(term.label)}</dt>
                          <dd
                            className={cn(
                              "min-w-0 truncate text-right text-[10.5px] font-medium",
                              term.tone === "warn" ? "text-mark-red" : term.tone === "good" ? "text-surface-deep" : "text-ink",
                            )}
                          >
                            {ph(term.value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {/* The figure the decision actually turns on. */}
                  {r.landed && (
                    <div className="mt-2 rounded bg-surface-fog px-2 py-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[10.5px] font-bold uppercase tracking-[0.04em] text-mute">
                          {t("qr.allIn")}
                        </span>
                        <span className="text-[12.5px] font-bold tabular-nums text-ink">
                          {r.landed.value}
                        </span>
                      </div>
                      <div className="text-[10px] leading-tight text-mute">{ph(r.landed.note)}</div>
                    </div>
                  )}
                  <div className="flex-1" />

                  {r.email && (
                    <button
                      type="button"
                      onClick={() => setOpen(r.email!)}
                      className="ui-pill mt-2 inline-flex items-center gap-1 self-start text-[10.5px] font-bold text-surface-deep hover:underline"
                    >
                      <Paperclip size={11} /> {t(r.declined ? "qr.openEmail" : "qr.openQuote")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* The beat: it works, out loud, for long enough to be believed. */}
          {phase !== "reading" && (
            <div className="border-t border-divider px-4 py-3">
              <ul className="space-y-1.5">
                {spec.lines.map((line, i) => (
                  <li key={line} className="flex items-start gap-2 text-[12.5px] leading-[17px] text-ink">
                    <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-surface-deep" />
                    <StreamingText
                      text={ph(line)}
                      cps={165}
                      startDelay={lineDelay(i, spec.lines.length, think)}
                      caret={false}
                    />
                  </li>
                ))}
              </ul>

              {phase === "verdict" && (
                <SpringIn>
                  <div className="mt-3 rounded-md border border-surface-mint bg-surface-mint/35 px-3.5 py-3">
                    <div className="flex items-center gap-1.5 pb-1">
                      <Sparkles size={13} className="shrink-0 text-surface-deep" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-surface-deep">
                        {t("run.aiRecommendation")}
                      </span>
                    </div>
                    <p className="text-[13px] font-bold leading-snug text-ink">{ph(spec.verdict.headline)}</p>
                    <p className="mt-1 text-[12.5px] leading-[18px] text-ink">{ph(spec.verdict.body)}</p>
                    <p className="mt-1.5 border-t border-surface-deep/15 pt-1.5 text-[12px] leading-[17px] text-ink">
                      {ph(spec.verdict.against)}
                    </p>
                  </div>
                </SpringIn>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-divider px-4 py-3">
            {phase === "reading" ? (
              <button
                type="button"
                onClick={() => setPhase("thinking")}
                className="ui-pill inline-flex items-center gap-1.5 bg-surface-deep px-4 py-2 text-[13px] font-bold text-white hover:brightness-110"
              >
                <Sparkles size={14} /> {t("qr.compare")}
              </button>
            ) : phase === "thinking" ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-mute">
                <Spinner size={11} className="shrink-0" />
                {t("qr.weighing")}
              </span>
            ) : (
              <button
                type="button"
                onClick={onComplete}
                className="ui-pill inline-flex items-center gap-1.5 bg-surface-deep px-4 py-2 text-[13px] font-bold text-ink-inverse hover:bg-accent-green"
              >
                <CornerUpRight size={14} /> {t("qr.accept", { vendor: picked?.vendor ?? "" })}
              </button>
            )}
          </div>
        </div>
      </SpringIn>

      {open && <InboundEmailModal email={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
