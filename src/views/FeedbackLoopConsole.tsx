import * as React from "react";
import {
  Check,
  Repeat,
  ArrowRight,
  Link2,
  Sparkles,
  Banknote,
  Gauge,
  Handshake,
  TrendingUp,
} from "lucide-react";
import { useApp } from "@/state";
import { cn } from "@/lib/utils";
import { TopRow } from "@/components/blocks/TopRow";
import { PillButton } from "@/components/blocks/PillButton";
import { StatusPill } from "@/components/blocks/StatusPill";
import { AIDot } from "@/components/ai/AIDot";
import { SpringIn } from "@/components/ai/SpringIn";

/* ──────────────────────────────────────────────────────────────────────────
 * Feedback Loop Console — the stakeholder story made literal.
 *
 * Procurement and Payables are one closed loop. Autonomous Payables doesn't
 * just match-and-pay; it feeds insight BACK into procurement. This surface
 * renders four concrete value moves, each as an equal-height card with:
 *   · the evidence (numbers, before → after, the four-way-match chain)
 *   · a visible "→ feeds back to procurement" link to the receiving agent
 *   · a GenAI-drafted action that a human approves / sends (never auto-raised)
 *
 * Restrained, enterprise. Every figure is concrete and ties to the demo's
 * canonical vendors (BeltPro Industrial 100482, Apex Drives, Midwest Belting,
 * Cascade Fluid Systems) for Northgate Paper Co.
 * ────────────────────────────────────────────────────────────────────────── */

type AgentTarget = "intake" | "sourcing" | "po" | "invoice" | "vendor";

type ChainNode = { label: string; ref: string; ok: boolean };

type MetricMove = { label: string; before: string; after: string; gain: string };

type Move = {
  id: string;
  n: number;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  /** One-line "what Payables saw". */
  summary: string;
  /** Receiving procurement agent for the feedback link. */
  feedsTo: AgentTarget;
  feedsLabel: string;
  /** The bold value headline shown top-right of the card. */
  headline: { value: string; caption: string };
  /** GenAI-drafted message the human approves & sends to procurement. */
  draft: { to: string; body: React.ReactNode };
  approveLabel: string;
  /** Confirmation note shown once the human has sent it. */
  sentNote: string;
  /** Card-specific evidence body. */
  evidence: React.ReactNode;
};

/* ── Small evidence primitives ─────────────────────────────────────────── */

/** Contract → PR → PO → GRN → Invoice chain with per-link match state. */
function MatchChain({ nodes }: { nodes: ChainNode[] }) {
  return (
    <div className="flex items-stretch gap-1.5 flex-wrap">
      {nodes.map((node, i) => (
        <React.Fragment key={node.label}>
          <div
            className={cn(
              "flex-1 min-w-[92px] rounded-md border px-2.5 py-2",
              node.ok
                ? "border-surface-deep/25 bg-surface-mint/30"
                : "border-mark-red/30 bg-surface-rose/25",
            )}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0",
                  node.ok ? "bg-surface-deep text-ink-inverse" : "bg-mark-red text-ink-inverse",
                )}
              >
                {node.ok ? <Check size={9} strokeWidth={3.5} /> : <span className="text-[9px] font-bold leading-none">!</span>}
              </span>
              <span className="text-[10px] tracking-[0.04em] uppercase font-bold text-ink truncate">
                {node.label}
              </span>
            </div>
            <div className="text-[11px] text-mute tabular-nums mt-1 truncate">{node.ref}</div>
          </div>
          {i < nodes.length - 1 && (
            <span className="self-center shrink-0 text-mute" aria-hidden>
              <ArrowRight size={13} />
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/** A before → after metric with the gain pill on the right. */
function BeforeAfter({ moves }: { moves: MetricMove[] }) {
  return (
    <div className="space-y-2">
      {moves.map((m) => (
        <div
          key={m.label}
          className="flex items-center gap-3 rounded-md bg-surface-fog px-3 py-2.5"
        >
          <span className="text-[12px] text-mute w-28 shrink-0">{m.label}</span>
          <span className="text-[14px] font-medium text-mute tabular-nums line-through decoration-mute/50">
            {m.before}
          </span>
          <ArrowRight size={13} className="text-surface-deep shrink-0" />
          <span className="text-[15px] font-bold text-ink tabular-nums">{m.after}</span>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-surface-deep bg-surface-mint px-2 py-0.5 rounded-full tabular-nums shrink-0">
            <TrendingUp size={11} strokeWidth={2.4} /> {m.gain}
          </span>
        </div>
      ))}
    </div>
  );
}

/** A labelled stat tile row (vendor, discount, performance). */
function StatTiles({ items }: { items: { label: string; value: string; tone?: "deep" | "ink" }[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((s) => (
        <div key={s.label} className="rounded-md border border-divider bg-white px-3 py-2.5">
          <div className="text-[10px] tracking-[0.05em] uppercase text-mute font-medium">{s.label}</div>
          <div
            className={cn(
              "text-[15px] font-bold mt-0.5 tabular-nums leading-tight",
              s.tone === "deep" ? "text-surface-deep" : "text-ink",
            )}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── The four value moves ──────────────────────────────────────────────── */

const moves: Move[] = [
  {
    id: "match-pay",
    n: 1,
    icon: Banknote,
    title: "Match & pay — clean items release, exceptions feed back",
    summary:
      "Payables ran the four-way match across the contract → PR → PO → goods-received note → invoice chain on today's batch.",
    feedsTo: "invoice",
    feedsLabel: "Invoice Resolution agent",
    headline: { value: "186 / 204", caption: "matched clean & paid" },
    approveLabel: "Approve & release clean batch",
    sentNote: "186 clean items released to AP · 18 exceptions routed to the buyer with a classified fix.",
    evidence: (
      <div className="space-y-3">
        <div>
          <div className="text-[11px] tracking-[0.05em] uppercase text-mute font-medium mb-1.5">
            BeltPro Industrial · INV-BPI-5567 · the chain ties out
          </div>
          <MatchChain
            nodes={[
              { label: "Contract", ref: "4600001207", ok: true },
              { label: "PR", ref: "PR-50318", ok: true },
              { label: "PO", ref: "PO-77310", ok: true },
              { label: "GR note", ref: "GR-77310", ok: true },
              { label: "Invoice", ref: "BPI-5567", ok: true },
            ]}
          />
        </div>
        <div>
          <div className="text-[11px] tracking-[0.05em] uppercase text-mute font-medium mb-1.5">
            Midwest Belting · INV-MW-0991 · price link breaks → does not pay
          </div>
          <MatchChain
            nodes={[
              { label: "Contract", ref: "4600000934", ok: true },
              { label: "PR", ref: "PR-50204", ok: true },
              { label: "PO", ref: "PO-77118", ok: true },
              { label: "GR note", ref: "GR-77118", ok: true },
              { label: "Invoice", ref: "+$310 var.", ok: false },
            ]}
          />
        </div>
        <p className="text-[12px] text-mute leading-snug">
          204 invoices in today's run · 186 four-way clean and scheduled to pay · 18 held on a price, quantity or
          receipt gap. The exceptions are the signal that feeds procurement — not noise.
        </p>
      </div>
    ),
    draft: {
      to: "Invoice Resolution agent · AP payment run",
      body: (
        <>
          Release the <span className="font-bold">186 four-way-clean invoices</span> ($2.41M) to the Net-30 run.
          Hold the <span className="font-bold">18 exceptions</span> and open a buyer task per item — lead with
          Midwest Belting INV-MW-0991 (+$310 over contract 4600000934).
        </>
      ),
    },
  },
  {
    id: "payment-timing",
    n: 2,
    icon: Gauge,
    title: "Payment timing → cash flow",
    summary:
      "Payables modelled actual payment dates against contract terms and best-in-class peers, then sized the working-capital gap.",
    feedsTo: "po",
    feedsLabel: "PO Management agent",
    headline: { value: "$4.7M", caption: "cash freed (one-off)" },
    approveLabel: "Approve & enforce terms in PO",
    sentNote:
      "Term-discipline rule sent to the PO agent · default payment date moves to contract Net-day on new orders.",
    evidence: (
      <div className="space-y-3">
        <BeforeAfter
          moves={[
            { label: "Days payable (DPO)", before: "38 days", after: "52 days", gain: "+14 days" },
            { label: "Cash freed", before: "$0", after: "$4.7M", gain: "one-off" },
            { label: "Run-rate carry", before: "—", after: "$310K/yr", gain: "at 6.6%" },
          ]}
        />
        <p className="text-[12px] text-mute leading-snug">
          We were paying <span className="font-medium text-ink">14 days early</span> against agreed terms on 61% of
          spend — leaking working capital for no discount. Moving the default payment date to the contracted Net-day
          (without breaching any early-pay discount) frees <span className="font-bold text-ink">$4.7M</span> of cash.
          The recommendation routes to procurement to enforce the terms on the PO.
        </p>
      </div>
    ),
    draft: {
      to: "PO Management agent · payment-term guardrail",
      body: (
        <>
          Set the default payment date to the <span className="font-bold">contracted Net-day</span> on new POs and
          flag any order acknowledged with shorter terms. Preserve early-pay discounts where the captured rate beats
          our <span className="font-bold">6.6% cost of capital</span>. Target portfolio DPO{" "}
          <span className="font-bold">52 days</span>.
        </>
      ),
    },
  },
  {
    id: "discount-perf",
    n: 3,
    icon: Sparkles,
    title: "Vendor discount + performance → re-prioritise sourcing",
    summary:
      "Payables captured an early-pay discount on a vendor that is also a top delivery performer, and flagged it to procurement to source on priority.",
    feedsTo: "sourcing",
    feedsLabel: "Spot Buying agent",
    headline: { value: "$128K", caption: "discount captured YTD" },
    approveLabel: "Approve & re-prioritise vendor",
    sentNote:
      "Apex Drives moved to preferred-first in the sourcing pool · routed to the Spot Buying agent.",
    evidence: (
      <div className="space-y-3">
        <StatTiles
          items={[
            { label: "Vendor", value: "Apex Drives", tone: "deep" },
            { label: "Early-pay discount", value: "2/10 Net 30" },
            { label: "Captured YTD", value: "$128K", tone: "deep" },
          ]}
        />
        <StatTiles
          items={[
            { label: "On-time delivery", value: "98.6%" },
            { label: "Quality (PPM)", value: "120" },
            { label: "Disputes / 1k", value: "0.4" },
          ]}
        />
        <p className="text-[12px] text-mute leading-snug">
          Apex tops both axes — finance is banking a{" "}
          <span className="font-medium text-ink">2% discount ($128K YTD)</span> and operations sees{" "}
          <span className="font-medium text-ink">98.6% on-time</span>. Feed this to procurement so Apex sources first
          on overlapping categories. <span className="font-bold text-surface-deep">→ procurement re-prioritised.</span>
        </p>
      </div>
    ),
    draft: {
      to: "Spot Buying agent · sourcing priority",
      body: (
        <>
          Promote <span className="font-bold">Apex Drives</span> to preferred-first on drives &amp; couplings RFQs.
          Rationale: <span className="font-bold">2/10 Net 30</span> discount ($128K captured YTD) plus 98.6% on-time
          and 120 PPM quality. Direct the next 3 routine mini-tenders to Apex first.
        </>
      ),
    },
  },
  {
    id: "joint-negotiation",
    n: 4,
    icon: Handshake,
    title: "Better-rate vendor → finance ↔ procurement negotiation",
    summary:
      "Same product, stronger performance, but a higher unit rate. Finance drafted a joint negotiation to win back the gap on terms.",
    feedsTo: "vendor",
    feedsLabel: "MDM Support agent",
    headline: { value: "$96K", caption: "value recovered / yr" },
    approveLabel: "Approve & open joint negotiation",
    sentNote:
      "Joint negotiation brief sent · Cascade revised to 2/10 Net 45 · MDM updating the purchasing-info record.",
    evidence: (
      <div className="space-y-3">
        <StatTiles
          items={[
            { label: "Vendor", value: "Cascade Fluid", tone: "deep" },
            { label: "Unit rate vs. incumbent", value: "+6.2%" },
            { label: "On-time delivery", value: "99.1%" },
          ]}
        />
        <BeforeAfter
          moves={[
            { label: "Payment terms", before: "Net 30", after: "2/10 Net 45", gain: "+15 days" },
            { label: "Effective price gap", before: "+6.2%", after: "+1.1%", gain: "−5.1 pts" },
          ]}
        />
        <p className="text-[12px] text-mute leading-snug">
          Cascade is 6.2% dearer per unit but the best performer on the line. Finance and procurement negotiate as one:
          trade longer payment days for an early-pay discount, closing the gap to{" "}
          <span className="font-medium text-ink">+1.1%</span> and recovering{" "}
          <span className="font-bold text-ink">$96K/yr</span> — without losing the performance.
        </p>
      </div>
    ),
    draft: {
      to: "MDM Support agent · terms & PIR update",
      body: (
        <>
          Open a <span className="font-bold">joint finance–procurement negotiation</span> with Cascade Fluid Systems:
          concede <span className="font-bold">Net 45</span> in exchange for a <span className="font-bold">2/10</span>{" "}
          early-pay discount. On acceptance, update the purchasing-info record and contracted terms. Recovers{" "}
          <span className="font-bold">$96K/yr</span> at unchanged volume.
        </>
      ),
    },
  },
];

/* ── Per-card UI ───────────────────────────────────────────────────────── */

function FeedbackArrow() {
  return (
    <div className="flex items-center gap-2 py-1" aria-hidden>
      <span className="text-[10px] tracking-[0.06em] uppercase text-surface-deep font-bold">Feeds back to procurement</span>
      <span className="flex-1 relative h-4">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 8">
          <line
            x1="0"
            y1="4"
            x2="96"
            y2="4"
            stroke="var(--accent-green-deep)"
            strokeWidth="1.5"
            strokeOpacity="0.45"
            className="hr-flow-soft"
          />
          <path d="M96 1 L100 4 L96 7 Z" fill="var(--accent-green-deep)" fillOpacity="0.75" />
        </svg>
      </span>
    </div>
  );
}

function MoveCard({ move }: { move: Move }) {
  const { go } = useApp();
  const [sent, setSent] = React.useState(false);
  const Icon = move.icon;

  return (
    <SpringIn className="h-full">
      <article className="h-full flex flex-col bg-white border border-divider rounded-md overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-divider">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-lg bg-surface-deep flex items-center justify-center shrink-0 relative">
              <Icon size={19} strokeWidth={1.9} className="text-ink-inverse" />
              <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-white border border-divider text-surface-deep text-[11px] font-bold flex items-center justify-center">
                {move.n}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-bold text-ink leading-snug">{move.title}</h2>
              <p className="text-[12px] text-mute leading-snug mt-1">{move.summary}</p>
            </div>
            <div className="text-right shrink-0 pl-2">
              <div className="text-[20px] font-bold text-surface-deep leading-none tabular-nums">
                {move.headline.value}
              </div>
              <div className="text-[10px] tracking-[0.04em] uppercase text-mute mt-1">{move.headline.caption}</div>
            </div>
          </div>
        </div>

        {/* Evidence */}
        <div className="px-5 py-4 flex-1">{move.evidence}</div>

        {/* Feedback link to the receiving agent */}
        <div className="px-5">
          <FeedbackArrow />
          <button
            type="button"
            onClick={() => go({ kind: "agent", id: move.feedsTo })}
            className="ui-pill w-full flex items-center gap-2.5 rounded-md border border-surface-deep/25 bg-surface-mint/30 px-3 py-2.5 text-left hover:bg-surface-mint/55"
          >
            <Link2 size={14} className="text-surface-deep shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-bold text-ink leading-tight">{move.feedsLabel}</span>
              <span className="block text-[11px] text-mute leading-tight">Open the receiving procurement agent</span>
            </span>
            <ArrowRight size={14} className="text-surface-deep shrink-0" />
          </button>
        </div>

        {/* GenAI draft + human action */}
        <div className="px-5 pt-3 pb-5 mt-1">
          <div className="rounded-md bg-surface-fog/70 border border-divider px-3.5 py-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AIDot size={5} tone="deep" pulse={!sent} />
              <span className="text-[10px] tracking-[0.06em] uppercase text-surface-deep font-bold">
                AI-drafted for {move.draft.to}
              </span>
            </div>
            <p className="text-[12.5px] text-ink leading-[19px]">{move.draft.body}</p>
          </div>

          {sent ? (
            <div className="mt-3 flex items-start gap-2 rounded-md bg-surface-mint/40 border border-surface-deep/20 px-3 py-2.5">
              <span className="w-5 h-5 rounded-md bg-surface-deep text-ink-inverse flex items-center justify-center shrink-0 mt-0.5">
                <Check size={12} strokeWidth={3} />
              </span>
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-surface-deep">Sent to procurement · audit logged</div>
                <div className="text-[12px] text-mute leading-snug mt-0.5">{move.sentNote}</div>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[11px] text-mute leading-snug">
                You approve every hand-off — the agent drafts, you send.
              </span>
              <PillButton variant="deep" size="sm" arrow onClick={() => setSent(true)} className="shrink-0">
                {move.approveLabel}
              </PillButton>
            </div>
          )}
        </div>
      </article>
    </SpringIn>
  );
}

/* ── Loop banner ───────────────────────────────────────────────────────── */

function LoopBanner() {
  const ring = [
    { label: "Procurement", sub: "PR · sourcing · PO" },
    { label: "Payables", sub: "match · pay · terms" },
    { label: "Insight", sub: "timing · discount · perf" },
  ];
  return (
    <SpringIn>
      <section className="bg-surface-mint rounded-md px-5 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-10 h-10 rounded-lg bg-surface-deep flex items-center justify-center shrink-0">
            <Repeat size={19} strokeWidth={2} className="text-ink-inverse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <AIDot size={6} tone="deep" pulse />
              <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-bold">
                One closed loop · Procurement ↔ Payables
              </span>
            </div>
            <p className="text-[13px] text-ink leading-snug max-w-3xl">
              Autonomous Payables doesn't just match and pay — it feeds insight back into procurement. Four value moves
              are ready below: each shows the evidence and routes a drafted action to the receiving agent. You approve
              every hand-off.
            </p>
          </div>
          <div className="ml-auto hidden lg:flex items-center gap-1.5 shrink-0">
            {ring.map((r, i) => (
              <React.Fragment key={r.label}>
                <div className="rounded-md bg-white/70 border border-surface-deep/15 px-3 py-1.5 text-center">
                  <div className="text-[12px] font-bold text-surface-deep leading-tight">{r.label}</div>
                  <div className="text-[10px] text-mute leading-tight">{r.sub}</div>
                </div>
                {i < ring.length - 1 && <ArrowRight size={14} className="text-surface-deep" />}
              </React.Fragment>
            ))}
            <ArrowRight size={14} className="text-surface-deep rotate-180 -ml-0.5 opacity-50" />
          </div>
        </div>
      </section>
    </SpringIn>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export function FeedbackLoopConsole() {
  return (
    <div className="pl-5 pr-6 pt-4 pb-10 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <TopRow breadcrumb={{ label: "Procure-to-pay", chip: "Feedback loop" }} />

      <div className="mt-3 space-y-3">
        <LoopBanner />

        <div className="flex items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-2.5">
            <AIDot size={6} tone="deep" />
            <span className="text-[12px] font-medium tracking-[0.08em] uppercase text-surface-deep">
              Finance → procurement value moves
            </span>
            <span className="text-[12px] text-mute">4 insights ready for your approval</span>
          </div>
          <StatusPill label="Payables → Procurement live" kind="active" pulse />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-stretch">
          {moves.map((m) => (
            <MoveCard key={m.id} move={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
