/**
 * Excel-style master-data lookup sheets — the reference workbooks an intake
 * agent scans to CODE a free-text request (material master, cost centres, G/L).
 * Each sheet renders with spreadsheet chrome (column letters A·B·C, row-number
 * gutter, gridlines, a sheet tab) and the ONE row the agent actually pulled is
 * highlighted Excel-green with a "used" marker — so the field it auto-filled on
 * the left visibly traces to a row on the right. Presentational only.
 */

import * as React from "react";
import { cn } from "@/mro/lib/utils";

const COL_LETTERS = "ABCDEFGH";

export type SheetRow = { cells: React.ReactNode[]; matched?: boolean; flag?: boolean };

export type RefSheet = {
  /** Workbook filename, e.g. "material-master.xlsx". */
  file: string;
  /** Active sheet-tab name. */
  tab: string;
  /** Header row (row 1) labels. */
  columns: string[];
  rows: SheetRow[];
  /** What the agent took from the green row (shown in the file strip). */
  usedNote?: string;
};

export function LookupSheetDoc({ sheets, footer }: { sheets: RefSheet[]; footer?: React.ReactNode }) {
  return (
    <div className="text-[12px]">
      {sheets.map((sh, i) => (
        <ExcelSheet key={i} sheet={sh} last={i === sheets.length - 1} />
      ))}
      {footer && (
        <div className="mt-1 px-1 text-[11px] leading-snug text-mute">{footer}</div>
      )}
    </div>
  );
}

function ExcelSheet({ sheet, last }: { sheet: RefSheet; last: boolean }) {
  // +1 trailing column for the "used" marker.
  const letters = sheet.columns.length + 1;
  return (
    <div className={cn("rounded-[4px] border border-[#cfd6cf] overflow-hidden", !last && "mb-3")}>
      {/* Filename strip (Excel green) */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#e7f0e9] border-b border-[#cfd6cf]">
        <span className="grid place-items-center w-4 h-4 rounded-[2px] bg-[#2f6b4f] text-white text-[8px] font-bold leading-none">X</span>
        <span className="text-[11px] font-semibold text-[#1f4d3a] truncate">{sheet.file}</span>
        {sheet.usedNote && (
          <span className="ml-auto text-[10px] text-[#1f4d3a]/80 truncate">{sheet.usedNote}</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse w-full">
          <tbody>
            {/* Column-letter strip */}
            <tr>
              <td className="w-6 bg-[#f3f5f3] border border-[#e0e4e0]" />
              {Array.from({ length: letters }).map((_, c) => (
                <td key={c} className="px-2 py-[2px] text-center text-[9px] text-[#8a938a] bg-[#f3f5f3] border border-[#e0e4e0]">
                  {COL_LETTERS[c]}
                </td>
              ))}
            </tr>
            {/* Header row = spreadsheet row 1 */}
            <tr>
              <td className="w-6 text-center text-[9px] text-[#8a938a] bg-[#f3f5f3] border border-[#e0e4e0]">1</td>
              {sheet.columns.map((c, i) => (
                <td key={i} className="px-2 py-1 text-[11px] font-semibold text-ink bg-[#eef1ee] border border-[#e0e4e0] whitespace-nowrap">
                  {c}
                </td>
              ))}
              <td className="bg-[#eef1ee] border border-[#e0e4e0]" />
            </tr>
            {/* Data rows */}
            {sheet.rows.map((r, ri) => (
              <tr key={ri} {...(r.flag ? { "data-ai-anchor": true } : {})} className={r.matched ? "bg-[#e2f3e8]" : r.flag ? "bg-[#fff3c4]" : "bg-white"}>
                <td className={cn(
                  "w-6 text-center text-[9px] border border-[#e0e4e0]",
                  r.matched ? "bg-[#bfe4cd] text-[#1f4d3a] font-bold" : "bg-[#f3f5f3] text-[#8a938a]",
                )}>
                  {ri + 2}
                </td>
                {r.cells.map((cell, ci) => (
                  <td key={ci} className={cn(
                    "px-2 py-1 border border-[#e0e4e0] tabular-nums whitespace-nowrap",
                    r.matched ? "text-[#1f4d3a] font-semibold" : "text-ink",
                  )}>
                    {cell}
                  </td>
                ))}
                <td className="px-1.5 py-1 border border-[#e0e4e0] text-center">
                  {r.matched && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white bg-[#2f6b4f] px-1.5 py-[1px] whitespace-nowrap">
                      ✓ used
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sheet tab */}
      <div className="flex items-stretch px-2 pt-1 bg-[#f3f5f3] border-t border-[#e0e4e0]">
        <span className="text-[10px] font-semibold text-[#1f4d3a] border-t-2 border-[#2f6b4f] bg-white px-2.5 py-1 rounded-t-[2px]">
          {sheet.tab}
        </span>
        <span className="text-[10px] text-[#8a938a] px-2.5 py-1">＋</span>
      </div>
    </div>
  );
}
