/**
 * SAP SD outbound delivery — the Fulfillment agent ships the sales order and
 * posts goods issue, which relieves inventory and arms billing. This is the
 * evidence the customer invoice is raised against. Faithful-but-light SAP SD
 * chrome (VL03N display). Presentational — takes a `delivery`.
 */

import { DocShell, DocTitleBand, SectionBand, Field } from "../sap/parts";

export type Delivery = {
  number: string;
  status: string;
  createdOn: string;
  createdBy: string;
  soReference: string;
  shipTo: string;
  shippingPoint: string;
  route: string;
  carrier: string;
  billOfLading: string;
  plannedGi: string;
  actualGi: string;
  currency: string;
  item: {
    line: string;
    material: string;
    shortText: string;
    deliveryQty: string;
    unit: string;
    plant: string;
    storageLocation: string;
    batch: string;
  };
};

export const deliveryBlueRidge: Delivery = {
  number: "80004471",
  status: "Goods issue posted · complete",
  createdOn: "2026-03-31 · 16:40",
  createdBy: "Fulfillment Agent",
  soReference: "SO-58841 · item 10",
  shipTo: "BlueRidge Foods Co. · DC Memphis",
  shippingPoint: "M042 · Containerboard mill dock",
  route: "US-SE-02 · Memphis → Memphis DC",
  carrier: "Ironwood Freight Lines",
  billOfLading: "IWF-2026-44718",
  plannedGi: "2026-04-01",
  actualGi: "2026-04-01 · 09:05",
  currency: "USD",
  item: {
    line: "10",
    material: "CB-42ECT",
    shortText: "Containerboard — 42 ECT kraft linerboard",
    deliveryQty: "320",
    unit: "MT",
    plant: "M042 · Containerboard mill",
    storageLocation: "FG01 · Finished goods",
    batch: "B-2026-0331-CB42",
  },
};

export function DeliveryDoc({ delivery = deliveryBlueRidge }: { delivery?: Delivery }) {
  return (
    <DocShell>
      <DocTitleBand
        number={delivery.number}
        status={delivery.status}
        docType="LF · Outbound delivery"
        system="SAP SD · VL03N"
        createdOn={delivery.createdOn}
        createdBy={delivery.createdBy}
      />

      <SectionBand>Delivery header</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Sales order ref." value={delivery.soReference} mono />
        <Field label="Ship-to party" value={delivery.shipTo} />
        <Field label="Shipping point" value={delivery.shippingPoint} />
        <Field label="Route" value={delivery.route} />
        <Field label="Carrier" value={delivery.carrier} />
        <Field label="Bill of lading" value={delivery.billOfLading} mono />
      </div>

      <SectionBand>Delivery item</SectionBand>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-surface-fog/60 text-left text-mute">
              {["Item", "Material", "Description", "Delivery qty", "Storage loc."].map((h, i) => (
                <th key={i} className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-ink">
              <td className="px-3 py-2.5 border-b border-divider text-mute tabular-nums">{delivery.item.line}</td>
              <td className="px-3 py-2.5 border-b border-divider font-semibold text-surface-deep tabular-nums">{delivery.item.material}</td>
              <td className="px-3 py-2.5 border-b border-divider">{delivery.item.shortText}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums font-medium">{delivery.item.deliveryQty} {delivery.item.unit}</td>
              <td className="px-3 py-2.5 border-b border-divider">{delivery.item.storageLocation}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-[11px] text-mute">
        Plant {delivery.item.plant} · batch {delivery.item.batch}
      </div>

      <SectionBand>Goods issue</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-2 text-[12.5px]">
        <div><span className="text-mute text-[11px] block">Planned GI</span><span className="tabular-nums">{delivery.plannedGi}</span></div>
        <div><span className="text-mute text-[11px] block">Actual GI</span><span className="tabular-nums">{delivery.actualGi}</span></div>
        <div><span className="text-mute text-[11px] block">Movement</span><span className="tabular-nums">601 · GI for delivery</span></div>
      </div>

      <div className="px-4 py-3 flex items-center gap-2.5 border-t border-divider">
        <span className="w-3 h-3 rounded-full bg-[#107e3e] ring-2 ring-[#107e3e]/25" />
        <span className="text-[12.5px] text-ink">
          Goods issue posted — {delivery.item.deliveryQty} {delivery.item.unit} shipped and relieved from stock. Delivery is billing-relevant.
        </span>
      </div>
    </DocShell>
  );
}
