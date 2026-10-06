/**
 * Per-flow scripted scenarios — the steps each workspace plays through.
 * Step copy is the source of truth for the timeline and the run-progress
 * panel. The hero "belt" flow is a production-critical MRO spot-buy that
 * routes to a human because it sits above the touchless threshold.
 */

import type { DocId, FlowId } from "@/state";

/**
 * Who is accountable for a step. Named agents render as the soft chip;
 * the orchestrator, supervisor and the human buyer render as the dark
 * "accountable" chip in the timeline.
 */
export type Actor =
  | "Intake agent"
  | "Sourcing agent"
  | "PO agent"
  | "Fulfillment agent"
  | "Invoice agent"
  | "Orchestrator"
  | "Buyer";

/** Actors that are people or control points, not autonomous agents. */
export const CONTROL_ACTORS: Actor[] = ["Orchestrator", "Buyer"];

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
  contextTitle: "Corrugator No.2 · double-backer belt",
  contextSub: "Maintenance flagged a worn belt at 9:01 AM · production-critical",
  statusPill: "Awaiting your approval",
  alert: {
    title: "Containerboard mill · Corrugator No.2 double-backer belt nearing failure",
    sub: "Spot-buy of a maintenance part · on-contract supplier preferred · order value above the touchless limit, so it comes to you with a recommendation",
  },
  steps: [
    {
      title: "Structure the request",
      actor: "Intake agent",
      detail:
        "Turned the maintenance note into a clean purchase requisition · matched the belt to a catalog part · confidence 98%.",
      time: "9:02 AM",
    },
    {
      title: "Run the spot-buy tender",
      actor: "Sourcing agent",
      detail:
        "Invited three qualified suppliers · compared price, lead time and freight · recommended the on-contract supplier.",
      time: "9:08 AM",
    },
    {
      title: "Draft the purchase order",
      actor: "PO agent",
      detail:
        "Drafted the order against the framework contract · checked the open maintenance budget · priced freight to the mill · the value sits above the touchless limit, so it routes to a person.",
      time: "9:11 AM",
    },
    {
      title: "Clear the control checks",
      actor: "Orchestrator",
      detail:
        "Ran the do-not-execute envelope — policy, contract, budget, duplicate-supplier and approval-limit checks all clear · held for your approval because it is over the limit.",
      time: "9:12 AM",
    },
    {
      title: "Your approval",
      actor: "Buyer",
      detail: "One card with the recommended supplier, price and savings. Approve to issue the order.",
      time: "now",
    },
    {
      title: "Issue the order and receive the belt",
      actor: "Fulfillment agent",
      detail:
        "Post the order to SAP, confirm with the supplier, track the shipment and book the goods receipt at the mill dock.",
      time: "—",
    },
    {
      title: "Match the invoice",
      actor: "Invoice agent",
      detail:
        "Three-way match the supplier invoice to the order and the goods receipt · amounts tie out · within tolerance · the payment hold clears itself.",
      time: "—",
    },
    {
      title: "Release to AP and close",
      actor: "Orchestrator",
      detail:
        "Clean match within tolerance, so payment releases to AP on the net terms · the orchestrator closes the audit envelope with every artifact attached.",
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
