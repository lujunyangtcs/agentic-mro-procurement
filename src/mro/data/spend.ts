/**
 * Procurement spend across the network — the control tower's source of truth.
 *
 * Each site books its spend in its own language and its own words. The
 * workforce maps every one of those local descriptions onto a single reporting
 * category, which is what makes a group-level picture possible at all: without
 * it, "Gleitringdichtungen", "Cierres mecánicos" and "机械密封" are three
 * unrelated lines rather than one category.
 *
 * As everywhere in this demo, no figure on the control tower is written into a
 * component. Every total, share, average and ranking below is computed from
 * `spendLines`.
 */

import { usd } from "@/mro/data/procurement";

/* ── Where the spend happens ────────────────────────────────────────────── */

export type CountryCode = "DE" | "ES" | "FR" | "CN" | "US";

export type Site = {
  country: CountryCode;
  countryName: string;
  site: string;
  /** The language this site actually works in. */
  lang: "de" | "es" | "fr" | "zh" | "en";
};

export const sites: Site[] = [
  { country: "DE", countryName: "Germany", site: "Northgate · Dispersion Plant", lang: "de" },
  { country: "ES", countryName: "Spain", site: "Westport · Filling & Packaging", lang: "es" },
  { country: "FR", countryName: "France", site: "Eastbrook · Resin & Additives", lang: "fr" },
  { country: "CN", countryName: "China", site: "Lianhe · Coatings Works", lang: "zh" },
  { country: "US", countryName: "United States", site: "Riverbend · Technical Centre", lang: "en" },
];

export const siteByCountry: Record<CountryCode, Site> = sites.reduce(
  (acc, s) => ((acc[s.country] = s), acc),
  {} as Record<CountryCode, Site>,
);

/* ── What is bought ─────────────────────────────────────────────────────── */

export type CategoryId =
  | "seals"
  | "media"
  | "instruments"
  | "valves"
  | "filtration"
  | "motors"
  | "services";

export type Category = {
  id: CategoryId;
  /** The single reporting name the group uses. */
  label: string;
  /** What each site calls it in its own language, before the mapping. */
  local: Partial<Record<CountryCode, string>>;
};

export const categories: Category[] = [
  {
    id: "seals",
    label: "Seals and packing",
    local: {
      DE: "Gleitringdichtungen und Packungen",
      ES: "Cierres mecánicos y empaquetaduras",
      FR: "Garnitures mécaniques et tresses",
      CN: "机械密封与填料",
    },
  },
  {
    id: "media",
    label: "Milling and grinding media",
    local: {
      DE: "Mahlkörper und Mahlmedien",
      ES: "Cuerpos y medios de molienda",
      FR: "Corps et médias de broyage",
      CN: "研磨介质",
    },
  },
  {
    id: "instruments",
    label: "Instrumentation",
    local: {
      DE: "Messtechnik",
      ES: "Instrumentación",
      FR: "Instrumentation",
      CN: "仪器仪表",
    },
  },
  {
    id: "valves",
    label: "Valves and fittings",
    local: {
      DE: "Armaturen und Fittings",
      ES: "Válvulas y accesorios",
      FR: "Robinetterie et raccords",
      CN: "阀门与管件",
    },
  },
  {
    id: "filtration",
    label: "Filtration",
    local: {
      DE: "Filtration",
      ES: "Filtración",
      FR: "Filtration",
      CN: "过滤",
    },
  },
  {
    id: "motors",
    label: "Motors and drives",
    local: {
      DE: "Motoren und Antriebe",
      ES: "Motores y accionamientos",
      FR: "Moteurs et entraînements",
      CN: "电机与传动",
    },
  },
  {
    id: "services",
    label: "Maintenance services",
    local: {
      DE: "Instandhaltungsleistungen",
      ES: "Servicios de mantenimiento",
      FR: "Prestations de maintenance",
      CN: "维修服务",
    },
  },
];

export const categoryById: Record<CategoryId, Category> = categories.reduce(
  (acc, c) => ((acc[c.id] = c), acc),
  {} as Record<CategoryId, Category>,
);

/* ── Who is buying ──────────────────────────────────────────────────────── */

export type PersonaId =
  | "plant-engineer"
  | "maintenance-planner"
  | "reliability-engineer"
  | "instrument-technician"
  | "buyer-desk";

export const personas: { id: PersonaId; label: string }[] = [
  { id: "plant-engineer", label: "Plant engineer" },
  { id: "maintenance-planner", label: "Maintenance planner" },
  { id: "reliability-engineer", label: "Reliability engineer" },
  { id: "instrument-technician", label: "Instrument technician" },
  { id: "buyer-desk", label: "Buyer desk" },
];

/* ── How it was bought ──────────────────────────────────────────────────── */

/**
 * `contract` — against a sourcing agreement.
 * `catalogue` — from the agreed catalogue, the cheapest route to buy.
 * `off-contract` — outside both. This is the leak the control tower exists to find.
 */
export type Channel = "contract" | "catalogue" | "off-contract";

export const channelLabel: Record<Channel, string> = {
  contract: "On agreement",
  catalogue: "From the catalogue",
  "off-contract": "Off contract",
};

/* ── The ledger ─────────────────────────────────────────────────────────── */

export type SpendLine = {
  country: CountryCode;
  category: CategoryId;
  persona: PersonaId;
  channel: Channel;
  supplier: string;
  /** Spend for the quarter, in US dollars after conversion. */
  amount: number;
};

const L = (
  country: CountryCode,
  category: CategoryId,
  persona: PersonaId,
  channel: Channel,
  supplier: string,
  amount: number,
): SpendLine => ({ country, category, persona, channel, supplier, amount });

export const spendLines: SpendLine[] = [
  /* Germany — the largest site, mature contract coverage */
  L("DE", "seals", "plant-engineer", "contract", "Apex Industrial Supply", 214_800),
  L("DE", "seals", "maintenance-planner", "catalogue", "Apex Industrial Supply", 96_400),
  L("DE", "media", "plant-engineer", "contract", "ZirCore Materials", 178_200),
  L("DE", "media", "maintenance-planner", "off-contract", "Rhein Abrasives", 41_600),
  L("DE", "instruments", "instrument-technician", "contract", "Precision Instrument Partners", 132_500),
  L("DE", "instruments", "instrument-technician", "off-contract", "Messtechnik Vogel", 58_900),
  L("DE", "valves", "maintenance-planner", "catalogue", "Apex Industrial Supply", 87_300),
  L("DE", "filtration", "plant-engineer", "catalogue", "Apex Industrial Supply", 64_100),
  L("DE", "motors", "reliability-engineer", "contract", "Drivetec Motion", 121_700),
  L("DE", "services", "buyer-desk", "contract", "Nordwerk Services", 96_800),

  /* Spain — filling and packaging, heavier off-contract */
  L("ES", "seals", "plant-engineer", "contract", "Apex Industrial Supply", 88_400),
  L("ES", "valves", "maintenance-planner", "catalogue", "Apex Industrial Supply", 71_900),
  L("ES", "valves", "maintenance-planner", "off-contract", "Válvulas Serrano", 52_300),
  L("ES", "filtration", "plant-engineer", "catalogue", "Apex Industrial Supply", 58_600),
  L("ES", "filtration", "plant-engineer", "off-contract", "Filtros Levante", 37_400),
  L("ES", "instruments", "instrument-technician", "contract", "Precision Instrument Partners", 44_200),
  L("ES", "motors", "reliability-engineer", "off-contract", "Motores Del Sur", 63_800),
  L("ES", "services", "buyer-desk", "contract", "Nordwerk Services", 51_500),

  /* France — resin and additives */
  L("FR", "seals", "plant-engineer", "contract", "Apex Industrial Supply", 102_600),
  L("FR", "media", "plant-engineer", "contract", "ZirCore Materials", 84_900),
  L("FR", "instruments", "instrument-technician", "contract", "Precision Instrument Partners", 76_300),
  L("FR", "valves", "maintenance-planner", "catalogue", "Apex Industrial Supply", 55_100),
  L("FR", "filtration", "plant-engineer", "off-contract", "Filtration Duval", 29_700),
  L("FR", "motors", "reliability-engineer", "contract", "Drivetec Motion", 68_400),
  L("FR", "services", "buyer-desk", "off-contract", "Atelier Mécanique Rive", 43_200),

  /* China — newest site, catalogue adoption still low */
  L("CN", "seals", "plant-engineer", "contract", "Apex Industrial Supply", 76_500),
  L("CN", "seals", "plant-engineer", "off-contract", "Lianhe Sealing Works", 64_200),
  L("CN", "media", "plant-engineer", "contract", "ZirCore Materials", 112_300),
  L("CN", "media", "maintenance-planner", "off-contract", "Huaxin Grinding", 58_100),
  L("CN", "instruments", "instrument-technician", "off-contract", "Yuanda Instruments", 71_400),
  L("CN", "valves", "maintenance-planner", "off-contract", "Zhonghe Valve", 49_800),
  L("CN", "filtration", "plant-engineer", "catalogue", "Apex Industrial Supply", 31_600),
  L("CN", "motors", "reliability-engineer", "contract", "Drivetec Motion", 54_700),

  /* United States — technical centre, smaller but well controlled */
  L("US", "instruments", "instrument-technician", "contract", "Precision Instrument Partners", 94_800),
  L("US", "seals", "plant-engineer", "catalogue", "Apex Industrial Supply", 47_300),
  L("US", "media", "plant-engineer", "contract", "ZirCore Materials", 39_600),
  L("US", "filtration", "plant-engineer", "catalogue", "Apex Industrial Supply", 26_900),
  L("US", "services", "buyer-desk", "contract", "Nordwerk Services", 62_400),
];

/* ── Suppliers ──────────────────────────────────────────────────────────── */

export type Supplier = {
  name: string;
  /** Countries this supplier serves. */
  serves: CountryCode[];
  /** Share of their deliveries that arrived on the promised date. */
  onTime: number;
  /** Share of their invoices that matched first time. */
  invoiceAccuracy: number;
  /** True when only this supplier can serve a category we depend on. */
  singleSource: boolean;
  /** Whether we hold a live agreement with them. */
  underAgreement: boolean;
};

export const suppliers: Supplier[] = [
  { name: "Apex Industrial Supply", serves: ["DE", "ES", "FR", "CN", "US"], onTime: 0.96, invoiceAccuracy: 0.94, singleSource: false, underAgreement: true },
  { name: "ZirCore Materials", serves: ["DE", "FR", "CN", "US"], onTime: 0.92, invoiceAccuracy: 0.97, singleSource: true, underAgreement: true },
  { name: "Precision Instrument Partners", serves: ["DE", "ES", "FR", "US"], onTime: 0.89, invoiceAccuracy: 0.91, singleSource: false, underAgreement: true },
  { name: "Drivetec Motion", serves: ["DE", "FR", "CN"], onTime: 0.94, invoiceAccuracy: 0.96, singleSource: false, underAgreement: true },
  { name: "Nordwerk Services", serves: ["DE", "ES", "US"], onTime: 0.91, invoiceAccuracy: 0.93, singleSource: false, underAgreement: true },
  { name: "Rhein Abrasives", serves: ["DE"], onTime: 0.82, invoiceAccuracy: 0.78, singleSource: false, underAgreement: false },
  { name: "Messtechnik Vogel", serves: ["DE"], onTime: 0.86, invoiceAccuracy: 0.81, singleSource: false, underAgreement: false },
  { name: "Válvulas Serrano", serves: ["ES"], onTime: 0.79, invoiceAccuracy: 0.74, singleSource: false, underAgreement: false },
  { name: "Filtros Levante", serves: ["ES"], onTime: 0.84, invoiceAccuracy: 0.80, singleSource: false, underAgreement: false },
  { name: "Motores Del Sur", serves: ["ES"], onTime: 0.77, invoiceAccuracy: 0.72, singleSource: false, underAgreement: false },
  { name: "Filtration Duval", serves: ["FR"], onTime: 0.88, invoiceAccuracy: 0.85, singleSource: false, underAgreement: false },
  { name: "Atelier Mécanique Rive", serves: ["FR"], onTime: 0.81, invoiceAccuracy: 0.76, singleSource: false, underAgreement: false },
  { name: "Lianhe Sealing Works", serves: ["CN"], onTime: 0.83, invoiceAccuracy: 0.79, singleSource: false, underAgreement: false },
  { name: "Huaxin Grinding", serves: ["CN"], onTime: 0.80, invoiceAccuracy: 0.75, singleSource: false, underAgreement: false },
  { name: "Yuanda Instruments", serves: ["CN"], onTime: 0.78, invoiceAccuracy: 0.73, singleSource: false, underAgreement: false },
  { name: "Zhonghe Valve", serves: ["CN"], onTime: 0.76, invoiceAccuracy: 0.71, singleSource: false, underAgreement: false },
];

export const supplierByName: Record<string, Supplier> = suppliers.reduce(
  (acc, s) => ((acc[s.name] = s), acc),
  {} as Record<string, Supplier>,
);

/* ════════════════════════════════════════════════════════════════════════
 * Selectors — every number the control tower shows is produced here.
 * ════════════════════════════════════════════════════════════════════════ */

export type Filter = { country: CountryCode | "all"; persona: PersonaId | "all" };

export const applyFilter = (lines: SpendLine[], f: Filter): SpendLine[] =>
  lines.filter(
    (l) =>
      (f.country === "all" || l.country === f.country) &&
      (f.persona === "all" || l.persona === f.persona),
  );

export const total = (lines: SpendLine[]): number =>
  lines.reduce((s, l) => s + l.amount, 0);

export const offContract = (lines: SpendLine[]): number =>
  total(lines.filter((l) => l.channel === "off-contract"));

/** The share of spend that leaked outside an agreement or the catalogue. */
export const offContractShare = (lines: SpendLine[]): number => {
  const t = total(lines);
  return t === 0 ? 0 : offContract(lines) / t;
};

export const byCountry = (lines: SpendLine[]) =>
  sites
    .map((s) => {
      const mine = lines.filter((l) => l.country === s.country);
      return {
        country: s.country,
        name: s.countryName,
        site: s.site,
        lang: s.lang,
        spend: total(mine),
        offContract: offContract(mine),
        offShare: offContractShare(mine),
      };
    })
    .filter((r) => r.spend > 0)
    .sort((a, b) => b.spend - a.spend);

export const byCategory = (lines: SpendLine[]) =>
  categories
    .map((c) => {
      const mine = lines.filter((l) => l.category === c.id);
      return {
        id: c.id,
        label: c.label,
        spend: total(mine),
        offContract: offContract(mine),
      };
    })
    .filter((r) => r.spend > 0)
    .sort((a, b) => b.spend - a.spend);

export const byChannel = (lines: SpendLine[]) =>
  (["contract", "catalogue", "off-contract"] as Channel[])
    .map((ch) => {
      const mine = lines.filter((l) => l.channel === ch);
      return { channel: ch, label: channelLabel[ch], spend: total(mine) };
    })
    .filter((r) => r.spend > 0);

export const byPersona = (lines: SpendLine[]) =>
  personas
    .map((p) => {
      const mine = lines.filter((l) => l.persona === p.id);
      return {
        id: p.id,
        label: p.label,
        spend: total(mine),
        offShare: offContractShare(mine),
      };
    })
    .filter((r) => r.spend > 0)
    .sort((a, b) => b.spend - a.spend);

/** Supplier roll-up with the risk flags the buyer needs to see. */
export const bySupplier = (lines: SpendLine[]) => {
  const names = [...new Set(lines.map((l) => l.supplier))];
  return names
    .map((name) => {
      const mine = lines.filter((l) => l.supplier === name);
      const s = supplierByName[name];
      const spend = total(mine);
      return {
        name,
        spend,
        countries: [...new Set(mine.map((l) => l.country))],
        onTime: s?.onTime ?? 0,
        invoiceAccuracy: s?.invoiceAccuracy ?? 0,
        singleSource: s?.singleSource ?? false,
        underAgreement: s?.underAgreement ?? false,
      };
    })
    .sort((a, b) => b.spend - a.spend);
};

/* ── Risk indicators — derived, never asserted ──────────────────────────── */

export type RiskFlag = {
  id: string;
  severity: "high" | "watch";
  title: string;
  detail: string;
  value: number;
};

/**
 * The things a procurement lead would want flagged, worked out from the ledger
 * rather than written down: where spend leaks, who we cannot replace, and who
 * bills or delivers badly enough to cost us time.
 */
export function riskFlags(lines: SpendLine[]): RiskFlag[] {
  const flags: RiskFlag[] = [];

  /* Countries whose off-contract share is worse than the network average. */
  const networkShare = offContractShare(lines);
  for (const c of byCountry(lines)) {
    if (c.offShare > networkShare && c.offShare > 0.2) {
      flags.push({
        id: `off-${c.country}`,
        severity: c.offShare > 0.35 ? "high" : "watch",
        title: `${c.name} buys too much outside agreements`,
        detail: `${Math.round(c.offShare * 100)}% of ${c.name}'s spend sits outside an agreement or the catalogue, against ${Math.round(networkShare * 100)}% across the network.`,
        value: c.offContract,
      });
    }
  }

  /* Anything we can only buy from one supplier. */
  for (const s of bySupplier(lines)) {
    if (s.singleSource && s.spend > 0) {
      flags.push({
        id: `single-${s.name}`,
        severity: "high",
        title: `${s.name} is the only source we have`,
        detail: `${usd(s.spend, 0)} of spend depends on a supplier with no qualified alternative. A second source needs qualifying.`,
        value: s.spend,
      });
    }
  }

  /* Suppliers whose invoices routinely fail the match. */
  for (const s of bySupplier(lines)) {
    if (s.invoiceAccuracy > 0 && s.invoiceAccuracy < 0.8) {
      flags.push({
        id: `acc-${s.name}`,
        severity: "watch",
        title: `${s.name} bills wrongly too often`,
        detail: `Only ${Math.round(s.invoiceAccuracy * 100)}% of their invoices match first time, so every order costs us checking and chasing.`,
        value: s.spend,
      });
    }
  }

  return flags.sort((a, b) => b.value - a.value);
}

/* ── Conversational answers ─────────────────────────────────────────────── */

export type TowerQuestion = {
  id: string;
  ask: string;
  /** Worked out live so the answer can never drift from the charts. */
  answer: (lines: SpendLine[]) => string;
};

export const towerQuestions: TowerQuestion[] = [
  {
    id: "q-off",
    ask: "Where are we buying outside our agreements?",
    answer: (l) => {
      const worst = byCountry(l).slice().sort((a, b) => b.offShare - a.offShare)[0];
      if (!worst) return "There is no spend in the current view.";
      return `${worst.name} is the worst, with ${usd(worst.offContract, 0)} — ${Math.round(worst.offShare * 100)}% of everything that site spends — bought outside an agreement or the catalogue. Across the whole network the figure is ${Math.round(offContractShare(l) * 100)}%, so bringing ${worst.name} in line is the single biggest thing available.`;
    },
  },
  {
    id: "q-cat",
    ask: "Which category costs us the most?",
    answer: (l) => {
      const top = byCategory(l)[0];
      if (!top) return "There is no spend in the current view.";
      const share = total(l) === 0 ? 0 : top.spend / total(l);
      return `${top.label}, at ${usd(top.spend, 0)} — ${Math.round(share * 100)}% of the spend in view. Of that, ${usd(top.offContract, 0)} is bought outside an agreement.`;
    },
  },
  {
    id: "q-supplier",
    ask: "Who are we most exposed to?",
    answer: (l) => {
      const ranked = bySupplier(l);
      const top = ranked[0];
      if (!top) return "There is no spend in the current view.";
      const single = ranked.find((s) => s.singleSource);

      /* When the only source is also the biggest supplier there is one story to
         tell, not two — saying both would contradict itself. */
      if (single && single.name === top.name) {
        return `${single.name}, and doubly so: they are both our largest supplier in this view at ${usd(single.spend, 0)} and the one category where we have no qualified alternative. Qualifying a second source here is the single most valuable thing to do.`;
      }
      if (single) {
        return `${single.name} is the real exposure: ${usd(single.spend, 0)} of spend with no qualified alternative supplier. Our largest supplier by value is ${top.name} at ${usd(top.spend, 0)}, but we hold alternatives there.`;
      }
      return `${top.name}, at ${usd(top.spend, 0)} across ${top.countries.length} ${top.countries.length === 1 ? "country" : "countries"}. We hold alternatives for everything they supply.`;
    },
  },
  {
    id: "q-persona",
    ask: "Which role should we help first?",
    answer: (l) => {
      const worst = byPersona(l)
        .slice()
        .sort((a, b) => b.offShare - a.offShare)[0];
      if (!worst) return "There is no spend in the current view.";
      return `${worst.label}s. ${Math.round(worst.offShare * 100)}% of what they buy sits outside an agreement, on ${usd(worst.spend, 0)} of spend. Guided buying aimed at that role would move more than any policy change.`;
    },
  },
];
