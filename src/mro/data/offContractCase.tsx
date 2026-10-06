/**
 * Buying with no agreement behind you.
 *
 * There is no contract covering this grade, so there is nothing to fall back
 * on: no agreed price, no agreed lead time, no cover if it fails. The only
 * honest way to buy it is to go to the market and take real quotes.
 *
 * The suppliers are mostly German, because the plant is — you do not source a
 * lamination grade for a winding line from four different suppliers. Three
 * local firms and one overseas manufacturer is what the market actually looks
 * like, and it is why three of the four requests go out in German.
 *
 * The run is deliberately short. Without a contract there is no contract to
 * check and no warranty position to argue, so the steps that exist on the
 * clean run would be theatre here: read the request, go to market, weigh what
 * came back, raise the order.
 *
 * The cheapest quote does not win. The line is down, and four extra days of a
 * stopped line costs more than the money saved — the agent says that out loud
 * and a person still decides.
 */

import type { RunStep, InboundEmail } from "@/mro/data/runSteps";
import { requisitions, usd } from "@/mro/data/procurement";
import { requisitionDoc } from "@/mro/lib/prDoc";
import { StructuredPrDoc } from "@/mro/components/docs/pr/PrDocs";
import { RecordDoc } from "@/mro/components/docs/pr/SapDocs";
import { MultilingualEmailDoc } from "@/mro/components/docs/pr/MultilingualEmail";

/** The requisition this run is about — exported so the board can link to it. */
export const OFF_CATALOGUE_PR = "PR-48696";
const REC = requisitions.find((r) => r.id === OFF_CATALOGUE_PR)!;
const RFQ = "RFQ-48696";
const NEED_BY = "2026-07-03";

/*
 * What each supplier came back with. One place, so nothing can disagree.
 *
 * A quotation for a part nobody has a contract for is not just a number: the
 * price only means something once you know what it is a price *for*. So each
 * one carries what an industrial quotation actually carries — a volume break,
 * how long the price stands, who pays the freight, what happens if you cancel,
 * and whether the supplier will stand behind the delivery date. Those clauses
 * are where the cheapest number stops being the cheapest buy, and the
 * comparison downstream is computed from exactly these fields.
 */
const Q = {
  rhein: {
    unit: 3310,
    lead: "7 days",
    /** Price breaks the supplier offered — what the next unit would cost. */
    tiers: [
      { from: 1, to: 5, unit: 3610 },
      { from: 6, to: 11, unit: 3450 },
      { from: 12, to: null, unit: 3310 },
    ],
    validDays: 30,
    terms: "Net 30",
    /** Settlement discount for paying early, as a share of the goods value. */
    settle: { pct: 0, days: 0 },
    incoterm: "DAP · Winding Plant (Incoterms 2020)",
    /** What lands on the invoice on top of the goods. */
    freight: 0,
    freightNote: "Carriage included · part load",
    build: "From distributor stock in Cologne · part load",
    cancel: "Cancellable up to dispatch · 20% restocking after",
    warranty: "Certificate of analysis per batch · 12 months shelf life",
    lateTerms: "No delivery penalty offered",
    surcharge: "Price firm within validity",
  },
  nordwest: {
    unit: 3140,
    lead: "9 days",
    tiers: [
      { from: 1, to: 5, unit: 3480 },
      { from: 6, to: 11, unit: 3290 },
      { from: 12, to: null, unit: 3140 },
    ],
    validDays: 21,
    terms: "Net 45",
    settle: { pct: 2, days: 10 },
    incoterm: "EXW · works, Osnabrück (Incoterms 2020)",
    freight: 1_450,
    freightNote: "Buyer arranges haulage · est. $1,450 for 12 t",
    build: "From the next production campaign · no blend charge",
    cancel: "Non-cancellable once the campaign is scheduled",
    warranty: "Certificate of analysis per batch · 9 months shelf life",
    lateTerms: "No delivery penalty offered",
    surcharge: "Ore and energy surcharge reviewed quarterly",
  },
  sued: {
    unit: 3255,
    lead: "5 days",
    tiers: [
      { from: 1, to: 5, unit: 3540 },
      { from: 6, to: 11, unit: 3380 },
      { from: 12, to: null, unit: 3255 },
    ],
    validDays: 30,
    terms: "Net 30",
    settle: { pct: 3, days: 14 },
    incoterm: "DAP · Winding Plant (Incoterms 2020)",
    freight: 0,
    freightNote: "Carriage included · full truckload to plant",
    build: "Ex stock · full 12 t available, ships this week",
    cancel: "Cancellable up to dispatch · no restocking fee",
    warranty: "Certificate of analysis per batch · 18 months shelf life",
    lateTerms: "0.5% per week late, capped at 5%",
    surcharge: "Price firm within validity",
  },
} as const;
const PICK = "sued";

/** The clauses that decide what a quoted number is actually worth. */
const cardTerms = (q: Quote) => [
  { label: "Break applied", value: `${q.tiers[2].from}+ t · ${usd(q.tiers[2].unit)} / t` },
  {
    label: "Settlement",
    value: q.settle.pct ? `${q.settle.pct}% in ${q.settle.days} days` : "None offered",
    tone: (q.settle.pct ? "good" : "warn") as "good" | "warn",
  },
  {
    label: "Freight",
    value: q.freight ? `${usd(q.freight)} · EXW` : "Included · DAP",
    tone: (q.freight ? "warn" : "good") as "good" | "warn",
  },
  {
    label: "Cancellation",
    value: q.cancel.startsWith("Non-cancellable") ? "Locked once released" : q.cancel.split(" · ")[0],
    tone: (q.cancel.startsWith("Non-cancellable") ? "warn" : "good") as "good" | "warn",
  },
  {
    label: "Late delivery",
    value: q.lateTerms === "No delivery penalty offered" ? "No penalty" : q.lateTerms,
    tone: (q.lateTerms === "No delivery penalty offered" ? "warn" : "good") as "good" | "warn",
  },
  { label: "Quality & shelf life", value: q.warranty.replace("Certificate of analysis per batch · ", "CoA per batch · ") },
  { label: "Quote valid", value: `${q.validDays} days` },
];
const EXTRA = Q.sued.unit - Q.nordwest.unit;

/**
 * What the buy actually costs once the clauses are applied: the goods, plus
 * whatever freight the Incoterm leaves with us, less the settlement discount
 * if we pay inside the window. Computed, never retyped — this is the number
 * the comparison turns on, and the sticker price is not it.
 */
type Quote = (typeof Q)[keyof typeof Q];
const landed = (q: Quote, qty: number) =>
  q.unit * qty + q.freight - Math.round(q.unit * qty * (q.settle.pct / 100) * 100) / 100;

/* ── The request, and the fact that nothing covers it ───────────────────── */

const prDoc = <StructuredPrDoc pr={requisitionDoc(REC)} highlightLabel="Supplier" />;

const noAgreementDoc = (
  <RecordDoc
    d={{
      tcode: "ME33K",
      tname: "Display Contract",
      number: "—",
      status: "No agreement found",
      docType: "Source of supply · search result",
      system: "Purchasing · contracts",
      createdOn: "2026-06-20 · 10:52",
      createdBy: "Sourcing & contract agent",
      sections: [
        {
          band: "What was searched",
          rows: [
            { label: "Material", value: REC.material },
            { label: "Material group", value: "MRO · Raw materials · electrical steel" },
            { label: "Outline agreements", value: "None covering this material" },
            { label: "Source list", value: "No entry" },
            { label: "Info records", value: "None" },
          ],
        },
      ],
      determination: {
        ok: false,
        text: "Nothing on file covers this grade — no agreement, no source list entry, no price we have ever agreed. There is no on-contract route to fall back on, so the only way to price it honestly is a competitive request for quotation.",
      },
    }}
  />
);

const rfqDoc = (
  <RecordDoc
    d={{
      tcode: "ME41N",
      tname: "Create RFQ",
      number: RFQ,
      status: "Sent · awaiting quotes",
      docType: "Request for quotation · grain-oriented electrical steel · 12 t",
      system: "Purchasing · RFQ",
      createdOn: "2026-06-20 · 11:05",
      createdBy: "Sourcing & contract agent",
      sections: [
        {
          band: "RFQ header",
          rows: [
            { label: "Material", value: REC.material },
            { label: "Quantity", value: `${REC.qty} ${REC.uom}` },
            { label: "Specification", value: "Grain-oriented · C5 insulation coated · coil stock" },
            { label: "Need-by", value: `${NEED_BY} · line down` },
            { label: "Terms sought", value: "Net 30 · FCA" },
          ],
        },
        {
          band: "Suppliers solicited",
          rows: [
            { label: "Rheinstahl Elektroblech GmbH", value: "Germany · distributor" },
            { label: "Nordfarben Chemie GmbH", value: "Germany · distributor" },
            { label: "Süddeutsche Elektrobleche", value: "Germany · manufacturer" },
            { label: "Hengtai Electrical Steel (Jiangsu)", value: "China · manufacturer" },
          ],
        },
      ],
    }}
  />
);

/* ── The outgoing request, and the four that come back ──────────────────── */

const DE_LINES = [
  `Wir bitten um ein Angebot über ${REC.qty} t kornorientiertes Elektroblech, M4, C5-isoliert, als Coil.`,
  `Lieferung bis ${NEED_BY} — die Linie steht still. Bitte Preis, Lieferzeit und Zahlungsziel angeben.`,
];
const EN_LINES = [
  `Please quote for ${REC.qty} tonnes of grain-oriented electrical steel, M4 grade, C5 insulation coated, in coil.`,
  `Delivery by ${NEED_BY} — the line is down. Please state price, lead time and payment terms.`,
];

const outgoing = (name: string, lang: "de" | "zh", addr: string): InboundEmail => ({
  from: `To: ${name}`,
  fromAddr: addr,
  receivedMeta: "Outbound · 2026-06-20 · 11:08",
  subject: lang === "de" ? `${RFQ} — Anfrage kornorientiertes Elektroblech, 12 t` : `${RFQ} — 电工钢 12 吨询价`,
  lines:
    lang === "de"
      ? DE_LINES
      : [
          `请就 ${REC.qty} 吨取向电工钢（M4 牌号，C5 绝缘涂层，卷装）报价。`,
          `交付期限 ${NEED_BY} —— 产线目前停机。请提供价格、交货周期与付款条件。`,
        ],
  attachment: rfqDoc,
  attachmentLabel: `${RFQ} · request for quotation`,
  headline: `The request as it goes to ${name}`,
  previewNote: "PDF · click to preview the RFQ",
  cta: "Back to the drafts",
});

/** A price break, written the way a quotation writes it. */
const tierText = (t: { from: number; to: number | null; unit: number }) =>
  `${t.from}${t.to ? `–${t.to}` : "+"} t · ${usd(t.unit)} / t`;

/**
 * The quotation as a document — the number on the first line, and underneath
 * it every clause that decides what the number is worth.
 */
const quoteSheet = (name: string, no: string, q: Quote) => (
  <RecordDoc
    d={{
      tcode: "ME47",
      tname: "Maintain Quotation",
      number: no,
      status: "Received · in comparison",
      docType: `Quotation · ${name}`,
      system: `Against ${RFQ}`,
      createdBy: name,
      createdOn: "2026-06-20",
      sections: [
        {
          band: "Price",
          rows: [
            { label: "Unit price", value: `${usd(q.unit)} / t` },
            { label: "Price breaks", value: q.tiers.map(tierText).join("  ·  ") },
            { label: "Quantity quoted", value: `${REC.qty} t` },
            { label: "Quotation value", value: usd(q.unit * REC.qty) },
            { label: "Price validity", value: `${q.validDays} days from quotation date` },
            { label: "Price basis", value: q.surcharge },
          ],
        },
        {
          band: "Payment & delivery",
          rows: [
            { label: "Payment terms", value: q.terms },
            {
              label: "Settlement discount",
              value: q.settle.pct
                ? `${q.settle.pct}% if paid within ${q.settle.days} days`
                : "None offered",
            },
            { label: "Incoterm", value: q.incoterm },
            { label: "Freight", value: q.freightNote },
            { label: "Lead time", value: `${q.lead} from order` },
            { label: "Availability", value: q.build },
          ],
        },
        {
          band: "Commitments",
          rows: [
            { label: "Cancellation", value: q.cancel },
            { label: "Quality & shelf life", value: q.warranty },
            { label: "Late delivery", value: q.lateTerms },
          ],
        },
      ],
      determination: {
        ok: true,
        text: `Quoted ${usd(q.unit)} / t on ${q.terms}, ${q.lead} from order — ${q.incoterm.split(" · ")[0]}, ${q.build.toLowerCase()}.`,
      },
    }}
  />
);

const reply = (o: {
  name: string;
  addr: string;
  meta: string;
  lang: "de" | "zh";
  subject: string;
  lines: string[];
  en: string[];
  declined?: boolean;
  /** The quotation behind the email — attached, as it would be in real life. */
  quote?: { no: string; q: Quote };
}): InboundEmail => ({
  from: o.name,
  fromAddr: o.addr,
  receivedMeta: o.meta,
  subject: o.subject,
  lines: o.lines,
  attachment: o.quote ? (
    quoteSheet(o.name, o.quote.no, o.quote.q)
  ) : (
    <MultilingualEmailDoc
      from={o.name}
      fromAddr={o.addr}
      to="Procurement · Orvantec"
      sent={o.meta}
      sourceLang={o.lang}
      original={{ subject: o.subject, lines: o.lines }}
      translated={{ subject: `${RFQ} — quotation`, lines: o.en }}
    />
  ),
  attachmentLabel: o.declined ? "Reply · translated" : `Quotation ${o.quote?.no ?? ""} · full terms`,
  headline: `${o.name} replied`,
  previewNote: o.declined ? "Click to read it in English" : "Click to open the quotation and its terms",
  cta: "Back to the quotes",
});

const rheinReply = reply({
  name: "Rheinstahl Elektroblech GmbH",
  addr: "vertrieb@rheinstahl.example",
  meta: "Outlook · 2026-06-20 · 14:20",
  lang: "de",
  subject: `AW: ${RFQ} — unser Angebot`,
  lines: [
    `Vielen Dank für Ihre Anfrage. Wir bieten das Elektroblech zu ${usd(Q.rhein.unit)} / t an, ab Händlerlager Köln.`,
    `Staffelpreise: ${Q.rhein.tiers.map((t) => `${t.from}${t.to ? `–${t.to}` : "+"} t ${usd(t.unit)}`).join(", ")}.`,
    `Lieferzeit ${Q.rhein.lead} ab Bestellung, Zahlungsziel 30 Tage netto ohne Skonto. Lieferung DAP Harzanlage, Fracht ab $2.000 Warenwert inklusive.`,
    `Stornierung bis Versand möglich, danach 20% Wiedereinlagerungsgebühr. Analysenzertifikat je Charge, Haltbarkeit 12 Monate. Angebot ${Q.rhein.validDays} Tage bindend. Eine Verzugspönale können wir nicht anbieten.`,
  ],
  en: [
    `Thank you for the enquiry. We offer the grain-oriented electrical steel at ${usd(Q.rhein.unit)} each, from distributor stock in Cologne.`,
    `Price breaks: ${Q.rhein.tiers.map(tierText).join(", ")}.`,
    `Lead time ${Q.rhein.lead} from order, payment Net 30 with no settlement discount. Delivery DAP Winding Plant, carriage included above $2,000.`,
    `Cancellable up to dispatch, 20% restocking after that. Certificate of analysis per batch, 12 months shelf life. Quotation firm for ${Q.rhein.validDays} days. We cannot offer a late-delivery penalty.`,
  ],
  quote: { no: "QT-2026-4471", q: Q.rhein },
});

const nordwestReply = reply({
  name: "Nordfarben Chemie GmbH",
  addr: "angebot@nordfarben.example",
  meta: "Outlook · 2026-06-20 · 15:05",
  lang: "de",
  subject: `AW: ${RFQ} — Angebot kornorientiertes Elektroblech`,
  lines: [
    `Gern bieten wir an: ${usd(Q.nordwest.unit)} / t, unser bester Preis.`,
    `Staffelpreise: ${Q.nordwest.tiers.map((t) => `${t.from}${t.to ? `–${t.to}` : "+"} t ${usd(t.unit)}`).join(", ")}.`,
    `Lieferzeit ${Q.nordwest.lead} — die Ware kommt aus der nächsten Produktionskampagne, daher etwas länger. Werkzeug ist vorhanden, es fällt keine Einrichtegebühr an.`,
    `Zahlungsziel 45 Tage netto, bei Zahlung innerhalb von ${Q.nordwest.settle.days} Tagen ${Q.nordwest.settle.pct}% Skonto. Lieferung EXW Werk Osnabrück — Abholung durch Sie.`,
    `Nach Fertigungsfreigabe ist die Bestellung nicht stornierbar. Analysenzertifikat je Charge, Haltbarkeit 9 Monate. Der Erz- und Energiezuschlag wird quartalsweise überprüft; das Angebot ist ${Q.nordwest.validDays} Tage bindend. Eine Verzugspönale bieten wir nicht an.`,
  ],
  en: [
    `We are pleased to quote ${usd(Q.nordwest.unit)} each, our best price.`,
    `Price breaks: ${Q.nordwest.tiers.map(tierText).join(", ")}.`,
    `Lead time ${Q.nordwest.lead} — it comes from the next production campaign, hence the longer wait. Tooling exists, so there is no setup charge.`,
    `Payment Net 45, with ${Q.nordwest.settle.pct}% settlement discount if paid within ${Q.nordwest.settle.days} days. Delivery EXW our works in Osnabrück — collection is yours to arrange.`,
    `Once released to production the order cannot be cancelled. Certificate of analysis per batch, 9 months shelf life. The silicon-carbide surcharge is reviewed quarterly; this quotation is firm for ${Q.nordwest.validDays} days. We do not offer a late-delivery penalty.`,
  ],
  quote: { no: "QT-2026-4472", q: Q.nordwest },
});

const suedReply = reply({
  name: "Süddeutsche Elektrobleche",
  addr: "sales@sued-elektrobleche.example",
  meta: "Outlook · 2026-06-20 · 15:40",
  lang: "de",
  subject: `AW: ${RFQ} — Angebot, Ware ab Lager`,
  lines: [
    `Wir bieten ${usd(Q.sued.unit)} / t. Die vollen 12 t sind ab Lager verfügbar.`,
    `Staffelpreise: ${Q.sued.tiers.map((t) => `${t.from}${t.to ? `–${t.to}` : "+"} t ${usd(t.unit)}`).join(", ")}.`,
    `Lieferzeit ${Q.sued.lead}. Uns ist bekannt, dass Ihre Linie steht — wir versenden noch diese Woche.`,
    `Zahlungsziel 30 Tage netto, bei Zahlung innerhalb von ${Q.sued.settle.days} Tagen ${Q.sued.settle.pct}% Skonto. Lieferung DAP Harzanlage, Fracht und Exportverpackung inklusive.`,
    `Stornierung bis Versand kostenfrei. Analysenzertifikat je Charge, Haltbarkeit 18 Monate. Für den Liefertermin stehen wir ein: ${Q.sued.lateTerms === "0.5% per week late, capped at 5%" ? "0,5% je Woche Verzug, maximal 5%" : Q.sued.lateTerms}. Angebot ${Q.sued.validDays} Tage bindend.`,
  ],
  en: [
    `We quote ${usd(Q.sued.unit)} each. The full 12 t is available from stock.`,
    `Price breaks: ${Q.sued.tiers.map(tierText).join(", ")}.`,
    `Lead time ${Q.sued.lead}. We understand your line is down — we can ship this week.`,
    `Payment Net 30, with ${Q.sued.settle.pct}% settlement discount if paid within ${Q.sued.settle.days} days. Delivery DAP Winding Plant, carriage and export packing included.`,
    `Cancellation is free up to dispatch. Certificate of analysis per batch, 18 months shelf life. We stand behind the date: ${Q.sued.lateTerms}. Quotation firm for ${Q.sued.validDays} days.`,
  ],
  quote: { no: "QT-2026-4473", q: Q.sued },
});

const hengtaiReply = reply({
  name: "Hengtai Electrical Steel (Jiangsu)",
  addr: "sales@hengtai-steel.example",
  meta: "Outlook · 2026-06-21 · 03:15",
  lang: "zh",
  subject: `回复：${RFQ} —— 暂无法承接`,
  lines: [
    "感谢贵司询价。很遗憾，本季度我方电工钢产线排期已满，无法在贵司要求的交付日期前交货。",
    "如贵司可将交期放宽至九月，我们可以重新报价。",
  ],
  en: [
    "Thank you for the enquiry. Unfortunately our electrical steel line is fully booked this quarter and we cannot deliver before your required date.",
    "If the date could move to September we would be glad to quote again.",
  ],
  declined: true,
});

/* ── The order that comes out of it ─────────────────────────────────────── */

const poDoc = (
  <RecordDoc
    d={{
      tcode: "ME23N",
      tname: "Display Purchase Order",
      number: "PO-77318",
      status: "Awaiting release",
      docType: "Purchase order · grain-oriented electrical steel · 12 t",
      system: "Purchasing · orders",
      createdOn: "2026-06-20 · 16:10",
      createdBy: "Approval & routing agent",
      sections: [
        {
          band: "Order header",
          rows: [
            { label: "Supplier", value: "Süddeutsche Elektrobleche" },
            { label: "Sourced by", value: `${RFQ} · competitive quotation` },
            { label: "Agreement", value: "None — bought off contract" },
            { label: "Terms", value: "Net 30 · FCA" },
          ],
        },
        {
          band: "Item 10",
          rows: [
            { label: "Material", value: REC.material },
            { label: "Quantity", value: `${REC.qty} ${REC.uom}` },
            { label: "Unit price", value: `${usd(Q.sued.unit)} / EA` },
            { label: "Order value", value: usd(Q.sued.unit * REC.qty) },
            { label: "Delivery", value: `${Q.sued.lead} · ships this week` },
          ],
        },
      ],
      determination: {
        ok: true,
        text: `Three quotes taken and compared. Bought from stock at ${usd(Q.sued.unit)} to get the line running — ${usd(EXTRA)} above the cheapest quote, which was four days slower.`,
      },
    }}
  />
);

/**
 * What comes back. An order is not finished when it is sent — it is finished
 * when the supplier says yes, in writing, with a date on it. Süddeutsche
 * confirm in German; the agent translates it and files the confirmation
 * against the order.
 */
const orderConfirmation = (
  <RecordDoc
    d={{
      tcode: "ME23N",
      tname: "Display Purchase Order",
      number: "PO-77318",
      status: "Confirmed by the supplier",
      docType: "Order confirmation · AB-2026-0418",
      system: "Purchasing · orders",
      createdOn: "2026-06-20 · 17:05",
      createdBy: "Süddeutsche Elektrobleche",
      sections: [
        {
          band: "Confirmation",
          rows: [
            { label: "Supplier reference", value: "AB-2026-0418" },
            { label: "Against order", value: "PO-77318" },
            { label: "Quantity confirmed", value: `${REC.qty} ${REC.uom}` },
            { label: "Price confirmed", value: `${usd(Q.sued.unit)} / EA` },
            { label: "Ship date", value: "2026-06-24 · ex stock" },
            { label: "Terms", value: "Net 30 · FCA" },
          ],
        },
      ],
      determination: {
        ok: true,
        text: "Confirmed at the quoted price and inside the shutdown window. The confirmation is filed against PO-77318 — the order, the quote and the confirmation now agree.",
      },
    }}
  />
);

const poReply = {
  from: "Süddeutsche Elektrobleche · Vertrieb",
  receivedMeta: "Outlook · 2026-06-20 · 17:05",
  subject: "AW: PO-77318 — Auftragsbestätigung",
  lines: [
    `Vielen Dank für Ihre Bestellung. Wir bestätigen PO-77318 über ${REC.qty} t kornorientiertes Elektroblech zu ${usd(Q.sued.unit)} / t, Zahlungsziel 30 Tage netto.`,
    "Versand erfolgt am 24.06. ab Lager — damit sind Sie vor Ihrem Termin. Unsere Auftragsbestätigung AB-2026-0418 finden Sie im Anhang.",
  ],
  source: {
    id: "oc-confirm",
    label: "AB-2026-0418",
    meta: "order confirmation · translated",
    kind: "sap" as const,
    body: (
      <MultilingualEmailDoc
        from="Süddeutsche Elektrobleche · Vertrieb"
        fromAddr="sales@sued-elektrobleche.example"
        to="Procurement · Orvantec"
        sent="2026-06-20 · 17:05"
        sourceLang="de"
        original={{
          subject: "AW: PO-77318 — Auftragsbestätigung",
          lines: [
            `Vielen Dank für Ihre Bestellung. Wir bestätigen PO-77318 über ${REC.qty} t kornorientiertes Elektroblech zu ${usd(Q.sued.unit)} / t, Zahlungsziel 30 Tage netto.`,
            "Versand erfolgt am 24.06. ab Lager — damit sind Sie vor Ihrem Termin.",
          ],
        }}
        translated={{
          subject: "RE: PO-77318 — order confirmation",
          lines: [
            `Thank you for your order. We confirm PO-77318 for ${REC.qty} t of grain-oriented electrical steel at ${usd(Q.sued.unit)} / t, payment terms Net 30.`,
            "Shipping on 24 June from stock — that puts you ahead of your date.",
          ],
        }}
      />
    ),
  },
};

/* ── The run ────────────────────────────────────────────────────────────── */

export const offContractSteps: RunStep[] = [
  {
    id: "intake",
    agentName: "PR Processing agent",
    n: 1,
    title: "Read it, and find nothing covering it",
    sub: "Structures the request, then looks for an agreement",
    aiThought:
      "The engineer's note is in German and there is no part number in it. Let me structure the request first, then look for something that covers this grade — an agreement, a source list, an old price. If there is nothing, this has to go to market.",
    reasoning: [
      "Reading the engineer's note from Assembly Line 2",
      "Coding it to a material and a plant",
      "Searching outline agreements for this material — nothing",
      "Searching the source list and info records — nothing",
      "No contract route exists · a competitive RFQ is the only honest price",
    ],
    docLabel: "Source of supply · nothing on file",
    document: noAgreementDoc,
    sources: [
      { id: "oc-pr", label: REC.id, meta: "ME53N · structured", kind: "sap", body: prDoc },
      { id: "oc-nocontract", label: "ME33K · search", meta: "no agreement found", kind: "contract", body: noAgreementDoc },
    ],
    recommendation:
      "Nothing on file covers this grade, so there is no agreed price to buy at and nothing to hold a supplier to. It goes to market — and because the line is down, lead time matters as much as price.",
    stages: [
      {
        sourceId: "oc-nocontract",
        reasoning: "Looking for anything that covers this material",
        title: "Source of supply",
        fields: [
          { label: "Material", value: REC.material },
          { label: "Outline agreement", value: "None" },
          { label: "Source list", value: "No entry" },
          { label: "Last price paid", value: "No history" },
          { label: "Route", value: "Competitive RFQ" },
        ],
      },
    ],
  },
  {
    id: "sourcing",
    agentName: "Sourcing & contract agent",
    n: 2,
    title: "Go to market",
    sub: "Finds suppliers, writes the RFQ, sends it and waits",
    aiThought:
      "No agreement means no shortlist either, so let me search for suppliers who actually make this grade. Most of them will be here in Germany — I will write to them in German, and to the one overseas manufacturer in their own language.",
    reasoning: [
      "Searching the supplier master and the web",
      "Four suppliers make or stock this lamination grade",
      "Three are German · one manufacturer is in China",
      "Writing each request in the language they work in",
      "Sending, and collecting what comes back",
    ],
    docLabel: `${RFQ} · request for quotation`,
    document: rfqDoc,
    sources: [{ id: "oc-rfq", label: RFQ, meta: "ME41N · request for quote", kind: "sap", body: rfqDoc }],
    recommendation:
      "Four requests out, three quotes back and one refusal. The prices are close together; the lead times are not, and that is what this decision turns on.",
    rfq: {
      fields: [
        { label: "Material", value: REC.material },
        { label: "Quantity", value: `${REC.qty} ${REC.uom}` },
        { label: "Specification", value: "Grain-oriented · C5 insulation coated · coil stock" },
        { label: "Need-by", value: `${NEED_BY} · line down` },
        { label: "Agreement", value: "None — buying off contract" },
        { label: "Suppliers to solicit", value: "4 · mostly local" },
      ],
      search: {
        query: "C5 insulation coated grain-oriented electrical steel · producers and distributors in Germany",
        results: [
          { name: "Rheinstahl Elektroblech GmbH", via: "web · distributor", note: "Germany · 40 km away" },
          { name: "Nordfarben Chemie GmbH", via: "web · distributor", note: "Germany · made to order" },
          { name: "Süddeutsche Elektrobleche", via: "web · manufacturer", note: "Germany · holds stock" },
          { name: "Hengtai Electrical Steel (Jiangsu)", via: "web · manufacturer", note: "China · low cost" },
        ],
      },
      rfqDoc,
      vendors: [
        {
          id: "rhein",
          name: "Rheinstahl Elektroblech GmbH",
          via: "distributor · web",
          country: "Germany",
          draft: { subject: `${RFQ} — grain-oriented electrical steel · 12 t`, lines: EN_LINES },
          local: { lang: "Deutsch", subject: `${RFQ} — Anfrage kornorientiertes Elektroblech, 12 t`, lines: DE_LINES },
          draftEmail: outgoing("Rheinstahl Elektroblech GmbH", "de", "vertrieb@rheinstahl.example"),
          quote: {
            headline: `${usd(Q.rhein.unit)} / EA · ${Q.rhein.lead}`,
            lines: ["Off the shelf at a distributor price."],
          },
          reply: rheinReply,
        },
        {
          id: "nordwest",
          name: "Nordfarben Chemie GmbH",
          via: "distributor · web",
          country: "Germany",
          negotiating: true,
          draft: { subject: `${RFQ} — grain-oriented electrical steel · 12 t`, lines: EN_LINES },
          local: { lang: "Deutsch", subject: `${RFQ} — Anfrage kornorientiertes Elektroblech, 12 t`, lines: DE_LINES },
          draftEmail: outgoing("Nordfarben Chemie GmbH", "de", "angebot@nordfarben.example"),
          quote: {
            headline: `${usd(Q.nordwest.unit)} / EA · ${Q.nordwest.lead}`,
            lines: ["Cheapest of the three — made to order."],
          },
          reply: nordwestReply,
        },
        {
          id: "sued",
          name: "Süddeutsche Elektrobleche",
          via: "manufacturer · web",
          country: "Germany",
          draft: { subject: `${RFQ} — grain-oriented electrical steel · 12 t`, lines: EN_LINES },
          local: { lang: "Deutsch", subject: `${RFQ} — Anfrage kornorientiertes Elektroblech, 12 t`, lines: DE_LINES },
          draftEmail: outgoing("Süddeutsche Elektrobleche", "de", "sales@sued-elektrobleche.example"),
          quote: {
            headline: `${usd(Q.sued.unit)} / EA · ${Q.sued.lead}`,
            lines: ["From stock — can ship this week."],
          },
          reply: suedReply,
        },
        {
          id: "hengtai",
          name: "Hengtai Electrical Steel (Jiangsu)",
          via: "manufacturer · web",
          country: "China",
          negotiating: true,
          draft: { subject: `${RFQ} — grain-oriented electrical steel · 12 t`, lines: EN_LINES },
          local: {
            lang: "简体中文",
            subject: `${RFQ} —— 电工钢 12 吨询价`,
            lines: [
              `请就 ${REC.qty} 吨取向电工钢（M4 牌号，C5 绝缘涂层，卷装）报价。`,
              `交付期限 ${NEED_BY} —— 产线目前停机。请提供价格、交货周期与付款条件。`,
            ],
          },
          draftEmail: outgoing("Hengtai Electrical Steel (Jiangsu)", "zh", "sales@hengtai-steel.example"),
          quote: { headline: "No quote", lines: ["Capacity full this quarter — cannot meet the date."] },
          reply: hengtaiReply,
        },
      ],
    },
  },
  {
    id: "sourcing",
    agentName: "Sourcing & contract agent",
    n: 3,
    title: "Weigh what came back",
    sub: "Compares the quotes and recommends one",
    aiThought:
      "Three usable quotes and one refusal. The spread on price is small; the spread on lead time is not — and with the line stopped, a day of waiting is not free. Let me weigh those against each other properly before I recommend anything.",
    reasoning: [
      "Reading all four replies, two of them translated",
      "Comparing unit price, lead time and what is actually in stock",
      "Costing the downtime the slower quotes would add",
      "Recommending one, and saying what the runner-up lost on",
    ],
    docLabel: "Quotation comparison",
    document: rfqDoc,
    sources: [{ id: "oc-compare", label: `${RFQ} · quotes`, meta: "ME47 · comparison", kind: "sap", body: rfqDoc }],
    recommendation: `Süddeutsche Elektrobleche at ${usd(Q.sued.unit)} — from stock, shipping this week. It is ${usd(EXTRA)} more than the cheapest quote and four days sooner, and four days of a stopped winding line costs considerably more than ${usd(EXTRA)}.`,
    quotes: {
      thinkMs: 5000,
      lines: [
        "Three quotes to compare — Hengtai has declined on capacity",
        `On the tonne price they are within ${usd(EXTRA)} of each other · ${usd(Q.nordwest.unit)} to ${usd(Q.sued.unit)} a tonne`,
        `At ${REC.qty} t that is a ${usd(EXTRA * REC.qty)} spread on the sticker — worth reading the clauses before believing it`,
        `Nordwest is EXW, so ${usd(Q.nordwest.freight)} of haulage lands on us; the other two deliver carriage paid`,
        `Settlement discounts differ — ${Q.sued.settle.pct}% in ${Q.sued.settle.days} days against ${Q.nordwest.settle.pct}% in ${Q.nordwest.settle.days}, and none at all from Rheinstahl`,
        `All-in the three land at ${usd(landed(Q.nordwest, REC.qty))}, ${usd(landed(Q.rhein, REC.qty))} and ${usd(landed(Q.sued, REC.qty))} — a ${usd(Math.abs(landed(Q.sued, REC.qty) - landed(Q.nordwest, REC.qty)))} spread, not ${usd(EXTRA * REC.qty)}`,
        "The cheapest is also the only one that cannot be cancelled and offers no delivery penalty",
        `All three quote a ${Q.sued.tiers[2].from} t break — we are ordering exactly ${REC.qty} t, so the break is already in the price`,
      ],
      replies: [
        {
          id: "rhein",
          vendor: "Rheinstahl Elektroblech GmbH",
          country: "Germany · distributor",
          headline: `${usd(Q.rhein.unit)} / t`,
          lead: `${Q.rhein.lead} lead`,
          note: "Distributor part load. No settlement discount, and no penalty if it slips.",
          terms: cardTerms(Q.rhein),
          landed: {
            value: usd(landed(Q.rhein, REC.qty)),
            note: "goods + freight − settlement",
          },
          email: rheinReply,
        },
        {
          id: "nordwest",
          vendor: "Nordfarben Chemie GmbH",
          country: "Germany · distributor",
          headline: `${usd(Q.nordwest.unit)} / t`,
          lead: `${Q.nordwest.lead} lead`,
          note: "Cheapest a tonne — but ex works, non-cancellable, and a shorter shelf life.",
          terms: cardTerms(Q.nordwest),
          landed: {
            value: usd(landed(Q.nordwest, REC.qty)),
            note: "goods + freight − settlement",
          },
          email: nordwestReply,
        },
        {
          id: "sued",
          vendor: "Süddeutsche Elektrobleche",
          country: "Germany · manufacturer",
          headline: `${usd(Q.sued.unit)} / t`,
          lead: `${Q.sued.lead} lead`,
          note: "Dearest a tonne, but delivered, cancellable, and it stands behind the date.",
          terms: cardTerms(Q.sued),
          landed: {
            value: usd(landed(Q.sued, REC.qty)),
            note: "goods + freight − settlement",
          },
          email: suedReply,
        },
        {
          id: "hengtai",
          vendor: "Hengtai Electrical Steel (Jiangsu)",
          country: "China · manufacturer",
          headline: "No quote",
          lead: "Declined",
          note: "Electrical steel line fully booked this quarter — would requote for September.",
          declined: true,
          email: hengtaiReply,
        },
      ],
      verdict: {
        pickId: PICK,
        headline: `Süddeutsche Elektrobleche — ${usd(Q.sued.unit)} / t, ${usd(landed(Q.sued, REC.qty))} all-in, ${REC.qty} t ex stock`,
        body: `They are the only one holding the full ${REC.qty} t on the shelf, they deliver carriage paid, and they take ${Q.sued.settle.pct}% off if we settle in ${Q.sued.settle.days} days. Cancellable up to dispatch and ${Q.sued.lateTerms.toLowerCase()} if the date slips — for a line that is down, that is what we are buying.`,
        against: `Nordwest looks ${usd(EXTRA * REC.qty)} cheaper on the sticker, but ex works it adds ${usd(Q.nordwest.freight)} of haulage and lands at ${usd(landed(Q.nordwest, REC.qty))} — ${usd(Math.abs(landed(Q.sued, REC.qty) - landed(Q.nordwest, REC.qty)))} apart, not ${usd(EXTRA * REC.qty)}. For that we would take a nine-day wait, a batch we cannot cancel once the campaign is scheduled, no penalty if it slips, and three months less shelf life.`,
      },
    },
    insight: {
      kind: "pricing",
      spec: {
        tiers: [
          { band: `${Q.sued.tiers[0].from}–${Q.sued.tiers[0].to} t`, unit: usd(Q.sued.tiers[0].unit), note: "A trial drum quantity" },
          { band: `${Q.sued.tiers[1].from}–${Q.sued.tiers[1].to} t`, unit: usd(Q.sued.tiers[1].unit), note: "Half a truck" },
          { band: `${Q.sued.tiers[2].from} t and above`, unit: usd(Q.sued.tiers[2].unit), note: `This order · ${REC.qty} t, a full truckload`, state: "current" },
          { band: "Annual call-off", unit: "Not offered", note: "No agreement exists — there is no annual rate to reach", state: "best" },
        ],
        calc: [
          { label: `This order · ${REC.qty} t at the truckload break`, value: usd(Q.sued.unit * REC.qty) },
          { label: "If the formulation goes to full production", value: "60 t a year" },
          { label: "Bought as five more spot loads at this rate", value: usd(Q.sued.unit * 60) },
          { label: "What an agreement would be worth negotiating for", value: "This is the moment to ask", strong: true },
        ],
        note: `We are already at the best break Süddeutsche publishes — ${REC.qty} t is a full truckload. There is nothing more to squeeze out of this order. What there is, is a reason to open an agreement before the next five loads are bought the same way.`,
      },
    },
  },
  {
    id: "orchestrator",
    agentName: "Approval & routing agent",
    n: 4,
    title: "Raise the order",
    sub: "Issues the PO and writes to the supplier",
    aiThought:
      "The supplier is chosen and the price is evidenced by three quotes. Let me raise the order, route it for the one signature it needs, and write to the supplier — in German, with the English alongside so you can check it before it goes.",
    reasoning: [
      "Raising PO-77318 against the chosen quote",
      `Order value ${usd(Q.sued.unit * REC.qty)} · above the plant lead's $5,000 limit`,
      "Attaching all three quotes as the price evidence",
      "Drafting the order confirmation in German",
    ],
    docLabel: "PO-77318 · purchase order",
    document: poDoc,
    sources: [{ id: "oc-po", label: "PO-77318", meta: "ME23N · purchase order", kind: "sap", body: poDoc }],
    recommendation: `PO-77318 raised to Süddeutsche Elektrobleche for ${usd(Q.sued.unit * REC.qty)}, with three competitive quotes on file behind the price. One signature releases it, and the confirmation goes out in German.`,
    email: {
      cta: "Review & send the order",
      to: "Süddeutsche Elektrobleche · Vertrieb",
      subject: "PO-77318 — Bestellung kornorientiertes Elektroblech, 12 t",
      lines: [
        `Vielen Dank für Ihr Angebot. Wir bestellen hiermit ${REC.qty} t kornorientiertes Elektroblech, M4, C5-isoliert, zum Preis von ${usd(Q.sued.unit)} / t, Zahlungsziel 30 Tage netto.`,
        `Bitte bestätigen Sie den Versand in dieser Woche — die Linie steht still. Die Bestellung PO-77318 finden Sie im Anhang.`,
      ],
      review: {
        subject: "PO-77318 — order for 12 t of grain-oriented electrical steel",
        body: [
          `Thank you for your quotation. We hereby order ${REC.qty} tonnes of grain-oriented electrical steel, M4 grade, C5 insulation coated, at ${usd(Q.sued.unit)} each, payment terms Net 30.`,
          "Please confirm shipment this week — the line is stopped. Purchase order PO-77318 is attached.",
        ],
        sendingIn: "Deutsch",
      },
      attachment: poDoc,
      attachmentLabel: "PO-77318 · purchase order",
      toastTitle: "Order sent",
      toastBody: "PO-77318 sent to Süddeutsche Elektrobleche in German · waiting on their confirmation.",
      reply: poReply,
      resolvedDocument: orderConfirmation,
    },
  },
];

export const offContractPick = {
  vendor: "Süddeutsche Elektrobleche",
  value: Q.sued.unit * REC.qty,
  extra: EXTRA,
};
