/**
 * The hero run — a catalogue buy, seen properly.
 *
 * Filter bags are routine: no line is down and nobody is waiting. That is
 * precisely why the buy repays attention. The plant orders the same item every
 * quarter, four sites order it independently, and each sits one price break
 * below the position the network's combined volume would reach. None of this
 * is visible on a single requisition; it appears only when the category is
 * examined rather than the line.
 *
 * Each step therefore closes with the question its own work has made
 * answerable: catalogue adoption, network consumption, price-break position,
 * and order strategy.
 *
 * Every figure below is written once. 400 EA at $22.40 is $8,960 everywhere,
 * the four sites add to 4,000 EA a year everywhere, and the consolidation
 * arithmetic is the tier table applied to the three live requests.
 */

import type { RunStep } from "@/mro/data/runSteps";
import { StructuredPrDoc } from "@/mro/components/docs/pr/PrDocs";
import {
  MaterialMasterDoc,
  StockOverviewDoc,
  OutlineAgreementDoc,
  ApprovalRoutingDoc,
  PurchaseOrderDoc,
} from "@/mro/components/docs/pr/SapDocs";
import { MultilingualEmailDoc } from "@/mro/components/docs/pr/MultilingualEmail";
import { LookupSheetDoc } from "@/mro/components/docs/pr/LookupSheet";
import { RecordDoc } from "@/mro/components/docs/pr/SapDocs";
import { ScorecardDoc } from "@/mro/components/docs/pr/Scorecard";
import { ContractDoc } from "@/mro/components/docs/pr/ContractDoc";

/* ── The one place these numbers are written down ───────────────────────── */

const PR = "PR-48702";
const MAT = "MRO-FILT-BAG-25UM-PP";
const ITEM = "Filter bag — 25 micron — polypropylene — size 2";
const QTY = 400;
const UNIT = "22.40";
const TOTAL = "8,960.00";
const VENDOR = "Apex Industrial Supply";
const SA = "SA-MRO-07";
const PO = "PO-77351";
const GR = "GR-77351";
const INV = "BPI-5611";
/* The consolidated order — one PO, one price, three delivery points. */
const ORDER_QTY = 1_040;
const ORDER_UNIT = "19.90";
const ORDER_TOTAL = "20,696.00";

/* The supplier's published breaks. Everything downstream reads these. */
const TIERS = [
  { band: "1–249 EA", unit: "$24.80" },
  { band: "250–999 EA", unit: "$22.40" },
  { band: "1,000–2,499 EA", unit: "$19.90" },
  { band: "2,500 EA and above", unit: "$18.10" },
];

/* ── The request as it arrived ──────────────────────────────────────────── */

export const filterFreeText = (
  <MultilingualEmailDoc
    from="Verfahrenstechnik · Deburring Plant"
    fromAddr="prozess@orvantec.com"
    to="Procurement intake"
    sent="2026-06-20 · 09:04"
    sourceLang="de"
    original={{
      subject: "Filterwechsel Q3 — Entgratlinie 1",
      lines: [
        "Für den Filterwechsel im dritten Quartal brauchen wir wieder 400 Filterbeutel, 25 Mikron, Polypropylen, Größe 2.",
        "Das ist der übliche Beutel für die Entgratlinien, wir bestellen ihn jedes Quartal. Materialnummer MRO-FILT-BAG-25UM-PP.",
        "Bis Anfang Juli reicht völlig, es ist kein Eilfall.",
      ],
    }}
    translated={{
      subject: "Q3 filter change — Deburring Line 1",
      lines: [
        "For the third-quarter filter change we need 400 filter bags again, 25 micron, polypropylene, size 2.",
        "It is the usual bag for the let-down lines and we order it every quarter. Material number MRO-FILT-BAG-25UM-PP.",
        "Early July is fine — this is not urgent.",
      ],
    }}
  />
);

const structuredDoc = (
  <StructuredPrDoc
    pr={{
      number: PR,
      status: "Structured · coded to the catalogue",
      createdBy: "PR Processing agent",
      createdOn: "2026-06-20 · 09:06",
      materialCode: MAT,
      description: "Filter Bag · 25 Micron · Polypropylene · Size 2",
      plant: "Lindfeld · Electronics Works",
      costCenter: "10034 · Deburring & Finishing Maintenance",
      glAccount: "600420 · Spare parts consumed",
      item: [
        { label: "Rating", value: "25 micron" },
        { label: "Material", value: "Polypropylene felt" },
        { label: "Quantity", value: `${QTY} EA` },
        { label: "UoM", value: "EA" },
        { label: "Delivery date", value: "2026-07-03" },
      ],
      assignment: [
        { label: "Material group", value: "MRO · filtration consumables" },
        { label: "Suggested vendor", value: `${VENDOR} (preferred)` },
      ],
      confidence: "99% · catalogue match",
      flags: [
        "The submission stated the material number — a repeat catalogue line rather than a new specification.",
      ],
      prType: "NB · Standard requisition",
      requestor: "Process engineer · Deburring Line 1",
      purchOrg: "1000 · Orvantec Procurement",
    }}
  />
);

const materialMaster = (
  <MaterialMasterDoc
    m={{
      number: MAT,
      description: "Filter bag · 25 micron · polypropylene felt · size 2 · snap band",
      status: "Active · catalogue item",
      createdOn: "2021-05-04 · 11:20",
      createdBy: "Master data",
      basic: [
        { label: "Material group", value: "MRO · filtration consumables" },
        { label: "Base UoM", value: "EA" },
        { label: "Material type", value: "VERB · consumable" },
      ],
      purchasing: [
        { label: "Purchasing group", value: "200 · MRO / Maintenance" },
        { label: "Outline agreement", value: `${SA} · ${VENDOR}` },
        { label: "Last purchase", value: `2026-03-18 · $${UNIT} / EA` },
      ],
      accounting: [
        { label: "Valuation class", value: "3030 · Consumables" },
        { label: "Standard price", value: `$${UNIT} / EA` },
        { label: "Plant", value: "Deburring Plant" },
      ],
    }}
  />
);

/* Master data reads as a scorecard — it is the agent's finding, not a form. */
const masterDataScore = (
  <ScorecardDoc
    d={{
      number: `VAL-48702-MD`,
      docType: "Master data · duplicate · inventory",
      createdBy: "Master Data agent",
      createdOn: "2026-06-20 · 09:11",
      checks: [
        { label: "Material record is active and catalogued", detail: `${MAT} · active · VERB consumable`, ok: true },
        { label: "No duplicate requisition is open", detail: "Four open requisitions scanned against this material · none matched", ok: true },
        { label: "Inventory cannot cover the requirement", detail: "40 EA on hand against a 400 EA change · below safety stock at this plant", ok: true },
        { label: "Demand is recurring, not one-off", detail: "Ordered in each of the last eight quarters · an established catalogue line", ok: true },
      ],
      verdict: "No control blocks the purchase. It does surface a category question: this item has been ordered in eight consecutive quarters, and each plant sources it independently.",
    }}
  />
);

const stockDoc = (
  <StockOverviewDoc
    s={{
      number: MAT,
      description: ITEM,
      createdOn: "2026-06-20 · 09:12",
      createdBy: "Master Data agent",
      rows: [
        { plant: "Lindfeld · Electronics Works", storageLoc: "LD1 · line store", onHand: "40", safety: "120", uom: "EA", tone: "short" },
        { plant: "Lindfeld · Drive Systems Works", storageLoc: "Main store", onHand: "95", safety: "90", uom: "EA" },
        { plant: "Riomar · Assembly & Packaging", storageLoc: "Main store", onHand: "60", safety: "60", uom: "EA" },
        { plant: "Lianhe · Electronics Works", storageLoc: "Main store", onHand: "110", safety: "100", uom: "EA" },
      ],
      note: "Each site holds an independent buffer and none is sufficient for a 400 EA change — the profile of a category purchased site by site rather than as a network.",
    }}
  />
);

/* Sourcing reads as a worksheet too — the price list it actually read. */
const priceSheet = (
  <LookupSheetDoc
    sheets={[
        {
          file: "SA-MRO-07-pricelist.xlsx",
          tab: "Filtration",
          columns: ["Order quantity", "Unit price", "Discount vs base", "Where we sit"],
          usedNote: `→ ${QTY} EA on this order`,
          rows: [
            { cells: [TIERS[0].band, TIERS[0].unit, "base", "Riomar and Lianhe order here"], matched: false },
            { cells: [TIERS[1].band, TIERS[1].unit, "−10%", "this order"], matched: true },
            { cells: [TIERS[2].band, TIERS[2].unit, "−20%", "one order for the network"], matched: false },
            { cells: [TIERS[3].band, TIERS[3].unit, "−27%", "a year in one call-off"], matched: false },
          ],
        },
    ]}
    footer={<>The requisition is priced correctly at {`$${UNIT}`} / EA — the agreement price for a {QTY} EA order. It is correct, and it is also two breaks above what the network's own volume would pay.</>}
  />
);

const outlineAgreement = (
  <OutlineAgreementDoc
    a={{
      number: SA,
      status: "Released · valid",
      createdOn: "2026-01-01 · 00:01",
      createdBy: "Sourcing & contract",
      header: [
        { label: "Vendor", value: VENDOR },
        { label: "Agreement type", value: "LP · outline agreement · MRO consumables" },
        { label: "Validity", value: "2026-01-01 → 2026-12-31" },
        { label: "Payment terms", value: "Net 30" },
      ],
      items: [
        { item: "10", material: MAT, description: "Filter bag · 25 micron · size 2", targetQty: "2,000 EA", netPrice: UNIT, per: "1 EA" },
      ],
      conditions: [
        { label: "Price basis", value: "Published breaks · quantity per order" },
        { label: "Incoterms", value: "DAP · plant" },
      ],
    }}
  />
);

/* Approval reads as a scorecard — the rules, and whether each one passed. */
const approvalScore = (
  <ScorecardDoc
    d={{
      number: "VAL-48702-APR",
      docType: "Approval & routing (DOA)",
      createdBy: "Approval & routing agent",
      createdOn: "2026-06-20 · 09:31",
      checks: [
        { label: "Cost centre and account assignment correct", detail: "10034 · Deburring & Finishing Maintenance / 600420 · Spare parts consumed", ok: true },
        { label: "Within the plant delegation of authority", detail: `$${TOTAL} against a $10,000 plant-maintenance limit`, ok: true },
        { label: "Competitive bidding waived", detail: `On agreement ${SA} · published price list applies`, ok: true },
        { label: "Priced at the contracted rate", detail: `$${UNIT} / EA · matches the ${TIERS[1].band} break`, ok: true },
      ],
      verdict: "All controls pass and no signature is required. The open question is not whether to purchase, but whether this requisition should be placed as a standalone order.",
    }}
  />
);

const routing = (
  <ApprovalRoutingDoc
    r={{
      number: "WF-48702-REL",
      status: "Released by rule",
      createdOn: "2026-06-20 · 09:33",
      createdBy: "Approval & routing agent",
      summary: [
        { label: "Document", value: `${PR} · filter bags` },
        { label: "Value", value: `$${TOTAL}` },
        { label: "Cost center", value: "10034 · Deburring & Finishing Maintenance" },
        { label: "Vendor", value: `${VENDOR} · ${SA}` },
      ],
      chain: [
        { level: "L1", approver: "Plant Maintenance Lead", role: "Maintenance", limit: "$10,000", status: "approved", when: "auto · on agreement, in limit" },
        { level: "L2", approver: "—", role: "Procurement Manager", limit: "$50,000", status: "not-reached", when: "" },
      ],
      validation: { ok: true, text: `$${TOTAL} is inside the plant-maintenance limit and on agreement — released without a signature.` },
      action: "Consolidating the three open requisitions into a single order before placement.",
    }}
  />
);

const poDoc = (
  <PurchaseOrderDoc
    p={{
      number: PO,
      status: "Released · sent to vendor",
      createdOn: "2026-06-20 · 09:36",
      createdBy: "Approval & routing agent",
      header: [
        { label: "Vendor", value: VENDOR },
        { label: "Agreement", value: SA },
        { label: "Payment terms", value: "Net 30" },
        { label: "Incoterms", value: "DAP · plant" },
      ],
      items: [
        { item: "10", material: MAT, description: "Filter bag · 25 micron · size 2 · Lindfeld", qty: "400 EA", netPrice: "19.90", value: "7,960.00", delivDate: "2026-07-03" },
        { item: "20", material: MAT, description: "Filter bag · 25 micron · size 2 · Winding Plant", qty: "380 EA", netPrice: "19.90", value: "7,562.00", delivDate: "2026-07-03" },
        { item: "30", material: MAT, description: "Filter bag · 25 micron · size 2 · Electronics Works", qty: "260 EA", netPrice: "19.90", value: "5,174.00", delivDate: "2026-07-03" },
      ],
      conditions: [
        { label: "Order quantity", value: "1,040 EA" },
        { label: "Unit price", value: "$19.90 / EA · 1,000+ break" },
        { label: "Net value", value: "$20,696.00" },
      ],
    }}
  />
);

/* ── The records the panels open ────────────────────────────────────────── */

/**
 * The signed agreement. Clause 4 and Schedule 1 are highlighted because they
 * are the two the recommendation actually rests on — the price is a function
 * of order quantity, and the schedule says by how much.
 */
const signedAgreement = (
  <ContractDoc
    d={{
      reference: `Agreement ${SA}`,
      title: "Outline Supply Agreement — MRO Filtration Consumables",
      effective: "1 January 2026",
      expires: "31 December 2026",
      parties: [
        {
          role: "the Buyer",
          name: "Orvantec AG",
          detail:
            "Purchasing organisation 1000 · acting for the Lindfeld, Riomar and Lianhe manufacturing sites",
        },
        {
          role: "the Supplier",
          name: `${VENDOR} B.V.`,
          detail: "Registered distributor of filtration consumables · vendor account 0001000207",
        },
      ],
      clauses: [
        {
          n: "1",
          heading: "Scope",
          body:
            "The Supplier shall supply the materials listed in Schedule 1 to any site of the Buyer named above, on receipt of a purchase order referencing this agreement.",
        },
        {
          n: "2",
          heading: "Term",
          body:
            "This agreement takes effect on 1 January 2026 and expires on 31 December 2026, unless extended in writing by both parties.",
        },
        {
          n: "3",
          heading: "Target volume",
          body:
            "The parties record an indicative annual target of 2,000 EA of the material in Schedule 1. The target is not a purchase commitment and does not oblige the Buyer to order any quantity.",
        },
        {
          n: "4",
          heading: "Price and quantity breaks",
          body:
            "Prices are those set out in Schedule 1. The applicable price is determined by the quantity ordered on a single purchase order, irrespective of the number of delivery points on that order. Quantities ordered on separate purchase orders shall not be aggregated for the purpose of determining the applicable break.",
          mark: true,
        },
        {
          n: "5",
          heading: "Price stability",
          body:
            "Prices in Schedule 1 are firm for the term. Any change requires ninety days' written notice and does not apply to purchase orders already placed.",
        },
        {
          n: "6",
          heading: "Payment",
          body: "Net 30 days from date of invoice. No settlement discount applies to this agreement.",
        },
        {
          n: "7",
          heading: "Delivery",
          body:
            "DAP, Buyer's named site (Incoterms 2020). Carriage is included in the prices in Schedule 1. A single purchase order may specify more than one delivery point at no additional charge.",
          mark: true,
        },
        {
          n: "8",
          heading: "Quality",
          body:
            "Each consignment shall be accompanied by a certificate of analysis. Materials shall carry a minimum residual shelf life of twelve months on delivery.",
        },
        {
          n: "9",
          heading: "Order processing",
          body:
            "The Buyer's internal processing cost is recorded at $75 per purchase order raised. This clause is recorded for the Buyer's cost accounting only and creates no obligation on the Supplier.",
        },
        {
          n: "10",
          heading: "Governing law",
          body: "This agreement is governed by the laws of the Federal Republic of Germany.",
        },
      ],
      schedules: [
        {
          label: "Schedule 1",
          title: `Price breaks · ${MAT}`,
          columns: ["Quantity on a single order", "Unit price", "Discount vs base"],
          rows: [
            { cells: [TIERS[0].band, TIERS[0].unit, "base"] },
            { cells: [TIERS[1].band, TIERS[1].unit, "−10%"] },
            { cells: [TIERS[2].band, TIERS[2].unit, "−20%"], mark: true },
            { cells: [TIERS[3].band, TIERS[3].unit, "−27%"] },
          ],
          note: "Filter bag · 25 micron · polypropylene felt · size 2 · snap band. Prices in USD per EA, carriage included.",
        },
        {
          label: "Schedule 2",
          title: "Named sites and delivery points",
          columns: ["Site", "Delivery address", "Plant code"],
          rows: [
            { cells: ["Lindfeld · Electronics Works", "Werkstrasse 4, Lindfeld", "1010"] },
            { cells: ["Lindfeld · Drive Systems Works", "Werkstrasse 11, Lindfeld", "1020"] },
            { cells: ["Riomar · Assembly & Packaging", "Poligono Industrial 7, Riomar", "2010"] },
            { cells: ["Lianhe · Electronics Works", "Lianhe Industrial Park, Building 3", "3010"] },
          ],
        },
      ],
      signatures: [
        {
          forParty: "Orvantec AG",
          name: "M. Reinhardt",
          title: "Head of Indirect Procurement",
          signedOn: "18 December 2025",
        },
        {
          forParty: `${VENDOR} B.V.`,
          name: "J. Okonkwo",
          title: "Commercial Director",
          signedOn: "19 December 2025",
        },
      ],
    }}
  />
);


/** How this category actually reaches procurement, and what that costs. */
const adoptionRecord = (
  <LookupSheetDoc
    sheets={[
      {
        file: "catalogue-adoption.xlsx",
        tab: "Filtration consumables · 12 months",
        columns: ["Channel", "Requisitions", "Share", "Average unit price"],
        usedNote: "→ this requisition arrived as free text",
        rows: [
          { cells: ["Catalogue line, priced automatically", "554", "64%", `$${UNIT}`], matched: false },
          { cells: ["Free text, structured by the agent", "312", "36%", "$24.80"], matched: true },
          { cells: ["Total", "866", "100%", "—"], matched: false },
        ],
      },
      {
        file: "catalogue-adoption.xlsx",
        tab: "Addressable value",
        columns: ["Driver", "Basis", "Value"],
        rows: [
          { cells: ["Price paid above the catalogue rate", "312 requests · $2.40 / EA average", "$68,000"], matched: false },
          { cells: ["Order processing on unstructured requests", "312 × $75 avoidable handling", "$23,400"], matched: false },
          { cells: ["Break positions missed by small orders", "Category volume never consolidated", "$122,600"], matched: false },
          { cells: ["Addressable value", "Against the 85% adoption target", "$214,000"], matched: true },
        ],
      },
    ]}
    footer={<>Adoption is measured against agreement {SA}. Reaching the 85% target is a routing change, not a price negotiation.</>}
  />
);

/** The consumption record, and the agreement the volume is bought under. */
const demandRecord = (
  <div className="space-y-4">
    <LookupSheetDoc
      sheets={[
        {
          file: "consumption-by-site.xlsx",
          tab: "MRO-FILT-BAG-25UM-PP · 12 months",
          columns: ["Site", "Orders placed", "Typical order size", "Annual volume", "Break reached"],
          usedNote: "→ 4,000 EA across the network",
          rows: [
            { cells: ["Lindfeld · Electronics Works", "4", "400 EA", "1,600 EA", "250–999 EA"], matched: true },
            { cells: ["Lindfeld · Drive Systems Works", "4", "250 EA", "1,000 EA", "250–999 EA"], matched: false },
            { cells: ["Lianhe · Electronics Works", "4", "200 EA", "800 EA", "1–249 EA"], matched: false },
            { cells: ["Riomar · Assembly & Packaging", "4", "150 EA", "600 EA", "1–249 EA"], matched: false },
            { cells: ["Network", "16", "—", "4,000 EA", "2,500 EA and above"], matched: false },
          ],
        },
      ]}
      footer={<>Sixteen separate orders in twelve months. No single one reached a break the network's own volume clears four times over.</>}
    />
    {signedAgreement}
  </div>
);

/** The arithmetic behind each option, shown rather than asserted. */
const splitWorking = (
  <LookupSheetDoc
    sheets={[
      {
        file: "order-strategy.xlsx",
        tab: "Three separate orders",
        columns: ["Requisition", "Site", "Quantity", "Break", "Unit price", "Goods value"],
        usedNote: "→ each order priced on its own quantity",
        rows: [
          { cells: [PR, "Deburring Plant", "400 EA", "250–999 EA", `$${UNIT}`, "$8,960.00"], matched: true },
          { cells: ["PR-48705", "Winding Plant", "380 EA", "250–999 EA", `$${UNIT}`, "$8,512.00"], matched: false },
          { cells: ["PR-48708", "Electronics Works", "260 EA", "250–999 EA", `$${UNIT}`, "$5,824.00"], matched: false },
          { cells: ["Goods value", "—", "1,040 EA", "—", "—", "$23,296.00"], matched: false },
          { cells: ["Order processing", "3 purchase orders", "—", "—", "$75 each", "$225.00"], matched: false },
          { cells: ["Total", "—", "1,040 EA", "—", "—", "$23,521.00"], matched: false },
        ],
      },
    ]}
    footer={<>Each site clears the 250–999 EA break on its own and stops there. The 1,000 EA break is never reached because no single order reaches it.</>}
  />
);

const joinedWorking = (
  <LookupSheetDoc
    sheets={[
      {
        file: "order-strategy.xlsx",
        tab: "One consolidated order",
        columns: ["Line", "Delivery point", "Quantity", "Break", "Unit price", "Goods value"],
        usedNote: `→ ${PO} · one order, three delivery points`,
        rows: [
          { cells: ["10", "Deburring Plant", "400 EA", "1,000–2,499 EA", `$${ORDER_UNIT}`, "$7,960.00"], matched: true },
          { cells: ["20", "Winding Plant", "380 EA", "1,000–2,499 EA", `$${ORDER_UNIT}`, "$7,562.00"], matched: true },
          { cells: ["30", "Electronics Works", "260 EA", "1,000–2,499 EA", `$${ORDER_UNIT}`, "$5,174.00"], matched: true },
          { cells: ["Goods value", "—", "1,040 EA", "—", "—", `$${ORDER_TOTAL}`], matched: false },
          { cells: ["Order processing", "1 purchase order", "—", "—", "$75", "$75.00"], matched: false },
          { cells: ["Total", "—", "1,040 EA", "—", "—", "$20,771.00"], matched: false },
        ],
      },
    ]}
    footer={<>Combining the three quantities reaches the 1,000 EA break, so every line is priced at ${ORDER_UNIT}. Delivery dates and destinations are unchanged.</>}
  />
);

/* ── What came back: the goods, then the invoice ────────────────────────── */

const grDoc = (
  <RecordDoc
    d={{
      tcode: "MB03",
      tname: "Display Material Document",
      number: GR,
      status: "Posted · 101 receipt · three plants",
      docType: `Goods receipt · ${PO}`,
      system: "Inventory management · MIGO",
      createdOn: "2026-07-03 · 11:40",
      createdBy: "Goods receiving · three sites",
      sections: [
        {
          band: "Receipt",
          rows: [
            { label: "PO reference", value: PO },
            { label: "Material", value: MAT },
            { label: "Deburring Plant", value: "400 EA · posted" },
            { label: "Winding Plant", value: "380 EA · posted" },
            { label: "Electronics Works", value: "260 EA · posted" },
            { label: "Total received", value: `${ORDER_QTY.toLocaleString("en-US")} EA` },
          ],
        },
      ],
      determination: {
        ok: true,
        text: `All ${ORDER_QTY.toLocaleString("en-US")} EA received against ${PO} on the scheduled date · each site posted its own line.`,
      },
    }}
  />
);

const invoiceDoc = (
  <RecordDoc
    d={{
      tcode: "MIR4",
      tname: "Display Invoice Document",
      number: INV,
      status: "Parked · awaiting match",
      docType: `Vendor invoice · ${VENDOR}`,
      system: "Invoice verification · LIV",
      createdOn: "2026-07-06 · 08:12",
      createdBy: "AP capture",
      sections: [
        {
          band: "Invoice header",
          rows: [
            { label: "Vendor", value: VENDOR },
            { label: "Invoice no.", value: INV },
            { label: "PO reference", value: PO },
            { label: "Payment terms", value: "Net 30" },
          ],
        },
        {
          band: "Invoice item",
          rows: [
            { label: "Material", value: MAT },
            { label: "Quantity", value: `${ORDER_QTY.toLocaleString("en-US")} EA` },
            { label: "Unit price", value: `$${ORDER_UNIT} / EA` },
            { label: "Net value", value: `$${ORDER_TOTAL}` },
          ],
        },
      ],
    }}
  />
);

const invoiceEmail = {
  from: `${VENDOR} · Accounts`,
  fromAddr: "ar@apexindustrial.example",
  receivedMeta: "Outlook · 2026-07-06 · 08:12",
  subject: `Invoice ${INV} — ${PO}`,
  lines: [
    `Please find our invoice ${INV} against purchase order ${PO}.`,
    `${ORDER_QTY.toLocaleString("en-US")} filter bags at $${ORDER_UNIT} each, $${ORDER_TOTAL} net, payment terms Net 30.`,
    "Delivered to all three sites on 3 July as scheduled.",
  ],
  attachment: invoiceDoc,
  attachmentLabel: `${INV} · vendor invoice`,
  headline: `${VENDOR} has invoiced the consolidated order`,
  previewNote: "Click to open the invoice",
  cta: "Match it against the order",
};

const matchResultDoc = (
  <RecordDoc
    d={{
      tcode: "MIRO",
      tname: "Enter Incoming Invoice",
      number: INV,
      status: "Matched · cleared for payment",
      docType: `Four-way match · ${INV}`,
      system: "Invoice verification · LIV",
      createdOn: "2026-07-06 · 08:19",
      createdBy: "Invoice Matching agent",
      sections: [
        {
          band: "Match result",
          rows: [
            { label: "Contract price", value: `$${ORDER_UNIT} / EA · ${SA} · 1,000+ break` },
            { label: "Ordered", value: `${ORDER_QTY.toLocaleString("en-US")} EA · ${PO}` },
            { label: "Received", value: `${ORDER_QTY.toLocaleString("en-US")} EA · ${GR}` },
            { label: "Invoiced", value: `${ORDER_QTY.toLocaleString("en-US")} EA · $${ORDER_TOTAL}` },
            { label: "Variance", value: "$0.00" },
          ],
        },
        {
          band: "Payment",
          rows: [
            { label: "Terms", value: "Net 30 from 2026-07-06" },
            { label: "Scheduled", value: "2026-08-05 payment run" },
          ],
        },
      ],
      determination: {
        ok: true,
        text: `Invoiced at the consolidated break rather than the rate a single site would have paid · the difference is realised at invoice.`,
      },
    }}
  />
);

const matchColumns = [
  { key: "invoice", label: "Invoice" },
  { key: "po", label: "PO" },
  { key: "gr", label: "GR" },
  { key: "contract", label: "Contract" },
];

const Q4 = ORDER_QTY.toLocaleString("en-US");
const matchRows = [
  { dimension: "Unit price (USD)", cells: { invoice: { value: ORDER_UNIT, ok: true }, po: { value: ORDER_UNIT, ok: true }, gr: { value: "—", ok: false }, contract: { value: ORDER_UNIT, ok: true } } },
  { dimension: "Quantity (EA)", cells: { invoice: { value: Q4, ok: true }, po: { value: Q4, ok: true }, gr: { value: Q4, ok: true }, contract: { value: Q4, ok: true } } },
  { dimension: "Net value (USD)", cells: { invoice: { value: ORDER_TOTAL, ok: true }, po: { value: ORDER_TOTAL, ok: true }, gr: { value: ORDER_TOTAL, ok: true }, contract: { value: ORDER_TOTAL, ok: true } } },
  { dimension: "Price break applied", cells: { invoice: { value: "1,000+", ok: true }, po: { value: "1,000+", ok: true }, gr: { value: "—", ok: false }, contract: { value: "1,000+", ok: true } } },
  { dimension: "Payment terms", cells: { invoice: { value: "Net 30", ok: true }, po: { value: "Net 30", ok: true }, gr: { value: "—", ok: false }, contract: { value: "Net 30", ok: true } } },
];

/* ── The run ────────────────────────────────────────────────────────────── */

export const filterBagSteps: RunStep[] = [
  {
    id: "intake",
    agentName: "PR Processing agent",
    n: 1,
    title: "Structure & code the request",
    sub: "Structures the request against the catalogue",
    aiThought:
      "A quarterly filter change has been submitted by Deburring Line 1 for 400 bags, with the material number stated. It should structure directly against the catalogue. The point worth noting is the channel it arrived on.",
    reasoning: [
      "Reading the submission from Deburring Line 1",
      "Matching the request to the catalogue item on the material master",
      "Coding cost centre 10034 · GL 600420",
      "Reviewing how this category's demand normally reaches procurement",
    ],
    docLabel: `${PR} · structured requisition`,
    document: structuredDoc,
    sources: [
      { id: "fb-freetext", label: "Request email", meta: "Intake portal · 09:04", kind: "email", body: filterFreeText },
      { id: "fb-master", label: "MM03 · material master", meta: "catalogue item", kind: "master", body: materialMaster },
    ],
    stages: [
      {
        sourceId: "fb-freetext",
        reasoning: "Extracting the item from the submission",
        title: "Item — what's needed",
        fields: [
          { label: "Material", value: MAT },
          { label: "Description", value: "Filter bag · 25 micron · polypropylene · size 2" },
          { label: "Quantity", value: `${QTY} EA` },
          { label: "UoM", value: "EA" },
          { label: "Delivery date", value: "2026-07-03" },
          { label: "Requisitioner", value: "Process engineer · Deburring Line 1" },
        ],
      },
      {
        sourceId: "fb-master",
        reasoning: "Matching the catalogue item and assigning the account",
        title: "Catalogue match & account assignment",
        fields: [
          { label: "Catalogue item", value: "Yes · listed since 2021" },
          { label: "Plant", value: "Lindfeld · Electronics Works" },
          { label: "Cost center", value: "10034 · Deburring & Finishing Maintenance" },
          { label: "G/L account", value: "600420 · Spare parts consumed" },
          { label: "Agreement price", value: `$${UNIT} / EA` },
          { label: "Line value", value: `$${TOTAL}` },
        ],
      },
    ],
    recommendation: `Structured against ${MAT} at ${QTY} EA, $${TOTAL} — an exact catalogue match. It was submitted as free text, which was avoidable: the item has been catalogued for five years.`,
    insight: {
      kind: "adoption",
      spec: {
        category: "Filtration consumables",
        current: 64,
        target: 85,
        identified: 312,
        worth: "$214,000",
        detail: adoptionRecord,
        detailTitle: "Catalogue adoption · filtration consumables",
        note: "This requisition is one of the 36% submitted as free text for an item already catalogued. Structuring it raises adoption; a further 312 comparable requests are recorded in the last twelve months of intake.",
      },
    },
  },
  {
    id: "vendor",
    agentName: "Master Data agent",
    n: 2,
    title: "Master data, duplicate & inventory",
    sub: "Verifies the item, duplicates and inventory",
    aiThought:
      "Three checks precede any purchase: the material record, an open duplicate, and available inventory. This requisition warrants a fourth — which other sites consume the same item.",
    reasoning: [
      "Confirming the material record and catalogue status",
      "Scanning open requisitions for a duplicate · none found",
      "Reading inventory at every site · buffers held, none sufficient for a change",
      "Retrieving twelve months of network consumption",
    ],
    docLabel: "VAL-48702-MD · master data",
    document: masterDataScore,
    sources: [
      { id: "fb-md-handoff", label: PR, meta: "from PR Processing", kind: "sap", handoff: true, body: structuredDoc },
      { id: "fb-mm", label: "MM03 · material master", meta: "basic · purchasing · accounting", kind: "master", body: materialMaster },
      { id: "fb-stock", label: "MB52 · stock overview", meta: "all plants", kind: "master", body: stockDoc },
    ],
    recommendation:
      "The material record is valid, no duplicate is open, and no site holds sufficient stock to cover a change. The purchase is justified. The consumption history also shows four sites purchasing the same item independently.",
    insight: {
      kind: "demand",
      spec: {
        totalLabel: "4,000 EA a year across the network",
        rows: [
          { site: "Lindfeld · Electronics Works", qty: "1,600 EA", share: 40 },
          { site: "Lindfeld · Drive Systems Works", qty: "1,000 EA", share: 25 },
          { site: "Lianhe · Electronics Works", qty: "800 EA", share: 20 },
          { site: "Riomar · Assembly & Packaging", qty: "600 EA", share: 15 },
        ],
        detail: demandRecord,
        detailTitle: "Network consumption & outline agreement SA-MRO-07",
        note: "Four sites consume the same item under four separate ordering patterns. Each orders a quarter at a time and is therefore priced as a small-volume buyer, despite the combined network volume.",
      },
    },
  },
  {
    id: "sourcing",
    agentName: "Sourcing & contract agent",
    n: 3,
    title: "Supplier & price break",
    sub: "Prices the requisition against the published breaks",
    aiThought:
      "The supplier is established: Apex holds the agreement for this item. The price is not, in the same sense — the agreement publishes four breaks, and the applicable rate depends on the quantity placed on a single order.",
    reasoning: [
      "Confirming Apex is approved and on agreement SA-MRO-07",
      `Reading the four published breaks · ${TIERS[0].unit} down to ${TIERS[3].unit}`,
      `A ${QTY} EA order prices at $${UNIT} · correct for that quantity`,
      "Applying the network's annual volume to the same table",
    ],
    docLabel: "Agreement price & published breaks",
    document: priceSheet,
    sources: [
      { id: "fb-src-handoff", label: "VAL-48702-MD", meta: "from Master Data", kind: "sap", handoff: true, body: masterDataScore },
      { id: "fb-agreement", label: `ME33K · ${SA}`, meta: "price · vendor · terms", kind: "contract", body: outlineAgreement },
    ],
    recommendation: `Correctly priced at $${UNIT} / EA for a ${QTY} EA order. Correct is not the same as optimal: at the volume the network already consumes, the agreement's own price list contains two lower rows.`,
    insight: {
      kind: "pricing",
      spec: {
        tiers: [
          { band: TIERS[0].band, unit: TIERS[0].unit, note: "Current order size at Riomar and Lianhe" },
          { band: TIERS[1].band, unit: TIERS[1].unit, note: "This requisition · 400 EA", state: "current" },
          { band: TIERS[2].band, unit: TIERS[2].unit, note: "Three open requisitions combined" },
          { band: TIERS[3].band, unit: TIERS[3].unit, note: "Annual network demand under one call-off", state: "best" },
        ],
        calc: [
          { label: "Network volume · last twelve months", value: "4,000 EA" },
          { label: "Cost as currently purchased, site by site", value: "$92,960" },
          { label: "Same volume under one annual call-off", value: "$72,400" },
          { label: "Difference", value: "$20,560", strong: true },
        ],
        detail: signedAgreement,
        detailTitle: `Outline Supply Agreement ${SA} · clause 4 and Schedule 1`,
        note: "No site is paying an incorrect price. Each is paying the contracted rate for the order quantity placed. The opportunity is in order size, not in the rate itself.",
      },
    },
  },
  {
    id: "orchestrator",
    agentName: "Approval & routing agent",
    n: 4,
    title: "Approval, routing & order strategy",
    sub: "Releases the requisition and sets the order strategy",
    aiThought:
      "All controls pass and no signature is required, so this would normally release unattended. Before it does: the Winding Plant and the Electronics Works both have open requisitions for the same item this week.",
    reasoning: [
      "Confirming cost centre 10034 / GL 600420",
      `On agreement — competitive bidding not required`,
      `$${TOTAL} is inside the plant-maintenance limit`,
      "Identifying two further open requisitions for the same item this week",
      "Costing them as three orders and as one",
    ],
    docLabel: "VAL-48702-APR · approval",
    document: approvalScore,
    sources: [
      { id: "fb-apr-handoff", label: "Price & breaks", meta: "from Sourcing", kind: "sap", handoff: true, body: priceSheet },
      { id: "fb-routing", label: "DOA release routing", meta: "WF-48702-REL", kind: "policy", body: routing },
      { id: "fb-po", label: PO, meta: "SAP ME23N", kind: "sap", body: poDoc },
    ],
    recommendation:
      "Released under the plant delegation of authority. The decision required is not whether to purchase but how to place the order: three sites require the same item this week, and a single order reaches a price break that three separate orders do not.",
    insight: {
      kind: "consolidation",
      spec: {
        recommend: "joined",
        split: {
          title: "Three separate purchase orders",
          total: "$23,521",
          sub: "Lindfeld 400 EA · Winding 380 EA · Electronics 260 EA",
          caption: "Each priced at the 250–999 EA break",
          detail: splitWorking,
        },
        joined: {
          title: "One consolidated purchase order",
          total: "$20,771",
          sub: "1,040 EA · three delivery points",
          caption: "$2,750 lower · reaches the 1,000 EA break",
          detail: joinedWorking,
        },
        rows: [
          { label: "Goods value · three orders at $22.40", value: "$23,296" },
          { label: "Goods value · one order at $19.90", value: "$20,696", tone: "good" },
          { label: "Order processing cost · 3 × $75", value: "$225" },
          { label: "Order processing cost · 1 × $75", value: "$75", tone: "good" },
          { label: "Difference", value: "$2,750", tone: "good" },
        ],
        note: "Identical material, week, supplier and delivery dates. The only variable is the number of purchase orders raised, and that variable is worth $2,750 without any negotiation.",
      },
    },
    email: {
      cta: "Release & place the consolidated order",
      to: `${VENDOR} · Sales`,
      subject: `${PO} — 1,040 filter bags, three delivery points`,
      lines: [
        "Please process this as a single order against SA-MRO-07 at the 1,000+ break.",
        "1,040 filter bags, 25 micron, size 2 — 400 to Lindfeld, 380 to Winding, 260 to the Electronics Works, all for 3 July.",
        "Purchase order PO-77351 is attached. Please confirm the delivery date.",
      ],
      attachmentLabel: `${PO} · ME23N`,
      toastTitle: "Order placed",
      toastBody: `${PO} sent to ${VENDOR} · ${Q4} EA at $${ORDER_UNIT}, $2,750 below three separate orders.`,
    },
  },
  {
    id: "invoice",
    agentName: "Invoice Matching agent",
    n: 5,
    title: "Invoice four-way match",
    sub: "Verifies the contracted break was invoiced",
    aiThought:
      "Delivery is complete at all three plants and Apex has invoiced. One question remains, and it is the material one: was the invoice raised at the consolidated break, or at the rate a single site would have paid?",
    reasoning: [
      `Invoice ${INV} captured · $${ORDER_TOTAL}`,
      `Reading purchase order ${PO} — one order, three delivery points`,
      `Reading goods receipt ${GR} — ${Q4} EA posted across three plants`,
      `Reading the agreement — the 1,000+ break at $${ORDER_UNIT} / EA`,
      "Four-way match — every dimension agrees",
    ],
    docLabel: `${INV} · four-way match`,
    document: matchResultDoc,
    inboundEmail: invoiceEmail,
    sources: [
      { id: "fb-inv", label: INV, meta: "Apex invoice · captured", kind: "invoice", handoff: true, body: invoiceDoc },
      { id: "fb-po-match", label: PO, meta: "SAP ME23N", kind: "sap", body: poDoc },
      { id: "fb-gr-match", label: GR, meta: "SAP MB03 · three plants", kind: "sap", body: grDoc },
      { id: "fb-contract-match", label: `ME33K · ${SA}`, meta: "outline agreement", kind: "contract", body: outlineAgreement },
    ],
    recommendation: `Contract, order, goods receipt and invoice agree to the cent at $${ORDER_UNIT} / EA — the 1,000+ break, not the $${UNIT} a single site would have been billed. $${ORDER_TOTAL} released to the payment run, with the $2,750 difference realised at invoice.`,
    stages: [
      {
        sourceId: "fb-po-match",
        reasoning: "Comparing the invoice against the purchase order",
        title: "Four-way match — invoice vs PO",
        matchGrid: { columns: matchColumns, rows: matchRows, reveal: ["invoice", "po"] },
      },
      {
        sourceId: "fb-gr-match",
        reasoning: "Adding the quantities received at the three sites",
        title: "Four-way match — adding the goods receipt",
        matchGrid: { columns: matchColumns, rows: matchRows, reveal: ["invoice", "po", "gr"] },
      },
      {
        sourceId: "fb-contract-match",
        reasoning: "Confirming the break the agreement specifies",
        title: "Four-way match — adding the contract · verdict",
        matchGrid: {
          columns: matchColumns,
          rows: matchRows,
          reveal: ["invoice", "po", "gr", "contract"],
          verdict: `All four sources agree at $${ORDER_UNIT} per unit for ${Q4} EA, invoiced at the consolidated break · no variance between order and invoice.`,
        },
      },
    ],
  },
];
