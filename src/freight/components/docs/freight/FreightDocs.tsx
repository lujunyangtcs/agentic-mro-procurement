/**
 * Freight settlement document family for the hero OCC run (lane CHI→RIV).
 *
 * Built on the shared SAP/ERP chrome (DocShell · DocTitleBand · SectionBand ·
 * Field) so the freight artifacts read as one genuine document family with the
 * rest of the workforce. Every figure ties out across the run:
 *   billed $15,480 · clears in-tolerance $13,664 · disputed $1,816 (3 lines).
 *
 * The hero is ThreeWayMatchDoc — the line-by-line Invoice × Shipment (SAP) ×
 * Contract (Excel) check that clears the clean lines and flags the surcharge
 * mismatch, the un-owed demurrage and the cube-out weight variance.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { DocShell, DocTitleBand, SectionBand, Field } from "@/freight/components/docs/sap/parts";
import { cn } from "@/freight/lib/utils";

/* ── Shared figures — single source of truth for the run ──────────────────── */
export const FRT = {
  invoice: "INV-SUM-5567",
  carrier: "Summit Carriers · SCAC SUMC",
  lane: "CHI → RIV · Chicago DC → Riverside mill",
  grade: "OCC · old corrugated containers",
  haul: "Live load",
  shipment: "SHP-55012",
  billed: "15,480.00",
  clears: "13,664.00",
  disputed: "1,816.00",
};

/* ════════════════════════════════════════════════════════════════════════
 * Drill-down previews — every classified item / flagged exception opens a
 * complete, professional reference document. Content is faithful to the
 * inbound-haulage problem brief (haul-type economics; freight-invoice defects).
 * ════════════════════════════════════════════════════════════════════════ */

/** Centered overlay that renders a full document as a click-to-open preview. */
export function PreviewModal({ node, onClose }: { node: React.ReactNode; onClose: () => void }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-auto bg-black/45 p-6" onClick={onClose}>
      <div className="w-full max-w-3xl my-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={onClose}
            className="ui-pill inline-flex items-center gap-1.5 rounded bg-white text-ink text-[12px] font-medium px-3 py-1.5 shadow-sm hover:bg-surface-fog"
          >
            Close ✕
          </button>
        </div>
        {node}
      </div>
    </div>,
    document.body,
  );
}

/** A row/cell rendered as an inline "open preview" hyperlink. */
export function PreviewLink({ children, onOpen }: { children: React.ReactNode; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="ui-pill inline-flex items-center gap-1 text-surface-deep underline decoration-surface-deep/30 underline-offset-2 hover:decoration-surface-deep font-medium"
    >
      {children}
      <span aria-hidden className="text-[10px]">↗</span>
    </button>
  );
}

/* ── Haul-type reference files (4) ─────────────────────────────────────────── */
export type HaulKey = "live" | "rolloff" | "backhaul" | "onpomg";

const HAUL_DETAIL: Record<HaulKey, {
  code: string;
  title: string;
  summary: string;
  whenUsed: string;
  equipment: string;
  rateBasis: string;
  rules: string[];
  risks: { head: string; body: string }[];
  example: string;
}> = {
  live: {
    code: "HT-LIVE",
    title: "Live load — approved movement pattern",
    summary: "The driver waits while the trailer is loaded or unloaded in a single visit. Used here for the OCC pickup on lane CHI→RIV.",
    whenUsed: "A single OCC or single-grade load that fits the mill's receiving window.",
    equipment: "53' dry van",
    rateBasis: "Per-load lane rate + fuel surcharge · detention after free time",
    rules: [
      "Driver dwell beyond the free-time window bills as detention — confirm against the yard gate log.",
      "Single load on/off in one visit — no drop-and-swap container.",
      "Per-load lane: no reweigh / weight-adjustment accessorial applies.",
    ],
    risks: [
      { head: "Massive weight inconsistency", body: "Unsorted wastepaper bales (like OCC) vary wildly in density. Heavy, wet or compact mixed loads overload conveyor and feeding equipment at the mill, causing mechanical jams and breakdowns." },
      { head: "Structural safety on tipping floors", body: "On the storage / tipping floors, the physical weight of stacked paper bales puts immense stress on flooring and retaining walls." },
      { head: "Cube-out", body: "OCC is light but bulky — trailers 'cube out' (fill all physical space) long before reaching weight capacity, so claimed and scaled weight rarely match." },
    ],
    example: "This pickup · CHI→RIV · OCC · est 22.0 t / scaled 20.0 t",
  },
  rolloff: {
    code: "HT-ROLL",
    title: "Roll-off — approved movement pattern",
    summary: "A drop-and-swap container exchange at the source site. Not used for this single-load OCC pickup.",
    whenUsed: "Site container exchange where a full container is dropped and an empty swapped in.",
    equipment: "Roll-off chassis + container",
    rateBasis: "Per-haul + container fee · discount risk on light loads",
    rules: [
      "Container swap, not a single load — billed per haul, not per stop.",
      "Watch for un-compacted volume discounting.",
    ],
    risks: [
      { head: "High transportation cost", body: "Roll-off hauling carries high transport cost relative to the recovered tonnage it moves." },
      { head: "Contamination & moisture", body: "Frequent contamination and inefficiency from moisture and bulkiness reduce the usable fibre." },
      { head: "Bulky, un-compacted volume", body: "Bulky, un-compacted volume leads to discounting — the load bills heavy on space but light on saleable fibre." },
    ],
    example: "n/a for this pickup (single live load, not a container swap)",
  },
  backhaul: {
    code: "HT-BACK",
    title: "Backhaul — approved movement pattern",
    summary: "Recovered fibre moved on a carrier's return leg. Not used here — this is a dedicated inbound load.",
    whenUsed: "A carrier returning empty from the mill picks up return-leg cargo.",
    equipment: "Any returning unit",
    rateBasis: "Discounted return-leg rate",
    rules: [
      "Only on a confirmed empty return leg.",
      "Grade must be confirmed before tender — backhauls mix grades.",
    ],
    risks: [
      { head: "High contamination risk", body: "Shipping mixed scrap paper in return containers exposes the material to other cargo remnants or moisture, raising the likelihood of contamination. Contaminated paper yields lower-quality pulp and is heavily rejected by mills." },
      { head: "Sorting & grading inefficiencies", body: "Collecting waste paper from disparate backhaul sources often results in unstandardized grades of raw fibre. Mills require uniform, well-sorted material, but mixed backhaul loads make quality control difficult." },
    ],
    example: "n/a for this pickup (dedicated inbound, no return cargo)",
  },
  onpomg: {
    code: "HT-ONP",
    title: "ONP / OMG move — approved movement pattern",
    summary: "Old newsprint / old magazine grade movement. Not used here — this load is OCC, not newsprint.",
    whenUsed: "ONP/OMG grade only — kept separate from OCC to protect grade quality.",
    equipment: "53' dry van",
    rateBasis: "Per-load lane rate by grade",
    rules: [
      "Never co-load ONP/OMG with OCC — grade contamination downgrades the fibre.",
      "Classify the grade at intake before the lane is tendered.",
    ],
    risks: [
      { head: "Grade classification", body: "Determining whether material is 'waste', 'recycled OCC', newsprint or finished product can lead to classification mishaps and rate miscalculations if not fixed at intake." },
    ],
    example: "n/a for this pickup (grade is OCC, not newsprint/magazine)",
  },
};

export function HaulTypeDetailDoc({ k }: { k: HaulKey }) {
  const d = HAUL_DETAIL[k];
  return (
    <DocShell>
      <DocTitleBand
        number={d.code}
        status={k === "live" ? "Selected · this lane" : "Approved pattern"}
        docType="Haul-type reference · approved movement pattern"
        system="Lane master · movement patterns"
        createdOn="2026-01-01"
        createdBy="Transportation coordinator"
      />
      <div className="px-4 py-3 text-[12.5px] text-ink leading-relaxed">{d.summary}</div>
      <SectionBand>Pattern</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="When used" value={d.whenUsed} />
        <Field label="Equipment" value={d.equipment} />
        <Field label="Rate basis" value={d.rateBasis} />
      </div>
      <SectionBand>Operating rules</SectionBand>
      <ul className="px-4 py-3 space-y-1.5">
        {d.rules.map((r) => (
          <li key={r} className="flex items-start gap-2 text-[12px] text-ink">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-surface-deep shrink-0" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
      <SectionBand>Known problems on this haul type</SectionBand>
      <div className="px-4 py-3 space-y-2.5">
        {d.risks.map((r) => (
          <div key={r.head} className="text-[12px]">
            <div className="font-semibold text-ink">{r.head}</div>
            <div className="text-mute leading-relaxed">{r.body}</div>
          </div>
        ))}
      </div>
      <SectionBand>This pickup</SectionBand>
      <div className="px-4 py-3 text-[12px] text-mute">{d.example}</div>
    </DocShell>
  );
}

/* ── Exception detail files (3) ────────────────────────────────────────────── */
export type ExcKey = "surcharge" | "demurrage" | "cubeout";

const EXC_DETAIL: Record<ExcKey, {
  code: string;
  title: string;
  contract: string;
  billed: string;
  variance: string;
  evidence: { label: string; detail: string }[];
  why: string;
  owner: string;
  ownerAccent: string;
  action: string;
}> = {
  surcharge: {
    code: "EXC-SUR-5567",
    title: "Fuel surcharge mismatch",
    contract: "22% of line haul · USD 2,464.00",
    billed: "flat USD 2,900.00",
    variance: "+USD 436.00 over",
    evidence: [
      { label: "Rate card RC-OCC-2026", detail: "Fuel surcharge clause: 22% of line haul on lane CHI→RIV" },
      { label: "Fuel index (period)", detail: "Effective surcharge 22% — confirms the contracted basis" },
      { label: "Carrier invoice INV-SUM-5567", detail: "Billed a flat $2,900 instead of the percentage" },
    ],
    why: "Fuel surcharges are formatted inconsistently across carriers — a flat container fee versus a percentage — which makes apples-to-apples cost comparison nearly impossible. Normalised to the contracted percentage (22% of the $11,200 line haul = $2,464), the carrier's flat $2,900 is $436 over tolerance.",
    owner: "Sourcing team",
    ownerAccent: "var(--surface-deep)",
    action: "Dispute the $436 overcharge and hold future invoices on this lane to the contracted percentage basis.",
  },
  demurrage: {
    code: "EXC-DEM-5567",
    title: "Un-owed demurrage / detention",
    contract: "Free time 2.0 h · then detention",
    billed: "USD 900.00",
    variance: "USD 900.00 not owed",
    evidence: [
      { label: "Yard gate log GATE-RIV-0620", detail: "Gate in 07:31 · gate out 09:01 = 1.5 h on site" },
      { label: "Contract free-time clause", detail: "2.0 h free time before detention applies" },
      { label: "Carrier invoice INV-SUM-5567", detail: "Billed $900 demurrage" },
    ],
    why: "Mills importing recovered fibre face severe supply-chain bottlenecks; when trucks are held, carriers apply heavy demurrage or detention charges that often don't match the original invoice terms. Here the gate log shows the truck on site 1.5 h against 2.0 h of free time — no detention is owed.",
    owner: "Planning team",
    ownerAccent: "var(--accent-navy)",
    action: "Dispute the full $900 — under the free-time terms, none is owed for this shipment.",
  },
  cubeout: {
    code: "EXC-WGT-5567",
    title: "Cube-out weight variance",
    contract: "Per-load lane · no reweigh adjustment",
    billed: "USD 480.00 (weight adjustment on 22.0 t)",
    variance: "USD 480.00 on a 2.0 t overstatement",
    evidence: [
      { label: "Weigh-bridge ticket WB-RIV-44812", detail: "Mill scale net weight 20.0 t" },
      { label: "Carrier claim", detail: "Claimed 22.0 t on the BOL" },
      { label: "Rate card RC-OCC-2026", detail: "Per-load lane — reweigh adjustment not applicable" },
    ],
    why: "Baled OCC has variable payload and density and 'cubes out' — it fills the trailer before reaching weight capacity. Shippers estimate weight, then carriers reweigh and retroactively adjust the rate. The mill weigh-bridge scaled 20.0 t versus the carrier's claimed 22.0 t, so the per-tonne weight-adjustment overstates the haul by 2.0 t.",
    owner: "Sourcing team",
    ownerAccent: "var(--surface-deep)",
    action: "Dispute the $480 — this lane is contracted per-load, so no reweigh adjustment applies.",
  },
};

export function ExceptionDetailDoc({ k }: { k: ExcKey }) {
  const d = EXC_DETAIL[k];
  return (
    <DocShell>
      <DocTitleBand
        number={d.code}
        status="Exception · disputed"
        docType={`Settlement exception · ${d.title}`}
        system="Settlement matcher"
        createdOn="2026-06-20 · 09:12"
        createdBy="Freight Settlement Matcher"
      />
      <SectionBand>Variance</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Contract basis" value={d.contract} />
        <Field label="Carrier billed" value={d.billed} mono />
        <Field label="Variance" value={d.variance} mono />
      </div>
      <SectionBand>Evidence</SectionBand>
      <div className="px-4 py-3 space-y-2">
        {d.evidence.map((e) => (
          <div key={e.label} className="flex items-start gap-2 text-[12px]">
            <span className="mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#107e3e] text-white text-[9px] font-bold shrink-0">✓</span>
            <span className="text-ink"><span className="font-medium">{e.label}</span> <span className="text-mute">· {e.detail}</span></span>
          </div>
        ))}
      </div>
      <SectionBand>Why it's an exception</SectionBand>
      <div className="px-4 py-3 text-[12px] text-ink leading-relaxed">{d.why}</div>
      <SectionBand>Routing &amp; recommended action</SectionBand>
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-mute">Routes to</span>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ color: d.ownerAccent, background: `color-mix(in srgb, ${d.ownerAccent} 12%, white)` }}>{d.owner}</span>
        </div>
        <div className="text-[12px] text-ink leading-relaxed">{d.action}</div>
      </div>
    </DocShell>
  );
}

/* ── 1 · Lane intake packet ───────────────────────────────────────────────── */
export function LaneIntakePacket() {
  const [preview, setPreview] = React.useState<React.ReactNode>(null);
  const haulRows: { k: HaulKey; type: string; fit: string; pick: boolean }[] = [
    { k: "live", type: "Live load", fit: "Single OCC load, fits the mill receiving window", pick: true },
    { k: "rolloff", type: "Roll-off", fit: "No — not a drop-and-swap container move", pick: false },
    { k: "backhaul", type: "Backhaul", fit: "No — dedicated inbound, no return cargo", pick: false },
    { k: "onpomg", type: "ONP / OMG move", fit: "No — grade is OCC, not newsprint/magazine", pick: false },
  ];
  return (
    <DocShell>
      <DocTitleBand
        number="FRT-48201"
        status="Classified"
        docType="Lane intake packet · tender-ready"
        system="Lane master · CHI→RIV"
        createdOn="2026-06-19 · 09:02"
        createdBy="Lane Intake Orchestrator"
      />
      <SectionBand>Pickup requirement</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Origin" value="Chicago DC · retail/DC source" />
        <Field label="Destination" value="Riverside mill · M042" />
        <Field label="Material grade" value={FRT.grade} />
        <Field label="Haul type" value={FRT.haul} mono />
        <Field label="Lane" value="CHI → RIV" mono />
        <Field label="Receiving window" value="2026-06-20 · 06:00–14:00" mono />
      </div>
      <SectionBand>Haul-type classification · click a row to open its file</SectionBand>
      <table className="w-full text-[12px] border-collapse">
        <thead>
          <tr className="bg-[#eef1f5] text-left text-[#5b6b7b]">
            {["Haul type", "Fit for this pickup", ""].map((h, i) => (
              <th key={i} className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {haulRows.map((r) => (
            <tr
              key={r.k}
              onClick={() => setPreview(<HaulTypeDetailDoc k={r.k} />)}
              className={cn("align-top cursor-pointer group hover:bg-surface-mint/40 transition-colors", r.pick && "bg-surface-mint/25")}
            >
              <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap font-medium text-surface-deep underline decoration-surface-deep/25 underline-offset-2 group-hover:decoration-surface-deep">{r.type}</td>
              <td className="px-3 py-2.5 border-b border-divider text-mute">{r.fit}</td>
              <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap">
                {r.pick
                  ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-surface-deep"><span className="w-1.5 h-1.5 rounded-full bg-surface-deep" />Selected ↗</span>
                  : <span className="text-[11px] text-mute group-hover:text-surface-deep">Open ↗</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <SectionBand>Classification</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Grade" value="OCC · vs mixed paper / DLK / ONP-OMG" />
        <Field label="Movement pattern" value="Approved · OCC live load" />
        <Field label="Confidence" value="98% · auto-classified" mono />
      </div>
      {preview && <PreviewModal node={preview} onClose={() => setPreview(null)} />}
    </DocShell>
  );
}

/* ── Source · Lane master (approved movement patterns) ────────────────────── */
export function LaneMasterDoc() {
  const [preview, setPreview] = React.useState<React.ReactNode>(null);
  const patterns: { k: HaulKey; type: string; pattern: string; equip: string; when: string; lane: boolean }[] = [
    { k: "live", type: "Live load", pattern: "Driver waits · single load on/off", equip: "53' dry van", when: "Single OCC/grade load inside the mill window", lane: true },
    { k: "rolloff", type: "Roll-off", pattern: "Drop-and-swap container", equip: "Roll-off chassis", when: "Site container exchange", lane: false },
    { k: "backhaul", type: "Backhaul", pattern: "Return-leg cargo", equip: "Any returning unit", when: "Carrier returning empty from the mill", lane: false },
    { k: "onpomg", type: "ONP / OMG move", pattern: "Newsprint / magazine grade", equip: "53' dry van", when: "ONP/OMG grade only", lane: false },
  ];
  return (
    <DocShell>
      <DocTitleBand
        number="LM-CHI-RIV"
        status="Approved"
        docType="Lane master · approved movement patterns"
        system="Lane master"
        createdOn="2026-01-01"
        createdBy="Transportation coordinator"
      />
      <SectionBand>Lane CHI → RIV</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Origin" value="Chicago DC · retail/DC source" />
        <Field label="Destination" value="Riverside mill · M042" />
        <Field label="Grades served" value="OCC · mixed paper · DLK" />
      </div>
      <SectionBand>Approved haul-type movement patterns · click a row to open its file</SectionBand>
      <table className="w-full text-[12px] border-collapse">
        <thead>
          <tr className="bg-[#eef1f5] text-left text-[#5b6b7b]">
            {["Haul type", "Pattern", "Equipment", "When used", ""].map((h, i) => (
              <th key={i} className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {patterns.map((r) => (
            <tr
              key={r.k}
              onClick={() => setPreview(<HaulTypeDetailDoc k={r.k} />)}
              className={cn("align-top cursor-pointer group hover:bg-surface-mint/40 transition-colors", r.lane && "bg-surface-mint/25")}
            >
              <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap font-medium text-surface-deep underline decoration-surface-deep/25 underline-offset-2 group-hover:decoration-surface-deep">{r.type}</td>
              <td className="px-3 py-2.5 border-b border-divider text-mute">{r.pattern}</td>
              <td className="px-3 py-2.5 border-b border-divider text-mute">{r.equip}</td>
              <td className="px-3 py-2.5 border-b border-divider text-mute">{r.when}</td>
              <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap">
                {r.lane
                  ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-surface-deep"><span className="w-1.5 h-1.5 rounded-full bg-surface-deep" />This lane ↗</span>
                  : <span className="text-[11px] text-mute group-hover:text-surface-deep">Open ↗</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {preview && <PreviewModal node={preview} onClose={() => setPreview(null)} />}
    </DocShell>
  );
}

/* ── 2 · Rate & surcharge validation ──────────────────────────────────────── */
export function RateValidationDoc() {
  const [preview, setPreview] = React.useState<React.ReactNode>(null);
  const rows: { line: string; contract: string; billed: string; ok: boolean; exc?: ExcKey }[] = [
    { line: "Line haul", contract: "11,200.00", billed: "11,200.00", ok: true },
    { line: "Fuel surcharge", contract: "22% · 2,464.00", billed: "flat 2,900.00", ok: false, exc: "surcharge" },
  ];
  return (
    <DocShell>
      <DocTitleBand
        number="RATE-CHI-RIV"
        status="2 of 2 checked"
        docType="Rate & surcharge validation"
        system="Rate-card graph · fuel index"
        createdOn="2026-06-19 · 09:08"
        createdBy="Rate & Surcharge Engine"
      />
      <SectionBand>Rate basis — billed vs contract</SectionBand>
      <table className="w-full text-[12px] border-collapse">
        <thead>
          <tr className="bg-[#eef1f5] text-left text-[#5b6b7b]">
            {["Cost line", "Contract", "Billed", "", ""].map((h, i) => (
              <th key={i} className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.line} className={cn("text-ink align-top", !r.ok && "bg-[#bb0000]/[0.04]")}>
              <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap">{r.line}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums">{r.contract}</td>
              <td className="px-3 py-2.5 border-b border-divider tabular-nums font-medium">{r.billed}</td>
              <td className="px-3 py-2.5 border-b border-divider">
                <span className={cn("inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold", r.ok ? "bg-[#107e3e]" : "bg-[#bb0000]")}>{r.ok ? "✓" : "✕"}</span>
              </td>
              <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap">
                {r.exc && <PreviewLink onOpen={() => setPreview(<ExceptionDetailDoc k={r.exc!} />)}>View exception</PreviewLink>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-3 text-[12px] text-mute">
        Surcharge normalised to a like-for-like basis: the contracted fuel surcharge is <span className="text-ink">22% of line haul ($2,464)</span>; the carrier billed a <span className="text-ink">flat $2,900</span> — <span className="text-[#bb0000] font-medium">$436 over</span> and out of tolerance. <PreviewLink onOpen={() => setPreview(<ExceptionDetailDoc k="surcharge" />)}>Open the exception file</PreviewLink>
      </div>
      {preview && <PreviewModal node={preview} onClose={() => setPreview(null)} />}
    </DocShell>
  );
}

/* ── 3 · Carrier tender confirmation ──────────────────────────────────────── */
export function CarrierTenderDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number="TND-77310"
        status="Tendered · confirmed"
        docType="Carrier tender · approved pool"
        system="Carrier scorecard · capacity"
        createdOn="2026-06-19 · 09:10"
        createdBy="Carrier Tender Advisor"
      />
      <SectionBand>Carrier recommendation — approved pool compared</SectionBand>
      <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
        {[
          { c: "Summit Carriers", scac: "SUMC", rate: "$11,200", ot: "96%", df: "1.4%", sa: "Within commitment", verdict: "Best fit", pick: true },
          { c: "Ironwood Freight Lines", scac: "IRNW", rate: "$11,650", ot: "93%", df: "2.1%", sa: "Within commitment", verdict: "+$450 on the lane", pick: false },
          { c: "Cedar Haul Logistics", scac: "CEDR", rate: "$10,980", ot: "88%", df: "4.6%", sa: "Over commitment", verdict: "Cheapest, but prior defects", pick: false },
        ].map((r) => (
          <div
            key={r.c}
            className={cn(
              "flex flex-col rounded-md border p-3.5",
              r.pick ? "border-surface-deep ring-1 ring-surface-deep bg-surface-mint/25" : "border-divider bg-white",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12.5px] font-bold text-ink leading-tight">{r.c}</span>
              {r.pick && <span className="shrink-0 rounded-full bg-surface-deep text-white text-[9px] font-bold px-2 py-0.5 whitespace-nowrap">★ RECOMMENDED</span>}
            </div>
            <div className="text-[10px] tracking-[0.06em] uppercase text-mute mt-0.5">SCAC {r.scac}</div>
            <div className="mt-3 space-y-1.5 text-[12px] flex-1">
              {[
                { k: "Lane rate", v: r.rate, tone: "ink" },
                { k: "On-time", v: r.ot, tone: "ink" },
                { k: "Defect rate", v: r.df, tone: r.df === "4.6%" ? "red" : "ink" },
                { k: "Sourcing", v: r.sa, tone: r.sa.startsWith("Over") ? "red" : "ink" },
              ].map((row) => (
                <div key={row.k} className="flex items-center justify-between gap-2">
                  <span className="text-mute">{row.k}</span>
                  <span className={cn("font-medium tabular-nums", row.tone === "red" ? "text-[#bb0000]" : "text-ink")}>{row.v}</span>
                </div>
              ))}
            </div>
            <div className={cn("mt-3 pt-2.5 border-t text-[11px]", r.pick ? "border-surface-deep/20 text-surface-deep font-semibold" : "border-divider text-mute")}>
              {r.verdict}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 pb-3 text-[12px] text-mute">
        Ranked on lane economics + sourcing compliance + prior invoice-defect history: <span className="text-ink">Summit Carriers</span> wins the lane at $11,200 with the cleanest defect record (1.4%); Cedar is $220 cheaper but sits over its volume commitment and carries a 4.6% defect rate.
      </div>
      <SectionBand>Award · tendered</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Carrier" value={FRT.carrier} />
        <Field label="Equipment" value="53' dry van · live load" />
        <Field label="Pickup window" value="2026-06-19 · 13:00–15:00" mono />
      </div>
    </DocShell>
  );
}

/* ── 4 · Load capture packet ──────────────────────────────────────────────── */
export function LoadPacketDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number={FRT.shipment}
        status="Captured · variance flagged"
        docType="Load packet · BOL + receiving"
        system="Document intelligence · weigh-bridge"
        createdOn="2026-06-20 · 07:40"
        createdBy="Load Capture Agent"
      />
      <SectionBand>Evidence packet</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Bill of lading" value="BOL-SUMC-44812" mono />
        <Field label="Pickup confirmation" value="Confirmed · 2026-06-19 14:06" />
        <Field label="Receiving ticket" value="Riverside M042 · 07:31" />
        <Field label="Shipment reference" value={FRT.shipment} mono />
      </div>
      <SectionBand>Weight reconciliation — cube-out</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Estimated weight" value="22.0 t (carrier claim)" mono />
        <Field label="Scaled weight" value="20.0 t (weigh-bridge)" mono />
        <Field label="Variance" value="−2.0 t · cubed out light" mono />
      </div>
      <div className="px-4 py-3 text-[12px] text-mute">
        OCC is light but bulky — the trailer cubed out 2 tonnes under the claimed weight. The carrier's <span className="text-ink">weight-adjustment accessorial ($480)</span> bills on 22 t, but the receiving scale reads 20 t — <span className="text-[#bb0000] font-medium">variance above tolerance</span>.
      </div>
    </DocShell>
  );
}

/* ── 5 · HERO — three-way match (Invoice × Shipment × Contract) ───────────── */
type MatchLine = {
  line: string;
  contract: string;
  shipment: string;
  invoice: string;
  ok: boolean;
  exc?: ExcKey;
};

const matchLines: MatchLine[] = [
  { line: "Line haul", contract: "11,200.00", shipment: "CHI→RIV confirmed", invoice: "11,200.00", ok: true },
  { line: "Fuel surcharge", contract: "22% · 2,464.00", shipment: "index 22%", invoice: "flat 2,900.00", ok: false, exc: "surcharge" },
  { line: "Demurrage / detention", contract: "free 2.0 h", shipment: "gate 1.5 h", invoice: "900.00", ok: false, exc: "demurrage" },
  { line: "Weight adjustment", contract: "per-load", shipment: "scaled 20.0 t", invoice: "22.0 t · 480.00", ok: false, exc: "cubeout" },
  { line: "Booking / company code", contract: "1000 · CF", shipment: FRT.shipment, invoice: `${FRT.shipment} · 1000`, ok: true },
];

export function ThreeWayMatchDoc() {
  const [preview, setPreview] = React.useState<React.ReactNode>(null);
  return (
    <DocShell>
      <DocTitleBand
        number={FRT.invoice}
        status="3 lines flagged"
        docType="Three-way check · Invoice × Shipment × Contract"
        system="Settlement matcher"
        createdOn="2026-06-20 · 09:12"
        createdBy="Freight Settlement Matcher"
      />
      <SectionBand>Basic data</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Carrier" value={FRT.carrier} />
        <Field label="Lane · grade" value={`${FRT.lane.split(" · ")[0]} · ${FRT.grade.split(" · ")[0]}`} mono />
        <Field label="Invoice total" value={`USD ${FRT.billed}`} mono />
        <Field label="Shipment (SAP)" value={FRT.shipment} mono />
        <Field label="Contract (Excel)" value="Rate card RC-OCC-2026" mono />
        <Field label="Clears now" value={`USD ${FRT.clears}`} mono />
      </div>
      <SectionBand>Line-by-line — contract · shipment · invoice · click a flagged line</SectionBand>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-[12px] border-collapse">
          <thead>
            <tr className="bg-[#eef1f5] text-left text-[#5b6b7b]">
              {["Cost line", "Contract", "Shipment (SAP)", "Invoice", "", ""].map((h, i) => (
                <th key={i} className="px-3 py-2 text-[10px] tracking-[0.04em] uppercase font-medium border-b border-divider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matchLines.map((r) => (
              <tr
                key={r.line}
                onClick={r.exc ? () => setPreview(<ExceptionDetailDoc k={r.exc!} />) : undefined}
                className={cn("text-ink", r.exc && "cursor-pointer group hover:bg-[#bb0000]/[0.06] bg-[#bb0000]/[0.03] transition-colors")}
              >
                <td className="px-3 py-2.5 border-b border-divider text-mute whitespace-nowrap">{r.line}</td>
                <td className="px-3 py-2.5 border-b border-divider tabular-nums">{r.contract}</td>
                <td className="px-3 py-2.5 border-b border-divider tabular-nums">{r.shipment}</td>
                <td className="px-3 py-2.5 border-b border-divider tabular-nums font-medium">{r.invoice}</td>
                <td className="px-3 py-2.5 border-b border-divider">
                  <span className={cn("inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold", r.ok ? "bg-[#107e3e]" : "bg-[#bb0000]")}>{r.ok ? "✓" : "✕"}</span>
                </td>
                <td className="px-3 py-2.5 border-b border-divider whitespace-nowrap">
                  {r.exc && <span className="ui-pill inline-flex items-center gap-1 text-[11px] font-medium text-[#bb0000] underline decoration-[#bb0000]/30 underline-offset-2 group-hover:decoration-[#bb0000]">View exception ↗</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SectionBand>Freight failure-point checks — all clear</SectionBand>
      <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2">
        {[
          { check: "Booking details present", found: "Lane, window, equipment on file" },
          { check: "PO / shipment number", found: `Matched ${FRT.shipment}` },
          { check: "Duplicate booking", found: "No prior invoice for this shipment" },
          { check: "Entity / company code", found: "1000 · Northgate Paper · correct" },
          { check: "PO value sufficient", found: "Within freight accrual" },
          { check: "Price / quantity match", found: "Line haul + qty tie to contract" },
        ].map((r) => (
          <div key={r.check} className="flex items-start gap-2 text-[12px]">
            <span className="mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#107e3e] text-white text-[9px] font-bold shrink-0">✓</span>
            <span className="text-ink"><span className="font-medium">{r.check}</span> <span className="text-mute">· {r.found}</span></span>
          </div>
        ))}
      </div>
      <SectionBand>Exception routing — each line linked to the team that owns the fix</SectionBand>
      <div className="px-4 py-4 space-y-2.5">
        {[
          { line: "Fuel surcharge mismatch", amount: "$436", team: "Sourcing team", why: "rate-card / contract", accent: "var(--surface-deep)" },
          { line: "Un-owed demurrage", amount: "$900", team: "Planning team", why: "scheduling / free-time", accent: "var(--accent-navy)" },
          { line: "Cube-out weight", amount: "$480", team: "Sourcing team", why: "rate-basis re-rate", accent: "var(--surface-deep)" },
        ].map((r) => (
          <div key={r.line} className="flex items-stretch gap-0">
            {/* exception node */}
            <div
              className="flex-1 rounded-md border border-divider bg-white pl-3 pr-3 py-2 flex items-center gap-2.5"
              style={{ borderLeftWidth: 3, borderLeftColor: r.accent }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.accent }} />
              <span className="text-[12px] text-ink font-medium">{r.line}</span>
              <span className="ml-auto text-[12px] tabular-nums font-semibold text-[#bb0000]">{r.amount}</span>
            </div>
            {/* connector */}
            <div className="flex items-center px-2 shrink-0" aria-hidden>
              <span className="hidden sm:block w-6 border-t border-dashed" style={{ borderColor: r.accent }} />
              <span className="text-[13px] -ml-0.5" style={{ color: r.accent }}>▸</span>
            </div>
            {/* team destination node */}
            <div
              className="w-52 shrink-0 rounded-md px-3 py-2 flex flex-col justify-center"
              style={{ background: `color-mix(in srgb, ${r.accent} 12%, white)`, border: `1px solid color-mix(in srgb, ${r.accent} 30%, white)` }}
            >
              <span className="text-[12px] font-semibold leading-tight" style={{ color: r.accent }}>{r.team}</span>
              <span className="text-[10.5px] text-mute leading-tight">{r.why}</span>
            </div>
          </div>
        ))}
        <div className="pt-1 text-[11.5px] text-mute">
          Routed this settlement: <span className="font-semibold" style={{ color: "var(--surface-deep)" }}>$916 → Sourcing team</span> · <span className="font-semibold" style={{ color: "var(--accent-navy)" }}>$900 → Planning team</span>
        </div>
      </div>
      <SectionBand>Settlement &amp; dispute</SectionBand>
      <div className="px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full ring-2 bg-[#107e3e] ring-[#107e3e]/25" />
          <span className="text-[12.5px] text-ink">In-tolerance lines clear: <span className="font-bold tabular-nums">USD {FRT.clears}</span></span>
        </div>
        <div className="h-5 w-px bg-divider hidden sm:block" />
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full ring-2 bg-[#bb0000] ring-[#bb0000]/25" />
          <span className="text-[12.5px] text-ink">Disputed across 3 lines: <span className="font-bold tabular-nums">USD {FRT.disputed}</span></span>
        </div>
      </div>
      {preview && <PreviewModal node={preview} onClose={() => setPreview(null)} />}
    </DocShell>
  );
}

/* ── 6 · Settlement & dispute advice ──────────────────────────────────────── */
export function SettlementAdviceDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number="SET-77310"
        status="Posted · dispute sent"
        docType="Settlement & dispute advice"
        system="SAP AP · audit envelope"
        createdOn="2026-06-20 · 09:20"
        createdBy="Approval & Exception Router"
      />
      <SectionBand>Settled now</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Carrier" value={FRT.carrier} />
        <Field label="Cleared lines" value="Line haul + fuel (at contract)" />
        <Field label="Posted to AP" value={`USD ${FRT.clears}`} mono />
        <Field label="Terms" value="Net 30 · pay on due date" mono />
      </div>
      <SectionBand>Disputed — drafted to the carrier</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Surcharge over-bill" value="USD 436.00" mono />
        <Field label="Un-owed demurrage" value="USD 900.00" mono />
        <Field label="Weight-adjustment" value="USD 480.00" mono />
        <Field label="Total recoverable" value={`USD ${FRT.disputed}`} mono />
        <Field label="Audit envelope" value="SET-77310 · closed" mono />
        <Field label="Evidence" value="Rate card · gate log · weigh ticket" />
      </div>
    </DocShell>
  );
}

/* ════ Source evidence — clickable files on the run's left rail ════════════ */

/** The carrier's freight invoice as received (PDF-style). */
export function CarrierInvoiceDoc() {
  const rows = [
    ["Line haul", "11,200.00"],
    ["Fuel surcharge (flat)", "2,900.00"],
    ["Demurrage", "900.00"],
    ["Weight adjustment (22.0 t)", "480.00"],
  ];
  return (
    <DocShell>
      <DocTitleBand
        number={FRT.invoice}
        status="Received"
        docType="Carrier freight invoice · PDF"
        system="Summit Carriers"
        createdOn="2026-06-20 · 09:01"
        createdBy="Carrier billing"
      />
      <SectionBand>Invoice header</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Carrier" value={FRT.carrier} />
        <Field label="Shipment ref" value={FRT.shipment} mono />
        <Field label="Lane" value="CHI → RIV" mono />
        <Field label="Terms" value="Net 30" mono />
      </div>
      <SectionBand>Charges</SectionBand>
      <table className="w-full text-[12px] border-collapse">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="text-ink">
              <td className="px-3 py-2 border-b border-divider text-mute">{k}</td>
              <td className="px-3 py-2 border-b border-divider tabular-nums text-right">{v}</td>
            </tr>
          ))}
          <tr className="text-ink font-bold">
            <td className="px-3 py-2.5">Total billed (USD)</td>
            <td className="px-3 py-2.5 tabular-nums text-right">{FRT.billed}</td>
          </tr>
        </tbody>
      </table>
    </DocShell>
  );
}

/** The contracted rate card (Excel-style). */
export function RateCardDoc() {
  const rows = [
    ["Line haul · CHI→RIV", "USD 11,200 / load"],
    ["Fuel surcharge", "22% of line haul"],
    ["Demurrage", "after 2.0 h free time"],
    ["Reweigh adjustment", "not applicable · per-load lane"],
    ["Tolerance", "±2% per line"],
  ];
  return (
    <DocShell>
      <DocTitleBand
        number="RC-OCC-2026"
        status="Effective"
        docType="Contracted rate card · Excel"
        system="Sourcing · rate card"
        createdOn="2026-01-01"
        createdBy="Sourcing team"
      />
      <SectionBand>Lane CHI → RIV · OCC</SectionBand>
      <table className="w-full text-[12px] border-collapse">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="text-ink">
              <td className="px-3 py-2 border-b border-divider text-mute">{k}</td>
              <td className="px-3 py-2 border-b border-divider tabular-nums text-right">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DocShell>
  );
}

/** Yard gate log — proves free-time was not exceeded. */
export function GateLogDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number="GATE-RIV-0620"
        status="Logged"
        docType="Yard gate log · receiving"
        system="Riverside mill M042"
        createdOn="2026-06-20 · 07:31"
        createdBy="Gate system"
      />
      <SectionBand>Detention clock</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Gate in" value="07:31" mono />
        <Field label="Gate out" value="09:01" mono />
        <Field label="On site" value="1.5 h" mono />
        <Field label="Free time" value="2.0 h (contract)" mono />
        <Field label="Detention owed" value="0.0 h · none" mono />
        <Field label="Billed demurrage" value="900.00 · disputed" mono />
      </div>
    </DocShell>
  );
}

/** Weigh-bridge ticket — the scaled weight behind the cube-out variance. */
export function WeighTicketDoc() {
  return (
    <DocShell>
      <DocTitleBand
        number="WB-RIV-44812"
        status="Scaled"
        docType="Weigh-bridge ticket"
        system="Riverside mill M042"
        createdOn="2026-06-20 · 07:35"
        createdBy="Weigh-bridge"
      />
      <SectionBand>Weights</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Gross" value="34.4 t" mono />
        <Field label="Tare" value="14.4 t" mono />
        <Field label="Net (scaled)" value="20.0 t" mono />
        <Field label="Carrier claim" value="22.0 t" mono />
        <Field label="Variance" value="−2.0 t · cubed out" mono />
        <Field label="BOL" value="BOL-SUMC-44812" mono />
      </div>
    </DocShell>
  );
}
