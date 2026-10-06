/**
 * Faithful SAP XK03 / Business-Partner-style vendor master, shown as a
 * duplicate-merge proposal. Two vendor records side by side across the master
 * dimensions XK03 maintains (general data · company-code data with recon
 * account/terms · purchasing data · bank details · tax numbers), with a match
 * score per dimension and a golden-record decision. The Vendor agent's output —
 * it merges the duplicate before the tender opens (the post-merger duplicate problem).
 */

import { DocShell, DocTitleBand, SectionBand } from "./parts";
import { cn } from "@/lib/utils";

export type VendorMatchRow = {
  field: string;
  golden: string;
  duplicate: string;
  match: "exact" | "fuzzy" | "differ";
};

export type VendorMerge = {
  caseNumber: string;
  status: string;
  createdOn: string;
  createdBy: string;
  goldenCode: string;
  goldenName: string;
  duplicateCode: string;
  duplicateName: string;
  confidence: string;
  valueAtRisk: string;
  openItems: string;
  rows: VendorMatchRow[];
  decision: string;
};

export const vendorMergeBelt: VendorMerge = {
  caseNumber: "DM-100482-100731",
  status: "Merge proposed",
  createdOn: "2026-06-03 · 09:58",
  createdBy: "Vendor Master Agent",
  goldenCode: "100482",
  goldenName: "BeltPro Industrial",
  duplicateCode: "100731",
  duplicateName: "Belt-Pro Industrial Inc.",
  confidence: "0.991",
  valueAtRisk: "Low · no open items on the duplicate",
  openItems: "0 open POs · 0 open invoices on 100731",
  rows: [
    { field: "Name", golden: "BeltPro Industrial", duplicate: "Belt-Pro Industrial Inc.", match: "fuzzy" },
    { field: "Tax number (US EIN)", golden: "47-1839220", duplicate: "47-1839220", match: "exact" },
    { field: "DUNS", golden: "07-114-8829", duplicate: "07-114-8829", match: "exact" },
    {
      field: "Street",
      golden: "4120 Air Trans Rd",
      duplicate: "4120 Air Trans Road, Ste 200",
      match: "fuzzy",
    },
    { field: "City / Region / Postal", golden: "Memphis · TN · 38118", duplicate: "Memphis · TN · 38118", match: "exact" },
    { field: "Bank key / account", golden: "084000026 · ••••4471", duplicate: "084000026 · ••••4471", match: "exact" },
    { field: "Recon. account", golden: "211000 · Trade payables", duplicate: "211000 · Trade payables", match: "exact" },
    { field: "Payment terms", golden: "Net 30", duplicate: "Net 30", match: "exact" },
    { field: "Purchasing org", golden: "NG01", duplicate: "NG01", match: "exact" },
  ],
  decision:
    "Keep 100482 as the golden record (active framework 4600001207, full purchasing-org data). Retire 100731, redirect its info records and re-point any source-list entries. Matching EIN, DUNS, bank key and address confirm one legal entity.",
};

const MATCH_META: Record<VendorMatchRow["match"], { label: string; cls: string }> = {
  exact: { label: "Exact", cls: "bg-surface-deep text-ink-inverse" },
  fuzzy: { label: "Fuzzy", cls: "bg-[#fef0e6] text-[#a25b00]" },
  differ: { label: "Differs", cls: "bg-surface-rose/50 text-mark-red" },
};

export function VendorMaster({ merge = vendorMergeBelt }: { merge?: VendorMerge }) {
  return (
    <DocShell>
      <DocTitleBand
        number={merge.caseNumber}
        status={merge.status}
        docType="Vendor master · duplicate-merge proposal"
        system="SAP MDG · XK03 / BP"
        createdOn={merge.createdOn}
        createdBy={merge.createdBy}
      />

      {/* Candidate pair */}
      <SectionBand>Duplicate pair</SectionBand>
      <div className="px-4 py-3 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-[#cfe0f5] bg-[#eaf2fb] px-3 py-2.5">
          <div className="text-[10px] tracking-[0.06em] uppercase text-[#0a6ed1] font-bold">Golden record · keep</div>
          <div className="text-[13px] font-bold text-ink mt-0.5">{merge.goldenName}</div>
          <div className="text-[11px] text-mute tabular-nums">Vendor {merge.goldenCode}</div>
        </div>
        <div className="rounded-md border border-divider bg-surface-fog/60 px-3 py-2.5">
          <div className="text-[10px] tracking-[0.06em] uppercase text-mute font-bold">Duplicate · retire</div>
          <div className="text-[13px] font-bold text-ink mt-0.5">{merge.duplicateName}</div>
          <div className="text-[11px] text-mute tabular-nums">Vendor {merge.duplicateCode}</div>
        </div>
      </div>

      {/* Field-by-field match */}
      <SectionBand>Master-data comparison</SectionBand>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-surface-fog/60 text-left text-mute">
              {["Field", `${merge.goldenCode} · golden`, `${merge.duplicateCode} · duplicate`, "Match"].map((h) => (
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
            {merge.rows.map((r) => {
              const m = MATCH_META[r.match];
              return (
                <tr key={r.field} className="text-ink">
                  <td className="px-3 py-2.5 border-b border-divider text-mute whitespace-nowrap">{r.field}</td>
                  <td className="px-3 py-2.5 border-b border-divider">{r.golden}</td>
                  <td className="px-3 py-2.5 border-b border-divider">{r.duplicate}</td>
                  <td className="px-3 py-2.5 border-b border-divider">
                    <span
                      className={cn(
                        "text-[10px] tracking-[0.04em] uppercase font-bold px-1.5 py-0.5 rounded",
                        m.cls,
                      )}
                    >
                      {m.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Decision */}
      <SectionBand>Merge decision</SectionBand>
      <div className="px-4 py-3 space-y-2">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12px]">
          <span className="text-mute">
            Confidence <span className="font-bold text-surface-deep tabular-nums">{merge.confidence}</span>
          </span>
          <span className="text-mute">
            Value at risk <span className="text-ink">{merge.valueAtRisk}</span>
          </span>
          <span className="text-mute">
            <span className="text-ink tabular-nums">{merge.openItems}</span>
          </span>
        </div>
        <p className="text-[12.5px] text-ink leading-snug">{merge.decision}</p>
      </div>
    </DocShell>
  );
}
