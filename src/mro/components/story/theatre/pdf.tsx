/**
 * Source-of-truth documents, shown the way a reviewer would open them: a
 * browser PDF viewer (dark toolbar, grey canvas) around an A4 page. The page
 * primitives below give every document the same print idiom — letterhead,
 * reference block, ruled tables, signature lines and a classification footer.
 * The viewer chrome uses the viewer's own greys rather than theme tokens so
 * it reads as the real thing.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { Download, Printer, X, Menu, Minus, Plus, FileText, Mail } from "lucide-react";
import { cn } from "@/mro/lib/utils";

export type SourceDoc = {
  id: string;
  /** What the document is, e.g. "Purchase order". */
  title: string;
  /** System of record it was pulled from. */
  system: string;
  kind: "pdf" | "mail";
  file: string;
  pages?: number;
  render: () => React.ReactNode;
};

export function DocIcon({ kind, className }: { kind: SourceDoc["kind"]; className?: string }) {
  return kind === "mail" ? <Mail size={14} className={className} aria-hidden /> : <FileText size={14} className={className} aria-hidden />;
}

export function PdfViewer({ doc, onClose }: { doc: SourceDoc | null; onClose: () => void }) {
  const [zoom, setZoom] = React.useState(100);
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!doc) return;
    setZoom(100);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, onClose]);

  if (!doc) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/60 p-3 sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${doc.title} ${doc.id}`}
        onClick={(e) => e.stopPropagation()}
        className="ai-spring flex h-full max-h-[94vh] w-full max-w-[900px] flex-col overflow-hidden rounded-md shadow-2xl"
      >
        <header className="flex shrink-0 items-center gap-3 bg-[#323639] px-3 py-2 text-[#f1f1f1]">
          <Menu size={17} className="shrink-0 opacity-80" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[13px]">{doc.file}</span>
          {doc.kind === "pdf" && (
            <div className="hidden items-center gap-3 text-[12.5px] sm:flex">
              <span className="tabular-nums">
                <span className="bg-[#191b1c] px-1.5 py-0.5">1</span> / {doc.pages ?? 1}
              </span>
              <span className="h-4 w-px bg-white/25" aria-hidden />
              <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(70, z - 10))} className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/10">
                <Minus size={14} aria-hidden />
              </button>
              <span className="w-10 bg-[#191b1c] px-1 py-0.5 text-center tabular-nums">{zoom}%</span>
              <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(130, z + 10))} className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/10">
                <Plus size={14} aria-hidden />
              </button>
            </div>
          )}
          <div className="flex shrink-0 items-center gap-1">
            <span className="grid h-8 w-8 place-items-center rounded-full opacity-80" aria-hidden>
              <Download size={16} />
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-full opacity-80" aria-hidden>
              <Printer size={16} />
            </span>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Close document" className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10">
              <X size={17} aria-hidden />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto bg-[#525659] px-3 py-6 sm:px-8">
          <div className="mx-auto origin-top transition-transform duration-200" style={{ width: 720, maxWidth: "100%", transform: `scale(${zoom / 100})` }}>
            {doc.kind === "pdf" ? (
              <article className="min-h-[1000px] bg-white px-10 py-11 font-sans text-[12px] leading-[17px] text-[#1c1c1c] shadow-[0_2px_10px_rgba(0,0,0,0.45)] sm:px-14">
                {doc.render()}
              </article>
            ) : (
              doc.render()
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── Page primitives ────────────────────────────────────────────────────── */

export function Letterhead({ org, unit, title, number, rows }: { org: string; unit: string; title: string; number: string; rows: [string, string][] }) {
  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-6 border-b-2 border-[#1c1c1c] pb-3">
        <div>
          <p className="text-[17px] font-bold uppercase tracking-[0.18em]">{org}</p>
          <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.12em] text-[#5a5a5a]">{unit}</p>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-bold uppercase tracking-[0.04em]">{title}</p>
          <p className="mt-0.5 text-[12.5px] font-bold tabular-nums">{number}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="w-[118px] shrink-0 text-[#5a5a5a]">{k}</dt>
            <dd className="min-w-0 font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}

export function PdfSection({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("mt-6 flex flex-col gap-2", className)}>
      <h3 className="border-b border-[#bdbdbd] pb-1 text-[10.5px] font-bold uppercase tracking-[0.12em]">{title}</h3>
      {children}
    </section>
  );
}

export function PdfTable({ head, rows, right = [], mark, foot }: { head: string[]; rows: React.ReactNode[][]; right?: number[]; mark?: number[]; foot?: React.ReactNode[][] }) {
  return (
    <table className="w-full border-collapse text-[11.5px]">
      <thead>
        <tr className="bg-[#efefef]">
          {head.map((h, i) => (
            <th key={h} className={cn("border border-[#c9c9c9] px-2 py-1.5 font-bold", right.includes(i) ? "text-right" : "text-left")}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, ri) => (
          <tr key={ri} className={cn(mark?.includes(ri) && "bg-[#fff3b0]")}>
            {r.map((c, ci) => (
              <td key={ci} className={cn("border border-[#c9c9c9] px-2 py-1.5 align-top", right.includes(ci) && "text-right tabular-nums")}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {foot && (
        <tfoot>
          {foot.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} className={cn("px-2 py-1", right.includes(ci) ? "text-right tabular-nums" : "text-left", ri === foot.length - 1 && "font-bold")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tfoot>
      )}
    </table>
  );
}

/** Yellow highlighter over the passage the agent relied on. */
export function Mark({ children }: { children: React.ReactNode }) {
  return <mark className="bg-[#fff3b0] px-0.5 text-inherit">{children}</mark>;
}

export function Clause({ n, title, children, mark }: { n: string; title?: string; children: React.ReactNode; mark?: boolean }) {
  return (
    <div className={cn("flex gap-3 py-1", mark && "-mx-2 border-l-[3px] border-[#e0b400] bg-[#fff8d2] px-2")}>
      <span className="w-8 shrink-0 font-bold tabular-nums">{n}</span>
      <p className="min-w-0 text-pretty">
        {title && <span className="font-bold">{title}. </span>}
        {children}
      </p>
    </div>
  );
}

export function Signatures({ parties }: { parties: { role: string; name: string; date: string }[] }) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-10">
      {parties.map((p) => (
        <div key={p.role} className="flex flex-col gap-1">
          <p className="text-[10.5px] uppercase tracking-[0.1em] text-[#5a5a5a]">{p.role}</p>
          <p className="mt-6 border-b border-[#1c1c1c] pb-0.5 font-serif text-[15px] italic">{p.name}</p>
          <p className="text-[11px] text-[#5a5a5a]">{p.date}</p>
        </div>
      ))}
    </div>
  );
}

export function Stamp({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block -rotate-6 border-2 border-[#2f6b4f] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#2f6b4f]">
      {children}
    </span>
  );
}

export function PdfFooter({ left, right }: { left: string; right?: string }) {
  return (
    <footer className="mt-12 flex items-center justify-between gap-4 border-t border-[#bdbdbd] pt-2 text-[10px] text-[#6a6a6a]">
      <span>{left}</span>
      <span className="shrink-0">{right ?? "Page 1 of 1"}</span>
    </footer>
  );
}
