/**
 * PRD §13 story fixtures — the facts each story's agents read. Amounts are
 * pence. Flows write records from these; artifacts render them next to the
 * records, so a figure on screen is always one of these or a record total.
 */

import { pence } from "@/mro/domain/money";

/* ── ST01 · Licence reuse ───────────────────────────────────────────────── */

export const ST01 = {
  sku: "SW-EVIEW-STD-ANNUAL",
  app: "Engineering Viewer Enterprise",
  unitPrice: pence(120),
  requested: 20,
  snapshot: { id: "SAM-2026-1007", takenAt: "2026-10-07T05:00:00.000Z", freshnessHours: 24 },
  pool: { id: "POOL-EVIEW-ENG", owner: "Application Owner · Engineering systems", approval: "AO-APPROVAL-0441", tier: "Enterprise", owned: 60, assigned: 54 },
  inactiveSeats: [
    { seat: "EV-ENT-0412", lastUse: "2026-05-02", user: "Moved to Wolverhampton" },
    { seat: "EV-ENT-0419", lastUse: "2026-04-18", user: "Left the company" },
    { seat: "EV-ENT-0433", lastUse: "2026-06-09", user: "Role changed" },
    { seat: "EV-ENT-0447", lastUse: "2026-03-27", user: "Left the company" },
    { seat: "EV-ENT-0458", lastUse: "2026-06-30", user: "Project closed" },
    { seat: "EV-ENT-0461", lastUse: "2026-05-21", user: "Role changed" },
  ],
  renewal: "2026-12-06",
  adminCost: pence(20),
  usersPrefix: "ENG-BIW",
} as const;

export const st01Reuse = ST01.inactiveSeats.length;
export const st01Buy = ST01.requested - st01Reuse;
export const st01BuyValue = ST01.unitPrice * st01Buy;
export const st01Avoided = ST01.unitPrice * st01Reuse - ST01.adminCost;

/* ── ST02 · Quote negotiation ───────────────────────────────────────────── */

export const ST02 = {
  rfq: "RFQ-AP-2002",
  baseline: pence(50_000),
  benchmark: { low: pence(45_000), high: pence(48_000) },
  target: pence(46_000),
  fallback: pence(48_000),
  walkAway: pence(49_200),
  quotes: [
    { supplierId: "SUP-AP-002", total: pence(50_000), comparable: true, note: "Preferred · includes inspection" },
    { supplierId: "SUP-AP-004", total: pence(49_200), comparable: true, note: "Includes inspection" },
    { supplierId: "SUP-AP-006", total: pence(51_500), comparable: true, note: "Includes inspection" },
    { supplierId: "SUP-AP-007", total: pence(43_000), comparable: false, note: "Excludes required inspection" },
  ],
  lines: [
    { key: "core", label: { en: "Core maintenance work", de: "Kernwartung" }, quoted: pence(44_000), bafo: pence(44_000), bench: "£42.5K–£44.5K", flag: false },
    { key: "overtime", label: { en: "Overtime allowance", de: "Überstundenpauschale" }, quoted: pence(3_000), bafo: pence(1_000), bench: "£0.8K–£1.2K", flag: true },
    { key: "mobilisation", label: { en: "Mobilisation fee", de: "Mobilisierungsgebühr" }, quoted: pence(2_000), bafo: 0, bench: "£0–£0.5K", flag: true },
    { key: "inspection", label: { en: "Statutory inspection", de: "Gesetzliche Prüfung" }, quoted: pence(1_000), bafo: pence(1_000), bench: "£0.9K–£1.1K", flag: false },
  ],
  contract: "CTR-AP-4004",
} as const;

export const st02Bafo = ST02.lines.reduce((t, l) => t + l.bafo, 0);
export const st02Saving = ST02.baseline - st02Bafo;
export const ST02_LEAKAGE = pence(1_000);

/* ── ST03 · Preferred supplier ──────────────────────────────────────────── */

export const ST03 = {
  panelMatch: "PM-3003",
  requested: { supplierId: "SUP-AP-PENDING-01", price: pence(38_400) },
  incumbent: { supplierId: "SUP-AP-003", price: pence(36_000), agreement: "AGR-CAL-2026-01" },
  window: "19–23 Oct shutdown",
  rows: [
    { key: "status", label: { en: "Supplier status", de: "Lieferantenstatus" }, incumbent: "Active · risk-cleared", requested: "Not onboarded", ok: [true, false] },
    { key: "capability", label: { en: "ISO 17025 scope", de: "ISO-17025-Umfang" }, incumbent: "Robot cells · certificate CAL-1192", requested: "Claimed · not verified", ok: [true, false] },
    { key: "capacity", label: { en: "Shutdown capacity", de: "Kapazität im Stillstand" }, incumbent: "2 engineers · 19–23 Oct", requested: "Available 19–23 Oct", ok: [true, true] },
    { key: "location", label: { en: "Distance to site", de: "Entfernung zum Standort" }, incumbent: "12 miles", requested: "41 miles", ok: [true, true] },
    { key: "performance", label: { en: "12-month performance", de: "Leistung 12 Monate" }, incumbent: "OTIF 98% · 0 NCRs", requested: "No history", ok: [true, false] },
    { key: "insurance", label: { en: "Insurance", de: "Versicherung" }, incumbent: "£5M PL valid to Mar 2027", requested: "Certificate requested", ok: [true, false] },
  ],
  onboardingEffort: pence(600),
} as const;

export const st03Saving = ST03.requested.price - ST03.incumbent.price;

/* ── ST04 · Contract clauses ────────────────────────────────────────────── */

export type ClauseBand = "green" | "amber" | "red";

export const ST04 = {
  contract: "CTR-AP-4004",
  template: "TPL-SVC-STD v3",
  library: "CL-LIB-2026.2",
  clauses: [
    {
      id: "CL-PAY",
      label: { en: "Payment terms", de: "Zahlungsbedingungen" },
      band: "green" as ClauseBand,
      proposal: "Net 30 days",
      library: "Net 30 days",
      fallback: "Net 45 days",
      owner: "policy" as const,
      proposalText: "Supplier invoices are payable 30 days from receipt of a valid invoice.",
      approvedText: "Supplier invoices are payable 30 days from receipt of a valid invoice.",
    },
    {
      id: "CL-INS",
      label: { en: "Insurance", de: "Versicherung" },
      band: "green" as ClauseBand,
      proposal: "£5M public liability",
      library: "£5M public liability",
      fallback: "£2M public liability",
      owner: "policy" as const,
      proposalText: "Supplier maintains public liability insurance of not less than £5,000,000.",
      approvedText: "Supplier maintains public liability insurance of not less than £5,000,000.",
    },
    {
      id: "CL-WAR",
      label: { en: "Warranty", de: "Gewährleistung" },
      band: "amber" as ClauseBand,
      proposal: "6 months",
      library: "12 months",
      fallback: "6–12 months delegated",
      owner: "delegated-approver" as const,
      proposalText: "Supplier warrants the services for six (6) months from completion.",
      approvedText: "Supplier warrants the services for twelve (12) months from completion.",
    },
    {
      id: "CL-LIA",
      label: { en: "Liability", de: "Haftung" },
      band: "red" as ClauseBand,
      proposal: "Uncapped client liability",
      library: "Mutual cap · 1× contract value",
      fallback: "None · Legal only",
      owner: "legal" as const,
      proposalText: "The Client's liability under this Agreement shall be unlimited.",
      approvedText: "Each party's total liability is capped at the contract value, £46,000.",
    },
  ],
} as const;

/* ── ST05 · Technical equivalent ────────────────────────────────────────── */

export type AttrState = "verified" | "missing" | "mismatch";

export const ST05 = {
  equivalence: "EQ-AP-5005",
  rfq: "RFQ-AP-2005",
  qty: 200,
  named: { part: "SKF 6205", unit: pence(24) },
  candidate: { part: "FAG 6205-C", unit: pence(22) },
  application: "Stores conveyor CV-HAL-07 · non-safety-critical",
  attributes: [
    { key: "bore", label: { en: "Bore", de: "Bohrung" }, named: "25 mm", fag: "25 mm", generic: "25 mm", fagState: "verified" as AttrState, genState: "verified" as AttrState },
    { key: "od", label: { en: "Outside diameter", de: "Außendurchmesser" }, named: "52 mm", fag: "52 mm", generic: "52 mm", fagState: "verified" as AttrState, genState: "verified" as AttrState },
    { key: "width", label: { en: "Width", de: "Breite" }, named: "15 mm", fag: "15 mm", generic: "15 mm", fagState: "verified" as AttrState, genState: "verified" as AttrState },
    { key: "seal", label: { en: "Variant · sealing", de: "Variante · Abdichtung" }, named: "Open", fag: "Open", generic: "Open", fagState: "verified" as AttrState, genState: "verified" as AttrState },
    { key: "clearance", label: { en: "Internal clearance", de: "Lagerluft" }, named: "Normal (CN)", fag: "Normal (CN)", generic: "Not stated", fagState: "verified" as AttrState, genState: "missing" as AttrState },
    { key: "load", label: { en: "Dynamic load rating", de: "Dynamische Tragzahl" }, named: "14.8 kN", fag: "15.0 kN", generic: "12.1 kN", fagState: "verified" as AttrState, genState: "mismatch" as AttrState },
    { key: "speed", label: { en: "Limiting speed", de: "Grenzdrehzahl" }, named: "18,000 r/min", fag: "18,000 r/min", generic: "Not stated", fagState: "verified" as AttrState, genState: "missing" as AttrState },
    { key: "lube", label: { en: "Lubrication", de: "Schmierung" }, named: "Grease, site-applied", fag: "Grease, site-applied", generic: "Grease, site-applied", fagState: "verified" as AttrState, genState: "verified" as AttrState },
    { key: "quality", label: { en: "Quality history", de: "Qualitätshistorie" }, named: "0 PPM · 24 months", fag: "0 PPM · 18 months", generic: "No traceability", fagState: "verified" as AttrState, genState: "mismatch" as AttrState },
    { key: "warranty", label: { en: "Warranty", de: "Gewährleistung" }, named: "12 months", fag: "12 months", generic: "3 months", fagState: "verified" as AttrState, genState: "mismatch" as AttrState },
    { key: "application", label: { en: "Permitted application", de: "Zulässige Anwendung" }, named: "Approved", fag: "Awaiting Technical Owner", generic: "Not approved", fagState: "missing" as AttrState, genState: "mismatch" as AttrState },
  ],
  bids: [
    { supplierId: "SUP-AP-001", part: "FAG 6205-C", unit: pence(22), total: pence(4_400) },
    { supplierId: "SUP-AP-008", part: "SKF 6205", unit: pence(23), total: pence(4_600) },
    { supplierId: "SUP-AP-009", part: "FAG 6205-C", unit: pence(23.5), total: pence(4_700) },
  ],
} as const;

export const st05Baseline = ST05.named.unit * ST05.qty;
export const st05Award = ST05.candidate.unit * ST05.qty;
export const st05Saving = st05Baseline - st05Award;
