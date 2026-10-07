/**
 * ════════════════════════════════════════════════════════════════════════
 * THE SINGLE SOURCE OF TRUTH for the MRO procurement workspace.
 * ════════════════════════════════════════════════════════════════════════
 *
 * Every number on every screen — the dashboard tiles, the requisition
 * worklist, the exception lanes, the invoice tie-out — is either a field on
 * one of the records below, or is COMPUTED from them by a selector in this
 * file. Nothing is retyped in a component.
 *
 * The rule: if you find yourself typing a number into JSX, it belongs here.
 *   · a requisition's value is qty × unitPrice — never stored
 *   · a tile's count is a filter over `requisitions` — never stored
 *   · an invoice's variance is invoice − contract — never stored
 *
 * Operating entity is the fictional "Siemens" — a specialty
 * electronics and industrial automation manufacturer whose plant engineers raise maintenance,
 * repair and operations (MRO) purchase requisitions. The AI structures,
 * validates, recommends and routes; a human approves every real decision.
 */

/* ── Demo clock ──────────────────────────────────────────────────────────
 * Deterministic so screenshots and narration never drift. */
export const TODAY = "2026-06-20";

/** Days between two ISO dates — used for ageing, never hand-counted. */
export function daysBetween(from: string, to: string = TODAY): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/* ── Money ───────────────────────────────────────────────────────────────
 * One formatter, so $4,180.00 looks identical everywhere it appears. */
export const usd = (n: number, decimals = 2): string =>
  `$${n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

/** Compact form for tiles — $23.6K / $1.2M. Never used next to an exact figure. */
export const usdCompact = (n: number): string => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return usd(n, 0);
};

export const pct = (fraction: number, decimals = 0): string =>
  `${(fraction * 100).toFixed(decimals)}%`;

/* ════════════════════════════════════════════════════════════════════════
 * Exception taxonomy — lifted straight from the agents' own escalation
 * reasons in data/agents.ts, so the board and the workforce never disagree.
 * ════════════════════════════════════════════════════════════════════════ */

export type ExceptionType =
  | "spec-incomplete"
  | "duplicate-demand"
  | "stock-available"
  | "warranty-covered"
  | "off-contract"
  | "over-threshold";

export type ExceptionMeta = {
  type: ExceptionType;
  /** Plain-business-language lane title. */
  label: string;
  /** One line a non-procurement reader understands. */
  blurb: string;
  /** Which agent raises it — ties the lane back to the workforce. */
  raisedBy: string;
  /** Who resolves it. */
  owner: string;
  /** Working-hour service level for the lane. */
  slaHours: number;
  /** Tailwind-safe accent used by chips, lane headers and the board. */
  accent: string;
};

export const EXCEPTION_TYPES: ExceptionMeta[] = [
  {
    type: "spec-incomplete",
    label: "Specification incomplete",
    blurb: "The request is missing a size, material or part number, so the wrong part could be ordered.",
    raisedBy: "PR Processing Agent",
    owner: "Requesting engineer",
    slaHours: 4,
    accent: "#b45309",
  },
  {
    type: "duplicate-demand",
    label: "Duplicate request",
    blurb: "Someone already raised a request for the same item, so the plant would buy it twice.",
    raisedBy: "Master Data Agent",
    owner: "Buyer desk",
    slaHours: 8,
    accent: "#7c3aed",
  },
  {
    type: "stock-available",
    label: "Stock already available",
    blurb: "The item is sitting in a sister plant's store, so it can be transferred instead of bought.",
    raisedBy: "Master Data Agent",
    owner: "Inventory planner",
    slaHours: 8,
    accent: "#0369a1",
  },
  {
    type: "warranty-covered",
    label: "Covered by warranty",
    blurb: "The equipment is still under warranty, so the supplier owes a replacement rather than a sale.",
    raisedBy: "Warranty & Coverage Desk",
    owner: "Reliability engineer",
    slaHours: 24,
    accent: "#0f766e",
  },
  {
    type: "off-contract",
    label: "Off-contract or price variance",
    blurb: "The supplier or the price sits outside the agreement, so the spend would leak.",
    raisedBy: "Sourcing & Contract Agent",
    owner: "Category buyer",
    slaHours: 12,
    accent: "#a6192e",
  },
  {
    type: "over-threshold",
    label: "Above approval limit",
    blurb: "The amount is past the approval limit or the competitive-quote threshold, so a person must sign.",
    raisedBy: "Approval & Routing Agent",
    owner: "Procurement manager",
    slaHours: 12,
    accent: "#334155",
  },
];

export const exceptionMeta: Record<ExceptionType, ExceptionMeta> = EXCEPTION_TYPES.reduce(
  (acc, e) => ((acc[e.type] = e), acc),
  {} as Record<ExceptionType, ExceptionMeta>,
);

/* ════════════════════════════════════════════════════════════════════════
 * Requisitions — the spine of the demo.
 * ════════════════════════════════════════════════════════════════════════ */

/** Where a requisition sits in the pipeline. */
export type PrStatus = "structuring" | "validating" | "held" | "released";

export const PR_STATUS_LABEL: Record<PrStatus, string> = {
  structuring: "Structuring",
  validating: "Validating",
  held: "Held for you",
  released: "Released",
};

/** What the workforce is doing to it right now. */
export type AgentActivity = "processing" | "waiting" | "complete";

/** Where the requesting plant sits — drives the country cards and filters. */
export type Country = "Germany" | "Spain" | "France" | "China";

export const COUNTRIES: Country[] = ["Germany", "Spain", "France", "China"];

/** How urgently the plant needs it. Critical = a line is down. */
export type Priority = "critical" | "high" | "normal";

export const PRIORITY_LABEL: Record<Priority, string> = {
  critical: "Critical",
  high: "High",
  normal: "Normal",
};

/** A closed exception — what was done about it, kept on the record. */
export type Resolution = {
  type: ExceptionType;
  /** Plain-language label of the applied action, e.g. "Spec confirmed · 50 mm". */
  action: string;
  at: string;
};

/** Languages the workforce reads and writes. English is the working language. */
export type Lang = "en" | "de";

export const LANGUAGES: { code: Lang; label: string; native: string; flag: string; emoji: string }[] = [
  { code: "en", label: "English", native: "English", flag: "EN", emoji: "🇬🇧" },
  { code: "de", label: "German", native: "Deutsch", flag: "DE", emoji: "🇩🇪" },
];

export type Requisition = {
  id: string;
  /** Material master code — the coded outcome of intake. */
  material: string;
  description: string;
  requestor: string;
  plant: string;
  line: string;
  qty: number;
  uom: string;
  /** Per-unit price. The line value is ALWAYS qty × unitPrice, never stored. */
  unitPrice: number;
  raisedOn: string;
  status: PrStatus;
  /** Empty = clean, released without a person touching it. */
  exceptions: ExceptionType[];
  costCenter: string;
  glAccount: string;
  vendor: string;
  agreement?: string;
  /** The language the engineer actually wrote the request in. */
  sourceLang: Lang;
  /** Country of the requesting plant. */
  country: Country;
  /** How urgently the plant needs it. */
  priority: Priority;
  /** Exceptions a person has closed, with what was done. */
  resolutions?: Resolution[];
  /** Exceptions handed to a named person and still with them. */
  assigned?: { type: ExceptionType; to: string }[];
  /** Deep-link into the full run, when this requisition has one. */
  flow?: "catalogue" | "pump" | "gearbox" | "risk" | "compliance" | "bearing" | "off-catalogue";
  /** Set when the exception is resolved — drives the "recovered" numbers. */
  avoidedSpend?: number;
  /** One-line plain-language note shown on the exception detail. */
  note?: string;
};

const CC_DISPERSION = "10034 · Deburring & Finishing Maintenance";
const CC_RESIN = "10031 · Drive Systems Maintenance";
const CC_FILLING = "10052 · Test & Pack Line Maintenance";
const CC_UTIL = "10061 · Utilities Maintenance";
const CC_COATING = "10071 · Electronics Assembly Maintenance";
const GL_REPAIR = "600450 · Repairs & Maintenance";
const GL_SPARES = "600420 · Spare parts consumed";

const APEX = "Apex Industrial Supply";
const SA07 = "SA-MRO-07";

/**
 * The requisition book. Two of these carry the full worked runs the demo
 * clicks through (the mechanical seal and the grinding media); the rest give
 * the worklist, the lanes and the tiles their real weight.
 */
export const requisitions: Requisition[] = [
  /* ── ① HERO CASE — mechanical seal · specification incomplete ────────── */
  {
    id: "PR-48630",
    material: "MRO-SEAL-MECH-50MM-SIC",
    description: 'Mechanical seal — cartridge — 50 mm shaft — silicon carbide faces',
    requestor: "Plant engineer · Assembly Line 2",
    plant: "Amberg · Electronics Works",
    line: "Assembly Line 2",
    qty: 1,
    uom: "EA",
    unitPrice: 4180,
    country: "Germany",
    priority: "critical",
    raisedOn: "2026-06-20",
    status: "held",
    exceptions: ["spec-incomplete"],
    costCenter: CC_DISPERSION,
    glAccount: GL_REPAIR,
    vendor: APEX,
    agreement: SA07,
    sourceLang: "de",
    flow: "pump",
    note: "The request gave a shaft-diameter range of 45–50 mm and no part number. The agent coded it to 50 mm; the engineer confirms before it is released, so a wrong-fit seal never reaches the plant.",
  },

  /* ── ② HERO CASE — grinding media · duplicate + stock + warranty ─────── */
  {
    id: "PR-48655",
    material: "MRO-MEDIA-ZRO2-1.2MM",
    description: "Grinding media — zirconia — 1.2 mm — 25 kg bag",
    requestor: "Plant engineer · Deburring Line 3",
    plant: "Amberg · Electronics Works",
    line: "Deburring Line 3",
    qty: 8,
    uom: "BAG",
    unitPrice: 118,
    country: "Germany",
    priority: "high",
    raisedOn: "2026-06-20",
    status: "held",
    exceptions: ["duplicate-demand", "stock-available", "warranty-covered"],
    costCenter: CC_DISPERSION,
    glAccount: GL_SPARES,
    vendor: APEX,
    agreement: SA07,
    sourceLang: "de",
    flow: "gearbox",
    avoidedSpend: 708,
    note: "A request for the same media is already open, a sister plant holds six bags, and the batch that wore early is still inside its quality warranty — so most of this demand should not be bought at all.",
  },

  /* ── THE CATALOGUE BUY — filter bags · the hero run ──────────────────── */
  {
    id: "PR-48702",
    flow: "catalogue",
    material: "MRO-FILT-BAG-25UM-PP",
    description: "Filter bag — 25 micron — polypropylene — size 2",
    requestor: "Process engineer · Deburring Line 1",
    plant: "Amberg · Electronics Works",
    line: "Deburring Line 1",
    qty: 400,
    uom: "EA",
    unitPrice: 22.4,
    country: "Germany",
    priority: "normal",
    raisedOn: "2026-06-20",
    status: "validating",
    exceptions: [],
    costCenter: CC_DISPERSION,
    glAccount: GL_SPARES,
    vendor: APEX,
    agreement: SA07,
    sourceLang: "de",
    note: "The quarterly filter change for the let-down lines. A catalogue item we buy again and again — the question is not whether to buy it, but at what break and on how many orders.",
  },

  /* ── Validated · waiting to become an order (the compliance run) ─────── */
  {
    id: "PR-48690",
    material: "MRO-GBOX-KIT-WINDER",
    description: "Gearbox rebuild kit — winder drive — seal & bearing set",
    requestor: "Reliability engineer · Winding Line 1",
    plant: "Amberg · Drive Systems Works",
    line: "Winding Line 1",
    qty: 1,
    uom: "EA",
    unitPrice: 42000,
    country: "Germany",
    priority: "high",
    raisedOn: "2026-06-24",
    status: "validating",
    exceptions: [],
    costCenter: CC_RESIN,
    glAccount: GL_REPAIR,
    vendor: "GearTech Drives",
    agreement: "SA-MRO-09",
    sourceLang: "de",
    note: "Every control has cleared and the request is on agreement SA-MRO-09 — it is waiting to be turned into a purchase order.",
  },

  /* ── Held · off-contract ─────────────────────────────────────────────── */
  {
    id: "PR-48696",
    material: "RAW-ELSTEEL-M4-030MM",
    description: "Grain-oriented electrical steel — M4 grade — C5 insulation coated — 0.30 mm coil",
    requestor: "Materials engineer · Deburring Line 1",
    plant: "Amberg · Electronics Works",
    line: "Deburring Line 1",
    qty: 12,
    uom: "T",
    unitPrice: 3255,
    country: "Germany",
    priority: "high",
    raisedOn: "2026-06-22",
    status: "held",
    exceptions: ["off-contract"],
    costCenter: CC_RESIN,
    glAccount: GL_REPAIR,
    vendor: "None on file",
    sourceLang: "de",
    note: "This grade is not on any agreement — the new formulation needs a surface treatment our contracted grade does not have, so the tonnage has to be bought on the open market.",
  },

  {
    id: "PR-48662",
    material: "MRO-VIB-SENSOR-INLINE",
    description: "Inline vibration sensor — accelerometer — 4–20 mA output",
    requestor: "Instrument technician · Deburring Line 1",
    plant: "Amberg · Electronics Works",
    line: "Deburring Line 1",
    qty: 2,
    uom: "EA",
    unitPrice: 6450,
    country: "Germany",
    priority: "high",
    raisedOn: "2026-06-19",
    status: "held",
    exceptions: ["off-contract"],
    costCenter: CC_DISPERSION,
    glAccount: GL_REPAIR,
    vendor: "Precision Instrument Partners",
    sourceLang: "de",
    avoidedSpend: 1290,
    note: "The named supplier is not on the approved list and the quoted price sits ten percent above the agreement held with the approved supplier.",
  },

  /* ── Held · above approval limit ─────────────────────────────────────── */
  {
    id: "PR-48668",
    material: "MRO-MOTOR-IE3-15KW",
    description: "Electric motor — IE3 — 15 kW — flange mount",
    requestor: "Reliability engineer · Winding Plant",
    plant: "Berlin · Drives & Power",
    line: "Winding Line 2",
    qty: 3,
    uom: "EA",
    unitPrice: 5240,
    country: "France",
    priority: "high",
    raisedOn: "2026-06-19",
    status: "held",
    exceptions: ["over-threshold"],
    costCenter: CC_RESIN,
    glAccount: GL_REPAIR,
    vendor: APEX,
    agreement: SA07,
    sourceLang: "en",
    note: "The total is above the plant approval limit and past the point where three competitive quotes are required, so it routes to the procurement manager.",
  },

  /* ── Held · duplicate ────────────────────────────────────────────────── */
  {
    id: "PR-48671",
    material: "MRO-HOSE-COOL-2IN-EPDM",
    description: "Coolant transfer hose — 2 in — EPDM lined — 6 m",
    requestor: "Maintenance planner · Test & Pack Line 2",
    plant: "Nanjing · Assembly & Packaging",
    line: "Test & Pack Line 2",
    qty: 6,
    uom: "EA",
    unitPrice: 385,
    country: "Spain",
    priority: "high",
    raisedOn: "2026-06-18",
    status: "held",
    exceptions: ["duplicate-demand"],
    costCenter: CC_FILLING,
    glAccount: GL_SPARES,
    vendor: APEX,
    agreement: SA07,
    sourceLang: "en",
    avoidedSpend: 1155,
    note: "Three of these six are already covered by a request raised for the same line two days ago.",
  },

  /* ── Held · stock available at a sister plant ────────────────────────── */
  {
    id: "PR-48674",
    material: "MRO-FILT-BAG-25UM-PP",
    description: "Filter bag — 25 micron — polypropylene — size 2",
    requestor: "Plant engineer · Deburring Line 2",
    plant: "Chengdu · Electronics Works",
    line: "Deburring Line 2",
    qty: 40,
    uom: "EA",
    unitPrice: 46,
    country: "China",
    priority: "high",
    raisedOn: "2026-06-18",
    status: "held",
    exceptions: ["stock-available"],
    costCenter: CC_COATING,
    glAccount: GL_SPARES,
    vendor: APEX,
    agreement: SA07,
    sourceLang: "en",
    avoidedSpend: 1104,
    note: "The Berlin plant holds twenty-four of these in its store and can transfer them this week.",
  },

  /* ── In flight ───────────────────────────────────────────────────────── */
  {
    id: "PR-48679",
    material: "MRO-VALVE-BFLY-DN80-PTFE",
    description: "Butterfly valve — DN80 — PTFE lined — lever operated",
    requestor: "Maintenance planner · Winding Plant",
    plant: "Amberg · Drive Systems Works",
    line: "Winding Line 1",
    qty: 4,
    uom: "EA",
    unitPrice: 612,
    country: "Germany",
    priority: "normal",
    raisedOn: "2026-06-20",
    status: "validating",
    exceptions: [],
    costCenter: CC_RESIN,
    glAccount: GL_SPARES,
    vendor: APEX,
    agreement: SA07,
    sourceLang: "de",
  },
  {
    id: "PR-48681",
    material: "MRO-PUMP-DIAPH-AODD-2IN",
    description: "Air-operated double-diaphragm pump — 2 in — PTFE fitted",
    requestor: "Plant engineer · Test & Pack Line 1",
    plant: "Nanjing · Assembly & Packaging",
    line: "Test & Pack Line 1",
    qty: 1,
    uom: "EA",
    unitPrice: 3480,
    country: "Spain",
    priority: "normal",
    raisedOn: "2026-06-20",
    status: "validating",
    exceptions: [],
    costCenter: CC_FILLING,
    glAccount: GL_REPAIR,
    vendor: APEX,
    agreement: SA07,
    sourceLang: "en",
  },
  {
    id: "PR-48683",
    material: "MRO-TEMP-RTD-PT100",
    description: "Temperature probe — RTD Pt100 — 6 mm — DN25 flange",
    requestor: "Instrument technician · Winding Line 2",
    plant: "Berlin · Drives & Power",
    line: "Winding Line 2",
    qty: 6,
    uom: "EA",
    unitPrice: 214,
    country: "France",
    priority: "normal",
    raisedOn: "2026-06-20",
    status: "structuring",
    exceptions: [],
    costCenter: CC_RESIN,
    glAccount: GL_SPARES,
    vendor: APEX,
    agreement: SA07,
    sourceLang: "en",
  },

  /* ── Released clean — the touchless majority ─────────────────────────── */
  /* ── THE CLEAN RUN — pump diaphragm · released without a person ──────── */
  {
    id: "PR-48692",
    material: "MRO-DIAPH-PTFE-2IN",
    description: "Diaphragm — PTFE — 2 in transfer pump",
    requestor: "Maintenance planner · Assembly Line 1",
    plant: "Amberg · Electronics Works",
    line: "Assembly Line 1",
    qty: 6,
    uom: "EA",
    unitPrice: 148,
    country: "Germany",
    priority: "normal",
    raisedOn: "2026-06-26",
    status: "released",
    exceptions: [],
    costCenter: CC_DISPERSION,
    glAccount: GL_SPARES,
    vendor: APEX,
    agreement: SA07,
    /* The German plant plans its maintenance in English — no translation needed. */
    sourceLang: "de",
    flow: "bearing",
    note: "Complete request, material on the master, no stock, on agreement, inside the plant limit — released by rule with nobody involved.",
  },
  {
    id: "PR-48611",
    material: "MRO-DIAPH-PTFE-15IN",
    description: "Diaphragm — PTFE — 1.5 in dosing pump",
    requestor: "Maintenance planner · SMT Line 1",
    plant: "Amberg · Electronics Works",
    line: "SMT Line 1",
    qty: 10,
    uom: "EA",
    unitPrice: 28,
    country: "Germany",
    priority: "normal",
    raisedOn: "2026-06-17",
    status: "released",
    exceptions: [],
    costCenter: CC_DISPERSION,
    glAccount: GL_SPARES,
    vendor: APEX,
    agreement: SA07,
    sourceLang: "de",
  },
  {
    id: "PR-48614",
    material: "MRO-GASKET-PTFE-DN80",
    description: "Gasket — PTFE envelope — DN80 — full face",
    requestor: "Maintenance planner · Winding Plant",
    plant: "Berlin · Drives & Power",
    line: "Winding Line 1",
    qty: 25,
    uom: "EA",
    unitPrice: 19,
    country: "France",
    priority: "normal",
    raisedOn: "2026-06-17",
    status: "released",
    exceptions: [],
    costCenter: CC_RESIN,
    glAccount: GL_SPARES,
    vendor: APEX,
    agreement: SA07,
    sourceLang: "en",
  },
  {
    id: "PR-48618",
    material: "MRO-COUPL-FLEX-80MM",
    description: "Flexible coupling — 80 mm — elastomer insert",
    requestor: "Plant engineer · SMT Line 2",
    plant: "Chengdu · Electronics Works",
    line: "SMT Line 2",
    qty: 2,
    uom: "EA",
    unitPrice: 340,
    country: "China",
    priority: "normal",
    raisedOn: "2026-06-16",
    status: "released",
    exceptions: [],
    costCenter: CC_COATING,
    glAccount: GL_SPARES,
    vendor: APEX,
    agreement: SA07,
    sourceLang: "en",
  },
  {
    id: "PR-48622",
    material: "MRO-SEAL-KIT-GBOX-40MM",
    description: "Seal kit — gear reducer — 40 mm — elastomer and face set",
    requestor: "Plant engineer · Assembly Line 1",
    plant: "Amberg · Electronics Works",
    line: "Assembly Line 1",
    qty: 2,
    uom: "EA",
    unitPrice: 780,
    country: "Germany",
    priority: "normal",
    raisedOn: "2026-06-16",
    status: "released",
    exceptions: [],
    costCenter: CC_DISPERSION,
    glAccount: GL_REPAIR,
    vendor: APEX,
    agreement: SA07,
    sourceLang: "de",
  },
  {
    id: "PR-48627",
    material: "MRO-FILT-BAG-25UM-PP",
    description: "Filter bag — 25 micron — polypropylene — size 2",
    requestor: "Maintenance planner · Test & Pack Line 1",
    plant: "Nanjing · Assembly & Packaging",
    line: "Test & Pack Line 1",
    qty: 30,
    uom: "EA",
    unitPrice: 46,
    country: "Spain",
    priority: "normal",
    raisedOn: "2026-06-15",
    status: "released",
    exceptions: [],
    costCenter: CC_FILLING,
    glAccount: GL_SPARES,
    vendor: APEX,
    agreement: SA07,
    sourceLang: "en",
  },
  {
    id: "PR-48629",
    material: "MRO-VALVE-BFLY-DN80-PTFE",
    description: "Butterfly valve — DN80 — PTFE lined — lever operated",
    requestor: "Maintenance planner · Utilities",
    plant: "Berlin · Drives & Power",
    line: "Utilities",
    qty: 2,
    uom: "EA",
    unitPrice: 612,
    country: "France",
    priority: "normal",
    raisedOn: "2026-06-15",
    status: "released",
    exceptions: [],
    costCenter: CC_UTIL,
    glAccount: GL_SPARES,
    vendor: APEX,
    agreement: SA07,
    sourceLang: "en",
  },
];

/* ── Requisition selectors — every screen number comes from here ───────── */

/** The line value. The ONLY place qty × price is expressed. */
export const lineValue = (r: Requisition): number => r.qty * r.unitPrice;

export const isException = (r: Requisition): boolean => r.exceptions.length > 0;

/** Clean requisitions released without a person touching them. */
export const isTouchless = (r: Requisition): boolean =>
  r.status === "released" && r.exceptions.length === 0;

export const byStatus = (rs: Requisition[], s: PrStatus): Requisition[] =>
  rs.filter((r) => r.status === s);

export const withException = (rs: Requisition[], t: ExceptionType): Requisition[] =>
  rs.filter((r) => r.exceptions.includes(t));

export const totalValue = (rs: Requisition[]): number =>
  rs.reduce((sum, r) => sum + lineValue(r), 0);

/** Share of finished requisitions that needed nobody. */
export const touchlessRate = (rs: Requisition[]): number => {
  const finished = rs.filter((r) => r.status === "released" || r.status === "held");
  if (finished.length === 0) return 0;
  return finished.filter(isTouchless).length / finished.length;
};

/** Spend the workforce stopped — transfers, duplicates, warranty and leakage. */
export const avoidedSpend = (rs: Requisition[]): number =>
  rs.reduce((sum, r) => sum + (r.avoidedSpend ?? 0), 0);

/** Lane roll-up for the exception board — count and value per type. */
export type ExceptionLane = ExceptionMeta & {
  items: Requisition[];
  count: number;
  value: number;
};

export const exceptionLanes = (rs: Requisition[]): ExceptionLane[] =>
  EXCEPTION_TYPES.map((meta) => {
    const items = withException(rs, meta.type);
    return { ...meta, items, count: items.length, value: totalValue(items) };
  });

/* ════════════════════════════════════════════════════════════════════════
 * Invoice tie-out — invoice ↔ purchase order ↔ goods receipt ↔ contract.
 * Variances are COMPUTED, never stored, so a mismatch can never be stated
 * two different ways on two different screens.
 * ════════════════════════════════════════════════════════════════════════ */

export type TieoutDoc = {
  reference: string;
  qty: number;
  unitPrice: number;
};

export type InvoiceTieout = {
  id: string;
  vendor: string;
  prId: string;
  material: string;
  description: string;
  receivedOn: string;
  terms: string;
  invoice: TieoutDoc;
  po: TieoutDoc;
  /** A goods receipt records quantity only — it carries no price. */
  gr: { reference: string; qty: number };
  contract: TieoutDoc;
  /** Set when a variance has been raised as a claim against the supplier. */
  claimId?: string;
  note?: string;
};

export const invoiceTieouts: InvoiceTieout[] = [
  {
    id: "BPI-5611",
    vendor: APEX,
    prId: "PR-48702",
    material: "MRO-FILT-BAG-25UM-PP",
    description: "Filter bag — 25 micron — size 2 — consolidated",
    receivedOn: "2026-07-06",
    terms: "Net 30",
    invoice: { reference: "BPI-5611", qty: 1040, unitPrice: 19.9 },
    po: { reference: "PO-77351", qty: 1040, unitPrice: 19.9 },
    gr: { reference: "GR-77351", qty: 1040 },
    contract: { reference: SA07, qty: 1040, unitPrice: 19.9 },
    note: "Billed at the 1,000+ break the consolidated order reached — not the price any one plant would have paid on its own.",
  },
  {
    id: "BPI-5567",
    vendor: APEX,
    prId: "PR-48630",
    material: "MRO-SEAL-MECH-50MM-SIC",
    description: "Mechanical seal — cartridge — 50 mm shaft",
    receivedOn: "2026-06-24",
    terms: "Net 30",
    invoice: { reference: "BPI-5567", qty: 1, unitPrice: 4180 },
    po: { reference: "PO-77310", qty: 1, unitPrice: 4180 },
    gr: { reference: "GR-77310", qty: 1 },
    contract: { reference: SA07, qty: 1, unitPrice: 4180 },
    note: "Contract, order, receipt and invoice agree to the cent — cleared for today's payment run with no person involved.",
  },
  {
    id: "BPI-5602",
    vendor: APEX,
    prId: "PR-48692",
    material: "MRO-DIAPH-PTFE-2IN",
    description: "Diaphragm — PTFE — 2 in transfer pump",
    receivedOn: "2026-07-07",
    terms: "Net 30",
    invoice: { reference: "BPI-5602", qty: 6, unitPrice: 148 },
    po: { reference: "PO-77342", qty: 6, unitPrice: 148 },
    gr: { reference: "GR-77342", qty: 6 },
    contract: { reference: SA07, qty: 6, unitPrice: 148 },
    note: "Four-way matched on the spot — contract, order, receipt and invoice agree, so it cleared for the payment run untouched.",
  },
  {
    id: "BPI-5581",
    vendor: APEX,
    prId: "PR-48622",
    material: "MRO-SEAL-KIT-GBOX-40MM",
    description: "Seal kit — gear reducer — 40 mm",
    receivedOn: "2026-06-24",
    terms: "Net 30",
    invoice: { reference: "BPI-5581", qty: 2, unitPrice: 845 },
    po: { reference: "PO-77322", qty: 2, unitPrice: 780 },
    gr: { reference: "GR-77322", qty: 2 },
    contract: { reference: SA07, qty: 2, unitPrice: 780 },
    claimId: "CLM-001",
    note: "The supplier billed above the agreed price. The difference is claimed back before any payment is released.",
  },
  {
    id: "BPI-5588",
    vendor: APEX,
    prId: "PR-48627",
    material: "MRO-FILT-BAG-25UM-PP",
    description: "Filter bag — 25 micron — size 2",
    receivedOn: "2026-06-23",
    terms: "Net 30",
    invoice: { reference: "BPI-5588", qty: 30, unitPrice: 46 },
    po: { reference: "PO-77330", qty: 30, unitPrice: 46 },
    gr: { reference: "GR-77330", qty: 24 },
    contract: { reference: SA07, qty: 30, unitPrice: 46 },
    claimId: "CLM-002",
    note: "Thirty were ordered and billed but only twenty-four arrived. The short delivery is held back from payment until the rest is received.",
  },
  {
    id: "BPI-5590",
    vendor: APEX,
    prId: "PR-48611",
    material: "MRO-DIAPH-PTFE-15IN",
    description: "Diaphragm — PTFE — 1.5 in dosing pump",
    receivedOn: "2026-06-23",
    terms: "Net 30",
    invoice: { reference: "BPI-5590", qty: 10, unitPrice: 28 },
    po: { reference: "PO-77334", qty: 10, unitPrice: 28 },
    gr: { reference: "GR-77334", qty: 10 },
    contract: { reference: SA07, qty: 10, unitPrice: 28 },
    note: "Every document agrees — cleared without a person.",
  },
  {
    id: "BPI-5594",
    vendor: APEX,
    prId: "PR-48614",
    material: "MRO-GASKET-PTFE-DN80",
    description: "Gasket — PTFE envelope — DN80",
    receivedOn: "2026-06-22",
    terms: "Net 30",
    invoice: { reference: "BPI-5594", qty: 25, unitPrice: 19 },
    po: { reference: "PO-77338", qty: 25, unitPrice: 19 },
    gr: { reference: "GR-77338", qty: 25 },
    contract: { reference: SA07, qty: 25, unitPrice: 19 },
    note: "Every document agrees — cleared without a person.",
  },
];

/* ── Tie-out selectors — the whole match verdict is derived ────────────── */

export const invoiceAmount = (t: InvoiceTieout): number =>
  t.invoice.qty * t.invoice.unitPrice;
export const poAmount = (t: InvoiceTieout): number => t.po.qty * t.po.unitPrice;
export const contractAmount = (t: InvoiceTieout): number =>
  t.contract.qty * t.contract.unitPrice;
/** What the receipt proves was actually delivered, valued at the agreed price. */
export const receivedAmount = (t: InvoiceTieout): number =>
  t.gr.qty * t.contract.unitPrice;

/** Billed above the agreement, per unit. Zero when the price is right. */
export const priceVariance = (t: InvoiceTieout): number =>
  t.invoice.unitPrice - t.contract.unitPrice;

/** Billed for more than arrived. Zero when the delivery is complete. */
export const qtyVariance = (t: InvoiceTieout): number => t.invoice.qty - t.gr.qty;

/** The money at stake — what must be recovered or withheld. */
export const tieoutGap = (t: InvoiceTieout): number =>
  invoiceAmount(t) - receivedAmount(t);

export const tieoutAgrees = (t: InvoiceTieout): boolean =>
  priceVariance(t) === 0 && qtyVariance(t) === 0;

/** Human-readable reason, built from the variance rather than typed twice. */
export function tieoutReason(t: InvoiceTieout): string | null {
  const price = priceVariance(t);
  const qty = qtyVariance(t);
  if (price !== 0 && qty !== 0)
    return `Billed ${usd(price)} above the agreed price and ${qty} more than arrived`;
  if (price !== 0)
    return `Billed ${usd(price)} above the agreed price of ${usd(t.contract.unitPrice)}`;
  if (qty !== 0) return `Billed for ${t.invoice.qty} but only ${t.gr.qty} arrived`;
  return null;
}

export const totalRecoverable = (ts: InvoiceTieout[]): number =>
  ts.filter((t) => !tieoutAgrees(t)).reduce((sum, t) => sum + tieoutGap(t), 0);

/** The supplier invoice raised against a requisition, when one exists. */
export const invoiceFor = (r: Requisition): InvoiceTieout | undefined =>
  invoiceTieouts.find((t) => t.prId === r.id);

export const clearedAmount = (ts: InvoiceTieout[]): number =>
  ts.filter(tieoutAgrees).reduce((sum, t) => sum + invoiceAmount(t), 0);

/* ════════════════════════════════════════════════════════════════════════
 * Approval routing — the limits that decide who signs.
 * ════════════════════════════════════════════════════════════════════════ */

export type ApprovalRule = {
  trigger: string;
  routesTo: string;
  limit: number;
};

export const approvalRules: ApprovalRule[] = [
  { trigger: "Up to the plant maintenance limit", routesTo: "Plant maintenance lead", limit: 10_000 },
  { trigger: "Above the plant limit, on contract", routesTo: "Procurement manager", limit: 50_000 },
  { trigger: "Above the competitive-quote threshold", routesTo: "Category buyer — three quotes required", limit: 15_000 },
  { trigger: "Any supplier outside the approved list", routesTo: "Category buyer", limit: 0 },
];

/** Which approver a requisition lands on, given its value. */
export function routeFor(r: Requisition): ApprovalRule {
  const v = lineValue(r);
  if (v <= 10_000) return approvalRules[0];
  return approvalRules[1];
}
