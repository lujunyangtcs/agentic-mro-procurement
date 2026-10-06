/**
 * MRO PR Intake & Validation flow — two worked examples.
 *
 * A plant engineer raises a messy free-text purchase requisition; the workforce
 * structures and codes it, then validates it across master data & duplicates,
 * warranty & coverage, vendor / contract / price, and approval & routing — the
 * checklist a buyer runs today by hand. Each example surfaces a different headline
 * exception:
 *   · Mechanical seal  → incomplete PR · spec ambiguity / wrong-part risk
 *   · Grinding media   → duplicate demand · stock at a sister plant · warranty cover
 *
 * Step actor names are overridden (agentName) to the procurement roles even though
 * the underlying agent ids are inherited from the base. Vendors are anonymised
 * (Apex Industrial Supply = preferred distributor; ZirCore = OEM).
 */

import type { ReactNode } from "react";
import type { RunStep, RiskSignal } from "@/mro/data/runSteps";
import { StructuredPrDoc, ValidationDoc } from "@/mro/components/docs/pr/PrDocs";
import {
  MaterialMasterDoc,
  StockOverviewDoc,
  WarrantyRecordDoc,
  OutlineAgreementDoc,
  VendorRecordDoc,
  ApprovalRoutingDoc,
  StockTransportOrderDoc,
  PurchaseOrderDoc,
  OpenPrListDoc,
  RecordDoc,
} from "@/mro/components/docs/pr/SapDocs";
import { EmailDoc } from "@/mro/components/docs/sources";
import { MultilingualEmailDoc } from "@/mro/components/docs/pr/MultilingualEmail";
import { LookupSheetDoc } from "@/mro/components/docs/pr/LookupSheet";
import { BudgetApprovalDoc, type BudgetApproval } from "@/mro/components/workspace/BudgetApprovalSignable";

const COST_CENTER = "10034 · Deburring & Finishing Maintenance";
const GL = "600450 · Repairs & Maintenance";
/** SAP payment-term codes — the editable dropdown options on the terms field. */
const PAYMENT_TERMS = ["NT30 · Net 30", "NT45 · Net 45", "NT60 · Net 60", "NT90 · Net 90"];

/* ── Master-data reference workbooks the intake agent codes against ──────────
 * The "Account assignment" extraction stage reads these Excel lookups (not the
 * free-text email) — the green row is the one the agent pulled each code from. */

const codingMaterialSheet = (matched: string) => ({
  file: "material-master.xlsx",
  tab: "Seals & packing",
  columns: ["Material", "Description", "Group", "UoM"],
  usedNote: `→ matched ${matched}`,
  rows: [
    { cells: ["MRO-SEAL-MECH-40MM-SIC", 'Mechanical seal 40 mm · SiC faces', "Seals & packing", "EA"], matched: matched === "MRO-SEAL-MECH-40MM-SIC" },
    { cells: ["MRO-SEAL-MECH-50MM-SIC", 'Mechanical seal 50 mm · SiC faces', "Seals & packing", "EA"], matched: matched === "MRO-SEAL-MECH-50MM-SIC" },
    { cells: ["MRO-SEAL-MECH-60MM-SIC", 'Mechanical seal 60 mm · SiC faces', "Seals & packing", "EA"], matched: matched === "MRO-SEAL-MECH-60MM-SIC" },
    { cells: ["MRO-MEDIA-ZRO2-1.2MM", "Grinding media · zirconia 1.2 mm · 25 kg bag", "Seals & packing", "BAG"], matched: matched === "MRO-MEDIA-ZRO2-1.2MM" },
    { cells: ["MRO-SEAL-GLAND-PACK", "Gland packing set · heavy duty", "Seals & packing", "SET"], matched: false },
  ],
});

const buildCodingRef = (material: string, line: string, confidence: string, openNote: ReactNode) => (
  <LookupSheetDoc
    sheets={[
      codingMaterialSheet(material),
      {
        file: "cost-centers.xlsx",
        tab: "Plant maintenance",
        columns: ["Cost center", "Description", "Plant"],
        usedNote: `→ ${line} rolls up to Amberg`,
        rows: [
          { cells: ["10031", "Drive Systems Maintenance", "Amberg"], matched: false },
          { cells: ["10034", "Deburring & Finishing Maintenance", "Amberg"], matched: true },
          { cells: ["10052", "Test & Pack Line Maintenance", "Riomar"], matched: false },
          { cells: ["10061", "Utilities Maintenance", "Amberg"], matched: false },
        ],
      },
      {
        file: "gl-accounts.xlsx",
        tab: "Opex · P&L",
        columns: ["G/L", "Description", "Type"],
        usedNote: "→ maintenance spare = Repairs & Maintenance",
        rows: [
          { cells: ["600420", "Spare parts consumed", "P&L"], matched: false },
          { cells: ["600450", "Repairs & Maintenance", "P&L"], matched: true },
          { cells: ["600470", "Outside services", "P&L"], matched: false },
          { cells: ["140010", "MRO inventory", "Balance"], matched: false },
        ],
      },
    ]}
    footer={
      <>
        Confidence {confidence} — material, cost center and G/L matched exactly against master data. {openNote}
      </>
    }
  />
);

const beltCodingRef = buildCodingRef(
  "MRO-SEAL-MECH-50MM-SIC",
  "Assembly Line 2",
  "86%",
  <>The request gave a shaft range (“45–50 mm”) and no part number; the agent read the installed gear reducer off the equipment record for Assembly Line 2 and resolved it to 50 mm.</>,
);

const rollerCodingRef = buildCodingRef(
  "MRO-MEDIA-ZRO2-1.2MM",
  "Deburring Line 3",
  "94%",
  <>The 1.2 mm zirconia grinding media maps cleanly to the standard SKU.</>,
);

/* Requisitioner & org directory — the header (PR type · requestor · purch org /
 * group) is set from the requester's plant-directory row, not the free text. */
const buildRequestorRef = (match: string) => (
  <LookupSheetDoc
    sheets={[
      {
        file: "requisitioners.xlsx",
        tab: "Plant directory",
        columns: ["Requestor", "Plant", "Purch org", "Purch grp", "PR type"],
        usedNote: `→ ${match}`,
        rows: [
          { cells: ["Plant engineer · Deburring Line 3", "Amberg · BM3", "1000", "200 · MRO", "NB"], matched: match === "BM3" },
          { cells: ["Plant engineer · Assembly Line 2", "Amberg · ML2", "1000", "200 · MRO", "NB"], matched: match === "ML2" },
          { cells: ["Reliability eng · Filling Plant", "Riomar · Test & Pack Line 2", "1000", "200 · MRO", "NB"], matched: match === "Pulping" },
          { cells: ["Reliability eng · Utilities line", "Utilities line", "1000", "200 · MRO", "NB"], matched: match === "Recovery" },
        ],
      },
    ]}
    footer={<>Purchasing org 1000 (Orvantec Procurement) and group 200 (MRO / Maintenance) are the plant defaults; PR type NB is the standard requisition.</>}
  />
);

const beltRequestorRef = buildRequestorRef("ML2");
const rollerRequestorRef = buildRequestorRef("BM3");

/* ════════════════════════════════════════════════════════════════════════
 * Example 1 — Mechanical seal · incomplete PR · spec ambiguity
 * ════════════════════════════════════════════════════════════════════════ */

export const beltStructuredDoc = (
  <StructuredPrDoc
    pr={{
      number: "PR-48630",
      status: "Structured · ready for the checks",
      createdBy: "PR Processing agent",
      createdOn: "2026-06-20 · 10:46",
      materialCode: "MRO-SEAL-MECH-50MM-SIC",
      description: "Mechanical Seal — 50 mm Shaft — Silicon Carbide — Cartridge",
      plant: "Deburring Plant · Assembly Line 2",
      costCenter: COST_CENTER,
      glAccount: GL,
      item: [
        { label: "Shaft diameter", value: "50 mm (from \"45–50 mm\")" },
        { label: "Material", value: "Silicon carbide faces · heavy duty" },
        { label: "Quantity", value: "1 EA" },
        { label: "UoM", value: "EA" },
        { label: "Delivery", value: "ASAP · production at risk" },
        { label: "Requisitioner", value: "Plant engineer · Assembly Line 2" },
      ],
      assignment: [
        { label: "Material group", value: "MRO · Seals & packing" },
        { label: "Suggested vendor", value: "Apex Industrial Supply (preferred)" },
      ],
      confidence: "97% · spec resolved",
      flags: [
        "Free text gave a shaft-diameter range (45–50 mm) and no part number — the equipment record for Assembly Line 2 has a 50 mm gear reducer shaft, so it is coded to 50 mm.",
        "Requester said \"previously Apex but not sure\" — the agreement confirms Apex is the supplier on record for this seal.",
      ],
      prType: "NB · Standard requisition",
      requestor: "Plant engineer · Assembly Line 2",
      purchOrg: "1000 · Orvantec Procurement",
      purchGroup: "200 · MRO / Maintenance",
      valuation: [
        { label: "Unit price", value: "$4,180.00 / EA" },
        { label: "Total value", value: "$4,180.00" },
        { label: "Currency", value: "USD" },
      ],
      sourceOfSupply: [
        { label: "Vendor", value: "Apex Industrial Supply" },
        { label: "Outline agreement", value: "SA-MRO-07 · item 40" },
        { label: "Info record", value: "5300004180" },
      ],
      deliveryTerms: [
        { label: "Incoterms", value: "FCA · Apex DC" },
        { label: "Payment terms", value: "Net 30" },
        { label: "Deliv. date", value: "ASAP · 2026-07-03" },
      ],
    }}
  />
);

/* Off-contract variant of the structured PR — used when the buyer chose to source
 * off-contract: vendor, price and source of supply are pending the competitive RFQ,
 * so those sections are hidden (the on-contract Apex figures don't apply yet). */
const beltStructuredDocOffContract = (
  <StructuredPrDoc
    pr={{
      number: "PR-48630",
      status: "Structured · sourcing off-contract",
      createdBy: "PR Processing agent",
      createdOn: "2026-06-20 · 10:46",
      materialCode: "MRO-SEAL-MECH-50MM-SIC",
      description: "Mechanical Seal — 50 mm Shaft — Silicon Carbide — Cartridge",
      plant: "Deburring Plant · Assembly Line 2",
      costCenter: COST_CENTER,
      glAccount: GL,
      item: [
        { label: "Shaft diameter", value: "50 mm (from \"45–50 mm\")" },
        { label: "Material", value: "Silicon carbide faces · heavy duty" },
        { label: "Quantity", value: "1 EA" },
        { label: "UoM", value: "EA" },
        { label: "Delivery", value: "ASAP · production at risk" },
        { label: "Requisitioner", value: "Plant engineer · Assembly Line 2" },
      ],
      assignment: [
        { label: "Material group", value: "MRO · Seals & packing" },
        { label: "Suggested vendor", value: "To be sourced · competitive RFQ" },
      ],
      confidence: "97% · spec resolved",
      flags: [
        "Free text gave a shaft-diameter range (45–50 mm) and no part number — the equipment record for Assembly Line 2 has a 50 mm gear reducer shaft, so it is coded to 50 mm.",
        "Sourcing off-contract — vendor, price and source of supply are pending the competitive RFQ in the sourcing step.",
      ],
      prType: "NB · Standard requisition",
      requestor: "Plant engineer · Assembly Line 2",
      purchOrg: "1000 · Orvantec Procurement",
      purchGroup: "200 · MRO / Maintenance",
      // valuation + sourceOfSupply intentionally omitted → those sections stay hidden.
      deliveryTerms: [
        { label: "Incoterms", value: "Per quote · TBD" },
        { label: "Payment terms", value: "Net 30" },
        { label: "Deliv. date", value: "ASAP · 2026-07-03" },
      ],
    }}
  />
);

/**
 * The request arrives in German, as it would from a German-speaking site. The
 * agent reads the original and produces the standard-procurement-language
 * version that every downstream document is built from.
 */
export const beltFreeText = (
  <MultilingualEmailDoc
    from="Plant engineer · Assembly Line 2"
    fromAddr="engineer@orvantec.com"
    to="Procurement intake"
    sent="2026-06-20 · 10:40"
    sourceLang="de"
    original={{
      subject: "Neue Gleitringdichtung — Montagelinie 2",
      lines: [
        "Wir benötigen eine neue Gleitringdichtung für Montagelinie 2. Die vorhandene Dichtung ist beschädigt und undicht.",
        "Angaben: Welle etwa 45–50 mm, Gleitflächen aus Siliziumkarbid, schwere Ausführung. Früher über Apex bezogen, die Teilenummer ist mir aber nicht bekannt.",
        "Wird dringend benötigt, sonst steht die Produktion.",
      ],
    }}
    translated={{
      subject: "New mechanical seal — Assembly Line 2",
      lines: [
        "Requesting a new mechanical seal for Assembly Line 2. The existing seal is damaged and leaking.",
        "Specification: around 45–50 mm shaft, silicon carbide faces, heavy duty. Previously sourced from Apex but the part number is not known.",
        "Needed urgently to avoid stopping production.",
      ],
    }}
  />
);

const beltMasterDataDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48630-MD",
      status: "Clean",
      docType: "Master data · duplicate · inventory",
      system: "Material master · inventory",
      createdBy: "Master Data agent",
      createdOn: "2026-06-20 · 10:48",
      sections: [
        {
          band: "Master data & duplicate",
          rows: [
            { label: "Material code", expected: "Mapped SKU", found: "MRO-SEAL-MECH-50MM-SIC", ok: true },
            { label: "Duplicate request", expected: "None open", found: "No open PR for this SKU", ok: true },
            { label: "Spec completeness", expected: "Single diameter + part no.", found: "50 mm · read off the equipment record", ok: true },
          ],
        },
        {
          band: "Inventory & interplant",
          rows: [
            { label: "On-hand stock", expected: "Check before buy", found: "0 EA · no stock", ok: true },
            { label: "Interplant availability", expected: "Check sister plants", found: "None · seal is line-specific", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Code is clean, no duplicate open, no stock to draw from, and the diameter resolved to 50 mm — the buy is justified." },
    }}
  />
);

const beltWarrantyDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48630-WTY",
      status: "Not covered",
      docType: "Warranty & coverage check",
      system: "Equipment register",
      createdBy: "Warranty & coverage desk",
      createdOn: "2026-06-20 · 10:50",
      sections: [
        {
          band: "Warranty & coverage",
          rows: [
            { label: "Equipment in OEM warranty", expected: "Within 12 mo parts", found: "No · seal is a wear part", ok: true },
            { label: "Failure type", expected: "Defect vs wear", found: "Wear & tear · leaking from damage", ok: true },
            { label: "Coverage", expected: "Parts / labor / full", found: "Buy new · parts only", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Wear-and-tear failure, not a covered defect — proceed with a new-buy on parts." },
    }}
  />
);

const beltVendorDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48630-VEN",
      status: "On-contract",
      docType: "Vendor · contract · price",
      system: "Vendor master · sourcing agreement",
      createdBy: "Sourcing & contract agent",
      createdOn: "2026-06-20 · 10:52",
      sections: [
        {
          band: "Vendor & contract",
          rows: [
            { label: "Vendor approved", expected: "Approved & preferred", found: "Apex Industrial Supply · preferred", ok: true },
            { label: "OEM vs distributor", expected: "Lower-cost compliant", found: "Distributor · −19% vs OEM", ok: true },
            { label: "Sourcing agreement", expected: "Price + vendor match", found: "On agreement SA-MRO-07", ok: true },
            { label: "HSE / insurance", expected: "Parts only · n/a", found: "No on-site work · n/a", ok: true },
          ],
        },
        {
          band: "Price & terms",
          rows: [
            { label: "Price vs contract", expected: "Match contract", found: "$4,180 · matches SA-MRO-07", ok: true },
            { label: "Payment terms", expected: "Net 30 / 60", found: "Net 30 · compliant", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Vendor approved, on-contract and price-matched — no leakage." },
    }}
  />
);

const beltApprovalDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48630-APR",
      status: "Ready · clean",
      docType: "Approval & routing (DOA)",
      system: "Cost center · DOA",
      createdBy: "Approval & routing",
      createdOn: "2026-06-20 · 10:54",
      sections: [
        {
          band: "Cost center & approval",
          rows: [
            { label: "Cost center / GL", expected: "Correct plant / class", found: "10034 / 600450 · correct", ok: true },
            { label: "Competitive bidding", expected: "3 quotes if > threshold", found: "On-contract · not required", ok: true },
            { label: "DOA approval", expected: "Plant-level", found: "Plant maintenance · in limit", ok: true },
            { label: "Spec sign-off", expected: "Diameter resolved", found: "50 mm · Assembly Line 2 gear reducer", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Every control clears — cost centre, bidding policy, approval limit and the spec. The request is ready to release." },
    }}
  />
);

const beltApprovalDocResolved = (
  <ValidationDoc
    report={{
      number: "VAL-48630-APR",
      status: "Released",
      docType: "Approval & routing (DOA)",
      system: "Cost center · DOA",
      createdBy: "Approval & routing",
      createdOn: "2026-06-20 · 11:03",
      sections: [
        {
          band: "Cost center & approval",
          rows: [
            { label: "Cost center / GL", expected: "Correct plant / class", found: "10034 / 600450 · correct", ok: true },
            { label: "Competitive bidding", expected: "3 quotes if > threshold", found: "On-contract · not required", ok: true },
            { label: "DOA approval", expected: "Plant-level", found: "Plant maintenance · in limit", ok: true },
            { label: "Spec sign-off", expected: "Engineer confirms diameter", found: "Confirmed · 50 mm", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Diameter confirmed by the engineer — all controls clear. PR-48630 released to Apex on-contract at $4,180." },
    }}
  />
);

/* Real SAP source files the seal-flow agents read (clickable evidence). */

export const beltMaterialMaster = (
  <MaterialMasterDoc
    m={{
      number: "MRO-SEAL-MECH-50MM-SIC",
      description: "Mechanical Seal — 50 mm Shaft — Silicon Carbide — Cartridge",
      status: "Active",
      createdOn: "2024-03-11 · 09:20",
      createdBy: "Master data steward",
      basic: [
        { label: "Material type", value: "ERSA · Spare part" },
        { label: "Industry sector", value: "Electronics & industrial automation" },
        { label: "Material group", value: "MRO · Seals & packing" },
        { label: "Base UoM", value: "EA" },
        { label: "Gross weight", value: "6 kg" },
        { label: "Old material no.", value: "MS-50SIC-APX" },
      ],
      purchasing: [
        { label: "Order unit", value: "EA" },
        { label: "Purchasing group", value: "200 · MRO" },
        { label: "Planned deliv. time", value: "7 days" },
        { label: "Info record", value: "5300004180 · exists" },
        { label: "Source list", value: "Apex · SA-MRO-07" },
        { label: "Std PO text", value: "50 mm shaft · SiC faces" },
      ],
      accounting: [
        { label: "Valuation class", value: "3040 · MRO spares" },
        { label: "Price control", value: "V · moving average" },
        { label: "Moving avg price", value: "$4,180.00 / EA" },
        { label: "Currency", value: "USD" },
      ],
    }}
  />
);

const beltStockOverview = (
  <StockOverviewDoc
    s={{
      number: "MRO-SEAL-MECH-50MM-SIC",
      description: "Mechanical Seal — 50 mm Shaft — Silicon Carbide",
      createdOn: "2026-06-20 · 10:48",
      createdBy: "Master Data agent",
      rows: [
        { plant: "Amberg · Electronics", storageLoc: "MRO-01", onHand: "0", safety: "0", uom: "EA", tone: "short" },
        { plant: "Clairmont plant", storageLoc: "MRO-01", onHand: "0", safety: "0", uom: "EA" },
        { plant: "Riomar", storageLoc: "MRO-01", onHand: "0", safety: "0", uom: "EA" },
      ],
      note: "Seal is line-specific (50 mm shaft diameter) — no on-hand and no interplant stock to transfer; a new buy is justified.",
    }}
  />
);

/* The stock-on-hand workbook the PR-intake agent reads — an Excel view of current
 * stock + safety stock across plants, with the agent's safety-stock recommendation. */
const beltStockSheet = (
  <LookupSheetDoc
    sheets={[
      {
        file: "stock-on-hand.xlsx",
        tab: "MRO inventory · seals",
        columns: ["Plant", "Material", "On-hand", "Safety stock", "UoM"],
        usedNote: "→ 0 on-hand · 0 safety · no interplant cover",
        rows: [
          { cells: ["Amberg · Assembly Line 2", "MRO-SEAL-MECH-50MM-SIC", "0", "0", "EA"], matched: true },
          { cells: ["Clairmont plant", "MRO-SEAL-MECH-50MM-SIC", "0", "0", "EA"], matched: false },
          { cells: ["Riomar", "MRO-SEAL-MECH-50MM-SIC", "0", "0", "EA"], matched: false },
        ],
      },
    ]}
    footer={
      <>
        No on-hand and no interplant stock — a new buy is justified. Safety stock is currently 0 for this
        line-specific seal; the agent recommends setting a safety stock of <strong>1 EA</strong> so the next
        failure doesn&apos;t stop Assembly Line 2.
      </>
    }
  />
);

const beltOpenPrList = (
  <OpenPrListDoc
    l={{
      createdOn: "2026-06-20 · 10:46",
      createdBy: "Master Data agent",
      scope: "Open PRs · plant 1000 · material group MRO · not yet released",
      rows: [
        { pr: "PR-48628", item: "10", material: "MRO-SEAL-GLAND-PACK", qty: "4 SET", plant: "Amberg · ML2", created: "2026-06-19" },
        { pr: "PR-48631", item: "10", material: "MRO-PUMP-SEAL-STD", qty: "2 EA", plant: "Utilities", created: "2026-06-20" },
        { pr: "PR-48633", item: "10", material: "MRO-MEDIA-ZRO2-1.2MM", qty: "4 BAG", plant: "Amberg · BM3", created: "2026-06-20" },
        { pr: "PR-48641", item: "10", material: "MRO-MEDIA-ZRO2-1.2MM", qty: "6 BAG", plant: "Amberg · BM3", created: "2026-06-18" },
      ],
      note: "No open PR carries MRO-SEAL-MECH-50MM-SIC — no duplicate for the mechanical seal. PR-48630 is the only demand for this material.",
    }}
  />
);

const beltWarrantyRecord = (
  <WarrantyRecordDoc
    w={{
      number: "WTY-CHK-48630",
      status: "Not covered",
      createdOn: "2026-06-20 · 10:50",
      createdBy: "Warranty & coverage desk",
      object: [
        { label: "Equipment", value: "Assembly Line 2 gear reducer" },
        { label: "Functional loc.", value: "NGT-DSP-ML2" },
        { label: "Component", value: "gear reducer seal (wear part)" },
        { label: "Commissioned", value: "2021-08-04" },
      ],
      coverage: [
        { label: "OEM warranty", value: "Expired · > 12 mo" },
        { label: "Service contract", value: "None on the seal" },
        { label: "Coverage scope", value: "Parts only · n/a" },
      ],
      failure: [
        { label: "Failure type", value: "Wear & tear · leaking" },
        { label: "Covered defect", value: "No" },
        { label: "Claimable", value: "No · consumable" },
      ],
      determination: { ok: true, text: "Seal is a consumable wear part — failure is wear & tear, not a covered defect. Proceed as a new buy." },
    }}
  />
);

export const beltOutlineAgreement = (
  <OutlineAgreementDoc
    a={{
      number: "SA-MRO-07",
      status: "Active",
      createdOn: "2026-01-02 · valid to 2026-12-31",
      createdBy: "Category buyer",
      header: [
        { label: "Vendor", value: "Apex Industrial Supply" },
        { label: "Vendor code", value: "0001000207" },
        { label: "Purch. org", value: "1000 · Orvantec Procurement" },
        { label: "Valid from", value: "2026-01-01" },
        { label: "Valid to", value: "2026-12-31" },
        { label: "Target value", value: "$420,000" },
      ],
      items: [
        { item: "40", material: "MRO-SEAL-MECH-50MM-SIC", description: "Mechanical seal 50 mm · SiC faces", targetQty: "20 EA / yr", netPrice: "$4,180.00", per: "1 EA" },
      ],
      conditions: [
        { label: "Payment terms", value: "Net 30" },
        { label: "Incoterms", value: "FCA · Apex DC" },
        { label: "Price basis", value: "Distributor · −19% vs OEM" },
      ],
    }}
  />
);

const beltVendorRecord = (
  <VendorRecordDoc
    v={{
      number: "0001000207",
      name: "Apex Industrial Supply",
      status: "Approved",
      createdOn: "2022-05-18 · last review 2026-02",
      createdBy: "Supplier management",
      general: [
        { label: "BP role", value: "Vendor · distributor" },
        { label: "Country", value: "US" },
        { label: "Tax / reg.", value: "Compliant · on file" },
      ],
      purchasing: [
        { label: "Purch. org", value: "1000 · Orvantec Procurement" },
        { label: "Order currency", value: "USD" },
        { label: "Payment terms", value: "Net 30" },
        { label: "Preferred", value: "Yes · MRO seals" },
      ],
      approval: { ok: true, text: "Approved & preferred distributor for MRO seals & packing — on sourcing agreement SA-MRO-07." },
    }}
  />
);

export const beltApprovalRouting = (
  <ApprovalRoutingDoc
    r={{
      number: "WF-48630-REL",
      status: "Awaiting release",
      createdOn: "2026-06-20 · 10:54",
      createdBy: "Approval & routing",
      summary: [
        { label: "Document", value: "PR-48630 · mechanical seal" },
        { label: "Requestor", value: "Plant engineer · ML2" },
        { label: "Category", value: "MRO · on-contract" },
        { label: "Amount", value: "$4,180.00" },
        { label: "Cost center / GL", value: "10034 / 600450" },
        { label: "Vendor", value: "Apex · SA-MRO-07" },
      ],
      chain: [
        { level: "L1", approver: "Plant Maintenance Lead", role: "Maintenance", limit: "$10,000", status: "approved", when: "auto · on-contract, in limit" },
        { level: "L2", approver: "—", role: "Procurement Manager", limit: "$50,000", status: "not-reached", when: "" },
      ],
      validation: { ok: true, text: "$4,180 within the plant-maintenance DOA limit ($10,000); on-contract — competitive bidding not required." },
      action: "Nothing open — releasing PR-48630 to Apex on agreement SA-MRO-07 at $4,180.",
    }}
  />
);

/* ════════════════════════════════════════════════════════════════════════
 * Example 2 — Grinding media · duplicate demand · stock · warranty cover
 * ════════════════════════════════════════════════════════════════════════ */

const rollerStructuredDoc = (
  <StructuredPrDoc
    pr={{
      number: "PR-48655",
      status: "Structured · cheaper alternative found",
      createdBy: "PR Processing agent",
      createdOn: "2026-06-20 · 11:10",
      materialCode: "MRO-MEDIA-ZRO2-1.2MM",
      description: "Grinding Media — Zirconia — 1.2 mm — 25 kg Bag",
      plant: "Deburring Plant · Deburring Line 3",
      costCenter: COST_CENTER,
      glAccount: GL,
      item: [
        { label: "Size", value: "1.2 mm · zirconia · 25 kg bag" },
        { label: "Quantity", value: "8 BAG (from \"6–8\")" },
        { label: "UoM", value: "BAG" },
        { label: "Same as", value: "Deburring Line 3 charge" },
        { label: "Delivery", value: "Urgent · grind fineness dropping" },
        { label: "Requisitioner", value: "Plant engineer · Deburring Line 3" },
      ],
      assignment: [
        { label: "Material group", value: "MRO · Milling & media" },
        { label: "Suggested vendor", value: "Apex Industrial Supply (preferred)" },
      ],
      confidence: "94%",
      flags: [
        "Requested 8 BAG, but inventory and warranty checks below change the recommended buy quantity — see the validation report.",
      ],
      prType: "NB · Standard requisition",
      requestor: "Plant engineer · Deburring Line 3",
      purchOrg: "1000 · Orvantec Procurement",
      purchGroup: "200 · MRO / Maintenance",
      valuation: [
        { label: "Unit price", value: "$118.00 / BAG" },
        { label: "Total value", value: "$944.00 (8 BAG)" },
        { label: "Currency", value: "USD" },
      ],
      sourceOfSupply: [
        { label: "Vendor", value: "Apex Industrial Supply" },
        { label: "Outline agreement", value: "SA-MRO-07 · item 50" },
        { label: "Info record", value: "5300004118" },
      ],
      deliveryTerms: [
        { label: "Incoterms", value: "FCA · Apex DC" },
        { label: "Payment terms", value: "Net 30" },
        { label: "Deliv. date", value: "Urgent · 2026-06-22" },
      ],
    }}
  />
);

const rollerFreeText = (
  <MultilingualEmailDoc
    from="车间工程师 · 三号球磨机"
    fromAddr="engineer@orvantec.com"
    to="Procurement intake"
    sent="2026-06-20 · 11:04"
    sourceLang="zh"
    original={{
      subject: "三号球磨机 — 研磨介质更换申请",
      lines: [
        "三号球磨机需要更换研磨介质。目前这批磨损太快，研磨细度已经明显下降。",
        "大约需要 6 至 8 袋，与三号球磨机现用的规格相同。",
        "情况比较紧急，希望尽快处理，避免进一步停机。",
      ],
    }}
    translated={{
      subject: "Replacement grinding media — Deburring Line 3",
      lines: [
        "Need replacement grinding media for Deburring Line 3. Media wearing out far too fast and dropping the grind fineness.",
        "Approx 6–8 bags required. Same as currently installed in Deburring Line 3.",
        "Urgent to avoid further breakdown.",
      ],
    }}
  />
);

const rollerMasterDataDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48655-MD",
      status: "2 flags",
      docType: "Master data · duplicate · inventory",
      system: "Material master · inventory",
      createdBy: "Master Data agent",
      createdOn: "2026-06-20 · 11:12",
      sections: [
        {
          band: "Master data & duplicate",
          rows: [
            { label: "Material code", expected: "Mapped SKU", found: "MRO-MEDIA-ZRO2-1.2MM", ok: true },
            { label: "Duplicate request", expected: "None open", found: "PR-48641 · same SKU · 4 days ago", ok: false },
          ],
        },
        {
          band: "Inventory & interplant",
          rows: [
            { label: "On-hand stock", expected: "Check before buy", found: "0 BAG at this plant", ok: true },
            { label: "Interplant availability", expected: "Check sister plants", found: "6 BAG at Clairmont plant store", ok: false },
          ],
        },
      ],
      verdict: { ok: false, text: "Duplicate open PR and 6 BAG available at a sister plant — transfer before buying, and cancel PR-48641." },
    }}
  />
);

const rollerWarrantyDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48655-WTY",
      status: "Partly covered",
      docType: "Warranty & coverage check",
      system: "Equipment register",
      createdBy: "Warranty & coverage desk",
      createdOn: "2026-06-20 · 11:14",
      sections: [
        {
          band: "Warranty & coverage",
          rows: [
            { label: "Equipment in OEM warranty", expected: "Within 12 mo parts", found: "Yes · commissioned 2026-01-15", ok: false },
            { label: "Failure type", expected: "Defect vs wear", found: "Premature attrition · possible defect", ok: false },
            { label: "Coverage", expected: "Parts / labor / full", found: "12 mo parts · ZirCore OEM", ok: true },
          ],
        },
      ],
      verdict: { ok: false, text: "Deburring Line 3 is inside its 12-month parts warranty — raise a claim on the early-worn media rather than buying it." },
    }}
  />
);

const rollerVendorDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48655-VEN",
      status: "On-contract",
      docType: "Vendor · contract · price",
      system: "Vendor master · sourcing agreement",
      createdBy: "Sourcing & contract agent",
      createdOn: "2026-06-20 · 11:16",
      sections: [
        {
          band: "Vendor & contract",
          rows: [
            { label: "Vendor approved", expected: "Approved & preferred", found: "Apex Industrial Supply · preferred", ok: true },
            { label: "OEM vs distributor", expected: "Lower-cost compliant", found: "Distributor · −22% vs OEM", ok: true },
            { label: "Sourcing agreement", expected: "Price + vendor match", found: "On agreement SA-MRO-07", ok: true },
          ],
        },
        {
          band: "Price & terms",
          rows: [
            { label: "Price vs contract", expected: "Match contract", found: "$118 / BAG · matches SA-MRO-07", ok: true },
            { label: "Payment terms", expected: "Net 30 / 60", found: "Net 30 · compliant", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "If any units are bought, Apex is approved and on-contract — but most of this demand should not be bought at all." },
    }}
  />
);

const rollerApprovalDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48655-APR",
      status: "Re-scoped buy",
      docType: "Approval & routing (DOA)",
      system: "Cost center · DOA",
      createdBy: "Approval & routing",
      createdOn: "2026-06-20 · 11:18",
      sections: [
        {
          band: "Recommended action",
          rows: [
            { label: "Interplant transfer", expected: "Use available stock", found: "6 BAG from Clairmont plant", ok: true },
            { label: "Warranty claim", expected: "Claim covered defects", found: "Early-worn media · ZirCore", ok: true },
            { label: "Residual buy", expected: "Only the shortfall", found: "2 BAG · Apex · $236", ok: true },
            { label: "Cancel duplicate", expected: "Close PR-48641", found: "Cancellation drafted", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Re-scoped from an 8-unit buy to a 6-unit transfer + warranty claim + 2-unit buy — duplicate PR cancelled." },
    }}
  />
);

const rollerApprovalDocResolved = (
  <ValidationDoc
    report={{
      number: "VAL-48655-APR",
      status: "Routed",
      docType: "Approval & routing (DOA)",
      system: "Cost center · DOA",
      createdBy: "Approval & routing",
      createdOn: "2026-06-20 · 11:33",
      sections: [
        {
          band: "Recommended action",
          rows: [
            { label: "Interplant transfer", expected: "Use available stock", found: "Routed · 6 BAG from Clairmont", ok: true },
            { label: "Warranty claim", expected: "Claim covered defects", found: "Raised · ZirCore", ok: true },
            { label: "Residual buy", expected: "Only the shortfall", found: "Released · 2 BAG · $236", ok: true },
            { label: "Cancel duplicate", expected: "Close PR-48641", found: "Cancelled", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Engineer approved — routed the 6-BAG transfer (STO-48655), raised the ZirCore warranty claim, and released the 2-BAG buy ($236). Duplicate PR-48641 cancelled." },
    }}
  />
);

/* Real SAP source files the grinding-media (inter-plant) flow agents read. */

const rollerMaterialMaster = (
  <MaterialMasterDoc
    m={{
      number: "MRO-MEDIA-ZRO2-1.2MM",
      description: "Grinding Media — Zirconia — 1.2 mm — 25 kg Bag",
      status: "Active",
      createdOn: "2025-09-02 · 14:10",
      createdBy: "Master data steward",
      basic: [
        { label: "Material type", value: "ERSA · Spare part" },
        { label: "Industry sector", value: "Electronics & industrial automation" },
        { label: "Material group", value: "MRO · Milling & media" },
        { label: "Base UoM", value: "BAG" },
        { label: "Gross weight", value: "11 kg" },
        { label: "Old material no.", value: "ZR-12-STD" },
      ],
      purchasing: [
        { label: "Order unit", value: "BAG" },
        { label: "Purchasing group", value: "200 · MRO" },
        { label: "Planned deliv. time", value: "5 days" },
        { label: "Info record", value: "5300004118 · exists" },
        { label: "Source list", value: "Apex · SA-MRO-07" },
        { label: "Std PO text", value: "1.2 mm zirconia media" },
      ],
      accounting: [
        { label: "Valuation class", value: "3040 · MRO spares" },
        { label: "Price control", value: "V · moving average" },
        { label: "Moving avg price", value: "$118.00 / BAG" },
        { label: "Currency", value: "USD" },
      ],
    }}
  />
);

/* Cross-plant inventory the Master Data agent reads — an Excel view of enterprise
 * stock, with the Clairmont surplus row highlighted + the agent's transfer recommendation. */
export const rollerInventorySheet = (
  <LookupSheetDoc
    sheets={[
      {
        file: "stock-on-hand.xlsx",
        tab: "MRO inventory · media",
        columns: ["Plant", "Material", "On-hand", "Safety", "UoM"],
        usedNote: "→ 6 BAG surplus at Clairmont · transfer before buying",
        rows: [
          { cells: ["Amberg · Deburring Line 3", "MRO-MEDIA-ZRO2-1.2MM", "0", "2", "BAG"], matched: false },
          { cells: ["Clairmont plant", "MRO-MEDIA-ZRO2-1.2MM", "6", "2", "BAG"], matched: true },
          { cells: ["Riomar", "MRO-MEDIA-ZRO2-1.2MM", "0", "0", "BAG"], matched: false },
        ],
      },
    ]}
    footer={
      <>
        The network already holds what Deburring Line 3 needs — <strong>6 BAG surplus at the Clairmont plant</strong>.
        Transfer those 6 by interplant movement and buy only the 2-unit shortfall on-contract ($236), versus
        $944 to buy all 8 new — avoiding $708 of duplicate spend.
      </>
    }
  />
);

const rollerStockTransfer = (
  <StockTransportOrderDoc
    o={{
      number: "STO-48655",
      status: "Drafted · needs you",
      createdOn: "2026-06-20 · 11:18",
      createdBy: "Approval & routing",
      header: [
        { label: "Supplying plant", value: "Clairmont plant · MRO-01" },
        { label: "Receiving plant", value: "Amberg · Deburring Line 3" },
        { label: "Movement type", value: "351 · interplant transfer" },
        { label: "Doc type", value: "UB · stock transport order" },
        { label: "Value redirected", value: "$708 (6 BAG)" },
        { label: "Lead time", value: "In-network · this week" },
      ],
      items: [
        { item: "10", material: "MRO-MEDIA-ZRO2-1.2MM", description: "Grinding media · zirconia 1.2 mm · 25 kg bag", qty: "6 BAG", from: "Clairmont", to: "Amberg" },
      ],
      note: "Transfers the 6 BAG surplus from Clairmont instead of a fresh buy — avoids $708 of duplicate spend. On posting, Clairmont stock draws down and a goods receipt is scheduled at Deburring Line 3, so inventory and logistics records update across both plants.",
    }}
  />
);

const rollerPoDoc = (
  <PurchaseOrderDoc
    p={{
      number: "PO-77311",
      status: "Released · awaiting delivery",
      createdOn: "2026-06-20 · 11:33",
      createdBy: "Approval & routing",
      header: [
        { label: "Vendor", value: "Apex Industrial Supply" },
        { label: "Material", value: "MRO-MEDIA-ZRO2-1.2MM" },
        { label: "Payment terms", value: "Net 30" },
        { label: "Incoterms", value: "FCA · Apex DC" },
        { label: "Currency", value: "USD" },
      ],
      items: [
        { item: "10", material: "MRO-MEDIA-ZRO2-1.2MM", description: "Grinding media · zirconia 1.2 mm · 25 kg bag", qty: "2 BAG", netPrice: "118.00", value: "236.00", delivDate: "2026-06-22" },
      ],
      conditions: [
        { label: "Net value", value: "$236.00" },
        { label: "Tax (U1)", value: "$0.00 · reverse charge" },
        { label: "Total", value: "$236.00" },
      ],
      release: [
        { label: "L1 · Plant Maintenance", value: "Approved · within DOA" },
      ],
    }}
  />
);

export const rollerOpenPrList = (
  <OpenPrListDoc
    l={{
      createdOn: "2026-06-20 · 11:08",
      createdBy: "Master Data agent",
      scope: "Open PRs · plant 1000 · material group MRO · not yet released",
      rows: [
        { pr: "PR-48628", item: "10", material: "MRO-SEAL-GLAND-PACK", qty: "4 SET", plant: "Amberg · ML2", created: "2026-06-19" },
        { pr: "PR-48641", item: "10", material: "MRO-MEDIA-ZRO2-1.2MM", qty: "6 BAG", plant: "Amberg · BM3", created: "2026-06-18", tone: "dup" },
        { pr: "PR-48650", item: "10", material: "MRO-DIAPH-PTFE-15IN", qty: "10 EA", plant: "Test & Pack Line", created: "2026-06-19" },
      ],
      note: "PR-48641 already requests 6 BAG of MRO-MEDIA-ZRO2-1.2MM for the same line — a duplicate of this requisition. Consolidate and cancel it.",
    }}
  />
);

export const rollerWarrantyRecord = (
  <WarrantyRecordDoc
    w={{
      number: "WTY-CHK-48655",
      status: "Inside warranty",
      createdOn: "2026-06-20 · 11:14",
      createdBy: "Warranty & coverage desk",
      object: [
        { label: "Equipment", value: "Deburring Line 3" },
        { label: "Functional loc.", value: "NGT-DSP-BM3" },
        { label: "Component", value: "Grinding media charge" },
        { label: "Commissioned", value: "2026-01-15" },
      ],
      coverage: [
        { label: "OEM warranty", value: "Yes · 12-mo parts" },
        { label: "OEM", value: "ZirCore" },
        { label: "Coverage scope", value: "Parts · claimable" },
      ],
      failure: [
        { label: "Failure type", value: "Premature attrition" },
        { label: "Covered defect", value: "Likely · within 12 mo" },
        { label: "Claimable", value: "Yes · raise a claim" },
      ],
      determination: { ok: false, text: "Inside the 12-month parts warranty — raise a claim on the early-worn media with ZirCore rather than buying it." },
    }}
  />
);

export const rollerOutlineAgreement = (
  <OutlineAgreementDoc
    a={{
      number: "SA-MRO-07",
      status: "Active",
      createdOn: "2026-01-02 · valid to 2026-12-31",
      createdBy: "Category buyer",
      header: [
        { label: "Vendor", value: "Apex Industrial Supply" },
        { label: "Vendor code", value: "0001000207" },
        { label: "Purch. org", value: "1000 · Orvantec Procurement" },
        { label: "Valid from", value: "2026-01-01" },
        { label: "Valid to", value: "2026-12-31" },
        { label: "Target value", value: "$420,000" },
      ],
      items: [
        { item: "50", material: "MRO-MEDIA-ZRO2-1.2MM", description: "Grinding media · zirconia 1.2 mm · 25 kg bag", targetQty: "60 BAG / yr", netPrice: "$118.00", per: "1 BAG" },
      ],
      conditions: [
        { label: "Payment terms", value: "Net 30" },
        { label: "Incoterms", value: "FCA · Apex DC" },
        { label: "Price basis", value: "Distributor · −22% vs OEM" },
      ],
    }}
  />
);

const rollerVendorRecord = (
  <VendorRecordDoc
    v={{
      number: "0001000207",
      name: "Apex Industrial Supply",
      status: "Approved",
      createdOn: "2022-05-18 · last review 2026-02",
      createdBy: "Supplier management",
      general: [
        { label: "BP role", value: "Vendor · distributor" },
        { label: "Country", value: "US" },
        { label: "Tax / reg.", value: "Compliant · on file" },
      ],
      purchasing: [
        { label: "Purch. org", value: "1000 · Orvantec Procurement" },
        { label: "Order currency", value: "USD" },
        { label: "Payment terms", value: "Net 30" },
        { label: "Preferred", value: "Yes · MRO grinding media" },
      ],
      approval: { ok: true, text: "Approved & preferred distributor — but transfer + warranty cover most of this demand, so price only the 2 BAG residual." },
    }}
  />
);

const rollerApprovalRouting = (
  <ApprovalRoutingDoc
    r={{
      number: "WF-48655-REL",
      status: "Re-scoped · needs you",
      createdOn: "2026-06-20 · 11:18",
      createdBy: "Approval & routing",
      summary: [
        { label: "Document", value: "PR-48655 · grinding media" },
        { label: "Requestor", value: "Plant engineer · BM3" },
        { label: "Original", value: "8 BAG · $944" },
        { label: "Re-scoped", value: "2 BAG buy · $236" },
        { label: "Cost center / GL", value: "10034 / 600450" },
        { label: "Vendor", value: "Apex · SA-MRO-07" },
      ],
      chain: [
        { level: "L1", approver: "Plant Maintenance Lead", role: "Maintenance", limit: "$10,000", status: "approved", when: "auto · residual in limit" },
        { level: "L2", approver: "—", role: "Procurement Manager", limit: "$50,000", status: "not-reached", when: "" },
      ],
      validation: { ok: true, text: "Re-scoped to a 6-BAG interplant transfer + a warranty claim + a 2-BAG on-contract buy ($236); duplicate PR-48641 cancelled." },
      action: "Approve the re-scoped plan — route the transfer (STO-48655), raise the ZirCore warranty claim, and release the 2-BAG buy.",
    }}
  />
);

/* ── Step builder ─────────────────────────────────────────────────────────── */

type StepSpec = {
  id: RunStep["id"];
  agentName: string;
  n: number;
  title: string;
  sub: string;
  aiThought?: string;
  reasoning: string[];
  docLabel: string;
  document: React.ReactNode;
  altDocument?: RunStep["altDocument"];
  sources: RunStep["sources"];
  recommendation: string;
  stages?: RunStep["stages"];
  email?: RunStep["email"];
  flagged?: boolean;
  hasExceptions?: boolean;
  inbound?: RunStep["inbound"];
  inboundEmail?: RunStep["inboundEmail"];
  rfq?: RunStep["rfq"];
  signals?: RunStep["signals"];
};

const step = (s: StepSpec): RunStep => s;

/* ── Seal invoice four-way match (step 6) — settlement docs + cumulative grid ──
 * The captured Apex invoice BPI-5567 is matched against PO-77310, goods receipt
 * GR-77310 and the SA-MRO-07 contract. The grid fills column by column as the
 * agent reads each file; "—" marks a dimension the document doesn't carry. */
const beltMatchColumns = [
  { key: "invoice", label: "Invoice" },
  { key: "po", label: "PO" },
  { key: "gr", label: "GR" },
  { key: "contract", label: "Contract" },
];
const beltMatchRows = [
  { dimension: "Unit price (USD)", cells: { invoice: { value: "4,180.00", ok: true }, po: { value: "4,180.00", ok: true }, gr: { value: "—", ok: false }, contract: { value: "4,180.00", ok: true } } },
  { dimension: "Quantity (EA)", cells: { invoice: { value: "1", ok: true }, po: { value: "1", ok: true }, gr: { value: "1", ok: true }, contract: { value: "1", ok: true } } },
  { dimension: "Net value (USD)", cells: { invoice: { value: "4,180.00", ok: true }, po: { value: "4,180.00", ok: true }, gr: { value: "4,180.00", ok: true }, contract: { value: "4,180.00", ok: true } } },
  { dimension: "Tax code", cells: { invoice: { value: "U1", ok: true }, po: { value: "U1", ok: true }, gr: { value: "—", ok: false }, contract: { value: "U1", ok: true } } },
  { dimension: "Payment terms", cells: { invoice: { value: "Net 30", ok: true }, po: { value: "Net 30", ok: true }, gr: { value: "—", ok: false }, contract: { value: "Net 30", ok: true } } },
];

const beltInvoiceDoc = (
  <RecordDoc
    d={{
      tcode: "MIR4",
      tname: "Display Invoice Document",
      number: "BPI-5567",
      status: "Parked · awaiting match",
      docType: "Vendor invoice · Apex Industrial Supply",
      system: "Invoice verification · LIV",
      createdOn: "2026-06-24 · 06:40",
      createdBy: "AP capture",
      sections: [
        {
          band: "Invoice header",
          rows: [
            { label: "Vendor", value: "Apex Industrial Supply" },
            { label: "Invoice no.", value: "BPI-5567" },
            { label: "PO reference", value: "PO-77310" },
            { label: "Payment terms", value: "Net 30" },
            { label: "Currency", value: "USD" },
          ],
        },
        {
          band: "Amounts",
          rows: [
            { label: "Unit price", value: "$4,180.00 / EA" },
            { label: "Quantity", value: "1 EA" },
            { label: "Net value", value: "$4,180.00" },
            { label: "Tax code", value: "U1 · reverse charge" },
            { label: "Gross", value: "$4,180.00" },
          ],
        },
      ],
    }}
  />
);

const beltPoDoc = (
  <PurchaseOrderDoc
    p={{
      number: "PO-77310",
      status: "Released · goods received",
      createdOn: "2026-06-20 · 11:30",
      createdBy: "Approval & routing",
      header: [
        { label: "Vendor", value: "Apex Industrial Supply" },
        { label: "Material", value: "MRO-SEAL-MECH-50MM-SIC" },
        { label: "Payment terms", value: "Net 30" },
        { label: "Incoterms", value: "FCA · Apex DC" },
        { label: "Currency", value: "USD" },
      ],
      items: [
        { item: "10", material: "MRO-SEAL-MECH-50MM-SIC", description: 'Mechanical seal 50 mm · SiC faces', qty: "1 EA", netPrice: "4,180.00", value: "4,180.00", delivDate: "2026-07-03" },
      ],
      conditions: [
        { label: "Net value", value: "$4,180.00" },
        { label: "Tax (U1)", value: "$0.00 · reverse charge" },
        { label: "Total", value: "$4,180.00" },
      ],
      release: [
        { label: "L1 · Plant Maintenance", value: "Approved · within DOA" },
      ],
    }}
  />
);

const beltGrDoc = (
  <RecordDoc
    d={{
      tcode: "MB03",
      tname: "Display Material Document",
      number: "GR-77310",
      status: "Posted · 101 receipt",
      docType: "Goods receipt · PO-77310",
      system: "Inventory management · MIGO",
      createdOn: "2026-06-23 · 09:15",
      createdBy: "Goods receiving · Assembly Line 2",
      sections: [
        {
          band: "Receipt",
          rows: [
            { label: "PO reference", value: "PO-77310" },
            { label: "Material", value: "MRO-SEAL-MECH-50MM-SIC" },
            { label: "Movement type", value: "101 · GR goods receipt" },
            { label: "Quantity received", value: "1 EA" },
            { label: "Plant / SLoc", value: "Amberg · Assembly Line 2" },
          ],
        },
      ],
      determination: { ok: true, text: "Goods receipt posted in full — 1 EA received against PO-77310; GR/IR clearing open until the invoice posts." },
    }}
  />
);

const beltMatchResultDoc = (
  <RecordDoc
    d={{
      tcode: "MIRO",
      tname: "Enter Invoice — Four-Way Match",
      number: "INV-BPI-5567",
      status: "Matched · clean · ready to post",
      docType: "Four-way match · invoice ↔ PO ↔ GR ↔ contract",
      system: "Invoice verification · LIV",
      createdOn: "2026-06-24 · 06:42",
      createdBy: "Invoice Matching agent",
      sections: [
        {
          band: "Four-way match result",
          rows: [
            { label: "Invoice", value: "BPI-5567 · $4,180.00" },
            { label: "Purchase order", value: "PO-77310 · $4,180.00" },
            { label: "Goods receipt", value: "GR-77310 · 1 EA" },
            { label: "Contract", value: "SA-MRO-07 · $4,180.00" },
            { label: "Price variance", value: "$0.00 · within tolerance" },
            { label: "Quantity variance", value: "0 · full receipt" },
          ],
        },
      ],
      determination: { ok: true, text: "Four-way clean — contract, PO, goods receipt and invoice agree at $4,180.00 with $0 variance. Cleared for today's AP batch; no exception." },
    }}
  />
);

/* ── RFQ (step 4) — solicit competitive quotes before the vendor decision ───── */
/* ── Example 1 · mechanical seal — 6 steps (RFQ+vendor merged into one sourcing
 * step, conditional on the off-contract choice; + invoice four-way match) ─────── */

export const beltPrSteps: RunStep[] = [
  step({
    id: "intake",
    agentName: "PR Processing agent",
    n: 1,
    title: "Structure & code the request",
    sub: "Turns the free-text note into a coded PR",
    aiThought:
      "An email just came in from the Assembly Line 2 plant engineer — their mechanical seal has failed and is leaking, and they need a replacement fast. It's free text with no part number, so let me read it and structure it into a coded requisition.",
    reasoning: [
      "Reading the engineer's free-text note from Assembly Line 2",
      "Extracting specs — ~45–50 mm, silicon carbide faces, heavy duty",
      "Mapping to material code MRO-SEAL-MECH-50MM-SIC",
      "Coding cost center 10034 · GL 600450",
      "Flagging the shaft-diameter range and missing part number",
    ],
    docLabel: "PR-48630 · structured requisition",
    document: beltStructuredDoc,
    altDocument: beltStructuredDocOffContract,
    sources: [
      { id: "belt-freetext", label: "Free-text PR", meta: "Intake portal · 10:40", kind: "email", body: beltFreeText },
      { id: "belt-requestor", label: "Requisitioner & org", meta: "plant directory", kind: "master", body: beltRequestorRef },
      { id: "belt-coding-ref", label: "Master-data lookup", meta: "MM · cost centers · G/L", kind: "master", body: beltCodingRef },
      { id: "belt-stock", label: "Stock on hand", meta: "stock-on-hand.xlsx", kind: "master", body: beltStockSheet },
      { id: "belt-agreement", label: "ME33K · SA-MRO-07", meta: "price · vendor · terms", kind: "contract", body: beltOutlineAgreement },
    ],
    recommendation:
      "Structured and coded to MRO-SEAL-MECH-50MM-SIC. The engineer gave a 45–50 mm range with no part number, so I read the shaft size off the equipment record for Assembly Line 2 — 50 mm. Drafted clean, routed for the checks.",
    stages: [
      {
        sourceId: "belt-freetext",
        reasoning: "Extracting the item from the free-text note",
        title: "Item — what's needed",
        fields: [
          { label: "Material", value: "Mechanical seal · SiC faces · heavy duty" },
          { label: "Shaft diameter", value: "50 mm (from \"45–50 mm\")" },
          { label: "Quantity", value: "1 EA" },
          { label: "UoM", value: "EA" },
          { label: "Delivery", value: "ASAP · production at risk" },
          { label: "Delivery date", value: "2026-07-03", type: "date" },
          { label: "Requisitioner", value: "Plant engineer · Assembly Line 2" },
        ],
      },
      {
        sourceId: "belt-requestor",
        reasoning: "Setting the requisition header from the plant directory",
        title: "Requisition header",
        fields: [
          { label: "PR type", value: "NB · Standard requisition" },
          { label: "Requestor", value: "Plant engineer · Assembly Line 2" },
          { label: "Purch. org", value: "1000 · Orvantec Procurement" },
          { label: "Purch. group", value: "200 · MRO / Maintenance" },
        ],
      },
      {
        sourceId: "belt-coding-ref",
        reasoning: "Coding the account assignment against master data",
        title: "Account assignment",
        fields: [
          { label: "Material code", value: "MRO-SEAL-MECH-50MM-SIC" },
          { label: "Plant", value: "Deburring Plant · Assembly Line 2" },
          { label: "Cost center", value: COST_CENTER },
          { label: "G/L account", value: GL },
          { label: "Material group", value: "MRO · Seals & packing" },
        ],
      },
      {
        sourceId: "belt-stock",
        reasoning: "Reading the stock-on-hand workbook + the safety-stock policy",
        title: "Stock on hand",
        narrative:
          "I read the stock-on-hand workbook: there's nothing to draw from — 0 EA on hand at Assembly Line 2 and 0 across the network (Clairmont plant, Riomar), and the seal is line-specific so there's no interplant unit to transfer in. A new buy is justified. I'd also flag that safety stock is set to 0 on this critical wear part — I recommend holding a safety stock of 1 EA so the next failure doesn't stop the line.",
        fields: [
          { label: "On-hand · this plant", value: "0 EA · Assembly Line 2" },
          { label: "Interplant (Clairmont · Riomar)", value: "0 EA · no cover" },
          { label: "Current safety stock", value: "0 EA" },
          { label: "Recommended safety stock", value: "1 EA · critical wear part" },
          { label: "Verdict", value: "No stock · new buy justified" },
        ],
      },
      {
        sourceId: "belt-agreement",
        reasoning: "Reading the agreement that covers this seal",
        title: "Source of supply",
        fields: [
          { label: "Vendor", value: "Apex Industrial Supply" },
          { label: "Outline agreement", value: "SA-MRO-07 · active" },
          { label: "Unit price", value: "$4,180.00 / EA" },
          { label: "Total value", value: "$4,180.00" },
          { label: "Payment terms", value: "NT30 · Net 30", options: PAYMENT_TERMS },
        ],
      },
    ],
  }),
  step({
    id: "vendor",
    agentName: "Master Data agent",
    n: 2,
    title: "Master data, duplicate & inventory",
    sub: "Checks the SKU, duplicates and stock",
    aiThought:
      "The request is coded now. Let me confirm the material code in the master data, scan for any duplicate request already open, and check whether another plant already has this seal on the shelf before we buy.",
    reasoning: [
      "Reading structured PR-48630",
      "Confirming the mapped material code",
      "Scanning open PRs for a duplicate — none found",
      "Checking on-hand and interplant stock — none",
      "Flagging the ambiguous diameter for sign-off",
    ],
    docLabel: "VAL-48630-MD · master data",
    document: beltMasterDataDoc,
    sources: [
      { id: "belt-pr-handoff", label: "PR-48630", meta: "from PR Processing", kind: "sap", handoff: true, body: beltStructuredDoc },
      { id: "belt-matmaster", label: "MM03 · material master", meta: "MRO-SEAL-MECH-50MM-SIC", kind: "master", body: beltMaterialMaster },
      { id: "belt-openpr", label: "ME5A · open requisitions", meta: "duplicate scan", kind: "sap", body: beltOpenPrList },
      { id: "belt-stock", label: "MB52 · stock overview", meta: "on-hand + interplant", kind: "master", body: beltStockOverview },
    ],
    recommendation:
      "Code is clean, no duplicate open, no stock to draw from — the buy is justified. The shaft range resolved to 50 mm off the equipment record for Assembly Line 2, so nothing is left open.",
    stages: [
      {
        sourceId: "belt-matmaster",
        reasoning: "Confirming the material code against the SAP material master",
        title: "Material master · MM03",
        fields: [
          { label: "Material", value: "MRO-SEAL-MECH-50MM-SIC" },
          { label: "Description", value: 'Mechanical seal 50 mm · SiC faces' },
          { label: "Valuation class", value: "3040 · MRO spares" },
          { label: "Status", value: "Active · code valid" },
        ],
      },
      {
        sourceId: "belt-openpr",
        reasoning: "Scanning open requisitions for a duplicate",
        title: "Duplicate scan · ME5A",
        fields: [
          { label: "Open PRs scanned", value: "96" },
          { label: "Same material", value: "0 open" },
          { label: "Duplicate", value: "None found" },
          { label: "Result", value: "Single demand · clear to buy" },
        ],
      },
      {
        sourceId: "belt-stock",
        reasoning: "Checking on-hand and interplant stock",
        title: "Stock overview · MB52",
        fields: [
          { label: "On-hand · Amberg", value: "0 EA" },
          { label: "Clairmont plant", value: "0 EA" },
          { label: "Riomar", value: "0 EA" },
          { label: "Transfer possible", value: "No · new buy justified" },
        ],
      },
    ],
  }),
  step({
    id: "invoice",
    agentName: "Warranty & coverage desk",
    n: 3,
    title: "Warranty & coverage",
    sub: "Confirms it's a buy, not a claim",
    aiThought:
      "Before I treat this as a new purchase, let me check whether the gear reducer is still under warranty — if the failure is a covered defect, this should be a claim, not a buy.",
    reasoning: [
      "Checking the gear reducer's OEM warranty status",
      "Seal is a wear part — not covered equipment",
      "Failure is wear & tear, not a covered defect",
      "Coverage — parts only, buy new",
    ],
    docLabel: "VAL-48630-WTY · warranty",
    document: beltWarrantyDoc,
    sources: [
      { id: "belt-md-handoff", label: "VAL-48630-MD", meta: "from Master Data", kind: "sap", handoff: true, body: beltMasterDataDoc },
      { id: "belt-warranty-rec", label: "Warranty record", meta: "Assembly Line 2 gear reducer", kind: "kb", body: beltWarrantyRecord },
    ],
    recommendation: "Wear-and-tear on a wear part — no warranty claim applies. Proceed as a new-buy.",
    stages: [
      {
        sourceId: "belt-warranty-rec",
        reasoning: "Reading the equipment warranty record",
        title: "Warranty & coverage · IQS3",
        fields: [
          { label: "Equipment", value: "Assembly Line 2 gear reducer" },
          { label: "OEM warranty", value: "Expired · > 12 mo" },
          { label: "Service contract", value: "None on the seal" },
          { label: "Failure type", value: "Wear & tear · not a defect" },
          { label: "Claimable", value: "No · consumable wear part" },
          { label: "Outcome", value: "New buy · not a claim" },
        ],
      },
    ],
  }),
  step({
    id: "sourcing",
    agentName: "Sourcing & contract agent",
    n: 4,
    title: "Vendor & agreed price",
    sub: "Confirms the supplier and the price on file",
    aiThought:
      "We already buy this seal from a supplier we have an agreement with, so there is nothing to go to market for. Let me confirm the supplier is still approved and that the request is priced at what the agreement says.",
    reasoning: [
      "Confirming the supplier is approved and still preferred",
      "Reading the price and terms off the agreement",
      "Checking the request is priced at the agreed rate",
    ],
    docLabel: "VAL-48630-VEN · vendor & price",
    document: beltVendorDoc,
    sources: [
      { id: "belt-rfq-handoff", label: "VAL-48630-WTY", meta: "from Warranty desk", kind: "sap", handoff: true, body: beltWarrantyDoc },
      { id: "belt-agreement", label: "ME33K · SA-MRO-07", meta: "outline agreement", kind: "contract", body: beltOutlineAgreement },
      { id: "belt-vendor-rec", label: "Vendor master · Apex", meta: "approved supplier", kind: "master", body: beltVendorRecord },
    ],
    recommendation:
      "Apex Industrial Supply is the approved, preferred supplier for this seal and it sits on the live agreement SA-MRO-07 at $4,180 each, 5-day lead. The request is priced at exactly that. Nothing to source and nothing to negotiate.",
    stages: [
      {
        sourceId: "belt-agreement",
        reasoning: "Pricing against the outline agreement",
        title: "Price · ME33K SA-MRO-07",
        fields: [
          { label: "Contract price", value: "$4,180.00 / EA" },
          { label: "PR price", value: "$4,180.00 · matches" },
          { label: "Agreement", value: "SA-MRO-07 · item 40" },
          { label: "Payment terms", value: "NT30 · Net 30", options: PAYMENT_TERMS },
          { label: "Off-contract leakage", value: "None · 0%" },
        ],
      },
    ],
  }),
  step({
    id: "orchestrator",
    agentName: "Approval & routing",
    n: 5,
    title: "Approval & routing",
    sub: "Cost center, approval limit and release",
    aiThought:
      "Every control has cleared, so all that is left is to route this for release and tell the engineer their seal is on the way.",
    reasoning: [
      "Confirming cost center 10034 / GL 600450",
      "On-contract — competitive bidding not required",
      "Within the plant-maintenance approval limit",
      "Releasing the requisition to the supplier on the agreement",
    ],
    docLabel: "VAL-48630-APR · approval",
    document: beltApprovalDoc,
    sources: [
      { id: "belt-ven-handoff", label: "VAL-48630-VEN", meta: "vendor & price", kind: "sap", handoff: true, body: beltVendorDoc },
      { id: "belt-doa", label: "DOA release routing", meta: "WF-48630-REL", kind: "policy", body: beltApprovalRouting },
    ],
    email: {
      cta: "Release & tell the engineer",
      attachment: beltPoDoc,
      attachmentLabel: "PO-77310 · purchase order",
      to: "Plant engineer · Assembly Line 2",
      subject: "PR-48630 — mechanical seal on its way · releasing",
      lines: [
        "I've structured and coded your request to MRO-SEAL-MECH-50MM-SIC, on-contract via Apex at $4,180, Net 30 — everything checks out.",
        "You gave a 45–50 mm shaft range with no part number; the equipment record for Assembly Line 2 has a 50 mm gear reducer shaft, so that is what has been ordered.",
        "I'm releasing PR-48630 to Apex now. Nothing is waiting on you.",
      ],
      toastTitle: "Confirmation sent",
      toastBody: "Sent to the plant engineer · PR-48630 released to Apex on-contract at $4,180.",
      resolvedDocument: beltApprovalDocResolved,
    },
    recommendation:
      "Every control clears — nothing is waiting on anyone. On approve, the agent confirms back to the engineer and releases PR-48630 to Apex on the agreement at $4,180.",
  }),
  step({
    id: "invoice",
    agentName: "Invoice Matching agent",
    n: 6,
    title: "Invoice four-way match",
    sub: "Four-way matches the seal invoice",
    aiThought:
      "Apex has emailed their invoice for the seal. Let me four-way match it against the PO, the goods receipt and the contract before we clear it for payment.",
    inboundEmail: {
      from: "Apex Industrial Supply · AR",
      fromAddr: "ar@apexindustrial.com",
      receivedMeta: "Outlook · 2026-06-24 · 06:38",
      subject: "Invoice BPI-5567 · PO-77310 · 50 mm SiC mechanical seal",
      lines: [
        "Please find attached our invoice BPI-5567 for the heavy-duty mechanical seal shipped against your PO-77310.",
        "1 EA · $4,180.00 net · Net 30 · tax code U1. Goods were received at Assembly Line 2 on 2026-06-23.",
        "Thank you for your business — remit per the terms on the invoice.",
      ],
      attachment: beltInvoiceDoc,
      attachmentLabel: "BPI-5567 · Apex invoice",
      cta: "Continue to the four-way match",
    },
    reasoning: [
      "Reading the captured Apex invoice BPI-5567",
      "Running the four-way match — contract ↔ PO ↔ goods receipt ↔ invoice",
      "Checking price and quantity — $4,180 · 1 EA · all agree",
      "Applying tolerance — variance $0.00, within threshold",
      "Clearing the seal invoice for today's AP batch",
    ],
    docLabel: "INV-BPI-5567 · four-way match",
    document: beltMatchResultDoc,
    sources: [
      { id: "belt-inv-handoff", label: "INV-BPI-5567", meta: "Apex invoice · captured", kind: "invoice", handoff: true, body: beltInvoiceDoc },
      { id: "belt-po-match", label: "PO-77310", meta: "SAP ME23N", kind: "sap", body: beltPoDoc },
      { id: "belt-gr-match", label: "GR-77310", meta: "SAP MB03 · plant-posted", kind: "sap", body: beltGrDoc },
      { id: "belt-contract-match", label: "ME33K · SA-MRO-07", meta: "outline agreement", kind: "contract", body: beltOutlineAgreement },
    ],
    recommendation:
      "Seal invoice is four-way clean — contract, PO, goods receipt and invoice agree at $4,180 with $0 variance, within tolerance. Cleared for today's AP batch; no exception to route.",
    stages: [
      {
        sourceId: "belt-po-match",
        reasoning: "Matching the invoice against PO-77310 — price, quantity, net value",
        title: "Four-way match — invoice vs PO",
        matchGrid: { columns: beltMatchColumns, rows: beltMatchRows, reveal: ["invoice", "po"] },
      },
      {
        sourceId: "belt-gr-match",
        reasoning: "Adding the goods receipt GR-77310 — received quantity",
        title: "Four-way match — adding the goods receipt",
        matchGrid: { columns: beltMatchColumns, rows: beltMatchRows, reveal: ["invoice", "po", "gr"] },
      },
      {
        sourceId: "belt-contract-match",
        reasoning: "Confirming the contract price and the four-way verdict",
        title: "Four-way match — adding the contract · verdict",
        matchGrid: {
          columns: beltMatchColumns,
          rows: beltMatchRows,
          reveal: ["invoice", "po", "gr", "contract"],
          verdict: "All four agree · variance USD 0.00 · contract −19% vs OEM list · clean",
        },
      },
    ],
  }),
];

/* ── Example 2 · grinding media — 5 steps ────────────────────────────────────── */

export const rollerPrSteps: RunStep[] = [
  step({
    id: "intake",
    agentName: "PR Processing agent",
    n: 1,
    title: "Structure & code the request",
    sub: "Turns the free-text note into a coded PR",
    aiThought:
      "The Deburring Line 3 engineer has emailed in — the grinding media is wearing out far too fast in Deburring Line 3 and they've asked for eight bags. It's free text, so let me read it and structure the requisition.",
    reasoning: [
      "Reading the engineer's free-text note from Deburring Line 3",
      "Extracting — 1.2 mm zirconia grinding media, ~6–8 BAG",
      "Mapping to material code MRO-MEDIA-ZRO2-1.2MM",
      "Coding cost center 10034 · GL 600450",
      "Noting it matches the Deburring Line 3 charge",
    ],
    docLabel: "PR-48655 · structured requisition",
    document: rollerStructuredDoc,
    sources: [
      { id: "roller-freetext", label: "Free-text PR", meta: "Intake portal · 11:04", kind: "email", body: rollerFreeText },
      { id: "roller-requestor", label: "Requisitioner & org", meta: "plant directory", kind: "master", body: rollerRequestorRef },
      { id: "roller-coding-ref", label: "Master-data lookup", meta: "MM · cost centers · G/L", kind: "master", body: rollerCodingRef },
      { id: "roller-agreement", label: "ME33K · SA-MRO-07", meta: "price · vendor · terms", kind: "contract", body: rollerOutlineAgreement },
    ],
    recommendation:
      "Structured and coded to MRO-MEDIA-ZRO2-1.2MM at 8 BAG. Matches the Deburring Line 3 charge — the downstream checks will test whether all 8 should actually be bought.",
    stages: [
      {
        sourceId: "roller-freetext",
        reasoning: "Extracting the item from the free-text note",
        title: "Item — what's needed",
        fields: [
          { label: "Size", value: "1.2 mm · zirconia · 25 kg bag" },
          { label: "Quantity", value: "8 BAG (from \"6–8\")" },
          { label: "UoM", value: "BAG" },
          { label: "Same as", value: "Deburring Line 3 charge" },
          { label: "Delivery", value: "Urgent · grind fineness dropping" },
          { label: "Delivery date", value: "2026-06-22", type: "date" },
          { label: "Requisitioner", value: "Plant engineer · Deburring Line 3" },
        ],
      },
      {
        sourceId: "roller-requestor",
        reasoning: "Setting the requisition header from the plant directory",
        title: "Requisition header",
        fields: [
          { label: "PR type", value: "NB · Standard requisition" },
          { label: "Requestor", value: "Plant engineer · Deburring Line 3" },
          { label: "Purch. org", value: "1000 · Orvantec Procurement" },
          { label: "Purch. group", value: "200 · MRO / Maintenance" },
        ],
      },
      {
        sourceId: "roller-coding-ref",
        reasoning: "Coding the account assignment against master data",
        title: "Account assignment",
        fields: [
          { label: "Material code", value: "MRO-MEDIA-ZRO2-1.2MM" },
          { label: "Plant", value: "Deburring Plant · Deburring Line 3" },
          { label: "Cost center", value: COST_CENTER },
          { label: "G/L account", value: GL },
          { label: "Material group", value: "MRO · Milling & media" },
        ],
      },
      {
        sourceId: "roller-agreement",
        reasoning: "Pricing and sourcing from the outline agreement",
        title: "Valuation & source of supply",
        fields: [
          { label: "Unit price", value: "$118.00 / BAG" },
          { label: "Total value", value: "$944.00 (8 BAG)" },
          { label: "Vendor", value: "Apex Industrial Supply" },
          { label: "Outline agreement", value: "SA-MRO-07 · item 50" },
          { label: "Info record", value: "5300004118" },
          { label: "Payment terms", value: "NT30 · Net 30", options: PAYMENT_TERMS },
        ],
      },
    ],
  }),
  step({
    id: "vendor",
    agentName: "Master Data agent",
    n: 2,
    title: "Master data, duplicate & inventory",
    sub: "Finds a duplicate and sister-plant stock",
    aiThought:
      "Eight is a lot to buy. Let me confirm the media code, scan for a duplicate request, and check stock across the plants before we order any.",
    reasoning: [
      "Reading structured PR-48655",
      "Scanning open PRs — found PR-48641 for the same SKU",
      "Checking on-hand stock — none at this plant",
      "Checking interplant — 6 BAG at the Clairmont plant store",
      "Flagging duplicate demand and available stock",
    ],
    docLabel: "VAL-48655-MD · master data",
    document: rollerMasterDataDoc,
    hasExceptions: true,
    sources: [
      { id: "roller-pr-handoff", label: "PR-48655", meta: "from PR Processing", kind: "sap", handoff: true, body: rollerStructuredDoc },
      { id: "roller-matmaster", label: "MM03 · material master", meta: "MRO-MEDIA-ZRO2-1.2MM", kind: "master", body: rollerMaterialMaster },
      { id: "roller-openpr", label: "ME5A · open requisitions", meta: "duplicate found · PR-48641", kind: "sap", body: rollerOpenPrList },
      { id: "roller-stock", label: "Stock on hand", meta: "stock-on-hand.xlsx", kind: "master", body: rollerInventorySheet },
      { id: "roller-sto", label: "ME23N · stock transfer", meta: "STO-48655 · 6 BAG", kind: "sap", body: rollerStockTransfer },
    ],
    recommendation:
      "Two flags — a duplicate open PR (PR-48641) and 6 BAG available at the Clairmont plant store. Don't buy 8: transfer the 6 and cancel the duplicate.",
    stages: [
      {
        sourceId: "roller-matmaster",
        reasoning: "Confirming the material code against the SAP material master",
        title: "Material master · MM03",
        fields: [
          { label: "Material", value: "MRO-MEDIA-ZRO2-1.2MM" },
          { label: "Description", value: "Grinding media · zirconia 1.2 mm · 25 kg bag" },
          { label: "Valuation class", value: "3040 · MRO spares" },
          { label: "Status", value: "Active · code valid" },
        ],
      },
      {
        sourceId: "roller-openpr",
        reasoning: "Scanning open requisitions for a duplicate",
        title: "Duplicate scan · ME5A",
        fields: [
          { label: "Open PRs scanned", value: "96" },
          { label: "Same material", value: "1 open" },
          { label: "Duplicate", value: "PR-48641 · 6 BAG" },
          { label: "Result", value: "Cancel the duplicate" },
        ],
      },
      {
        sourceId: "roller-stock",
        reasoning: "Checking enterprise inventory across the plants",
        title: "Inventory across plants",
        narrative:
          "I checked enterprise inventory across the plants: Deburring Line 3 is at 0 on-hand, but the Clairmont plant store holds 6 surplus bags of this exact media. The network already has most of what's needed — I recommend transferring those 6 by interplant movement and buying only the 2-unit shortfall, instead of buying all 8 new. That avoids $708 of duplicate spend and draws down stock we've already paid for.",
        fields: [
          { label: "On-hand · Deburring Line 3", value: "0 BAG" },
          { label: "Clairmont plant", value: "6 BAG · surplus" },
          { label: "Riomar", value: "0 BAG" },
          { label: "Transfer possible", value: "Yes · move 6 BAG" },
          { label: "Residual buy", value: "2 BAG shortfall" },
        ],
      },
      {
        sourceId: "roller-sto",
        reasoning: "Comparing fulfillment options — transfer vs a fresh buy",
        title: "Fulfillment plan · interplant vs buy",
        choice: {
          recommendation:
            "We need 8 grinding media, but Clairmont plant already has 6 surplus in its store. I recommend transferring those 6 by interplant movement and buying only the 2-unit shortfall on-contract ($236) — versus $944 to buy all 8 new. It cuts spend ~75% and draws down stock we've already paid for.",
          recommendedId: "transfer",
          options: [
            {
              id: "transfer",
              name: "Transfer 6 + buy 2",
              meta: "Interplant rebalancing",
              badges: ["Recommended", "Uses surplus"],
              stats: [
                { label: "Cash buy", value: "$236" },
                { label: "Transfer", value: "6 BAG · Clairmont" },
                { label: "Lead", value: "This week" },
                { label: "vs buy-all", value: "−75%" },
              ],
              fields: [
                { label: "Plan", value: "Transfer 6 BAG + buy 2 BAG" },
                { label: "Transfer from", value: "Clairmont plant store · STO-48655" },
                { label: "Fresh buy", value: "2 BAG · $236 · Apex on-contract" },
                { label: "Saving", value: "$708 vs buying all 8" },
              ],
            },
            {
              id: "buyall",
              name: "Buy all 8 new",
              meta: "Procure fresh · ignores surplus",
              badges: ["Higher cost"],
              stats: [
                { label: "Cash buy", value: "$944" },
                { label: "Transfer", value: "None" },
                { label: "Lead", value: "7 days" },
                { label: "vs buy-all", value: "—" },
              ],
              fields: [
                { label: "Plan", value: "Buy 8 BAG new" },
                { label: "Transfer from", value: "None — surplus left idle" },
                { label: "Fresh buy", value: "8 BAG · $944 · Apex" },
                { label: "Saving", value: "$0 vs buying all 8" },
              ],
            },
            {
              id: "transferonly",
              name: "Transfer 6 only",
              meta: "Defer the 2-unit shortfall",
              badges: ["Leaves a gap"],
              stats: [
                { label: "Cash buy", value: "$0" },
                { label: "Transfer", value: "6 BAG · Clairmont" },
                { label: "Lead", value: "This week" },
                { label: "vs buy-all", value: "−100%" },
              ],
              fields: [
                { label: "Plan", value: "Transfer 6 BAG · no buy" },
                { label: "Transfer from", value: "Clairmont plant store · STO-48655" },
                { label: "Fresh buy", value: "None · 2 BAG still short" },
                { label: "Saving", value: "$944, but 2 BAG unfilled" },
              ],
            },
          ],
        },
      },
    ],
  }),
  step({
    id: "invoice",
    agentName: "Warranty & coverage desk",
    n: 3,
    title: "Warranty & coverage",
    sub: "Checks if the early wear is covered",
    aiThought:
      "Let me check the deburring line's warranty — if this early wear is a covered defect, the worn media should be a claim, not a purchase.",
    reasoning: [
      "Reading Deburring Line 3's commissioning date",
      "Commissioned 2026-01-15 — inside the 12-month parts warranty",
      "Premature attrition — possible covered defect",
      "Coverage — parts, ZirCore OEM",
    ],
    docLabel: "VAL-48655-WTY · warranty",
    document: rollerWarrantyDoc,
    hasExceptions: true,
    sources: [
      { id: "roller-md-handoff", label: "VAL-48655-MD", meta: "from Master Data", kind: "sap", handoff: true, body: rollerMasterDataDoc },
      { id: "roller-warranty-rec", label: "Warranty record", meta: "Deburring Line 3 · in warranty", kind: "kb", body: rollerWarrantyRecord },
    ],
    recommendation:
      "Deburring Line 3 is inside its 12-month parts warranty and the early wear looks like a defect — raise a warranty claim on the covered bags rather than buying them.",
    stages: [
      {
        sourceId: "roller-warranty-rec",
        reasoning: "Reading the equipment warranty record",
        title: "Warranty & coverage · IQS3",
        fields: [
          { label: "Equipment", value: "Deburring Line 3" },
          { label: "Commissioned", value: "2026-01-15" },
          { label: "OEM warranty", value: "In warranty · 12-mo parts" },
          { label: "Failure type", value: "Premature attrition · defect" },
          { label: "Claimable", value: "Yes · ZirCore OEM" },
          { label: "Outcome", value: "Claim the covered units" },
        ],
      },
    ],
  }),
  step({
    id: "sourcing",
    agentName: "Sourcing & contract agent",
    n: 4,
    title: "Vendor, contract & price",
    sub: "Prices only the residual buy",
    aiThought:
      "For the few units we actually need to buy, let me confirm the approved vendor, the contract and the price.",
    reasoning: [
      "Confirming Apex Industrial Supply is approved & preferred",
      "Distributor route −22% vs the OEM",
      "Checking sourcing agreement SA-MRO-07",
      "Pricing only the shortfall — $118 / BAG · Net 30",
    ],
    docLabel: "VAL-48655-VEN · vendor & price",
    document: rollerVendorDoc,
    sources: [
      { id: "roller-wty-handoff", label: "VAL-48655-WTY", meta: "from Warranty desk", kind: "sap", handoff: true, body: rollerWarrantyDoc },
      { id: "roller-agreement", label: "ME33K · SA-MRO-07", meta: "outline agreement", kind: "contract", body: rollerOutlineAgreement },
      { id: "roller-vendor-rec", label: "Vendor master · Apex", meta: "approved supplier", kind: "master", body: rollerVendorRecord },
    ],
    recommendation:
      "If any units are bought, Apex is approved and on-contract at $118/BAG — but transfer and warranty cover most of the demand, so price only the residual.",
    stages: [
      {
        sourceId: "roller-vendor-rec",
        reasoning: "Confirming the approved vendor",
        title: "Vendor master · XK03",
        fields: [
          { label: "Vendor", value: "Apex Industrial Supply" },
          { label: "BP role", value: "Vendor · distributor" },
          { label: "Approved", value: "Yes · MRO grinding media" },
          { label: "Preferred", value: "Yes · on SA-MRO-07" },
        ],
      },
      {
        sourceId: "roller-agreement",
        reasoning: "Pricing the residual buy against the agreement",
        title: "Price · ME33K SA-MRO-07",
        fields: [
          { label: "Contract price", value: "$118.00 / BAG" },
          { label: "Distributor route", value: "−22% vs OEM" },
          { label: "Agreement", value: "SA-MRO-07 · item 50" },
          { label: "Priced for", value: "2 BAG residual only" },
          { label: "Payment terms", value: "NT30 · Net 30", options: PAYMENT_TERMS },
        ],
      },
    ],
  }),
  step({
    id: "orchestrator",
    agentName: "Approval & routing",
    n: 5,
    title: "Approval & routing",
    sub: "Re-scopes the buy and cancels the duplicate",
    aiThought:
      "I've re-scoped this from an eight-unit buy down to a transfer, a warranty claim and a two-unit buy. Let me send the plan and route it.",
    reasoning: [
      "Confirming cost center 10034 / GL 600450",
      "Routing 6 BAG as an interplant transfer from Amberg",
      "Raising a warranty claim on the early-worn media",
      "Re-scoping the buy to the 2 BAG shortfall · cancelling PR-48641",
    ],
    docLabel: "VAL-48655-APR · approval",
    document: rollerApprovalDoc,
    sources: [
      { id: "roller-ven-handoff", label: "VAL-48655-VEN", meta: "from Sourcing", kind: "sap", handoff: true, body: rollerVendorDoc },
      { id: "roller-doa", label: "DOA release routing", meta: "WF-48655-REL", kind: "policy", body: rollerApprovalRouting },
    ],
  email: {
    cta: "Send the re-scoped plan",
    attachment: rollerPoDoc,
    attachmentLabel: "PO-77311 · purchase order",
      to: "Plant engineer · Deburring Line 3",
      subject: "PR-48655 — re-scoped: transfer + warranty claim + 2-unit buy",
      lines: [
        "Before raising an 8-unit buy: 6 of these bags are in stock at the Clairmont plant store, and Deburring Line 3 is inside its 12-month parts warranty — so the early wear should be a warranty claim, not a purchase.",
        "Plan: transfer 6 BAG by interplant movement (here this week), raise a warranty claim with ZirCore on the early-worn media, and buy only the 2 BAG shortfall from Apex on-contract ($236). I've also drafted a cancellation for the duplicate PR-48641.",
        "I'm routing the transfer, the claim and the 2-unit PR now — flag me if you'd rather buy all 8.",
      ],
      toastTitle: "Re-scoped plan sent",
      toastBody: "Sent to the engineer · transfer + claim + 2-unit buy routed; duplicate PR-48641 cancelled.",
      resolvedDocument: rollerApprovalDocResolved,
    },
    recommendation:
      "Re-scope from an 8-unit buy to a 6-unit interplant transfer + a warranty claim + a 2-unit on-contract buy ($236), and cancel the duplicate PR-48641. On approve, the agent sends the plan and routes all three.",
  }),
];

/* ════════════════════════════════════════════════════════════════════════
 * Example 3 — Drive-gearbox seal kit · predicted stock-out · proactive pre-buy
 * UC2 · Production Risk–Driven Auto Procurement. PREDICTIVE: no PR is raised —
 * the agent fuses SNOP + criticality + consumption + lead time + market to
 * predict a stock-out, overrides the deterministic reorder point, and proposes a
 * proactive pre-buy a human approves. GearTech = OEM single-source.
 * ════════════════════════════════════════════════════════════════════════ */

const SEAL_KIT = "MRO-PUMP-GEARBOX-SEALKIT-OEM";

const riskSnopSignal = (
  <EmailDoc
    from="S&OP Planning · demand desk"
    fromAddr="planning@orvantec.com"
    to="MRO risk sensing"
    sent="2026-06-24 · 07:15"
    subject="Demand signal — Utilities line ramp, FY-Q3"
    tone="inbound"
    lines={[
      "Flagging a forward demand change on the Utilities line for spares-coverage review.",
      "The line is scheduled to ramp +18% next quarter under the new production contract, which raises duty on its critical drives — including the boiler-feed-pump drive gearbox, classified A1 (single point of failure) on the asset register.",
      "Please confirm spares coverage on the gearbox's seal & bearing kit before the ramp begins.",
    ]}
  />
);

const riskConsumptionFeed = (
  <EmailDoc
    from="Reliability · CMMS feed"
    fromAddr="cmms@orvantec.com"
    to="MRO risk sensing"
    sent="2026-06-24 · 07:18"
    subject="Coverage & consumption — drive-gearbox seal & bearing kit"
    tone="inbound"
    lines={[
      "Summarising current coverage on the drive-gearbox seal & bearing kit for the spares review.",
      "On-hand stands at 1 EA against a safety stock of 2 EA (coverage 0.5×), and trailing 12-month consumption is 2 EA and rising, with two Utilities-line trips already this quarter.",
      "Please note the deterministic reorder point only triggers at on-hand 0 — the system will not reorder until we are already out of stock.",
    ]}
  />
);

const riskSupplierLead = (
  <EmailDoc
    from="Sourcing · supplier management"
    fromAddr="sourcing@orvantec.com"
    to="MRO risk sensing"
    sent="2026-06-24 · 07:20"
    subject="Replenishment lead time — GearTech OEM seal & bearing kit"
    tone="inbound"
    lines={[
      "Confirming the replenishment position on the drive-gearbox seal & bearing kit.",
      "GearTech is the single-source OEM; the current quoted lead time is 9 weeks (~63 days), and we hold no alternate qualified source on file — replenishment can only come from GearTech.",
      "A reorder placed today would not land before the projected stock-out, so please factor this into the coverage decision.",
    ]}
  />
);

const riskCriticalitySignal = (
  <EmailDoc
    from="Asset Register · reliability engineering"
    fromAddr="assets@orvantec.com"
    to="MRO risk sensing"
    sent="2026-06-24 · 07:16"
    subject="Criticality classification — boiler-feed-pump drive gearbox"
    tone="inbound"
    lines={[
      "Confirming the criticality classification for the boiler-feed-pump drive gearbox on the Utilities line.",
      "It is class A1 — a single point of failure: a seizure takes the entire Utilities line down. There is no installed spare, so the seal & bearing kit is the only field-replaceable protection against an outage.",
      "On that basis, any stock-out of the kit should be treated as a line-down exposure when prioritising spares.",
    ]}
  />
);

const riskMarketSignal = (
  <EmailDoc
    from="Commodity desk · procurement market intelligence"
    fromAddr="commodity@orvantec.com"
    to="MRO risk sensing"
    sent="2026-06-24 · 07:22"
    subject="Market read — bearing alloy +7%, allocation tightening"
    tone="inbound"
    lines={[
      "Sharing a market read relevant to the bearing-alloy spares ahead of the coverage decision.",
      "The bearing-alloy index is up 7% this quarter and mills are moving onto allocation, so both price and availability risk are rising.",
      "Securing the kit now would lock the current price and a delivery slot before allocation tightens further.",
    ]}
  />
);

/* The proactive pre-buy authorization the reliability lead signs (manager-signs
 * pattern, like the compliance budget approval) — the human gate on the override. */
const riskPrebuyAuthorization: BudgetApproval = {
  number: "WF-49001-REL",
  title: "Proactive pre-buy authorization · RISK-49001",
  sub: "Drive-gearbox seal kit · A1-critical · GearTech OEM · no PR raised",
  rows: [
    { label: "Amount", value: "$18,400.00 · 2 EA pre-buy" },
    { label: "Plant DOA (L1)", value: "$10,000 · exceeded" },
    { label: "Asset · criticality", value: "Drive gearbox · A1 · single point of failure" },
    { label: "Reorder override", value: "Deterministic point fires too late" },
    { label: "Predicted stock-out", value: "Day 9 · vs 9-week lead" },
    { label: "Vendor · contract", value: "GearTech · SA-MRO-11 · Net 60" },
    { label: "Reliability Lead", value: "Your authorization" },
  ],
  body: [
    "No PR was raised. The Risk Sensing agent predicted a stock-out on the A1-critical drive-gearbox seal kit by fusing the S&OP ramp, equipment criticality, rising consumption, a 9-week single-source lead and a tightening alloy market.",
    "The deterministic reorder point fires only at on-hand 0 — too late for a 9-week lead — and no sister plant can cover. Authorizing overrides the reorder logic and releases a proactive 2-unit pre-buy ($18,400) ahead of the lead time to protect the utilities line.",
  ],
  signer: "Reliability Lead",
  witness: "Risk Sensing agent",
  date: "Today · 08:05",
};

const riskSignalDoc = (
  <StructuredPrDoc
    pr={{
      number: "RISK-49001",
      status: "Stock-out risk detected · no PR raised",
      createdBy: "Risk Sensing agent",
      createdOn: "2026-06-24 · 07:22",
      materialCode: SEAL_KIT,
      description: "Drive-Gearbox Mechanical Seal & Bearing Kit — GearTech OEM",
      plant: "Amberg · Utilities line",
      costCenter: COST_CENTER,
      glAccount: GL,
      item: [
        { label: "Asset", value: "Boiler feed pump · drive gearbox" },
        { label: "Criticality", value: "A1 · single point of failure" },
        { label: "On-hand vs safety", value: "1 EA vs 2 EA · 0.5× safety" },
        { label: "Consumption", value: "2 EA / 12 mo · rising" },
        { label: "Supplier lead time", value: "9 weeks · GearTech single-source" },
        { label: "Market", value: "Bearing alloy +7% · allocation tightening" },
      ],
      assignment: [
        { label: "Material group", value: "MRO · Pumps & drives" },
        { label: "Suggested vendor", value: "GearTech (OEM · single-source)" },
      ],
      confidence: "91% · pre-buy recommended",
      flags: [
        "No human PR raised — the risk was detected from SNOP, criticality, consumption and lead-time signals, not a request.",
        "Deterministic reorder point not yet tripped; with a 9-week lead time, firing at the reorder point would miss the ramp and risk a line-down.",
      ],
    }}
  />
);

const riskPredictionDoc = (
  <ValidationDoc
    report={{
      number: "VAL-49001-RISK",
      status: "Reorder logic overridden",
      docType: "Stock-out prediction · reorder override",
      system: "Inventory · planning",
      createdBy: "Master Data agent",
      createdOn: "2026-06-24 · 07:24",
      sections: [
        {
          band: "Prediction",
          rows: [
            { label: "Deterministic reorder point", expected: "Fires in time", found: "Fires at on-hand 0 · too late", ok: false },
            { label: "Predicted stock-out", expected: "After next supply", found: "Day 9 · before the 9-wk lead clears", ok: false },
            { label: "Duplicate demand", expected: "None open", found: "No open PR · no duplicate", ok: true },
          ],
        },
        {
          band: "Inventory & interplant",
          rows: [
            { label: "On-hand this plant", expected: "≥ safety stock", found: "1 EA · below safety", ok: false },
            { label: "Clairmont plant store", expected: "Check sister plant", found: "0 EA · no cover", ok: true },
            { label: "Riomar store", expected: "Check sister plant", found: "0 EA · no cover", ok: true },
          ],
        },
      ],
      verdict: { ok: false, text: "A 9-week lead means the reorder point fires too late, and no sister plant can cover. Override the deterministic logic with a proactive pre-buy of the shortfall to safety + a ramp buffer." },
    }}
  />
);

const riskCoverageDoc = (
  <ValidationDoc
    report={{
      number: "VAL-49001-COV",
      status: "Pre-buy justified",
      docType: "Coverage & working capital",
      system: "Equipment register · MRO carry policy",
      createdBy: "Warranty & coverage desk",
      createdOn: "2026-06-24 · 07:26",
      sections: [
        {
          band: "Coverage & working capital",
          rows: [
            { label: "OEM warranty / contract", expected: "Claimable?", found: "No · consumable spare", ok: true },
            { label: "Working-capital impact", expected: "Within MRO carry policy", found: "+$18.4K · inside policy", ok: true },
            { label: "Downtime exposure", expected: "Quantify the risk", found: "~$1.4M / day if the line trips", ok: false },
            { label: "Pre-buy buffer", expected: "To safety + ramp", found: "2 EA → safety 2 + 1 ramp", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Not a warranty event — a consumable critical spare. The $18.4K pre-buy is inside the MRO carrying-cost policy and trivial against a ~$1.4M/day trip exposure." },
    }}
  />
);

const riskVendorDoc = (
  <ValidationDoc
    report={{
      number: "VAL-49001-VEN",
      status: "On-contract · pre-buy priced",
      docType: "Vendor · contract · price",
      system: "Vendor master · sourcing agreement",
      createdBy: "Sourcing & contract agent",
      createdOn: "2026-06-24 · 07:28",
      sections: [
        {
          band: "Vendor & contract",
          rows: [
            { label: "Vendor approved", expected: "Approved & preferred", found: "GearTech OEM · single-source", ok: true },
            { label: "Sourcing agreement", expected: "Price + vendor match", found: "On agreement SA-MRO-11", ok: true },
            { label: "Market timing", expected: "Pre-buy vs price rise", found: "Lock now · avoids +7% alloy", ok: true },
          ],
        },
        {
          band: "Price & terms",
          rows: [
            { label: "Unit price vs contract", expected: "Match contract", found: "$9,200 / EA · matches SA-MRO-11", ok: true },
            { label: "Pre-buy value", expected: "Shortfall + buffer", found: "2 EA · $18,400", ok: true },
            { label: "Payment terms", expected: "Net 30 / 60", found: "Net 60 · compliant", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Single-source OEM, on-contract at $9,200/EA on SA-MRO-11 — locking the 2-unit pre-buy now also beats a forecast +7% alloy increase." },
    }}
  />
);

const riskApprovalDoc = (
  <ValidationDoc
    report={{
      number: "VAL-49001-APR",
      status: "Ready · human approval",
      docType: "Approval & routing (DOA)",
      system: "Cost center · DOA",
      createdBy: "Approval & routing",
      createdOn: "2026-06-24 · 07:30",
      sections: [
        {
          band: "Approval & routing",
          rows: [
            { label: "Cost center / GL", expected: "Correct plant / class", found: "10034 / 600450 · correct", ok: true },
            { label: "Competitive bidding", expected: "3 quotes if > threshold", found: "Single-source OEM · waiver on file", ok: true },
            { label: "DOA approval", expected: "Plant-maintenance limit", found: "$18.4K · over the $10K plant DOA", ok: false },
            { label: "Proactive-buy authorization", expected: "Human approves the pre-buy", found: "Pending · reorder override", ok: false },
          ],
        },
      ],
      verdict: { ok: false, text: "Every control clears except the one a person owns — authorizing a proactive pre-buy ahead of the reorder point to protect the utilities line." },
    }}
  />
);

const riskApprovalDocResolved = (
  <ValidationDoc
    report={{
      number: "VAL-49001-APR",
      status: "Pre-buy routed",
      docType: "Approval & routing (DOA)",
      system: "Cost center · DOA",
      createdBy: "Approval & routing",
      createdOn: "2026-06-24 · 08:06",
      sections: [
        {
          band: "Approval & routing",
          rows: [
            { label: "Cost center / GL", expected: "Correct plant / class", found: "10034 / 600450 · correct", ok: true },
            { label: "Competitive bidding", expected: "3 quotes if > threshold", found: "Single-source OEM · waiver on file", ok: true },
            { label: "DOA approval", expected: "Plant-maintenance limit", found: "$18.4K · authorized over the $10K plant DOA", ok: true },
            { label: "Proactive-buy authorization", expected: "Human approves the pre-buy", found: "Approved · reliability lead", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Reliability lead approved the proactive pre-buy — 2-unit GearTech PR ($18,400) routed on-contract ahead of the 9-week lead, protecting the utilities line." },
    }}
  />
);

/* Real SAP source files the risk-flow agents read (clickable evidence). */

const riskMaterialMaster = (
  <MaterialMasterDoc
    m={{
      number: SEAL_KIT,
      description: "Drive-Gearbox Mechanical Seal & Bearing Kit — GearTech OEM",
      status: "Active",
      createdOn: "2021-11-04 · 08:40",
      createdBy: "Master data steward",
      basic: [
        { label: "Material type", value: "ERSA · Spare part" },
        { label: "Industry sector", value: "Electronics & industrial automation" },
        { label: "Material group", value: "MRO · Pumps & drives" },
        { label: "Base UoM", value: "EA (kit)" },
        { label: "Gross weight", value: "12 kg" },
        { label: "Old material no.", value: "GT-SK-DGB" },
      ],
      purchasing: [
        { label: "Order unit", value: "EA" },
        { label: "Purchasing group", value: "200 · MRO" },
        { label: "Planned deliv. time", value: "63 days · 9 wk" },
        { label: "MRP type", value: "VB · reorder-point" },
        { label: "Reorder point", value: "0 EA · fires at stock-out" },
        { label: "Source list", value: "GearTech · SA-MRO-11 (single)" },
      ],
      accounting: [
        { label: "Valuation class", value: "3040 · MRO spares" },
        { label: "Price control", value: "V · moving average" },
        { label: "Moving avg price", value: "$9,200.00 / EA" },
        { label: "Currency", value: "USD" },
      ],
    }}
  />
);

const riskStockOverview = (
  <StockOverviewDoc
    s={{
      number: SEAL_KIT,
      description: "Drive-Gearbox Mechanical Seal & Bearing Kit",
      createdOn: "2026-06-24 · 07:24",
      createdBy: "Master Data agent",
      rows: [
        { plant: "Amberg · Utilities line", storageLoc: "MRO-01", onHand: "1", safety: "2", uom: "EA", tone: "short" },
        { plant: "Clairmont plant", storageLoc: "MRO-01", onHand: "0", safety: "0", uom: "EA" },
        { plant: "Riomar", storageLoc: "MRO-01", onHand: "0", safety: "0", uom: "EA" },
      ],
      note: "On-hand 1 EA is below the 2 EA safety stock (0.5× cover) and no sister plant carries the kit — no interplant transfer is possible. With a 9-week single-source lead, the reorder point fires too late; a proactive pre-buy is justified.",
    }}
  />
);

const riskWarrantyRecord = (
  <WarrantyRecordDoc
    w={{
      number: "WTY-CHK-49001",
      status: "Not covered · consumable",
      createdOn: "2026-06-24 · 07:26",
      createdBy: "Warranty & coverage desk",
      object: [
        { label: "Equipment", value: "Boiler feed pump · drive gearbox" },
        { label: "Functional loc.", value: "NGT-REC-BFP-01" },
        { label: "Component", value: "Mech seal & bearing kit" },
        { label: "Commissioned", value: "2021-11-02" },
      ],
      coverage: [
        { label: "OEM warranty", value: "Expired · > 12 mo" },
        { label: "Service contract", value: "None on consumables" },
        { label: "Coverage scope", value: "Parts only · n/a" },
      ],
      failure: [
        { label: "Failure type", value: "Wear · seal/bearing life" },
        { label: "Covered defect", value: "No" },
        { label: "Claimable", value: "No · consumable spare" },
      ],
      determination: { ok: true, text: "Seal & bearing kit is a consumable critical spare — not a warranty claim. Treat as a proactive replenishment buy." },
    }}
  />
);

const riskOutlineAgreement = (
  <OutlineAgreementDoc
    a={{
      number: "SA-MRO-11",
      status: "Active",
      createdOn: "2026-01-02 · valid to 2026-12-31",
      createdBy: "Category buyer",
      header: [
        { label: "Vendor", value: "GearTech (OEM)" },
        { label: "Vendor code", value: "0001000341" },
        { label: "Purch. org", value: "1000 · Orvantec Procurement" },
        { label: "Valid from", value: "2026-01-01" },
        { label: "Valid to", value: "2026-12-31" },
        { label: "Target value", value: "$184,000" },
      ],
      items: [
        { item: "20", material: SEAL_KIT, description: "Drive-gearbox seal & bearing kit", targetQty: "8 EA / yr", netPrice: "$9,200.00", per: "1 EA" },
      ],
      conditions: [
        { label: "Payment terms", value: "Net 60" },
        { label: "Incoterms", value: "FCA · GearTech works" },
        { label: "Price basis", value: "OEM single-source · fixed to 2026-12-31" },
      ],
    }}
  />
);

const riskVendorRecord = (
  <VendorRecordDoc
    v={{
      number: "0001000341",
      name: "GearTech Drive Systems",
      status: "Approved · single-source OEM",
      createdOn: "2019-07-22 · last review 2026-03",
      createdBy: "Supplier management",
      general: [
        { label: "BP role", value: "Vendor · OEM manufacturer" },
        { label: "Country", value: "US" },
        { label: "Tax / reg.", value: "Compliant · on file" },
      ],
      purchasing: [
        { label: "Purch. org", value: "1000 · Orvantec Procurement" },
        { label: "Order currency", value: "USD" },
        { label: "Payment terms", value: "Net 60" },
        { label: "Preferred", value: "Yes · sole OEM source" },
      ],
      approval: { ok: true, text: "Approved OEM and the only qualified source for the drive-gearbox seal kit — on agreement SA-MRO-11. No alternate qualified source on file." },
    }}
  />
);

const riskApprovalRouting = (
  <ApprovalRoutingDoc
    r={{
      number: "WF-49001-REL",
      status: "Awaiting authorization",
      createdOn: "2026-06-24 · 07:30",
      createdBy: "Approval & routing",
      summary: [
        { label: "Document", value: "RISK-49001 → proactive PR" },
        { label: "Requestor", value: "Risk Sensing agent · no human PR" },
        { label: "Category", value: "MRO · on-contract · pre-buy" },
        { label: "Amount", value: "$18,400.00" },
        { label: "Cost center / GL", value: "10034 / 600450" },
        { label: "Vendor", value: "GearTech · SA-MRO-11" },
      ],
      chain: [
        { level: "L1", approver: "Plant Maintenance Lead", role: "Maintenance", limit: "$10,000", status: "approved", when: "on-contract · within plant scope" },
        { level: "L2", approver: "Reliability Lead", role: "Reliability · pre-buy owner", limit: "$50,000", status: "pending", when: "$18.4K over the plant DOA · proactive override" },
      ],
      validation: { ok: false, text: "$18,400 exceeds the plant-maintenance DOA ($10,000) — routes to the Reliability Lead (L2) for the proactive-override authorization. Single-source OEM: competitive bidding waived." },
      action: "One open item: this is a proactive pre-buy ahead of the deterministic reorder point — the reliability lead must authorize the override.",
    }}
  />
);

/* ── Example 3 · drive-gearbox seal kit — 5 steps ──────────────────────────── */

/* The five fused risk signals — shown as previewable rows on the Risk Sensing step
 * (each opens its full email) and also surfaced in the source-files panel. */
const riskSignals: RiskSignal[] = [
  {
    id: "snop-signal",
    label: "S&OP demand signal",
    meta: "Planning · 07:15",
    kind: "email",
    body: riskSnopSignal,
    summary: "Utilities line ramps +18% next quarter — raises duty on the A1 drive gearbox",
  },
  {
    id: "criticality-signal",
    label: "Equipment criticality",
    meta: "Asset register · 07:16",
    kind: "email",
    body: riskCriticalitySignal,
    summary: "A1 · single point of failure — a seizure takes the whole Utilities line down",
  },
  {
    id: "consumption-feed",
    label: "CMMS consumption & coverage",
    meta: "Reliability · 07:18",
    kind: "email",
    body: riskConsumptionFeed,
    summary: "On-hand 1 EA vs 2 EA safety; consumption rising; reorder only fires at 0",
  },
  {
    id: "supplier-lead",
    label: "Supplier lead time",
    meta: "Sourcing · 07:20",
    kind: "email",
    body: riskSupplierLead,
    summary: "GearTech single-source · 9-week lead — a reorder today lands after the stock-out",
  },
  {
    id: "market-signal",
    label: "Market conditions",
    meta: "Commodity desk · 07:22",
    kind: "email",
    body: riskMarketSignal,
    summary: "Bearing alloy +7%, mills on allocation — buying now locks the price and a slot",
  },
];

export const riskPrSteps: RunStep[] = [
  step({
    id: "intake",
    agentName: "Risk Sensing agent",
    n: 1,
    title: "Synthesise the risk signals",
    sub: "Fuses SNOP, criticality, consumption & lead time",
    aiThought:
      "No one raised a requisition — our monitor flagged a stock-out risk on the A1-critical drive-gearbox seal kit. Let me pull the five signals — demand ramp, criticality, consumption, lead time and market — and read them together.",
    reasoning: [
      "Reading the S&OP ramp signal for the utilities line",
      "Asset register — drive gearbox is A1, a single point of failure",
      "CMMS — on-hand 1 vs safety 2, consumption rising",
      "Market — GearTech single-source, 9-week lead, alloy +7%",
      "No PR raised — structuring the predicted demand for the checks",
    ],
    docLabel: "RISK-49001 · stock-out risk brief",
    document: riskSignalDoc,
    sources: riskSignals,
    recommendation:
      "Fused five signals — the S&OP ramp, A1 criticality, rising consumption, a 9-week single-source lead and a tightening alloy market: the drive-gearbox seal kit is predicted to stock out before any replenishment can land. No PR exists — proactively structured RISK-49001 for the checks.",
    signals: {
      signals: riskSignals,
      analysis:
        "Fusing the five signals — the +18% S&OP ramp, the A1 single-point-of-failure criticality, on-hand below safety with rising consumption, a 9-week single-source lead and a tightening alloy market — the drive-gearbox seal kit is predicted to stock out before any replenishment can land. No PR exists, so I've proactively structured RISK-49001 for the checks and the pre-buy recommendation.",
    },
  }),
  step({
    id: "vendor",
    agentName: "Master Data agent",
    n: 2,
    title: "Predict the stock-out & override reorder",
    sub: "Tests reorder logic and interplant cover",
    aiThought:
      "Let me put the numbers side by side, predict when this actually stocks out, and check whether the normal reorder point or a sister plant could ever cover it in time.",
    reasoning: [
      "Reading the RISK-49001 signal brief",
      "Deterministic reorder point fires at on-hand 0 — too late for a 9-week lead",
      "Predicting the stock-out at day 9, before any supply lands",
      "Checking interplant — 0 EA at Clairmont and Riomar",
      "Overriding the reorder logic toward a proactive pre-buy",
    ],
    docLabel: "VAL-49001-RISK · prediction",
    document: riskPredictionDoc,
    hasExceptions: true,
    sources: [
      { id: "risk-handoff", label: "RISK-49001", meta: "from Risk Sensing", kind: "kb", handoff: true, body: riskSignalDoc },
      { id: "risk-matmaster", label: "MM03 · material master", meta: SEAL_KIT, kind: "master", body: riskMaterialMaster },
      { id: "risk-stock", label: "MB52 · stock overview", meta: "1 EA · below safety", kind: "master", body: riskStockOverview },
    ],
    recommendation:
      "The reorder point would fire too late for a 9-week lead, and no sister plant can cover. Overriding the deterministic logic with a proactive pre-buy of the shortfall to safety plus a ramp buffer.",
    stages: [
      {
        sourceId: "risk-matmaster",
        reasoning: "Testing the deterministic reorder logic",
        title: "Reorder logic · MM03",
        fields: [
          { label: "MRP type", value: "VB · reorder-point" },
          { label: "Reorder point", value: "0 EA · fires at stock-out" },
          { label: "Safety stock", value: "2 EA" },
          { label: "Predicted stock-out", value: "Day 9 · before the 9-wk lead" },
        ],
      },
      {
        sourceId: "risk-stock",
        reasoning: "Checking on-hand and interplant cover",
        title: "Stock overview · MB52",
        fields: [
          { label: "On-hand · Utilities", value: "1 EA · below safety" },
          { label: "Clairmont plant", value: "0 EA" },
          { label: "Riomar", value: "0 EA" },
          { label: "Transfer possible", value: "No · override reorder" },
        ],
      },
      {
        sourceId: "risk-stock",
        reasoning: "Comparing the response options against the 9-day stock-out",
        title: "Procurement response · pre-buy vs reorder",
        choice: {
          recommendation:
            "On-hand is 1 EA against 2 EA safety, the stock-out is predicted at day 9, and the single-source lead is 9 weeks — no sister plant can cover. I recommend overriding the deterministic reorder point with a proactive 2-unit pre-buy now: it lands before the line trips and locks the price ahead of the alloy increase. Waiting for the reorder point fires far too late.",
          recommendedId: "prebuy",
          options: [
            {
              id: "prebuy",
              name: "Proactive pre-buy",
              meta: "Override reorder · buy 2 now",
              badges: ["Recommended", "Protects the line"],
              stats: [
                { label: "Action", value: "Buy 2 EA now" },
                { label: "Lands", value: "Before day 9" },
                { label: "Carry", value: "+$18.4K" },
                { label: "Line risk", value: "Covered" },
              ],
              fields: [
                { label: "Response", value: "Proactive pre-buy · 2 EA" },
                { label: "Reorder logic", value: "Overridden · fires too late" },
                { label: "Lands by", value: "Ahead of the day-9 stock-out" },
                { label: "Working capital", value: "+$18,400 · inside carry policy" },
              ],
            },
            {
              id: "reorder",
              name: "Wait for reorder point",
              meta: "Deterministic · fires at zero",
              badges: ["Too late"],
              stats: [
                { label: "Action", value: "None until 0 EA" },
                { label: "Lands", value: "9 wks after day 9" },
                { label: "Carry", value: "$0" },
                { label: "Line risk", value: "Stock-out" },
              ],
              fields: [
                { label: "Response", value: "Standard reorder point" },
                { label: "Reorder logic", value: "Fires at on-hand 0 — too late" },
                { label: "Lands by", value: "~9 wks after the stock-out" },
                { label: "Working capital", value: "$0 · but line-down risk" },
              ],
            },
            {
              id: "transfer",
              name: "Interplant transfer",
              meta: "Pull from a sister plant",
              badges: ["No cover"],
              stats: [
                { label: "Action", value: "Transfer" },
                { label: "Lands", value: "n/a" },
                { label: "Carry", value: "$0" },
                { label: "Line risk", value: "Stock-out" },
              ],
              fields: [
                { label: "Response", value: "Interplant transfer" },
                { label: "Reorder logic", value: "n/a" },
                { label: "Lands by", value: "No stock at Clairmont or Riomar" },
                { label: "Working capital", value: "$0 · not feasible" },
              ],
            },
          ],
        },
      },
    ],
  }),
  step({
    id: "invoice",
    agentName: "Warranty & coverage desk",
    n: 3,
    title: "Coverage & working capital",
    sub: "Confirms it's a pre-buy, not a claim",
    aiThought:
      "Let me confirm the coverage position and what it costs in working capital to carry a proactive pre-buy.",
    reasoning: [
      "Checking OEM warranty / service contract — consumable spare, not claimable",
      "Working-capital impact +$18.4K — inside the MRO carry policy",
      "Quantifying downtime exposure — ~$1.4M / day if the line trips",
      "Sizing the pre-buy to safety + a ramp buffer",
    ],
    docLabel: "VAL-49001-COV · coverage",
    document: riskCoverageDoc,
    sources: [
      { id: "pred-handoff", label: "VAL-49001-RISK", meta: "from Master Data", kind: "sap", handoff: true, body: riskPredictionDoc },
      { id: "risk-warranty-rec", label: "Warranty record", meta: "drive gearbox · consumable", kind: "kb", body: riskWarrantyRecord },
    ],
    recommendation:
      "Not a warranty event — a consumable critical spare. The $18.4K pre-buy is inside the carrying-cost policy and trivial against a ~$1.4M/day trip exposure. The coverage gap is confirmed.",
    stages: [
      {
        sourceId: "risk-warranty-rec",
        reasoning: "Coverage & working-capital check",
        title: "Coverage · consumable spare",
        fields: [
          { label: "OEM warranty", value: "Consumable · not claimable" },
          { label: "Working capital", value: "+$18.4K · inside policy" },
          { label: "Downtime exposure", value: "~$1.4M / day if it trips" },
          { label: "Pre-buy buffer", value: "Safety 2 + 1 ramp" },
        ],
      },
    ],
  }),
  step({
    id: "sourcing",
    agentName: "Sourcing & contract agent",
    n: 4,
    title: "Source & price the pre-buy",
    sub: "Validates vendor, agreement and price",
    aiThought:
      "GearTech is the single-source OEM. Let me price the pre-buy against the agreement and check the market timing before it tightens.",
    reasoning: [
      "Confirming GearTech is the on-contract single-source OEM",
      "Checking sourcing agreement SA-MRO-11",
      "Pricing the 2-unit pre-buy — $9,200 / EA · $18,400",
      "Locking now also beats a forecast +7% alloy increase",
    ],
    docLabel: "VAL-49001-VEN · vendor & price",
    document: riskVendorDoc,
    sources: [
      { id: "cov-handoff", label: "VAL-49001-COV", meta: "from Warranty desk", kind: "sap", handoff: true, body: riskCoverageDoc },
      { id: "risk-agreement", label: "ME33K · SA-MRO-11", meta: "outline agreement", kind: "contract", body: riskOutlineAgreement },
      { id: "risk-vendor-rec", label: "Vendor master · GearTech", meta: "single-source OEM", kind: "master", body: riskVendorRecord },
    ],
    recommendation:
      "GearTech is the on-contract single-source OEM at $9,200/EA on SA-MRO-11; a 2-unit pre-buy ($18,400) on Net 60 also locks the price ahead of the forecast alloy increase.",
    stages: [
      {
        sourceId: "risk-vendor-rec",
        reasoning: "Confirming the single-source OEM",
        title: "Vendor master · XK03",
        fields: [
          { label: "Vendor", value: "GearTech Drive Systems" },
          { label: "BP role", value: "Vendor · OEM" },
          { label: "Approved", value: "Yes · sole source" },
          { label: "Alternate source", value: "None qualified" },
        ],
      },
      {
        sourceId: "risk-agreement",
        reasoning: "Pricing the pre-buy against the agreement",
        title: "Price · ME33K SA-MRO-11",
        fields: [
          { label: "Contract price", value: "$9,200.00 / EA" },
          { label: "Pre-buy", value: "2 EA · $18,400" },
          { label: "Payment terms", value: "NT60 · Net 60", options: PAYMENT_TERMS },
          { label: "Need-by date", value: "2026-08-25", type: "date" },
          { label: "Market timing", value: "Locks ahead of +7% alloy" },
        ],
      },
    ],
  }),
  step({
    id: "orchestrator",
    agentName: "Approval & routing",
    n: 5,
    title: "Approve & route the pre-buy",
    sub: "Cost center, DOA and the human authorization",
    aiThought:
      "This overrides the deterministic reorder logic, so it needs a person. Let me prepare the pre-buy authorization for the reliability lead to sign.",
    reasoning: [
      "Confirming cost center 10034 / GL 600450",
      "Single-source OEM — competitive bidding waived on file",
      "Over the $10K plant DOA — routing the override to the reliability lead",
      "Holding for the reliability lead to authorize the proactive pre-buy",
    ],
    docLabel: "VAL-49001-APR · approval",
    document: riskApprovalDoc,
    hasExceptions: true,
    sources: [
      { id: "ven-handoff", label: "VAL-49001-VEN", meta: "from Sourcing", kind: "sap", handoff: true, body: riskVendorDoc },
      { id: "risk-doa", label: "DOA release routing", meta: "WF-49001-REL", kind: "policy", body: riskApprovalRouting },
    ],
    email: {
      cta: "Review & send for authorization",
      attachment: <BudgetApprovalDoc a={riskPrebuyAuthorization} />,
      attachmentLabel: "Pre-buy authorization · WF-49001-REL",
      to: "Reliability lead · Amberg Utilities line",
      subject: "RISK-49001 — drive-gearbox seal kit predicted to stock out in 9 days · authorize pre-buy",
      lines: [
        "No PR was raised — I detected a stock-out risk on the A1-critical drive-gearbox seal kit by fusing five signals: the S&OP ramp, equipment criticality, rising consumption, a 9-week single-source lead and a tightening alloy market.",
        "The deterministic reorder point fires only at on-hand 0 — too late for a 9-week lead — and no sister plant can cover. I've attached a proactive pre-buy authorization for a 2-unit GearTech pre-buy ($18,400, Net 60) — inside the carry policy and trivial against a ~$1.4M/day line-down.",
        "Please review and sign the attached authorization to override the reorder logic; on your sign-off I'll route the proactive PR ahead of the lead time.",
      ],
      toastTitle: "Pre-buy authorized",
      toastBody: "The reliability lead signed the proactive pre-buy authorization — the override is approved.",
      resolvedDocument: riskApprovalDocResolved,
      reply: {
        from: "Reliability lead · Amberg Utilities line",
        receivedMeta: "Outlook · 08:05",
        subject: "RE: RISK-49001 — authorization signed",
        lines: ["Signed the attached authorization — pre-buy the 2 kits and protect the utilities line. Good catch ahead of the ramp."],
        source: {
          id: "risk-prebuy-signed",
          label: "Pre-buy authorization · signed",
          meta: "Reliability lead · 08:05",
          kind: "kb",
          body: (
            <div className="space-y-3">
              <EmailDoc
                from="Reliability lead · Amberg Utilities line"
                fromAddr="reliability@orvantec.com"
                to="Approval & routing"
                sent="2026-06-24 · 08:05"
                subject="RE: RISK-49001 — authorization signed"
                tone="inbound"
                lines={["Signed the attached authorization — pre-buy the 2 kits and protect the utilities line. Good catch ahead of the ramp."]}
              />
              <BudgetApprovalDoc a={riskPrebuyAuthorization} signed />
            </div>
          ),
        },
      },
    },
    recommendation:
      "All controls pass; the only open item is the human authorization of a proactive pre-buy. Send the recommendation; on approval, route the 2-unit GearTech PR on-contract ($18,400) ahead of the 9-week lead.",
  }),
];

/* ════════════════════════════════════════════════════════════════════════
 * Example 4 — Compliance & Commercial Orchestrator (UC4)
 * A validated PR (PR-48690 · winder drive-gearbox rebuild kit · $42,000) is
 * ready for PO conversion. The orchestrator runs the final compliance &
 * commercial gate — contract compliance, HSE & insurance, GL/cost-center &
 * delivery feasibility, approval hierarchy & sourcing rules — then issues a
 * compliant PO and routes the over-DOA sign-off. GearTech = OEM single-source.
 * ════════════════════════════════════════════════════════════════════════ */

const CC = "10052 · Test & Pack Line Maintenance";

const complianceTriggerPr = (
  <StructuredPrDoc
    pr={{
      number: "PR-48690",
      status: "Validated · ready for PO conversion",
      createdBy: "Sourcing & contract agent",
      createdOn: "2026-06-22 · 14:05",
      materialCode: "MRO-GEARBOX-REBUILD-KIT-OEM",
      description: "Winder Drive Gearbox — Rebuild Kit — GearTech OEM",
      plant: "Riomar · Test & Pack Line 2",
      costCenter: CC,
      glAccount: "600450 · Repairs & Maintenance",
      item: [
        { label: "Item", value: "Gearbox rebuild kit · OEM" },
        { label: "Quantity", value: "1 EA" },
        { label: "UoM", value: "EA (kit)" },
        { label: "Scope", value: "Parts + on-site rebuild" },
        { label: "Delivery", value: "Before the planned outage" },
        { label: "Requisitioner", value: "Reliability engineer · Filling Plant" },
      ],
      assignment: [
        { label: "Material group", value: "MRO · Pumps & drives" },
        { label: "Suggested vendor", value: "GearTech (OEM · single-source)" },
      ],
      confidence: "Validated · ready for PO",
      prType: "NB · Standard requisition",
      requestor: "Reliability engineer · Filling Plant",
      purchOrg: "1000 · Orvantec Procurement",
      purchGroup: "200 · MRO / Maintenance",
      valuation: [
        { label: "Unit price", value: "$42,000.00 / EA" },
        { label: "Total value", value: "$42,000.00" },
        { label: "Currency", value: "USD" },
      ],
      sourceOfSupply: [
        { label: "Vendor", value: "GearTech (OEM)" },
        { label: "Outline agreement", value: "SA-MRO-09 · item 20" },
        { label: "Info record", value: "5300004290" },
      ],
      deliveryTerms: [
        { label: "Incoterms", value: "FCA · GearTech works" },
        { label: "Payment terms", value: "Net 60" },
        { label: "Deliv. date", value: "Before outage · 2026-08-03" },
      ],
    }}
  />
);

const complianceAgreement = (
  <OutlineAgreementDoc
    a={{
      number: "SA-MRO-09",
      status: "Active · expiring",
      createdOn: "2025-07-20 · valid to 2026-07-20",
      createdBy: "Category buyer",
      header: [
        { label: "Vendor", value: "GearTech (OEM)" },
        { label: "Vendor code", value: "0001000341" },
        { label: "Purch. org", value: "1000 · Orvantec Procurement" },
        { label: "Valid from", value: "2025-07-21" },
        { label: "Valid to", value: "2026-07-20 · 28 days" },
        { label: "Target value", value: "$600,000" },
      ],
      items: [
        { item: "20", material: "MRO-GEARBOX-REBUILD-KIT-OEM", description: "Drive-gearbox rebuild kit", targetQty: "8 EA / yr", netPrice: "$42,000.00", per: "1 EA" },
      ],
      conditions: [
        { label: "Payment terms", value: "Net 60" },
        { label: "Incoterms", value: "FCA · GearTech works" },
        { label: "Renewal", value: "Flag · expires in 28 days" },
      ],
    }}
  />
);

/* The renewed agreement the AI drafts and attaches to the manager for approval. */
const complianceRenewedContract = (
  <OutlineAgreementDoc
    a={{
      number: "SA-MRO-09 · R2",
      status: "Renewal draft · pending approval",
      createdOn: "Today · valid to 2027-12-31",
      createdBy: "Compliance & Contract agent",
      header: [
        { label: "Vendor", value: "GearTech (OEM)" },
        { label: "Vendor code", value: "0001000341" },
        { label: "Purch. org", value: "1000 · Orvantec Procurement" },
        { label: "Valid from", value: "2026-07-21 · renewed" },
        { label: "Valid to", value: "2027-12-31 · +18 mo" },
        { label: "Target value", value: "$600,000" },
      ],
      items: [
        { item: "20", material: "MRO-GEARBOX-REBUILD-KIT-OEM", description: "Drive-gearbox rebuild kit", targetQty: "8 EA / yr", netPrice: "$42,000.00", per: "1 EA" },
      ],
      conditions: [
        { label: "Payment terms", value: "Net 60 · unchanged" },
        { label: "Incoterms", value: "FCA · GearTech works" },
        { label: "Renewal", value: "Updated date · manager to approve" },
      ],
    }}
  />
);

const complianceContractDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48690-CC",
      status: "1 flag",
      docType: "Contract & commercial compliance",
      system: "Purchasing · contracts",
      createdBy: "Compliance & Contract",
      createdOn: "2026-06-22 · 14:10",
      sections: [
        {
          band: "Contract & commercial",
          rows: [
            { label: "Vendor approved", expected: "On approved-supplier list", found: "GearTech OEM · approved", ok: true },
            { label: "Price vs contract", expected: "Match agreement", found: "$42,000 · matches SA-MRO-09", ok: true },
            { label: "Payment terms", expected: "Net 30 / 60", found: "Net 60 · compliant", ok: true },
            { label: "Contract validity", expected: "Covers delivery date", found: "Expires in 28 days · before delivery", ok: false },
          ],
        },
      ],
      verdict: { ok: false, text: "On-contract and price-compliant, but SA-MRO-09 expires in 28 days — lock this PO under the current agreement now and flag the contract for renewal." },
    }}
  />
);

const complianceHseDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48690-HSE",
      status: "Cleared",
      docType: "HSE & insurance clearance",
      system: "EHS · contractor management",
      createdBy: "HSE & Insurance desk",
      createdOn: "2026-06-22 · 14:13",
      sections: [
        {
          band: "On-site work clearance",
          rows: [
            { label: "On-site work", expected: "HSE review if on-site", found: "Yes · rebuild on the drive line", ok: true },
            { label: "Contractor HSE clearance", expected: "Valid clearance", found: "GearTech · cleared to 2026-12", ok: true },
            { label: "Insurance certificate", expected: "≥ $5M general liability", found: "$5M GL · on file", ok: true },
            { label: "Method statement / RAMS", expected: "Approved for the task", found: "Approved · lockout-tagout", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Contractor HSE clearance, $5M insurance and an approved method statement are on file — the on-site rebuild is cleared to proceed." },
    }}
  />
);

const complianceDeliveryDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48690-DEL",
      status: "Feasible",
      docType: "GL / cost-center & delivery",
      system: "Controlling · planning",
      createdBy: "Cost & Delivery desk",
      createdOn: "2026-06-22 · 14:16",
      sections: [
        {
          band: "Account assignment",
          rows: [
            { label: "Cost center / GL", expected: "Correct plant / class", found: "10052 / 600450 · correct", ok: true },
            { label: "Budget availability", expected: "Within maintenance budget", found: "Available · committed", ok: true },
          ],
        },
        {
          band: "Delivery feasibility",
          rows: [
            { label: "Lead time", expected: "Before the outage", found: "4 weeks · clears the window", ok: true },
            { label: "Planned outage", expected: "Install window", found: "6 weeks out · feasible", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "GL/cost-center correct and in budget; the 4-week lead clears the 6-week planned outage — delivery is feasible." },
    }}
  />
);

const complianceApprovalRouting = (
  <ApprovalRoutingDoc
    r={{
      number: "WF-48690-REL",
      status: "L2 required · needs you",
      createdOn: "2026-06-22 · 14:19",
      createdBy: "Approval & routing",
      summary: [
        { label: "Document", value: "PR-48690 → PO-77412" },
        { label: "Requestor", value: "Reliability eng · Winding Plant" },
        { label: "Category", value: "MRO · on-contract" },
        { label: "Amount", value: "$42,000.00" },
        { label: "Cost center / GL", value: "10052 / 600450" },
        { label: "Vendor", value: "GearTech · SA-MRO-09" },
      ],
      chain: [
        { level: "L1", approver: "Plant Maintenance Lead", role: "Maintenance", limit: "$10,000", status: "approved", when: "auto · on-contract, HSE cleared" },
        { level: "L2", approver: "Procurement Manager", role: "Procurement", limit: "$50,000", status: "pending", when: "$42K over the plant DOA" },
      ],
      validation: { ok: false, text: "$42,000 exceeds the plant-maintenance DOA ($10,000) — routes to the Procurement Manager (L2). Single-source OEM: competitive-bidding waiver on file." },
      action: "PR-48690 is over the plant DOA — route to the Procurement Manager for L2 sign-off before the PO releases.",
    }}
  />
);

const complianceBudgetApproval: BudgetApproval = {
  number: "WF-48690-REL",
  title: "Over-DOA budget approval · PO-77412",
  sub: "PR-48690 → PO-77412 · Drive-gearbox rebuild kit · GearTech OEM",
  rows: [
    { label: "Amount", value: "$42,000.00" },
    { label: "Plant DOA (L1)", value: "$10,000 · exceeded" },
    { label: "Cost center / GL", value: "10052 / 600450" },
    { label: "Vendor · contract", value: "GearTech · SA-MRO-09" },
    { label: "L1 · Plant Maintenance", value: "Approved · HSE cleared" },
    { label: "L2 · Procurement Manager", value: "Your sign-off" },
  ],
  body: [
    "PR-48690 has cleared every compliance gate — contract (on SA-MRO-09), HSE & insurance for the on-site rebuild, GL/cost-center, and delivery feasibility against the planned outage.",
    "At $42,000 the spend is over the plant-maintenance delegation of authority ($10,000), so it needs L2 authorization. Signing approves the over-DOA spend and releases PO-77412 to GearTech under the current agreement.",
  ],
  signer: "Procurement Manager · L2",
  witness: "Compliance & Contract agent",
  date: "Today · 14:20",
};

const complianceApprovalRoutingResolved = (
  <ApprovalRoutingDoc
    r={{
      number: "WF-48690-REL",
      status: "Released · L2 signed",
      createdOn: "2026-06-22 · 14:20",
      createdBy: "Approval & routing",
      summary: [
        { label: "Document", value: "PR-48690 → PO-77412" },
        { label: "Requestor", value: "Reliability eng · Winding Plant" },
        { label: "Category", value: "MRO · on-contract" },
        { label: "Amount", value: "$42,000.00" },
        { label: "Cost center / GL", value: "10052 / 600450" },
        { label: "Vendor", value: "GearTech · SA-MRO-09" },
      ],
      chain: [
        { level: "L1", approver: "Plant Maintenance Lead", role: "Maintenance", limit: "$10,000", status: "approved", when: "auto · on-contract, HSE cleared" },
        { level: "L2", approver: "Procurement Manager", role: "Procurement", limit: "$50,000", status: "approved", when: "budget approval signed · 14:20" },
      ],
      validation: { ok: true, text: "L2 sign-off received — the over-DOA spend is authorized and PO-77412 can release to GearTech on SA-MRO-09." },
    }}
  />
);

const compliancePoFields = {
  header: [
    { label: "Vendor", value: "GearTech (OEM) · 0001000341" },
    { label: "Ship-to", value: "Riomar · Test & Pack Line 2 dock" },
    { label: "Payment terms", value: "Net 60" },
    { label: "Incoterms", value: "FCA · GearTech works" },
    { label: "Currency", value: "USD" },
    { label: "Contract ref", value: "SA-MRO-09 · item 20" },
  ],
  items: [
    { item: "10", material: "MRO-GEARBOX-REBUILD-KIT-OEM", description: "Drive-gearbox rebuild kit", qty: "1 EA", netPrice: "$42,000.00", value: "$42,000.00", delivDate: "2026-08-03" },
  ],
  conditions: [
    { label: "Net value", value: "$42,000.00" },
    { label: "Freight", value: "$0 · FCA" },
    { label: "Tax", value: "Exempt · MRO" },
    { label: "Total value", value: "$42,000.00" },
  ],
};

const compliancePoDoc = (
  <PurchaseOrderDoc
    p={{
      number: "PO-77412",
      status: "Awaiting release",
      createdOn: "2026-06-22 · 14:21",
      createdBy: "Commercial Orchestrator",
      ...compliancePoFields,
      release: [
        { label: "L1 · Plant Maintenance", value: "Approved" },
        { label: "L2 · Procurement Manager", value: "Pending · $42K over DOA" },
      ],
    }}
  />
);

const compliancePoDocResolved = (
  <PurchaseOrderDoc
    p={{
      number: "PO-77412",
      status: "Released",
      createdOn: "2026-06-22 · 14:48",
      createdBy: "Commercial Orchestrator",
      ...compliancePoFields,
      release: [
        { label: "L1 · Plant Maintenance", value: "Approved" },
        { label: "L2 · Procurement Manager", value: "Approved · released to GearTech" },
      ],
    }}
  />
);

/* Real SAP records the compliance orchestrator reads (clickable evidence). */

const complianceHseRecord = (
  <RecordDoc
    d={{
      tcode: "CV03N",
      tname: "Display Document Info Record",
      number: "HSE-48690",
      status: "Cleared",
      docType: "Contractor HSE & insurance clearance",
      system: "EHS · contractor management",
      createdOn: "2026-06-22 · 14:13",
      createdBy: "HSE & Insurance desk",
      sections: [
        {
          band: "On-site work",
          rows: [
            { label: "Work type", value: "On-site rebuild · drive line" },
            { label: "HSE review", value: "Required · on-site" },
            { label: "Permit", value: "Hot-work + LOTO" },
          ],
        },
        {
          band: "Contractor clearance",
          rows: [
            { label: "Contractor", value: "GearTech field service" },
            { label: "HSE clearance", value: "Valid to 2026-12" },
            { label: "Insurance cert.", value: "$5M general liability · on file" },
            { label: "Method statement", value: "RAMS approved · lockout-tagout" },
          ],
        },
      ],
      determination: { ok: true, text: "Contractor HSE clearance, $5M insurance and an approved method statement are on file — the on-site rebuild is cleared to proceed." },
    }}
  />
);

const complianceDeliveryRecord = (
  <RecordDoc
    d={{
      tcode: "FMAVCR",
      tname: "Display Budget / Availability",
      number: "GL-48690",
      status: "Available",
      docType: "Cost-centre · budget · delivery feasibility",
      system: "FI-CO · controlling",
      createdOn: "2026-06-22 · 14:16",
      createdBy: "Cost & Delivery desk",
      sections: [
        {
          band: "Account assignment",
          rows: [
            { label: "Cost center", value: "10052 · Test & Pack Line Maintenance" },
            { label: "G/L account", value: "600450 · Repairs & Maintenance" },
            { label: "Budget", value: "Available · committed" },
          ],
        },
        {
          band: "Delivery feasibility",
          rows: [
            { label: "Lead time", value: "4 weeks" },
            { label: "Planned outage", value: "6 weeks out" },
            { label: "Window", value: "Clears · feasible" },
          ],
        },
      ],
      determination: { ok: true, text: "GL/cost-center correct and in budget; the 4-week lead clears the 6-week planned outage — delivery is feasible." },
    }}
  />
);

/* ── PO commercial match (step 6) — PR ↔ contract ↔ PO ↔ budget tie-out ───────
 * A closing four-way commercial reconciliation: the converted PO-77412 is tied
 * back to the requisition PR-48690, the SA-MRO-09 agreement and the signed L2
 * budget approval. Columns fill one document per stage. */
const complianceMatchColumns = [
  { key: "pr", label: "PR-48690" },
  { key: "contract", label: "SA-MRO-09" },
  { key: "po", label: "PO-77412" },
  { key: "budget", label: "Budget" },
];
const complianceMatchRows = [
  { dimension: "Unit price (USD)", cells: { pr: { value: "42,000.00", ok: true }, contract: { value: "42,000.00", ok: true }, po: { value: "42,000.00", ok: true }, budget: { value: "—", ok: false } } },
  { dimension: "Quantity (EA)", cells: { pr: { value: "1", ok: true }, contract: { value: "1", ok: true }, po: { value: "1", ok: true }, budget: { value: "—", ok: false } } },
  { dimension: "Net value (USD)", cells: { pr: { value: "42,000.00", ok: true }, contract: { value: "42,000.00", ok: true }, po: { value: "42,000.00", ok: true }, budget: { value: "42,000.00", ok: true } } },
  { dimension: "Payment terms", cells: { pr: { value: "Net 60", ok: true }, contract: { value: "Net 60", ok: true }, po: { value: "Net 60", ok: true }, budget: { value: "—", ok: false } } },
  { dimension: "Cost center", cells: { pr: { value: "10052", ok: true }, contract: { value: "—", ok: false }, po: { value: "10052", ok: true }, budget: { value: "10052", ok: true } } },
];

const complianceMatchResultDoc = (
  <RecordDoc
    d={{
      tcode: "ME29N",
      tname: "Purchase Order — Commercial Match",
      number: "MATCH-48690",
      status: "Matched · clean · L2 signed",
      docType: "Four-way commercial match · PR ↔ contract ↔ PO ↔ budget",
      system: "Purchasing · commercial compliance",
      createdOn: "2026-06-22 · 14:50",
      createdBy: "Commercial Orchestrator",
      sections: [
        {
          band: "Four-way commercial match",
          rows: [
            { label: "Requisition", value: "PR-48690 · $42,000.00" },
            { label: "Agreement", value: "SA-MRO-09 · $42,000.00" },
            { label: "Purchase order", value: "PO-77412 · $42,000.00" },
            { label: "Budget approval", value: "WF-48690-REL · $42,000 · signed" },
            { label: "Price variance", value: "$0.00 · within tolerance" },
            { label: "Cost center", value: "10052 · ties out" },
          ],
        },
      ],
      determination: { ok: true, text: "Four-way commercial match clean — PR, agreement, PO and the signed L2 budget approval all tie out at $42,000.00 on Net 60, cost center 10052. Cleared to release." },
    }}
  />
);

export const compliancePrSteps: RunStep[] = [
  step({
    id: "sourcing",
    agentName: "Compliance & Contract",
    n: 1,
    title: "Contract & commercial compliance",
    sub: "Validates the buy against the agreement",
    aiThought:
      "This requisition is validated and ready to become a PO. Let me read the agreement, confirm it's compliant, and flag the contract if it's close to expiring.",
    flagged: true,
    reasoning: [
      "Reading validated PR-48690 · ready for PO conversion",
      "Confirming GearTech is approved and on SA-MRO-09",
      "Price $42,000 matches the agreement · Net 60",
      "Checking contract validity — expires in 28 days",
      "Flagging the contract for renewal · lock the PO now",
    ],
    docLabel: "VAL-48690-CC · contract compliance",
    document: complianceContractDoc,
    sources: [
      { id: "cc-pr", label: "PR-48690", meta: "ready for PO conversion", kind: "sap", body: complianceTriggerPr },
      { id: "cc-agreement", label: "ME33K · SA-MRO-09", meta: "outline agreement · expiring", kind: "contract", body: complianceAgreement },
    ],
    recommendation:
      "On-contract and price-compliant. The only flag is that SA-MRO-09 expires in 28 days — I've drafted a renewal to send the manager for approval, and I'd lock this PO under the current agreement now.",
    email: {
      cta: "Review & send the renewal",
      to: "Procurement Manager · Winding Plant",
      subject: "SA-MRO-09 expiring in 28 days — renewal for approval",
      lines: [
        "SA-MRO-09 (GearTech · drive-gearbox rebuild kit) expires in 28 days — before the PO-77412 delivery date. To avoid a lapse, I've drafted a renewal that extends the agreement to 2027-12-31 with price and terms unchanged.",
        "I'm sending you the renewal to take forward with GearTech; I'll lock PO-77412 under the current agreement now so the rebuild isn't held up.",
      ],
      attachment: complianceRenewedContract,
      attachmentLabel: "ME33K · SA-MRO-09 · renewed",
      toastTitle: "Renewal sent",
      toastBody: "Renewal sent to the Procurement Manager · PO-77412 locked under the current agreement.",
    },
    stages: [
      {
        sourceId: "cc-agreement",
        reasoning: "Validating the buy against the outline agreement",
        title: "Contract compliance · ME33K",
        fields: [
          { label: "Vendor", value: "GearTech (OEM) · approved" },
          { label: "Agreement", value: "SA-MRO-09 · item 20" },
          { label: "Price vs contract", value: "$42,000 · matches" },
          { label: "Payment terms", value: "NT60 · Net 60", options: PAYMENT_TERMS },
          { label: "Contract validity", value: "Expires in 28 days · flag renewal" },
        ],
      },
    ],
  }),
  step({
    id: "invoice",
    agentName: "HSE & Insurance desk",
    n: 2,
    title: "HSE & insurance clearance",
    sub: "Clears the on-site rebuild work",
    aiThought:
      "The rebuild is on-site work, so let me check the contractor's HSE clearance, insurance and method statement before we let it proceed.",
    reasoning: [
      "Reading the contract-compliance handoff",
      "On-site rebuild on the drive line — HSE review required",
      "Contractor HSE clearance valid to 2026-12",
      "Insurance certificate — $5M general liability on file",
      "Method statement / RAMS approved · lockout-tagout",
    ],
    docLabel: "VAL-48690-HSE · HSE clearance",
    document: complianceHseDoc,
    sources: [
      { id: "cc-cc-handoff", label: "VAL-48690-CC", meta: "from Compliance & Contract", kind: "sap", handoff: true, body: complianceContractDoc },
      { id: "cc-hse-rec", label: "HSE clearance record", meta: "contractor · insurance · RAMS", kind: "kb", body: complianceHseRecord },
    ],
    recommendation:
      "The rebuild is on-site, so it needs HSE clearance — and the contractor's clearance, $5M insurance and an approved method statement are all on file. Cleared to proceed.",
    stages: [
      {
        sourceId: "cc-hse-rec",
        reasoning: "Clearing the on-site rebuild with HSE & insurance",
        title: "HSE & insurance · clearance",
        fields: [
          { label: "On-site work", value: "Rebuild · HSE review required" },
          { label: "HSE clearance", value: "Valid to 2026-12" },
          { label: "Insurance cert.", value: "$5M general liability · on file" },
          { label: "Method statement", value: "RAMS approved · lockout-tagout" },
          { label: "Outcome", value: "Cleared to proceed" },
        ],
      },
    ],
  }),
  step({
    id: "vendor",
    agentName: "Cost & Delivery desk",
    n: 3,
    title: "GL / cost-center & delivery",
    sub: "Confirms coding, budget and the outage window",
    aiThought:
      "Let me confirm the GL and cost center are right, the budget is committed, and the lead time clears the planned outage.",
    reasoning: [
      "Confirming cost center 10052 / GL 600450",
      "Budget available and committed",
      "Lead time 4 weeks vs the planned outage in 6 weeks",
      "Delivery clears the install window",
    ],
    docLabel: "VAL-48690-DEL · GL & delivery",
    document: complianceDeliveryDoc,
    sources: [
      { id: "cc-hse-handoff", label: "VAL-48690-HSE", meta: "from HSE desk", kind: "sap", handoff: true, body: complianceHseDoc },
      { id: "cc-del-rec", label: "Budget & delivery record", meta: "GL · cost center · outage", kind: "master", body: complianceDeliveryRecord },
    ],
    recommendation:
      "Cost center and GL are correct and in budget, and the 4-week lead clears the 6-week planned outage — delivery is feasible.",
    stages: [
      {
        sourceId: "cc-del-rec",
        reasoning: "Confirming coding, budget and the outage window",
        title: "Cost / delivery · feasibility",
        fields: [
          { label: "Cost center / GL", value: "10052 / 600450 · correct" },
          { label: "Budget", value: "Available · committed" },
          { label: "Lead time", value: "4 weeks" },
          { label: "Planned outage", value: "6 weeks out · clears" },
          { label: "Delivery", value: "Feasible" },
          { label: "Delivery date", value: "2026-07-20", type: "date" },
        ],
      },
    ],
  }),
  step({
    id: "po",
    agentName: "Approval & routing",
    n: 4,
    title: "Approval hierarchy & sourcing rules",
    sub: "Routes the over-DOA sign-off",
    aiThought:
      "At $42,000 this is over the plant delegation of authority. Let me apply the approval hierarchy and route it for the L2 sign-off.",
    reasoning: [
      "Confirming approval hierarchy for $42,000",
      "L1 plant-maintenance approved · HSE cleared",
      "$42K exceeds the plant DOA ($10,000) — needs L2",
      "Single-source OEM · competitive-bidding waiver on file",
      "Routing to the Procurement Manager for L2 sign-off",
    ],
    docLabel: "WF-48690-REL · approval routing",
    inbound: {
      source: {
        id: "cc-mgr-proceed",
        label: "Manager · proceed",
        meta: "Outlook · 14:18",
        kind: "email",
        body: (
          <EmailDoc
            from="Procurement Manager · Winding Plant"
            fromAddr="procurement@orvantec.com"
            to="Approval & routing"
            sent="2026-06-22 · 14:18"
            subject="PR-48690 — proceed with the PO"
            tone="inbound"
            lines={[
              "Cleared on my side — proceed with PO-77412 under the current agreement.",
              "I'll sign the new contract with GearTech using the renewal email you sent me, so coverage is in place before delivery.",
            ]}
          />
        ),
      },
    },
    document: complianceApprovalRouting,
    sources: [
      { id: "cc-del-handoff", label: "VAL-48690-DEL", meta: "from Cost & Delivery", kind: "sap", handoff: true, body: complianceDeliveryDoc },
      { id: "cc-pr-doa", label: "PR-48690", meta: "amount · cost center", kind: "sap", body: complianceTriggerPr },
    ],
    recommendation:
      "Everything is compliant; the one human decision is the L2 sign-off — $42K is over the plant DOA. I've drafted the request and the budget approval; sign it to authorise the over-DOA spend and release the PO.",
    email: {
      cta: "Review & send for sign-off",
      to: "Procurement Manager · Winding Plant",
      subject: "PR-48690 → PO-77412 — $42,000 over plant DOA · sign to release",
      lines: [
        "PR-48690 has cleared every compliance gate — contract on SA-MRO-09, HSE & insurance for the on-site rebuild, GL/cost-center, and delivery against the planned outage.",
        "At $42,000 it's over the plant-maintenance DOA ($10,000), so it needs your L2 sign-off. I've attached the budget approval — review and sign to authorise the over-DOA spend and release the PO to GearTech.",
      ],
      attachment: <BudgetApprovalDoc a={complianceBudgetApproval} />,
      attachmentLabel: "Budget approval · WF-48690-REL",
      toastTitle: "Budget approval signed",
      toastBody: "The Procurement Manager signed the over-DOA budget approval — the L2 sign-off is in.",
      resolvedDocument: complianceApprovalRoutingResolved,
      reply: {
        from: "Procurement Manager · Winding Plant",
        receivedMeta: "Outlook · 14:22",
        subject: "RE: PR-48690 — budget approval signed",
        lines: ["Approved — signed the attached budget approval. Release PO-77412 to GearTech."],
        source: {
          id: "cc-budget-signed",
          label: "Budget approval · signed",
          meta: "Procurement Manager · 14:20",
          kind: "kb",
          body: (
            <div className="space-y-3">
              <EmailDoc
                from="Procurement Manager · Winding Plant"
                fromAddr="procurement@orvantec.com"
                to="Approval & routing"
                sent="2026-06-22 · 14:22"
                subject="RE: PR-48690 — budget approval signed"
                tone="inbound"
                lines={["Approved — signed the attached budget approval. Release PO-77412 to GearTech."]}
              />
              <BudgetApprovalDoc a={complianceBudgetApproval} signed />
            </div>
          ),
        },
      },
    },
    stages: [
      {
        sourceId: "cc-pr-doa",
        reasoning: "Applying the approval hierarchy to the amount",
        title: "Approval routing · DOA",
        fields: [
          { label: "Document", value: "PR-48690 → PO-77412" },
          { label: "Amount", value: "$42,000.00" },
          { label: "Cost center / GL", value: "10052 / 600450" },
          { label: "Plant DOA (L1)", value: "$10,000" },
          { label: "Over DOA", value: "Yes · route to L2" },
          { label: "L2 approver", value: "Procurement Manager" },
        ],
      },
    ],
  }),
  step({
    id: "orchestrator",
    agentName: "Commercial Orchestrator",
    n: 5,
    title: "Convert to a compliant PO",
    sub: "Issues PO-77412 and routes the release",
    aiThought:
      "Every compliance gate is clear. Let me convert the requisition into a compliant PO and release it to GearTech.",
    reasoning: [
      "All compliance gates clear · contract, HSE, GL, delivery",
      "Converting PR-48690 to PO-77412 on SA-MRO-09",
      "Net 60 · $42,000 · FCA · GearTech OEM",
      "Holding for the Procurement Manager's L2 release",
    ],
    docLabel: "PO-77412 · purchase order",
    document: compliancePoDoc,
    sources: [
      { id: "cc-apr-handoff", label: "WF-48690-REL", meta: "from Approval & routing", kind: "sap", handoff: true, body: complianceApprovalRouting },
    ],
    email: {
      cta: "Send for L2 sign-off",
      attachment: compliancePoDoc,
      attachmentLabel: "PO-77412 · ME23N",
      to: "Procurement Manager",
      subject: "PO-77412 — $42,000 over plant DOA · approve to release",
      lines: [
        "PR-48690 (winder drive-gearbox rebuild kit) has cleared every compliance gate — on-contract via GearTech on SA-MRO-09, HSE and insurance cleared for the on-site rebuild, GL/cost-center correct, and the 4-week lead clears the planned outage.",
        "I've converted it to PO-77412 ($42,000, Net 60); it cleared L2 in the budget approval, so I'm releasing it to GearTech now.",
        "PO-77412 is on its way to GearTech — flag me if anything needs to change before the rebuild.",
      ],
      toastTitle: "PO released",
      toastBody: "PO-77412 released to GearTech on SA-MRO-09 · $42,000 · Net 60.",
      resolvedDocument: compliancePoDocResolved,
    },
    recommendation:
      "Every compliance gate clears — I've converted PR-48690 to a compliant PO-77412 ($42,000 on SA-MRO-09), L2-signed. On approve, the agent releases the PO to GearTech.",
  }),
  step({
    id: "po",
    agentName: "Commercial Match agent",
    n: 6,
    title: "PO commercial match",
    sub: "Four-way ties PO to PR, contract & budget",
    aiThought:
      "Let me reconcile the released PO against the requisition, the agreement and the signed budget approval — a four-way commercial check before we close.",
    reasoning: [
      "Reading the released PO-77412 and the requisition PR-48690",
      "Running the commercial match — PR ↔ contract ↔ PO ↔ budget",
      "Checking price, terms and cost center — $42,000 · Net 60 · 10052",
      "Confirming the signed L2 budget approval covers the spend",
      "Tying out the four-way commercial match — clean",
    ],
    docLabel: "MATCH-48690 · commercial match",
    document: complianceMatchResultDoc,
    sources: [
      { id: "cc-m-pr", label: "PR-48690", meta: "requisition · captured", kind: "sap", handoff: true, body: complianceTriggerPr },
      { id: "cc-m-contract", label: "ME33K · SA-MRO-09", meta: "outline agreement", kind: "contract", body: complianceAgreement },
      { id: "cc-m-po", label: "PO-77412", meta: "SAP ME23N · released", kind: "sap", body: compliancePoDoc },
      { id: "cc-m-budget", label: "Budget approval · signed", meta: "WF-48690-REL · L2", kind: "budget", body: <BudgetApprovalDoc a={complianceBudgetApproval} signed /> },
    ],
    recommendation:
      "Commercial match is four-way clean — PR-48690, SA-MRO-09, PO-77412 and the signed L2 budget approval all tie out at $42,000 on Net 60, cost center 10052. No commercial exception.",
    stages: [
      {
        sourceId: "cc-m-pr",
        reasoning: "Baselining the match on requisition PR-48690",
        title: "Commercial match — PR baseline",
        matchGrid: { columns: complianceMatchColumns, rows: complianceMatchRows, reveal: ["pr"] },
      },
      {
        sourceId: "cc-m-contract",
        reasoning: "Adding the SA-MRO-09 agreement — price & terms",
        title: "Commercial match — adding the contract",
        matchGrid: { columns: complianceMatchColumns, rows: complianceMatchRows, reveal: ["pr", "contract"] },
      },
      {
        sourceId: "cc-m-po",
        reasoning: "Adding the converted PO-77412 — price, terms, cost center",
        title: "Commercial match — adding the PO",
        matchGrid: { columns: complianceMatchColumns, rows: complianceMatchRows, reveal: ["pr", "contract", "po"] },
      },
      {
        sourceId: "cc-m-budget",
        reasoning: "Adding the signed L2 budget approval and the four-way verdict",
        title: "Commercial match — adding the budget · verdict",
        matchGrid: {
          columns: complianceMatchColumns,
          rows: complianceMatchRows,
          reveal: ["pr", "contract", "po", "budget"],
          verdict: "All four tie out · variance USD 0.00 · Net 60 · cost center 10052 · L2 signed",
        },
      },
    ],
  }),
];
