import { AIDot } from "@/components/ai/AIDot";
import { SpringIn } from "@/components/ai/SpringIn";
import { cn } from "@/lib/utils";

type Bid = {
  supplier: string;
  tag?: string;
  price: string;
  lead: string;
  freight: string;
  recommended?: boolean;
};

const bids: Bid[] = [
  { supplier: "BeltPro Industrial", tag: "On-contract", price: "$48,200", lead: "5 days", freight: "Included", recommended: true },
  { supplier: "Heartland Rubber & Belt", price: "$51,640", lead: "7 days", freight: "+$900" },
  { supplier: "Apex Conveyor Supply", price: "$49,900", lead: "9 days", freight: "+$1,400" },
];

export function BidCompareCard() {
  return (
    <SpringIn>
      <article className="bg-white border border-divider rounded-md p-6 space-y-4">
        <header className="flex items-center gap-2">
          <AIDot size={6} tone="deep" pulse />
          <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Three-bid spot tender
          </span>
          <span className="ml-auto text-[12px] text-mute">Recommend the on-contract supplier</span>
        </header>

        <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-x-3 text-[11px] uppercase tracking-[0.06em] text-mute font-medium px-3">
          <span>Supplier</span>
          <span className="text-right">Price</span>
          <span className="text-right">Lead time</span>
          <span className="text-right">Freight</span>
        </div>

        <div className="space-y-2">
          {bids.map((b) => (
            <div
              key={b.supplier}
              className={cn(
                "grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-x-3 items-center rounded-md px-3 py-2.5",
                b.recommended ? "bg-surface-mint border border-surface-deep/20" : "bg-surface-fog",
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-ink truncate">{b.supplier}</span>
                  {b.tag && (
                    <span className="text-[10px] tracking-[0.06em] uppercase font-medium px-1.5 py-0.5 rounded bg-white text-surface-deep">
                      {b.tag}
                    </span>
                  )}
                </div>
                {b.recommended && (
                  <span className="text-[11px] text-surface-deep font-medium">Recommended</span>
                )}
              </div>
              <span className={cn("text-right text-[14px]", b.recommended ? "font-bold text-ink" : "text-ink")}>
                {b.price}
              </span>
              <span className="text-right text-[14px] text-ink">{b.lead}</span>
              <span className="text-right text-[14px] text-ink">{b.freight}</span>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-md bg-surface-fog px-3 py-2.5">
          <AIDot size={6} tone="green" className="mt-1.5" />
          <p className="text-[12px] text-ink leading-snug">
            Vendor master spotted "BeltPro Ltd" as a duplicate of the on-contract "BeltPro
            Industrial" and merged the records before inviting bids — so the tender stayed clean.
          </p>
        </div>
      </article>
    </SpringIn>
  );
}
