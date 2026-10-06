/**
 * Compact, faithful source documents — the *inputs* each agent reads before it
 * produces its SAP output. Where the SAP artifacts (PR, RFQ, PO, GR, invoice
 * match, vendor merge) are the agents' outputs, these are the upstream evidence:
 * the maintenance email, the outline agreement, the spending policy, the budget
 * snapshot, the supplier pool, the vendor records, the external match, the EDI
 * ASN, the delivery note, the knowledge article and the vendor's own invoice.
 *
 * Each reuses the shared SAP doc chrome (DocShell · DocTitleBand · SectionBand ·
 * Field) so the whole evidence trail reads as one document family. Field names
 * and code shapes (4600001207 outline agreement, EDI 856 segments, ME33K, KB
 * article number) mirror the real systems so a procurement reviewer trusts them.
 * Presentational only.
 */

import { Reply, ReplyAll, Forward, Trash2, Minus, Square, X } from "lucide-react";
import { DocShell, DocTitleBand, SectionBand } from "./sap/parts";
import { cn } from "@/freight/lib/utils";

/* ── Outlook reading-pane email ──────────────────────────────────────────────
 * Renders a received message the way it looks inside the Outlook desktop client:
 * a window title bar, a slim (decorative) ribbon, an Outlook reading header with
 * a sender avatar, and the body. Shared by every email source across all flows.
 */

function initials(name: string): string {
  const words = name.replace(/·.*$/, "").trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "?";
}

function RibbonCmd({ icon: Icon, label }: { icon: typeof Reply; label: string }) {
  return (
    <span className="flex flex-col items-center gap-0.5 px-2 py-1 text-[#444] select-none">
      <Icon size={15} className="text-[#0a6ed1]" />
      <span className="text-[9px] leading-none">{label}</span>
    </span>
  );
}

export function EmailDoc({
  from,
  fromAddr,
  to,
  sent,
  subject,
  lines,
  tone = "inbound",
}: {
  from: string;
  fromAddr: string;
  to: string;
  sent: string;
  subject: string;
  lines: string[];
  tone?: "inbound" | "outbound";
}) {
  return (
    <div className="rounded-lg border border-[#d6d9de] bg-white overflow-hidden shadow-sm">
      {/* Window title bar */}
      <div className="flex items-center justify-between gap-3 px-3 py-1.5 bg-[#f3f3f3] border-b border-[#e1e3e6]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-4 h-4 rounded-sm bg-[#0a6ed1] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
            O
          </span>
          <span className="text-[11px] text-[#555] truncate">{subject} — Message (HTML)</span>
        </div>
        <div className="flex items-center gap-2.5 text-[#888] shrink-0">
          <Minus size={12} />
          <Square size={10} />
          <X size={12} />
        </div>
      </div>

      {/* Slim ribbon — decorative */}
      <div className="flex items-center gap-1 px-2 py-1 bg-[#faf9f8] border-b border-[#e6e4e2]">
        <RibbonCmd icon={Reply} label="Reply" />
        <RibbonCmd icon={ReplyAll} label="Reply All" />
        <RibbonCmd icon={Forward} label="Forward" />
        <span className="w-px self-stretch bg-[#e1ddd9] mx-1" />
        <RibbonCmd icon={Trash2} label="Delete" />
      </div>

      {/* Reading header */}
      <div className="px-4 pt-3 pb-2.5 border-b border-[#eceef0]">
        <div className="text-[15px] font-bold text-ink leading-snug">{subject}</div>
        <div className="flex items-start gap-2.5 mt-2.5">
          <span
            className={cn(
              "w-9 h-9 rounded-full text-white text-[12px] font-bold flex items-center justify-center shrink-0",
              tone === "outbound" ? "bg-[#0a6ed1]" : "bg-[#5b6b7a]",
            )}
          >
            {initials(from)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-semibold text-ink truncate">{from}</span>
              <span className="text-[11px] text-mute shrink-0 whitespace-nowrap">{sent}</span>
            </div>
            <div className="text-[11px] text-mute truncate">{fromAddr}</div>
            <div className="text-[11px] text-mute mt-0.5">
              To: <span className="text-ink">{to}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-2.5 bg-white">
        {lines.map((l, i) => (
          <p key={i} className="text-[13px] text-ink leading-relaxed">
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ── Spending policy ──────────────────────────────────────────────────────── */

export function SpendingPolicyDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number="POL-MRO-04"
        status="In force"
        docType="Spending policy · maintenance & MRO"
        system="Procurement Policy"
        createdOn="rev. 2026-01"
        createdBy="Procurement Governance"
      />
      <SectionBand>Auto-submit rule</SectionBand>
      <div className="px-4 py-3 space-y-2.5">
        <p className="text-[13px] text-ink leading-relaxed">
          A maintenance &amp; MRO requisition may be auto-submitted without a human approver when{" "}
          <span className="font-bold">all three</span> conditions hold:
        </p>
        <ul className="text-[12.5px] text-ink leading-relaxed space-y-1.5 pl-1">
          <li>· The line is on an active outline agreement (on-contract).</li>
          <li>· The line value is under the <span className="font-bold">$50,000</span> MRO ceiling.</li>
          <li>· The cost center has available budget headroom.</li>
        </ul>
        <p className="text-[12px] text-mute leading-snug">
          Off-contract spend, novel categories, threshold breaches, budget over-runs or compliance flags route to the
          category sourcing manager.
        </p>
      </div>
    </DocShell>
  );
}

