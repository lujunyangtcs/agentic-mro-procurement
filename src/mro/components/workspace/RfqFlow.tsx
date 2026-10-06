import * as React from "react";
import { Check, CornerUpRight, Globe, Mail, Paperclip, Search, Sparkles } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { Spinner } from "@/mro/components/ai/Spinner";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { InboundEmailModal } from "@/mro/components/workspace/InboundEmailModal";
import { RfqDraftsModal } from "@/mro/components/workspace/RfqDraftsModal";
import type { InboundEmail, RfqSpec, RfqVendor } from "@/mro/data/runSteps";

/**
 * The RFQ / request-for-quote flow — plays in place of the extraction wizard on
 * the RFQ step. It is HUMAN-DRIVEN, not auto-fill: the agent has the requisition
 * from the prior step, the human kicks off a web search for vendors, the agent
 * generates the RFQ and drafts the vendor emails, the human sends them, and the
 * quotes come back by email — the OEM fast, the distributor after a negotiation
 * (a "negotiation in progress" spinner). The prices it lands match the next
 * step's vendor cards. On Continue it calls onComplete() and the step reveals.
 *   idle      — the requisition + a "Web search for vendors" button
 *   searching — the web search surfaces candidate suppliers
 *   ready     — the generated RFQ + draft vendor emails (RFQ attached); send
 *   awaiting  — quotes come back: OEM fast, distributor after a negotiation
 *   quotes    — both quotes in; continue to the vendor selection
 */

type Phase = "idle" | "searching" | "ready" | "awaiting" | "quotes";

const SEARCH_MS = 2600;
const QUOTE_FAST_MS = 1400; // OEM quotes quickly
const QUOTE_NEGOTIATE_MS = 3000; // distributor negotiates first

export function RfqFlow({ rfq, onComplete }: { rfq: RfqSpec; onComplete: () => void }) {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [landed, setLanded] = React.useState<Set<string>>(new Set());
  // The vendor quote email opened from a landed card (reply + previewable PDF).
  const [openQuote, setOpenQuote] = React.useState<InboundEmail | null>(null);
  /* The drafts take over the screen the moment they are written — four emails
     at once is the beat, and a row of small cards does not carry it. */
  const [draftsOpen, setDraftsOpen] = React.useState(false);

  // searching — the supplier search beat, then the RFQ is ready.
  React.useEffect(() => {
    if (phase !== "searching") return;
    const t = window.setTimeout(() => {
      setPhase("ready");
      setDraftsOpen(true);
    }, SEARCH_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  // awaiting — each vendor's quote lands on its own clock (OEM fast, distributor
  // after a negotiation), then we move to the quotes summary.
  React.useEffect(() => {
    if (phase !== "awaiting") return;
    const timers = rfq.vendors.map((v) =>
      window.setTimeout(() => setLanded((s) => new Set(s).add(v.id)), v.negotiating ? QUOTE_NEGOTIATE_MS : QUOTE_FAST_MS),
    );
    const done = window.setTimeout(() => setPhase("quotes"), QUOTE_NEGOTIATE_MS + 250);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(done);
    };
  }, [phase, rfq.vendors]);

  const startSearch = () => setPhase("searching");
  const send = () => {
    setDraftsOpen(false);
    setPhase("awaiting");
  };

  const searched = phase !== "idle" && phase !== "searching";
  const sent = phase === "awaiting" || phase === "quotes";
  const showDoc = searched;

  const checklist = [
    { label: "Reviewing the requisition for the RFQ", done: phase !== "idle" },
    { label: "Searching the supplier master and the web for suppliers", done: searched },
    { label: `Sending the RFQ to ${rfq.vendors.length} suppliers for a quote`, done: sent },
    { label: "Negotiating and collecting competitive quotes", done: phase === "quotes" },
  ];
  const activeIdx = phase === "idle" ? 0 : phase === "searching" ? 1 : !sent ? 2 : phase !== "quotes" ? 3 : 4;

  return (
    <div className="space-y-3 min-w-0">
      <div className="space-y-1.5">
        {checklist.slice(0, activeIdx + 1).map((s, i) => {
          const active = i === activeIdx;
          return (
            <div key={i} className="flex items-start gap-2 text-[12.5px] leading-snug">
              {s.done ? (
                <Check size={13} className="text-surface-deep mt-[3px] shrink-0" strokeWidth={3} />
              ) : (
                <Spinner size={13} className="mt-[2px] shrink-0" />
              )}
              <span className={active ? "text-ink font-medium" : "text-ink"}>{s.label}</span>
            </div>
          );
        })}
      </div>

      <SpringIn>
        <div className="bg-white border border-divider rounded-md overflow-hidden">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#eef1f5] border-b border-divider border-l-[3px] border-l-[#354a5f]">
            <Sparkles size={12} className="text-ink shrink-0" />
            <span className="text-[10.5px] uppercase tracking-[0.06em] text-ink font-bold">
              {phase === "idle"
                ? "RFQ — request for quote"
                : phase === "searching"
                  ? "Searching the web for suppliers"
                  : phase === "ready"
                    ? `RFQ ready · ${rfq.vendors.length} suppliers`
                    : phase === "awaiting"
                      ? "RFQs sent · negotiating"
                      : "Quotes in by email"}
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-[10px] text-mute whitespace-nowrap">
              {phase === "searching" ? (
                <><Spinner size={9} className="shrink-0" /> searching the web…</>
              ) : phase === "awaiting" ? (
                <><Spinner size={9} className="shrink-0" /> awaiting quotes…</>
              ) : phase === "quotes" ? (
                "done"
              ) : (
                ""
              )}
            </span>
          </div>

          <div className="p-4">
            {/* The requisition basis — shown statically (it carries over from the
                prior steps; no auto-fill). */}
            {phase === "idle" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                  {rfq.fields.map((f) => (
                    <RfqField key={f.label} label={f.label} value={f.value} />
                  ))}
                </div>
                <p className="text-[11.5px] text-mute leading-snug">
                  The buy is justified and the spec is set. Run a web search to surface approved and market
                  suppliers, then send the RFQ for competitive quotes.
                </p>
              </div>
            )}

            {phase === "searching" && <SearchBeat search={rfq.search} />}

            {showDoc && (
              <div className="space-y-3">
                <div className="overflow-x-auto">{rfq.rfqDoc}</div>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                  {rfq.vendors.map((v) => (
                    <VendorCard
                      key={v.id}
                      vendor={v}
                      phase={phase}
                      landed={landed.has(v.id)}
                      onOpen={v.reply ? () => setOpenQuote(v.reply!) : undefined}
                      onOpenDraft={v.draftEmail ? () => setOpenQuote(v.draftEmail!) : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-divider flex items-center gap-2">
            {phase === "idle" ? (
              <button
                type="button"
                onClick={startSearch}
                className="ui-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold bg-surface-deep text-white hover:brightness-110"
              >
                <Globe size={14} /> Web search for vendors
              </button>
            ) : phase === "ready" ? (
              <button
                type="button"
                onClick={() => setDraftsOpen(true)}
                className="ui-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold bg-surface-deep text-white hover:brightness-110"
              >
                <Mail size={14} /> Read the {rfq.vendors.length} drafts
              </button>
            ) : phase === "quotes" ? (
              <button
                type="button"
                onClick={onComplete}
                className="ui-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold bg-surface-deep text-ink-inverse hover:bg-accent-green"
              >
                <CornerUpRight size={14} /> Continue to vendor selection
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-mute">
                <Spinner size={11} className="shrink-0" />
                {phase === "awaiting" ? "Awaiting competitive quotes by email…" : "Searching…"}
              </span>
            )}
          </div>
        </div>
      </SpringIn>

      {draftsOpen && (
        <RfqDraftsModal
          vendors={rfq.vendors}
          /* The attachment names itself from the request it carries. */
          rfqLabel={rfq.vendors[0]?.draftEmail?.attachmentLabel?.split(" · ")[0] ?? "request-for-quotation"}
          onSend={send}
          onClose={() => setDraftsOpen(false)}
          onOpenPdf={(v) => v.draftEmail && setOpenQuote(v.draftEmail)}
        />
      )}
      {openQuote && <InboundEmailModal email={openQuote} onClose={() => setOpenQuote(null)} />}
    </div>
  );
}

function RfqField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block min-w-0">
      <span className="block text-[10px] uppercase tracking-[0.06em] text-mute font-medium mb-1">{label}</span>
      <div className="w-full rounded px-2.5 py-1.5 text-[12.5px] text-ink bg-[#f4f6f9] border border-[#dfe3e8] min-h-[32px]">
        {value}
      </div>
    </label>
  );
}

function SearchBeat({ search }: { search: RfqSpec["search"] }) {
  const [shown, setShown] = React.useState(0);
  React.useEffect(() => {
    const timers = search.results.map((_, i) =>
      window.setTimeout(() => setShown((n) => Math.max(n, i + 1)), 650 + i * 600),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [search.results]);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-md bg-surface-fog border border-divider px-3 py-2">
        <Globe size={14} className="text-surface-deep shrink-0" />
        <span className="text-[12.5px] text-ink truncate">{search.query}</span>
        <Spinner size={12} className="ml-auto shrink-0" />
      </div>
      <div className="space-y-1.5">
        {search.results.map((r, i) => (
          <div
            key={r.name}
            className={cn(
              "flex items-center gap-2.5 rounded-md border px-3 py-2 transition-all duration-300",
              i < shown
                ? "border-surface-deep/40 bg-surface-mint/30 opacity-100 translate-y-0"
                : "border-divider bg-white opacity-30 translate-y-0.5",
            )}
          >
            <Search size={13} className="text-surface-deep shrink-0" />
            <span className="text-[12.5px] font-medium text-ink">{r.name}</span>
            <span className="text-[11px] text-mute">· {r.via}</span>
            <span className="ml-auto text-[11px] text-mute whitespace-nowrap">{i < shown ? r.note : "…"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorCard({
  vendor,
  phase,
  landed,
  onOpen,
  onOpenDraft,
}: {
  vendor: RfqVendor;
  phase: Phase;
  landed: boolean;
  onOpen?: () => void;
  /** Opens the outgoing RFQ itself — the covering note and the PDF. */
  onOpenDraft?: () => void;
}) {
  return (
    <div className="rounded-md border border-divider bg-white p-3 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-bold text-ink truncate">{vendor.name}</span>
        <span className="text-[10px] text-mute shrink-0 whitespace-nowrap">{vendor.country ?? vendor.via}</span>
      </div>
      {phase === "ready" ? (
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.05em] text-surface-deep font-bold">
            <Mail size={11} /> RFQ draft
          </div>
          <div className="text-[11.5px] text-ink leading-snug">
            {vendor.local?.subject ?? vendor.draft.subject}
          </div>
          <p className="text-[11px] text-mute leading-snug">
            {(vendor.local?.lines ?? vendor.draft.lines)[0]}
          </p>
          {vendor.local && (
            /* The agent's translation — the message above is what sends. */
            <div className="rounded border border-surface-mint bg-surface-mint/30 px-2 py-1.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.05em] text-surface-deep">
                Translated for you · English
              </div>
              <div className="mt-0.5 text-[11px] leading-snug text-ink">{vendor.draft.subject}</div>
              <p className="text-[10.5px] leading-snug text-ink/80">{vendor.draft.lines[0]}</p>
            </div>
          )}
          {onOpenDraft ? (
            <button
              type="button"
              onClick={onOpenDraft}
              className="ui-pill inline-flex items-center gap-1 text-[10.5px] font-bold text-surface-deep hover:underline"
            >
              <Paperclip size={11} className="shrink-0" /> Open the RFQ · PDF
            </button>
          ) : (
            <div className="inline-flex items-center gap-1 text-[10.5px] text-mute">
              <Paperclip size={11} className="shrink-0" /> RFQ attached
            </div>
          )}
        </div>
      ) : landed ? (
        <SpringIn>
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="ui-pill w-full text-left rounded-md border border-divider bg-surface-fog/40 px-2.5 py-2 transition-colors hover:border-surface-deep hover:bg-surface-fog"
            >
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#107e3e]">
                <Mail size={12} /> Email reply · quote
              </div>
              <div className="text-[12.5px] font-bold text-ink tabular-nums mt-0.5">{vendor.quote.headline}</div>
              <p className="text-[11px] text-mute leading-snug">{vendor.quote.lines[0]}</p>
              <span className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-bold text-surface-deep">
                <Paperclip size={11} /> Open email · quotation PDF
              </span>
            </button>
          ) : (
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#107e3e]">
                <Mail size={12} /> Email reply · quote
              </div>
              <div className="text-[12.5px] font-bold text-ink tabular-nums">{vendor.quote.headline}</div>
              <p className="text-[11px] text-mute leading-snug">{vendor.quote.lines[0]}</p>
            </div>
          )}
        </SpringIn>
      ) : vendor.negotiating ? (
        <div className="flex items-center gap-2 rounded bg-[#c2740c]/10 border border-[#c2740c]/30 px-2.5 py-2">
          <Spinner size={12} className="shrink-0" />
          <span className="text-[11.5px] font-medium text-[#a8640a]">Negotiation in progress…</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[11.5px] text-mute">
          <Spinner size={11} className="shrink-0" /> Awaiting quote by email…
        </div>
      )}
    </div>
  );
}
