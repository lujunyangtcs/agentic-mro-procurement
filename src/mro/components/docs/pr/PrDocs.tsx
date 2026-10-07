/**
 * MRO purchase-requisition document family for the PR Intake & Validation flow.
 *
 * Two data-driven components on the shared ERP chrome:
 *   · StructuredPrDoc — the clean, vendor-ready PR the intake agent produced from
 *     a plant engineer's free-text request (material code, specs, plant, cost
 *     centre, account assignment) with a confidence read and any open flags.
 *   · ValidationDoc   — a generic, section-banded validation report (master data
 *     & duplicates · warranty & coverage · vendor / contract / price · approval &
 *     routing) where each checked row reads pass or flagged. One component drives
 *     steps 2–5 so the two examples (mechanical seal · grinding media) stay in lockstep.
 *
 * Operating entity is Orvantec; vendors anonymised.
 */

import { DocShell, DocTitleBand, DocTabs, SectionBand, Field } from "@/mro/components/docs/sap/parts";
import { cn } from "@/mro/lib/utils";

export type PrField = { label: string; value: string };

export type StructuredPr = {
  number: string;
  status: string;
  createdBy: string;
  createdOn: string;
  materialCode: string;
  description: string;
  plant: string;
  costCenter: string;
  glAccount: string;
  /** Item & spec fields (shaft diameter, material, duty, qty, UoM, delivery). */
  item: PrField[];
  /** Account-assignment / sourcing fields. */
  assignment: PrField[];
  confidence: string;
  /** Open flags the intake agent could not resolve on its own. */
  flags?: string[];
  /* ── Optional faithful-ME51N fields (rendered only when present) ───────── */
  /** PR document type, e.g. "NB · Standard requisition". */
  prType?: string;
  requestor?: string;
  /** Purchasing org, e.g. "1000 · Orvantec Procurement". */
  purchOrg?: string;
  /** Purchasing group, e.g. "200 · MRO / Maintenance". */
  purchGroup?: string;
  /** Valuation block — unit price, total value, currency. */
  valuation?: PrField[];
  /** Source of supply — vendor, outline agreement, info record. */
  sourceOfSupply?: PrField[];
  /** Delivery & terms — incoterms, payment terms, delivery date. */
  deliveryTerms?: PrField[];
};

export function StructuredPrDoc({
  pr,
  highlightLabel,
}: {
  pr: StructuredPr;
  /** The field (by label) an exception hangs on — marked in yellow. */
  highlightLabel?: string;
}) {
  const F = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) =>
    label === highlightLabel ? (
      <span data-ai-anchor className="rounded-[3px] bg-[#ffe9a8] px-1 py-0.5 -mx-1 block">
        <Field label={label} value={value} mono={mono} />
      </span>
    ) : (
      <Field label={label} value={value} mono={mono} />
    );
  const hasHeader = pr.prType || pr.requestor || pr.purchOrg || pr.purchGroup;
  return (
    <DocShell tcode="ME53N" tname="Display Purchase Requisition" status={`Purchase requisition ${pr.number} displayed`}>
      <DocTitleBand
        number={pr.number}
        status={pr.status}
        docType="Purchase requisition · ME51N · structured"
        system="PR intake · material master"
        createdOn={pr.createdOn}
        createdBy={pr.createdBy}
      />
      <DocTabs tabs={["Item overview", "Account assignment", "Source of supply", "Statuses", "Texts"]} />
      {hasHeader && (
        <>
          <SectionBand>Requisition header</SectionBand>
          <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
            {pr.prType && <Field label="PR type" value={pr.prType} />}
            {pr.requestor && <Field label="Requestor" value={pr.requestor} />}
            {pr.purchOrg && <Field label="Purch. org" value={pr.purchOrg} mono />}
            {pr.purchGroup && <Field label="Purch. group" value={pr.purchGroup} mono />}
          </div>
        </>
      )}
      <SectionBand>Item 10 · {pr.materialCode}</SectionBand>
      <div className="px-4 py-3">
        <div className="text-[13px] font-medium text-ink mb-3">{pr.description}</div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          {pr.item.map((f) => (
            <F key={f.label} label={f.label} value={f.value} mono />
          ))}
        </div>
      </div>
      <SectionBand>Account assignment</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Plant" value={pr.plant} />
        <Field label="Cost center" value={pr.costCenter} mono />
        <Field label="G/L account" value={pr.glAccount} mono />
        {pr.assignment.map((f) => (
          <F key={f.label} label={f.label} value={f.value} mono />
        ))}
      </div>
      {pr.valuation && pr.valuation.length > 0 && (
        <>
          <SectionBand>Valuation</SectionBand>
          <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
            {pr.valuation.map((f) => <F key={f.label} label={f.label} value={f.value} mono />)}
          </div>
        </>
      )}
      {pr.sourceOfSupply && pr.sourceOfSupply.length > 0 && (
        <>
          <SectionBand>Source of supply</SectionBand>
          <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
            {pr.sourceOfSupply.map((f) => <F key={f.label} label={f.label} value={f.value} mono />)}
          </div>
        </>
      )}
      {pr.deliveryTerms && pr.deliveryTerms.length > 0 && (
        <>
          <SectionBand>Delivery & terms</SectionBand>
          <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
            {pr.deliveryTerms.map((f) => <Field key={f.label} label={f.label} value={f.value} mono />)}
          </div>
        </>
      )}
      <SectionBand>Intake confidence</SectionBand>
      <div className="px-4 py-3 space-y-2">
        <div className="text-[12.5px] text-ink">
          Structured from free text · <span className="font-medium">{pr.confidence}</span>
        </div>
        {pr.flags?.map((f) => (
          <div key={f} className="flex items-start gap-2 text-[12px] text-[#a1232b]">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#a1232b] shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>
    </DocShell>
  );
}

export type CheckRow = {
  label: string;
  /** What the contract / master / policy expects. */
  expected: string;
  /** What was actually found on the request / system. */
  found: string;
  ok: boolean;
};

export type ValidationSection = { band: string; rows: CheckRow[] };

export type ValidationReport = {
  number: string;
  status: string;
  docType: string;
  system: string;
  createdBy: string;
  createdOn: string;
  sections: ValidationSection[];
  /** Closing verdict line under the table. */
  verdict?: { ok: boolean; text: string };
};

export function ValidationDoc({ report }: { report: ValidationReport }) {
  return (
    <DocShell>
      <DocTitleBand
        number={report.number}
        status={report.status}
        docType={report.docType}
        system={report.system}
        createdOn={report.createdOn}
        createdBy={report.createdBy}
      />
      {report.sections.map((sec) => (
        <div key={sec.band}>
          <SectionBand>{sec.band}</SectionBand>
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="bg-[#eef1f5] text-left text-[#646e77]">
                {["Check", "Expected", "Found", ""].map((h, i) => (
                  <th key={i} className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sec.rows.map((r) => (
                <tr key={r.label} className="text-ink align-top">
                  <td className="px-3 py-2.5 border-b border-divider text-mute whitespace-nowrap">{r.label}</td>
                  <td className="px-3 py-2.5 border-b border-divider">{r.expected}</td>
                  <td className="px-3 py-2.5 border-b border-divider font-medium">{r.found}</td>
                  <td className="px-3 py-2.5 border-b border-divider">
                    <span className={cn("inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold", r.ok ? "bg-[#2f6b4f]" : "bg-[#a1232b]")}>{r.ok ? "✓" : "✕"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {report.verdict && (
        <>
          <SectionBand>Verdict</SectionBand>
          <div className="px-4 py-3 flex items-center gap-2.5">
            <span className={cn("w-3 h-3 rounded-full ring-2", report.verdict.ok ? "bg-[#2f6b4f] ring-[#2f6b4f]/25" : "bg-[#a1232b] ring-[#a1232b]/25")} />
            <span className="text-[12.5px] text-ink">{report.verdict.text}</span>
          </div>
        </>
      )}
    </DocShell>
  );
}
