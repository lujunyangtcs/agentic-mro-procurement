/**
 * Faithful SAP ME53N-style purchase requisition.
 *
 * Field layout transcribed from SAP MM ME51N/ME53N (Header · Item overview ·
 * Item detail with account assignment + source of supply). Rendered in the
 * demo's token system rather than pixel-copying SAP's GUI, but every field
 * name and code shape (4-char plant, 6-digit G/L, 10-digit cost center,
 * outline-agreement number) matches the real transaction so a procurement
 * reviewer reads it as the genuine artifact. Presentational — takes a `pr`.
 */

import { DocShell, DocTitleBand, SectionBand, Field } from "./parts";

export type SapAcctAssignment = {
  category: string;
  glAccount: string;
  glAccountText: string;
  costCenter: string;
  costCenterText: string;
  order: string;
  wbs: string;
  recipient: string;
  unloadingPoint: string;
  percentage: string;
};

export type SapPRItem = {
  line: string;
  material: string;
  shortText: string;
  materialGroup: string;
  quantity: string;
  unit: string;
  deliveryDate: string;
  plant: string;
  storageLocation: string;
  valuationPrice: string;
  currency: string;
  totalValue: string;
  requisitioner: string;
  trackingNumber: string;
};

export type SapPRSource = {
  fixedVendor: string;
  agreement: string;
  agreementItem: string;
  infoRecord: string;
};

export type SapPR = {
  number: string;
  docType: string;
  status: string;
  releaseStrategy: string;
  createdBy: string;
  createdOn: string;
  purchasingOrg: string;
  purchasingGroup: string;
  headerNote: string;
  item: SapPRItem;
  source: SapPRSource;
  acct: SapAcctAssignment;
};

/** The belt scenario, in SAP terms — Intake's output handed to Sourcing. */
export const prBelt: SapPR = {
  number: "PR-48201",
  docType: "NB · Standard purchase requisition",
  status: "Released",
  releaseStrategy: "MRO1 — auto-released · on-contract, under the L3 limit",
  createdBy: "Intake Agent",
  createdOn: "2026-06-03 · 09:04",
  purchasingOrg: "NG01 · Northgate North America",
  purchasingGroup: "P12 · MRO & Spares",
  headerNote:
    "Corrugator No.2 double-backer belt flagged at 09:01 — wear beyond limit, production line at risk. Replacement is on the BeltPro MRO framework; raised under the maintenance-spend policy.",
  item: {
    line: "10",
    material: "88-DBX",
    shortText: "Belt, double-backer — Corrugator No.2",
    materialGroup: "MRO-CONV · Conveyor & belting",
    quantity: "1",
    unit: "EA",
    deliveryDate: "2026-06-10",
    plant: "M042 · Containerboard mill",
    storageLocation: "MNT1 · Maintenance store",
    valuationPrice: "48,200.00",
    currency: "USD",
    totalValue: "48,200.00",
    requisitioner: "R. Alvarez · Reliability planner",
    trackingNumber: "MNT-2206",
  },
  source: {
    fixedVendor: "BeltPro Industrial · 100482",
    agreement: "4600001207 · MRO framework",
    agreementItem: "10",
    infoRecord: "5300008841",
  },
  acct: {
    category: "K · Cost center",
    glAccount: "510000",
    glAccountText: "Repairs & maintenance — MRO",
    costCenter: "0000041702",
    costCenterText: "Corrugating — No.2",
    order: "800042217 · PM maintenance order",
    wbs: "—",
    recipient: "R. Alvarez",
    unloadingPoint: "No.2 corrugator dock",
    percentage: "100 %",
  },
};

export function PurchaseRequisition({ pr = prBelt }: { pr?: SapPR }) {
  return (
    <DocShell>
      <DocTitleBand
        number={pr.number}
        status={pr.status}
        docType={pr.docType}
        system="SAP MM · ME53N"
        createdOn={pr.createdOn}
        createdBy={pr.createdBy}
      />

      {/* Header */}
      <SectionBand>Header</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Purchasing org" value={pr.purchasingOrg} mono />
        <Field label="Purchasing group" value={pr.purchasingGroup} mono />
        <Field label="Release strategy" value={pr.releaseStrategy} />
      </div>
      <div className="px-4 pb-3">
        <div className="text-[10px] tracking-[0.05em] uppercase text-mute font-medium">
          Header note
        </div>
        <p className="text-[12.5px] text-ink leading-snug mt-1">{pr.headerNote}</p>
      </div>

      {/* Item overview */}
      <SectionBand>Item overview</SectionBand>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-surface-fog/60 text-left text-mute">
              {["Itm", "A", "Material", "Short text", "Qty", "Un", "Deliv. date", "Plant"].map((h) => (
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
              <td className="px-3 py-2.5 border-b border-divider tabular-nums">{pr.item.line}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums">
                {pr.acct.category.split(" ")[0]}
              </td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums whitespace-nowrap">
                {pr.item.material}
              </td>
              <td className="px-3 py-2.5 border-b border-divider">{pr.item.shortText}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums text-right">
                {pr.item.quantity}
              </td>
              <td className="px-3 py-2.5 border-b border-divider">{pr.item.unit}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums whitespace-nowrap">
                {pr.item.deliveryDate}
              </td>
              <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap">
                {pr.item.plant}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Item detail */}
      <SectionBand>Item detail — {pr.item.line}</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Material group" value={pr.item.materialGroup} />
        <Field label="Storage location" value={pr.item.storageLocation} mono />
        <Field label="Requisitioner" value={pr.item.requisitioner} />
        <Field label="Valuation price" value={`${pr.item.currency} ${pr.item.valuationPrice} / ${pr.item.unit}`} mono />
        <Field label="Total value" value={`${pr.item.currency} ${pr.item.totalValue}`} mono />
        <Field label="Tracking number" value={pr.item.trackingNumber} mono />
      </div>

      {/* Account assignment */}
      <SectionBand>Account assignment</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Category" value={pr.acct.category} mono />
        <Field label="Distribution" value={pr.acct.percentage} mono />
        <Field label="Recipient" value={pr.acct.recipient} />
        <Field label="G/L account" value={`${pr.acct.glAccount} · ${pr.acct.glAccountText}`} mono />
        <Field label="Cost center" value={`${pr.acct.costCenter} · ${pr.acct.costCenterText}`} mono />
        <Field label="Order" value={pr.acct.order} mono />
        <Field label="WBS element" value={pr.acct.wbs} mono />
        <Field label="Unloading point" value={pr.acct.unloadingPoint} />
      </div>

      {/* Source of supply */}
      <SectionBand>Source of supply</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Fixed vendor" value={pr.source.fixedVendor} mono />
        <Field label="Outline agreement" value={`${pr.source.agreement} · item ${pr.source.agreementItem}`} mono />
        <Field label="Info record" value={pr.source.infoRecord} mono />
      </div>
    </DocShell>
  );
}
