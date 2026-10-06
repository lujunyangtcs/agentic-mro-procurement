/**
 * The evidence behind each exception — real documents, opened 1:1.
 *
 * For every (requisition, reason) pair this returns the source files the agent
 * actually read, with the offending place marked in yellow and a one-line note
 * for the bubble that floats over the document. The hero cases reuse the very
 * documents the guided runs render (exported from prCases); the rest are built
 * from the requisition record itself, so nothing is retyped.
 */

import * as React from "react";
import {
  approvalRules,
  lineValue,
  usd,
  type ExceptionType,
  type Requisition,
} from "@/mro/data/procurement";
import { requisitionDoc } from "@/mro/lib/prDoc";
import { StructuredPrDoc } from "@/mro/components/docs/pr/PrDocs";
import { LookupSheetDoc } from "@/mro/components/docs/pr/LookupSheet";
import { OpenPrListDoc } from "@/mro/components/docs/pr/SapDocs";
import {
  beltFreeText,
  beltStructuredDoc,
  beltMaterialMaster,
  rollerOpenPrList,
  rollerInventorySheet,
  rollerWarrantyRecord,
} from "@/mro/data/prCases";

export type ExceptionSource = {
  id: string;
  /** File name shown on the detail rail. */
  label: string;
  /** Two-or-three-word name for the one-line rail row. */
  short: string;
  /** One line of provenance — system, language, time. */
  meta: string;
  /** The document itself, 1:1. */
  body: React.ReactNode;
  /** What the AI has to say about the marked place — the floating bubble. */
  note: string;
};

/** The structured requisition, built from the record, optionally marked. */
const structured = (r: Requisition, highlightLabel?: string): React.ReactNode => (
  <StructuredPrDoc pr={requisitionDoc(r)} highlightLabel={highlightLabel} />
);

export function sourcesFor(r: Requisition, type: ExceptionType): ExceptionSource[] {
  switch (type) {
    case "spec-incomplete":
      if (r.id === "PR-48630") {
        return [
          {
            id: "src-email",
            short: "Original email",
            label: "Original request — email",
            meta: "Intake portal · written in Deutsch · 10:40",
            body: React.cloneElement(beltFreeText, { highlight: "45–50 mm" }),
            note: "The engineer gave a range — 45 to 50 mm — and no part number. This is the gap holding release.",
          },
          {
            id: "src-pr",
          short: "Structured PR",
            label: `Structured requisition ${r.id}`,
            meta: "ME53N · coded by the PR Processing Agent",
            body: React.cloneElement(beltStructuredDoc, { highlightLabel: "Shaft diameter" }),
            note: "Coded to 50 mm from the range, flagged for the engineer to confirm before release.",
          },
          {
            id: "src-mm",
            short: "Material master",
            label: "Material master — MRO-SEAL-MECH-50MM-SIC",
            meta: "MM03 · material master record",
            body: beltMaterialMaster,
            note: "The 50 mm silicon-carbide seal is an active, stocked material. No 45 mm variant exists in the master.",
          },
        ];
      }
      return [
        {
          id: "src-pr",
          short: "Structured PR",
          label: `Structured requisition ${r.id}`,
          meta: "ME53N · coded by the PR Processing Agent",
          body: structured(r),
          note: "The specification is incomplete — the plant confirms before this is ordered.",
        },
      ];

    case "duplicate-demand": {
      if (r.id === "PR-48655") {
        return [
          {
            id: "src-pr",
          short: "Structured PR",
            label: `Structured requisition ${r.id}`,
            meta: "ME53N · coded by the PR Processing Agent",
            body: structured(r),
            note: "This request asks for 8 bags of the same grinding media.",
          },
          {
            id: "src-open",
            short: "Open PR list",
            label: "Open requisitions — ME5A list",
            meta: "Purchasing · open PRs · this plant",
            body: rollerOpenPrList,
            note: "PR-48641 already asks for the same media for Deburring Line 3. Releasing both buys it twice.",
          },
        ];
      }
      /* The hose duplicate — the open-PR list built from the record. */
      return [
        {
          id: "src-pr",
          short: "Structured PR",
          label: `Structured requisition ${r.id}`,
          meta: "ME53N · coded by the PR Processing Agent",
          body: structured(r),
          note: "This request duplicates demand already open for the same line.",
        },
        {
          id: "src-open",
            short: "Open PR list",
          label: "Open requisitions — ME5A list",
          meta: "Purchasing · open PRs · this plant",
          body: (
            <OpenPrListDoc
              l={{
                createdOn: `${r.raisedOn} · 11:04`,
                createdBy: "Master Data Agent",
                scope: `Open PRs · ${r.plant} · material group MRO · not yet released`,
                rows: [
                  { pr: "PR-48666", item: "10", material: r.material, qty: `4 ${r.uom}`, plant: `${r.plant} · ${r.line}`, created: "2026-06-17", tone: "dup" },
                  { pr: r.id, item: "10", material: r.material, qty: `${r.qty} ${r.uom}`, plant: `${r.plant} · ${r.line}`, created: r.raisedOn },
                  { pr: "PR-48669", item: "10", material: "MRO-CLAMP-2IN-SS", qty: "12 EA", plant: r.plant, created: "2026-06-18" },
                ],
                note: `PR-48666 already covers the same hose for ${r.line} — merge this request into it instead of buying twice.`,
              }}
            />
          ),
          note: "An earlier request for the same hose and the same line is already open.",
        },
      ];
    }

    case "stock-available":
      if (r.id === "PR-48655") {
        return [
          {
            id: "src-stock",
            short: "Stock sheet",
            label: "Stock on hand — network view",
            meta: "stock-on-hand.xlsx · all plants",
            body: rollerInventorySheet,
            note: "Clairmont already holds the surplus this request would buy — transfer it instead.",
          },
        ];
      }
      /* The filter-bag case — the network stock sheet built from the record. */
      return [
        {
          id: "src-stock",
            short: "Stock sheet",
          label: "Stock on hand — network view",
          meta: "stock-on-hand.xlsx · all plants",
          body: (
            <LookupSheetDoc
              sheets={[
                {
                  file: "stock-on-hand.xlsx",
                  tab: "MRO inventory · filtration",
                  columns: ["Plant", "Material", "On-hand", "Safety", "UoM"],
                  usedNote: "→ 60 on hand at Clairmont · transfer before buying",
                  rows: [
                    { cells: [`${r.plant}`, r.material, "0", "10", r.uom], matched: false },
                    { cells: ["Clairmont · Drives & Power", r.material, "60", "20", r.uom], flag: true },
                    { cells: ["Riomar · Assembly & Packaging", r.material, "12", "10", r.uom], matched: false },
                  ],
                },
              ]}
              footer={
                <>
                  Clairmont holds <strong>60 {r.uom}</strong> against a safety stock of 20 — more than
                  this request needs. An interplant transfer covers it without buying.
                </>
              }
            />
          ),
          note: `Clairmont's store already holds more than the ${r.qty} ${r.uom} requested — the network buys nothing.`,
        },
      ];

    case "warranty-covered":
      return [
        {
          id: "src-wty",
            short: "Warranty record",
          label: "Warranty record — WTY-CHK-48655",
          meta: "Equipment register · coverage check",
          body: rollerWarrantyRecord,
          note: "Inside the twelve-month parts warranty, and the failure reads as a defect — the supplier owes these.",
        },
      ];

    case "off-contract":
      return [
        {
          id: "src-pr",
          short: "Structured PR",
          label: `Structured requisition ${r.id}`,
          meta: "ME53N · coded by the PR Processing Agent",
          body: structured(r, "Supplier"),
          note: `${r.vendor} is not on the approved list — the field holding this request.`,
        },
        {
          id: "src-asl",
            short: "Approved suppliers",
          label: "Approved supplier list",
          meta: "approved-suppliers.xlsx · instrumentation",
          body: (
            <LookupSheetDoc
              sheets={[
                {
                  file: "approved-suppliers.xlsx",
                  tab: "MRO · by category",
                  columns: ["Supplier", "Category", "Agreement", "Standing"],
                  usedNote: "→ the requested supplier has no agreement",
                  rows: [
                    { cells: ["Apex Industrial Supply", "Seals · valves · filtration", "SA-MRO-07", "Approved"], matched: true },
                    { cells: ["ZirCore Materials", "Milling media", "SA-MRO-09", "Approved"], matched: false },
                    { cells: ["Drivetec Motion", "Motors and drives", "SA-MRO-11", "Approved"], matched: false },
                    { cells: [r.vendor, "Instrumentation", "—", "Not approved"], flag: true },
                  ],
                },
              ]}
              footer={
                <>
                  {r.vendor} holds no sourcing agreement. Buying {usd(lineValue(r), 0)} there sits
                  outside every negotiated price.
                </>
              }
            />
          ),
          note: `${r.vendor} sits outside the approved list — no agreement, no negotiated price.`,
        },
      ];

    case "over-threshold":
      return [
        {
          id: "src-pr",
          short: "Structured PR",
          label: `Structured requisition ${r.id}`,
          meta: "ME53N · coded by the PR Processing Agent",
          body: structured(r, "Total value"),
          note: `${usd(lineValue(r))} — the amount that pushes this past the plant's own limit.`,
        },
        {
          id: "src-doa",
            short: "Approval limits",
          label: "Approval limits — who signs what",
          meta: "approval-limits.xlsx · delegation of authority",
          body: (
            <LookupSheetDoc
              sheets={[
                {
                  file: "approval-limits.xlsx",
                  tab: "Delegation of authority",
                  columns: ["Sign-off", "Limit", "Scope"],
                  usedNote: `→ ${usd(lineValue(r), 0)} is past the plant limit`,
                  rows: approvalRules.map((rule, i) => ({
                    cells: [
                      rule.routesTo,
                      rule.limit > 0 ? usd(rule.limit, 0) : "Any amount",
                      rule.trigger,
                    ],
                    flag: i === 0,
                  })),
                },
              ]}
              footer={
                <>
                  At {usd(lineValue(r))} this request is past the plant lead's{" "}
                  {usd(approvalRules[0].limit, 0)} limit — it signs one level up.
                </>
              }
            />
          ),
          note: `The plant lead signs up to ${usd(approvalRules[0].limit, 0)}. This request is ${usd(lineValue(r))}.`,
        },
      ];
  }
}
