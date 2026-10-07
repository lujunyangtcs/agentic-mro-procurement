/**
 * Faithful SAP master- & transaction-document family for the MRO PR-validation
 * flows. Each agent in the run reads or produces one of these as its real ERP
 * artifact (not a simplified card), on the shared SAP Fiori/Belize chrome
 * (`docs/sap/parts`). Field names and code shapes mirror the real transactions:
 *   · MaterialMasterDoc   — MM03 (Basic data / Purchasing / Accounting views)
 *   · StockOverviewDoc    — MB52 (plant-level on-hand, incl. interplant)
 *   · WarrantyRecordDoc   — equipment warranty record / claim determination
 *   · OutlineAgreementDoc — ME33K (value contract · target value · item prices)
 *   · VendorRecordDoc     — vendor master / approved-supplier record
 *   · ApprovalRoutingDoc  — release strategy / DOA approval routing
 * Operating entity is Orvantec; vendors anonymised.
 * Presentational only.
 */

import * as React from "react";
import { DocShell, DocTitleBand, DocTabs, SectionBand, Field } from "@/mro/components/docs/sap/parts";
import { cn } from "@/mro/lib/utils";

export type KV = { label: string; value: React.ReactNode };

/** A labelled SAP display-field grid (3 cols on desktop). */
function Grid({ rows, cols = 3 }: { rows: KV[]; cols?: 2 | 3 }) {
  return (
    <div className={cn("px-4 py-3 grid gap-x-4 gap-y-3", cols === 2 ? "grid-cols-2" : "grid-cols-3")}>
      {rows.map((r) => (
        <Field key={String(r.label)} label={r.label} value={r.value} mono />
      ))}
    </div>
  );
}

/** A compact SAP table (grey header, divider rows). */
function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <table className="w-full text-[12px] border-collapse">
      <thead>
        <tr className="bg-[#eef1f5] text-left text-[#646e77]">
          {head.map((h, i) => (
            <th key={i} className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri} className="text-ink align-top">
            {r.map((c, ci) => (
              <td key={ci} className="px-3 py-2.5 border-b border-divider tabular-nums">{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Status({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="px-4 py-3 flex items-center gap-2.5">
      <span className={cn("w-3 h-3 rounded-full ring-2", ok ? "bg-[#2f6b4f] ring-[#2f6b4f]/25" : "bg-[#a1232b] ring-[#a1232b]/25")} />
      <span className="text-[12.5px] text-ink">{text}</span>
    </div>
  );
}

/* ── MM03 · Material master ────────────────────────────────────────────────── */

export type MaterialMaster = {
  number: string;        // material code
  description: string;
  status: string;
  createdOn: string;
  createdBy: string;
  basic: KV[];           // Basic Data 1/2
  purchasing: KV[];      // Purchasing view
  accounting: KV[];      // Accounting / valuation
};

export function MaterialMasterDoc({ m }: { m: MaterialMaster }) {
  return (
    <DocShell tcode="MM03" tname="Display Material" status={`Material ${m.number} displayed`}>
      <DocTitleBand number={m.number} status={m.status} docType="Material master · MM03 display" system="Material master" createdOn={m.createdOn} createdBy={m.createdBy} />
      <DocTabs tabs={["Basic Data", "Purchasing", "Accounting", "MRP", "Plant stock"]} />
      <div className="px-4 py-3 text-[13px] font-medium text-ink border-b border-divider">{m.description}</div>
      <SectionBand>Basic data</SectionBand>
      <Grid rows={m.basic} />
      <SectionBand>Purchasing</SectionBand>
      <Grid rows={m.purchasing} />
      <SectionBand>Accounting / valuation</SectionBand>
      <Grid rows={m.accounting} />
    </DocShell>
  );
}

/* ── MB52 · Stock overview (incl. interplant) ──────────────────────────────── */

export type StockRow = {
  plant: string;
  storageLoc: string;
  onHand: string;
  safety: string;
  uom: string;
  /** "this plant" rows render plain; surplus at another plant is highlighted. */
  tone?: "plain" | "surplus" | "short";
};

export type StockOverview = {
  number: string;        // material code
  description: string;
  createdOn: string;
  createdBy: string;
  rows: StockRow[];
  note?: string;
};

export function StockOverviewDoc({ s }: { s: StockOverview }) {
  const toneText: Record<string, string> = { surplus: "text-[#2f6b4f] font-semibold", short: "text-[#a1232b] font-semibold", plain: "" };
  return (
    <DocShell tcode="MB52" tname="Warehouse Stocks" status="Stock overview · all plants displayed">
      <DocTitleBand number={s.number} status="Display" docType="Stock overview · MB52 · plant / storage" system="Inventory management" createdOn={s.createdOn} createdBy={s.createdBy} />
      <div className="px-4 py-3 text-[13px] font-medium text-ink border-b border-divider">{s.description}</div>
      <SectionBand>Plant / storage stock</SectionBand>
      <Table
        head={["Plant", "Storage loc.", "Unrestricted", "Safety", "UoM"]}
        rows={s.rows.map((r) => [
          <span className={toneText[r.tone ?? "plain"]}>{r.plant}</span>,
          r.storageLoc,
          <span className={toneText[r.tone ?? "plain"]}>{r.onHand}</span>,
          r.safety,
          r.uom,
        ])}
      />
      {s.note && <div className="px-4 py-3 text-[12px] text-mute">{s.note}</div>}
    </DocShell>
  );
}

/* ── Equipment warranty record / claim ─────────────────────────────────────── */

export type WarrantyRecord = {
  number: string;        // warranty/claim id
  status: string;
  createdOn: string;
  createdBy: string;
  object: KV[];          // equipment / serial / commissioning
  coverage: KV[];        // warranty type / period / scope
  failure: KV[];         // failure date / type / claimability
  determination: { ok: boolean; text: string };
};

export function WarrantyRecordDoc({ w }: { w: WarrantyRecord }) {
  return (
    <DocShell tcode="IQS3" tname="Display Notification" status={`Warranty check ${w.number} displayed`}>
      <DocTitleBand number={w.number} status={w.status} docType="Equipment warranty · coverage check" system="Equipment register · warranty" createdOn={w.createdOn} createdBy={w.createdBy} />
      <SectionBand>Warranty object</SectionBand>
      <Grid rows={w.object} />
      <SectionBand>Coverage</SectionBand>
      <Grid rows={w.coverage} />
      <SectionBand>Failure & determination</SectionBand>
      <Grid rows={w.failure} />
      <SectionBand>Determination</SectionBand>
      <Status ok={w.determination.ok} text={w.determination.text} />
    </DocShell>
  );
}

/* ── ME33K · Outline agreement (value contract) ────────────────────────────── */

export type AgreementItem = {
  item: string;
  material: string;
  description: string;
  targetQty: string;
  netPrice: string;
  per: string;
};

export type OutlineAgreement = {
  number: string;
  status: string;
  createdOn: string;
  createdBy: string;
  header: KV[];          // vendor / org / validity / target value
  items: AgreementItem[];
  conditions?: KV[];     // payment / incoterms / tolerances
};

export function OutlineAgreementDoc({ a }: { a: OutlineAgreement }) {
  return (
    <DocShell tcode="ME33K" tname="Display Contract" status={`Contract ${a.number} displayed`}>
      <DocTitleBand number={a.number} status={a.status} docType="Outline agreement · ME33K · value contract" system="Purchasing · contracts" createdOn={a.createdOn} createdBy={a.createdBy} />
      <SectionBand>Header</SectionBand>
      <Grid rows={a.header} />
      <SectionBand>Item overview</SectionBand>
      <Table
        head={["Itm", "Material", "Short text", "Target qty", "Net price", "Per"]}
        rows={a.items.map((it) => [it.item, it.material, it.description, it.targetQty, it.netPrice, it.per])}
      />
      {a.conditions && (
        <>
          <SectionBand>Terms & conditions</SectionBand>
          <Grid rows={a.conditions} />
        </>
      )}
    </DocShell>
  );
}

/* ── Vendor master / approved supplier ─────────────────────────────────────── */

export type VendorRecord = {
  number: string;        // vendor code
  name: string;
  status: string;
  createdOn: string;
  createdBy: string;
  general: KV[];
  purchasing: KV[];
  approval: { ok: boolean; text: string };
};

export function VendorRecordDoc({ v }: { v: VendorRecord }) {
  return (
    <DocShell tcode="XK03" tname="Display Vendor" status={`Vendor ${v.number} displayed`}>
      <DocTitleBand number={v.number} status={v.status} docType="Vendor master · approved supplier" system="Business partner · vendor" createdOn={v.createdOn} createdBy={v.createdBy} />
      <div className="px-4 py-3 text-[13px] font-medium text-ink border-b border-divider">{v.name}</div>
      <SectionBand>General data</SectionBand>
      <Grid rows={v.general} />
      <SectionBand>Purchasing data</SectionBand>
      <Grid rows={v.purchasing} />
      <SectionBand>Approved-supplier status</SectionBand>
      <Status ok={v.approval.ok} text={v.approval.text} />
    </DocShell>
  );
}

/* ── Release strategy · DOA approval routing ───────────────────────────────── */

export type ApprovalLevel = {
  level: string;
  approver: string;
  role: string;
  limit: string;
  status: "approved" | "pending" | "not-reached";
  when: string;
};

export type ApprovalRouting = {
  number: string;        // workflow task id
  status: string;
  createdOn: string;
  createdBy: string;
  summary: KV[];         // document / requestor / amount
  chain: ApprovalLevel[];
  validation: { ok: boolean; text: string };
  action?: string;       // the open human action
};

const levelChip: Record<ApprovalLevel["status"], { cls: string; mark: string }> = {
  approved: { cls: "bg-[#2f6b4f] text-white", mark: "✓ Approved" },
  pending: { cls: "bg-[#df6e0c] text-white", mark: "● Pending" },
  "not-reached": { cls: "bg-[#dfe4ea] text-[#646e77]", mark: "— Not reached" },
};

export function ApprovalRoutingDoc({ r }: { r: ApprovalRouting }) {
  return (
    <DocShell tcode="ME54N" tname="Release Purchase Requisition" status={`Release strategy ${r.number} displayed`}>
      <DocTitleBand number={r.number} status={r.status} docType="Release strategy · DOA approval routing" system="Workflow · release" createdOn={r.createdOn} createdBy={r.createdBy} />
      <SectionBand>Document summary</SectionBand>
      <Grid rows={r.summary} />
      <SectionBand>Approval chain</SectionBand>
      <div className="px-4 py-3 space-y-2">
        {r.chain.map((lv) => (
          <div key={lv.level} className="flex items-center justify-between gap-3 rounded-[3px] bg-[#f4f6f9] border border-[#e1e6ec] px-3 py-2">
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-ink">{lv.level} · {lv.approver}</div>
              <div className="text-[11px] text-mute">{lv.role} · DOA limit {lv.limit}{lv.when ? ` · ${lv.when}` : ""}</div>
            </div>
            <span className={cn("shrink-0 text-[10px] font-bold uppercase tracking-[0.04em] px-2 py-1 rounded", levelChip[lv.status].cls)}>{levelChip[lv.status].mark}</span>
          </div>
        ))}
      </div>
      <SectionBand>DOA validation</SectionBand>
      <Status ok={r.validation.ok} text={r.validation.text} />
      {r.action && (
        <div className="px-4 py-3 border-t border-divider text-[12.5px] text-ink">
          <span className="text-[10px] uppercase tracking-[0.08em] text-[#646e77] font-bold">Open action</span>
          <div className="mt-1">{r.action}</div>
        </div>
      )}
    </DocShell>
  );
}

/* ── ME23N · Stock transport order (interplant transfer) ───────────────────── */

export type StoItem = {
  item: string;
  material: string;
  description: string;
  qty: string;
  from: string;
  to: string;
};

export type StockTransportOrder = {
  number: string;
  status: string;
  createdOn: string;
  createdBy: string;
  header: KV[];          // supplying / receiving plant · movement type · value
  items: StoItem[];
  note?: string;
};

export function StockTransportOrderDoc({ o }: { o: StockTransportOrder }) {
  return (
    <DocShell tcode="ME23N" tname="Display Stock Transport Order" status={`STO ${o.number} displayed`}>
      <DocTitleBand number={o.number} status={o.status} docType="Stock transport order · UB · interplant transfer" system="Purchasing · stock transfer" createdOn={o.createdOn} createdBy={o.createdBy} />
      <SectionBand>Header</SectionBand>
      <Grid rows={o.header} />
      <SectionBand>Transfer items</SectionBand>
      <Table
        head={["Itm", "Material", "Description", "Qty", "Supplying", "Receiving"]}
        rows={o.items.map((it) => [it.item, it.material, it.description, it.qty, it.from, it.to])}
      />
      {o.note && <div className="px-4 py-3 text-[12px] text-mute">{o.note}</div>}
    </DocShell>
  );
}

/* ── ME23N · Purchase order (the compliant PO the orchestrator issues) ──────── */

export type PoItem = {
  item: string;
  material: string;
  description: string;
  qty: string;
  netPrice: string;
  value: string;
  delivDate: string;
};

export type PurchaseOrder = {
  number: string;
  status: string;
  createdOn: string;
  createdBy: string;
  header: KV[];          // vendor · ship-to · payment terms · incoterms · currency
  items: PoItem[];
  conditions: KV[];      // net · freight · tax · total
  release?: KV[];        // release / approval status
};

export function PurchaseOrderDoc({ p }: { p: PurchaseOrder }) {
  return (
    <DocShell tcode="ME23N" tname="Display Purchase Order" status={`Purchase order ${p.number} displayed`}>
      <DocTitleBand number={p.number} status={p.status} docType="Purchase order · ME23N · standard NB" system="Purchasing · purchase order" createdOn={p.createdOn} createdBy={p.createdBy} />
      <SectionBand>Header</SectionBand>
      <Grid rows={p.header} />
      <SectionBand>Item overview</SectionBand>
      <Table
        head={["Itm", "Material", "Short text", "Qty", "Net price", "Value", "Deliv. date"]}
        rows={p.items.map((it) => [it.item, it.material, it.description, it.qty, it.netPrice, it.value, it.delivDate])}
      />
      <SectionBand>Conditions & totals</SectionBand>
      <Grid rows={p.conditions} />
      {p.release && (
        <>
          <SectionBand>Release strategy</SectionBand>
          <Grid rows={p.release} />
        </>
      )}
    </DocShell>
  );
}

/* ── ME5A · List display of purchase requisitions (duplicate scan) ──────────── */

export type OpenPrRow = {
  pr: string;
  item: string;
  material: string;
  qty: string;
  plant: string;
  created: string;
  /** "dup" = a duplicate of the requisition under review (highlighted red). */
  tone?: "dup";
};

export type OpenPrList = {
  createdOn: string;
  createdBy: string;
  /** Selection scope line under the title. */
  scope: string;
  rows: OpenPrRow[];
  note?: string;
};

export function OpenPrListDoc({ l }: { l: OpenPrList }) {
  return (
    <DocShell tcode="ME5A" tname="List Display of Purchase Requisitions" status="Open requisitions listed">
      <DocTitleBand number="ME5A" status="Display" docType="Purchase requisitions · open · list" system="Purchasing · requisitions" createdOn={l.createdOn} createdBy={l.createdBy} />
      <div className="px-4 py-2 text-[12px] text-mute border-b border-divider">{l.scope}</div>
      <table className="w-full text-[12px] border-collapse">
        <thead>
          <tr className="bg-[#eef1f5] text-left text-[#646e77]">
            {["PR", "Itm", "Material", "Qty", "Plant", "Created"].map((h) => (
              <th key={h} className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {l.rows.map((r, i) => (
            <tr key={i} {...(r.tone === "dup" ? { "data-ai-anchor": true } : {})} className={cn("align-top", r.tone === "dup" && "bg-[#fdecec]")}>
              <td className={cn("px-3 py-2.5 border-b border-divider tabular-nums", r.tone === "dup" ? "text-[#a1232b] font-semibold" : "text-ink")}>{r.pr}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums text-ink">{r.item}</td>
              <td className={cn("px-3 py-2.5 border-b border-divider", r.tone === "dup" ? "text-[#a1232b] font-semibold" : "text-ink")}>{r.material}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums text-ink">{r.qty}</td>
              <td className="px-3 py-2.5 border-b border-divider text-ink">{r.plant}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums text-ink">{r.created}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {l.note && <div className="px-4 py-3 text-[12px] text-mute">{l.note}</div>}
    </DocShell>
  );
}

/* ── Generic SAP record (HSE clearance · cost/delivery feasibility · etc.) ──── */

export type RecordSection = { band: string; rows: KV[] };

export type RecordDocData = {
  tcode: string;
  tname: string;
  number: string;
  status: string;
  docType: string;
  system: string;
  createdOn: string;
  createdBy: string;
  sections: RecordSection[];
  determination?: { ok: boolean; text: string };
};

export function RecordDoc({ d }: { d: RecordDocData }) {
  return (
    <DocShell tcode={d.tcode} tname={d.tname} status={`${d.number} displayed`}>
      <DocTitleBand number={d.number} status={d.status} docType={d.docType} system={d.system} createdOn={d.createdOn} createdBy={d.createdBy} />
      {d.sections.map((s, i) => (
        <React.Fragment key={i}>
          <SectionBand>{s.band}</SectionBand>
          <Grid rows={s.rows} />
        </React.Fragment>
      ))}
      {d.determination && (
        <>
          <SectionBand>Determination</SectionBand>
          <Status ok={d.determination.ok} text={d.determination.text} />
        </>
      )}
    </DocShell>
  );
}
