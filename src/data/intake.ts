/**
 * Dummy data backing the Intake Agent console — the inbox queue it reads, the
 * preferred-supplier / contract list and the spending-policy library it checks
 * against. The flagged belt email is the live one that drives the requisition
 * ceremony; the rest give the inbox a realistic mill-procurement texture.
 */

export type IntakeEmail = {
  id: string;
  from: string;
  fromRole: string;
  subject: string;
  preview: string;
  body: string[];
  time: string;
  unread: boolean;
  flagged?: boolean;
  priority?: "high" | "normal";
  /** Tag shown on already-handled mail (query-resolved, routed, etc.). */
  handledTag?: string;
  /** Only the live request runs the AI-analysis → requisition ceremony. */
  actionable?: boolean;
};

export const intakeInbox: IntakeEmail[] = [
  {
    id: "mail-belt",
    from: "Dale Whitfield",
    fromRole: "Reliability Lead · Containerboard mill",
    subject: "Corrugator No.2 — double-backer belt at wear limit",
    preview:
      "The No.2 double-backer belt is past its wear limit on this morning's inspection — we need a replacement before it takes the line down…",
    body: [
      "Hi — the double-backer belt on Corrugator No.2 is reading past its wear limit on this morning's inspection. We're seeing edge fraying and about a 4% speed loss. If it lets go we lose the line.",
      "Can you raise a replacement? It's the BeltPro 88-DBX we've run before. We need it at the mill inside the week so we can swap it on the next maintenance window.",
      "Thanks — Dale",
    ],
    time: "09:01",
    unread: true,
    flagged: true,
    priority: "high",
    actionable: true,
  },
  {
    id: "mail-gloves",
    from: "Invoice Resolution",
    fromRole: "Ticket #PRC-3318",
    subject: "Re: Safety gloves reorder — auto-resolved",
    preview:
      "Your cut-resistant glove reorder was matched to the Memphis Safety auto-replenish catalog and confirmed. No action needed…",
    body: [
      "Your cut-resistant glove reorder (line MNT-1187) was matched to the Memphis Safety auto-replenish catalog and confirmed.",
      "Closed automatically with the cited PPE replenishment policy. No action needed.",
    ],
    time: "08:42",
    unread: false,
    handledTag: "Auto-resolved · query",
  },
  {
    id: "mail-laptops",
    from: "Maria Gomez",
    fromRole: "Finance · Memphis",
    subject: "Laptop refresh for two new analysts",
    preview:
      "Two starters join the FP&A team on the 15th — can we get them on the standard laptop build…",
    body: [
      "Two starters join the FP&A team on the 15th — can we get them on the standard laptop build?",
      "Standard IT hardware, on the punchout catalog. Routed to the IT category queue.",
    ],
    time: "Yesterday",
    unread: true,
    handledTag: "Routed · IT category",
  },
  {
    id: "mail-belt-pricelist",
    from: "BeltPro Industrial",
    fromRole: "Supplier portal",
    subject: "2026 framework price list attached",
    preview:
      "Updated framework pricing for the conveyor & belting catalog, effective Q3. −8% vs list maintained…",
    body: [
      "Updated framework pricing for the conveyor & belting catalog, effective Q3.",
      "The −8% vs list discount on outline agreement 4600001207 is maintained. Filed against the contract record.",
    ],
    time: "Mon",
    unread: false,
    handledTag: "Filed to contract",
  },
];

export type PreferredSupplier = {
  supplier: string;
  category: string;
  contractRef: string;
  kind: "Contracted" | "Preferred" | "Spot";
  terms: string;
  /** Highlight the match for the live belt request. */
  match?: boolean;
};

export const preferredSuppliers: PreferredSupplier[] = [
  {
    supplier: "BeltPro Industrial",
    category: "Conveyor & belting (MRO-CONV)",
    contractRef: "4600001207",
    kind: "Contracted",
    terms: "Net 30 · −8% vs list · 5-day lead",
    match: true,
  },
  {
    supplier: "Heartland Rubber",
    category: "Conveyor & belting",
    contractRef: "—",
    kind: "Preferred",
    terms: "Net 30 · spot quotes · 7–10 day lead",
  },
  {
    supplier: "Apex Power Transmission",
    category: "Drives & bearings",
    contractRef: "4600000934",
    kind: "Contracted",
    terms: "Net 45 · −5% vs list",
  },
  {
    supplier: "Grainger",
    category: "General MRO & consumables",
    contractRef: "4600000511",
    kind: "Contracted",
    terms: "Punchout catalog · Net 30",
  },
  {
    supplier: "Memphis Safety Co",
    category: "PPE & safety",
    contractRef: "4600001102",
    kind: "Contracted",
    terms: "Net 30 · auto-replenish",
  },
];

export type SpendingPolicy = {
  title: string;
  ref: string;
  rule: string;
  /** Highlight the policy that governs the live request. */
  match?: boolean;
};

export const spendingPolicies: SpendingPolicy[] = [
  {
    title: "MRO & maintenance buying",
    ref: "POL-MRO-04",
    rule: "On-contract replacements ≤ $50,000 auto-submit at L3; off-contract or above routes to the category manager.",
    match: true,
  },
  {
    title: "Off-contract approval matrix",
    ref: "POL-APP-11",
    rule: "Off-contract spend over $5,000 needs a documented three-bid or a sole-source justification.",
  },
  {
    title: "Capital vs expense",
    ref: "POL-FIN-02",
    rule: "MRO parts under $5,000 expense to the cost center; assemblies over $5,000 flag for capital review.",
  },
  {
    title: "Preferred supplier first",
    ref: "POL-SRC-07",
    rule: "Route to a contracted or preferred supplier where one covers the category before sourcing a new vendor.",
  },
  {
    title: "Emergency maintenance buy",
    ref: "POL-MRO-09",
    rule: "Production-down replacements may ship same-day on a verbal PO, documented and reconciled within 24 hours.",
  },
];
