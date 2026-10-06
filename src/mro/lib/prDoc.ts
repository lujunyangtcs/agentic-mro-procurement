/**
 * Builds the displayed purchase requisition from the record itself, so the
 * document and every table row that quotes it can never disagree about a
 * number. Shared by the requisition worklist and the exception board.
 */

import {
  exceptionMeta,
  lineValue,
  usd,
  PR_STATUS_LABEL,
  type Requisition,
} from "@/mro/data/procurement";
import type { StructuredPr } from "@/mro/components/docs/pr/PrDocs";

export function requisitionDoc(r: Requisition): StructuredPr {
  const held = r.status === "held";
  return {
    number: r.id,
    status: held
      ? `Held · ${r.exceptions.map((e) => exceptionMeta[e].label.toLowerCase()).join(" · ")}`
      : PR_STATUS_LABEL[r.status],
    createdBy: "PR Processing Agent",
    createdOn: `${r.raisedOn} · 10:46`,
    materialCode: r.material,
    description: r.description,
    plant: `${r.plant} · ${r.line}`,
    costCenter: r.costCenter,
    glAccount: r.glAccount,
    item: [
      { label: "Quantity", value: `${r.qty} ${r.uom}` },
      { label: "Unit of measure", value: r.uom },
      { label: "Requested by", value: r.requestor },
      { label: "Raised on", value: r.raisedOn },
    ],
    assignment: [
      { label: "Cost centre", value: r.costCenter },
      { label: "General ledger account", value: r.glAccount },
      { label: "Suggested supplier", value: r.vendor },
    ],
    confidence: held ? "Held for your decision" : "Validated by the workforce",
    flags: r.note ? [r.note] : undefined,
    prType: "NB · Standard requisition",
    requestor: r.requestor,
    purchOrg: "1000 · Orvantec Procurement",
    purchGroup: "200 · Maintenance and operations",
    valuation: [
      { label: "Unit price", value: `${usd(r.unitPrice)} / ${r.uom}` },
      { label: "Total value", value: usd(lineValue(r)) },
      { label: "Currency", value: "USD" },
    ],
    sourceOfSupply: r.agreement
      ? [
          { label: "Supplier", value: r.vendor },
          { label: "Sourcing agreement", value: r.agreement },
        ]
      : [{ label: "Supplier", value: `${r.vendor} · not on the approved list` }],
  };
}
