/**
 * Request drafts and today's arrivals. Each arrival is the message as it
 * came in plus what intake extracts from it; submitting one creates a real
 * case through `request.submit` and starts its flow on the same engine a
 * free-typed request uses.
 */

import type { RequestDraft } from "@/mro/domain/commands";
import type { ConfidenceSignal, FlowKey, IsoTime, SiteId, StoryId } from "@/mro/domain/types";
import { pence } from "@/mro/domain/money";

export const INTAKE_MODEL = "intake-v3.1";
export const CATALOGUE_FIXTURE_ID = "FX-CAT-3M6055";
export const BUDGET_HOLDER_PACKS = 80;

type Bi = { en: string; de: string };

/** W-DEMO-1: completeness, classification, match, price, supplier, history. */
export function signals(scores: [number, number, number, number, number, number], evidence: string[]): ConfidenceSignal[] {
  const keys = ["completeness", "classification", "match_strength", "price_benchmark", "supplier_status", "pattern_history"];
  const weights = [0.2, 0.15, 0.25, 0.15, 0.15, 0.1];
  return keys.map((key, i) => ({ key, score: scores[i], weight: weights[i], evidence: evidence[i] ?? "" }));
}

export const catalogueSignals = () =>
  signals([1, 0.98, 0.96, 0.95, 1, 0.92], ["All mandatory fields present", "Catalogue item, GL-MRO", "Exact catalogue line", "Catalogue price", "SUP-AP-001 active", "Bought monthly"]);

export function catalogueFixture(packs = 10, site: SiteId = "UK-HAL-01"): RequestDraft {
  return {
    fixtureId: CATALOGUE_FIXTURE_ID,
    requester: "Halewood stores controller",
    channel: "email",
    originalText: `Need ${packs} packs of 3M 6055 A2 filters for Halewood stores by 12 Oct.`,
    site,
    costCentre: "CC-HAL-MAINT",
    glCode: "GL-MRO",
    purpose: "Stores replenishment · respiratory filter cartridges",
    urgency: "normal",
    agreementId: "CAT-AP-2026-01",
    supplierId: "SUP-AP-001",
    lines: [{ material: "MAT-PPE-3M-6055", quantity: packs, uom: "PACK", neededBy: "2026-10-12T16:00:00.000Z" }],
    pattern: "catalogue-call-off",
    signals: catalogueSignals(),
    model: INTAKE_MODEL,
    budgetRef: "BUD-HAL-MAINT-FY27",
    title: "3M 6055 A2 filters · Halewood",
  };
}

/* ── Story drafts (PRD §13) ─────────────────────────────────────────────── */

export const STORY_DRAFTS: Record<Exclude<StoryId, "ST04">, () => RequestDraft> = {
  ST01: () => ({
    storyId: "ST01",
    preferredCaseId: "CASE-ST01-001",
    preferredPrId: "PR-AP-1001",
    requester: "Priya Natarajan · Engineering Manager",
    channel: "portal",
    captureId: "CAP-PRT-0701",
    originalText: "20 more Engineering Viewer Enterprise seats for the new body-in-white team, same annual period.",
    site: "UK-GAY-01",
    costCentre: "CC-GAY-IT",
    glCode: "GL-SOFTWARE",
    purpose: "Body-in-white team onboarding · same annual period",
    urgency: "normal",
    agreementId: "AGR-SW-2026-01",
    supplierId: "SUP-AP-005",
    lines: [{ material: "SW-EVIEW-STD-ANNUAL", quantity: 20, uom: "SEAT_YEAR", neededBy: "2026-10-20T16:00:00.000Z" }],
    pattern: "licence-request",
    signals: signals([1, 0.97, 0.95, 0.96, 1, 0.9], ["All fields present", "SW-EVIEW-STD-ANNUAL", "AGR-SW-2026-01", "£120 contracted", "SUP-AP-005 active", "Renewal history"]),
    model: INTAKE_MODEL,
    title: "Engineering Viewer seats · Gaydon",
  }),
  ST02: () => ({
    storyId: "ST02",
    preferredCaseId: "CASE-ST02-001",
    preferredPrId: "PR-AP-1002",
    requester: "Tom Whitfield · Maintenance Manager",
    channel: "email",
    captureId: "CAP-EML-0702",
    originalText: "Quote Q-PMP-0926 attached: planned maintenance with inspection, £50,000. Please raise the order.",
    site: "UK-SOL-01",
    costCentre: "CC-SOL-MAINT",
    glCode: "GL-ENG-SVC",
    purpose: "Planned maintenance with statutory inspection · Q4 window",
    urgency: "normal",
    supplierPreference: "Precision Maintenance Partners",
    supplierId: "SUP-AP-002",
    lines: [{ material: "SVC-PM-SOL-01", quantity: 1, uom: "LOT", neededBy: "2026-11-02T17:00:00.000Z", unitPrice: pence(50_000) }],
    pattern: "service-quote",
    signals: signals([1, 0.95, 0.9, 0.88, 1, 0.9], ["Scope, dates, inclusions present", "SVC-PM-SOL-01", "No agreement · RFQ route", "Above benchmark", "SUP-AP-002 active", "Annual service"]),
    model: INTAKE_MODEL,
    title: "Planned maintenance · Solihull",
  }),
  ST03: () => ({
    storyId: "ST03",
    preferredCaseId: "CASE-ST03-001",
    preferredPrId: "PR-AP-1003",
    requester: "Hannah Okafor · Operations Engineer",
    channel: "portal",
    captureId: "CAP-PRT-0703",
    originalText: "Please set up Lymewell Calibration as a new supplier to calibrate our two robotic cells in the shutdown. Their quote is £38,400.",
    site: "UK-WOL-01",
    costCentre: "CC-WOL-ENG",
    glCode: "GL-ENG-SVC",
    purpose: "Robotic cell calibration · 19–23 Oct shutdown",
    urgency: "normal",
    supplierPreference: "Lymewell Calibration",
    supplierId: "SUP-AP-PENDING-01",
    lines: [{ material: "SVC-CAL-WOL-02", quantity: 1, uom: "LOT", neededBy: "2026-10-23T16:00:00.000Z", unitPrice: pence(38_400) }],
    pattern: "new-supplier-request",
    signals: signals([1, 0.96, 0.9, 0.9, 0.4, 0.85], ["Scope and window present", "SVC-CAL-WOL-02", "Panel match possible", "Quote vs rate card", "Named supplier not onboarded", "Annual calibration"]),
    model: INTAKE_MODEL,
    title: "Robot cell calibration · Wolverhampton",
  }),
  ST05: () => ({
    storyId: "ST05",
    preferredCaseId: "CASE-ST05-001",
    preferredPrId: "PR-AP-1005",
    requester: "Gareth Lloyd · Maintenance Planner",
    channel: "work-order",
    captureId: "CAP-WO-0705",
    originalText: "WO-HAL-58812: 200 × SKF 6205 for stores conveyor CV-HAL-07 rebuild. SKF only please.",
    site: "UK-HAL-01",
    costCentre: "CC-HAL-MAINT",
    glCode: "GL-MRO",
    purpose: "Conveyor CV-HAL-07 bearing rebuild · non-safety-critical",
    urgency: "normal",
    agreementId: "CAT-AP-2026-01",
    supplierId: "SUP-AP-001",
    lines: [{ material: "MAT-BRG-SKF-6205", quantity: 200, uom: "EA", neededBy: "2026-10-28T16:00:00.000Z" }],
    pattern: "named-specification",
    signals: signals([1, 0.98, 0.94, 0.9, 1, 0.9], ["Part and quantity present", "MAT-BRG-SKF-6205", "Catalogue line", "£24 catalogue", "SUP-AP-001 active", "Quarterly rebuilds"]),
    model: INTAKE_MODEL,
    title: "SKF 6205 bearings · Halewood",
  }),
};

/* ── Today's arrivals ───────────────────────────────────────────────────── */

export type ArrivalField = { key: string; label: Bi; value: string; state: "found" | "missing" | "assumed"; evidence?: string };

export type Arrival = {
  id: string;
  flow: FlowKey;
  storyId?: StoryId;
  group: "email" | "work-order" | "portal";
  title: Bi;
  from: string;
  fromMeta: string;
  site: SiteId;
  receivedAt: IsoTime;
  subject: string;
  /** Original text, physical lines preserved. */
  body: string[];
  /** Phrases the intake agent highlights as evidence, in reading order. */
  evidence: string[];
  fields: ArrivalField[];
  /** Notes the AI intake shows while reading (≤3). */
  reading: Bi[];
  /** Submits to an existing case instead (ST04 runs on the ST02 case). */
  linkedCase?: string;
  draft?: () => RequestDraft;
};

const F = (key: string, en: string, de: string, value: string, state: ArrivalField["state"] = "found", evidence?: string): ArrivalField => ({ key, label: { en, de }, value, state, evidence });

export const ARRIVALS: Arrival[] = [
  {
    id: "CAP-EML-0702",
    flow: "ST02",
    storyId: "ST02",
    group: "email",
    title: { en: "Planned maintenance quote · £50,000", de: "Wartungsangebot · £50.000" },
    from: "Tom Whitfield",
    fromMeta: "Maintenance Manager · Solihull",
    site: "UK-SOL-01",
    receivedAt: "2026-10-07T07:12:00.000Z",
    subject: "FW: Quote Q-PMP-0926 · planned maintenance",
    body: [
      "Hi Procurement,",
      "Precision Maintenance Partners sent quote Q-PMP-0926 for the",
      "planned maintenance with statutory inspection at Solihull.",
      "Total £50,000 incl. overtime and mobilisation.",
      "Work window is the Q4 shutdown, complete by 2 Nov.",
      "Please raise the order. Thanks, Tom",
    ],
    evidence: ["planned maintenance with statutory inspection", "Solihull", "£50,000", "2 Nov", "Precision Maintenance Partners"],
    fields: [
      F("item", "What to buy", "Was", "Planned maintenance with inspection", "found", "planned maintenance with statutory inspection"),
      F("qty", "How many", "Menge", "1 LOT"),
      F("site", "Site", "Standort", "Solihull · CC-SOL-MAINT", "found", "Solihull"),
      F("date", "Needed by", "Bis", "02 Nov 2026", "found", "2 Nov"),
      F("supplier", "Supplier", "Lieferant", "Precision Maintenance Partners · quote only", "found", "Precision Maintenance Partners"),
      F("cost", "Starting cost", "Ausgangskosten", "£50,000.00 · quote Q-PMP-0926", "found", "£50,000"),
    ],
    reading: [
      { en: "Quote, not an order · no agreement covers it", de: "Angebot, keine Bestellung · kein Vertrag deckt es" },
      { en: "£50,000 sits in the £30K–£100K band", de: "£50.000 liegt im Band £30K–£100K" },
      { en: "Competition needed before award", de: "Wettbewerb vor Zuschlag nötig" },
    ],
    draft: STORY_DRAFTS.ST02,
  },
  {
    id: "CAP-EML-0704",
    flow: "ST04",
    storyId: "ST04",
    group: "email",
    title: { en: "Contract redlines · CTR-AP-4004", de: "Vertragsänderungen · CTR-AP-4004" },
    from: "Precision Maintenance Partners",
    fromMeta: "Supplier contracts desk",
    site: "UK-SOL-01",
    receivedAt: "2026-10-07T07:40:00.000Z",
    subject: "RE: CTR-AP-4004 draft · our redlines",
    body: [
      "Please find our redlines on CTR-AP-4004 attached.",
      "Payment: Net 30 accepted.",
      "Warranty: we propose 6 months from completion.",
      "Liability: client liability to be unlimited.",
      "Insurance: £5M public liability confirmed.",
    ],
    evidence: ["CTR-AP-4004", "Net 30", "6 months", "unlimited", "£5M public liability"],
    fields: [
      F("item", "Contract", "Vertrag", "CTR-AP-4004 · services £46,000"),
      F("supplier", "Supplier", "Lieferant", "Precision Maintenance Partners"),
      F("clauses", "Redlines", "Änderungen", "4 clauses · 1 Amber · 1 Red", "found", "unlimited"),
      F("site", "Site", "Standort", "Solihull"),
    ],
    reading: [
      { en: "Linked to the ST02 award on CASE-ST02-001", de: "Verknüpft mit Zuschlag ST02 auf CASE-ST02-001" },
      { en: "Unlimited liability · Legal only", de: "Unbegrenzte Haftung · nur Legal" },
      { en: "PO stays held until the contract is stored", de: "Bestellung gesperrt bis Vertrag abgelegt" },
    ],
    linkedCase: "CASE-ST02-001",
  },
  {
    id: "CAP-EML-0710",
    flow: "catalogue",
    group: "email",
    title: { en: "3M 6055 filters · 10 packs", de: "3M-6055-Filter · 10 Packungen" },
    from: "Halewood stores",
    fromMeta: "Stores controller · Halewood",
    site: "UK-HAL-01",
    receivedAt: "2026-10-07T07:55:00.000Z",
    subject: "Filter restock",
    body: ["Need 10 packs of 3M 6055 A2 filters", "for Halewood stores by 12 Oct.", "Usual catalogue line please."],
    evidence: ["10 packs", "3M 6055 A2", "Halewood", "12 Oct"],
    fields: [
      F("item", "What to buy", "Was", "3M 6055 A2 gas/vapour filter", "found", "3M 6055 A2"),
      F("qty", "How many", "Menge", "10 packs · 40 pairs", "found", "10 packs"),
      F("site", "Site", "Standort", "Halewood · CC-HAL-MAINT", "found", "Halewood"),
      F("date", "Needed by", "Bis", "12 Oct 2026", "found", "12 Oct"),
      F("supplier", "Agreement", "Vertrag", "CAT-AP-2026-01 · Midlands Industrial Supply"),
      F("cost", "Value", "Wert", "£480.00 · £48 per pack"),
    ],
    reading: [
      { en: "Live catalogue line CAT-AP-2026-01", de: "Aktive Katalogzeile CAT-AP-2026-01" },
      { en: "£480 below the £3,000 standing limit", de: "£480 unter der Grenze von £3.000" },
    ],
    draft: () => catalogueFixture(10),
  },
  {
    id: "CAP-WO-0705",
    flow: "ST05",
    storyId: "ST05",
    group: "work-order",
    title: { en: "200 × SKF 6205 · conveyor rebuild", de: "200 × SKF 6205 · Förderband" },
    from: "Gareth Lloyd",
    fromMeta: "Maintenance Planner · Halewood",
    site: "UK-HAL-01",
    receivedAt: "2026-10-07T06:48:00.000Z",
    subject: "WO-HAL-58812 · CV-HAL-07 bearing rebuild",
    body: ["Work order WO-HAL-58812", "Asset: stores conveyor CV-HAL-07 (non-safety)", "Parts: 200 × SKF 6205, SKF only please", "Needed by 28 Oct"],
    evidence: ["200 × SKF 6205", "SKF only", "CV-HAL-07", "non-safety", "28 Oct"],
    fields: [
      F("item", "What to buy", "Was", "SKF 6205 open deep-groove bearing", "found", "200 × SKF 6205"),
      F("qty", "How many", "Menge", "200 EA", "found", "200 × SKF 6205"),
      F("site", "Site", "Standort", "Halewood · CC-HAL-MAINT"),
      F("date", "Needed by", "Bis", "28 Oct 2026", "found", "28 Oct"),
      F("spec", "Specification", "Vorgabe", "Named brand · SKF only", "found", "SKF only"),
      F("cost", "Baseline", "Basis", "£4,800.00 · £24 each"),
    ],
    reading: [
      { en: "Named brand on a non-safety asset", de: "Markenvorgabe an nicht sicherheitsrelevanter Anlage" },
      { en: "Listed equivalent FAG 6205-C exists", de: "Gelistetes Äquivalent FAG 6205-C vorhanden" },
    ],
    draft: STORY_DRAFTS.ST05,
  },
  {
    id: "CAP-WO-0711",
    flow: "catalogue",
    group: "work-order",
    title: { en: "3M 6055 restock · 80 packs", de: "3M-6055-Auffüllung · 80 Packungen" },
    from: "Halewood stores",
    fromMeta: "Min/max reorder · Halewood",
    site: "UK-HAL-01",
    receivedAt: "2026-10-07T07:02:00.000Z",
    subject: "WO-HAL-58830 · quarterly PPE restock",
    body: ["Quarterly restock for paint-shop PPE", "80 packs 3M 6055 A2 filters", "Deliver to Halewood stores by 12 Oct"],
    evidence: ["80 packs", "3M 6055 A2", "Halewood", "12 Oct"],
    fields: [
      F("item", "What to buy", "Was", "3M 6055 A2 gas/vapour filter", "found", "3M 6055 A2"),
      F("qty", "How many", "Menge", "80 packs · 320 pairs", "found", "80 packs"),
      F("site", "Site", "Standort", "Halewood · CC-HAL-MAINT", "found", "Halewood"),
      F("date", "Needed by", "Bis", "12 Oct 2026", "found", "12 Oct"),
      F("supplier", "Agreement", "Vertrag", "CAT-AP-2026-01 · Midlands Industrial Supply"),
      F("cost", "Value", "Wert", "£3,840.00 · above £3,000"),
    ],
    reading: [
      { en: "Same catalogue line, larger quantity", de: "Gleiche Katalogzeile, größere Menge" },
      { en: "£3,840 needs a Budget Holder (HC02)", de: "£3.840 braucht Budgetverantwortlichen (HC02)" },
    ],
    draft: () => ({ ...catalogueFixture(80), channel: "work-order", captureId: "CAP-WO-0711", originalText: "WO-HAL-58830: 80 packs 3M 6055 A2 filters to Halewood stores by 12 Oct." }),
  },
  {
    id: "CAP-PRT-0701",
    flow: "ST01",
    storyId: "ST01",
    group: "portal",
    title: { en: "20 Engineering Viewer seats", de: "20 Engineering-Viewer-Plätze" },
    from: "Priya Natarajan",
    fromMeta: "Engineering Manager · Gaydon",
    site: "UK-GAY-01",
    receivedAt: "2026-10-07T07:31:00.000Z",
    subject: "Software request · Engineering Viewer Enterprise",
    body: ["Application: Engineering Viewer Enterprise", "Seats: 20 additional, same annual period", "Users: new body-in-white team (ENG-BIW-01–20)", "Needed by: 20 Oct · cost centre CC-GAY-IT"],
    evidence: ["Engineering Viewer Enterprise", "20 additional", "same annual period", "20 Oct", "CC-GAY-IT"],
    fields: [
      F("item", "What to buy", "Was", "Engineering Viewer Enterprise seat", "found", "Engineering Viewer Enterprise"),
      F("qty", "How many", "Menge", "20 seat-years", "found", "20 additional"),
      F("site", "Site", "Standort", "Gaydon · CC-GAY-IT", "found", "CC-GAY-IT"),
      F("date", "Needed by", "Bis", "20 Oct 2026", "found", "20 Oct"),
      F("supplier", "Agreement", "Vertrag", "AGR-SW-2026-01 · Engineering Software Services"),
      F("cost", "Starting cost", "Ausgangskosten", "£2,400.00 · £120 per seat"),
    ],
    reading: [
      { en: "Licence pool exists for this tier", de: "Lizenzpool für diese Stufe vorhanden" },
      { en: "Check idle seats before buying", de: "Vor dem Kauf freie Plätze prüfen" },
    ],
    draft: STORY_DRAFTS.ST01,
  },
  {
    id: "CAP-PRT-0703",
    flow: "ST03",
    storyId: "ST03",
    group: "portal",
    title: { en: "New supplier · robot cell calibration", de: "Neuer Lieferant · Roboterzellen" },
    from: "Hannah Okafor",
    fromMeta: "Operations Engineer · Wolverhampton",
    site: "UK-WOL-01",
    receivedAt: "2026-10-07T06:20:00.000Z",
    subject: "Supplier request · Lymewell Calibration",
    body: ["Please onboard Lymewell Calibration as a new supplier.", "Scope: calibrate our two robotic cells", "in the 19–23 Oct shutdown.", "Their quote is £38,400."],
    evidence: ["Lymewell Calibration", "two robotic cells", "19–23 Oct", "£38,400"],
    fields: [
      F("item", "What to buy", "Was", "Calibration of two robotic cells", "found", "two robotic cells"),
      F("qty", "How many", "Menge", "1 LOT"),
      F("site", "Site", "Standort", "Wolverhampton · CC-WOL-ENG"),
      F("date", "Needed by", "Bis", "23 Oct 2026", "found", "19–23 Oct"),
      F("supplier", "Preference", "Präferenz", "Lymewell Calibration · not onboarded", "found", "Lymewell Calibration"),
      F("cost", "Starting cost", "Ausgangskosten", "£38,400.00 · named quote", "found", "£38,400"),
    ],
    reading: [
      { en: "Named supplier kept as a preference", de: "Genannter Lieferant bleibt Präferenz" },
      { en: "Panel AGR-CAL-2026-01 covers this scope", de: "Panel AGR-CAL-2026-01 deckt den Umfang" },
    ],
    draft: STORY_DRAFTS.ST03,
  },
  {
    id: "CAP-PRT-0712",
    flow: "catalogue",
    group: "portal",
    title: { en: "“Some stuff for line 3”", de: "„Etwas für Linie 3“" },
    from: "Solihull line lead",
    fromMeta: "Portal chat · Solihull",
    site: "UK-SOL-01",
    receivedAt: "2026-10-07T08:05:00.000Z",
    subject: "Portal message",
    body: ["need some stuff for line 3", "asap"],
    evidence: ["line 3"],
    fields: [
      F("item", "What to buy", "Was", "Not stated", "missing"),
      F("qty", "How many", "Menge", "Not stated", "missing"),
      F("site", "Site", "Standort", "Solihull · from sender", "assumed"),
      F("date", "Needed by", "Bis", "Not stated", "missing"),
    ],
    reading: [
      { en: "No item or quantity in the message", de: "Kein Artikel und keine Menge" },
      { en: "No part number will be guessed", de: "Keine Teilenummer wird geraten" },
    ],
  },
];

export const arrivalById: Record<string, Arrival> = Object.fromEntries(ARRIVALS.map((a) => [a.id, a]));
