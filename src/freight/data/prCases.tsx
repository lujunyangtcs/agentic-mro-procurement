/**
 * MRO PR Intake & Validation flow — two worked examples.
 *
 * A plant engineer raises a messy free-text purchase requisition; the workforce
 * structures and codes it, then validates it across master data & duplicates,
 * warranty & coverage, vendor / contract / price, and approval & routing — the
 * checklist a buyer runs today by hand. Each example surfaces a different headline
 * exception:
 *   · Conveyor belt  → incomplete PR · spec ambiguity / wrong-part risk
 *   · Idler roller   → duplicate demand · stock at a sister plant · warranty cover
 *
 * Step actor names are overridden (agentName) to the procurement roles even though
 * the underlying agent ids are inherited from the base. Vendors are anonymised
 * (Apex Industrial Supply = preferred distributor; ConveyorCore = OEM).
 */

import type { RunStep } from "@/freight/data/runSteps";
import { StructuredPrDoc, ValidationDoc } from "@/freight/components/docs/pr/PrDocs";
import { EmailDoc } from "@/freight/components/docs/sources";

const COST_CENTER = "10034 · Recycling Plant Maintenance";
const GL = "600450 · Repairs & Maintenance";

/* ════════════════════════════════════════════════════════════════════════
 * Example 1 — Conveyor belt · incomplete PR · spec ambiguity
 * ════════════════════════════════════════════════════════════════════════ */

const beltStructuredDoc = (
  <StructuredPrDoc
    pr={{
      number: "PR-48630",
      status: "Structured · spec confirmation needed",
      createdBy: "PR Processing agent",
      createdOn: "2026-06-20 · 10:46",
      materialCode: "MRO-CONV-BELT-36IN-HD",
      description: "Conveyor Belt 36\" Heavy Duty Rubber — Sorting Line",
      plant: "Recycling facility · Sorting Line 2",
      costCenter: COST_CENTER,
      glAccount: GL,
      item: [
        { label: "Face width", value: "36 in (from \"35–36 in\")" },
        { label: "Material", value: "Rubber · heavy duty" },
        { label: "Quantity", value: "1 EA · 18 m roll" },
        { label: "UoM", value: "EA (roll)" },
        { label: "Delivery", value: "ASAP · production at risk" },
        { label: "Requisitioner", value: "Plant engineer · Sorting Line 2" },
      ],
      assignment: [
        { label: "Material group", value: "MRO · Conveyor & belting" },
        { label: "Suggested vendor", value: "Apex Industrial Supply (preferred)" },
      ],
      confidence: "86% · spec confirmation needed",
      flags: [
        "Free text gave a width range (35–36 in) and no part number — coded to 36 in face width; confirm against Sorting Line 2 before release to avoid a wrong-fit belt.",
        "Requester said \"previously Apex but not sure\" — vendor and part unconfirmed.",
      ],
    }}
  />
);

const beltFreeText = (
  <EmailDoc
    from="Plant engineer · Sorting Line 2"
    fromAddr="engineer@northgatepaper.com"
    to="Procurement intake"
    sent="2026-06-20 · 10:40"
    subject="New conveyor belt — recycling line 2"
    lines={[
      "Requesting a new conveyor belt for recycling line 2. The existing belt is damaged and causing material jams.",
      "Specs: around 35–36 inch wide, rubber, heavy duty. Previously sourced from Apex but not sure of the part number.",
      "Need ASAP to avoid production impact.",
    ]}
  />
);

const beltMasterDataDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48630-MD",
      status: "1 flag",
      docType: "Master data · duplicate · inventory",
      system: "Material master · inventory",
      createdBy: "Master Data agent",
      createdOn: "2026-06-20 · 10:48",
      sections: [
        {
          band: "Master data & duplicate",
          rows: [
            { label: "Material code", expected: "Mapped SKU", found: "MRO-CONV-BELT-36IN-HD", ok: true },
            { label: "Duplicate request", expected: "None open", found: "No open PR for this SKU", ok: true },
            { label: "Spec completeness", expected: "Single width + part no.", found: "Width range · no part no.", ok: false },
          ],
        },
        {
          band: "Inventory & interplant",
          rows: [
            { label: "On-hand stock", expected: "Check before buy", found: "0 EA · no stock", ok: true },
            { label: "Interplant availability", expected: "Check sister plants", found: "None · belt is line-specific", ok: true },
          ],
        },
      ],
      verdict: { ok: false, text: "Buy is justified, but the width is ambiguous — confirm 36 in face width for Sorting Line 2 before release." },
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
            { label: "Equipment in OEM warranty", expected: "Within 12 mo parts", found: "No · belt is a wear part", ok: true },
            { label: "Failure type", expected: "Defect vs wear", found: "Wear & tear · jams from damage", ok: true },
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
      status: "Ready · 1 open item",
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
            { label: "Spec sign-off", expected: "Engineer confirms width", found: "Pending · 36 in to confirm", ok: false },
          ],
        },
      ],
      verdict: { ok: false, text: "Everything clears except the width — confirm 36 in with the engineer, then release the PR." },
    }}
  />
);

/* ════════════════════════════════════════════════════════════════════════
 * Example 2 — Idler roller · duplicate demand · stock · warranty cover
 * ════════════════════════════════════════════════════════════════════════ */

const rollerStructuredDoc = (
  <StructuredPrDoc
    pr={{
      number: "PR-48655",
      status: "Structured · cheaper alternative found",
      createdBy: "PR Processing agent",
      createdOn: "2026-06-20 · 11:10",
      materialCode: "MRO-CONV-ROLLER-IDLER-STD",
      description: "Conveyor Idler Roller — 600 mm — Steel — Heavy Duty",
      plant: "Recycling facility · Sorting Line 1",
      costCenter: COST_CENTER,
      glAccount: GL,
      item: [
        { label: "Size", value: "600 mm · steel · heavy duty" },
        { label: "Quantity", value: "8 EA (from \"6–8\")" },
        { label: "UoM", value: "EACH" },
        { label: "Same as", value: "OCC feed conveyor rollers" },
        { label: "Delivery", value: "Urgent · belt misalignment" },
        { label: "Requisitioner", value: "Plant engineer · Sorting Line 1" },
      ],
      assignment: [
        { label: "Material group", value: "MRO · Conveyor & rollers" },
        { label: "Suggested vendor", value: "Apex Industrial Supply (preferred)" },
      ],
      confidence: "94%",
      flags: [
        "Requested 8 EA, but inventory and warranty checks below change the recommended buy quantity — see the validation report.",
      ],
    }}
  />
);

const rollerFreeText = (
  <EmailDoc
    from="Plant engineer · Sorting Line 1"
    fromAddr="engineer@northgatepaper.com"
    to="Procurement intake"
    sent="2026-06-20 · 11:04"
    subject="Replacement conveyor rollers — sorting line 1"
    lines={[
      "Need replacement conveyor rollers for sorting line 1. Multiple rollers seized and causing belt misalignment.",
      "Approx 6–8 rollers required. Same as currently installed on the OCC feed conveyor.",
      "Urgent to avoid further breakdown.",
    ]}
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
            { label: "Material code", expected: "Mapped SKU", found: "MRO-CONV-ROLLER-IDLER-STD", ok: true },
            { label: "Duplicate request", expected: "None open", found: "PR-48641 · same SKU · 4 days ago", ok: false },
          ],
        },
        {
          band: "Inventory & interplant",
          rows: [
            { label: "On-hand stock", expected: "Check before buy", found: "0 EA at this plant", ok: true },
            { label: "Interplant availability", expected: "Check sister plants", found: "6 EA at Eastbrook mill store", ok: false },
          ],
        },
      ],
      verdict: { ok: false, text: "Duplicate open PR and 6 EA available at a sister plant — transfer before buying, and cancel PR-48641." },
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
            { label: "Failure type", expected: "Defect vs wear", found: "Premature seizure · possible defect", ok: false },
            { label: "Coverage", expected: "Parts / labor / full", found: "12 mo parts · ConveyorCore OEM", ok: true },
          ],
        },
      ],
      verdict: { ok: false, text: "OCC feed conveyor is inside its 12-month parts warranty — raise a claim on the seized units rather than buying them." },
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
            { label: "Price vs contract", expected: "Match contract", found: "$118 / EA · matches SA-MRO-07", ok: true },
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
            { label: "Interplant transfer", expected: "Use available stock", found: "6 EA from Eastbrook mill", ok: true },
            { label: "Warranty claim", expected: "Claim covered defects", found: "Seized units · ConveyorCore", ok: true },
            { label: "Residual buy", expected: "Only the shortfall", found: "2 EA · Apex · $236", ok: true },
            { label: "Cancel duplicate", expected: "Close PR-48641", found: "Cancellation drafted", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Re-scoped from an 8-unit buy to a 6-unit transfer + warranty claim + 2-unit buy — duplicate PR cancelled." },
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
  reasoning: string[];
  docLabel: string;
  document: React.ReactNode;
  sources: RunStep["sources"];
  recommendation: string;
  stages?: RunStep["stages"];
  email?: RunStep["email"];
};

const step = (s: StepSpec): RunStep => s;

/* ── Example 1 · conveyor belt — 5 steps ───────────────────────────────────── */

export const beltPrSteps: RunStep[] = [
  step({
    id: "intake",
    agentName: "PR Processing agent",
    n: 1,
    title: "Structure & code the request",
    sub: "Turns the free-text note into a coded PR",
    reasoning: [
      "Reading the engineer's free-text note from Sorting Line 2",
      "Extracting specs — ~35–36 in, rubber, heavy duty",
      "Mapping to material code MRO-CONV-BELT-36IN-HD",
      "Coding cost center 10034 · GL 600450",
      "Flagging the width range and missing part number",
    ],
    docLabel: "PR-48630 · structured requisition",
    document: beltStructuredDoc,
    sources: [
      { id: "belt-freetext", label: "Free-text PR", meta: "Intake portal · 10:40", kind: "email", body: beltFreeText },
    ],
    recommendation:
      "Structured and coded to MRO-CONV-BELT-36IN-HD. One open item — the engineer gave a 35–36 in range with no part number, so the width is unconfirmed. Drafted clean, routed for the checks.",
    stages: [
      {
        sourceId: "belt-freetext",
        reasoning: "Extracting specs from the free-text note",
        title: "Item — what's needed",
        fields: [
          { label: "Material", value: "Conveyor belt · rubber · HD" },
          { label: "Face width", value: "36 in (from \"35–36 in\")" },
          { label: "Quantity", value: "1 EA · 18 m roll" },
          { label: "Plant", value: "Recycling · Sorting Line 2" },
        ],
      },
      {
        sourceId: "belt-freetext",
        reasoning: "Coding the account assignment",
        title: "Account assignment",
        fields: [
          { label: "Material code", value: "MRO-CONV-BELT-36IN-HD" },
          { label: "Cost center", value: COST_CENTER },
          { label: "G/L account", value: GL },
          { label: "Confidence", value: "86% · confirm width" },
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
    reasoning: [
      "Reading structured PR-48630",
      "Confirming the mapped material code",
      "Scanning open PRs for a duplicate — none found",
      "Checking on-hand and interplant stock — none",
      "Flagging the ambiguous width for sign-off",
    ],
    docLabel: "VAL-48630-MD · master data",
    document: beltMasterDataDoc,
    sources: [
      { id: "belt-pr-handoff", label: "PR-48630", meta: "from PR Processing", kind: "sap", handoff: true, body: beltStructuredDoc },
    ],
    recommendation:
      "Code is clean, no duplicate, no stock to draw from — the buy is justified. The only flag is the width range; confirm 36 in before release.",
  }),
  step({
    id: "invoice",
    agentName: "Warranty & coverage desk",
    n: 3,
    title: "Warranty & coverage",
    sub: "Confirms it's a buy, not a claim",
    reasoning: [
      "Checking the conveyor's OEM warranty status",
      "Belt is a wear part — not covered equipment",
      "Failure is wear & tear, not a covered defect",
      "Coverage — parts only, buy new",
    ],
    docLabel: "VAL-48630-WTY · warranty",
    document: beltWarrantyDoc,
    sources: [
      { id: "belt-md-handoff", label: "VAL-48630-MD", meta: "from Master Data", kind: "sap", handoff: true, body: beltMasterDataDoc },
    ],
    recommendation: "Wear-and-tear on a wear part — no warranty claim applies. Proceed as a new-buy.",
  }),
  step({
    id: "sourcing",
    agentName: "Sourcing & contract agent",
    n: 4,
    title: "Vendor, contract & price",
    sub: "Validates vendor, agreement and price",
    reasoning: [
      "Confirming Apex Industrial Supply is approved & preferred",
      "Distributor route −19% vs the OEM",
      "Checking sourcing agreement SA-MRO-07",
      "Price $4,180 matches the contract · Net 30",
    ],
    docLabel: "VAL-48630-VEN · vendor & price",
    document: beltVendorDoc,
    sources: [
      { id: "belt-wty-handoff", label: "VAL-48630-WTY", meta: "from Warranty desk", kind: "sap", handoff: true, body: beltWarrantyDoc },
    ],
    recommendation: "Vendor approved, on-contract, price-matched at $4,180 — no off-contract leakage.",
  }),
  step({
    id: "orchestrator",
    agentName: "Approval & routing",
    n: 5,
    title: "Approval & routing",
    sub: "Cost center, DOA and the open spec item",
    reasoning: [
      "Confirming cost center 10034 / GL 600450",
      "On-contract — competitive bidding not required",
      "Within the plant-maintenance approval limit",
      "Holding for the engineer's width confirmation",
    ],
    docLabel: "VAL-48630-APR · approval",
    document: beltApprovalDoc,
    sources: [
      { id: "belt-ven-handoff", label: "VAL-48630-VEN", meta: "from Sourcing", kind: "sap", handoff: true, body: beltVendorDoc },
    ],
    email: {
      cta: "Send the spec confirmation",
      to: "Plant engineer · Sorting Line 2",
      subject: "PR-48630 — confirm belt face width before release",
      lines: [
        "I've structured and coded your request to MRO-CONV-BELT-36IN-HD, on-contract via Apex at $4,180, Net 30 — everything checks out except one item.",
        "You gave a 35–36 in width with no part number. I've coded it to a 36 in face width for Sorting Line 2; please confirm so we don't ship a wrong-fit belt that fails on install.",
        "Reply to confirm and I'll release the PR immediately.",
      ],
      toastTitle: "Width confirmed",
      toastBody: "The engineer confirmed 36 in for Sorting Line 2 — reply added to your sources.",
      reply: {
        from: "Plant engineer · Sorting Line 2",
        receivedMeta: "Outlook · 11:02",
        subject: "RE: PR-48630 — confirm belt face width",
        lines: ["Confirmed — 36 in face width is correct for Sorting Line 2. Please release."],
        source: {
          id: "belt-spec-ack",
          label: "Engineer confirmation",
          meta: "Outlook · 11:02",
          kind: "email",
          body: (
            <EmailDoc
              from="Plant engineer · Sorting Line 2"
              fromAddr="engineer@northgatepaper.com"
              to="Approval & routing"
              sent="2026-06-20 · 11:02"
              subject="RE: PR-48630 — confirm belt face width"
              tone="inbound"
              lines={["Confirmed — 36 in face width is correct for Sorting Line 2. Please release."]}
            />
          ),
        },
      },
    },
    recommendation:
      "Everything clears except the width. Send the engineer the spec confirmation; on their reply, release PR-48630 to Apex on-contract at $4,180.",
  }),
];

/* ── Example 2 · idler roller — 5 steps ────────────────────────────────────── */

export const rollerPrSteps: RunStep[] = [
  step({
    id: "intake",
    agentName: "PR Processing agent",
    n: 1,
    title: "Structure & code the request",
    sub: "Turns the free-text note into a coded PR",
    reasoning: [
      "Reading the engineer's free-text note from Sorting Line 1",
      "Extracting — 600 mm steel idler rollers, ~6–8 EA",
      "Mapping to material code MRO-CONV-ROLLER-IDLER-STD",
      "Coding cost center 10034 · GL 600450",
      "Noting it matches the OCC feed conveyor rollers",
    ],
    docLabel: "PR-48655 · structured requisition",
    document: rollerStructuredDoc,
    sources: [
      { id: "roller-freetext", label: "Free-text PR", meta: "Intake portal · 11:04", kind: "email", body: rollerFreeText },
    ],
    recommendation:
      "Structured and coded to MRO-CONV-ROLLER-IDLER-STD at 8 EA. Matches the OCC feed conveyor — the downstream checks will test whether all 8 should actually be bought.",
    stages: [
      {
        sourceId: "roller-freetext",
        reasoning: "Extracting specs from the free-text note",
        title: "Item — what's needed",
        fields: [
          { label: "Material", value: "Idler roller · 600 mm · steel" },
          { label: "Quantity", value: "8 EA (from \"6–8\")" },
          { label: "Plant", value: "Recycling · Sorting Line 1" },
          { label: "Same as", value: "OCC feed conveyor rollers" },
        ],
      },
      {
        sourceId: "roller-freetext",
        reasoning: "Coding the account assignment",
        title: "Account assignment",
        fields: [
          { label: "Material code", value: "MRO-CONV-ROLLER-IDLER-STD" },
          { label: "Cost center", value: COST_CENTER },
          { label: "G/L account", value: GL },
          { label: "Confidence", value: "94%" },
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
    reasoning: [
      "Reading structured PR-48655",
      "Scanning open PRs — found PR-48641 for the same SKU",
      "Checking on-hand stock — none at this plant",
      "Checking interplant — 6 EA at the Eastbrook mill store",
      "Flagging duplicate demand and available stock",
    ],
    docLabel: "VAL-48655-MD · master data",
    document: rollerMasterDataDoc,
    sources: [
      { id: "roller-pr-handoff", label: "PR-48655", meta: "from PR Processing", kind: "sap", handoff: true, body: rollerStructuredDoc },
    ],
    recommendation:
      "Two flags — a duplicate open PR (PR-48641) and 6 EA available at the Eastbrook mill store. Don't buy 8: transfer the 6 and cancel the duplicate.",
  }),
  step({
    id: "invoice",
    agentName: "Warranty & coverage desk",
    n: 3,
    title: "Warranty & coverage",
    sub: "Checks if the seizures are covered",
    reasoning: [
      "Reading the OCC feed conveyor's commissioning date",
      "Commissioned 2026-01-15 — inside the 12-month parts warranty",
      "Premature seizure — possible covered defect",
      "Coverage — parts, ConveyorCore OEM",
    ],
    docLabel: "VAL-48655-WTY · warranty",
    document: rollerWarrantyDoc,
    sources: [
      { id: "roller-md-handoff", label: "VAL-48655-MD", meta: "from Master Data", kind: "sap", handoff: true, body: rollerMasterDataDoc },
    ],
    recommendation:
      "The OCC feed conveyor is inside its 12-month parts warranty and the seizures look like a defect — raise a warranty claim on the covered units rather than buying them.",
  }),
  step({
    id: "sourcing",
    agentName: "Sourcing & contract agent",
    n: 4,
    title: "Vendor, contract & price",
    sub: "Prices only the residual buy",
    reasoning: [
      "Confirming Apex Industrial Supply is approved & preferred",
      "Distributor route −22% vs the OEM",
      "Checking sourcing agreement SA-MRO-07",
      "Pricing only the shortfall — $118 / EA · Net 30",
    ],
    docLabel: "VAL-48655-VEN · vendor & price",
    document: rollerVendorDoc,
    sources: [
      { id: "roller-wty-handoff", label: "VAL-48655-WTY", meta: "from Warranty desk", kind: "sap", handoff: true, body: rollerWarrantyDoc },
    ],
    recommendation:
      "If any units are bought, Apex is approved and on-contract at $118/EA — but transfer and warranty cover most of the demand, so price only the residual.",
  }),
  step({
    id: "orchestrator",
    agentName: "Approval & routing",
    n: 5,
    title: "Approval & routing",
    sub: "Re-scopes the buy and cancels the duplicate",
    reasoning: [
      "Confirming cost center 10034 / GL 600450",
      "Routing 6 EA as an interplant transfer from Northgate",
      "Raising a warranty claim on the seized units",
      "Re-scoping the buy to the 2 EA shortfall · cancelling PR-48641",
    ],
    docLabel: "VAL-48655-APR · approval",
    document: rollerApprovalDoc,
    sources: [
      { id: "roller-ven-handoff", label: "VAL-48655-VEN", meta: "from Sourcing", kind: "sap", handoff: true, body: rollerVendorDoc },
    ],
    email: {
      cta: "Send the re-scoped plan",
      to: "Plant engineer · Sorting Line 1",
      subject: "PR-48655 — re-scoped: transfer + warranty claim + 2-unit buy",
      lines: [
        "Before raising an 8-unit buy: 6 of these rollers are in stock at the Eastbrook mill store, and the OCC feed conveyor is inside its 12-month parts warranty — so the seizures should be a warranty claim, not a purchase.",
        "Plan: transfer 6 EA by interplant movement (here this week), raise a warranty claim with ConveyorCore on the seized units, and buy only the 2 EA shortfall from Apex on-contract ($236). I've also drafted a cancellation for the duplicate PR-48641.",
        "Reply to approve and I'll route the transfer, the claim and the 2-unit PR.",
      ],
      toastTitle: "Re-scoped plan approved",
      toastBody: "The engineer approved the transfer + claim + 2-unit buy — reply added to your sources.",
      reply: {
        from: "Plant engineer · Sorting Line 1",
        receivedMeta: "Outlook · 11:31",
        subject: "RE: PR-48655 — re-scoped plan",
        lines: ["Approved — transfer the 6, raise the claim, buy the 2. Thanks for catching the duplicate."],
        source: {
          id: "roller-plan-ack",
          label: "Engineer approval",
          meta: "Outlook · 11:31",
          kind: "email",
          body: (
            <EmailDoc
              from="Plant engineer · Sorting Line 1"
              fromAddr="engineer@northgatepaper.com"
              to="Approval & routing"
              sent="2026-06-20 · 11:31"
              subject="RE: PR-48655 — re-scoped plan"
              tone="inbound"
              lines={["Approved — transfer the 6, raise the claim, buy the 2. Thanks for catching the duplicate."]}
            />
          ),
        },
      },
    },
    recommendation:
      "Re-scope from an 8-unit buy to a 6-unit interplant transfer + a warranty claim + a 2-unit on-contract buy ($236), and cancel the duplicate PR-48641. Send the plan; on approval, route all three.",
  }),
];
