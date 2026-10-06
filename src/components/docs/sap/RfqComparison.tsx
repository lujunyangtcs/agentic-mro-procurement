/**
 * Faithful SAP ME49-style price comparison list for a three-bid mini-tender.
 *
 * Mirrors the quotation price-comparison output: one column per supplier
 * quotation under a collective RFQ number, compared against a reference
 * quotation, with rank, % vs reference, delivered cost (gross + freight) and
 * effective price (gross + freight + tax). The Sourcing agent's output — it
 * recommends the on-contract supplier and hands the line to the PO agent.
 */

import { DocShell, DocTitleBand, SectionBand } from "./parts";
import { cn } from "@/lib/utils";

export type RfqBid = {
  rfqNumber: string;
  supplier: string;
  vendorCode: string;
  onContract: boolean;
  grossPrice: number;
  freight: number;
  tax: number;
  leadDays: number;
  paymentTerms: string;
  qualityScore: string;
  rank: number;
  recommended?: boolean;
};

export type RfqTender = {
  collectiveNumber: string;
  status: string;
  createdOn: string;
  createdBy: string;
  material: string;
  shortText: string;
  quantity: string;
  plant: string;
  reference: string;
  bids: RfqBid[];
};

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** The belt three-bid spot tender — BeltPro (on contract) wins on price and lead time. */
export const rfqBelt: RfqTender = {
  collectiveNumber: "RFQ-6600-2241",
  status: "Evaluated",
  createdOn: "2026-06-03 · 10:06",
  createdBy: "Tactical Sourcing Agent",
  material: "88-DBX",
  shortText: "Belt, double-backer — Corrugator No.2",
  quantity: "1 EA",
  plant: "M042 · Containerboard mill",
  reference: "BeltPro Industrial (reference quotation)",
  bids: [
    {
      rfqNumber: "6500041901",
      supplier: "BeltPro Industrial",
      vendorCode: "100482",
      onContract: true,
      grossPrice: 48200,
      freight: 0,
      tax: 0,
      leadDays: 5,
      paymentTerms: "Net 30",
      qualityScore: "A · 99.1% OTIF",
      rank: 1,
      recommended: true,
    },
    {
      rfqNumber: "6500041902",
      supplier: "Heartland Rubber",
      vendorCode: "100774",
      onContract: false,
      grossPrice: 49750,
      freight: 640,
      tax: 0,
      leadDays: 9,
      paymentTerms: "Net 30",
      qualityScore: "B · 96.4% OTIF",
      rank: 2,
    },
    {
      rfqNumber: "6500041903",
      supplier: "Midwest Belting Co",
      vendorCode: "101355",
      onContract: false,
      grossPrice: 51400,
      freight: 720,
      tax: 0,
      leadDays: 12,
      paymentTerms: "Net 45",
      qualityScore: "B · 95.0% OTIF",
      rank: 3,
    },
  ],
};

function delivered(b: RfqBid) {
  return b.grossPrice + b.freight;
}

export function RfqComparison({ tender = rfqBelt }: { tender?: RfqTender }) {
  const ref = tender.bids.find((b) => b.recommended) ?? tender.bids[0];
  const refDelivered = delivered(ref);

  return (
    <DocShell>
      <DocTitleBand
        number={tender.collectiveNumber}
        status={tender.status}
        docType="Price comparison · three-bid tender"
        system="SAP MM · ME49"
        createdOn={tender.createdOn}
        createdBy={tender.createdBy}
      />

      {/* Tender header */}
      <SectionBand>Collective RFQ</SectionBand>
      <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
        <div className="text-ink">
          <span className="text-mute">Material · </span>
          <span className="tabular-nums">{tender.material}</span> — {tender.shortText}
        </div>
        <div className="text-ink">
          <span className="text-mute">Quantity · </span>
          <span className="tabular-nums">{tender.quantity}</span>
          <span className="text-mute"> · Plant </span>
          {tender.plant}
        </div>
        <div className="text-ink col-span-2">
          <span className="text-mute">Reference quotation · </span>
          {tender.reference}
        </div>
      </div>

      {/* Comparison grid */}
      <SectionBand>Price comparison</SectionBand>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-surface-fog/60 text-left text-mute">
              {["Rank", "Supplier", "On contract", "Gross price", "Freight", "Delivered cost", "Δ vs ref", "Lead", "Terms"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {tender.bids.map((b) => {
              const dCost = delivered(b);
              const delta = dCost - refDelivered;
              const isWin = b.recommended;
              return (
                <tr key={b.vendorCode} className={cn("text-ink", isWin && "bg-[#eaf2fb]")}>
                  <td className="px-3 py-2.5 border-b border-divider tabular-nums">{b.rank}</td>
                  <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap">
                    <span className={cn(isWin && "font-bold")}>{b.supplier}</span>
                    <span className="text-mute"> · {b.vendorCode}</span>
                  </td>
                  <td className="px-3 py-2.5 border-b border-divider">
                    {b.onContract ? (
                      <span className="text-[10px] tracking-[0.04em] uppercase font-bold text-[#0a6ed1] bg-[#eaf2fb] px-1.5 py-0.5 rounded">
                        4600001207
                      </span>
                    ) : (
                      <span className="text-mute">Spot</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 border-b border-divider tabular-nums text-right whitespace-nowrap">
                    {usd(b.grossPrice)}
                  </td>
                  <td className="px-3 py-2.5 border-b border-divider tabular-nums text-right whitespace-nowrap">
                    {usd(b.freight)}
                  </td>
                  <td className="px-3 py-2.5 border-b border-divider tabular-nums text-right whitespace-nowrap font-medium">
                    {usd(dCost)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 border-b border-divider tabular-nums text-right whitespace-nowrap",
                      delta === 0 ? "text-[#107e3e] font-bold" : "text-mute",
                    )}
                  >
                    {delta === 0 ? "—" : `+${usd(delta)}`}
                  </td>
                  <td className="px-3 py-2.5 border-b border-divider tabular-nums whitespace-nowrap">{b.leadDays}d</td>
                  <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap">{b.paymentTerms}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recommendation */}
      <SectionBand>Recommendation</SectionBand>
      <div className="px-4 py-3">
        <div className="flex items-start gap-3 rounded-md bg-[#f4f6f9] border border-[#dfe4ea] px-3 py-3">
          <span className="text-[11px] tracking-[0.06em] uppercase text-[#107e3e] font-bold shrink-0 mt-0.5">
            Award
          </span>
          <p className="text-[12.5px] text-ink leading-snug">
            <span className="font-bold">{ref.supplier}</span> — lowest delivered cost ({usd(refDelivered)}),
            shortest lead time ({ref.leadDays} days) and the only on-contract bid (framework 4600001207, −8% vs
            list). Quality {ref.qualityScore}. Recommended for award and handed to the PO agent.
          </p>
        </div>
      </div>
    </DocShell>
  );
}
