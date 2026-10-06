/**
 * Faithful SAP ME23N-style purchase order.
 *
 * Layout transcribed from the single-screen PO transaction (ME21N/ME22N/ME23N):
 * Header (vendor · purch. org/group · payment terms · Incoterms · currency),
 * Item overview table, Item detail (material group · plant · storage), a
 * Conditions block (gross price · discount · freight · net value) and the
 * Delivery schedule. Bound to the BeltPro framework — the PO agent's output,
 * posted and tracked through delivery. Presentational — takes a `po`.
 */

import { DocShell, DocTitleBand, SectionBand, Field } from "./parts";

export type SapPOCondition = { label: string; rate: string; value: string; sign?: "+" | "-" | "=" };

export type SapPO = {
  number: string;
  docType: string;
  status: string;
  createdOn: string;
  createdBy: string;
  vendor: string;
  vendorName: string;
  purchasingOrg: string;
  purchasingGroup: string;
  companyCode: string;
  paymentTerms: string;
  incoterms: string;
  currency: string;
  agreement: string;
  item: {
    line: string;
    material: string;
    shortText: string;
    materialGroup: string;
    quantity: string;
    unit: string;
    netPrice: string;
    per: string;
    plant: string;
    storageLocation: string;
    deliveryDate: string;
    glAccount: string;
    costCenter: string;
    taxCode: string;
  };
  conditions: SapPOCondition[];
  netValue: string;
  schedule: { type: string; date: string; quantity: string; note: string };
};

/** PO-77310 — the belt order the PO agent posts to SAP. */
export const poBelt: SapPO = {
  number: "PO-77310",
  docType: "NB · Standard PO",
  status: "Released",
  createdOn: "2026-06-03 · 11:18",
  createdBy: "Purchase Order Agent",
  vendor: "100482",
  vendorName: "BeltPro Industrial",
  purchasingOrg: "NG01 · Northgate North America",
  purchasingGroup: "P12 · MRO & Spares",
  companyCode: "1000 · Northgate Paper Co.",
  paymentTerms: "NT30 · Net 30 days",
  incoterms: "FCA · BeltPro Memphis DC",
  currency: "USD",
  agreement: "4600001207 · item 10 · MRO framework",
  item: {
    line: "10",
    material: "88-DBX",
    shortText: "Belt, double-backer — Corrugator No.2",
    materialGroup: "MRO-CONV · Conveyor & belting",
    quantity: "1",
    unit: "EA",
    netPrice: "48,200.00",
    per: "1 EA",
    plant: "M042 · Containerboard mill",
    storageLocation: "MNT1 · Maintenance store",
    deliveryDate: "2026-06-10",
    glAccount: "510000 · Repairs & maintenance",
    costCenter: "0000041702 · Corrugating No.2",
    taxCode: "U1 · Self-assessed use tax",
  },
  conditions: [
    { label: "PB00 · Gross price (list)", rate: "52,391.30 / 1 EA", value: "52,391.30", sign: "+" },
    { label: "RA01 · Framework discount", rate: "−8.000 %", value: "4,191.30", sign: "-" },
    { label: "FRB1 · Freight (delivered)", rate: "0.00", value: "0.00", sign: "+" },
    { label: "Net value (PO item)", rate: "", value: "48,200.00", sign: "=" },
  ],
  netValue: "48,200.00",
  schedule: {
    type: "Confirmed delivery",
    date: "2026-06-10",
    quantity: "1 EA",
    note: "Within the 5-day framework lead time · ahead of the maintenance window.",
  },
};

export function PurchaseOrder({ po = poBelt }: { po?: SapPO }) {
  return (
    <DocShell>
      <DocTitleBand
        number={po.number}
        status={po.status}
        docType={po.docType}
        system="SAP MM · ME23N"
        createdOn={po.createdOn}
        createdBy={po.createdBy}
      />

      {/* Header */}
      <SectionBand>Header</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Vendor" value={`${po.vendor} · ${po.vendorName}`} mono />
        <Field label="Company code" value={po.companyCode} mono />
        <Field label="Currency" value={po.currency} mono />
        <Field label="Purchasing org" value={po.purchasingOrg} mono />
        <Field label="Purchasing group" value={po.purchasingGroup} mono />
        <Field label="Reference agreement" value={po.agreement} mono />
        <Field label="Payment terms" value={po.paymentTerms} mono />
        <Field label="Incoterms" value={po.incoterms} mono />
        <Field label="Tax code" value={po.item.taxCode} mono />
      </div>

      {/* Item overview */}
      <SectionBand>Item overview</SectionBand>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[660px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-surface-fog/60 text-left text-mute">
              {["Itm", "Material", "Short text", "PO qty", "Un", "Net price", "Per", "Plant"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-ink">
              <td className="px-3 py-2.5 border-b border-divider tabular-nums">{po.item.line}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums whitespace-nowrap">{po.item.material}</td>
              <td className="px-3 py-2.5 border-b border-divider">{po.item.shortText}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums text-right">{po.item.quantity}</td>
              <td className="px-3 py-2.5 border-b border-divider">{po.item.unit}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums text-right whitespace-nowrap">
                {po.currency} {po.item.netPrice}
              </td>
              <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap">{po.item.per}</td>
              <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap">{po.item.plant.split(" · ")[0]}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Item detail */}
      <SectionBand>Item detail — {po.item.line}</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Material group" value={po.item.materialGroup} />
        <Field label="Plant" value={po.item.plant} mono />
        <Field label="Storage location" value={po.item.storageLocation} mono />
        <Field label="G/L account" value={po.item.glAccount} mono />
        <Field label="Cost center" value={po.item.costCenter} mono />
        <Field label="Delivery date" value={po.item.deliveryDate} mono />
      </div>

      {/* Conditions */}
      <SectionBand>Conditions — pricing</SectionBand>
      <div className="px-4 py-3">
        <table className="w-full text-[12px] border-collapse">
          <tbody>
            {po.conditions.map((c) => {
              const isNet = c.sign === "=";
              return (
                <tr key={c.label} className={isNet ? "font-bold text-ink" : "text-ink"}>
                  <td className={"py-1.5 " + (isNet ? "border-t border-divider" : "")}>
                    <span className="inline-flex items-center gap-1.5">
                      {c.sign && !isNet && (
                        <span className="text-mute tabular-nums w-3 text-center">{c.sign}</span>
                      )}
                      {c.label}
                    </span>
                  </td>
                  <td className={"py-1.5 text-right text-mute tabular-nums " + (isNet ? "border-t border-divider" : "")}>
                    {c.rate}
                  </td>
                  <td
                    className={
                      "py-1.5 text-right tabular-nums whitespace-nowrap " + (isNet ? "border-t border-divider" : "")
                    }
                  >
                    {po.currency} {c.value}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delivery schedule */}
      <SectionBand>Delivery schedule</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Category" value={po.schedule.type} />
        <Field label="Delivery date" value={po.schedule.date} mono />
        <Field label="Scheduled qty" value={po.schedule.quantity} mono />
      </div>
      <div className="px-4 pb-4 -mt-1">
        <p className="text-[12px] text-mute leading-snug">{po.schedule.note}</p>
      </div>
    </DocShell>
  );
}
