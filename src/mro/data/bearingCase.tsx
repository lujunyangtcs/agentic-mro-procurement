/**
 * The clean run — a pump-diaphragm request that never needs a person.
 *
 * Everything the exception cases exist to show is absent here on purpose: the
 * engineer writes a complete request, the material is on the master, the stock
 * is genuinely out, the supplier is on an agreement, the money is inside the
 * plant's own limit. So the workforce reads it, codes it, checks it, releases
 * it, and — when the invoice arrives — four-way matches it and schedules the
 * payment, with nobody clicking an approval anywhere.
 *
 * That is the point of the story: the same six agents that stop the seal
 * request cold let this one straight through, and you can see exactly why at
 * every step, because each check shows the document it read.
 *
 * Every figure below ties to the requisition and the invoice tie-out of the
 * same ids in `procurement.ts` — 6 EA at $148.00 is $888.00 everywhere.
 */

import type { RunStep } from "@/mro/data/runSteps";
import { StructuredPrDoc } from "@/mro/components/docs/pr/PrDocs";
import {
  MaterialMasterDoc,
  StockOverviewDoc,
  OutlineAgreementDoc,
  ApprovalRoutingDoc,
  PurchaseOrderDoc,
  RecordDoc,
} from "@/mro/components/docs/pr/SapDocs";
import { MultilingualEmailDoc } from "@/mro/components/docs/pr/MultilingualEmail";
import { LookupSheetDoc } from "@/mro/components/docs/pr/LookupSheet";

/* The one place these numbers are written down. */
const PR = "PR-48692";
const MAT = "MRO-DIAPH-PTFE-2IN";
const ITEM = "Diaphragm — PTFE — 2 in transfer pump";
const QTY = 6;
const UNIT = "148.00";
const TOTAL = "888.00";
const VENDOR = "Apex Industrial Supply";
const SA = "SA-MRO-07";
const PO = "PO-77342";
const GR = "GR-77342";
const INV = "BPI-5602";
const COST_CENTER = "10034 · Deburring & Finishing Maintenance";
const GL = "600420 · Spare parts consumed";

/* ── The documents ──────────────────────────────────────────────────────── */

/**
 * The request as it arrived. The German plant runs its maintenance planning in
 * English, so this one needs no translation — which is itself worth seeing
 * beside the seal request that does.
 */
export const bearingFreeText = (
  <MultilingualEmailDoc
    from="Instandhaltungsplanung · Deburring Plant"
    fromAddr="planer@orvantec.com"
    to="Procurement intake"
    sent="2026-06-26 · 08:12"
    sourceLang="de"
    original={{
      subject: "Membranwechsel — Montagelinie 1, Zulaufpumpe",
      lines: [
        "Bitte 6 PTFE-Membranen für die 2-Zoll-Doppelmembranpumpe an der Montagelinie 1 bestellen. Das ist unser übliches Wartungsersatzteil, Materialnummer MRO-DIAPH-PTFE-2IN.",
        "Gleicher Artikel wie bei den letzten beiden Bestellungen, von Apex im Rahmen unseres Rahmenvertrags. Sechs Stück decken den planmäßigen Wechsel plus das Ersatzteil im Regal.",
        "Benötigt für den geplanten Stillstand am 10. Juli — vorher besteht kein Produktionsrisiko.",
      ],
    }}
    translated={{
      subject: "Diaphragm replacement — Assembly Line 1 transfer pump",
      lines: [
        "Please order 6 PTFE diaphragms for the 2 in double-diaphragm pump on Assembly Line 1. This is our standard planned-maintenance replacement, part number MRO-DIAPH-PTFE-2IN.",
        "Same item as the last two orders, from Apex under our agreement. Six covers the scheduled change plus the shelf spare.",
        "Needed for the planned shutdown on 10 July — no production risk before then.",
      ],
    }}
  />
);
export const bearingStructuredDoc = (
  <StructuredPrDoc
    pr={{
      number: PR,
      status: "Structured · complete",
      createdOn: "2026-06-26 · 08:14",
      createdBy: "PR Processing agent",
      materialCode: MAT,
      description: ITEM,
      plant: "Deburring Plant · Assembly Line 1",
      costCenter: COST_CENTER,
      glAccount: GL,
      confidence: "100%",
      prType: "NB · Standard requisition",
      requestor: "Maintenance planner · Assembly Line 1",
      purchOrg: "1000 · Orvantec Procurement",
      purchGroup: "200 · MRO / Maintenance",
      item: [
        { label: "Material", value: MAT },
        { label: "Description", value: ITEM },
        { label: "Quantity", value: `${QTY} EA` },
        { label: "UoM", value: "EA" },
      ],
      assignment: [
        { label: "Cost center", value: COST_CENTER },
        { label: "G/L account", value: GL },
        { label: "Plant", value: "Deburring Plant · Assembly Line 1" },
      ],
      valuation: [
        { label: "Unit price", value: `$${UNIT} / EA` },
        { label: "Total value", value: `$${TOTAL}` },
        { label: "Currency", value: "USD" },
      ],
      sourceOfSupply: [
        { label: "Supplier", value: VENDOR },
        { label: "Outline agreement", value: `${SA} · MRO spares` },
      ],
      deliveryTerms: [
        { label: "Payment terms", value: "Net 30" },
        { label: "Incoterms", value: "FCA · Apex DC" },
        { label: "Delivery date", value: "2026-07-08" },
      ],
    }}
  />
);

const bearingRequestorRef = (
  <LookupSheetDoc
    sheets={[
      {
        file: "requisitioners.xlsx",
        tab: "Plant directory",
        columns: ["Requestor", "Plant", "Purch org", "Purch grp", "PR type"],
        usedNote: "→ ML1",
        rows: [
          { cells: ["Maintenance planner · Assembly Line 1", "Amberg · ML1", "1000", "200 · MRO", "NB"], flag: true },
          { cells: ["Plant engineer · Assembly Line 2", "Amberg · ML2", "1000", "200 · MRO", "NB"], matched: false },
          { cells: ["Plant engineer · Deburring Line 3", "Amberg · BM3", "1000", "200 · MRO", "NB"], matched: false },
        ],
      },
    ]}
    footer={
      <>
        The planner's own directory row sets the header — purchasing org 1000, group 200 (MRO /
        Maintenance), PR type NB. Nothing is taken from the free text.
      </>
    }
  />
);

const bearingCodingRef = (
  <LookupSheetDoc
    sheets={[
      {
        file: "material-catalog.xlsx",
        tab: "MRO catalogue",
        columns: ["Material", "Description", "Group", "UoM"],
        usedNote: "→ exact part number given · 100% match",
        rows: [
          { cells: [MAT, "PTFE diaphragm · 2 in transfer pump", "MRO · pump spares", "EA"], flag: true },
          { cells: ["MRO-DIAPH-PTFE-15IN", "PTFE diaphragm · 1.5 in dosing pump", "MRO · pump spares", "EA"], matched: false },
          { cells: ["MRO-SEAL-MECH-50MM-SIC", "Mechanical seal 50 mm · SiC faces", "MRO · seals", "EA"], matched: false },
        ],
      },
      {
        file: "coding-rules.xlsx",
        tab: "Cost centers",
        columns: ["Cost center", "Description", "Plant"],
        usedNote: "→ 10034 · Deburring & Finishing Maintenance",
        rows: [
          { cells: ["10034", "Deburring & Finishing Maintenance", "Amberg"], flag: true },
          { cells: ["10031", "Drive Systems Maintenance", "Clairmont"], matched: false },
        ],
      },
    ]}
    footer={
      <>
        The planner gave the part number outright, so there is nothing to infer — the catalogue
        row matches exactly and the coding follows the plant's standing rule.
      </>
    }
  />
);

export const bearingMaterialMaster = (
  <MaterialMasterDoc
    m={{
      number: MAT,
      description: "PTFE diaphragm · 2 in transfer pump · bolted centre · PTFE-fitted",
      status: "Active · stocked",
      createdOn: "2022-03-11 · 09:02",
      createdBy: "Master data",
      basic: [
        { label: "Material group", value: "MRO · pump spares" },
        { label: "Base UoM", value: "EA" },
        { label: "Material type", value: "ERSA · spare part" },
      ],
      purchasing: [
        { label: "Purchasing group", value: "200 · MRO / Maintenance" },
        { label: "Outline agreement", value: `${SA} · ${VENDOR}` },
        { label: "Last purchase", value: `2026-04-14 · $${UNIT} / EA` },
      ],
      accounting: [
        { label: "Valuation class", value: "3040 · Spare parts" },
        { label: "Standard price", value: `$${UNIT} / EA` },
        { label: "Plant", value: "Deburring Plant" },
      ],
    }}
  />
);

const bearingStockDoc = (
  <StockOverviewDoc
    s={{
      number: MAT,
      description: ITEM,
      createdOn: "2026-06-26 · 08:17",
      createdBy: "Master Data agent",
      rows: [
        { plant: "Deburring Plant", storageLoc: "ML1 · line store", onHand: "0", safety: "2", uom: "EA", tone: "short" },
        { plant: "Clairmont · Drives & Power", storageLoc: "Main store", onHand: "0", safety: "0", uom: "EA" },
        { plant: "Riomar · Assembly & Packaging", storageLoc: "Main store", onHand: "0", safety: "0", uom: "EA" },
      ],
      note: "No stock anywhere in the network and none on order — buying is the only way to cover the shutdown.",
    }}
  />
);

export const bearingOutlineAgreement = (
  <OutlineAgreementDoc
    a={{
      number: SA,
      status: "Released · valid",
      createdOn: "2026-01-01 · 00:01",
      createdBy: "Sourcing & contract",
      header: [
        { label: "Vendor", value: VENDOR },
        { label: "Agreement type", value: "LP · outline agreement · MRO spares" },
        { label: "Validity", value: "2026-01-01 → 2026-12-31" },
        { label: "Payment terms", value: "Net 30" },
      ],
      items: [
        { item: "10", material: MAT, description: "PTFE diaphragm · 2 in transfer pump", targetQty: "200 EA", netPrice: UNIT, per: "1 EA" },
        { item: "20", material: "MRO-SEAL-MECH-50MM-SIC", description: "Mechanical seal 50 mm · SiC faces", targetQty: "20 EA", netPrice: "4,180.00", per: "1 EA" },
      ],
      conditions: [
        { label: "Price basis", value: "Fixed for the agreement term" },
        { label: "Incoterms", value: "FCA · Apex DC" },
      ],
    }}
  />
);

const bearingApprovalRouting = (
  <ApprovalRoutingDoc
    r={{
      number: "WF-48692-REL",
      status: "Released by rule",
      createdOn: "2026-06-26 · 08:29",
      createdBy: "Approval & routing agent",
      summary: [
        { label: "Document", value: `${PR} · ${ITEM}` },
        { label: "Requestor", value: "Maintenance planner · Assembly Line 1" },
        { label: "Amount", value: `$${TOTAL}` },
      ],
      chain: [
        { level: "L1", approver: "Plant Maintenance lead", role: "Plant", limit: "$5,000", status: "approved", when: "Released by rule · 08:29" },
        { level: "L2", approver: "Site Procurement manager", role: "Site", limit: "$25,000", status: "not-reached", when: "—" },
        { level: "L3", approver: "Category director", role: "Group", limit: "Any amount", status: "not-reached", when: "—" },
      ],
      validation: {
        ok: true,
        text: `At $${TOTAL} the request sits inside the plant lead's standing limit, at the price we already hold, for a material on the master. The rule releases it — nobody is asked to approve what the rule already covers.`,
      },
    }}
  />
);

const bearingPoDoc = (
  <PurchaseOrderDoc
    p={{
      number: PO,
      status: "Released · goods received",
      createdOn: "2026-06-26 · 08:31",
      createdBy: "Approval & routing agent",
      header: [
        { label: "Vendor", value: VENDOR },
        { label: "Material", value: MAT },
        { label: "Payment terms", value: "Net 30" },
        { label: "Incoterms", value: "FCA · Apex DC" },
        { label: "Currency", value: "USD" },
      ],
      items: [
        { item: "10", material: MAT, description: "PTFE diaphragm · 2 in transfer pump", qty: `${QTY} EA`, netPrice: UNIT, value: TOTAL, delivDate: "2026-07-08" },
      ],
      conditions: [
        { label: "Net value", value: `$${TOTAL}` },
        { label: "Tax (U1)", value: "$0.00 · reverse charge" },
        { label: "Total", value: `$${TOTAL}` },
      ],
      release: [{ label: "L1 · Plant Maintenance", value: "Released by rule — inside standing limit" }],
    }}
  />
);

const bearingGrDoc = (
  <RecordDoc
    d={{
      tcode: "MB03",
      tname: "Display Material Document",
      number: GR,
      status: "Posted · 101 receipt",
      docType: `Goods receipt · ${PO}`,
      system: "Inventory management · MIGO",
      createdOn: "2026-07-06 · 07:20",
      createdBy: "Goods receiving · Assembly Line 1",
      sections: [
        {
          band: "Receipt",
          rows: [
            { label: "PO reference", value: PO },
            { label: "Material", value: MAT },
            { label: "Movement type", value: "101 · GR goods receipt" },
            { label: "Quantity received", value: `${QTY} EA` },
            { label: "Plant / SLoc", value: "Amberg · Assembly Line 1" },
          ],
        },
      ],
      determination: {
        ok: true,
        text: `All ${QTY} EA received against ${PO}, two days before the shutdown. GR/IR clearing stays open until the invoice posts.`,
      },
    }}
  />
);

const bearingInvoiceDoc = (
  <RecordDoc
    d={{
      tcode: "MIR4",
      tname: "Display Invoice Document",
      number: INV,
      status: "Parked · awaiting match",
      docType: `Vendor invoice · ${VENDOR}`,
      system: "Invoice verification · LIV",
      createdOn: "2026-07-07 · 06:05",
      createdBy: "AP capture",
      sections: [
        {
          band: "Invoice header",
          rows: [
            { label: "Vendor", value: VENDOR },
            { label: "Invoice no.", value: INV },
            { label: "PO reference", value: PO },
            { label: "Payment terms", value: "Net 30" },
            { label: "Currency", value: "USD" },
          ],
        },
        {
          band: "Amounts",
          rows: [
            { label: "Unit price", value: `$${UNIT} / EA` },
            { label: "Quantity", value: `${QTY} EA` },
            { label: "Net value", value: `$${TOTAL}` },
            { label: "Tax code", value: "U1 · reverse charge" },
            { label: "Gross", value: `$${TOTAL}` },
          ],
        },
      ],
    }}
  />
);

const bearingMatchResultDoc = (
  <RecordDoc
    d={{
      tcode: "MIRO",
      tname: "Enter Incoming Invoice",
      number: INV,
      status: "Matched · cleared for payment",
      docType: `Four-way match · ${INV}`,
      system: "Invoice verification · LIV",
      createdOn: "2026-07-07 · 06:06",
      createdBy: "Warranty & coverage desk",
      sections: [
        {
          band: "Match result",
          rows: [
            { label: "Contract price", value: `$${UNIT} / EA · ${SA}` },
            { label: "Ordered", value: `${QTY} EA · ${PO}` },
            { label: "Received", value: `${QTY} EA · ${GR}` },
            { label: "Invoiced", value: `${QTY} EA · $${TOTAL}` },
            { label: "Variance", value: "$0.00" },
          ],
        },
        {
          band: "Payment",
          rows: [
            { label: "Terms", value: "Net 30 from 2026-07-07" },
            { label: "Scheduled", value: "2026-08-06 payment run" },
            { label: "Blocked", value: "No — nothing held back" },
          ],
        },
      ],
      determination: {
        ok: true,
        text: "Contract, order, goods receipt and invoice agree on every dimension. Cleared for the payment run with no person involved.",
      },
    }}
  />
);

/* ── The four-way grid ──────────────────────────────────────────────────── */

const matchColumns = [
  { key: "invoice", label: "Invoice" },
  { key: "po", label: "PO" },
  { key: "gr", label: "GR" },
  { key: "contract", label: "Contract" },
];

const matchRows = [
  { dimension: "Unit price (USD)", cells: { invoice: { value: UNIT, ok: true }, po: { value: UNIT, ok: true }, gr: { value: "—", ok: false }, contract: { value: UNIT, ok: true } } },
  { dimension: "Quantity (EA)", cells: { invoice: { value: String(QTY), ok: true }, po: { value: String(QTY), ok: true }, gr: { value: String(QTY), ok: true }, contract: { value: String(QTY), ok: true } } },
  { dimension: "Net value (USD)", cells: { invoice: { value: TOTAL, ok: true }, po: { value: TOTAL, ok: true }, gr: { value: TOTAL, ok: true }, contract: { value: TOTAL, ok: true } } },
  { dimension: "Tax code", cells: { invoice: { value: "U1", ok: true }, po: { value: "U1", ok: true }, gr: { value: "—", ok: false }, contract: { value: "U1", ok: true } } },
  { dimension: "Payment terms", cells: { invoice: { value: "Net 30", ok: true }, po: { value: "Net 30", ok: true }, gr: { value: "—", ok: false }, contract: { value: "Net 30", ok: true } } },
];

/* ── The run ────────────────────────────────────────────────────────────── */

export const bearingPrSteps: RunStep[] = [
  {
    id: "intake",
    agentName: "PR Processing agent",
    n: 1,
    title: "Structure & code the request",
    sub: "Turns the planner's note into a coded requisition",
    aiThought:
      "A planned-maintenance request has come in from Assembly Line 1 — six pump diaphragms for the July shutdown. The planner gave the part number outright, so this should code cleanly. Let me read it and structure it.",
    reasoning: [
      "Reading the planner's note from Assembly Line 1",
      `Part number given in full — ${MAT}`,
      `Quantity ${QTY} EA · needed for the 10 July shutdown`,
      `Coding cost center ${COST_CENTER.split(" · ")[0]} · G/L ${GL.split(" · ")[0]}`,
      "No gaps to flag",
    ],
    docLabel: `${PR} · structured requisition`,
    document: bearingStructuredDoc,
    sources: [
      { id: "bearing-freetext", label: "Request email", meta: "Intake portal · 08:12", kind: "email", body: bearingFreeText },
      { id: "bearing-requestor", label: "Requisitioner & org", meta: "plant directory", kind: "master", body: bearingRequestorRef },
      { id: "bearing-coding-ref", label: "Master-data lookup", meta: "catalogue · cost centers", kind: "master", body: bearingCodingRef },
    ],
    recommendation: `Structured and coded to ${MAT}, ${QTY} EA at $${UNIT}, total $${TOTAL}. Nothing is open — the part number, the quantity and the date were all given. Routed straight for the checks.`,
    stages: [
      {
        sourceId: "bearing-freetext",
        reasoning: "Extracting the item from the planner's note",
        title: "Item — what's needed",
        fields: [
          { label: "Material", value: `${MAT} · given in full` },
          { label: "Description", value: "PTFE diaphragm · 2 in transfer pump" },
          { label: "Quantity", value: `${QTY} EA` },
          { label: "UoM", value: "EA" },
          { label: "Delivery date", value: "2026-07-08", type: "date" },
          { label: "Requisitioner", value: "Maintenance planner · Assembly Line 1" },
        ],
      },
      {
        sourceId: "bearing-requestor",
        reasoning: "Setting the requisition header from the plant directory",
        title: "Requisition header",
        fields: [
          { label: "PR type", value: "NB · Standard requisition" },
          { label: "Requestor", value: "Maintenance planner · Assembly Line 1" },
          { label: "Purch. org", value: "1000 · Orvantec Procurement" },
          { label: "Purch. group", value: "200 · MRO / Maintenance" },
        ],
      },
      {
        sourceId: "bearing-coding-ref",
        reasoning: "Coding the account assignment against master data",
        title: "Account assignment",
        fields: [
          { label: "Material code", value: MAT },
          { label: "Plant", value: "Deburring Plant · Assembly Line 1" },
          { label: "Cost center", value: COST_CENTER },
          { label: "G/L account", value: GL },
        ],
      },
    ],
  },
  {
    id: "vendor",
    agentName: "Master Data agent",
    n: 2,
    title: "Master data, duplicate & inventory",
    sub: "Checks the material, open requests and stock",
    aiThought:
      "Before anyone buys anything, three questions: is this a real material, has someone already asked for it, and do we already own it? Let me check all three.",
    reasoning: [
      `Material master ${MAT} — active and stocked`,
      "Scanning open requisitions for the same material — none found",
      "Stock on hand across every plant — zero, and below safety stock here",
    ],
    docLabel: `${MAT} · material master`,
    document: bearingMaterialMaster,
    sources: [
      { id: "bearing-mm", label: "MM03 · material master", meta: "basic · purchasing · MRP", kind: "master", body: bearingMaterialMaster },
      { id: "bearing-stock", label: "MB52 · stock overview", meta: "all plants", kind: "master", body: bearingStockDoc },
    ],
    recommendation:
      "Material is active and stocked, no duplicate request is open, and the network holds none. There is nothing here that would stop the buy.",
    stages: [
      {
        sourceId: "bearing-mm",
        reasoning: "Confirming the material exists and is bought under agreement",
        title: "Material master · MM03",
        fields: [
          { label: "Material", value: MAT },
          { label: "Status", value: "Active · stocked" },
          { label: "Valuation class", value: "3040 · Spare parts" },
          { label: "Last purchase", value: `2026-04-14 · ${VENDOR}` },
        ],
      },
      {
        sourceId: "bearing-stock",
        reasoning: "Checking every plant before buying anything",
        title: "Stock overview · MB52",
        fields: [
          { label: "Amberg · Assembly Line 1", value: "0 EA on hand · safety 2 EA" },
          { label: "Clairmont", value: "0 EA · not stocked" },
          { label: "Riomar", value: "0 EA · not stocked" },
          { label: "Verdict", value: "Nothing to transfer — the buy stands" },
        ],
      },
    ],
  },
  {
    id: "invoice",
    agentName: "Warranty & coverage desk",
    n: 3,
    title: "Warranty & coverage",
    sub: "Checks whether someone else should pay for this",
    aiThought:
      "A diaphragm change can sometimes sit under an equipment warranty or a service contract. If it does, we should not be buying it at all. Let me check the register.",
    reasoning: [
      "Equipment register · Assembly Line 1 drive end",
      "Drive rebuilt 2023 — parts warranty expired 2024",
      "No service contract covering consumable pump spares",
      "This is a planned replacement, not a failure claim",
    ],
    docLabel: "Coverage check · Assembly Line 1",
    document: (
      <RecordDoc
        d={{
          tcode: "IQS3",
          tname: "Display Equipment Coverage",
          number: "WTY-CHK-48692",
          status: "Checked · not covered",
          docType: "Warranty & service-contract check",
          system: "Plant maintenance",
          createdOn: "2026-06-26 · 08:19",
          createdBy: "Warranty & coverage desk",
          sections: [
            {
              band: "Coverage",
              rows: [
                { label: "Equipment", value: "Assembly Line 1 · drive end" },
                { label: "Parts warranty", value: "Expired 2024-05-30" },
                { label: "Service contract", value: "None covering consumable pump spares" },
                { label: "Failure claim", value: "No — planned replacement" },
              ],
            },
          ],
          determination: {
            ok: true,
            text: "Nothing else covers this. The plant pays for it, which is what the requisition already assumes.",
          },
        }}
      />
    ),
    sources: [
      { id: "bearing-wty", label: "IQS3 · coverage", meta: "equipment register", kind: "master", body: <RecordDoc d={{ tcode: "IQS3", tname: "Display Equipment Coverage", number: "WTY-CHK-48692", status: "Checked · not covered", docType: "Warranty & service-contract check", system: "Plant maintenance", createdOn: "2026-06-26 · 08:19", createdBy: "Warranty & coverage desk", sections: [{ band: "Coverage", rows: [{ label: "Equipment", value: "Assembly Line 1 · drive end" }, { label: "Parts warranty", value: "Expired 2024-05-30" }, { label: "Service contract", value: "None covering consumable pump spares" }] }], determination: { ok: true, text: "Nothing else covers this — the plant pays." } }} /> },
    ],
    recommendation:
      "Out of warranty and outside every service contract, and it is a planned change rather than a failure. The plant carries the cost.",
    stages: [
      {
        sourceId: "bearing-wty",
        reasoning: "Reading the equipment's coverage history",
        title: "Warranty & coverage · IQS3",
        fields: [
          { label: "Parts warranty", value: "Expired 2024-05-30" },
          { label: "Service contract", value: "None applicable" },
          { label: "Outcome", value: "Not covered — plant pays" },
        ],
      },
    ],
  },
  {
    id: "sourcing",
    agentName: "Sourcing & contract agent",
    n: 4,
    title: "Supplier & price",
    sub: "Checks the price we already hold for this item",
    aiThought:
      "We already buy this diaphragm, from this supplier, at a price we hold on file — the planner even named them. So there is nothing to source and nothing to negotiate. All I need to do is confirm the request matches the price we hold.",
    reasoning: [
      `${VENDOR} · the supplier we buy this from`,
      `${MAT} · $${UNIT} / EA, the price on file`,
      "Terms Net 30 · price held to 2026-12-31",
      `The request matches it exactly — $${TOTAL} for ${QTY} EA`,
    ],
    docLabel: `${SA} · outline agreement`,
    document: bearingOutlineAgreement,
    sources: [
      { id: "bearing-agreement", label: `ME33K · ${SA}`, meta: "price · vendor · terms", kind: "contract", body: bearingOutlineAgreement },
    ],
    recommendation: `The price the plant asked for is the price we already hold — $${UNIT} an each, ${QTY} of them, $${TOTAL}. Nothing to source, nothing to quote, nothing to negotiate.`,
    stages: [
      {
        sourceId: "bearing-agreement",
        reasoning: "Matching the request to the price we hold",
        title: `Price · ME33K ${SA}`,
        fields: [
          { label: "Supplier", value: VENDOR },
          { label: "Price we hold", value: `$${UNIT} / EA` },
          { label: "Price requested", value: `$${UNIT} / EA` },
          { label: "Line value", value: `$${TOTAL}` },
          { label: "Terms", value: "Net 30 · valid to 2026-12-31" },
        ],
      },
    ],
  },
  {
    id: "orchestrator",
    agentName: "Approval & routing agent",
    n: 5,
    title: "Approval & routing",
    sub: "Applies the plant's own limit and releases",
    aiThought:
      "Every check is clean and the value is small. The delegation table says the plant lead signs up to $5,000 — this is $888 for a stocked material at the price we hold. The rule releases it without asking anyone, and the order goes out to the supplier in their own language.",
    reasoning: [
      `Value $${TOTAL} against the plant lead's $5,000 limit`,
      "All prior checks clear — master data, stock, coverage, price",
      "Release rule satisfied — no signature required",
      `Purchase order ${PO} raised to ${VENDOR} · written in German`,
    ],
    /* The order goes to the supplier in German. The English
       beside it is what the buyer reads before it leaves. */
    email: {
      cta: "Review & send the order",
      to: `${VENDOR} · Ventas`,
      subject: `${PO} — pedido de ${QTY} membranas`,
      lines: [
        `Pedimos ${QTY} membranas a $${UNIT} la unidad, condiciones de pago Net 30.`,
        `Adjuntamos el pedido ${PO}. Confirmen la fecha de entrega, por favor.`,
      ],
      review: {
        subject: `${PO} — order for ${QTY} diaphragms`,
        body: [
          `We are ordering ${QTY} of diaphragm at $${UNIT} each, payment terms Net 30.`,
          `Purchase order ${PO} is attached. Please confirm the delivery date.`,
        ],
        sendingIn: "Deutsch",
      },
      attachment: bearingPoDoc,
      attachmentLabel: `${PO} · purchase order`,
      toastTitle: "Order sent",
      toastBody: `${PO} sent to ${VENDOR} in German · the invoice follows.`,
    },
    docLabel: `${PR} · release routing`,
    document: bearingApprovalRouting,
    sources: [
      { id: "bearing-doa", label: "DOA release routing", meta: "WF-48692-REL", kind: "policy", body: bearingApprovalRouting },
      { id: "bearing-po", label: PO, meta: "SAP ME23N", kind: "sap", body: bearingPoDoc },
    ],
    recommendation: `Released under the plant's own limit and ordered as ${PO}. This is the case nobody has to touch — and the reason the other requests get the attention instead.`,
    stages: [
      {
        sourceId: "bearing-doa",
        reasoning: "Applying the delegation of authority",
        title: "Release routing · WF-48692-REL",
        fields: [
          { label: "Value", value: `$${TOTAL}` },
          { label: "L1 · Plant Maintenance lead", value: "$5,000 limit — within" },
          { label: "Signature required", value: "None" },
          { label: "Outcome", value: "Released by rule" },
        ],
      },
      {
        sourceId: "bearing-po",
        reasoning: "Raising the order against the agreement",
        title: `Purchase order ${PO}`,
        fields: [
          { label: "Supplier", value: VENDOR },
          { label: "Quantity", value: `${QTY} EA` },
          { label: "Net value", value: `$${TOTAL}` },
          { label: "Delivery", value: "2026-07-08" },
        ],
      },
    ],
  },
  {
    id: "invoice",
    agentName: "Warranty & coverage desk",
    n: 6,
    title: "Invoice four-way match",
    sub: "Matches the invoice to the order, the receipt and the contract",
    aiThought:
      "Apex has invoiced for the diaphragms. Before a cent moves, let me put the invoice beside the purchase order, the goods receipt and the contract, and check they all say the same thing.",
    reasoning: [
      `Invoice ${INV} captured · $${TOTAL}`,
      `Reading purchase order ${PO}`,
      `Reading goods receipt ${GR} — ${QTY} EA received`,
      `Reading contract ${SA} — $${UNIT} / EA`,
      "Four-way match — every dimension agrees",
    ],
    docLabel: `${INV} · four-way match`,
    document: bearingMatchResultDoc,
    sources: [
      { id: "bearing-inv", label: INV, meta: "Apex invoice · captured", kind: "invoice", handoff: true, body: bearingInvoiceDoc },
      { id: "bearing-po-match", label: PO, meta: "SAP ME23N", kind: "sap", body: bearingPoDoc },
      { id: "bearing-gr-match", label: GR, meta: "SAP MB03 · plant-posted", kind: "sap", body: bearingGrDoc },
      { id: "bearing-contract-match", label: `ME33K · ${SA}`, meta: "outline agreement", kind: "contract", body: bearingOutlineAgreement },
    ],
    recommendation: `Contract, order, goods receipt and invoice agree to the cent. $${TOTAL} cleared for the payment run on Net 30 — no variance, no hold, nobody asked to approve it.`,
    stages: [
      {
        sourceId: "bearing-po-match",
        reasoning: "Putting the invoice beside the purchase order",
        title: "Four-way match — invoice vs PO",
        matchGrid: { columns: matchColumns, rows: matchRows, reveal: ["invoice", "po"] },
      },
      {
        sourceId: "bearing-gr-match",
        reasoning: "Adding what the plant actually received",
        title: "Four-way match — adding the goods receipt",
        matchGrid: { columns: matchColumns, rows: matchRows, reveal: ["invoice", "po", "gr"] },
      },
      {
        sourceId: "bearing-contract-match",
        reasoning: "Confirming the contract price and the verdict",
        title: "Four-way match — adding the contract · verdict",
        matchGrid: {
          columns: matchColumns,
          rows: matchRows,
          reveal: ["invoice", "po", "gr", "contract"],
          verdict: `All four agree — $${TOTAL} at $${UNIT} per unit for ${QTY} EA. Scheduled for payment on Net 30, nothing held back.`,
        },
      },
    ],
  },
];
