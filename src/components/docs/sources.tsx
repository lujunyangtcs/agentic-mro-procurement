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
import { DocShell, DocTitleBand, SectionBand, Field } from "./sap/parts";
import { cn } from "@/lib/utils";

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

/* ── SAP ME33K outline agreement (the BeltPro MRO framework) ─────────────── */

export function OutlineAgreementDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number="4600001207"
        status="Active"
        docType="Outline agreement · MRO framework"
        system="SAP MM · ME33K"
        createdOn="2025-01-01 → 2027-12-31"
        createdBy="Category Sourcing"
      />
      <SectionBand>Header</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Vendor" value="100482 · BeltPro Industrial" mono />
        <Field label="Agreement type" value="MK · Quantity contract" />
        <Field label="Target value" value="USD 2,400,000.00" mono />
        <Field label="Payment terms" value="NT30 · Net 30 days" mono />
        <Field label="Incoterms" value="FCA · BeltPro Memphis DC" />
        <Field label="Purchasing org" value="NG01 · Northgate North America" mono />
      </div>
      <SectionBand>Item 10 — pricing condition</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Material" value="88-DBX · Belt, double-backer" mono />
        <Field label="List price (PB00)" value="USD 52,391.30 / EA" mono />
        <Field label="Framework discount (RA01)" value="−8.000 %" mono />
        <Field label="Net contract price" value="USD 48,200.00 / EA" mono />
        <Field label="Lead time" value="5 days" mono />
        <Field label="Quality / OTIF" value="A · 99.1% OTIF" />
      </div>
    </DocShell>
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

/* ── Budget headroom snapshot ─────────────────────────────────────────────── */

export function BudgetDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number="0000041702"
        status="Available"
        docType="Budget availability · cost center"
        system="SAP CO · KS03 / FMAVCR02"
        createdOn="FY2026 · period 06"
        createdBy="Controlling"
      />
      <SectionBand>Corrugating No.2 · repairs &amp; maintenance (G/L 510000)</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Annual budget" value="USD 1,850,000.00" mono />
        <Field label="Committed + actual" value="USD 1,402,880.00" mono />
        <Field label="Available" value="USD 447,120.00" mono />
        <Field label="This requisition" value="USD 48,200.00" mono />
        <Field label="After commitment" value="USD 398,920.00" mono />
        <Field label="AVC check" value="Passed · within tolerance" />
      </div>
    </DocShell>
  );
}

/* ── Approved supplier pool / shortlist ──────────────────────────────────── */

const POOL = [
  { code: "100482", name: "BeltPro Industrial", status: "Contracted", health: "A · 99.1% OTIF", risk: "Low" },
  { code: "100774", name: "Heartland Rubber", status: "Preferred", health: "B · 96.4% OTIF", risk: "Low" },
  { code: "101355", name: "Midwest Belting Co", status: "Approved", health: "B · 95.0% OTIF", risk: "Medium" },
];

export function SupplierPoolDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number="POOL · MRO-CONV"
        status="3 qualified"
        docType="Approved supplier pool · conveyor & belting"
        system="Supplier master · ML scoring"
        createdOn="2026-06-03"
        createdBy="Tactical Sourcing Agent"
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-surface-fog/60 text-left text-mute">
              {["Vendor", "Name", "Status", "Quality / OTIF", "Risk"].map((h) => (
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
            {POOL.map((p) => (
              <tr key={p.code} className={cn("text-ink", p.status === "Contracted" && "bg-[#eaf2fb]")}>
                <td className="px-3 py-2.5 border-b border-divider tabular-nums">{p.code}</td>
                <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap font-medium">{p.name}</td>
                <td className="px-3 py-2.5 border-b border-divider">{p.status}</td>
                <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap">{p.health}</td>
                <td className="px-3 py-2.5 border-b border-divider">{p.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DocShell>
  );
}

/* ── Vendor records (XK03) — golden vs duplicate ──────────────────────────── */

export function VendorRecordDoc({ variant }: { variant: "golden" | "duplicate" }) {
  const golden = variant === "golden";
  return (
    <DocShell>
      <DocTitleBand
        number={golden ? "100482" : "100731"}
        status={golden ? "Active · golden" : "Active · suspected duplicate"}
        docType="Vendor master record"
        system="SAP MDG · XK03 / BP"
        createdOn={golden ? "2019-03-11" : "2024-09-02"}
        createdBy="Vendor Master"
      />
      <SectionBand>General data</SectionBand>
      <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="Name" value={golden ? "BeltPro Industrial" : "Belt-Pro Industrial Inc."} />
        <Field label="Tax number (US EIN)" value="47-1839220" mono />
        <Field label="DUNS" value="07-114-8829" mono />
        <Field label="Street" value={golden ? "4120 Air Trans Rd" : "4120 Air Trans Road, Ste 200"} />
        <Field label="City / Region / Postal" value="Memphis · TN · 38118" />
        <Field label="Bank key / account" value="084000026 · ••••4471" mono />
      </div>
      <SectionBand>Company-code &amp; purchasing</SectionBand>
      <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="Recon. account" value="211000 · Trade payables" mono />
        <Field label="Payment terms" value="Net 30" mono />
        <Field label="Purchasing org" value="NG01" mono />
        <Field
          label="Open items"
          value={golden ? "1 active framework 4600001207" : "0 open POs · 0 open invoices"}
        />
      </div>
    </DocShell>
  );
}

/* ── External match evidence (D&B / sanctions) ────────────────────────────── */

export function ExternalMatchDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number="DNB-07-114-8829"
        status="One entity · confirmed"
        docType="External match evidence"
        system="Dun & Bradstreet · OFAC"
        createdOn="2026-06-03"
        createdBy="External data API"
      />
      <SectionBand>Identity resolution</SectionBand>
      <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="Legal name" value="BeltPro Industrial LLC" />
        <Field label="D&B DUNS" value="07-114-8829 · single site" mono />
        <Field label="US EIN" value="47-1839220" mono />
        <Field label="Registered address" value="4120 Air Trans Rd, Memphis TN 38118" />
        <Field label="OFAC / sanctions" value="No match · clear" />
        <Field label="Financial stress" value="Low · D&B rating 2A2" />
      </div>
      <div className="px-4 pb-3">
        <p className="text-[12px] text-mute leading-snug">
          EIN, DUNS and registered address resolve 100482 and 100731 to the same legal entity. No sanctions or fraud
          signal on either record.
        </p>
      </div>
    </DocShell>
  );
}

/* ── EDI 856 advance ship notice ──────────────────────────────────────────── */

export function EdiAsnDoc() {
  const segments = [
    "ST*856*0001",
    "BSN*00*BPI5567*20260608*1142*0001",
    "HL*1**S",
    "TD1*EA*1****G*48*LB",
    "TD5**2*FDEG*M*FEDEX FREIGHT",
    "REF*BM*MEMPHIS-4471-2026",
    "DTM*011*20260608",
    "HL*2*1*O",
    "PRF*PO-77310",
    "HL*3*2*I",
    "LIN**VP*88-DBX*PO*PO-77310",
    "SN1**1*EA",
    "CTT*3",
    "SE*14*0001",
  ];
  return (
    <DocShell>
      <DocTitleBand
        number="ASN · EDI 856"
        status="Received"
        docType="Advance ship notice · BeltPro"
        system="EDI · X12 856"
        createdOn="2026-06-08 · 11:42"
        createdBy="Supplier gateway"
      />
      <SectionBand>Extracted</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Ship date" value="2026-06-08" mono />
        <Field label="ETA" value="2026-06-09" mono />
        <Field label="Carrier / PRO" value="FedEx Freight · 4471" mono />
        <Field label="Bill of lading" value="MEMPHIS-4471-2026" mono />
        <Field label="PO reference" value="PO-77310" mono />
        <Field label="Quantity" value="1 EA · 88-DBX" mono />
      </div>
      <SectionBand>Raw segments</SectionBand>
      <pre className="px-4 py-3 text-[11px] leading-[1.7] text-ink tabular-nums overflow-x-auto whitespace-pre">
        {segments.join("\n")}
      </pre>
    </DocShell>
  );
}

/* ── Delivery note ────────────────────────────────────────────────────────── */

export function DeliveryNoteDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number="BPI-DN-5567"
        status="Delivered"
        docType="Delivery note · packing list"
        system="BeltPro Industrial"
        createdOn="2026-06-09 · 07:30"
        createdBy="BeltPro shipping"
      />
      <SectionBand>Shipment</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Ship-to" value="M042 · Containerboard mill · MNT1" />
        <Field label="PO reference" value="PO-77310 · item 10" mono />
        <Field label="Bill of lading" value="MEMPHIS-4471-2026" mono />
        <Field label="Material" value="88-DBX · Belt, double-backer" mono />
        <Field label="Quantity" value="1 EA" mono />
        <Field label="Condition" value="Inspected · OK" />
      </div>
    </DocShell>
  );
}

/* ── Knowledge article ────────────────────────────────────────────────────── */

export function KbArticleDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number="KB-PROC-0148"
        status="Published"
        docType="Knowledge article"
        system="ServiceNow KB"
        createdOn="rev. 2026-04"
        createdBy="Invoice Resolution"
      />
      <SectionBand>Checking the status of an MRO purchase order</SectionBand>
      <div className="px-4 py-3 space-y-2.5">
        <p className="text-[13px] text-ink leading-relaxed">
          To answer an order-status question, retrieve the linked PR and PO, read the confirmed delivery date from the
          PO schedule line, and confirm the goods-receipt storage location.
        </p>
        <ul className="text-[12.5px] text-ink leading-relaxed space-y-1.5 pl-1">
          <li>· On-contract MRO orders deliver within the framework lead time on the agreement.</li>
          <li>· If the confirmed date is on or before the requested date, no expedite is needed.</li>
          <li>· The PO management agent monitors the order and alerts the requestor if the date slips.</li>
        </ul>
      </div>
    </DocShell>
  );
}

/* ── Vendor's own invoice (the inbound PDF, pre-match) ─────────────────────── */

export function VendorInvoiceDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number="BPI-5567"
        status="Received · unmatched"
        docType="Supplier invoice"
        system="BeltPro Industrial · PDF"
        createdOn="2026-06-09"
        createdBy="BeltPro AR"
      />
      <SectionBand>Invoice</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Remit to" value="BeltPro Industrial · 100482" mono />
        <Field label="Your PO" value="PO-77310" mono />
        <Field label="Invoice date" value="2026-06-09" mono />
        <Field label="Terms" value="Net 30 · due 2026-07-09" mono />
        <Field label="Tax" value="U1 · self-assessed" mono />
        <Field label="Bank / account" value="084000026 · ••••4471" mono />
      </div>
      <SectionBand>Line</SectionBand>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-surface-fog/60 text-left text-mute">
              {["Material", "Description", "Qty", "Unit price", "Amount"].map((h) => (
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
              <td className="px-3 py-2.5 border-b border-divider tabular-nums">88-DBX</td>
              <td className="px-3 py-2.5 border-b border-divider">Belt, double-backer — Corrugator No.2</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums text-right">1 EA</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums text-right">$48,200.00</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums text-right font-bold">$48,200.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DocShell>
  );
}
