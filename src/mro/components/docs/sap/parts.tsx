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
import { Download, Check, Save, ArrowLeft, LogOut, X, Printer, Search } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { exportElementAsHtml, fileStem } from "@/mro/lib/exportDoc";

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
      <span className="text-[10.5px] tracking-[0.1em] uppercase text-ink font-bold">{children}</span>
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

/** The grey SAP system toolbar — command field (tcode) + GUI function icons. */
function SapToolbar({ tcode, tname }: { tcode: string; tname?: string }) {
  const Glyph = ({ icon: Icon }: { icon: typeof Check }) => (
    <span className="grid place-items-center w-[18px] h-[18px] rounded-[2px] text-[#1c3a5e] hover:bg-white/70">
      <Icon size={12} strokeWidth={2} />
    </span>
  );
  return (
    <div className="flex items-center gap-1.5 bg-[#dfe4ea] border-b border-[#c4ccd6] px-2 py-1">
      <span className="inline-flex items-center gap-1 rounded-[2px] bg-white border border-[#aab4c0] pl-1.5 pr-2 py-0.5 text-[11px] text-[#1c3a5e] font-medium tabular-nums">
        <Check size={11} strokeWidth={2.5} className="text-[#107e3e]" />
        {tcode}
      </span>
      <span className="flex items-center gap-0.5">
        <Glyph icon={Save} />
        <Glyph icon={ArrowLeft} />
        <Glyph icon={LogOut} />
        <Glyph icon={X} />
        <span className="w-px h-3.5 bg-[#c4ccd6] mx-0.5" />
        <Glyph icon={Printer} />
        <Glyph icon={Search} />
      </span>
      {tname && <span className="ml-auto text-[11px] font-semibold text-ink truncate">{tname}</span>}
    </div>
  );
}

/** SAP view-selection tab strip (Basic Data · Purchasing · Accounting …). */
export function DocTabs({ tabs }: { tabs: string[] }) {
  return (
    <div className="flex items-end gap-0 bg-[#f4f6f9] border-b border-[#dfe4ea] px-2 pt-1.5">
      {tabs.map((t, i) => (
        <span
          key={t}
          className={cn(
            "text-[11px] px-3 py-1.5 border border-b-0 rounded-t-[3px] -mb-px whitespace-nowrap",
            i === 0
              ? "bg-white border-[#dfe4ea] text-[#1c3a5e] font-semibold"
              : "bg-[#eaeef3] border-transparent text-[#5b6b7b]",
          )}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

/** The green SAP status bar pinned to the foot of a transaction screen. */
function SapStatus({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#eef1f5] border-t border-[#dfe4ea] px-3 py-1.5">
      <span className="grid place-items-center w-3.5 h-3.5 rounded-full bg-[#107e3e] text-white text-[8px] font-bold">i</span>
      <span className="text-[11px] text-[#107e3e] truncate">{status}</span>
    </div>
  );
}

/**
 * Wrapper that gives a document the white card + rounded border shell. When a
 * `tcode` is supplied the doc reads as a real SAP transaction screen — grey
 * command toolbar on top, green status bar at the foot. (Agent-generated
 * outputs omit `tcode`, so they stay visually distinct from system screens.)
 */
export function DocShell({
  children,
  tcode,
  tname,
  status,
}: {
  children: React.ReactNode;
  tcode?: string;
  tname?: string;
  status?: string;
}) {
  return (
    <div data-doc-shell className="bg-white border border-divider rounded-md overflow-hidden">
      {tcode && <SapToolbar tcode={tcode} tname={tname} />}
      {children}
      {status && <SapStatus status={status} />}
    </div>
  );
}
