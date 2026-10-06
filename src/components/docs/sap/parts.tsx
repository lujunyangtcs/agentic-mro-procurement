/**
 * Shared building blocks for the faithful SAP documents that each agent reveals.
 * Field-name and code-shape fidelity lives in the individual docs; this file
 * gives them one consistent SAP chrome — a steel-blue shell title bar, grey
 * section bands, SAP display-field label/value pairs and a compact table — so
 * the whole pipeline reads as one genuine ERP document family. The palette is
 * SAP's own (Fiori/Belize): steel-blue shell #354a5f, SAP blue #0a6ed1 accents,
 * semantic ObjectStatus colours. Presentational only.
 */

import * as React from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportElementAsHtml, fileStem } from "@/lib/exportDoc";

/** SAP display field — label above a read-only boxed value, as in a GUI form. */
export function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] tracking-[0.04em] uppercase text-[#5b6b7b] font-medium mb-1">{label}</div>
      <div
        className={cn(
          "text-[12.5px] text-ink leading-snug rounded-[3px] bg-[#f4f6f9] border border-[#e1e6ec] px-2 py-1",
          mono && "tabular-nums",
        )}
      >
        {value}
      </div>
    </div>
  );
}

/** Grey SAP group header with a steel-blue accent — opens each field block. */
export function SectionBand({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#eef1f5] border-y border-[#dfe4ea] px-4 py-1.5 flex items-center gap-2">
      <span className="w-1 h-3 rounded-sm bg-[#354a5f]" />
      <span className="text-[10.5px] tracking-[0.1em] uppercase text-[#354a5f] font-bold">{children}</span>
    </div>
  );
}

/** The steel-blue SAP shell title bar shared by every artifact. */
export function DocTitleBand({
  number,
  status,
  docType,
  system,
  createdOn,
  createdBy,
}: {
  number: string;
  status: string;
  docType: string;
  system: string;
  createdOn: string;
  createdBy: string;
}) {
  const onExport = (e: React.MouseEvent<HTMLButtonElement>) => {
    const shell = (e.currentTarget as HTMLElement).closest("[data-doc-shell]") as HTMLElement | null;
    if (shell) exportElementAsHtml(shell, `${fileStem(number)}.html`);
  };
  return (
    <div className="bg-[#354a5f] text-white px-4 py-3 flex items-start justify-between gap-4">
      <div className="leading-tight">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold tabular-nums">{number}</span>
          <span className="text-[10px] tracking-[0.08em] uppercase bg-white/15 px-2 py-0.5 rounded">
            {status}
          </span>
        </div>
        <div className="text-[11px] opacity-80 mt-1">{docType}</div>
      </div>
      <div className="flex items-start gap-3 shrink-0">
        <div className="text-right text-[11px] opacity-85 leading-snug">
          <div>{system}</div>
          <div className="mt-0.5">Created {createdOn}</div>
          <div className="mt-0.5">by {createdBy}</div>
        </div>
        <button
          type="button"
          data-export-control
          onClick={onExport}
          title="Export this document"
          className="ui-pill inline-flex items-center gap-1.5 rounded bg-white/15 hover:bg-white/25 text-white text-[11px] font-medium px-2.5 py-1.5 shrink-0"
        >
          <Download size={13} strokeWidth={2} /> Export
        </button>
      </div>
    </div>
  );
}

/** Wrapper that gives a document the white card + rounded border shell. */
export function DocShell({ children }: { children: React.ReactNode }) {
  return (
    <div data-doc-shell className="bg-white border border-divider rounded-md overflow-hidden">
      {children}
    </div>
  );
}
