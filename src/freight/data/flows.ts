/**
 * Per-flow scripted scenarios — the steps each workspace plays through.
 * Step copy is the source of truth for the timeline and the run-progress
 * panel. The hero "belt" flow is the inbound OCC live-load freight settlement
 * that routes to a human because the three-way check found demurrage, a
 * surcharge mismatch and a cube-out weight variance above tolerance.
 *
 * NOTE: the flow id "belt" is inherited from the procure-to-pay base and never
 * renders — it is the hero OCC settlement run here.
 */

import type { DocId, FlowId } from "@/freight/state";

/**
 * Who is accountable for a step. Named agents render as the soft chip;
 * the router and the human approver render as the dark "accountable" chip.
 */
export type Actor =
  | "Lane Intake agent"
  | "Rate & Surcharge agent"
  | "Carrier Tender agent"
  | "Load Capture agent"
  | "Settlement agent"
  | "Router"
  | "Approver";

/** Actors that are people or control points, not autonomous agents. */
export const CONTROL_ACTORS: Actor[] = ["Router", "Approver"];

export type FlowStep = {
  /** Short title shown on the timeline node. */
  title: string;
  actor: Actor;
  /** Body shown under the title on the timeline node. */
  detail: string;
  /** Mock timestamp shown on the right of the timeline node. */
  time: string;
};

export type FlowDef = {
  id: FlowId;
  /** Topbar context line in the workspace. */
  contextTitle: string;
  contextSub: string;
  statusPill: string;
  alert: {
    title: string;
    sub: string;
  };
  steps: FlowStep[];
};

export const beltFlow: FlowDef = {
  id: "belt",
  contextTitle: "Riverside mill · inbound OCC live load · lane CHI→RIV",
  contextSub: "Carrier freight invoice arrived at 9:01 AM · three-way check found exceptions",
  statusPill: "Awaiting your approval",
  alert: {
    title: "OCC haul invoice $14,380 — demurrage, surcharge mismatch and cube-out variance flagged",
    sub: "In-tolerance lines cleared touchless · three lines are above tolerance, so the settlement comes to you with a recommended dispute and a drafted carrier note",
  },
  steps: [
    {
      title: "Classify the lane",
      actor: "Lane Intake agent",
      detail:
        "Read the pickup requirement, matched lane CHI→RIV and classified it as an OCC live load on an approved movement pattern · confidence 98%.",
      time: "9:02 AM",
    },
    {
      title: "Validate rate & surcharge",
      actor: "Rate & Surcharge agent",
      detail:
        "Checked the line haul against the contracted lane rate and normalised the fuel surcharge · base rate on-contract · the billed surcharge is a flat fee vs the contracted percentage.",
      time: "9:08 AM",
    },
    {
      title: "Confirm the carrier & load",
      actor: "Carrier Tender agent",
      detail:
        "Confirmed the load tendered to the approved carrier · pulled the BOL, pickup confirmation and weigh-bridge ticket into one packet.",
      time: "9:10 AM",
    },
    {
      title: "Reconcile the weight",
      actor: "Load Capture agent",
      detail:
        "Compared estimated vs scaled weight · the load cubed out 2 tonnes light, so the per-tonne billing overstates the haul · variance above tolerance.",
      time: "9:11 AM",
    },
    {
      title: "Run the three-way check",
      actor: "Settlement agent",
      detail:
        "Matched the invoice line-by-line to the shipment (SAP) and the contract (Excel) · cleared the in-tolerance lines · flagged demurrage, the surcharge mismatch and the cube-out variance.",
      time: "9:12 AM",
    },
    {
      title: "Clear the control checks",
      actor: "Router",
      detail:
        "Ran the settlement envelope — duplicate-booking, company-code, PO-value and tolerance checks · clean except the three flagged lines · held for your approval.",
      time: "9:13 AM",
    },
    {
      title: "Your approval",
      actor: "Approver",
      detail: "One card with the recommended dispute, the recoverable amount and a drafted carrier note. Approve to settle the clean lines and send the dispute.",
      time: "now",
    },
    {
      title: "Settle and post",
      actor: "Router",
      detail:
        "Post the cleared lines to SAP on the net terms, send the dispute for the three exception lines, and close the audit envelope with every artifact attached.",
      time: "—",
    },
  ],
};

export const flowsById: Partial<Record<FlowId, FlowDef>> = {
  belt: beltFlow,
};

/** Documents linked from each workspace's decision card. */
export const docLinksByFlow: Partial<Record<FlowId, DocId[]>> = {
  belt: ["purchase-req", "bid-comparison", "draft-po", "envelope-report"],
};
