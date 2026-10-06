/**
 * Faithful SAP MIGO-style goods-receipt material document (movement type 101,
 * GR for purchase order). Header (posting/document date · delivery note ·
 * bill of lading), item with PO reference, movement type, quantity in receipt
 * UoM, plant, storage location and the stock-type posting. The PO management
 * agent posts this once the belt is received — it hands GR-77310 to Invoice.
 */

import { DocShell, DocTitleBand, SectionBand, Field } from "./parts";

export type SapGR = {
  number: string;
  status: string;
  createdOn: string;
  createdBy: string;
  movementType: string;
  postingDate: string;
  documentDate: string;
  deliveryNote: string;
  billOfLading: string;
  poReference: string;
  item: {
    line: string;
    material: string;
    shortText: string;
    quantity: string;
    unit: string;
    plant: string;
    storageLocation: string;
    stockType: string;
    okIndicator: string;
  };
};

/** GR-77310 — receipt of the belt against PO-77310. */
export const grBelt: SapGR = {
  number: "GR-77310 · 5000031882",
  status: "Posted",
  createdOn: "2026-06-09 · 07:42",
  createdBy: "PO Management Agent",
  movementType: "101 · GR goods receipt for PO",
  postingDate: "2026-06-09",
  documentDate: "2026-06-09",
  deliveryNote: "BPI-DN-5567",
  billOfLading: "MEMPHIS-4471-2026",
  poReference: "PO-77310 · item 10",
  item: {
    line: "1",
    material: "88-DBX",
    shortText: "Belt, double-backer — Corrugator No.2",
    quantity: "1",
    unit: "EA",
    plant: "M042 · Containerboard mill",
    storageLocation: "MNT1 · Maintenance store",
    stockType: "Unrestricted-use",
    okIndicator: "Item OK · inspected",
  },
};

export function GoodsReceipt({ gr = grBelt }: { gr?: SapGR }) {
  return (
    <DocShell>
      <DocTitleBand
        number={gr.number}
        status={gr.status}
        docType="Goods receipt · material document"
        system="SAP MM · MIGO"
        createdOn={gr.createdOn}
        createdBy={gr.createdBy}
      />

      {/* Header */}
      <SectionBand>Header</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Movement type" value={gr.movementType} mono />
        <Field label="Posting date" value={gr.postingDate} mono />
        <Field label="Document date" value={gr.documentDate} mono />
        <Field label="Delivery note" value={gr.deliveryNote} mono />
        <Field label="Bill of lading" value={gr.billOfLading} mono />
        <Field label="PO reference" value={gr.poReference} mono />
      </div>

      {/* Item overview */}
      <SectionBand>Item overview</SectionBand>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-surface-fog/60 text-left text-mute">
              {["Itm", "Mvt", "Material", "Short text", "Qty", "Un", "Plant", "Sloc"].map((h) => (
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
              <td className="px-3 py-2.5 border-b border-divider tabular-nums">{gr.item.line}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums">101</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums whitespace-nowrap">{gr.item.material}</td>
              <td className="px-3 py-2.5 border-b border-divider">{gr.item.shortText}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums text-right">{gr.item.quantity}</td>
              <td className="px-3 py-2.5 border-b border-divider">{gr.item.unit}</td>
              <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap">{gr.item.plant.split(" · ")[0]}</td>
              <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap">
                {gr.item.storageLocation.split(" · ")[0]}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Where / stock posting */}
      <SectionBand>Where — stock posting</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Plant" value={gr.item.plant} mono />
        <Field label="Storage location" value={gr.item.storageLocation} mono />
        <Field label="Stock type" value={gr.item.stockType} />
        <Field label="OK indicator" value={gr.item.okIndicator} />
      </div>
    </DocShell>
  );
}
