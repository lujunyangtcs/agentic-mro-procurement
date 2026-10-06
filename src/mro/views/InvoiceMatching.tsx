/**
 * Invoice matching — the tie-out page.
 *
 * Before any supplier invoice is paid, four documents have to agree: what the
 * contract priced, what the order asked for, what actually arrived, and what
 * the supplier billed. Where they agree the invoice clears without a person.
 * Where they do not, the gap is money — and the page shows exactly how much,
 * derived from the documents rather than typed in.
 */

import * as React from "react";
import { ChevronDown, Check, AlertTriangle } from "lucide-react";
import { icons, TileIcon } from "@/mro/components/console/icons";
import { cn } from "@/mro/lib/utils";
import { useProcurement } from "@/mro/data/store";
import {
  invoiceAmount,
  poAmount,
  contractAmount,
  receivedAmount,
  tieoutAgrees,
  tieoutGap,
  tieoutReason,
  totalRecoverable,
  clearedAmount,
  priceVariance,
  qtyVariance,
  usd,
  type InvoiceTieout,
} from "@/mro/data/procurement";
import { ConsolePage, StatTiles, Panel, AiFinding } from "@/mro/components/console/kit";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { PillButton } from "@/mro/components/blocks/PillButton";

/* ── One document line in the comparison ────────────────────────────────── */

function DocLine({
  label,
  reference,
  qty,
  uomNote,
  amount,
  ok,
  note,
}: {
  label: string;
  reference: string;
  qty: string;
  uomNote?: string;
  amount: string;
  ok: boolean;
  note?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[150px_1fr_120px_140px] items-center gap-4 rounded-md border px-4 py-3",
        ok ? "border-divider bg-white" : "border-mark-red/35 bg-surface-rose/40",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {ok ? (
          <Check size={14} strokeWidth={2.6} className="text-accent-green shrink-0" />
        ) : (
          <AlertTriangle size={14} strokeWidth={2.2} className="text-mark-red shrink-0" />
        )}
        <span className="text-[13px] font-semibold text-ink whitespace-nowrap">{label}</span>
      </div>
      <div className="min-w-0">
        <div className="text-[13px] text-ink">{reference}</div>
        {note && <div className="text-[12px] text-mute mt-0.5">{note}</div>}
      </div>
      <div className="text-[13px] text-ink tabular-nums text-right whitespace-nowrap">
        {qty}
        {uomNote && <span className="text-mute"> {uomNote}</span>}
      </div>
      <div
        className={cn(
          "text-[13px] font-medium tabular-nums text-right whitespace-nowrap",
          ok ? "text-ink" : "text-mark-red",
        )}
      >
        {amount}
      </div>
    </div>
  );
}

/* ── One tie-out row ────────────────────────────────────────────────────── */

function TieoutRow({
  t,
  open,
  onToggle,
  onClaim,
  claimed,
}: {
  t: InvoiceTieout;
  open: boolean;
  onToggle: () => void;
  onClaim: () => void;
  claimed: boolean;
}) {
  const agrees = tieoutAgrees(t);
  const gap = tieoutGap(t);
  const reason = tieoutReason(t);
  const priceOff = priceVariance(t) !== 0;
  const qtyOff = qtyVariance(t) !== 0;

  return (
    <div className="rounded-md border border-divider overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="ui-pill w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-surface-fog/70 transition-colors"
      >
        <span className="text-[13px] font-medium text-ink whitespace-nowrap w-[92px]">
          {t.id}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium whitespace-nowrap",
            agrees
              ? "bg-surface-mint text-surface-deep"
              : "bg-surface-rose text-mark-red",
          )}
        >
          {agrees ? <Check size={13} strokeWidth={2.6} /> : <AlertTriangle size={13} />}
          {agrees ? "Documents agree" : "Does not agree"}
        </span>
        <span className="text-[13px] text-ink flex-1 min-w-0 truncate">
          {agrees ? t.description : reason}
        </span>
        {!agrees && (
          <span className="text-[13px] font-bold text-mark-red tabular-nums whitespace-nowrap">
            {usd(gap)}
          </span>
        )}
        {claimed && (
          <span className="rounded-full bg-surface-mint px-3 py-1 text-[13px] font-medium text-surface-deep whitespace-nowrap">
            Claim raised
          </span>
        )}
        <ChevronDown
          size={16}
          className={cn("text-mute shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <SpringIn className="border-t border-divider bg-surface-fog/50 px-4 py-4">
          <AiFinding text={t.note ?? ""} className="mb-3 bg-white/70" />

          <div className="grid grid-cols-[150px_1fr_120px_140px] gap-4 px-4 pb-1.5">
            <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-mute">
              Document
            </span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-mute">
              Reference
            </span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-mute text-right">
              Quantity
            </span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-mute text-right">
              Value
            </span>
          </div>

          <div className="space-y-2">
            <DocLine
              label="Agreement"
              reference={t.contract.reference}
              note="The price we agreed with the supplier"
              qty={String(t.contract.qty)}
              amount={usd(contractAmount(t))}
              ok
            />
            <DocLine
              label="Purchase order"
              reference={t.po.reference}
              note="What we asked the supplier to send"
              qty={String(t.po.qty)}
              amount={usd(poAmount(t))}
              ok
            />
            <DocLine
              label="Goods receipt"
              reference={t.gr.reference}
              note="What the plant confirmed actually arrived"
              qty={String(t.gr.qty)}
              amount={usd(receivedAmount(t))}
              ok={!qtyOff}
            />
            <DocLine
              label="Supplier invoice"
              reference={t.invoice.reference}
              note={`Billed at ${usd(t.invoice.unitPrice)} each`}
              qty={String(t.invoice.qty)}
              amount={usd(invoiceAmount(t))}
              ok={!priceOff && !qtyOff}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 rounded-md border border-divider bg-white px-4 py-3">
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-ink">
                {agrees ? "Cleared for payment" : "Held back from payment"}
              </div>
              <p className="text-[13px] text-mute leading-snug mt-0.5">
                {agrees
                  ? `All four documents agree at ${usd(invoiceAmount(t))} on ${t.terms} terms.`
                  : `${usd(receivedAmount(t))} is payable now. ${usd(gap)} is withheld until the supplier settles it.`}
              </p>
            </div>
            {!agrees && !claimed && (
              <PillButton variant="deep" onClick={onClaim} className="whitespace-nowrap">
                Raise the claim
              </PillButton>
            )}
            {!agrees && claimed && (
              <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-surface-mint px-3.5 py-2 text-[13px] font-medium text-surface-deep">
                <Check size={14} strokeWidth={2.6} />
                Claim raised with the supplier
              </span>
            )}
          </div>
        </SpringIn>
      )}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export function InvoiceMatching() {
  const { tieouts, audit, raiseClaim } = useProcurement();
  const [openId, setOpenId] = React.useState<string | null>(null);

  const mismatched = tieouts.filter((t) => !tieoutAgrees(t));
  const agreed = tieouts.filter(tieoutAgrees);
  const claimedIds = new Set(audit.map((a) => a.reference));

  return (
    <ConsolePage
      title="Invoice matching"
      lead="Before a supplier invoice is paid, four documents have to agree: the price we agreed, the order we placed, what actually arrived, and what we were billed. Where they agree the invoice clears on its own; where they do not, the difference is money we hold back."
    >
      <StatTiles
        items={[
          {
            label: "Invoices checked",
            value: tieouts.length,
            icon: <TileIcon icon={icons.invoice} />,
            sub: "Received in the last three days",
          },
          {
            label: "Cleared without a person",
            value: agreed.length,
            tone: "deep",
            sub: `${usd(clearedAmount(tieouts), 0)} paid on agreed terms`,
            icon: <TileIcon icon={icons.touchless} />,
          },
          {
            label: "Do not agree",
            value: mismatched.length,
            tone: "red",
            sub: "Held back until the supplier settles",
            icon: <TileIcon icon={icons.disagree} />,
          },
          {
            label: "Recoverable",
            value: totalRecoverable(tieouts),
            prefix: "$",
            tone: "red",
            sub: "Billed above what we agreed or received",
            icon: <TileIcon icon={icons.recoverable} />,
          },
        ]}
      />

      <Panel
        title="Order-to-invoice tie-out"
        sub="Open any invoice to see the four documents side by side. The differences are worked out from the documents themselves, so the figure here and the figure on the claim are always the same number."
      >
        <div className="px-5 pb-5 pt-1 space-y-3">
          {[...mismatched, ...agreed].map((t) => (
            <TieoutRow
              key={t.id}
              t={t}
              open={openId === t.id}
              onToggle={() => setOpenId(openId === t.id ? null : t.id)}
              onClaim={() => raiseClaim(t.id)}
              claimed={claimedIds.has(t.id)}
            />
          ))}
        </div>
      </Panel>
    </ConsolePage>
  );
}
