/**
 * Master data (PRD §15, §25). Site names and manufacturer designations are
 * real; every internal ID, supplier, price, agreement and screening outcome
 * is demo data. Emails use `.example`; bank details are masked.
 */

import type { Agreement, Material, Site, SiteId, Supplier } from "@/mro/domain/types";
import { pence } from "@/mro/domain/money";

export const SITES: Site[] = [
  { id: "UK-SOL-01", name: "Solihull", country: "GB", function: "Vehicle operations and maintenance", costCentre: "CC-SOL-MAINT" },
  { id: "UK-HAL-01", name: "Halewood", country: "GB", function: "Assembly support and stores", costCentre: "CC-HAL-MAINT" },
  { id: "UK-WOL-01", name: "Wolverhampton", country: "GB", function: "Propulsion operations support", costCentre: "CC-WOL-ENG" },
  { id: "UK-GAY-01", name: "Gaydon", country: "GB", function: "Engineering and shared functions", costCentre: "CC-GAY-IT" },
];

export const siteById: Record<SiteId, Site> = Object.fromEntries(SITES.map((s) => [s.id, s])) as Record<SiteId, Site>;

export function siteByName(name: string): Site | undefined {
  return SITES.find((s) => s.name.toLowerCase() === name.toLowerCase());
}

/** Language never determines country; the UK holds four distinct sites. */
export const sitesByCountry: Record<string, SiteId[]> = { GB: SITES.map((s) => s.id) };

export const MATERIALS: Material[] = [
  {
    code: "MAT-PPE-3M-6055",
    description: "3M 6055 A2 gas/vapour filter",
    manufacturer: "3M",
    manufacturerPart: "6055",
    uom: "PAIR",
    pack: { uom: "PACK", unitsPerPack: 4 },
    group: "MRO",
    glCode: "GL-MRO",
    category: "ppe-consumables",
    aliases: ["3m 6055", "6055 a2", "6055 filter", "6055"],
    intake: true,
  },
  {
    code: "MAT-PPE-NITRILE-L",
    description: "Nitrile gloves, size L, box of 100",
    uom: "PACK",
    group: "MRO",
    glCode: "GL-MRO",
    category: "ppe-consumables",
    aliases: ["nitrile", "gloves"],
    intake: true,
  },
  {
    code: "MAT-LUB-EP2-400",
    description: "EP2 lithium grease cartridge, 400 g",
    uom: "EA",
    group: "MRO",
    glCode: "GL-MRO",
    category: "mro-consumables",
    aliases: ["ep2", "grease"],
    intake: true,
  },
  {
    code: "MAT-FAC-LED-600",
    description: "LED panel 600 × 600, 4000 K",
    uom: "EA",
    group: "FACILITIES",
    glCode: "GL-FACILITIES",
    category: "facilities-consumables",
    aliases: ["led panel", "led panels", "led"],
    intake: true,
  },
  {
    code: "MAT-BRG-SKF-6205",
    description: "SKF 6205 open deep-groove bearing",
    manufacturer: "SKF",
    manufacturerPart: "6205",
    uom: "EA",
    group: "MRO",
    glCode: "GL-MRO",
    category: "bearings",
    aliases: ["skf 6205", "6205"],
    intake: true,
  },
  {
    code: "MAT-BRG-FAG-6205C",
    description: "FAG 6205-C deep-groove bearing",
    manufacturer: "FAG",
    manufacturerPart: "6205-C",
    uom: "EA",
    group: "MRO",
    glCode: "GL-MRO",
    category: "bearings",
  },
  { code: "SW-EVIEW-STD-ANNUAL", description: "Engineering Viewer Enterprise seat, 12 months", uom: "SEAT_YEAR", group: "IT", glCode: "GL-SOFTWARE", category: "software-licences" },
  { code: "SVC-PM-SOL-01", description: "Planned maintenance with inspection, Solihull", uom: "LOT", group: "SERVICES", glCode: "GL-ENG-SVC", category: "maintenance-services" },
  { code: "SVC-CAL-WOL-02", description: "Calibration of two robotic cells, Wolverhampton", uom: "LOT", group: "SERVICES", glCode: "GL-ENG-SVC", category: "calibration-services" },
];

export const materialByCode: Record<string, Material> = Object.fromEntries(MATERIALS.map((m) => [m.code, m]));

const active = { status: "active" as const, cleared: true, sanctionsOpen: false, bankVerified: true };

export const SUPPLIERS: Supplier[] = [
  { id: "SUP-AP-001", name: "Midlands Industrial Supply", ...active, email: "orders@midlands-industrial.example", bankMasked: "•••• 4471", panelScope: ["ppe-consumables", "mro-consumables", "facilities-consumables", "bearings"] },
  { id: "SUP-AP-002", name: "Precision Maintenance Partners", ...active, email: "bids@precision-maintenance.example", bankMasked: "•••• 2208", panelScope: ["maintenance-services"] },
  { id: "SUP-AP-003", name: "West Midlands Calibration", ...active, email: "service@wm-calibration.example", bankMasked: "•••• 9134", panelScope: ["calibration-services"] },
  { id: "SUP-AP-004", name: "Northern Engineering Services", ...active, email: "quotes@northern-eng.example", bankMasked: "•••• 6620", panelScope: ["maintenance-services"] },
  { id: "SUP-AP-005", name: "Engineering Software Services", ...active, email: "licensing@eng-software.example", bankMasked: "•••• 3057", panelScope: ["software-licences"] },
  { id: "SUP-AP-006", name: "Ardenfield Maintenance Group", ...active, email: "tenders@ardenfield.example", bankMasked: "•••• 7712", panelScope: ["maintenance-services"] },
  { id: "SUP-AP-007", name: "Haldenbrook Plant Services", ...active, email: "sales@haldenbrook.example", bankMasked: "•••• 1189", panelScope: ["maintenance-services"] },
  { id: "SUP-AP-008", name: "Trentbrook Bearing Distribution", ...active, email: "trade@trentbrook.example", bankMasked: "•••• 5546", panelScope: ["bearings"] },
  { id: "SUP-AP-009", name: "Corvale Power Transmission", ...active, email: "orders@corvale.example", bankMasked: "•••• 8803", panelScope: ["bearings"] },
  { id: "SUP-AP-PENDING-01", name: "Lymewell Calibration", status: "pending", cleared: false, sanctionsOpen: false, bankVerified: false, email: "onboarding@lymewell.example", bankMasked: "not verified", panelScope: [] },
];

export const supplierById: Record<string, Supplier> = Object.fromEntries(SUPPLIERS.map((s) => [s.id, s]));

const ALL_SITES: SiteId[] = SITES.map((s) => s.id);

export const CATALOGUE_ID = "CAT-AP-2026-01";

export const AGREEMENTS: Agreement[] = [
  {
    id: CATALOGUE_ID,
    kind: "catalogue",
    supplierId: "SUP-AP-001",
    validFrom: "2026-01-01T00:00:00.000Z",
    validTo: "2026-12-31T23:59:59.000Z",
    lines: [
      /* £48 per four-pair pack, priced per pair. */
      { material: "MAT-PPE-3M-6055", unitPrice: pence(12), sites: ALL_SITES },
      { material: "MAT-PPE-NITRILE-L", unitPrice: pence(9.6), sites: ALL_SITES },
      { material: "MAT-LUB-EP2-400", unitPrice: pence(6.2), sites: ALL_SITES },
      { material: "MAT-FAC-LED-600", unitPrice: pence(38), sites: ALL_SITES },
      { material: "MAT-BRG-SKF-6205", unitPrice: pence(24), sites: ALL_SITES },
    ],
  },
  {
    id: "AGR-CAL-2026-01",
    kind: "rate-card",
    supplierId: "SUP-AP-003",
    validFrom: "2026-01-01T00:00:00.000Z",
    validTo: "2027-03-31T23:59:59.000Z",
    lines: [{ material: "SVC-CAL-WOL-02", unitPrice: pence(36_000), sites: ["UK-WOL-01"] }],
  },
  {
    id: "AGR-SW-2026-01",
    kind: "contract",
    supplierId: "SUP-AP-005",
    validFrom: "2026-01-01T00:00:00.000Z",
    validTo: "2026-12-31T23:59:59.000Z",
    lines: [{ material: "SW-EVIEW-STD-ANNUAL", unitPrice: pence(120), sites: ALL_SITES }],
  },
];

export const agreementById: Record<string, Agreement> = Object.fromEntries(AGREEMENTS.map((a) => [a.id, a]));
