/**
 * Master data for the demo (PRD §15). Site names and manufacturer models are
 * real; every ID, supplier, price, agreement and screening outcome is demo
 * data. Supplier names are fictional; emails use `.example`; banks are masked.
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

/** Language never determines country; a country can hold several sites. */
export const sitesByCountry: Record<string, SiteId[]> = { GB: SITES.map((s) => s.id) };

export const GL_CODES = ["GL-MRO", "GL-ENG-SVC", "GL-SOFTWARE", "GL-FACILITIES"] as const;

export const MATERIALS: Material[] = [
  { code: "MAT-BRG-SKF-6205", description: "SKF 6205 open deep groove ball bearing", manufacturer: "SKF", manufacturerPart: "6205", uom: "EA", group: "MRO", glCode: "GL-MRO", category: "bearings" },
  { code: "MAT-BRG-FAG-6205C", description: "FAG 6205-C deep groove ball bearing (candidate)", manufacturer: "Schaeffler FAG", manufacturerPart: "6205-C", uom: "EA", group: "MRO", glCode: "GL-MRO", category: "bearings" },
  { code: "SW-EVIEW-STD-ANNUAL", description: "Engineering Viewer Enterprise, annual seat (fictional)", uom: "SEAT_YEAR", group: "IT", glCode: "GL-SOFTWARE", category: "software-licences" },
  { code: "SVC-PM-SOL-01", description: "Planned maintenance with inspection, Solihull", uom: "LOT", group: "SERVICES", glCode: "GL-ENG-SVC", category: "maintenance-services" },
  { code: "SVC-CAL-WOL-02", description: "Calibration of two robotic cells, Wolverhampton", uom: "LOT", group: "SERVICES", glCode: "GL-ENG-SVC", category: "calibration-services" },
  { code: "MAT-PPE-3M-6055", description: "3M 6055 A2 gas/vapour filter", manufacturer: "3M", manufacturerPart: "6055", uom: "PAIR", pack: { uom: "PACK", unitsPerPack: 4 }, group: "MRO", glCode: "GL-MRO", category: "ppe-consumables" },
];

export const materialByCode: Record<string, Material> = Object.fromEntries(MATERIALS.map((m) => [m.code, m]));

const active = { status: "active" as const, cleared: true, sanctionsOpen: false, bankVerified: true };

export const SUPPLIERS: Supplier[] = [
  { id: "SUP-AP-001", name: "Midlands Industrial Supply", ...active, email: "orders@midlands-industrial.example", bankMasked: "•••• 4471", panelScope: ["ppe-consumables", "bearings"] },
  { id: "SUP-AP-002", name: "Precision Maintenance Partners", ...active, email: "bids@precision-maintenance.example", bankMasked: "•••• 2208", panelScope: ["maintenance-services"] },
  { id: "SUP-AP-003", name: "West Midlands Calibration", ...active, email: "service@wm-calibration.example", bankMasked: "•••• 9134", panelScope: ["calibration-services"] },
  { id: "SUP-AP-004", name: "Northern Engineering Services", ...active, email: "tenders@northern-eng.example", bankMasked: "•••• 6620", panelScope: ["maintenance-services"] },
  { id: "SUP-AP-005", name: "Engineering Software Services", ...active, email: "licensing@eng-software.example", bankMasked: "•••• 3057", panelScope: ["software-licences"] },
  { id: "SUP-AP-006", name: "Ardenfield Maintenance Group", ...active, email: "quotes@ardenfield.example", bankMasked: "•••• 7712", panelScope: ["maintenance-services"] },
  { id: "SUP-AP-007", name: "Haldenbrook Plant Services", ...active, email: "sales@haldenbrook.example", bankMasked: "•••• 1189", panelScope: ["maintenance-services"] },
  { id: "SUP-AP-008", name: "Trentbrook Bearing Distribution", ...active, email: "trade@trentbrook.example", bankMasked: "•••• 5546", panelScope: ["bearings"] },
  { id: "SUP-AP-009", name: "Corvale Power Transmission", ...active, email: "sales@corvale.example", bankMasked: "•••• 8803", panelScope: ["bearings"] },
  { id: "SUP-AP-PENDING-01", name: "Lymewell Calibration", status: "pending", cleared: false, sanctionsOpen: false, bankVerified: false, email: "hello@lymewell.example", bankMasked: "not provided", panelScope: ["calibration-services"] },
];

export const AGREEMENTS: Agreement[] = [
  {
    id: "CAT-AP-2026-01",
    kind: "catalogue",
    supplierId: "SUP-AP-001",
    validFrom: "2026-01-01T00:00:00.000Z",
    validTo: "2026-12-31T23:59:59.000Z",
    lines: [
      /* £48 per four-pair pack, priced per pair. */
      { material: "MAT-PPE-3M-6055", unitPrice: pence(12), sites: ["UK-SOL-01", "UK-HAL-01", "UK-WOL-01", "UK-GAY-01"] },
      { material: "MAT-BRG-SKF-6205", unitPrice: pence(24), sites: ["UK-SOL-01", "UK-HAL-01", "UK-WOL-01", "UK-GAY-01"] },
    ],
  },
  {
    id: "AGR-CAL-2026-01",
    kind: "rate-card",
    supplierId: "SUP-AP-003",
    validFrom: "2026-01-01T00:00:00.000Z",
    validTo: "2027-03-31T23:59:59.000Z",
    lines: [{ material: "SVC-CAL-WOL-02", unitPrice: pence(36000), sites: ["UK-WOL-01"] }],
  },
];
