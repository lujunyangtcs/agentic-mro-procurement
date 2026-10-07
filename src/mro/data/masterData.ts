/**
 * Master data for the demo (PRD §15), aligned with the use-case I/O samples in
 * `data/stories/io`. Site names are real places; every ID, supplier, price,
 * agreement and screening outcome is synthetic. Story suppliers, IDs, GL codes
 * and prices are taken verbatim from the I/O; the catalogue fixture is the only
 * record not in the I/O. Emails use `.example`; banks are masked.
 */

import type { Agreement, Material, Site, SiteId, Supplier } from "@/mro/domain/types";
import { pence } from "@/mro/domain/money";

export const SITES: Site[] = [
  { id: "UK-SOL-01", name: "Solihull", country: "GB", function: "Manufacturing engineering and paint shop", costCentre: "CC-2205-SOL" },
  { id: "UK-HAL-01", name: "Halewood", country: "GB", function: "Assembly, facilities and stores", costCentre: "CC-3310-HAL" },
  { id: "UK-WOL-01", name: "Wolverhampton", country: "GB", function: "Propulsion operations support", costCentre: "CC-5630-WOL" },
  { id: "UK-GAY-01", name: "Gaydon", country: "GB", function: "Vehicle engineering", costCentre: "CC-4471-GAY" },
  { id: "UK-CAB-01", name: "Castle Bromwich", country: "GB", function: "Press shop maintenance", costCentre: "CC-2870-CAB" },
];

export const siteById: Record<SiteId, Site> = Object.fromEntries(SITES.map((s) => [s.id, s])) as Record<SiteId, Site>;

export function siteByName(name: string): Site | undefined {
  return SITES.find((s) => s.name.toLowerCase() === name.toLowerCase());
}

/** Language never determines country; a country can hold several sites. */
export const sitesByCountry: Record<string, SiteId[]> = { GB: SITES.map((s) => s.id) };

export const MATERIALS: Material[] = [
  /* Flow 1 catalogue fixture — the only intake-enabled item until each story's phase lands. */
  {
    code: "MAT-PPE-3M-6055",
    description: "3M 6055 A2 gas/vapour filter",
    manufacturer: "3M",
    manufacturerPart: "6055",
    uom: "PAIR",
    pack: { uom: "PACK", unitsPerPack: 4 },
    group: "MRO",
    glCode: "640440",
    category: "ppe-consumables",
    aliases: ["3m 6055", "6055 a2", "6055 filter", "6055"],
    intake: true,
  },
  /* UC6 — Intake Agent: category 43232300, GL 640210, £1,200 per licence-year (PO-7781223). */
  { code: "SW-CADV-PRO-12M", description: "CAD viewer pro licence, 12 months", uom: "LICENCE_YEAR", group: "IT", glCode: "640210", category: "43232300" },
  /* UC9 — Sourcing Agent: spec SPEC-HP400-SVC, MRO equipment maintenance. */
  { code: "SVC-HP400-ANNUAL", description: "Hydraulic press HP-400 annual service", uom: "LOT", group: "SERVICES", glCode: "640460", category: "mro-equipment-maintenance" },
  /* UC4 — Supplier Match Agent: 6-week paint-shop throughput engagement. */
  { code: "SVC-CONS-PAINT-6W", description: "Process-improvement consultant, 6 weeks, paint shop throughput", uom: "DAY", group: "SERVICES", glCode: "640610", category: "consulting" },
  /* UC2 — Intake Agent: GL 640455, MRO sensors, equivalents list EQV-SENSORS-v7. */
  { code: "MAT-SNS-BRANDX-PX30", description: "Proximity sensor BrandX PX-30", manufacturer: "BrandX", manufacturerPart: "PX-30", uom: "EA", group: "MRO", glCode: "640455", category: "mro-sensors" },
  { code: "MAT-SNS-SENSCO-S188P", description: "Proximity sensor SensCo S18-8P", manufacturer: "SensCo", manufacturerPart: "S18-8P", uom: "EA", group: "MRO", glCode: "640455", category: "mro-sensors" },
  { code: "MAT-SNS-ORBIS-OP18", description: "Proximity sensor Orbis OP18-PNP", manufacturer: "Orbis", manufacturerPart: "OP18-PNP", uom: "EA", group: "MRO", glCode: "640455", category: "mro-sensors" },
];

export const materialByCode: Record<string, Material> = Object.fromEntries(MATERIALS.map((m) => [m.code, m]));

const active = { status: "active" as const, cleared: true, sanctionsOpen: false, bankVerified: true };

export const SUPPLIERS: Supplier[] = [
  /* Catalogue fixture supplier (not in the I/O). */
  { id: "SUP-10418", name: "Midlands Industrial Supply", ...active, email: "orders@midlands-industrial.example", bankMasked: "•••• 4471", panelScope: ["ppe-consumables"] },
  /* UC9 panel (RFQ-26-09931). */
  { id: "SUP-20411", name: "Midlands Hydraulics", ...active, email: "service@midlands-hydraulics.example", bankMasked: "•••• 2208", panelScope: ["mro-equipment-maintenance"] },
  { id: "SUP-20977", name: "PressCare UK", ...active, email: "quotes@presscare.example", bankMasked: "•••• 9134", panelScope: ["mro-equipment-maintenance"] },
  { id: "SUP-31002", name: "Fluid Power Services", ...active, email: "bids@fluidpower.example", bankMasked: "•••• 6620", panelScope: ["mro-equipment-maintenance"] },
  { id: "SUP-18840", name: "Apex Industrial", ...active, email: "sales@apex-industrial.example", bankMasked: "•••• 3057", panelScope: ["mro-equipment-maintenance"] },
  /* UC4 consulting panel (PANEL-CONS-2026Q3) and the named non-panel supplier. */
  { id: "SUP-40210", name: "Kestrel Operations", ...active, email: "engagements@kestrel-ops.example", bankMasked: "•••• 7712", panelScope: ["consulting"] },
  { id: "SUP-40388", name: "Meridian Lean Partners", ...active, email: "hello@meridian-lean.example", bankMasked: "•••• 1189", panelScope: ["consulting"] },
  { id: "SUP-PENDING-NOVAOPS", name: "NovaOps Consulting Ltd", status: "pending", cleared: false, sanctionsOpen: false, bankVerified: false, email: "onboarding@novaops.example", bankMasked: "not verified", panelScope: [] },
  /* UC2 sensor panel (RFQ-26-10107). */
  { id: "SUP-11204", name: "Industrial Distributor A", ...active, email: "trade@distributor-a.example", bankMasked: "•••• 5546", panelScope: ["mro-sensors"] },
  { id: "SUP-11980", name: "Sensor Direct", ...active, email: "orders@sensor-direct.example", bankMasked: "•••• 8803", panelScope: ["mro-sensors"] },
  { id: "SUP-12077", name: "Industrial Distributor B", ...active, email: "trade@distributor-b.example", bankMasked: "•••• 4420", panelScope: ["mro-sensors"] },
];

export const supplierById: Record<string, Supplier> = Object.fromEntries(SUPPLIERS.map((s) => [s.id, s]));

const ALL_SITES: SiteId[] = SITES.map((s) => s.id);

export const AGREEMENTS: Agreement[] = [
  {
    id: "CAT-26-00418",
    kind: "catalogue",
    supplierId: "SUP-10418",
    validFrom: "2026-01-01T00:00:00.000Z",
    validTo: "2026-12-31T23:59:59.000Z",
    /* £48 per four-pair pack, priced per pair. */
    lines: [{ material: "MAT-PPE-3M-6055", unitPrice: pence(12), sites: ALL_SITES }],
  },
];

/** Last-paid / starting-cost unit prices quoted in the I/O (`starting_cost_rule`: last paid unit price × qty). */
export const LAST_PAID: Record<string, { unitPrice: number; ref: string }> = {
  "SW-CADV-PRO-12M": { unitPrice: 1200, ref: "PO-7781223" },
  "MAT-SNS-BRANDX-PX30": { unitPrice: 96, ref: "REQ-118702" },
};
