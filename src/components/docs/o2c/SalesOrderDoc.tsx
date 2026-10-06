/**
 * SAP SD sales order — the order-to-cash origin of the BlueRidge receivable.
 * The Order Management agent turns the customer's purchase order into a standard
 * sales order: sold-to / ship-to, the containerboard line, contract pricing and
 * the Net-45 terms that later make the invoice overdue. Faithful-but-light SAP
 * SD chrome (VA03 display). Presentational — takes an `order`.
 */

import { DocShell, DocTitleBand, SectionBand, Field } from "../sap/parts";

export type SalesOrder = {
  number: string;
  status: string;
  createdOn: string;
  createdBy: string;
  soldTo: string;
  soldToCode: string;
  shipTo: string;
  customerPo: string;
  terms: string;
  incoterms: string;
  currency: string;
  item: {
    line: string;
    material: string;
    shortText: string;
    quantity: string;
    unit: string;
    netPrice: string;
    per: string;
    netValue: string;
    plant: string;
  };
  pricing: { label: string; rate: string; value: string; sign?: "+" | "−" | "=" }[];
  schedule: { reqDate: string; confirmedDate: string; creditStatus: string };
};

export const orderBlueRidge: SalesOrder = {
  number: "SO-58841",
  status: "Completed · delivered & billed",
  createdOn: "2026-03-28 · 10:12",
  createdBy: "Order Management Agent",
  soldTo: "BlueRidge Foods Co.",
  soldToCode: "0000610248",
  shipTo: "BlueRidge Foods Co. · DC Memphis (Ship-to 0000610248-01)",
  customerPo: "BRF-PO-7741",
  terms: "ZB45 · Net 45 (contract CTR-BRF-2024)",
  incoterms: "FCA · Northgate Memphis Mill",
  currency: "USD",
  item: {
    line: "10",
    material: "CB-42ECT",
    shortText: "Containerboard — 42 ECT kraft linerboard",
    quantity: "320",
    unit: "MT",
    netPrice: "651.25",
    per: "1 MT",
    netValue: "208,400.00",
    plant: "M042 · Containerboard mill",
  },
  pricing: [
    { label: "PR00 · List price", rate: "693.88 / 1 MT", value: "222,041.60", sign: "+" },
    { label: "K007 · Contract discount (CTR-BRF-2024)", rate: "−6.14%", value: "13,641.60", sign: "−" },
    { label: "Net value (sales order)", rate: "", value: "208,400.00", sign: "=" },
  ],
  schedule: {
    reqDate: "2026-04-01",
    confirmedDate: "2026-04-01 · fully confirmed",
    creditStatus: "Released · within credit limit at order date",
  },
};

export function SalesOrderDoc({ order = orderBlueRidge }: { order?: SalesOrder }) {
  return (
    <DocShell>
      <DocTitleBand
        number={order.number}
        status={order.status}
        docType="OR · Standard sales order"
        system="SAP SD · VA03"
        createdOn={order.createdOn}
        createdBy={order.createdBy}
      />

      <SectionBand>Sold-to & ship-to</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Sold-to party" value={order.soldTo} />
        <Field label="Customer code" value={order.soldToCode} mono />
        <Field label="Customer PO" value={order.customerPo} mono />
        <Field label="Ship-to party" value={order.shipTo} />
        <Field label="Payment terms" value={order.terms} />
        <Field label="Incoterms" value={order.incoterms} />
      </div>

      <SectionBand>Order item</SectionBand>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-surface-fog/60 text-left text-mute">
              {["Item", "Material", "Description", "Qty", "Net price", "Net value"].map((h, i) => (
                <th key={i} className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-ink">
              <td className="px-3 py-2.5 border-b border-divider text-mute tabular-nums">{order.item.line}</td>
              <td className="px-3 py-2.5 border-b border-divider font-semibold text-surface-deep tabular-nums">{order.item.material}</td>
              <td className="px-3 py-2.5 border-b border-divider">{order.item.shortText}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums">{order.item.quantity} {order.item.unit}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums">{order.item.netPrice} / {order.item.per}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums font-medium">{order.currency} {order.item.netValue}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-[11px] text-mute">
        Plant {order.item.plant}
      </div>

      <SectionBand>Pricing — item 10</SectionBand>
      <div className="px-4 py-3 space-y-1.5">
        {order.pricing.map((p) => (
          <div
            key={p.label}
            className={`flex items-center justify-between text-[12.5px] ${p.sign === "=" ? "border-t border-divider pt-2 font-bold text-ink" : "text-ink"}`}
          >
            <span className="flex items-center gap-2">
              {p.sign && p.sign !== "=" && <span className="text-mute w-3 text-center">{p.sign}</span>}
              {p.label}
            </span>
            <span className="flex items-center gap-4 tabular-nums">
              {p.rate && <span className="text-mute text-[11px]">{p.rate}</span>}
              <span>{order.currency} {p.value}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-divider grid grid-cols-3 gap-x-4 gap-y-2 text-[12.5px]">
        <div><span className="text-mute text-[11px] block">Requested delivery</span><span className="tabular-nums">{order.schedule.reqDate}</span></div>
        <div><span className="text-mute text-[11px] block">Confirmed</span><span className="tabular-nums">{order.schedule.confirmedDate}</span></div>
        <div><span className="text-mute text-[11px] block">Credit status</span>{order.schedule.creditStatus}</div>
      </div>
    </DocShell>
  );
}
