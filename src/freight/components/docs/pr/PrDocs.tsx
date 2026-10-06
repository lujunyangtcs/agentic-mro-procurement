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
 *     steps 2–5 so the two examples (conveyor belt · idler roller) stay in lockstep.
 *
 * Operating entity is the fictional Northgate Paper Co.; vendors anonymised.
 */

import { DocShell, DocTitleBand, SectionBand, Field } from "@/freight/components/docs/sap/parts";
import { cn } from "@/freight/lib/utils";

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
  /** Item & spec fields (face width, material, duty, qty, UoM, delivery). */
  item: PrField[];
  /** Account-assignment / sourcing fields. */
  assignment: PrField[];
  confidence: string;
  /** Open flags the intake agent could not resolve on its own. */
  flags?: string[];
};

export function StructuredPrDoc({ pr }: { pr: StructuredPr }) {
  return (
    <DocShell>
      <DocTitleBand
        number={pr.number}
        status={pr.status}
        docType="Purchase requisition · structured · vendor-ready"
        system="PR intake · material master"
        createdOn={pr.createdOn}
        createdBy={pr.createdBy}
      />
      <SectionBand>Item · {pr.materialCode}</SectionBand>
      <div className="px-4 py-3">
        <div className="text-[13px] font-medium text-ink mb-3">{pr.description}</div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3">
          {pr.item.map((f) => (
            <Field key={f.label} label={f.label} value={f.value} mono />
          ))}
        </div>
      </div>
      <SectionBand>Account assignment</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Plant" value={pr.plant} />
        <Field label="Cost center" value={pr.costCenter} mono />
        <Field label="G/L account" value={pr.glAccount} mono />
        {pr.assignment.map((f) => (
          <Field key={f.label} label={f.label} value={f.value} mono />
        ))}
      </div>
      <SectionBand>Intake confidence</SectionBand>
      <div className="px-4 py-3 space-y-2">
        <div className="text-[12.5px] text-ink">
          Structured from free text · <span className="font-medium">{pr.confidence}</span>
        </div>
        {pr.flags?.map((f) => (
          <div key={f} className="flex items-start gap-2 text-[12px] text-[#bb0000]">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#bb0000] shrink-0" />
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
              <tr className="bg-[#eef1f5] text-left text-[#5b6b7b]">
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
                    <span className={cn("inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold", r.ok ? "bg-[#107e3e]" : "bg-[#bb0000]")}>{r.ok ? "✓" : "✕"}</span>
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
            <span className={cn("w-3 h-3 rounded-full ring-2", report.verdict.ok ? "bg-[#107e3e] ring-[#107e3e]/25" : "bg-[#bb0000] ring-[#bb0000]/25")} />
            <span className="text-[12.5px] text-ink">{report.verdict.text}</span>
          </div>
        </>
      )}
    </DocShell>
  );
}
