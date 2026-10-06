/**
 * What lands on the intake desk, and what the agent makes of it.
 *
 * Demand does not arrive as one thing. A plant engineer writes an email in
 * whatever language they work in; a maintenance work order reserves a part;
 * a supplier asks through the portal. This file is the desk's own record of
 * those channels — three of them, each with the demand it carries.
 *
 * Everything a channel shows is read back out of the guided run it belongs to
 * (`flowRuns[flow].steps[0]`): the original document, the fields the agent
 * fills, the requisition it produces. That is deliberate. If the intake desk
 * kept its own copy of the seal email, the desk and the run could drift into
 * telling two versions of the same story — and nobody would notice until a
 * client did.
 *
 * Nothing here writes to the store. These requisitions already exist; the desk
 * replays how they arrived.
 */

import * as React from "react";
import type { FlowId } from "@/mro/state";
import { flowRuns } from "@/mro/data/flowRuns";
import { requisitions, type Lang } from "@/mro/data/procurement";

/** One field the agent fills in on the request form. */
export type FillField = { label: string; value: string };

/**
 * One thing the desk can play: a row you clicked, or a phrase you typed.
 * Both take the same path — read, think, reason, fill — so the code below
 * never has to care which one it is.
 */
export type IntakeSpec = {
  id: string;
  /** Shown at the top of the AI column while it works. */
  asked: string;
  /** The document as it arrived. Null when you told the agent directly. */
  original: React.ReactNode | null;
  originalLabel: string;
  originalMeta: string;
  /** How long the agent reads before it starts reasoning aloud. */
  think: number;
  /** What it says, line by line. */
  lines: string[];
  conclusion: string;
  /** What it writes into the form. */
  fields: FillField[];
  /** Gap between fields. 0 fills them in one go. */
  stagger: number;
  /** The requisition this produces, rendered 1:1. */
  receipt: React.ReactNode;
  receiptLabel: string;
  /** How the receipt should read — not every request comes out clean. */
  receiptStatus: string;
  /** Where the run continues, and how it was sourced. */
  flow: FlowId;
  sourcing: "contract" | "rfq";
};

/** A channel card on the desk, and the demand sitting in it. */
export type Channel = {
  id: string;
  label: string;
  icon: "mail" | "workOrder" | "portal";
  /** Where it came from, in one short phrase. */
  meta: string;
  /** The live row — the only one you can open. */
  open: { text: string; lang: Lang; spec: IntakeSpec };
  /** Already dealt with, shown for context. Not clickable, no ids. */
  history: { text: string; note: string }[];
};

/* ── Reading the runs ───────────────────────────────────────────────────── */

const step0 = (flow: FlowId) => flowRuns[flow].steps[0];

/** The document the agent read first — the thing that actually arrived. */
const originalOf = (flow: FlowId) => step0(flow).sources?.[0];

/** Every field the run's own extraction fills, flattened, keyed by its label. */
const runFields = (flow: FlowId): Record<string, string> =>
  Object.fromEntries(
    (step0(flow).stages ?? []).flatMap((s) => s.fields ?? []).map((f) => [f.label, f.value]),
  );

/**
 * The six things the request form asks for, filled from the run's own
 * extraction. The run codes far more than six fields — material group, G/L,
 * purchasing group — but those are the system's business, not the buyer's.
 * `pick` takes the first of several candidate labels that the run actually
 * produced, so a case that words a field differently still lands correctly.
 */
const pick = (f: Record<string, string>, ...labels: string[]) =>
  labels.map((l) => f[l]).find(Boolean) ?? "";

/** The requisition this run belongs to — the same record every page reads. */
const recordFor = (flow: FlowId) => requisitions.find((r) => r.flow === flow);

/**
 * The item in words a person would use — "Diaphragm — PTFE — 2 in", never
 * the material code. The code is real and it belongs on the requisition; it
 * just isn't what anyone says out loud, so it stays on the document and off
 * the form. Same rule the dashboard uses: drop any segment carrying a number.
 */
const plainItem = (description: string) =>
  description
    .split(" — ")
    .filter((seg) => !/\d/.test(seg))
    .slice(0, 2)
    .join(" — ");

const formFields = (flow: FlowId, extra: { why: string }): FillField[] => {
  const f = runFields(flow);
  /* The supplier is not chosen at intake — sourcing decides that later. What
     the agent does know is which agreement covers this material, so that is
     what it proposes. */
  const rec = recordFor(flow);
  return [
    { label: "What to buy", value: rec ? plainItem(rec.description) : pick(f, "Material") },
    { label: "How many", value: pick(f, "Quantity") },
    { label: "Plant & line", value: pick(f, "Plant", "Requisitioner", "Requestor") },
    { label: "Needed by", value: pick(f, "Delivery date", "Delivery") },
    { label: "Why", value: extra.why },
    {
      label: "Supplier & agreement",
      value: rec ? `${rec.vendor} · ${rec.agreement}` : "",
    },
  ];
};

/* ── The three channels ─────────────────────────────────────────────────── */

/**
 * The seal is the one we take our time over: it arrives in German, the
 * engineer gave a range instead of a size, and it is the request that goes on
 * to be held. Everything else moves quickly, because it should.
 */
/* The catalogue buy — an item the plant orders every quarter, arriving as
   free text for the umpteenth time. That is the story. */
const filterSpec: IntakeSpec = {
  id: "filter",
  asked: "Filterbeutel für eine Entstaubungslinie",
  original: originalOf("catalogue")?.body ?? null,
  originalLabel: "Notiz des Ingenieurs",
  originalMeta: "Intake-Portal · auf Deutsch verfasst · 09:04",
  think: 2600,
  lines: [
    "Ich lese die Notiz — sie ist auf Deutsch und kommt von Entgratlinie 1",
    "Das ist der vierteljährliche Filterwechsel, kein Ausfall",
    "Der Ingenieur hat die Materialnummer direkt angegeben",
    "Der Artikel ist seit fünf Jahren im Katalog",
    "Ich prüfe, wie diese Warengruppe sonst bei uns eingeht",
  ],
  conclusion:
    "Vierhundert Filterbeutel für den Wechsel im dritten Quartal — ein Katalogartikel, den wir jedes Quartal kaufen. Beim Artikel ist keine Entscheidung nötig. Auffällig ist nur, dass die Anforderung überhaupt per E-Mail kam.",
  fields: formFields("catalogue", { why: "Vierteljährlicher Filterwechsel — Q3" }),
  stagger: 100,
  receipt: step0("catalogue").document,
  receiptLabel: "PR-48702 · structured requisition",
  receiptStatus: "Raised · a catalogue line, priced on agreement",
  flow: "catalogue",
  sourcing: "contract",
};

const bearingSpec: IntakeSpec = {
  id: "bearing",
  asked: "Pump diaphragms for a mixing line",
  original: originalOf("bearing")?.body ?? null,
  originalLabel: "Planned-maintenance request",
  originalMeta: "Maintenance system · written in German · 08:12",
  think: 1800,
  lines: [
    "Reading the planned-maintenance request — it is in German",
    "Translating it, then matching the part number the planner gave outright",
    "It is on our agreement, and there is none in stock",
  ],
  conclusion:
    "Six pump diaphragms for the July shutdown, on contract at the agreed price. Nothing about this one needs a person.",
  fields: formFields("bearing", { why: "Planned maintenance — July shutdown" }),
  stagger: 0,
  receipt: step0("bearing").document,
  receiptLabel: "PR-48692 · structured requisition",
  receiptStatus: "Raised · clean, releasing on its own",
  flow: "bearing",
  sourcing: "contract",
};

const mediaSpec: IntakeSpec = {
  id: "media",
  asked: "Grinding media for the mill",
  original: originalOf("gearbox")?.body ?? null,
  originalLabel: "Message from the plant",
  originalMeta: "Supplier portal · Chinese · 11:20",
  think: 1800,
  lines: [
    "Reading the request from Deburring Line 3",
    "Matching the media grade and bag size",
    "Checking what is already open for this line",
  ],
  conclusion:
    "Grinding media for Deburring Line 3. I have coded it — but something very like it is already open, so that is worth looking at first.",
  fields: formFields("gearbox", { why: "Media worn — mill throughput dropping" }),
  stagger: 0,
  receipt: step0("gearbox").document,
  receiptLabel: "PR-48655 · structured requisition",
  receiptStatus: "Raised · check it against an open request",
  flow: "gearbox",
  sourcing: "rfq",
};

export const channels: Channel[] = [
  {
    id: "email",
    label: "Email",
    icon: "mail",
    meta: "From the plants, in their own language",
    open: { text: "Filter bags for a let-down line", lang: "de", spec: filterSpec },
    history: [
      { text: "Hydraulic oil for the boiler house", note: "Sent back — grade not given" },
      { text: "Gasket set for a transfer pump", note: "Released last week" },
    ],
  },
  {
    id: "work-order",
    label: "Work order",
    icon: "workOrder",
    meta: "Raised by planned maintenance",
    open: { text: "Pump diaphragms for a mixing line", lang: "de", spec: bearingSpec },
    history: [
      { text: "Coupling inserts for a drive", note: "Released last week" },
      { text: "Temperature probe for a winding line", note: "Being validated" },
    ],
  },
  {
    id: "portal",
    label: "Portal",
    icon: "portal",
    meta: "Suppliers and plants writing in",
    open: { text: "Grinding media for the mill", lang: "zh", spec: mediaSpec },
    history: [
      { text: "Filter bags for the deburring line", note: "Covered from another plant" },
      { text: "Valve seals for a filling line", note: "Released last week" },
    ],
  },
];

/* ── Telling the agent directly ─────────────────────────────────────────── */

/**
 * The same machinery, started from a phrase instead of a document. There is
 * nothing to read, so the agent goes straight to reasoning — and because it
 * is working from what you said rather than from a file, it says what it had
 * to assume.
 */
export const chips: { label: string; spec: IntakeSpec }[] = [
  {
    label: "Restock before the change",
    spec: {
      ...filterSpec,
      id: "chip-restock",
      asked: "We need filter bags before the Q3 change",
      original: null,
      think: 1600,
      lines: [
        "You want bags for the Q3 change, so this is planned, not a breakdown",
        "The let-down lines run the 25 micron size 2 bag — that is what I am pricing",
        "It is a catalogue item on our agreement with the usual supplier",
        "I have set the quantity to the usual quarterly change",
      ],
      conclusion:
        "I have filled this in from what you said and priced it on the agreement. Check the quantity before you raise it — I assumed the 400 the line normally takes.",
      stagger: 120,
    },
  },
  {
    label: "Restock a spare",
    spec: {
      ...bearingSpec,
      id: "chip-restock",
      asked: "We need to restock pump diaphragms before the shutdown",
      original: null,
      think: 1400,
      lines: [
        "This is a restock, so there is no breakdown driving the date",
        "Pulling the quantity the shutdown normally consumes",
        "Pricing it against the agreement",
      ],
      conclusion:
        "Filled in for the July shutdown at the agreed price. Change the quantity if the plant wants more cover.",
      stagger: 120,
    },
  },
];
